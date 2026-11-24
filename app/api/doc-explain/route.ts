import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { explainDocument, type DocExplanation } from "@/lib/gemini";

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

  try {
    const explanation: DocExplanation = await explainDocument(
      body.image_base64,
      language
    );
    return NextResponse.json(explanation);
  } catch (error) {
    console.error("Doc explanation error (returning graceful fallback):", error);
    // Review Focus 2: Never return 500 on unreadable/degraded images
    const fallbackResponse: DocExplanation = {
      document_type: language === "hi" ? "अज्ञात दस्तावेज़" : "Unknown Document",
      summary:
        language === "hi"
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
    };

    return NextResponse.json(fallbackResponse);
  }
}
