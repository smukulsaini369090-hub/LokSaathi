/**
 * Web Speech Synthesis Audio Playback ("Suno") Engine.
 * Provides high-fidelity, culturally natural text-to-speech for Hindi and English.
 */

export interface TTSState {
  isPlaying: boolean;
  isSupported: boolean;
}

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let keepAliveTimer: NodeJS.Timeout | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Initialize & cache available voices
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

/**
 * Sanitizes markdown, emojis, abbreviations, and symbols so the speech synthesizer
 * articulates fluent, natural conversational Hindi or English without glitches.
 */
export function sanitizeTextForSpeech(text: string, lang: "hi" | "en" = "hi"): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Expand currency & Indian scheme abbreviations first
  if (lang === "hi") {
    cleaned = cleaned.replace(/₹\s*([0-9,]+)/g, "$1 रुपये");
    cleaned = cleaned.replace(/Rs\.?\s*([0-9,]+)/gi, "$1 रुपये");
    cleaned = cleaned.replace(/\bPM-?\s*/g, "प्रधानमंत्री ");
    cleaned = cleaned.replace(/\bUP\b/g, "उत्तर प्रदेश");
    cleaned = cleaned.replace(/\bMP\b/g, "मध्य प्रदेश");
    cleaned = cleaned.replace(/\bDL\b/g, "दिल्ली");
    cleaned = cleaned.replace(/\bHR\b/g, "हरियाणा");
    cleaned = cleaned.replace(/\be-?KYC\b/gi, "ई-केवाईसी");
    cleaned = cleaned.replace(/\bCSC\b/g, "जन सेवा केंद्र");
  } else {
    cleaned = cleaned.replace(/₹\s*([0-9,]+)/g, "$1 Rupees");
    cleaned = cleaned.replace(/Rs\.?\s*([0-9,]+)/gi, "$1 Rupees");
    cleaned = cleaned.replace(/\bPM-?\s*/g, "Prime Minister ");
  }

  // 2. Remove emojis (preserving currency)
  cleaned = cleaned.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2600-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  );

  // 3. Strip markdown syntax: bold, italics, headers, bullets, backticks
  cleaned = cleaned.replace(/[*#_~`]/g, "");
  cleaned = cleaned.replace(/^\s*[-•]\s+/gm, ""); // bullet points
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // markdown links -> link text

  // 4. Smooth out linebreaks and spaces into natural conversational breath pauses
  cleaned = cleaned.replace(/\n+/g, ", ");
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  return cleaned.trim();
}

/**
 * Intelligently chooses the highest quality natural Hindi or Indian English voice
 * installed across Windows (Microsoft Kalpana/Hemant), Android (Google हिन्दी), iOS (Lekha), or Chrome.
 */
function selectBestVoice(
  voices: SpeechSynthesisVoice[],
  lang: "hi" | "en"
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  if (lang === "hi") {
    // 1. Natural / Neural online voices
    const naturalHindi = voices.find(
      (v) =>
        v.lang.toLowerCase().replace("_", "-").startsWith("hi") &&
        (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Google"))
    );
    if (naturalHindi) return naturalHindi;

    // 2. Any voice tagged with Hindi language code (hi-IN, hi_IN, hi)
    const standardHindi = voices.find((v) =>
      v.lang.toLowerCase().replace("_", "-").startsWith("hi")
    );
    if (standardHindi) return standardHindi;

    // 3. Any voice containing "Hindi" or "हिन्दी" in name
    const namedHindi = voices.find(
      (v) =>
        v.name.toLowerCase().includes("hindi") ||
        v.name.includes("हिन्दी") ||
        v.name.includes("Kalpana") ||
        v.name.includes("Hemant")
    );
    if (namedHindi) return namedHindi;
  } else {
    // 1. Natural Indian English voices (en-IN)
    const indianEnglishNatural = voices.find(
      (v) =>
        v.lang.toLowerCase().replace("_", "-").includes("en-in") &&
        (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Google"))
    );
    if (indianEnglishNatural) return indianEnglishNatural;

    // 2. Any en-IN voice
    const standardIndianEnglish = voices.find((v) =>
      v.lang.toLowerCase().replace("_", "-").includes("en-in")
    );
    if (standardIndianEnglish) return standardIndianEnglish;

    // 3. Fallback to any English voice
    const anyEnglish = voices.find((v) =>
      v.lang.toLowerCase().replace("_", "-").startsWith("en")
    );
    if (anyEnglish) return anyEnglish;
  }

  return null;
}

export function stopSpeech(): void {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }

  if (isTTSSupported()) {
    try {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    } catch (err) {
      console.error("Error stopping speech synthesis:", err);
    }
  }
}

export function speakText(
  text: string,
  lang: "hi" | "en" = "hi",
  onEnd?: () => void,
  onError?: (err: any) => void
): boolean {
  if (!isTTSSupported()) {
    console.warn("SpeechSynthesis not supported in this browser.");
    return false;
  }

  stopSpeech();

  // If synthesizer is in paused state, unpause it
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const cleanedText = sanitizeTextForSpeech(text, lang);
  if (!cleanedText) {
    if (onEnd) onEnd();
    return true;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    activeUtterance = utterance;

    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    // Cadence calibrated for rural comprehension and clear Hindi syllable delivery
    utterance.rate = lang === "hi" ? 0.92 : 0.95;
    utterance.pitch = 1.0;

    // Select the best voice from available voices
    const voices = getAvailableVoices();
    const bestVoice = selectBestVoice(voices, lang);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    const cleanup = () => {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      activeUtterance = null;
    };

    utterance.onend = () => {
      cleanup();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      cleanup();
      console.warn("SpeechSynthesis utterance event:", e);
      if (onError) onError(e);
    };

    // Chromium keep-alive interval: Prevents browser garbage-collection freezing on long speech (>14s)
    keepAliveTimer = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 5000);

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error("SpeechSynthesis error:", err);
    if (onError) onError(err);
    return false;
  }
}
