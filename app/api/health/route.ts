import { NextResponse } from "next/server";
import { getGeminiClient, getModelName } from "@/lib/gemini";
import { getConfiguredZeroCardStatus } from "@/lib/ai-providers";

export async function GET() {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "dummy-key-for-test";
  const zeroCard = getConfiguredZeroCardStatus();
  const modelName = getModelName();

  let geminiStatus = "untested";

  if (hasKey) {
    try {
      const client = getGeminiClient();
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("ping");
        geminiStatus = result.response.text() ? "connected" : "empty_response";
      } catch (firstErr: any) {
        const msg = firstErr?.message || String(firstErr);
        if (msg.includes("503") || msg.includes("high demand") || msg.includes("404")) {
          const fallbackModel = client.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
          const result = await fallbackModel.generateContent("ping");
          geminiStatus = result.response.text() ? "connected" : "empty_response";
        } else {
          throw firstErr;
        }
      }
    } catch {
      geminiStatus = "error";
    }
  } else {
    geminiStatus = "missing_api_key";
  }

  const anyReady = zeroCard.cloudflare || zeroCard.groq || (hasKey && geminiStatus === "connected");

  return NextResponse.json({
    status: anyReady ? "healthy" : "degraded",
    providers: {
      cloudflare: zeroCard.cloudflare,
      groq: zeroCard.groq,
      gemini: hasKey,
      deterministic_fallback: true,
    },
    gemini: {
      has_key: hasKey,
      status: geminiStatus,
    },
    timestamp: new Date().toISOString(),
  });
}
