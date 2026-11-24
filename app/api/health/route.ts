import { NextResponse } from "next/server";
import { getGeminiClient, getModelName } from "@/lib/gemini";

export async function GET() {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "dummy-key-for-test";
  const keyPrefix = hasKey ? process.env.GEMINI_API_KEY!.slice(0, 8) + "..." : "missing";
  const modelName = getModelName();

  let geminiStatus = "untested";
  let geminiError: string | null = null;
  let activeModel = modelName;

  if (hasKey) {
    try {
      const client = getGeminiClient();
      try {
        const model = client.getGenerativeModel({ model: activeModel });
        const result = await model.generateContent("ping");
        geminiStatus = result.response.text() ? "connected" : "empty_response";
      } catch (firstErr: any) {
        const msg = firstErr?.message || String(firstErr);
        if (msg.includes("503") || msg.includes("high demand") || msg.includes("404")) {
          const fallbackModel = client.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
          const result = await fallbackModel.generateContent("ping");
          geminiStatus = result.response.text() ? "connected" : "empty_response";
          activeModel = "gemini-3.5-flash-lite";
        } else {
          throw firstErr;
        }
      }
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
      model: activeModel,
      status: geminiStatus,
      error: geminiError,
    },
    timestamp: new Date().toISOString(),
  });
}
