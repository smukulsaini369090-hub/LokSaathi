import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/verify-key/route";
import { NextRequest } from "next/server";

describe("POST /api/verify-key", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("rejects non-AIzaSy keys such as AQ. tokens with clear explanation", async () => {
    const req = new NextRequest("http://localhost/api/verify-key", {
      method: "POST",
      body: JSON.stringify({
        api_key: "AQ.mock_oauth_service_token_not_ai_studio_key",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.code).toBe("INVALID_PREFIX");
    expect(json.message_en).toContain("AIzaSy");
  });

  it("verifies valid AIzaSy key against Google API returning 200", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      json: async () => ({ models: [] }),
    } as any);

    const validMockKey = "AIzaSyD-samplemockkey1234567890abcdef";
    const req = new NextRequest("http://localhost/api/verify-key", {
      method: "POST",
      body: JSON.stringify({ api_key: validMockKey }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.message_en).toContain("verified");
  });

  it("returns invalid status when Google API rejects with 401 Unauthorized", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 401,
      json: async () => ({ error: { message: "API key not valid" } }),
    } as any);

    const expiredKey = "AIzaSyB-expiredmockkey1234567890abcdef";
    const req = new NextRequest("http://localhost/api/verify-key", {
      method: "POST",
      body: JSON.stringify({ api_key: expiredKey }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.code).toBe("UNAUTHORIZED");
  });
});
