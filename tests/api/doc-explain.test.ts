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

  it("handles mode: 'form_guide' correctly and passes mode to explainDocument", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: true,
      remaining: 18,
    });

    const { explainDocument } = await import("@/lib/gemini");
    vi.mocked(explainDocument).mockResolvedValueOnce({
      document_type: "राशन कार्ड आवेदन प्रपत्र",
      summary: "नया राशन कार्ड बनाने का आवेदन पत्र",
      mode: "form_guide",
      key_fields: [],
      form_guide_steps: [
        {
          step_number: 1,
          box_title: "1. मुखिया का नाम",
          what_to_write: "परिवार की महिला मुखिया का नाम आधार कार्ड के अनुसार लिखें।",
          source_document: "आधार कार्ड",
          is_optional: false,
        },
      ],
      action_items: [{ task: "आधार कार्ड संलग्न करें", urgency: "high" }],
      warnings: ["कटिंग न करें"],
      full_explanation: "फॉर्म ध्यानपूर्वक भरें।",
    });

    const req = new NextRequest("http://localhost/api/doc-explain", {
      method: "POST",
      body: JSON.stringify({
        image_base64: "data:image/jpeg;base64,blankformimage",
        language: "hi",
        mode: "form_guide",
      }),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("form_guide");
    expect(body.form_guide_steps).toHaveLength(1);
    expect(body.form_guide_steps[0].box_title).toContain("मुखिया का नाम");
    expect(explainDocument).toHaveBeenCalledWith(
      "data:image/jpeg;base64,blankformimage",
      "hi",
      undefined,
      "form_guide"
    );
  });
});
