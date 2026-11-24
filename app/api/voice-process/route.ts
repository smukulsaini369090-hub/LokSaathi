import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractUserProfile, extractUserProfileFromAudio, extractRuleBasedProfile } from "@/lib/gemini";

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

  // Enforce rate limit only for shared server usage. Users with their own key get unlimited requests!
  if (!customApiKey) {
    const rateLimitResult = await checkRateLimit(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message_hi: "अनुरोध सीमा समाप्त हुई। थोड़ी देर बाद कोशिश करें या ऊपर 🔑 आइकॉन से अपनी API Key जोड़ें।",
          message_en: "Rate limit reached. Please try again shortly or add your own Gemini API key via the 🔑 button.",
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

  const transcript = (body?.transcript || "").trim();
  const audioBase64 = (body?.audio_base64 || "").trim();
  const history = Array.isArray(body?.conversation_history)
    ? body.conversation_history
    : [];
  const language = body?.language === "en" ? "en" : "hi";

  if (!transcript && !audioBase64) {
    return NextResponse.json(
      {
        error: "empty_voice_input",
        message_hi: "आवाज या टेक्स्ट प्राप्त नहीं हुआ। कृपया दोबारा बोलें।",
        message_en: "No voice or text input received. Please speak again.",
      },
      { status: 400 }
    );
  }

  try {
    let textToProcess = transcript;
    let profileResult: {
      profile_updates: any;
      next_question: string;
      suggested_chips?: string[];
      is_complete: boolean;
      transcript?: string;
    };

    if (transcript) {
      profileResult = await extractUserProfile(transcript, history, language, customApiKey);
    } else if (audioBase64) {
      const audioResult = await extractUserProfileFromAudio(
        audioBase64,
        body?.mime_type || "audio/wav",
        history,
        language,
        customApiKey
      );
      textToProcess = audioResult.transcript;
      profileResult = audioResult;
    } else {
      throw new Error("No transcript or audio provided");
    }

    return NextResponse.json({
      transcript: textToProcess,
      intent: "scheme_query",
      extracted_profile_updates: profileResult.profile_updates,
      next_question: profileResult.next_question,
      suggested_chips: profileResult.suggested_chips || [],
      is_profile_complete: profileResult.is_complete,
    });
  } catch (error: any) {
    console.error("Voice process error:", error);
    const localUpdates = transcript ? extractRuleBasedProfile(transcript) : {};
    const errMsg = error?.message || String(error);
    const isAuthError =
      errMsg.includes("401") ||
      errMsg.includes("API key not valid") ||
      errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
      errMsg.includes("UNAUTHENTICATED") ||
      errMsg.includes("API_KEY_INVALID");

    let question =
      language === "hi"
        ? "माफ़ कीजिए, तकनीकी समस्या आई। क्या आप अपनी बात फिर से दोहरा सकते हैं?"
        : "Sorry, a temporary issue occurred. Could you please select an option below?";

    if (isAuthError) {
      question =
        language === "hi"
          ? "आपकी दर्ज की गई Gemini API Key अमान्य है। Google AI Studio की सही कुंजी 'AIzaSy' से शुरू होती है। कृपया ऊपर 🔑 आइकॉन से सही कुंजी जोड़ें।"
          : "The Gemini API Key entered is invalid. Valid keys start with 'AIzaSy'. Please click the Key 🔑 icon above to update it.";
    }

    return NextResponse.json(
      {
        transcript:
          transcript || (language === "hi" ? "आवाज संदेश" : "Voice input"),
        intent: "scheme_query",
        extracted_profile_updates: localUpdates,
        next_question: question,
        suggested_chips:
          language === "hi"
            ? ["पंजाब", "उत्तर प्रदेश", "दिल्ली", "हरियाणा", "किसान", "विद्यार्थी"]
            : ["Punjab", "Uttar Pradesh", "Delhi", "Haryana", "Farmer", "Student"],
        is_profile_complete: false,
      },
      { status: 200 }
    );
  }
}
