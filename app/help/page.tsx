"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Mic,
  Camera,
  Download,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  ExternalLink,
  RotateCcw,
  WifiOff,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { getDeviceInfo, type OperatingSystem, type DeviceInfo } from "@/lib/device-detect";
import { HELP_CONTENT, OS_SETUP_GUIDES } from "@/lib/i18n";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { OnboardingGuide, ONBOARDING_STORAGE_KEY } from "@/components/OnboardingGuide";

export default function HelpCenterPage() {
  const { language } = useLanguage();
  const { speak, stop, isPlaying, isSupported, prewarmTTS } = useSpeechSynthesis();

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [selectedOS, setSelectedOS] = useState<OperatingSystem>("android");
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Diagnostic states
  const [mediaCheckStatus, setMediaCheckStatus] = useState<"untested" | "testing" | "allowed" | "blocked">("untested");
  const [mediaErrorMsg, setMediaErrorMsg] = useState<string | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<"checking" | "ready" | "notReady">("checking");
  const [ttsVoiceStatus, setTtsVoiceStatus] = useState<"checking" | "hasHindi" | "missingHindi">("checking");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const t = HELP_CONTENT[language];

  // Initialize device detection on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const info = getDeviceInfo();
    setDeviceInfo(info);
    if (info.os !== "unknown") {
      setSelectedOS(info.os);
    }

    // Check offline storage capability
    try {
      localStorage.setItem("__loksaathi_test", "1");
      localStorage.removeItem("__loksaathi_test");
      setOfflineStatus("ready");
    } catch {
      setOfflineStatus("notReady");
    }

    // Check available TTS voices
    if ("speechSynthesis" in window) {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const hasHi = voices.some((v) => v.lang.startsWith("hi") || v.lang.includes("IN"));
        setTtsVoiceStatus(hasHi ? "hasHindi" : "missingHindi");
      };

      checkVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = checkVoices;
      }
    } else {
      setTtsVoiceStatus("missingHindi");
    }
  }, []);

  const handleTestMediaPermissions = async () => {
    setMediaCheckStatus("testing");
    setMediaErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMediaCheckStatus("blocked");
        setMediaErrorMsg("Browser does not support mediaDevices API");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Release hardware streams immediately after successful test
      stream.getTracks().forEach((track) => track.stop());
      setMediaCheckStatus("allowed");
    } catch (err: any) {
      console.warn("Media permission test rejected:", err);
      setMediaCheckStatus("blocked");
      setMediaErrorMsg(err?.message || "Permission denied");
    }
  };

  const handleTestAudio = () => {
    prewarmTTS();
    if (isPlaying) {
      stop();
    } else {
      const sampleSentence =
        language === "hi"
          ? "नमस्ते! लोकसाथी की आवाज प्रणाली ठीक से काम कर रही है।"
          : "Hello! LokSaathi audio playback is working perfectly.";
      speak(sampleSentence, language);
    }
  };

  const handleReplayTour = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {}
    setIsOnboardingOpen(true);
  };

  const guideKey = selectedOS === "unknown" ? "android" : selectedOS;
  const currentOSGuide = OS_SETUP_GUIDES[guideKey as keyof typeof OS_SETUP_GUIDES] || OS_SETUP_GUIDES.android;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Page Title & Intro */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{language === "hi" ? "मदद व मार्गदर्शन" : "Help & Diagnostics"}</span>
            </span>

            <button
              type="button"
              onClick={handleReplayTour}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.tourButton}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            {t.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-lg">
            {t.pageSubtitle}
          </p>

          {/* Detected Device Badge */}
          {deviceInfo && (
            <div className="pt-2 flex items-center gap-2 text-xs">
              <span className="text-blue-300 font-semibold">{t.detectedOSBanner}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === "hi" ? deviceInfo.osNameHi : deviceInfo.osName}</span>
                <span className="text-[10px] text-blue-200">({deviceInfo.browserName})</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Panel 1: Interactive Live Device Readiness Test */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>{t.readinessTitle}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">{t.readinessDesc}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* 1. PWA Install Status */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Download className="w-4 h-4 text-blue-600" />
                <span>{t.tests.pwa.title}</span>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  deviceInfo?.isStandalonePWA ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
            </div>
            <p className="text-xs text-slate-700 font-medium">
              {deviceInfo?.isStandalonePWA ? t.tests.pwa.installed : t.tests.pwa.notInstalled}
            </p>
          </div>

          {/* 2. Media Permissions Test */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>{t.tests.media.title}</span>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  mediaCheckStatus === "allowed"
                    ? "bg-emerald-500"
                    : mediaCheckStatus === "blocked"
                    ? "bg-red-500"
                    : "bg-slate-300"
                }`}
              />
            </div>

            {mediaCheckStatus === "allowed" ? (
              <p className="text-xs text-emerald-700 font-bold">{t.tests.media.allowed}</p>
            ) : mediaCheckStatus === "blocked" ? (
              <p className="text-xs text-red-700 font-bold">{t.tests.media.blocked}</p>
            ) : (
              <button
                type="button"
                onClick={handleTestMediaPermissions}
                disabled={mediaCheckStatus === "testing"}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors shadow-sm min-h-[40px]"
              >
                {mediaCheckStatus === "testing" ? t.tests.media.testing : t.tests.media.button}
              </button>
            )}
          </div>

          {/* 3. Audio & TTS Test */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>{t.tests.audio.title}</span>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isPlaying ? "bg-amber-500 animate-ping" : isSupported ? "bg-emerald-500" : "bg-red-400"
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleTestAudio}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-sm min-h-[40px] flex items-center justify-center gap-1.5 ${
                isPlaying
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-300"
              }`}
            >
              {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
              <span>{isPlaying ? t.tests.audio.playing : t.tests.audio.button}</span>
            </button>
          </div>

          {/* 4. Offline Storage Check */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <WifiOff className="w-4 h-4 text-slate-600" />
                <span>{t.tests.offline.title}</span>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  offlineStatus === "ready" ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
            </div>
            <p className="text-xs text-slate-700 font-medium">
              {offlineStatus === "ready" ? t.tests.offline.ready : t.tests.offline.notReady}
            </p>
          </div>
        </div>
      </div>

      {/* Panel 2: Cross-OS Setup Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            {t.osTabsTitle}
          </h2>
        </div>

        {/* OS Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {(["android", "ios", "windows", "macos", "linux"] as OperatingSystem[]).map((osKey) => {
            const isCurrentOS = deviceInfo?.os === osKey;
            const isTabActive = selectedOS === osKey;
            return (
              <button
                key={osKey}
                type="button"
                onClick={() => setSelectedOS(osKey)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 min-h-[44px] ${
                  isTabActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {osKey === "android" || osKey === "ios" ? (
                  <Smartphone className="w-3.5 h-3.5" />
                ) : (
                  <Laptop className="w-3.5 h-3.5" />
                )}
                <span className="capitalize">{osKey}</span>
                {isCurrentOS && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${
                      isTabActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    You
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected OS Content */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            {currentOSGuide.title[language]}
          </h3>

          {/* 1. PWA Install Steps */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === "hi" ? "ऐप इंस्टॉल करने के कदम:" : "How to Install as App:"}</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {currentOSGuide.pwaSteps[language].map((step: string, idx: number) => (
                <li key={idx} className="leading-relaxed">
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 2. Permission Steps */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "hi" ? "माइक व कैमरा अनुमति अनलॉक करने के कदम:" : "How to Unlock Mic & Camera:"}</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {currentOSGuide.permSteps[language].map((step: string, idx: number) => (
                <li key={idx} className="leading-relaxed">
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 3. Audio / TTS Steps */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === "hi" ? "हिंदी आवाज (Audio) चालू करने के कदम:" : "How to Enable Hindi Voice:"}</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {currentOSGuide.ttsSteps[language].map((step: string, idx: number) => (
                <li key={idx} className="leading-relaxed">
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Panel 3: Optional Free BYOK API Key Guide */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-sm sm:text-base">{t.byok.title}</h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
            {t.byok.badge}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{t.byok.subtitle}</p>

        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-200 bg-white/5 p-3.5 rounded-2xl border border-white/10">
          {t.byok.steps.map((st, idx) => (
            <li key={idx} className="leading-relaxed">
              <span>{st}</span>
            </li>
          ))}
        </ol>

        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm text-center min-h-[44px]"
          >
            {t.byok.openModalBtn}
          </button>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-all text-center flex items-center justify-center gap-1 min-h-[44px]"
          >
            <span>aistudio.google.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Panel 4: Troubleshooting FAQ Accordion */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
          {language === "hi" ? "अक्सर पूछे जाने वाले सवाल (FAQs)" : "Frequently Asked Questions"}
        </h2>

        <div className="space-y-2.5">
          {t.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-100/80 transition-colors min-h-[48px]"
                  aria-expanded={isOpen}
                >
                  <span className="leading-snug">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating API Key Modal */}
      <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />

      {/* Onboarding Guide Modal */}
      <OnboardingGuide forceOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
    </div>
  );
}
