"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Mic,
  MapPin,
  Volume2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import {
  PREFERENCES_UPDATED_EVENT,
  getDefaultPreferences,
  getStoredPreferences,
  queryPassivePermissionState,
  requestMicrophonePermission,
  requestLocationPermission,
  enableOfflineAndTTSPreference,
  markPreferenceLater,
  resetPermissionPreferences,
  eraseAllLocalUserData,
  type LokSaathiPreferences,
  type PermissionChoice,
  type PermissionKey,
} from "@/lib/preferences";
import { prewarmTTS } from "@/lib/tts";

interface PermissionsPreferencesPanelProps {
  compact?: boolean;
  showResetControls?: boolean;
  onPreferenceChange?: (prefs: LokSaathiPreferences) => void;
}

interface CapabilitySpec {
  key: PermissionKey;
  icon: React.ComponentType<{ className?: string }>;
  iconColorClass: string;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
  fallbackNoteHi: string;
  fallbackNoteEn: string;
}

const CAPABILITIES: CapabilitySpec[] = [
  {
    key: "mic",
    icon: Mic,
    iconColorClass: "text-blue-600",
    titleHi: "आवाज़ और माइक्रोफ़ोन",
    titleEn: "Voice & Microphone",
    descHi: "टाइप करने के बजाय बोलकर अपनी पात्रता पूछें।",
    descEn: "Speak naturally to check schemes instead of typing.",
    fallbackNoteHi: "'अभी नहीं' चुनने पर भी त्वरित बटन (चिप्स) और टाइपिंग 100% चलेंगे।",
    fallbackNoteEn: "Choosing Not Now keeps quick-tap chips and typing 100% usable.",
  },
  {
    key: "location",
    icon: MapPin,
    iconColorClass: "text-indigo-600",
    titleHi: "नज़दीकी सेवा केंद्र लोकेशन",
    titleEn: "Nearby Service Center Location",
    descHi: "पास के CFC, सरल केंद्र, जन सेवा केंद्र या CSC खोजने के लिए।",
    descEn: "Helps locate nearby CFC, Saral Kendra, Jan Seva Kendra, or CSC.",
    fallbackNoteHi: "मना करने पर भी आप अपना राज्य और दिल्ली NCR खुद चुन सकते हैं।",
    fallbackNoteEn: "Skipping still lets you choose your State / Delhi NCR manually.",
  },
  {
    key: "offline_tts",
    icon: Volume2,
    iconColorClass: "text-emerald-600",
    titleHi: "ऑफ़लाइन पैक और सुनें (Audio)",
    titleEn: "Offline Access & Voice Readout",
    descHi: "सहेजी योजनाएं बिना इंटरनेट देखने और नियम बोलकर सुनने के लिए।",
    descEn: "Saves offline guides on your phone and enables read-aloud audio.",
    fallbackNoteHi: "ऑफ़लाइन न चुनने पर भी सारी योजनाएं ऑनलाइन उपलब्ध रहेंगी।",
    fallbackNoteEn: "All 519 schemes remain browsable online if skipped.",
  },
];

function getChoiceBadge(choice: PermissionChoice, lang: "hi" | "en") {
  switch (choice) {
    case "allowed":
      return {
        label: lang === "hi" ? "सक्रिय (Allowed)" : "Allowed",
        classes: "bg-emerald-100 text-emerald-900 border-emerald-300",
      };
    case "later":
      return {
        label: lang === "hi" ? "अभी नहीं (Skipped)" : "Not Now",
        classes: "bg-slate-100 text-slate-700 border-slate-300",
      };
    case "denied":
      return {
        label: lang === "hi" ? "ब्राउज़र से अवरुद्ध" : "Blocked in Browser",
        classes: "bg-amber-100 text-amber-900 border-amber-300",
      };
    case "unsupported":
      return {
        label: lang === "hi" ? "डिवाइस पर उपलब्ध नहीं" : "Not Supported Here",
        classes: "bg-amber-50 text-amber-900 border-amber-200",
      };
    default:
      return {
        label: lang === "hi" ? "चयन बाकी" : "Not Set",
        classes: "bg-blue-50 text-blue-800 border-blue-200",
      };
  }
}

export function PermissionsPreferencesPanel({
  compact = false,
  showResetControls = false,
  onPreferenceChange,
}: PermissionsPreferencesPanelProps) {
  const { language } = useLanguage();
  const [prefs, setPrefs] = useState<LokSaathiPreferences>(() => getDefaultPreferences());
  const [busyKey, setBusyKey] = useState<PermissionKey | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const syncFromStorage = useCallback(async () => {
    const stored = getStoredPreferences();
    setPrefs(stored);

    // Passive read-only browser state sync (NEVER prompts user)
    if (stored.mic === "allowed" || stored.mic === "unset") {
      const passiveMic = await queryPassivePermissionState("microphone");
      if (passiveMic === "denied") {
        setPrefs((prev) => ({ ...prev, mic: "denied" }));
      }
    }
    if (stored.location === "allowed" || stored.location === "unset") {
      const passiveLoc = await queryPassivePermissionState("geolocation");
      if (passiveLoc === "denied") {
        setPrefs((prev) => ({ ...prev, location: "denied" }));
      }
    }
  }, []);

  useEffect(() => {
    syncFromStorage();
    const onUpdate = () => {
      setPrefs(getStoredPreferences());
    };
    window.addEventListener(PREFERENCES_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(PREFERENCES_UPDATED_EVENT, onUpdate);
  }, [syncFromStorage]);

  const handleAllow = async (key: PermissionKey) => {
    setBusyKey(key);
    setStatusFeedback(null);
    try {
      if (key === "mic") {
        await requestMicrophonePermission();
      } else if (key === "location") {
        await requestLocationPermission();
      } else {
        prewarmTTS();
        enableOfflineAndTTSPreference();
      }
      const next = getStoredPreferences();
      setPrefs(next);
      onPreferenceChange?.(next);
    } finally {
      setBusyKey(null);
    }
  };

  const handleNotNow = (key: PermissionKey) => {
    setStatusFeedback(null);
    const next = markPreferenceLater(key);
    setPrefs(next);
    onPreferenceChange?.(next);
  };

  const handleResetPrefs = () => {
    const next = resetPermissionPreferences();
    setPrefs(next);
    onPreferenceChange?.(next);
    setStatusFeedback(
      language === "hi"
        ? "✅ अनुमति सेटिंग्स रीसेट हो गईं। अब आप फिर से 'अनुमति दें' या 'अभी नहीं' चुन सकते हैं।"
        : "✅ Permission preferences reset. You can re-select Allow or Not Now anytime."
    );
  };

  const handleEraseAll = async () => {
    await eraseAllLocalUserData();
    const next = getDefaultPreferences();
    setPrefs(next);
    onPreferenceChange?.(next);
    setStatusFeedback(
      language === "hi"
        ? "✅ इस डिवाइस से सारा सहेजा गया डेटा और प्राथमिकताएं मिटा दी गई हैं।"
        : "✅ All locally saved schemes, profile details, and preferences were erased."
    );
  };

  return (
    <div className="space-y-3">
      {CAPABILITIES.map((cap) => {
        const Icon = cap.icon;
        const choice = prefs[cap.key];
        const badge = getChoiceBadge(choice, language);
        const isBusy = busyKey === cap.key;

        return (
          <div
            key={cap.key}
            className={`rounded-2xl border transition-colors ${
              choice === "allowed"
                ? "bg-emerald-50/50 border-emerald-200"
                : choice === "denied" || choice === "unsupported"
                ? "bg-amber-50/40 border-amber-200"
                : "bg-slate-50 border-slate-200"
            } ${compact ? "p-3.5" : "p-4"} space-y-2.5`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className={`w-4 h-4 ${cap.iconColorClass}`} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {language === "hi" ? cap.titleHi : cap.titleEn}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-0.5">
                    {language === "hi" ? cap.descHi : cap.descEn}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {language === "hi" ? cap.fallbackNoteHi : cap.fallbackNoteEn}
                  </p>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${badge.classes}`}
              >
                {badge.label}
              </span>
            </div>

            {(choice === "denied" || choice === "unsupported") && (
              <div className="text-xs text-amber-950 bg-amber-100/70 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span>
                    {choice === "unsupported"
                      ? language === "hi"
                        ? "आपका ब्राउज़र इस सुविधा को सपोर्ट नहीं करता — आप बिना रुकावट लिखकर या त्वरित बटन चुनकर आगे बढ़ सकते हैं।"
                        : "Your browser does not support this feature — typing and quick-tap chips remain 100% functional."
                      : language === "hi"
                      ? "ब्राउज़र ने अनुमति रोकी है। इसे चालू करने के लिए एड्रेस बार के 🔒 आइकॉन पर टैप करें, या नीचे 'अभी नहीं' चुनकर सामान्य रूप से जारी रखें।"
                      : "Browser blocked this permission. Tap the 🔒 icon in your address bar to allow, or continue smoothly without it."}
                  </span>{" "}
                  {!compact && choice === "denied" && (
                    <Link href="/help" className="underline font-bold">
                      {language === "hi" ? "सेटअप गाइड देखें" : "View OS Steps"}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Equal-prominence non-coercive Allow / Not Now actions (min 48px touch targets) */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => handleAllow(cap.key)}
                disabled={isBusy}
                aria-pressed={choice === "allowed"}
                className={`min-h-[48px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  choice === "allowed"
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                    : "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs"
                } disabled:opacity-60`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isBusy
                    ? language === "hi"
                      ? "जांच जारी..."
                      : "Checking..."
                    : choice === "allowed"
                    ? language === "hi"
                      ? "अनुमति प्राप्त"
                      : "Allowed ✓"
                    : language === "hi"
                    ? "अनुमति दें"
                    : "Allow"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNotNow(cap.key)}
                disabled={isBusy}
                aria-pressed={choice === "later"}
                className={`min-h-[48px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  choice === "later"
                    ? "bg-slate-800 text-white border-slate-900"
                    : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>{language === "hi" ? "अभी नहीं" : "Not Now"}</span>
              </button>
            </div>
          </div>
        );
      })}

      {showResetControls && (
        <div className="pt-2 space-y-2.5 border-t border-slate-200">
          {statusFeedback && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900"
            >
              {statusFeedback}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleResetPrefs}
              className="min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>
                {language === "hi"
                  ? "अनुमति सेटिंग्स रीसेट करें"
                  : "Reset Local Preferences"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleEraseAll}
              className="min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>
                {language === "hi"
                  ? "सारा लोकल डेटा मिटाएं (DPDP)"
                  : "Erase All Local Data (DPDP)"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
