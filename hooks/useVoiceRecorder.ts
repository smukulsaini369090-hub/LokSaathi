"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceRecordingResult {
  transcript: string;
  audioBlob: Blob | null;
  mimeType: string;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number = 16000
): Float32Array {
  if (outputSampleRate >= inputSampleRate) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : buffer[offsetBuffer];
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export function useVoiceRecorder(language: "hi" | "en" = "hi") {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcmBuffersRef = useRef<Float32Array[]>([]);
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
            console.warn("Speech recognition notice (falling back to direct WAV audio):", event.error);
            if (event.error === "not-allowed") {
              setError(
                language === "hi"
                  ? "माइक की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक चालू करें।"
                  : "Microphone permission denied. Please enable mic access in browser settings."
              );
              setIsRecording(false);
            }
          };

          recognition.onend = () => {
            if (!audioContextRef.current || audioContextRef.current.state === "closed") {
              setIsRecording(false);
            }
          };

          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition init error:", e);
        }
      }
    }

    // Release microphone hardware tracks & SpeechRecognition cleanly on unmount or language switch
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
        } catch {}
        processorRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [language]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    setError(null);
    setTranscript("");
    transcriptRef.current = "";
    pcmBuffersRef.current = [];

    // 1. Start Web Audio PCM recorder (100% universal: Brave, Safari, Chrome, Edge)
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        if (audioContext.state === "suspended") {
          try {
            await audioContext.resume();
          } catch {}
        }

        const source = audioContext.createMediaStreamSource(stream);
        // ScriptProcessorNode buffer size 4096
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          pcmBuffersRef.current.push(new Float32Array(inputData));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        setIsRecording(true);
      } catch (err: any) {
        console.warn("Microphone access error:", err);
        setError(
          language === "hi"
            ? "माइक की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में माइक चालू करें।"
            : "Microphone permission denied. Please enable mic access in browser settings."
        );
        setIsRecording(false);
        return;
      }
    }

    // 2. Also start client SpeechRecognition if available
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

      // Disconnect processor & audioContext
      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
          processorRef.current = null;
        } catch {}
      }

      let wavBlob: Blob | null = null;
      if (audioContextRef.current && pcmBuffersRef.current.length > 0) {
        const sampleRate = audioContextRef.current.sampleRate;
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;

        // Concatenate all PCM chunks
        const totalLength = pcmBuffersRef.current.reduce((acc, b) => acc + b.length, 0);
        if (totalLength >= 3200) {
          const concatenated = new Float32Array(totalLength);
          let offset = 0;
          for (const buffer of pcmBuffersRef.current) {
            concatenated.set(buffer, offset);
            offset += buffer.length;
          }

          // Downsample to 16kHz for speech recognition
          const downsampled = downsampleBuffer(concatenated, sampleRate, 16000);
          // Encode to standard audio/wav
          wavBlob = encodeWAV(downsampled, 16000);
        }
      }

      // Stop mic tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      resolve({
        transcript: currentTranscript,
        audioBlob: wavBlob,
        mimeType: "audio/wav",
      });
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
