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

export function getModelName(): string {
  const model = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").replace(/^["']|["']$/g, "").trim();
  return model || "gemini-3.5-flash-lite";
}

export function getGeminiClient(customApiKey?: string): GoogleGenerativeAI {
  const cleanCustom = customApiKey?.replace(/^["']|["']$/g, "").trim();
  if (cleanCustom && cleanCustom !== "dummy-key-for-test") {
    return new GoogleGenerativeAI(cleanCustom);
  }
  if (geminiClient) return geminiClient;
  const rawKey = (process.env.GEMINI_API_KEY || "dummy-key-for-test").replace(/^["']|["']$/g, "").trim();
  geminiClient = new GoogleGenerativeAI(rawKey || "dummy-key-for-test");
  return geminiClient;
}

const FALLBACK_SCHEME_PROMPT = `You are LokSaathi (लोकसाथी), India's premier, empathetic civic companion for government welfare schemes.
Extract citizen profile details (state, age, gender, occupation, annual_income_inr, category).
Always provide warm acknowledgment, the single next relevant question, and 3-5 dynamic suggested_chips in the specified conversation language.`;

function loadPrompt(filename: string): string {
  try {
    const path = join(process.cwd(), "data/prompts", filename);
    if (existsSync(path)) {
      return readFileSync(path, "utf-8");
    }
  } catch (err) {
    console.warn(`Could not load prompt file ${filename}, using default.`);
  }
  return FALLBACK_SCHEME_PROMPT;
}

function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
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

export interface ProfileExtractionResult {
  profile_updates: Partial<UserProfile>;
  acknowledgment?: string;
  next_question: string;
  suggested_chips?: string[];
  is_complete: boolean;
}

export async function extractUserProfile(
  transcript: string,
  history: Array<{ role: "user" | "model"; text: string }>,
  language: "hi" | "en" = "hi",
  customApiKey?: string
): Promise<ProfileExtractionResult> {
  const effectiveKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  const hasValidKey =
    (!!effectiveKey && effectiveKey !== "dummy-key-for-test") ||
    process.env.NODE_ENV === "test";
  if (!hasValidKey) {
    console.error("CRITICAL: Neither custom nor server GEMINI_API_KEY is available!");
    return {
      profile_updates: {},
      next_question:
        language === "hi"
          ? "लोकसाथी AI का उपयोग करने के लिए कृपया ऊपर 🔑 आइकॉन पर क्लिक करके अपनी निःशुल्क Gemini API Key दर्ज करें।"
          : "To use LokSaathi AI, please click the Key 🔑 icon in the top header and enter your free Gemini API key.",
      suggested_chips:
        language === "hi"
          ? ["API Key जोड़ें", "उत्तर प्रदेश", "दिल्ली", "किसान", "विद्यार्थी / छात्र"]
          : ["Add API Key", "Uttar Pradesh", "Delhi", "Farmer", "Student"],
      is_complete: false,
    };
  }

  const client = getGeminiClient(customApiKey);
  const model = client.getGenerativeModel({ model: getModelName() });

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

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    let questionText = (parsed.next_question || "").trim();
    const ack = (parsed.acknowledgment || "").trim();
    if (ack && !questionText.includes(ack)) {
      questionText = `${ack}\n\n${questionText}`;
    }

    return {
      profile_updates: parsed.profile_updates || {},
      acknowledgment: ack,
      next_question:
        questionText ||
        (language === "hi"
          ? "आप किस राज्य में रहते हैं और आपकी उम्र क्या है?"
          : "Which state do you live in and what is your age?"),
      suggested_chips: Array.isArray(parsed.suggested_chips) ? parsed.suggested_chips : [],
      is_complete: Boolean(parsed.is_complete),
    };
  } catch (err) {
    console.error("Failed Gemini text profile extraction:", err);
    return {
      profile_updates: {},
      next_question:
        language === "hi"
          ? "माफ़ कीजिए, मैं ठीक से समझ नहीं पाया। क्या आप अपनी बात फिर से बता सकते हैं?"
          : "Sorry, I could not understand clearly. Could you please repeat that?",
      suggested_chips:
        language === "hi"
          ? ["उत्तर प्रदेश", "दिल्ली", "हरियाणा", "किसान", "विद्यार्थी / छात्र"]
          : ["Uttar Pradesh", "Delhi", "Haryana", "Farmer", "Student"],
      is_complete: false,
    };
  }
}

export async function extractUserProfileFromAudio(
  audioBase64: string,
  mimeType: string,
  history: Array<{ role: "user" | "model"; text: string }>,
  language: "hi" | "en" = "hi",
  customApiKey?: string
): Promise<ProfileExtractionResult & { transcript: string }> {
  const effectiveKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  const hasValidKey =
    (!!effectiveKey && effectiveKey !== "dummy-key-for-test") ||
    process.env.NODE_ENV === "test";
  if (!hasValidKey) {
    console.error("CRITICAL: Neither custom nor server GEMINI_API_KEY is available!");
    return {
      transcript: language === "hi" ? "आवाज इनपुट" : "Voice input",
      profile_updates: {},
      acknowledgment: "",
      next_question:
        language === "hi"
          ? "लोकसाथी AI का उपयोग करने के लिए कृपया ऊपर 🔑 आइकॉन पर क्लिक करके अपनी निःशुल्क Gemini API Key दर्ज करें।"
          : "To use LokSaathi AI, please click the Key 🔑 icon in the top header and enter your free Gemini API key.",
      suggested_chips:
        language === "hi"
          ? ["API Key जोड़ें", "उत्तर प्रदेश", "दिल्ली", "किसान", "छात्र"]
          : ["Add API Key", "Uttar Pradesh", "Delhi", "Farmer", "Student"],
      is_complete: false,
    };
  }

  const client = getGeminiClient(customApiKey);
  const model = client.getGenerativeModel({ model: getModelName() });

  const systemInstruction = loadPrompt("scheme-system.txt");

  const conversationContext = history
    .map((msg) => `${msg.role === "user" ? "Citizen" : "LokSaathi"}: ${msg.text}`)
    .join("\n");

  const prompt = `${systemInstruction}

Conversation Language: ${language === "hi" ? "Hindi (Devanagari/Hinglish)" : "English"}

Previous conversation:
${conversationContext || "None"}

The citizen submitted a voice recording.
Tasks:
1. Accurately transcribe what the citizen spoke into the "transcript" field (in Hindi or English as spoken).
2. Extract profile updates from their speech.
3. Formulate the next question and dynamic suggested_chips in ${language === "hi" ? "Hindi" : "English"}.

Expected JSON output structure:
{
  "transcript": "<exact words spoken by citizen>",
  "profile_updates": { ... },
  "acknowledgment": "...",
  "next_question": "...",
  "suggested_chips": [ ... ],
  "is_complete": false
}`;

  const base64Index = audioBase64.indexOf(";base64,");
  const cleanAudio =
    base64Index !== -1
      ? audioBase64.slice(base64Index + 8)
      : audioBase64.replace(/^data:[^;]+;base64,/, "").trim();
  const normalizedMimeType = (mimeType && mimeType.split(";")[0]) || "audio/wav";

  // Check if audio data is missing, empty, or too short (< 500 characters, less than ~0.05s)
  if (!cleanAudio || cleanAudio.length < 500) {
    return {
      transcript: language === "hi" ? "आवाज नहीं आई" : "Voice not detected",
      profile_updates: {},
      acknowledgment: "",
      next_question:
        language === "hi"
          ? "माइक से आवाज बहुत छोटी या शांत थी। कृपया माइक दबाकर अपनी बात फिर से बोलें।"
          : "The audio was too short or silent. Please tap the mic and speak clearly.",
      suggested_chips:
        language === "hi"
          ? ["उत्तर प्रदेश", "दिल्ली", "हरियाणा", "किसान", "छात्र", "मजदूर"]
          : ["Uttar Pradesh", "Delhi", "Haryana", "Farmer", "Student", "Labourer"],
      is_complete: false,
    };
  }

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanAudio,
          mimeType: normalizedMimeType,
        },
      },
    ]);

    const text = result.response.text();
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    let questionText = (parsed.next_question || "").trim();
    const ack = (parsed.acknowledgment || "").trim();
    if (ack && !questionText.includes(ack)) {
      questionText = `${ack}\n\n${questionText}`;
    }

    return {
      transcript:
        (parsed.transcript || "").trim() ||
        (language === "hi" ? "आवाज संदेश प्राप्त हुआ" : "Voice message received"),
      profile_updates: parsed.profile_updates || {},
      acknowledgment: ack,
      next_question:
        questionText ||
        (language === "hi"
          ? "आप किस राज्य में रहते हैं और आपकी उम्र क्या है?"
          : "Which state do you live in and what is your age?"),
      suggested_chips: Array.isArray(parsed.suggested_chips) ? parsed.suggested_chips : [],
      is_complete: Boolean(parsed.is_complete),
    };
  } catch (err: any) {
    console.error("Gemini audio extraction error:", err?.message || err);
    return {
      transcript: language === "hi" ? "आवाज संदेश" : "Voice message",
      profile_updates: {},
      acknowledgment: "",
      next_question:
        language === "hi"
          ? "माफ़ कीजिए, आवाज स्पष्ट नहीं थी। क्या आप दोबारा बोल सकते हैं या नीचे से विकल्प चुन सकते हैं?"
          : "Sorry, the voice was not clear. Could you please repeat or select an option below?",
      suggested_chips:
        language === "hi"
          ? ["उत्तर प्रदेश", "दिल्ली", "हरियाणा", "किसान", "छात्र"]
          : ["Uttar Pradesh", "Delhi", "Haryana", "Farmer", "Student"],
      is_complete: false,
    };
  }
}

export async function explainDocument(
  imageBase64: string,
  language: "hi" | "en" = "hi",
  customApiKey?: string
): Promise<DocExplanation> {
  const client = getGeminiClient(customApiKey);
  const model = client.getGenerativeModel({ model: getModelName() });

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
  language: "hi" | "en" = "hi",
  customApiKey?: string
): AsyncGenerator<string> {
  const client = getGeminiClient(customApiKey);
  const model = client.getGenerativeModel({ model: getModelName() });

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
