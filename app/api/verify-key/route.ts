import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { valid: false, message_hi: "अमान्य अनुरोध", message_en: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const rawKey = typeof body?.api_key === "string" ? body.api_key.trim() : "";
  if (!rawKey) {
    return NextResponse.json(
      {
        valid: false,
        message_hi: "कृपया अपनी Gemini API Key दर्ज करें।",
        message_en: "Please enter your Gemini API Key.",
      },
      { status: 400 }
    );
  }

  // Google AI Studio API keys strictly start with AIzaSy (39 characters)
  if (!rawKey.startsWith("AIzaSy")) {
    return NextResponse.json({
      valid: false,
      code: "INVALID_PREFIX",
      message_hi:
        "Google AI Studio API Keys 'AIzaSy' से शुरू होती हैं (39 अक्षर)। यदि आपकी कुंजी 'AQ.' से शुरू होती है तो वह OAuth टोकन है जो मान्य नहीं है। कृपया aistudio.google.com से मुफ्त कुंजी लें।",
      message_en:
        "Google AI Studio keys must start with 'AIzaSy' (39 characters). Strings starting with 'AQ.' or other OAuth tokens are not valid API keys. Please get a free key from aistudio.google.com.",
    });
  }

  if (rawKey.length < 35 || rawKey.length > 45) {
    return NextResponse.json({
      valid: false,
      code: "INVALID_LENGTH",
      message_hi: "API Key की लंबाई सही नहीं लग रही है। Google AI Studio Key आमतौर पर 39 अक्षरों की होती है।",
      message_en: "Invalid API Key length. Google AI Studio keys are typically exactly 39 characters.",
    });
  }

  // Ping Google Generative AI Model endpoint with short timeout to verify live validity
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(rawKey)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 200) {
      return NextResponse.json({
        valid: true,
        message_hi: "✅ Google द्वारा API Key सफलतापूर्वक सत्यापित हो गई!",
        message_en: "✅ API Key verified and active with Google!",
      });
    }

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({
        valid: false,
        code: "UNAUTHORIZED",
        message_hi: "Google द्वारा यह कुंजी अस्वीकृत कर दी गई (401/403)। कृपया aistudio.google.com से नई Key प्राप्त करें।",
        message_en: "Google rejected this key (401/403 Unauthorized). Please generate a fresh key from aistudio.google.com.",
      });
    }

    if (res.status === 429) {
      return NextResponse.json({
        valid: true,
        warning: true,
        message_hi: "कुंजी मान्य है, लेकिन दर सीमा (429 Rate Limit) पूरी हो चुकी है।",
        message_en: "Key is valid, but current rate limit has been reached.",
      });
    }

    return NextResponse.json({
      valid: true,
      message_hi: "कुंजी प्रारूप मान्य है।",
      message_en: "Key format is valid.",
    });
  } catch {
    // If offline or network timeout, pass based on valid AIzaSy format
    return NextResponse.json({
      valid: true,
      unverified: true,
      message_hi: "प्रारूप सही है (नेटवर्क टाइमआउट)। सहेजा जा सकता है।",
      message_en: "Format is valid (network verification timed out). Can be saved.",
    });
  }
}
