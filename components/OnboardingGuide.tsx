"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  CheckCircle2,
  Search,
  Bot,
  FileText,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { ONBOARDING_CONTENT } from "@/lib/i18n";
import { getDeviceInfo } from "@/lib/device-detect";
import { PermissionsPreferencesPanel } from "@/components/PermissionsPreferencesPanel";
import { savePreferenceUpdate } from "@/lib/preferences";

export const ONBOARDING_STORAGE_KEY = "loksaathi_onboarding_v1_done";

interface OnboardingGuideProps {
  forceOpen?: boolean;
  autoOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingGuide({
  forceOpen = false,
  autoOpen = true,
  onClose,
}: OnboardingGuideProps) {
  const { language, setLanguage } = useLanguage();
  const { speak, stop, isPlaying, isSupported, prewarmTTS } = useSpeechSynthesis();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const content = ONBOARDING_CONTENT[language];
  const steps = content.steps;
  const currentStepData = steps[currentStep];

  // Check whether to open automatically on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    setDeviceInfo(getDeviceInfo());

    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (!autoOpen) return;

    let hasCompleted = false;
    try {
      hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
    } catch {
      hasCompleted = false;
    }
    if (!hasCompleted) {
      // Small delay for smooth entry after page hydration
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [forceOpen, autoOpen]);

  // Listen for global custom events only on the primary global (autoOpen) instance
  useEffect(() => {
    if (!autoOpen) return;

    const handleReplay = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    const handleOpenPermissions = () => {
      setCurrentStep(3);
      setIsOpen(true);
    };
    window.addEventListener("loksaathi_open_onboarding", handleReplay);
    window.addEventListener("loksaathi_open_permissions", handleOpenPermissions);
    return () => {
      window.removeEventListener("loksaathi_open_onboarding", handleReplay);
      window.removeEventListener("loksaathi_open_permissions", handleOpenPermissions);
    };
  }, [autoOpen]);

  // WCAG Modal focus entry + focus restoration on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      dialogRef.current?.focus();
    } else if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Stop speech synthesis when step changes or modal closes
  useEffect(() => {
    stop();
  }, [currentStep, isOpen, stop]);

  const handleComplete = useCallback(() => {
    stop();
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {}
    savePreferenceUpdate({ legal_acknowledged: true });
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("loksaathi_onboarding_completed"));
    }
    if (onClose) onClose();
  }, [stop, onClose]);

  const handleSkip = useCallback(() => {
    stop();
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {}
    savePreferenceUpdate({ legal_acknowledged: true });
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("loksaathi_onboarding_completed"));
    }
    if (onClose) onClose();
  }, [stop, onClose]);

  // Handle keyboard navigation (Escape, Tab focus trap, ArrowLeft/Right)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      } else if (e.key === "ArrowRight") {
        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep, steps.length, handleSkip]);

  const handleAudioToggle = () => {
    prewarmTTS();
    if (isPlaying) {
      stop();
    } else {
      speak(currentStepData.audioText, language);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              लो
            </span>
            <span className="text-xs font-bold text-slate-800">
              {language === "hi" ? "मार्गदर्शिका व अनुमतियाँ" : "Setup & Permissions"}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              • {content.stepCount} {currentStep + 1} / {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio "Suno" button */}
            {isSupported && (
              <button
                type="button"
                onClick={handleAudioToggle}
                className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isPlaying
                    ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                }`}
                title={isPlaying ? content.stop : content.listen}
                aria-label={isPlaying ? content.stop : content.listen}
              >
                {isPlaying ? <VolumeX className="w-3.5 h-3.5 text-amber-700" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isPlaying ? content.stop : content.listen}</span>
              </button>
            )}

            {/* Clear Non-Blocking Skip Button (min 44px touch target) */}
            <button
              type="button"
              onClick={handleSkip}
              className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-full transition-colors cursor-pointer"
              aria-label={language === "hi" ? "अभी छोड़ें" : "Skip for Now"}
            >
              <span>{language === "hi" ? "छोड़ें" : "Skip"}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Card Step Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              <Sparkles className="w-3 h-3 text-blue-600" />
              {currentStepData.badge}
            </span>

            {/* Step 1 Language toggle right inside card */}
            {currentStep === 0 && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    language === "hi" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    language === "en" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
              </div>
            )}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h2 id="onboarding-step-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {currentStepData.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              {currentStepData.subtitle}
            </p>
          </div>

          {/* Step 1: Welcome Body */}
          {currentStep === 0 && (
            <div className="space-y-3 pt-2">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 space-y-2.5">
                {currentStepData.bulletPoints?.map((pt: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 text-center leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                {language === "hi"
                  ? "लोकसाथी एक स्वतंत्र नागरिक सहायता मंच है (सरकारी विभाग नहीं)।"
                  : "LokSaathi is an independent citizen helper (not a government department)."}{" "}
                <Link href="/terms" onClick={handleSkip} className="font-bold text-blue-700 hover:underline">
                  {language === "hi" ? "नियम" : "Terms"}
                </Link>{" "}
                •{" "}
                <Link href="/privacy" onClick={handleSkip} className="font-bold text-blue-700 hover:underline">
                  {language === "hi" ? "गोपनीयता (DPDP)" : "Privacy"}
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Schemes Discovery Body */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 gap-3 pt-1">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>{currentStepData.card1?.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {currentStepData.card1?.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  {currentStepData.card1?.desc}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>{currentStepData.card2?.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {currentStepData.card2?.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  {currentStepData.card2?.desc}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Document & Form Helper Body */}
          {currentStep === 2 && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                    <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>{currentStepData.card1?.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {currentStepData.card1?.desc}
                  </p>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{currentStepData.card2?.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {currentStepData.card2?.desc}
                  </p>
                </div>
              </div>

              {/* Privacy highlight banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{currentStepData.privacyNote}</span>
              </div>
            </div>
          )}

          {/* Step 4: Non-Blocking Device Permissions & Preferences Setup */}
          {currentStep === 3 && (
            <div className="space-y-3 pt-1">
              <PermissionsPreferencesPanel compact />

              {deviceInfo && (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{language === "hi" ? deviceInfo.osNameHi : deviceInfo.osName}</span>
                  </span>
                  <span className="text-[11px] font-bold">
                    {deviceInfo.isStandalonePWA ? "✅ Installed App" : "🌐 Browser"}
                  </span>
                </div>
              )}

              <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                {language === "hi"
                  ? "आप कभी भी नीचे से सेटिंग बदल सकते हैं। विवरण:"
                  : "Change anytime in Footer or Help. Read:"}{" "}
                <Link href="/terms" onClick={handleComplete} className="font-bold text-blue-700 hover:underline">
                  {language === "hi" ? "नियम एवं शर्तें" : "Terms"}
                </Link>{" "}
                •{" "}
                <Link href="/privacy" onClick={handleComplete} className="font-bold text-blue-700 hover:underline">
                  {language === "hi" ? "गोपनीयता सूचना" : "Privacy"}
                </Link>
              </p>

              <Link
                href="/help"
                onClick={handleComplete}
                className="min-h-[44px] inline-flex items-center justify-center gap-1 w-full py-2.5 px-4 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
              >
                <span>{currentStepData.helpLinkText}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-3">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5" role="group" aria-label={language === "hi" ? "चरण संकेतक" : "Step indicators"}>
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? "w-6 bg-blue-600" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`${content.stepCount} ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors min-h-[44px]"
              >
                {content.back}
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all min-h-[44px]"
            >
              <span>{currentStep === steps.length - 1 ? content.finish : content.next}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
