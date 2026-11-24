import { NextResponse } from "next/server";
import { getGeminiClient, getModelName } from "@/lib/gemini";

export async function GET() {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "dummy-key-for-test";
  const keyPrefix = hasKey ? process.env.GEMINI_API_KEY!.slice(0, 8) + "..." : "missing";
  const modelName = getModelName();

  let geminiStatus = "untested";
  let geminiError: string | null = null;

  if (hasKey) {
    try {
      const client = getGeminiClient();
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("ping");
      geminiStatus = result.response.text() ? "connected" : "empty_response";
    } catch (err: any) {
      geminiStatus = "error";
      geminiError = err?.message || String(err);
    }
  } else {
    geminiStatus = "missing_api_key";
  }

  return NextResponse.json({
    status: hasKey && geminiStatus === "connected" ? "healthy" : "degraded",
    gemini: {
      has_key: hasKey,
      key_prefix: keyPrefix,
      model: modelName,
      status: geminiStatus,
      error: geminiError,
    },
    timestamp: new Date().toISOString(),
  });
}
