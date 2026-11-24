import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractUserProfile } from "@/lib/gemini";

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
    // If text transcript exists (from browser Web Speech API or typed input), process with Gemini
    const textToProcess = transcript || "User submitted voice audio input";
    const profileResult = await extractUserProfile(textToProcess, history, language);

    return NextResponse.json({
      transcript: textToProcess,
      intent: "scheme_query",
      extracted_profile_updates: profileResult.profile_updates,
      next_question: profileResult.next_question,
      is_profile_complete: profileResult.is_complete,
    });
  } catch (error) {
    console.error("Voice process error:", error);
    return NextResponse.json(
      {
        transcript: transcript || "",
        intent: "general_info",
        extracted_profile_updates: {},
        next_question:
          language === "hi"
            ? "माफ़ कीजिए, तकनीकी समस्या आई। क्या आप अपनी बात फिर से दोहरा सकते हैं?"
            : "Sorry, a technical error occurred. Could you please repeat that?",
        is_profile_complete: false,
      },
      { status: 200 }
    );
  }
}
