/**
 * Server-only Gemini client for LokSaathi.
 * This module should NEVER be imported into Client Components.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { UserProfile, SchemeMatch } from "@/lib/scheme-matcher";

export interface DocExplanation {
  document_type: string;
  summary: string;
  key_fields: Array<{ label: string; value: string; importance: "critical" | "normal" }>;
  action_items: Array<{ task: string; deadline?: string; urgency: "high" | "medium" | "low" }>;
  warnings: string[];
  full_explanation: string;
}

let geminiClient: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY || "dummy-key-for-test";
  geminiClient = new GoogleGenerativeAI(apiKey);
  return geminiClient;
}

function loadPrompt(filename: string): string {
  try {
    const path = join(process.cwd(), "data/prompts", filename);
    if (existsSync(path)) {
      return readFileSync(path, "utf-8");
    }
  } catch (err) {
    console.warn(`Could not load prompt file ${filename}, using default.`);
  }
  return "";
}

function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```$/, "");
  }
  return cleaned.trim();
}

export async function extractUserProfile(
  transcript: string,
  history: Array<{ role: "user" | "model"; text: string }>,
  language: "hi" | "en" = "hi"
): Promise<{
  profile_updates: Partial<UserProfile>;
  next_question: string;
  is_complete: boolean;
}> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemInstruction = loadPrompt("scheme-system.txt");

  const conversationContext = history
    .map((msg) => `${msg.role === "user" ? "Citizen" : "LokSaathi"}: ${msg.text}`)
    .join("\n");

  const prompt = `${systemInstruction}

Conversation Language: ${language === "hi" ? "Hindi (Devanagari/Hinglish)" : "English"}

Previous conversation:
${conversationContext || "None"}

Citizen's latest input:
"${transcript}"

Extract profile updates and ask the next question in ${language === "hi" ? "Hindi" : "English"}:`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = cleanJsonResponse(text);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse Gemini JSON for profile extraction:", text);
    return {
      profile_updates: {},
      next_question:
        language === "hi"
          ? "माफ़ कीजिए, मैं समझ नहीं पाया। क्या आप दोबारा बता सकते हैं?"
          : "Sorry, I could not understand. Could you please repeat that?",
      is_complete: false,
    };
  }
}

export async function explainDocument(
  imageBase64: string,
  language: "hi" | "en" = "hi"
): Promise<DocExplanation> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemInstruction = loadPrompt("doc-system.txt");

  const prompt = `${systemInstruction}

Target Language for explanation: ${language === "hi" ? "Hindi (हिंदी)" : "English"}

Analyze the attached document and produce the structured JSON response:`;

  const mimeType = imageBase64.startsWith("/9j/") ? "image/jpeg" : "image/png";

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType,
      },
    },
  ]);

  const text = result.response.text();
  const cleaned = cleanJsonResponse(text);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse Gemini doc explanation JSON:", text);
    return {
      document_type: language === "hi" ? "दस्तावेज़" : "Document",
      summary:
        language === "hi"
          ? "दस्तावेज़ की जानकारी सफलतापूर्वक नहीं पढ़ी जा सकी। कृपया साफ फोटो दोबारा अपलोड करें।"
          : "Could not clearly read the document details. Please upload a clearer photo.",
      key_fields: [],
      action_items: [],
      warnings: [
        language === "hi"
          ? "फोटो धुंधली या अपठनीय हो सकती है। बेहतर रोशनी में पुनः प्रयास करें।"
          : "Image might be blurry or illegible. Please try again with better lighting.",
      ],
      full_explanation: text,
    };
  }
}

export async function* generateSchemeExplanation(
  matches: SchemeMatch[],
  profile: Partial<UserProfile>,
  language: "hi" | "en" = "hi"
): AsyncGenerator<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const schemeSummaries = matches
    .map(
      (m, idx) =>
        `${idx + 1}. ${language === "hi" ? m.scheme.name.hi : m.scheme.name.en}: ${
          language === "hi" ? m.scheme.benefit.summary_hi : m.scheme.benefit.summary_en
        } (पात्रता कारण: ${language === "hi" ? m.match_reason_hi : m.match_reason_en})`
    )
    .join("\n");

  const prompt = `You are LokSaathi. Explain to the citizen in warm, reassuring ${
    language === "hi" ? "Hindi (हिंदी)" : "English"
  } which government schemes they qualify for, how much money/benefit they will receive, and the exact next steps they should take.

Citizen Profile:
State: ${profile.state || "Not specified"}
Age: ${profile.age || "Not specified"}
Occupation: ${profile.occupation?.join(", ") || "Not specified"}
Annual Income: ₹${profile.annual_income_inr || "Not specified"}

Matched Schemes:
${schemeSummaries}

Keep it encouraging, clear, and direct. Break down the steps simply.`;

  const responseStream = await model.generateContentStream(prompt);

  for await (const chunk of responseStream.stream) {
    yield chunk.text();
  }
}
