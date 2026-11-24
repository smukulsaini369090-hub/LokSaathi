"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceRecordingResult {
  transcript: string;
  audioBlob: Blob | null;
  mimeType: string;
}

export function useVoiceRecorder(language: "hi" | "en" = "hi") {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<string>("");

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
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

          recognition.onresult = (event: any) => {
            let fullText = "";
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + " ";
            }
            const clean = fullText.trim();
            setTranscript(clean);
            transcriptRef.current = clean;
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition notice (falling back to audio capture):", event.error);
            // Don't kill recording if it's network/no-speech — MediaRecorder is running
            if (event.error === "not-allowed") {
              setError("माइक की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक चालू करें।");
              setIsRecording(false);
            }
          };

          recognition.onend = () => {
            // Only stop if MediaRecorder is also stopped
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
              setIsRecording(false);
            }
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
    transcriptRef.current = "";
    audioChunksRef.current = [];

    // 1. Always start MediaRecorder for 100% audio reliability (Brave, Safari, mobile)
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined") {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        // Choose supported mimeType
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

        const mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start(200); // 200ms slice
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (err: any) {
        console.warn("getUserMedia failed or denied:", err);
        setError("माइक की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में माइक चालू करें।");
        setIsRecording(false);
        return;
      }
    }

    // 2. Also start client SpeechRecognition if available (Chrome / Edge fast path)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn("SpeechRecognition start notice:", err);
      }
    }
  }, [language]);

  const stopRecording = useCallback((): Promise<VoiceRecordingResult> => {
    return new Promise((resolve) => {
      setIsRecording(false);

      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const currentTranscript = transcriptRef.current;

      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        const recorder = mediaRecorderRef.current;
        const recordedMimeType = recorder.mimeType || "audio/webm";

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: recordedMimeType });

          // Release mic stream tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          resolve({
            transcript: currentTranscript,
            audioBlob: blob.size > 0 ? blob : null,
            mimeType: recordedMimeType,
          });
        };

        recorder.stop();
      } else {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        resolve({
          transcript: currentTranscript,
          audioBlob: null,
          mimeType: "audio/webm",
        });
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
