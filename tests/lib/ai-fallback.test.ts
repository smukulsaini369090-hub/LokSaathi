import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: mockGenerateContent,
      };
    }
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ success: true, remaining: 50 })),
}));

describe("Zero-Card Multi-Provider Server Fallback & Citizen Privacy", () => {
  const originalFetch = global.fetch;
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envSnapshot };
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...envSnapshot };
  });

  it("cascades Cloudflare Workers AI -> Groq -> Google AI Studio in exact zero-card order and scrubs PII before outbound calls", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "cf-acct-test";
    process.env.CLOUDFLARE_API_TOKEN = "cf-token-test";
    process.env.GROQ_API_KEY = "gsk_test_groq_key";
    process.env.GEMINI_API_KEY = "AIzaSyTestFallbackKey1234567890abcdef";

    // Case 1: Cloudflare succeeds -> Groq & Gemini must NOT be called; PII scrubbed
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                profile_updates: { state: "up", age: 64 },
                acknowledgment: "धन्यवाद जी",
                next_question: "आप क्या काम करते हैं?",
                suggested_chips: ["किसान", "मजदूर"],
                is_complete: false,
              }),
            },
          },
        ],
      }),
    });
    global.fetch = fetchMock as any;

    const { extractUserProfile } = await import("@/lib/gemini");
    const res1 = await extractUserProfile(
      "Main UP se hu, age 64, mera aadhaar 2345 6789 0123 aur PAN ABCDE1234F aur phone 9876543210 hai",
      [{ role: "user", text: "Mera UPI sita@okicici aur account 12345678901234 hai" }],
      "hi"
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [cfUrl, cfInit] = fetchMock.mock.calls[0];
    expect(cfUrl).toContain("api.cloudflare.com/client/v4/accounts/cf-acct-test/ai/v1/chat/completions");
    const sentPayload = JSON.stringify(cfInit.body);
    expect(sentPayload).not.toContain("2345 6789 0123");
    expect(sentPayload).not.toContain("ABCDE1234F");
    expect(sentPayload).not.toContain("9876543210");
    expect(sentPayload).not.toContain("sita@okicici");
    expect(sentPayload).not.toContain("12345678901234");
    expect(sentPayload).toContain("[REDACTED_AADHAAR]");
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(res1.profile_updates.state).toBe("up");

    // Case 2: Cloudflare fails -> falls back to Groq -> Gemini NOT called
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "CF error" })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  profile_updates: { state: "delhi", occupation: ["farmer"] },
                  next_question: "What is your annual family income?",
                  suggested_chips: ["Below ₹1 Lakh"],
                  is_complete: false,
                }),
              },
            },
          ],
        }),
      });

    const res2 = await extractUserProfile("I live in Delhi and do farming", [], "en");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][0]).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(res2.profile_updates.state).toBe("delhi");

    // Case 3: Cloudflare + Groq both fail -> falls back to Google AI Studio
    fetchMock
      .mockRejectedValueOnce(new Error("CF timeout"))
      .mockResolvedValueOnce({ ok: false, status: 429, text: async () => "Groq rate limit" });
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            profile_updates: { state: "punjab", age: 55 },
            next_question: "आपकी सालाना आय कितनी है?",
            suggested_chips: ["₹1 लाख से कम"],
            is_complete: false,
          }),
      },
    });

    const res3 = await extractUserProfile("Main Punjab se hu, umar 55 saal", [], "hi");
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(res3.profile_updates.state).toBe("punjab");
  });

  it("extractUserProfileFromAudio NEVER exposes API key prompts when offline/unkeyed or failing", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.GEMINI_API_KEY;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.GROQ_API_KEY;

    const { extractUserProfileFromAudio } = await import("@/lib/gemini");

    const hiRes = await extractUserProfileFromAudio(
      "data:audio/wav;base64," + "A".repeat(800),
      "audio/wav",
      [],
      "hi"
    );
    expect(hiRes.next_question).not.toMatch(/API\s*Key|🔑|aistudio\.google\.com/i);
    expect(JSON.stringify(hiRes.suggested_chips)).not.toMatch(/API\s*Key|🔑/i);
    expect(hiRes.is_fallback).toBe(true);

    const enRes = await extractUserProfileFromAudio(
      "data:audio/wav;base64," + "A".repeat(800),
      "audio/wav",
      [],
      "en"
    );
    expect(enRes.next_question).not.toMatch(/API\s*Key|🔑|aistudio\.google\.com/i);
    expect(JSON.stringify(enRes.suggested_chips)).not.toMatch(/API\s*Key|🔑/i);
    expect(enRes.is_fallback).toBe(true);
  });

  it("POST /api/voice-process never exposes API key errors or raw upstream errors when all providers fail", async () => {
    mockGenerateContent.mockRejectedValue(
      new Error("[401 Unauthorized] API key not valid at https://generativelanguage.googleapis.com?key=AIzaSySecretLeak")
    );

    const { POST } = await import("@/app/api/voice-process/route");
    const req = new NextRequest("http://localhost/api/voice-process", {
      method: "POST",
      body: JSON.stringify({
        transcript: "मैं हरियाणा का किसान हूँ",
        language: "hi",
        user_profile: {},
      }),
      headers: { "content-type": "application/json", "x-forwarded-for": "10.2.3.4" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const rawJson = JSON.stringify(body);
    expect(rawJson).not.toMatch(/API\s*Key|🔑|401|Unauthorized|AIzaSy|STACK/i);
    expect(body.merged_profile.state).toBe("haryana");
    expect(body.merged_profile.occupation).toContain("farmer");
  });

  it("transcribes audio via Groq Whisper when Cloudflare Whisper is unavailable and scrubs returned PII", async () => {
    process.env.GROQ_API_KEY = "gsk_audio_groq_test";
    const fetchMock = vi
      .fn()
      // 1. Groq audio transcription response containing citizen phone & Aadhaar
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: "Main Haryana ka kisan hoon, mera aadhaar 2345 6789 0123 hai",
        }),
      })
      // 2. Groq chat profile extraction response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  profile_updates: { state: "haryana", occupation: ["farmer"] },
                  next_question: "आपकी उम्र क्या है?",
                  suggested_chips: ["26–40 साल"],
                  is_complete: false,
                }),
              },
            },
          ],
        }),
      });
    global.fetch = fetchMock as any;

    const { extractUserProfileFromAudio } = await import("@/lib/gemini");
    const result = await extractUserProfileFromAudio(
      "data:audio/wav;base64," + "A".repeat(800),
      "audio/wav",
      [],
      "hi"
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
    expect(result.transcript).not.toContain("2345 6789 0123");
    expect(result.transcript).toContain("[REDACTED_AADHAAR]");
    expect(result.profile_updates.state).toBe("haryana");
  });
});
