import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/scheme-match/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

const validFarmerBody = {
  user_profile: {
    state: "up",
    age: 42,
    gender: "male",
    occupation: ["farmer"],
    annual_income_inr: 80000,
    category: "obc",
    land_owned_acres: 2,
    is_income_tax_payer: false,
    is_government_employee: false,
  },
  language: "hi",
};

describe("POST /api/scheme-match", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with matched_schemes for valid farmer profile", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: true,
      remaining: 19,
    });

    const req = new NextRequest("http://localhost/api/scheme-match", {
      method: "POST",
      body: JSON.stringify(validFarmerBody),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.matched_schemes)).toBe(true);
    expect(body.matched_schemes.length).toBeGreaterThan(0);
    // PM-KISAN should be matched
    const hasPmKisan = body.matched_schemes.some(
      (m: any) => m.scheme.id === "pm-kisan"
    );
    expect(hasPmKisan).toBe(true);
  });

  it("returns 429 when rate limit is exceeded (Review Focus 5)", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: false,
      remaining: 0,
    });

    const req = new NextRequest("http://localhost/api/scheme-match", {
      method: "POST",
      body: JSON.stringify(validFarmerBody),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.message_hi).toBe("थोड़ी देर बाद कोशिश करें");
  });

  it("returns 400 for missing user_profile", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: true,
      remaining: 19,
    });

    const req = new NextRequest("http://localhost/api/scheme-match", {
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
