import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class MockGoogleGenerativeAI {
      getGenerativeModel() {
        return {
          generateContent: mockGenerateContent,
          generateContentStream: mockGenerateContentStream,
        };
      }
    },
  };
});

describe("Gemini Client & AI Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extractUserProfile extracts fields and returns next question", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            profile_updates: { state: "up", age: 35, occupation: ["farmer"] },
            next_question: "आपकी वार्षिक आय लगभग कितनी है?",
            is_complete: false,
          }),
      },
    });

    const { extractUserProfile } = await import("@/lib/gemini");
    const result = await extractUserProfile(
      "मैं उत्तर प्रदेश में रहता हूँ, उम्र 35 साल है और खेती करता हूँ",
      [],
      "hi"
    );

    expect(result.profile_updates.state).toBe("up");
    expect(result.profile_updates.age).toBe(35);
    expect(result.profile_updates.occupation).toContain("farmer");
    expect(result.next_question).toBe("आपकी वार्षिक आय लगभग कितनी है?");
    expect(result.is_complete).toBe(false);
  });

  it("explainDocument extracts structured document information", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            document_type: "बिजली बिल (Electricity Bill)",
            summary: "यह उत्तर प्रदेश पावर कारपोरेशन का बिजली बिल है।",
            key_fields: [
              { label: "उपभोक्ता नाम", value: "राम कुमार", importance: "normal" },
              { label: "देय राशि", value: "₹1,240", importance: "critical" },
            ],
            action_items: [
              {
                task: "अंतिम तिथि से पहले ₹1,240 का भुगतान करें",
                deadline: "2026-12-15",
                urgency: "high",
              },
            ],
            warnings: [],
            full_explanation: "यह बिल नियमित घरेलू बिजली कनेक्शन का है।",
          }),
      },
    });

    const { explainDocument } = await import("@/lib/gemini");
    const result = await explainDocument("base64-image-sample", "hi");

    expect(result.document_type).toContain("बिजली बिल");
    expect(result.key_fields.length).toBeGreaterThan(0);
    expect(result.action_items[0].urgency).toBe("high");
  });

  it("generateSchemeExplanation streams text chunks", async () => {
    mockGenerateContentStream.mockResolvedValueOnce({
      stream: (async function* () {
        yield { text: () => "पीएम-किसान योजना के तहत " };
        yield { text: () => "आपको ₹6,000 वार्षिक मिलेंगे।" };
      })(),
    });

    const { generateSchemeExplanation } = await import("@/lib/gemini");
    const stream = generateSchemeExplanation([], { state: "up" }, "hi");

    let text = "";
    for await (const chunk of stream) {
      text += chunk;
    }

    expect(text).toBe("पीएम-किसान योजना के तहत आपको ₹6,000 वार्षिक मिलेंगे।");
  });

  it("parseBase64Image correctly parses JPEG data URLs and magic bytes", async () => {
    const { parseBase64Image } = await import("@/lib/gemini");

    // JPEG data URL from canvas
    const sampleJpegDataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...";
    const parsed1 = parseBase64Image(sampleJpegDataUrl);
    expect(parsed1.mimeType).toBe("image/jpeg");
    expect(parsed1.data.startsWith("/9j/")).toBe(true);

    // PNG data URL
    const samplePngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE...";
    const parsed2 = parseBase64Image(samplePngDataUrl);
    expect(parsed2.mimeType).toBe("image/png");
    expect(parsed2.data.startsWith("iVBORw0KGgo")).toBe(true);
  });

  it("extractRuleBasedProfile does NOT misclassify 'student' as 'st' category or 'upsc' as 'up' state", async () => {
    const { extractRuleBasedProfile } = await import("@/lib/gemini");

    // "student" should only extract occupation, NEVER category: "st"
    const result1 = extractRuleBasedProfile("I am a student");
    expect(result1.occupation).toContain("student");
    expect(result1.category).toBeUndefined();

    // "upsc student in delhi" should extract state: "delhi", NOT "up"
    const result2 = extractRuleBasedProfile("I am preparing for UPSC in Delhi");
    expect(result2.state).toBe("delhi");
    expect(result2.category).toBeUndefined();

    // Actual "ST" or "SC" with boundary works properly
    const result3 = extractRuleBasedProfile("I belong to ST category and live in Punjab");
    expect(result3.category).toBe("st");
    expect(result3.state).toBe("punjab");
  });

  it("getModelName respects configured models like gemini-3.5-flash-lite and ignores accidental API keys in GEMINI_MODEL", async () => {
    const { getModelName } = await import("@/lib/gemini");
    const prev = process.env.GEMINI_MODEL;
    try {
      process.env.GEMINI_MODEL = "gemini-3.5-flash-lite";
      expect(getModelName()).toBe("gemini-3.5-flash-lite");

      // Accidental key in GEMINI_MODEL must default to high-availability gemini-3.5-flash-lite
      process.env.GEMINI_MODEL = "AIzaSyFakeKey1234567890abcdef";
      expect(getModelName()).toBe("gemini-3.5-flash-lite");
    } finally {
      process.env.GEMINI_MODEL = prev;
    }
  });
});
