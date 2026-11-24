"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceRecorderState {
  isRecording: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}

export function useVoiceRecorder(language: "hi" | "en" = "hi") {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const hasMedia = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );

      setIsSupported(!!(SpeechRecognition || hasMedia));

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

          recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const text = event.results[current][0].transcript;
            setTranscript(text);
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition notice:", event.error);
            setIsRecording(false);
          };

          recognition.onend = () => {
            setIsRecording(false);
          };

          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition init error:", e);
        }
      }
    }
  }, [language]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";
        recognitionRef.current.start();
        setIsRecording(true);
        return;
      } catch (err) {
        console.warn("Could not start SpeechRecognition, trying MediaRecorder fallback:", err);
      }
    }

    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (err: any) {
        console.error("Mic access error:", err);
        setError("माइक की अनुमति नहीं मिली। कृपया लिखकर बताएं।");
        setIsRecording(false);
      }
    } else {
      setError("इस ब्राउज़र में आवाज रिकॉर्डिंग समर्थित नहीं है।");
    }
  }, [language]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      setIsRecording(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  }, []);

  return {
    isRecording,
    isSupported,
    transcript,
    setTranscript,
    error,
    startRecording,
    stopRecording,
  };
}
