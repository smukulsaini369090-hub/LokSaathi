"use client";

import { useState, useEffect, useCallback } from "react";
import { speakText, stopSpeech, isTTSSupported } from "@/lib/tts";

export function useSpeechSynthesis() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(isTTSSupported());

    return () => {
      stopSpeech();
    };
  }, []);

  const speak = useCallback(
    (text: string, lang: "hi" | "en" = "hi") => {
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

  return { speak, stop, isPlaying, isSupported };
}
