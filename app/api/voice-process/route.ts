import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractUserProfile, extractUserProfileFromAudio } from "@/lib/gemini";
import { runIntakeStateMachine } from "@/lib/intake-state-machine";
import { loadAllSchemes } from "@/lib/schemes-loader";
import {
  sanitizeUntrustedInput,
  detectPromptInjectionAttack,
  validateProfilePayload,
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
  const alreadyRateLimited = request.headers.get("x-loksaathi-ratelimited") === "1";

  // Enforce rate limit only for shared server usage and never double-count after middleware
  if (!customApiKey && !alreadyRateLimited) {
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

  const rawTranscript = typeof body?.transcript === "string" ? body.transcript : "";
  const transcript = sanitizeUntrustedInput(rawTranscript, 2000);
  const audioBase64 = (typeof body?.audio_base64 === "string" ? body.audio_base64 : "").trim();
  if (audioBase64.length > 4_000_000) {
    return NextResponse.json(
      {
        error: "audio_payload_too_large",
        message_hi: "ऑडियो संदेश बहुत बड़ा है। कृपया छोटा संदेश बोलें।",
        message_en: "Audio recording is too large. Please record a shorter clip.",
      },
      { status: 413 }
    );
  }
  const history = Array.isArray(body?.conversation_history)
    ? body.conversation_history.slice(-12)
    : [];
  const language = body?.language === "en" ? "en" : "hi";
  const userProfile = validateProfilePayload(body?.user_profile);
  const targetSchemeId =
    typeof body?.target_scheme_id === "string"
      ? sanitizeUntrustedInput(body.target_scheme_id, 100)
      : undefined;
  const forceComplete = Boolean(body?.force_complete);

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

  const allSchemes = loadAllSchemes();

  const buildSecurityRefusal = (
    reason: "prompt_injection" | "scam_manipulation",
    safeTranscript: string
  ) => {
    const refusalText =
      reason === "scam_manipulation"
        ? language === "hi"
          ? "⚠️ दलाल और फर्जी लिंक से सावधान: LokSaathi या कोई भी सरकारी पोर्टल कभी निजी UPI ID, OTP या अनधिकृत शुल्क नहीं मांगता। केवल सत्यापित .gov.in वेबसाइट का ही उपयोग करें।"
          : "⚠️ Anti-Scam Alert: LokSaathi and official government portals never ask for private UPI transfers, OTPs, or middleman fees. Only use verified .gov.in websites."
        : language === "hi"
        ? "मैं केवल भारत सरकार और राज्यों की सत्यापित कल्याणकारी योजनाओं व पात्रता जांच में आपकी सहायता कर सकता हूँ। कृपया अपनी उम्र, राज्य या व्यवसाय बताएं।"
        : "I only assist citizens with verified Indian government welfare schemes and eligibility checks. Please share your state, age, or occupation to begin.";

    return NextResponse.json({
      transcript: safeTranscript || (language === "hi" ? "सुरक्षा जांच" : "Security check"),
      intent: "scheme_query",
      extracted_profile_updates: {},
      merged_profile: userProfile,
      pending_fields: ["state", "age", "occupation"],
      needs_state_disambiguation: false,
      potential_schemes_count: allSchemes.length,
      next_question: refusalText,
      suggested_chips:
        language === "hi"
          ? ["दिल्ली सरकार की योजनाएँ", "किसान सम्मान (PM-KISAN)", "छात्रवृत्ति / पेंशन"]
          : ["Delhi Welfare Schemes", "PM-KISAN Benefits", "Scholarships / Pension"],
      is_profile_complete: false,
      matched_schemes: [],
      target_scheme: null,
      eligibility_audit: null,
    });
  };

  if (transcript) {
    const preCheck = detectPromptInjectionAttack(rawTranscript);
    if (preCheck.blocked && preCheck.reason) {
      return buildSecurityRefusal(preCheck.reason, transcript);
    }
  }

  let textToProcess = transcript;
  let llmResult: {
    profile_updates?: any;
    acknowledgment?: string;
    next_question?: string;
    suggested_chips?: string[];
    is_complete?: boolean;
    transcript?: string;
    is_fallback?: boolean;
    auth_error?: boolean;
  } | null = null;

  try {
    if (transcript) {
      llmResult = await extractUserProfile(
        transcript,
        history,
        language,
        customApiKey,
        userProfile
      );
    } else if (audioBase64) {
      const audioResult = await extractUserProfileFromAudio(
        audioBase64,
        body?.mime_type || "audio/wav",
        history,
        language,
        customApiKey
      );
      const rawAudioText = audioResult.transcript || "";
      textToProcess = sanitizeUntrustedInput(rawAudioText, 2000);
      const postAudioCheck = detectPromptInjectionAttack(rawAudioText);
      if (postAudioCheck.blocked && postAudioCheck.reason) {
        return buildSecurityRefusal(postAudioCheck.reason, textToProcess);
      }
      llmResult = audioResult;
    }
  } catch (error: any) {
    console.error("Voice process fallback triggered (deterministic intake active):", redactSecrets(error));
    const errMsg = error?.message || String(error);
    const isAuthError =
      errMsg.includes("401") ||
      errMsg.includes("API key not valid") ||
      errMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
      errMsg.includes("UNAUTHENTICATED") ||
      errMsg.includes("API_KEY_INVALID");

    llmResult = {
      is_fallback: true,
      auth_error: isAuthError,
      acknowledgment: isAuthError
        ? language === "hi"
          ? "⚠️ आपकी दर्ज Gemini API Key अमान्य है (🔑 से सही Key जोड़ें) — ऑफ़लाइन मोड में जांच जारी है:"
          : "⚠️ Your entered Gemini API Key is invalid (update via 🔑) — continuing in smart offline mode:"
        : "",
    };
  }

  // Run authoritative progressive state machine regardless of LLM outcome
  const stateOutput = runIntakeStateMachine({
    userMessage: textToProcess,
    currentProfile: userProfile,
    llmResult: llmResult?.is_fallback
      ? {
          profile_updates: llmResult.profile_updates,
          acknowledgment: llmResult.acknowledgment,
          is_complete: false,
        }
      : llmResult,
    targetSchemeId,
    forceComplete,
    allSchemes,
    language,
  });

  return NextResponse.json({
    transcript: textToProcess || (language === "hi" ? "आवाज संदेश" : "Voice input"),
    intent: "scheme_query",
    extracted_profile_updates: stateOutput.extracted_profile_updates,
    merged_profile: stateOutput.merged_profile,
    pending_fields: stateOutput.pending_fields,
    needs_state_disambiguation: stateOutput.needs_state_disambiguation,
    potential_schemes_count: stateOutput.potential_schemes_count,
    next_question: stateOutput.next_question,
    suggested_chips: stateOutput.suggested_chips,
    is_profile_complete: stateOutput.is_profile_complete,
    matched_schemes: stateOutput.is_profile_complete ? stateOutput.matched_schemes : [],
    target_scheme: stateOutput.target_scheme,
    scheme_redirect: stateOutput.scheme_redirect || null,
    eligibility_audit: stateOutput.eligibility_audit,
  });
}
