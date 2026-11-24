/**
 * Web Speech Synthesis Audio Playback ("Suno") Engine.
 * Provides free, zero-cost, browser-native text-to-speech for Hindi and English.
 */

export interface TTSState {
  isPlaying: boolean;
  isSupported: boolean;
}

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeech(): void {
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

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95; // Slightly slower for clear rural comprehension
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) =>
      lang === "hi" ? v.lang.startsWith("hi") : v.lang.startsWith("en-IN") || v.lang.startsWith("en")
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      if (onError) onError(e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error("SpeechSynthesis error:", err);
    if (onError) onError(err);
    return false;
  }
}
