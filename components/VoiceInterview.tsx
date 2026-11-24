"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Volume2, Square, Sparkles, CheckCircle2 } from "lucide-react";
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

const getDefaultChips = (lang: "hi" | "en") =>
  lang === "hi"
    ? [
        "📍 उत्तर प्रदेश (UP)",
        "📍 दिल्ली (NCR)",
        "📍 हरियाणा (HR)",
        "🌾 किसान भाई",
        "📚 छात्र / विद्यार्थी",
        "💼 छोटा व्यापारी / दुकानदार",
        "👷 श्रमिक / मज़दूर",
        "👩 महिला स्वरोजगार",
      ]
    : [
        "📍 Uttar Pradesh (UP)",
        "📍 Delhi (NCR)",
        "📍 Haryana (HR)",
        "🌾 Farmer",
        "📚 Student",
        "💼 Small Business",
        "👷 Worker / Labour",
        "👩 Self-employed Woman",
      ];

export function VoiceInterview({
  language,
  onProfileComplete,
}: VoiceInterviewProps) {
  const initialQuestion =
    language === "hi"
      ? "नमस्ते! 🙏 मैं आपका लोकसाथी हूँ। केंद्र व राज्य सरकार की सैकड़ों कल्याणकारी योजनाओं में से आपकी पात्रता खोजने में मैं आपकी मदद करूँगा।\n\nशुरू करने के लिए बताइए—आप किस राज्य में रहते हैं और आप क्या काम या पढ़ाई करते हैं?"
      : "Namaste! 🙏 I am your LokSaathi. I will help you discover all the central and state welfare schemes and benefits you qualify for.\n\nTo begin, which state do you live in and what is your work or study?";

  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: initialQuestion },
  ]);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [typedInput, setTypedInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedChips, setSuggestedChips] = useState<string[]>(getDefaultChips(language));

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

  // Sync default chips if language changes
  useEffect(() => {
    if (messages.length === 1) {
      setSuggestedChips(getDefaultChips(language));
    }
  }, [language, messages.length]);

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

  const cleanSpeechText = (text: string) => {
    return text.replace(/[*#_~`]/g, "").replace(/\n+/g, " ").trim();
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
      const updatedProfile: Partial<UserProfile> = {
        ...profile,
        ...(data.extracted_profile_updates || {}),
      };
      setProfile(updatedProfile);

      // Update dynamic chips if provided
      if (Array.isArray(data.suggested_chips) && data.suggested_chips.length > 0) {
        setSuggestedChips(data.suggested_chips);
      }

      const nextQuestion =
        data.next_question ||
        (language === "hi"
          ? "आपकी पारिवारिक आय या व्यवसाय के बारे में कुछ और बताएं?"
          : "Could you tell me more about your income or occupation?");

      // Add AI response
      setMessages((prev) => [...prev, { role: "model", text: nextQuestion }]);

      // Check if profile is complete or ready for scheme matching
      const profileFieldCount = Object.keys(updatedProfile).filter(
        (k) => (updatedProfile as Record<string, unknown>)[k] !== undefined
      ).length;

      if (data.is_profile_complete || profileFieldCount >= 4) {
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
              ? "तकनीकी समस्या आई। कृपया अपनी बात दोबारा बताएं या नीचे से त्वरित विकल्प चुनें।"
              : "A technical issue occurred. Please repeat or choose an option below.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChipClick = (value: string) => {
    // Strip leading emoji or symbols for cleaner transcript
    const cleanValue = value.replace(/^[📍🌾📚💼👷👩🎂💰🏷️]\s*/, "");
    handleUserSubmit(cleanValue);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4 py-2">
      {/* Live Recognized Profile Pill Bar */}
      {Object.keys(profile).length > 0 && (
        <div className="mb-3 p-2.5 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex flex-wrap items-center gap-1.5 shadow-xs transition-all animate-fadeIn">
          <span className="font-semibold flex items-center gap-1 text-blue-700 mr-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {language === "hi" ? "दर्ज विवरण:" : "Captured details:"}
          </span>
          {profile.state && (
            <span className="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-medium text-slate-800 shadow-2xs">
              📍 {profile.state.toUpperCase()}
            </span>
          )}
          {profile.age && (
            <span className="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-medium text-slate-800 shadow-2xs">
              🎂 {profile.age} {language === "hi" ? "वर्ष" : "yrs"}
            </span>
          )}
          {profile.occupation && profile.occupation.length > 0 && (
            <span className="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-medium text-slate-800 shadow-2xs">
              💼 {profile.occupation.join(", ")}
            </span>
          )}
          {profile.annual_income_inr !== undefined && (
            <span className="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-medium text-slate-800 shadow-2xs">
              💰 ₹{profile.annual_income_inr.toLocaleString("en-IN")}
            </span>
          )}
          {profile.category && (
            <span className="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-medium uppercase text-slate-800 shadow-2xs">
              🏷️ {profile.category}
            </span>
          )}
        </div>
      )}

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
              className={`rounded-2xl px-4 py-3 max-w-[88%] text-base shadow-sm transition-all ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none font-medium"
                  : "bg-white text-gray-900 border border-slate-200 rounded-tl-none font-normal"
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="leading-relaxed whitespace-pre-line">
                  {msg.text}
                </div>
                {msg.role === "model" && (
                  <button
                    type="button"
                    onClick={() =>
                      isPlaying ? stop() : speak(cleanSpeechText(msg.text), language)
                    }
                    aria-label={
                      isPlaying ? "रोकें (Stop audio)" : "सुनें (Listen to audio)"
                    }
                    className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                    title={language === "hi" ? "आवाज में सुनें" : "Listen in voice"}
                  >
                    {isPlaying ? (
                      <Square className="w-4 h-4 fill-current text-red-500 animate-pulse" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-blue-600 hover:scale-110 transition-transform" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-blue-50 text-blue-800 rounded-2xl px-4 py-2.5 text-sm border border-blue-100 flex items-center gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="font-medium">
                {language === "hi"
                  ? "लोकसाथी समझ रहा है... कृपया प्रतीक्षा करें"
                  : "LokSaathi is thinking... please wait"}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Contextual Suggestion Chips */}
      {suggestedChips.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-500 font-medium mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>
              {language === "hi" ? "त्वरित विकल्प (टैप करें):" : "Quick suggestions (tap to send):"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="text-xs font-medium bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 hover:border-blue-300 rounded-full px-3 py-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notice if mic error */}
      {micError && (
        <div className="mb-2 p-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
          {micError}
        </div>
      )}

      {/* Voice Hero CTA Button + Typed Fallback Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md">
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
            className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md cursor-pointer ${
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
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!typedInput.trim() || isProcessing}
              aria-label="भेजें (Send message)"
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
