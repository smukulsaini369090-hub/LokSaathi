import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/voice-process/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/gemini", () => ({
  extractUserProfile: vi.fn(),
}));

describe("POST /api/voice-process", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with extracted profile updates from transcript", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: true,
      remaining: 18,
    });

    const { extractUserProfile } = await import("@/lib/gemini");
    vi.mocked(extractUserProfile).mockResolvedValueOnce({
      profile_updates: { state: "up", age: 30 },
      next_question: "आप क्या कार्य करते हैं?",
      is_complete: false,
    });

    const req = new NextRequest("http://localhost/api/voice-process", {
      method: "POST",
      body: JSON.stringify({
        transcript: "मैं यूपी का रहने वाला हूँ, उम्र 30 साल है",
        language: "hi",
      }),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.extracted_profile_updates.state).toBe("up");
    expect(body.next_question).toBe("आप क्या कार्य करते हैं?");
  });

  it("returns 400 when both transcript and audio are empty", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: true,
      remaining: 18,
    });

    const req = new NextRequest("http://localhost/api/voice-process", {
      method: "POST",
      body: JSON.stringify({ language: "hi" }),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
