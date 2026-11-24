import { describe, it, expect, vi, beforeEach } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

describe("Middleware Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows API request when rate limit check succeeds", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: true,
      remaining: 15,
    });

    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("15");
  });

  it("blocks API request with 429 when rate limit exhausted", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: false,
      remaining: 0,
    });

    const req = new NextRequest("http://localhost/api/scheme-match", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const res = await middleware(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limit_exceeded");
    expect(body.message_hi).toBe("थोड़ी देर बाद कोशिश करें");
  });

  it("bypasses rate limit for non-API routes", async () => {
    const req = new NextRequest("http://localhost/schemes");
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });
});
