import { describe, it, expect, vi, beforeEach } from "vitest";
import { sanitizeTextForSpeech, isTTSSupported } from "@/lib/tts";

describe("TTS Engine & Hindi Speech Sanitizer", () => {
  it("sanitizes currency symbols into spoken Hindi words", () => {
    const input = "सरकार आपको ₹6,000 की आर्थिक मदद देगी।";
    const result = sanitizeTextForSpeech(input, "hi");
    expect(result).toContain("6,000 रुपये");
    expect(result).not.toContain("₹");
  });

  it("sanitizes currency symbols into spoken English words", () => {
    const input = "The scheme provides ₹10,000 financial support.";
    const result = sanitizeTextForSpeech(input, "en");
    expect(result).toContain("10,000 Rupees");
    expect(result).not.toContain("₹");
  });

  it("removes markdown formatting and emojis for smooth pronunciation", () => {
    const input = "🙏 **प्रधानमंत्री किसान सम्मान निधि**: \n- पहली किश्त \n- दूसरी किश्त";
    const result = sanitizeTextForSpeech(input, "hi");
    expect(result).not.toContain("🙏");
    expect(result).not.toContain("**");
    expect(result).not.toContain("- ");
    expect(result).toContain("प्रधानमंत्री किसान सम्मान निधि");
  });

  it("expands Indian administrative acronyms in Hindi", () => {
    const input = "UP और DL के नागरिकों के लिए eKYC और CSC पर सुविधा।";
    const result = sanitizeTextForSpeech(input, "hi");
    expect(result).toContain("उत्तर प्रदेश");
    expect(result).toContain("दिल्ली");
    expect(result).toContain("ई-केवाईसी");
    expect(result).toContain("जन सेवा केंद्र");
  });

  it("checks TTS support in browser environment", () => {
    expect(typeof isTTSSupported()).toBe("boolean");
  });
});
