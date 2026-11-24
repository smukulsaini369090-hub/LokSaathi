import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { explainDocument, type DocExplanation } from "@/lib/gemini";
import { getCachedDocExplanation, setCachedDocExplanation } from "@/lib/doc-cache";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }

  const headerKey = request.headers.get("x-gemini-api-key")?.trim();
  const bodyKey = typeof body?.user_api_key === "string" ? body.user_api_key.trim() : "";
  const customApiKey = headerKey || bodyKey || undefined;

  // Enforce rate limit only for shared server usage
  if (!customApiKey) {
    const rateLimitResult = await checkRateLimit(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message_hi: "अनुरोध सीमा समाप्त हुई। कृपया थोड़ी देर बाद कोशिश करें या अपनी API Key जोड़ें।",
          message_en: "Rate limit reached. Please try again shortly or add your own Gemini API key.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "3600",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  if (!body || !body.image_base64 || typeof body.image_base64 !== "string") {
    return NextResponse.json(
      {
        error: "missing_image_base64",
        message_hi: "दस्तावेज़ की इमेज (base64) आवश्यक है",
      },
      { status: 400 }
    );
  }

  const language = body.language === "en" ? "en" : "hi";
  const mode = body.mode === "form_guide" ? "form_guide" : "explain";

  // Check Upstash Redis cache (isolated by mode + language + image sha256)
  try {
    const cached = await getCachedDocExplanation(body.image_base64, mode, language);
    if (cached) {
      return NextResponse.json(cached);
    }
  } catch {
    // Non-fatal, proceed with AI analysis
  }

  try {
    const explanation: DocExplanation = await explainDocument(
      body.image_base64,
      language,
      customApiKey,
      mode
    );

    // Persist to Redis cache asynchronously
    setCachedDocExplanation(body.image_base64, mode, language, explanation).catch(() => {});

    return NextResponse.json(explanation);
  } catch (error: any) {
    console.error("Doc explanation error (returning graceful fallback):", error);
    const errMsg = error?.message || String(error);
    const isAuthError =
      errMsg.includes("401") ||
      errMsg.includes("API key not valid") ||
      errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
      errMsg.includes("UNAUTHENTICATED") ||
      errMsg.includes("API_KEY_INVALID");
    const isRateLimit =
      errMsg.includes("429") ||
      errMsg.includes("quota") ||
      errMsg.includes("RESOURCE_EXHAUSTED");

    if (isAuthError) {
      const authErrorResponse: DocExplanation = {
        document_type:
          language === "hi"
            ? "API Key अमान्य (Invalid API Key)"
            : "Invalid API Key",
        summary:
          language === "hi"
            ? "दर्ज की गई Gemini API Key अमान्य है। Google AI Studio की सही Key 'AIzaSy' से शुरू होती है।"
            : "The Gemini API Key is invalid or expired. Google AI Studio keys must start with 'AIzaSy'.",
        key_fields: [
          {
            label: language === "hi" ? "त्रुटि स्थिति" : "Error Status",
            value: "Google 401 Unauthorized",
            importance: "critical",
          },
          {
            label: language === "hi" ? "निःशुल्क कुंजी पोर्टल" : "Free Key Portal",
            value: "aistudio.google.com/app/apikey",
            importance: "critical",
          },
        ],
        action_items: [
          {
            task:
              language === "hi"
                ? "ऊपर 🔑 बटन पर क्लिक करके 'AIzaSy' वाली वैध Gemini API Key दर्ज करें"
                : "Click the Key 🔑 icon above and enter a valid 'AIzaSy' Google AI Studio key",
            urgency: "high",
          },
        ],
        warnings: [
          language === "hi"
            ? "OAuth टोकन (जैसे AQ...) API Key के रूप में काम नहीं करते। केवल Google AI Studio Key मान्य है।"
            : "OAuth tokens (such as AQ...) are not valid API keys. Only Google AI Studio keys (starting with AIzaSy) are accepted.",
        ],
        full_explanation:
          language === "hi"
            ? "आपकी फोटो बिल्कुल ठीक है, लेकिन Google के AI सर्वर ने इस API Key को अस्वीकार कर दिया। कृपया https://aistudio.google.com/app/apikey पर जाकर एक सेकंड में मुफ्त कुंजी बनाएं और ऊपर 🔑 आइकॉन में दर्ज करें।"
            : "Your document photo is fine, but Google's AI server rejected the API key. Please generate a free key at https://aistudio.google.com/app/apikey and update it via the Key 🔑 icon above.",
        mode,
      };
      return NextResponse.json(authErrorResponse);
    }

    if (isRateLimit) {
      const rateLimitResponse: DocExplanation = {
        document_type:
          language === "hi"
            ? "अनुरोध सीमा (Rate Limit)"
            : "Rate Limit Exceeded",
        summary:
          language === "hi"
            ? "सर्वर पर अभी अधिक लोड है या Gemini API की सीमा समाप्त हो गई है। कृपया थोड़ी देर बाद पुनः प्रयास करें।"
            : "The server is experiencing high traffic or the Gemini API rate limit was reached. Please try again shortly.",
        key_fields: [],
        action_items: [
          {
            task:
              language === "hi"
                ? "कुछ सेकंड बाद दोबारा कोशिश करें या ऊपर 🔑 बटन से अपनी निःशुल्क API Key लगाएं"
                : "Retry in a few seconds or use your own free key via the Key 🔑 button",
            urgency: "high",
          },
        ],
        warnings: [
          language === "hi"
            ? "मुफ्त कोटा अस्थायी रूप से भर गया है।"
            : "Free tier rate limit reached.",
        ],
        full_explanation:
          language === "hi"
            ? "कृपया कुछ सेकंड प्रतीक्षा करें और दोबारा प्रयास करें।"
            : "Please wait a moment and try again.",
        mode,
      };
      return NextResponse.json(rateLimitResponse);
    }

    // Review Focus 2: Never return 500 on unreadable/degraded images
    const fallbackResponse: DocExplanation = {
      document_type:
        mode === "form_guide"
          ? language === "hi"
            ? "आवेदन फॉर्म (Application Form)"
            : "Application Form"
          : language === "hi"
          ? "अज्ञात दस्तावेज़"
          : "Unknown Document",
      summary:
        mode === "form_guide"
          ? language === "hi"
            ? "आवेदन फॉर्म की जानकारी स्पष्ट रूप से नहीं पढ़ी जा सकी।"
            : "The application form details could not be clearly read."
          : language === "hi"
          ? "दस्तावेज़ की जानकारी स्पष्ट रूप से नहीं पढ़ी जा सकी।"
          : "The document could not be clearly read.",
      key_fields: [],
      action_items: [],
      warnings: [
        language === "hi"
          ? "दस्तावेज़ की फोटो धुंधली या कम रोशनी वाली हो सकती है। कृपया बेहतर रोशनी में साफ फोटो लें।"
          : "Photo might be blurry or taken in low light. Please try again with better lighting.",
      ],
      full_explanation:
        language === "hi"
          ? "कृपया सुनिश्चित करें कि दस्तावेज़ के सभी अक्षर साफ़ दिखाई दे रहे हों और दोबारा फोटो खींचें।"
          : "Please ensure all letters are clear and take another photo.",
      mode,
    };

    return NextResponse.json(fallbackResponse);
  }
}
