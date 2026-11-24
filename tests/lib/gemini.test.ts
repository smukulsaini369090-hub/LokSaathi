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
});
