import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/doc-explain/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/gemini", () => ({
  explainDocument: vi.fn(),
}));

describe("POST /api/doc-explain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with structured explanation for valid image", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: true,
      remaining: 18,
    });

    const { explainDocument } = await import("@/lib/gemini");
    vi.mocked(explainDocument).mockResolvedValueOnce({
      document_type: "विद्युत देयक (Electricity Bill)",
      summary: "उत्तर प्रदेश पावर कारपोरेशन लिमिटेड का बिजली बिल",
      key_fields: [{ label: "कुल देय", value: "₹950", importance: "critical" }],
      action_items: [
        { task: "देय तिथि तक बिल भरें", deadline: "2026-12-10", urgency: "high" },
      ],
      warnings: [],
      full_explanation: "यह घरेलू बिजली का बिल है।",
    });

    const req = new NextRequest("http://localhost/api/doc-explain", {
      method: "POST",
      body: JSON.stringify({
        image_base64: "data:image/jpeg;base64,mockedbase64content",
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
    expect(body.document_type).toContain("विद्युत देयक");
    expect(body.action_items[0].urgency).toBe("high");
  });

  it("returns 400 when image_base64 is missing", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: true,
      remaining: 18,
    });

    const req = new NextRequest("http://localhost/api/doc-explain", {
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

  it("handles AI extraction failure gracefully with 200 structured fallback (Review Focus 2)", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: true,
      remaining: 18,
    });

    const { explainDocument } = await import("@/lib/gemini");
    vi.mocked(explainDocument).mockRejectedValueOnce(
      new Error("Gemini Vision failed on degraded image")
    );

    const req = new NextRequest("http://localhost/api/doc-explain", {
      method: "POST",
      body: JSON.stringify({
        image_base64: "data:image/jpeg;base64,corruptedbase64",
        language: "hi",
      }),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
    });

    const res = await POST(req);
    // Must return 200 with structured warning, never 500
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.warnings.length).toBeGreaterThan(0);
    expect(body.warnings[0]).toContain("रोशनी");
  });
});
