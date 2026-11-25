"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Square,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { getStoredApiKey } from "@/lib/client-api-key";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import type { UserProfile, SchemeMatch } from "@/lib/scheme-matcher";
import type { EligibilityAuditResult } from "@/lib/eligibility-evaluator";
import {
  getStoredUserProfile,
  saveStoredUserProfile,
  clearStoredUserProfile,
} from "@/lib/storage";

interface Message {
  role: "user" | "model";
  text: string;
  auditResult?: EligibilityAuditResult;
}

interface VoiceInterviewProps {
  language: "hi" | "en";
  onProfileComplete: (profile: UserProfile, matches: SchemeMatch[]) => void;
}

const getDefaultChips = (lang: "hi" | "en") =>
  lang === "hi"
    ? [
        "📍 पंजाब (PB)",
        "📍 उत्तर प्रदेश (UP)",
        "📍 दिल्ली (NCR)",
        "📍 हरियाणा (HR)",
        "🌾 किसान भाई",
        "📚 छात्र / विद्यार्थी",
        "💼 छोटा व्यापारी / दुकानदार",
        "👷 श्रमिक / मज़दूर",
        "👩 गृहिणी / महिला",
      ]
    : [
        "📍 Punjab (PB)",
        "📍 Uttar Pradesh (UP)",
        "📍 Delhi (NCR)",
        "📍 Haryana (HR)",
        "🌾 Farmer",
        "📚 Student",
        "💼 Small Business",
        "👷 Worker / Labour",
        "👩 Homemaker / Woman",
      ];

interface ProgressStepSpec {
  key: keyof Pick<
    UserProfile,
    "state" | "age" | "gender" | "occupation" | "annual_income_inr" | "category"
  >;
  labelHi: string;
  labelEn: string;
}

const PROGRESS_STEPS: ProgressStepSpec[] = [
  { key: "state", labelHi: "राज्य", labelEn: "State" },
  { key: "age", labelHi: "आयु", labelEn: "Age" },
  { key: "gender", labelHi: "लिंग", labelEn: "Gender" },
  { key: "occupation", labelHi: "पेशा", labelEn: "Work" },
  { key: "annual_income_inr", labelHi: "आय", labelEn: "Income" },
  { key: "category", labelHi: "वर्ग", labelEn: "Category" },
];

export function VoiceInterview({
  language,
  onProfileComplete,
}: VoiceInterviewProps) {
  const initialQuestion =
    language === "hi"
      ? "नमस्ते! 🙏 मैं आपका लोकसाथी हूँ। सटीक सरकारी योजनाओं की जांच के लिए मैं आपसे 4–5 छोटे सवाल पूछूँगा।\n\nशुरू करने के लिए बताइए—आप किस राज्य में रहते हैं या किस योजना के बारे में पूछना चाहते हैं?"
      : "Namaste! 🙏 I am LokSaathi. I will ask 4–5 quick questions to find welfare schemes accurately tailored to your profile.\n\nTo begin, which state do you live in (or which scheme would you like to check)?";

  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: initialQuestion },
  ]);
  // Always start a clean intake session so stale EligibilityChecker localStorage data never skips questions
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [previousSavedProfile, setPreviousSavedProfile] =
    useState<Partial<UserProfile> | null>(null);
  const [targetSchemeId, setTargetSchemeId] = useState<string | null>(null);
  const [needsDisambiguation, setNeedsDisambiguation] = useState(false);
  const [potentialCount, setPotentialCount] = useState<number | null>(null);
  const [pendingFields, setPendingFields] = useState<string[]>([
    "state",
    "age",
    "gender",
    "occupation",
    "annual_income_inr",
  ]);
  const [typedInput, setTypedInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedChips, setSuggestedChips] = useState<string[]>(
    getDefaultChips(language)
  );
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

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
  const inFlightRef = useRef(false);

  // Check on client mount if user has an earlier saved profile they might optionally load
  useEffect(() => {
    const saved = getStoredUserProfile();
    if (saved && Object.keys(saved).length >= 2) {
      setPreviousSavedProfile(saved);
    }
  }, []);

  // Sync greeting and chips if language changes while conversation hasn't started yet
  useEffect(() => {
    if (messages.length === 1) {
      setMessages([{ role: "model", text: initialQuestion }]);
      setSuggestedChips(getDefaultChips(language));
    }
  }, [language, initialQuestion, messages.length]);

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

  const handleResetSession = () => {
    stop();
    clearStoredUserProfile();
    setProfile({});
    setPreviousSavedProfile(null);
    setTargetSchemeId(null);
    setNeedsDisambiguation(false);
    setPotentialCount(null);
    setPendingFields([
      "state",
      "age",
      "gender",
      "occupation",
      "annual_income_inr",
    ]);
    setTypedInput("");
    setMessages([{ role: "model", text: initialQuestion }]);
    setSuggestedChips(getDefaultChips(language));
  };

  const handleLoadSavedProfile = async () => {
    if (!previousSavedProfile) return;
    setProfile(previousSavedProfile);
    setPreviousSavedProfile(null);
    handleUserSubmit(
      language === "hi"
        ? "पिछले विवरण के आधार पर योजनाएं दिखाएं"
        : "Show schemes for my saved profile",
      { customProfile: previousSavedProfile, forceComplete: true }
    );
  };

  const handleManualShowSchemes = () => {
    if (Object.keys(profile).length === 0 || isProcessing) return;
    handleUserSubmit(
      language === "hi" ? "सीधे योजनाएं दिखाएं" : "Show schemes now",
      { forceComplete: true }
    );
  };

  const handleMicClick = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        if (result.transcript && result.transcript.trim()) {
          handleUserSubmit(result.transcript.trim());
        } else if (result.audioBlob && result.audioBlob.size > 1000) {
          handleAudioSubmit(result.audioBlob, result.mimeType);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "model",
              text:
                language === "hi"
                  ? "माइक बहुत जल्दी बंद हो गया। कृपया माइक दबाकर अपनी बात पूरी कहें।"
                  : "Recording was too short. Please tap the mic and speak your sentence.",
            },
          ]);
        }
      }
    } else {
      stop();
      await startRecording();
    }
  };

  const cleanSpeechText = (text: string) => {
    return text.replace(/[*#_~`]/g, "").replace(/\n+/g, " ").trim();
  };

  const processProfileResponse = async (data: any, userQueryText?: string) => {
    const updatedProfile: Partial<UserProfile> = data.merged_profile
      ? data.merged_profile
      : {
          ...profile,
          ...(data.extracted_profile_updates || {}),
        };

    setProfile(updatedProfile);
    if (Object.keys(updatedProfile).length > 0) {
      saveStoredUserProfile(updatedProfile);
    }

    if (data.target_scheme?.id) {
      setTargetSchemeId(data.target_scheme.id);
    }
    setNeedsDisambiguation(Boolean(data.needs_state_disambiguation));

    if (typeof data.potential_schemes_count === "number") {
      setPotentialCount(data.potential_schemes_count);
    }
    if (Array.isArray(data.pending_fields)) {
      setPendingFields(data.pending_fields);
    }

    // Update dynamic chips
    if (Array.isArray(data.suggested_chips)) {
      setSuggestedChips(data.suggested_chips);
    }

    const nextQuestion =
      data.next_question ||
      (language === "hi"
        ? "कृपया अपना अगला विवरण साझा करें:"
        : "Could you share your next detail?");

    const auditResult: EligibilityAuditResult | undefined =
      data.eligibility_audit || undefined;

    // Append model message first so user always sees acknowledgement/verdict
    setMessages((prev) => [
      ...prev,
      {
        role: "model",
        text: nextQuestion,
        auditResult,
      },
    ]);

    // STRICT COMPLETENESS GUARD:
    // NEVER dump schemes or unmount chat unless the authoritative state machine returned is_profile_complete === true
    if (data.is_profile_complete === true) {
      let finalMatches: SchemeMatch[] = Array.isArray(data.matched_schemes)
        ? data.matched_schemes
        : [];

      if (finalMatches.length === 0) {
        try {
          const matchRes = await fetch("/api/scheme-match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_profile: updatedProfile,
              language,
              query: userQueryText,
              target_scheme_id: data.target_scheme?.id || targetSchemeId,
            }),
          });
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            if (Array.isArray(matchData.matched_schemes)) {
              finalMatches = matchData.matched_schemes;
            }
          }
        } catch (err) {
          console.warn("Scheme match fallback error:", err);
        }
      }

      onProfileComplete(updatedProfile as UserProfile, finalMatches);
    }
  };

  const handleTurnError = (isTimeout = false) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "model",
        text: isTimeout
          ? language === "hi"
            ? "सर्वर पर अधिक लोड के कारण उत्तर में देरी हुई। कृपया नीचे दिए गए विकल्पों में से चुनें या दोबारा भेजें।"
            : "The server took too long to respond. Please choose a quick option below or try again."
          : language === "hi"
          ? "तकनीकी समस्या आई। कृपया अपनी बात दोबारा बताएं या नीचे से त्वरित विकल्प चुनें।"
          : "A technical issue occurred. Please repeat or choose an option below.",
      },
    ]);
  };

  const handleAudioSubmit = async (audioBlob: Blob, mimeType: string) => {
    if (inFlightRef.current || isProcessing) return;
    inFlightRef.current = true;
    setIsProcessing(true);

    const placeholderText =
      language === "hi"
        ? "🎙️ आवाज इनपुट (प्रोसेस हो रहा है...)"
        : "🎙️ Voice audio (processing...)";

    setMessages((prev) => [...prev, { role: "user", text: placeholderText }]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 14000);

        try {
          const base64Audio = reader.result as string;
          const storedKey = getStoredApiKey();
          const res = await fetch("/api/voice-process", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              ...(storedKey ? { "x-gemini-api-key": storedKey } : {}),
            },
            body: JSON.stringify({
              audio_base64: base64Audio,
              mime_type: mimeType || audioBlob.type || "audio/wav",
              conversation_history: messages,
              user_profile: profile,
              target_scheme_id: targetSchemeId,
              language,
              ...(storedKey ? { user_api_key: storedKey } : {}),
            }),
          });
          clearTimeout(timeoutId);

          if (!res.ok) throw new Error("Voice processing request failed");
          const data = await res.json();

          const finalTranscript =
            data.transcript && data.transcript.trim()
              ? data.transcript.trim()
              : language === "hi"
              ? "🎙️ आवाज संदेश"
              : "🎙️ Voice message";

          setMessages((prev) => {
            const copy = [...prev];
            const lastUserIdx = copy.map((m) => m.role).lastIndexOf("user");
            if (lastUserIdx !== -1) {
              copy[lastUserIdx] = { role: "user", text: finalTranscript };
            }
            return copy;
          });

          await processProfileResponse(data, finalTranscript);
        } catch (err: any) {
          clearTimeout(timeoutId);
          console.error("Audio API error:", err);
          setMessages((prev) => {
            const copy = [...prev];
            const lastUserIdx = copy.map((m) => m.role).lastIndexOf("user");
            if (lastUserIdx !== -1) {
              copy[lastUserIdx] = {
                role: "user",
                text: language === "hi" ? "🎙️ आवाज संदेश" : "🎙️ Voice message",
              };
            }
            return copy;
          });
          handleTurnError(err?.name === "AbortError");
        } finally {
          inFlightRef.current = false;
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      console.error("Audio read error:", err);
      handleTurnError();
      inFlightRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleUserSubmit = async (
    text: string,
    options: {
      forceComplete?: boolean;
      customProfile?: Partial<UserProfile>;
    } = {}
  ) => {
    const trimmed = text.trim();
    if (!trimmed || inFlightRef.current || isProcessing) return;
    inFlightRef.current = true;

    setPreviousSavedProfile(null);
    const newMessages: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(newMessages);
    setTypedInput("");
    setIsProcessing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    try {
      const storedKey = getStoredApiKey();
      const res = await fetch("/api/voice-process", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(storedKey ? { "x-gemini-api-key": storedKey } : {}),
        },
        body: JSON.stringify({
          transcript: trimmed,
          conversation_history: messages,
          user_profile: options.customProfile || profile,
          target_scheme_id: targetSchemeId,
          force_complete: Boolean(options.forceComplete),
          language,
          ...(storedKey ? { user_api_key: storedKey } : {}),
        }),
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error("Voice processing request failed");
      }

      const data = await res.json();
      await processProfileResponse(data, trimmed);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Error during voice interview turn:", err);
      handleTurnError(err?.name === "AbortError");
    } finally {
      inFlightRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleChipClick = (value: string) => {
    const cleanValue = value
      .replace(/^[📍🏛️🌾📚💼👷👩👨🛒🔍🎂💰🏷️🔑🇮🇳]\s*/u, "")
      .trim();
    if (cleanValue.toLowerCase().includes("api key") || cleanValue.includes("API Key")) {
      setIsKeyModalOpen(true);
      return;
    }
    if (
      cleanValue.includes("सभी उपयुक्त योजनाएं") ||
      cleanValue.toLowerCase().includes("discover all eligible")
    ) {
      setTargetSchemeId(null);
      handleUserSubmit(cleanValue);
      return;
    }
    if (cleanValue.includes("नई जांच शुरू") || cleanValue.toLowerCase().includes("start fresh")) {
      handleResetSession();
      return;
    }
    handleUserSubmit(cleanValue);
  };

  const capturedCount = PROGRESS_STEPS.filter((step) => {
    const val = (profile as Record<string, any>)[step.key];
    return step.key === "occupation"
      ? Array.isArray(val) && val.length > 0
      : val !== undefined && val !== null;
  }).length;
  const progressPercent = Math.round((capturedCount / PROGRESS_STEPS.length) * 100);
  const corePendingCount = pendingFields.filter((f) => f !== "category").length;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-3 sm:px-4 py-2">
      {/* Live Profile Progress Bar + Start Fresh Reset */}
      <div className="mb-3 p-3 bg-linear-to-r from-slate-50 via-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-2xl shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-900">
              {language === "hi" ? "प्रोफ़ाइल प्रगति" : "Profile Progress"}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {capturedCount} / {PROGRESS_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetSession}
            aria-label={language === "hi" ? "नया शुरू करें" : "Start Fresh"}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors min-h-[34px] shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{language === "hi" ? "नया शुरू करें" : "Start Fresh"}</span>
          </button>
        </div>

        {/* Visual Progress Track */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(progressPercent, 6)}%` }}
          />
        </div>

        {/* Step Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PROGRESS_STEPS.map((step) => {
            const val = (profile as Record<string, any>)[step.key];
            const isFilled =
              step.key === "occupation"
                ? Array.isArray(val) && val.length > 0
                : val !== undefined && val !== null;
            const isNcrPending = step.key === "state" && needsDisambiguation;

            let displayVal = "";
            if (isFilled) {
              if (step.key === "state") displayVal = `: ${String(val).toUpperCase()}`;
              else if (step.key === "age") displayVal = `: ${val}`;
              else if (step.key === "annual_income_inr")
                displayVal = `: ₹${Number(val).toLocaleString("en-IN")}`;
              else if (step.key === "occupation") displayVal = `: ${val.join(", ")}`;
              else displayVal = `: ${String(val)}`;
            }

            return (
              <span
                key={step.key}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                  isNcrPending
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : isFilled
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-white/70 text-slate-500 border-dashed border-slate-300"
                }`}
              >
                {isFilled ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                )}
                <span>
                  {language === "hi" ? step.labelHi : step.labelEn}
                  {displayVal}
                </span>
              </span>
            );
          })}
        </div>

        {/* Live Potential Match Preview Banner + Optional Manual Skip */}
        {potentialCount !== null && Object.keys(profile).length > 0 && !needsDisambiguation && (
          <div className="pt-1.5 border-t border-blue-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-semibold text-blue-900">
              {language === "hi"
                ? `🎯 ${potentialCount} संभावित योजनाएं — सटीक मिलान के लिए ${Math.max(1, corePendingCount)} सवाल शेष`
                : `🎯 ${potentialCount} potential schemes — answer ${Math.max(1, corePendingCount)} more detail(s) for exact results`}
            </span>
            <button
              type="button"
              onClick={handleManualShowSchemes}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <span>{language === "hi" ? "अभी योजनाएं दिखाएं" : "Show schemes now"}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Optional Saved Profile Restore Prompt (only before first message is sent) */}
      {previousSavedProfile && messages.length === 1 && (
        <div className="mb-3 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
          <span className="text-amber-950 font-medium">
            {language === "hi"
              ? "इस डिवाइस पर आपका पिछला विवरण सहेजा हुआ है।"
              : "A previous profile is saved on this device."}
          </span>
          <button
            type="button"
            onClick={handleLoadSavedProfile}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition-colors cursor-pointer"
          >
            {language === "hi" ? "पिछला लोड करें" : "Load Saved"}
          </button>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 min-h-[260px] max-h-[460px]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-3 max-w-[92%] sm:max-w-[88%] text-base shadow-sm transition-all ${
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
                    className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50 transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
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

              {/* Inline Eligibility Verdict Card */}
              {msg.auditResult && (
                <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs text-slate-800 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="font-bold text-slate-900 text-sm">
                      {language === "hi"
                        ? msg.auditResult.schemeName.hi
                        : msg.auditResult.schemeName.en}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] shrink-0 ${
                        msg.auditResult.verdict === "eligible"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : msg.auditResult.verdict === "not_eligible"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {msg.auditResult.verdict === "eligible"
                        ? language === "hi"
                          ? "✅ आप पात्र हैं"
                          : "✅ Eligible"
                        : msg.auditResult.verdict === "not_eligible"
                        ? language === "hi"
                          ? "❌ अभी पात्र नहीं"
                          : "❌ Not Eligible"
                        : language === "hi"
                        ? "⏳ जानकारी अधूरी"
                        : "⏳ Needs Info"}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed font-medium">
                    {language === "hi"
                      ? msg.auditResult.summary_hi
                      : msg.auditResult.summary_en}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {msg.auditResult.passedCriteria.length > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {msg.auditResult.passedCriteria.length}{" "}
                        {language === "hi" ? "शर्तें पूरी ✅" : "conditions met ✅"}
                      </span>
                    )}
                    {msg.auditResult.failedCriteria.length > 0 && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {msg.auditResult.failedCriteria.length}{" "}
                        {language === "hi" ? "शर्तें अधूरी ❌" : "gaps identified ❌"}
                      </span>
                    )}
                  </div>

                  {msg.auditResult.verdict === "not_eligible" &&
                    msg.auditResult.alternativeSchemes.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200/80">
                        <p className="text-[11px] font-bold text-slate-700 mb-1">
                          {language === "hi"
                            ? "💡 आपके लिए अन्य उपयुक्त योजनाएं:"
                            : "💡 Alternative options:"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.auditResult.alternativeSchemes.map((alt, aIdx) => (
                            <Link
                              key={aIdx}
                              href={`/schemes/${alt.scheme.id}`}
                              className="text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2 py-0.5 hover:bg-blue-100 transition-colors"
                            >
                              {language === "hi" ? alt.scheme.name.hi : alt.scheme.name.en} →
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
                    <Link
                      href={`/schemes/${msg.auditResult.schemeId}#eligibility-check`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span>
                        {language === "hi"
                          ? "विस्तृत रिपोर्ट व आवेदन देखें"
                          : "View Full Audit & Apply"}
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-xs flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600">
                {language === "hi"
                  ? "लोकसाथी विश्लेषण कर रहा है..."
                  : "LokSaathi is thinking..."}
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
              {language === "hi"
                ? "त्वरित विकल्प (टैप करें):"
                : "Quick suggestions (tap to send):"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="min-h-[38px] text-xs font-medium bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-800 border border-slate-300 hover:border-blue-400 rounded-full px-3.5 py-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notice if mic error */}
      {micError && (
        <div className="mb-2 p-2.5 text-xs bg-amber-50 text-amber-900 border border-amber-200 rounded-xl">
          {micError}
        </div>
      )}

      {/* Voice Hero CTA Button + Typed Fallback Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isProcessing}
            aria-label={
              isRecording
                ? "माइक बंद करें (Stop mic)"
                : "बोलें (Tap to speak into microphone)"
            }
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md cursor-pointer ${
              isRecording
                ? "bg-red-500 text-white animate-pulse ring-4 ring-red-200 scale-105"
                : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
            }`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserSubmit(typedInput);
            }}
            className="flex-1 flex items-center gap-2 min-w-0"
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
              className="flex-1 min-w-0 border border-slate-300 rounded-xl px-3.5 py-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!typedInput.trim() || isProcessing}
              aria-label="भेजें (Send message)"
              className="min-w-[44px] min-h-[44px] p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
    </div>
  );
}
