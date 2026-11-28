import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { explainDocument, type DocExplanation } from "@/lib/gemini";
import { getCachedDocExplanation, setCachedDocExplanation } from "@/lib/doc-cache";
import {
  validateBase64ImageInput,
  sanitizeDocExplanation,
  redactSecrets,
} from "@/lib/security";

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

  // Enforce rate limit only for shared server usage and never double-count after middleware
  if (!customApiKey && request.headers.get("x-loksaathi-ratelimited") !== "1") {
    const rateLimitResult = await checkRateLimit(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message_hi: "अभी अधिक उपयोग के कारण कृपया थोड़ी देर बाद पुनः प्रयास करें।",
          message_en: "High demand right now. Please wait a moment and try scanning again.",
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

  const imgValidation = validateBase64ImageInput(body?.image_base64);
  if (!imgValidation.valid) {
    const status = imgValidation.error === "image_payload_too_large" ? 413 : 400;
    return NextResponse.json(
      {
        error: imgValidation.error,
        message_hi:
          imgValidation.error === "image_payload_too_large"
            ? "इमेज का आकार बहुत बड़ा है (अधिकतम 2MB)।"
            : "अमान्य दस्तावेज़ इमेज प्रारूप (केवल JPEG, PNG या WebP मान्य हैं)।",
        message_en:
          imgValidation.error === "image_payload_too_large"
            ? "Image payload is too large (maximum 2MB)."
            : "Invalid document image format (only JPEG, PNG, or WebP are supported).",
      },
      { status }
    );
  }

  const normalizedImage = imgValidation.normalized;
  const language = body.language === "en" ? "en" : "hi";
  const mode = body.mode === "form_guide" ? "form_guide" : "explain";

  // Check Upstash Redis cache (isolated by mode + language + image sha256)
  try {
    const cached = await getCachedDocExplanation(normalizedImage, mode, language);
    if (cached) {
      return NextResponse.json(sanitizeDocExplanation(cached, language));
    }
  } catch {
    // Non-fatal, proceed with AI analysis
  }

  try {
    const rawExplanation: DocExplanation = await explainDocument(
      normalizedImage,
      language,
      customApiKey,
      mode
    );
    const explanation = sanitizeDocExplanation(rawExplanation, language);

    // Persist to Redis cache asynchronously
    setCachedDocExplanation(normalizedImage, mode, language, explanation).catch(() => {});

    return NextResponse.json(explanation);
  } catch (error: any) {
    console.error("Doc explanation error (returning graceful fallback):", redactSecrets(error));
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

    if (isAuthError && customApiKey) {
      const authErrorResponse: DocExplanation = {
        document_type:
          language === "hi"
            ? "वैकल्पिक कस्टम कुंजी अमान्य"
            : "Custom Key Rejected",
        summary:
          language === "hi"
            ? "आपकी दर्ज वैकल्पिक API कुंजी काम नहीं कर सकी। मदद (/help) के उन्नत सेटअप से इसे अपडेट या हटा सकते हैं।"
            : "Your optional private key could not be verified. You can update or remove it in Help (/help).",
        key_fields: [],
        action_items: [
          {
            task:
              language === "hi"
                ? "मदद (/help) पेज के उन्नत विकल्प में जाकर कस्टम कुंजी हटाएं या नई वैध 'AIzaSy' कुंजी डालें"
                : "Open Advanced Setup in Help (/help) to clear or update your optional 'AIzaSy' key",
            urgency: "medium",
          },
        ],
        warnings: [
          language === "hi"
            ? "आपकी फोटो सुरक्षित है और सर्वर पर सेव नहीं हुई है।"
            : "Your document photo remains safe and was not stored on any server.",
        ],
        full_explanation:
          language === "hi"
            ? "आपकी फोटो बिल्कुल ठीक है, लेकिन आपकी वैकल्पिक कस्टम कुंजी स्वीकार नहीं हुई। मदद (/help) पेज से उसे हटाकर डिफ़ॉल्ट सेवा का उपयोग कर सकते हैं।"
            : "Your photo is fine, but your optional custom key was not accepted. You can clear it under Help (/help) to resume standard service.",
        mode,
      };
      return NextResponse.json(authErrorResponse);
    }

    if (isRateLimit || isAuthError) {
      const busyResponse: DocExplanation = {
        document_type:
          language === "hi"
            ? "सेवा अभी व्यस्त है"
            : "Service Temporarily Busy",
        summary:
          language === "hi"
            ? "इस समय कई नागरिक दस्तावेज़ पढ़ रहे हैं। कृपया कुछ सेकंड बाद दोबारा प्रयास करें।"
            : "Many citizens are scanning documents right now. Please wait a moment and try again.",
        key_fields: [],
        action_items: [
          {
            task:
              language === "hi"
                ? "थोड़ी देर बाद 'पुनः प्रयास करें' दबाएं या नजदीकी जन सेवा केंद्र (CSC) पर दस्तावेज़ दिखाएं"
                : "Wait a short moment and tap Try Again, or ask your nearest Citizen Facilitation Center (CSC / Jan Seva Kendra)",
            urgency: "medium",
          },
        ],
        warnings: [
          language === "hi"
            ? "आपकी फोटो पूरी तरह सुरक्षित है और किसी सर्वर पर सेव नहीं की गई है।"
            : "Your photo remains private and was not saved on our servers.",
        ],
        full_explanation:
          language === "hi"
            ? "अभी AI रीडर पर अधिक लोड है। कृपया थोड़ी देर बाद दोबारा फोटो स्कैन करें या सरकारी योजना विवरण में आवश्यक कागजात की सूची देखें।"
            : "The document reader is currently handling high traffic. Please retry in a few moments or check the official document guide in Schemes.",
        mode,
      };
      return NextResponse.json(busyResponse);
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
