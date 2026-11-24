import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractUserProfile, extractUserProfileFromAudio } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  // Enforce rate limit
  const rateLimitResult = await checkRateLimit(ip);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "rate_limit_exceeded",
        message_hi: "थोड़ी देर बाद कोशिश करें",
        message_en: "Too many requests. Please try again shortly.",
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
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
      profileResult = await extractUserProfile(transcript, history, language);
    } else if (audioBase64) {
      const audioResult = await extractUserProfileFromAudio(
        audioBase64,
        body?.mime_type || "audio/webm",
        history,
        language
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
  } catch (error) {
    console.error("Voice process error:", error);
    return NextResponse.json(
      {
        transcript:
          transcript || (language === "hi" ? "आवाज संदेश" : "Voice input"),
        intent: "general_info",
        extracted_profile_updates: {},
        next_question:
          language === "hi"
            ? "माफ़ कीजिए, तकनीकी समस्या आई। क्या आप अपनी बात फिर से दोहरा सकते हैं?"
            : "Sorry, a technical error occurred. Could you please repeat that?",
        suggested_chips:
          language === "hi"
            ? ["उत्तर प्रदेश", "दिल्ली", "हरियाणा", "किसान", "छात्र", "मजदूर"]
            : ["Uttar Pradesh", "Delhi", "Haryana", "Farmer", "Student", "Labourer"],
        is_profile_complete: false,
      },
      { status: 200 }
    );
  }
}
