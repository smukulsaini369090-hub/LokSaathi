/**
 * Zero-Card Multi-Provider Server Fallback Client for LokSaathi.
 * Executes strictly on the server at ₹0 billing risk:
 *   1. Cloudflare Workers AI (10,000 Neurons/day free, non-training guarantee)
 *   2. Groq Free Plan (~30 RPM / 1,000 RPD hard cap)
 * Every outbound citizen message and history snippet passes through `scrubCitizenPII()`
 * before leaving the server.
 */
import { redactSecrets, scrubCitizenPII } from "@/lib/security";

export const ZERO_CARD_CHAT_TIMEOUT_MS = 3200;
export const ZERO_CARD_MEDIA_TIMEOUT_MS = 6500;

export function isValidProviderSecret(raw: string | undefined): boolean {
  const clean = (raw || "").replace(/^["']|["']$/g, "").trim();
  if (!clean) return false;
  if (
    clean === "dummy-key-for-test" ||
    clean === "mock-token" ||
    clean.startsWith("your_") ||
    clean.startsWith("replace_")
  ) {
    return false;
  }
  return true;
}

export function cleanJsonResponse(rawText: string): string {
  let cleaned = (rawText || "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```$/, "");
  }
  return cleaned.trim();
}

export type ChatMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

interface OpenAICompatRequest {
  providerName: "cloudflare" | "groq";
  endpoint: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: "system" | "user"; content: ChatMessageContent }>;
  timeoutMs: number;
  useJsonMode?: boolean;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAICompatibleJson(req: OpenAICompatRequest): Promise<any | null> {
  const bodyObj: Record<string, unknown> = {
    model: req.model,
    messages: req.messages,
    temperature: 0.2,
  };
  if (req.useJsonMode !== false) {
    bodyObj.response_format = { type: "json_object" };
  }

  const res = await fetchWithTimeout(
    req.endpoint,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${req.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyObj),
    },
    req.timeoutMs
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`${req.providerName} ${res.status}: ${errText.slice(0, 120)}`);
  }

  const data = await res.json();
  const rawContent =
    data?.choices?.[0]?.message?.content ??
    data?.result?.response ??
    "";

  if (typeof rawContent === "object" && rawContent !== null) {
    return rawContent;
  }
  if (typeof rawContent !== "string" || !rawContent.trim()) {
    throw new Error(`${req.providerName} returned empty content`);
  }

  return JSON.parse(cleanJsonResponse(rawContent));
}

function getZeroCardProvidersConfig() {
  const cfAccountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").replace(/^["']|["']$/g, "").trim();
  const cfToken = (process.env.CLOUDFLARE_API_TOKEN || "").replace(/^["']|["']$/g, "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").replace(/^["']|["']$/g, "").trim();

  return {
    hasCloudflare: isValidProviderSecret(cfAccountId) && isValidProviderSecret(cfToken),
    cfAccountId,
    cfToken,
    hasGroq: isValidProviderSecret(groqKey),
    groqKey,
  };
}

/**
 * Queries Cloudflare Workers AI -> Groq Free Plan in strict zero-card order.
 * Returns parsed JSON object or null if neither provider succeeds.
 */
export async function invokeZeroCardChatCascade(params: {
  systemInstruction: string;
  userPrompt: string;
  imageDataUrl?: string;
}): Promise<{ data: any; provider: "cloudflare" | "groq" } | null> {
  const { hasCloudflare, cfAccountId, cfToken, hasGroq, groqKey } = getZeroCardProvidersConfig();
  if (!hasCloudflare && !hasGroq) return null;

  // Apply DPDP PII Firewall to prompt before any outbound request
  const safeSystem = scrubCitizenPII(params.systemInstruction);
  const safePrompt = scrubCitizenPII(params.userPrompt);

  const userContent: ChatMessageContent = params.imageDataUrl
    ? [
        { type: "text", text: safePrompt },
        { type: "image_url", image_url: { url: params.imageDataUrl } },
      ]
    : safePrompt;

  const messages: Array<{ role: "system" | "user"; content: ChatMessageContent }> = [
    { role: "system", content: safeSystem },
    { role: "user", content: userContent },
  ];

  const isVision = Boolean(params.imageDataUrl);
  const timeoutMs = isVision ? ZERO_CARD_MEDIA_TIMEOUT_MS : ZERO_CARD_CHAT_TIMEOUT_MS;

  if (hasCloudflare) {
    try {
      const cfModel = isVision
        ? process.env.CLOUDFLARE_VISION_MODEL?.trim() || "@cf/meta/llama-3.2-11b-vision-instruct"
        : process.env.CLOUDFLARE_AI_MODEL?.trim() || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
      const parsed = await callOpenAICompatibleJson({
        providerName: "cloudflare",
        endpoint: `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/v1/chat/completions`,
        apiKey: cfToken,
        model: cfModel,
        messages,
        timeoutMs,
        useJsonMode: !isVision,
      });
      if (parsed && typeof parsed === "object") {
        return { data: parsed, provider: "cloudflare" };
      }
    } catch (err) {
      console.warn("Cloudflare Workers AI fallback failed, trying next provider:", redactSecrets(err));
    }
  }

  if (hasGroq) {
    try {
      const groqModel = isVision
        ? process.env.GROQ_VISION_MODEL?.trim() || "meta-llama/llama-4-scout-17b-16e-instruct"
        : process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
      const parsed = await callOpenAICompatibleJson({
        providerName: "groq",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: groqKey,
        model: groqModel,
        messages,
        timeoutMs,
      });
      if (parsed && typeof parsed === "object") {
        return { data: parsed, provider: "groq" };
      }
    } catch (err) {
      console.warn("Groq fallback failed, trying next provider:", redactSecrets(err));
    }
  }

  return null;
}

/**
 * Transcribes citizen voice audio via Groq Whisper or Cloudflare Whisper when configured.
 */
export async function transcribeAudioViaZeroCard(
  cleanAudioBase64: string,
  mimeType: string,
  language: "hi" | "en"
): Promise<string | null> {
  const { hasCloudflare, cfAccountId, cfToken, hasGroq, groqKey } = getZeroCardProvidersConfig();
  if (!hasCloudflare && !hasGroq) return null;

  let binaryBytes: Uint8Array;
  try {
    binaryBytes =
      typeof Buffer !== "undefined"
        ? new Uint8Array(Buffer.from(cleanAudioBase64, "base64"))
        : Uint8Array.from(atob(cleanAudioBase64), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }

  // Prefer Cloudflare Workers AI first (consistent zero-card priority order)
  if (hasCloudflare) {
    try {
      const res = await fetchWithTimeout(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/openai/whisper`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfToken}`,
            "Content-Type": "application/octet-stream",
          },
          body: binaryBytes as unknown as BodyInit,
        },
        ZERO_CARD_MEDIA_TIMEOUT_MS
      );
      if (res.ok) {
        const json = await res.json();
        const text = (json?.result?.text || "").trim();
        if (text) return scrubCitizenPII(text);
      }
    } catch (err) {
      console.warn("Cloudflare Whisper audio fallback failed:", redactSecrets(err));
    }
  }

  if (hasGroq) {
    try {
      const formData = new FormData();
      const audioBlob = new Blob([binaryBytes as unknown as BlobPart], {
        type: mimeType || "audio/wav",
      });
      formData.append("file", audioBlob, "voice.wav");
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("language", language === "hi" ? "hi" : "en");

      const res = await fetchWithTimeout(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: formData,
        },
        ZERO_CARD_MEDIA_TIMEOUT_MS
      );
      if (res.ok) {
        const json = await res.json();
        const text = (json?.text || "").trim();
        if (text) return scrubCitizenPII(text);
      }
    } catch (err) {
      console.warn("Groq Whisper audio fallback failed:", redactSecrets(err));
    }
  }

  return null;
}

export function getConfiguredZeroCardStatus() {
  const { hasCloudflare, hasGroq } = getZeroCardProvidersConfig();
  return { cloudflare: hasCloudflare, groq: hasGroq };
}
