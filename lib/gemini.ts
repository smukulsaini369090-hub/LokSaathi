/**
 * Server-only Gemini client for LokSaathi.
 * This module should NEVER be imported into Client Components.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { UserProfile, SchemeMatch } from "@/lib/scheme-matcher";

export interface FormGuideStep {
  step_number: number;
  box_title: string;
  what_to_write: string;
  source_document: string;
  is_optional: boolean;
}

export interface DocExplanation {
  document_type: string;
  summary: string;
  key_fields: Array<{ label: string; value: string; importance: "critical" | "normal" }>;
  action_items: Array<{ task: string; deadline?: string; urgency: "high" | "medium" | "low" }>;
  warnings: string[];
  full_explanation: string;
  mode?: "explain" | "form_guide";
  form_guide_steps?: FormGuideStep[];
}

let geminiClient: GoogleGenerativeAI | null = null;

export function getModelName(apiKey?: string): string {
  const effectiveKey = apiKey?.trim() || process.env.GEMINI_API_KEY || "";
  const configured = (process.env.GEMINI_MODEL || "").replace(/^["']|["']$/g, "").trim();

  // If user provided a standard Google AI Studio key (starts with AIzaSy)
  if (effectiveKey.startsWith("AIzaSy")) {
    return process.env.GEMINI_PUBLIC_MODEL || configured || "gemini-2.0-flash";
  }

  // Prevent deprecated, invalid, or throttled preview models (like gemini-3.5-flash-lite)
  if (configured && !configured.toLowerCase().includes("3.5") && !configured.toLowerCase().includes("lite")) {
    return configured;
  }

  // Default to stable, fast free-tier Gemini 2.0 Flash
  return "gemini-2.0-flash";
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

async function generateWithRetry(model: any, content: any, maxAttempts = 2): Promise<any> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await model.generateContent(content);
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      const isRetryable =
        msg.includes("503") ||
        msg.includes("Service Unavailable") ||
        msg.includes("high demand") ||
        msg.includes("429") ||
        msg.includes("fetch failed");
      if (isRetryable && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export function extractRuleBasedProfile(text: string): Partial<UserProfile> {
  const lower = text.toLowerCase().trim();
  const updates: Partial<UserProfile> = {};

  // State
  if (lower.includes("delhi") || lower.includes("दिल्ली")) updates.state = "delhi";
  else if (lower.includes("haryana") || lower.includes("हरियाणा") || lower.includes("hr")) updates.state = "haryana";
  else if (lower.includes("uttar pradesh") || lower.includes("up") || lower.includes("उत्तर प्रदेश") || lower.includes("यूपी")) updates.state = "up";
  else if (lower.includes("punjab") || lower.includes("पंजाब") || lower.includes("pb")) updates.state = "punjab";

  // Occupation
  const occ: string[] = [];
  if (lower.includes("farmer") || lower.includes("किसान") || lower.includes("kisan") || lower.includes("खेती")) occ.push("farmer");
  if (lower.includes("student") || lower.includes("छात्र") || lower.includes("विद्यार्थी") || lower.includes("study") || lower.includes("पढ़ाई")) occ.push("student");
  if (lower.includes("labor") || lower.includes("labour") || lower.includes("मजदूर") || lower.includes("श्रमिक") || lower.includes("दिहाड़ी")) occ.push("laborer");
  if (lower.includes("vendor") || lower.includes("दुकान") || lower.includes("रेहड़ी") || lower.includes("व्यापारी")) occ.push("street_vendor");
  if (lower.includes("unemployed") || lower.includes("बेरोजगार") || lower.includes("नौकरी")) occ.push("unemployed");
  if (lower.includes("artisan") || lower.includes("कारीगर") || lower.includes("हस्तशिल्प")) occ.push("artisan");
  if (occ.length > 0) updates.occupation = occ;

  // Gender
  if (lower.includes("mahila") || lower.includes("महिला") || lower.includes("female") || lower.includes("aurat") || lower.includes("औरत")) updates.gender = "female";
  else if (lower.includes("purush") || lower.includes("पुरुष") || lower.includes("male") || lower.includes("aadmi") || lower.includes("आदमी")) updates.gender = "male";

  // Age (digits between 10 and 99)
  const ageMatch = text.match(/\b([1-9][0-9])\s*(?:साल|वर्ष|years?|yr|age)?\b/i);
  if (ageMatch) {
    const parsedAge = parseInt(ageMatch[1], 10);
    if (parsedAge >= 10 && parsedAge <= 100) updates.age = parsedAge;
  }

  // Category
  if (lower.includes("general") || lower.includes("सामान्य")) updates.category = "general";
  else if (lower.includes("obc") || lower.includes("ओबीसी") || lower.includes("पिछड़ा")) updates.category = "obc";
  else if (lower.includes("sc") || lower.includes("अनुसूचित जाति")) updates.category = "sc";
  else if (lower.includes("st") || lower.includes("अनुसूचित जनजाति")) updates.category = "st";

  // Income
  if (lower.includes("1 lakh") || lower.includes("1 लाख") || lower.includes("कम") || lower.includes("kam")) updates.annual_income_inr = 80000;
  else if (lower.includes("2.5 lakh") || lower.includes("2.5 लाख")) updates.annual_income_inr = 200000;
  else if (lower.includes("5 lakh") || lower.includes("5 लाख")) updates.annual_income_inr = 450000;

  return updates;
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
  const model = client.getGenerativeModel({ model: getModelName(effectiveKey) });

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
    const result = await generateWithRetry(model, prompt);
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
  } catch (err: any) {
    console.error("Gemini text profile extraction fallback triggered:", err?.message || err);
    const errMsg = err?.message || String(err);
    const isRateLimit =
      errMsg.includes("429") ||
      errMsg.includes("quota") ||
      errMsg.includes("RESOURCE_EXHAUSTED");

    // Intelligent local fallback so LokSaathi never traps the user in a dead-end loop
    const localUpdates = extractRuleBasedProfile(transcript);
    const hasAnyField = Object.keys(localUpdates).length > 0;

    let fallbackQuestion = "";
    let fallbackChips: string[] = [];

    if (isRateLimit) {
      fallbackQuestion =
        language === "hi"
          ? "सर्वर पर अभी अधिक लोड है या Gemini API की सीमा समाप्त हो गई है। कृपया कुछ सेकंड बाद पुनः प्रयास करें, या ऊपर 🔑 आइकॉन पर क्लिक करके अपनी निःशुल्क API Key जोड़ें। आप नीचे दिए गए विकल्पों में से चुन सकते हैं:"
          : "The server is experiencing high traffic or the Gemini API rate limit was reached. Please retry in a few seconds, or click the Key 🔑 icon above to use your own free API Key. You can proceed below:";
      fallbackChips =
        language === "hi"
          ? ["पंजाब", "उत्तर प्रदेश", "दिल्ली", "हरियाणा", "किसान", "विद्यार्थी"]
          : ["Punjab", "Uttar Pradesh", "Delhi", "Haryana", "Farmer", "Student"];
    } else if (localUpdates.state && !localUpdates.occupation) {
      const stateLabel =
        localUpdates.state === "punjab"
          ? "पंजाब"
          : localUpdates.state === "up"
          ? "उत्तर प्रदेश"
          : localUpdates.state === "delhi"
          ? "दिल्ली"
          : "हरियाणा";
      fallbackQuestion =
        language === "hi"
          ? `बहुत बढ़िया! मैंने आपका राज्य (${stateLabel}) दर्ज कर लिया है। कृपया बताइए आपकी उम्र क्या है और आप क्या काम या पढ़ाई करते हैं?`
          : `Great! I have recorded your state (${localUpdates.state.toUpperCase()}). Could you please tell me your age and occupation or study?`;
      fallbackChips =
        language === "hi"
          ? ["22 साल", "25 साल", "किसान भाई", "छात्र / विद्यार्थी", "मज़दूर / श्रमिक"]
          : ["22 years", "25 years", "Farmer", "Student", "Labourer"];
    } else if (localUpdates.occupation && !localUpdates.annual_income_inr) {
      fallbackQuestion =
        language === "hi"
          ? "धन्यवाद! मैंने आपका पेशा नोट कर लिया है। आपकी लगभग वार्षिक पारिवारिक आय कितनी है?"
          : "Thank you! What is your approximate annual family income?";
      fallbackChips =
        language === "hi"
          ? ["₹1 लाख से कम", "₹1-2.5 लाख", "₹2.5-5 लाख", "₹5 लाख से अधिक"]
          : ["Below ₹1 Lakh", "₹1-2.5 Lakhs", "₹2.5-5 Lakhs", "Above ₹5 Lakhs"];
    } else if (localUpdates.annual_income_inr || localUpdates.age) {
      fallbackQuestion =
        language === "hi"
          ? "विवरण नोट हो गया है! क्या आप अपनी सामाजिक श्रेणी (General, OBC, SC, ST) भी बताना चाहेंगे?"
          : "Details noted! Would you like to share your category (General, OBC, SC, ST)?";
      fallbackChips =
        language === "hi"
          ? ["General", "OBC", "SC", "ST", "योजनाएं दिखाएं"]
          : ["General", "OBC", "SC", "ST", "Show Schemes"];
    } else {
      fallbackQuestion =
        language === "hi"
          ? "नमस्ते! कृपया मुझे अपना राज्य, उम्र या पेशा बताएं (जैसे: 'मैं पंजाब का किसान हूँ') या नीचे दिए गए विकल्पों में से चुनें:"
          : "Hello! Please tell me your state, age, or occupation (e.g. 'I am a student in Delhi') or choose an option below:";
      fallbackChips =
        language === "hi"
          ? ["पंजाब", "उत्तर प्रदेश", "दिल्ली", "हरियाणा", "किसान", "विद्यार्थी / छात्र"]
          : ["Punjab", "Uttar Pradesh", "Delhi", "Haryana", "Farmer", "Student"];
    }

    return {
      profile_updates: localUpdates,
      acknowledgment: hasAnyField
        ? language === "hi"
          ? "नमस्ते! मैंने आपका विवरण नोट कर लिया है।"
          : "Understood, I have noted that."
        : "",
      next_question: fallbackQuestion,
      suggested_chips: fallbackChips,
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
  const model = client.getGenerativeModel({ model: getModelName(effectiveKey) });

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
    const result = await generateWithRetry(model, [
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
  customApiKey?: string,
  mode: "explain" | "form_guide" = "explain"
): Promise<DocExplanation> {
  const effectiveKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  const client = getGeminiClient(customApiKey);
  const model = client.getGenerativeModel({ model: getModelName(effectiveKey) });

  const promptFile = mode === "form_guide" ? "form-guide-system.txt" : "doc-system.txt";
  const systemInstruction = loadPrompt(promptFile);

  const prompt = `${systemInstruction}

Target Language for explanation: ${language === "hi" ? "Hindi (हिंदी)" : "English"}

${
  mode === "form_guide"
    ? "Analyze the blank form image and generate the field-by-field form-filling guide JSON:"
    : "Analyze the attached document and produce the structured JSON response:"
}`;

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
    const parsed = JSON.parse(cleaned);
    parsed.mode = mode;
    return parsed;
  } catch (err) {
    console.error("Failed to parse Gemini doc explanation JSON:", text);
    return {
      document_type:
        mode === "form_guide"
          ? language === "hi"
            ? "आवेदन फॉर्म (Application Form)"
            : "Application Form"
          : language === "hi"
          ? "दस्तावेज़"
          : "Document",
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
      mode,
    };
  }
}

export async function* generateSchemeExplanation(
  matches: SchemeMatch[],
  profile: Partial<UserProfile>,
  language: "hi" | "en" = "hi",
  customApiKey?: string
): AsyncGenerator<string> {
  const effectiveKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  const client = getGeminiClient(customApiKey);
  const model = client.getGenerativeModel({ model: getModelName(effectiveKey) });

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
