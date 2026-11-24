"use client";

import { useState, useEffect, useCallback } from "react";
import { speakText, stopSpeech, isTTSSupported, prewarmTTS } from "@/lib/tts";

export function useSpeechSynthesis() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(isTTSSupported());

    // Pre-warm speech synthesis synchronously on the very first touch/click
    const handleFirstTouch = () => {
      prewarmTTS();
      window.removeEventListener("touchstart", handleFirstTouch);
      window.removeEventListener("click", handleFirstTouch);
    };

    window.addEventListener("touchstart", handleFirstTouch, { passive: true });
    window.addEventListener("click", handleFirstTouch, { passive: true });

    return () => {
      stopSpeech();
      window.removeEventListener("touchstart", handleFirstTouch);
      window.removeEventListener("click", handleFirstTouch);
    };
  }, []);

  const speak = useCallback(
    (text: string, lang: "hi" | "en" = "hi") => {
      prewarmTTS();
      if (!isTTSSupported()) return;

      setIsPlaying(true);
      speakText(
        text,
        lang,
        () => setIsPlaying(false),
        () => setIsPlaying(false)
      );
    },
    []
  );

  const stop = useCallback(() => {
    stopSpeech();
    setIsPlaying(false);
  }, []);

  return { speak, stop, isPlaying, isSupported, prewarmTTS };
}
