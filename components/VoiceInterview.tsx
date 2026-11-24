"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Volume2, Square, Sparkles } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { UserProfile, SchemeMatch } from "@/lib/scheme-matcher";

interface Message {
  role: "user" | "model";
  text: string;
}

interface VoiceInterviewProps {
  language: "hi" | "en";
  onProfileComplete: (profile: UserProfile, matches: SchemeMatch[]) => void;
}

export function VoiceInterview({
  language,
  onProfileComplete,
}: VoiceInterviewProps) {
  const initialQuestion =
    language === "hi"
      ? "नमस्ते! मैं आपका लोकसाथी हूँ। शुरू करने के लिए बताइए—आप किस राज्य में रहते हैं और आपकी उम्र क्या है?"
      : "Hello! I am your LokSaathi. To get started, please tell me—which state do you live in and what is your age?";

  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: initialQuestion },
  ]);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [typedInput, setTypedInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { speak, stop, isPlaying } = useSpeechSynthesis();
  const {
    isRecording,
    transcript,
    setTranscript,
    error: micError,
    startRecording,
    stopRecording,
  } = useVoiceRecorder(language);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  // Handle transcribed speech
  useEffect(() => {
    if (transcript && !isRecording) {
      handleUserSubmit(transcript);
      setTranscript("");
    }
  }, [transcript, isRecording]);

  const handleMicClick = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      stop(); // Stop any audio playback when citizen begins speaking
      await startRecording();
    }
  };

  const handleUserSubmit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    // Add user message to conversation
    const newMessages: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(newMessages);
    setTypedInput("");
    setIsProcessing(true);

    try {
      // 1. Process voice / text input with Gemini
      const res = await fetch("/api/voice-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: trimmed,
          conversation_history: messages,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error("Voice processing request failed");
      }

      const data = await res.json();
      const updatedProfile = {
        ...profile,
        ...(data.extracted_profile_updates || {}),
      };
      setProfile(updatedProfile);

      const nextQuestion =
        data.next_question ||
        (language === "hi"
          ? "आपकी आय या व्यवसाय के बारे में कुछ और बताएं?"
          : "Could you tell me more about your income or occupation?");

      // Add AI response
      setMessages((prev) => [...prev, { role: "model", text: nextQuestion }]);

      // Check if profile is complete or ready for scheme matching
      if (data.is_profile_complete || Object.keys(updatedProfile).length >= 4) {
        // Query scheme matches
        const matchRes = await fetch("/api/scheme-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_profile: updatedProfile,
            language,
          }),
        });

        if (matchRes.ok) {
          const matchData = await matchRes.json();
          if (matchData.matched_schemes && matchData.matched_schemes.length > 0) {
            onProfileComplete(
              updatedProfile as UserProfile,
              matchData.matched_schemes
            );
          }
        }
      }
    } catch (err) {
      console.error("Error during voice interview turn:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text:
            language === "hi"
              ? "तकनीकी समस्या आई। कृपया अपनी बात दोबारा बताएं या नीचे से विकल्प चुनें।"
              : "A technical issue occurred. Please repeat or choose an option below.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChipClick = (value: string) => {
    handleUserSubmit(value);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4 py-2">
      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 min-h-[300px] max-h-[500px]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-3 max-w-[85%] text-base shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white text-gray-900 border border-gray-200 rounded-tl-none"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="leading-relaxed font-normal">{msg.text}</p>
                {msg.role === "model" && (
                  <button
                    type="button"
                    onClick={() => (isPlaying ? stop() : speak(msg.text, language))}
                    aria-label={isPlaying ? "रोकें (Stop audio)" : "सुनें (Listen to audio)"}
                    className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                    title={language === "hi" ? "आवाज में सुनें" : "Listen in voice"}
                  >
                    {isPlaying ? (
                      <Square className="w-4 h-4 fill-current text-red-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-blue-50 text-blue-800 rounded-2xl px-4 py-2 text-sm border border-blue-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>
                {language === "hi"
                  ? "समझ रहा हूँ... कृपया प्रतीक्षा करें"
                  : "Processing... please wait"}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Select Suggestion Chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 self-center">
          {language === "hi" ? "त्वरित उत्तर:" : "Quick options:"}
        </span>
        {["उत्तर प्रदेश", "दिल्ली", "हरियाणा", "किसान", "छात्र", "मजदूर"].map(
          (chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 border border-gray-200 rounded-full px-3 py-1 transition-all"
            >
              {chip}
            </button>
          )
        )}
      </div>

      {/* Notice if mic error */}
      {micError && (
        <div className="mb-2 p-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
          {micError}
        </div>
      )}

      {/* Voice Hero CTA Button + Typed Fallback Input */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-md">
        <div className="flex items-center gap-3">
          {/* Hero Microphone Button */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isProcessing}
            aria-label={
              isRecording
                ? "माइक बंद करें (Stop mic)"
                : "बोलें (Tap to speak into microphone)"
            }
            className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md ${
              isRecording
                ? "bg-red-500 text-white animate-pulse ring-4 ring-red-200 scale-105"
                : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Text Input Fallback (Review Focus 3) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserSubmit(typedInput);
            }}
            className="flex-1 flex items-center gap-2"
          >
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              disabled={isProcessing || isRecording}
              placeholder={
                isRecording
                  ? language === "hi"
                    ? "सुन रहा हूँ... बोलिए"
                    : "Listening... speak now"
                  : language === "hi"
                  ? "यहाँ टाइप करें... (या माइक दबाकर बोलें)"
                  : "Type here... (or tap mic to speak)"
              }
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!typedInput.trim() || isProcessing}
              aria-label="भेजें (Send message)"
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
