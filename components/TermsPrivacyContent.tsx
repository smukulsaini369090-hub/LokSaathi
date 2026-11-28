"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Volume2,
  Square,
  AlertTriangle,
  PhoneCall,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { TERMS_CONTENT, PRIVACY_CONTENT } from "@/lib/legal-content";
import { eraseAllLocalUserData } from "@/lib/preferences";

export function TermsContent() {
  const { language } = useLanguage();
  const { speak, stop, isPlaying, isSupported, prewarmTTS } = useSpeechSynthesis();
  const t = TERMS_CONTENT[language];

  const handleListen = () => {
    prewarmTTS();
    if (isPlaying) {
      stop();
    } else {
      speak(t.audioSummary, language);
    }
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === "hi" ? "होम पर जाएं" : "Back to Home"}</span>
        </Link>

        {isSupported && (
          <button
            type="button"
            onClick={handleListen}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
          >
            {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isPlaying ? (language === "hi" ? "रोकें" : "Stop") : (language === "hi" ? "सारांश सुनें" : "Listen")}</span>
          </button>
        )}
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 space-y-2 shadow-md">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/25 text-blue-100 border border-blue-400/30">
          <FileText className="w-3.5 h-3.5" />
          <span>{t.badge}</span>
        </span>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">{t.title}</h1>
        <p className="text-sm text-blue-100 leading-relaxed">{t.subtitle}</p>
        <p className="text-xs text-blue-300 font-medium pt-1">{t.lastUpdated}</p>
      </div>

      <div className="space-y-4">
        {t.sections.map((sec) => (
          <section key={sec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2.5">
            <h2 className="text-base font-extrabold text-slate-900">{sec.title}</h2>
            <ul className="space-y-2 text-sm text-slate-700 leading-relaxed list-disc list-inside">
              {sec.points.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* National Cyber Crime Helpline 1930 Callout */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-2">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h2 className="text-sm font-extrabold text-rose-950">{t.fraudCalloutTitle}</h2>
            <p className="text-sm text-rose-900 leading-relaxed">{t.fraudCalloutBody}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="tel:1930"
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{language === "hi" ? "1930 हेल्पलाइन कॉल करें" : "Call 1930 Cyber Helpline"}</span>
              </a>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold"
              >
                cybercrime.gov.in ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Grievance & Outdated Rule Reporting */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-1.5">
        <h2 className="text-sm font-extrabold text-blue-950">{t.grievanceTitle}</h2>
        <p className="text-sm text-blue-900 leading-relaxed">{t.grievanceBody}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-bold pt-1">
        <Link href="/privacy" className="text-blue-700 hover:underline min-h-[44px] inline-flex items-center">
          {language === "hi" ? "गोपनीयता व DPDP सूचना पढ़ें →" : "Read Privacy & DPDP Notice →"}
        </Link>
        <Link href="/help" className="text-slate-700 hover:underline min-h-[44px] inline-flex items-center">
          {language === "hi" ? "मदद व अनुमति सेटिंग्स →" : "Help & Permission Settings →"}
        </Link>
      </div>
    </div>
  );
}

export function PrivacyContent() {
  const { language } = useLanguage();
  const { speak, stop, isPlaying, isSupported, prewarmTTS } = useSpeechSynthesis();
  const [erased, setErased] = useState(false);
  const t = PRIVACY_CONTENT[language];

  const handleListen = () => {
    prewarmTTS();
    if (isPlaying) {
      stop();
    } else {
      speak(t.audioSummary, language);
    }
  };

  const handleErase = async () => {
    await eraseAllLocalUserData();
    setErased(true);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === "hi" ? "होम पर जाएं" : "Back to Home"}</span>
        </Link>

        {isSupported && (
          <button
            type="button"
            onClick={handleListen}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer"
          >
            {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isPlaying ? (language === "hi" ? "रोकें" : "Stop") : (language === "hi" ? "सारांश सुनें" : "Listen")}</span>
          </button>
        )}
      </div>

      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 space-y-2 shadow-md">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/25 text-emerald-100 border border-emerald-400/30">
          <Lock className="w-3.5 h-3.5" />
          <span>{t.badge}</span>
        </span>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">{t.title}</h1>
        <p className="text-sm text-emerald-100 leading-relaxed">{t.subtitle}</p>
        <p className="text-xs text-emerald-300 font-medium pt-1">{t.lastUpdated}</p>
      </div>

      <div className="space-y-4">
        {t.sections.map((sec) => (
          <section key={sec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2.5">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sec.title}</span>
            </h2>
            <ul className="space-y-2 text-sm text-slate-700 leading-relaxed list-disc list-inside">
              {sec.points.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* DPDP Right to Erasure Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 border border-slate-800">
        <h2 className="text-base font-extrabold">{t.eraseTitle}</h2>
        <p className="text-sm text-slate-300 leading-relaxed">{t.eraseSubtitle}</p>

        {erased ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-sm font-bold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{t.eraseDone}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleErase}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{t.eraseButton}</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-bold pt-1">
        <Link href="/terms" className="text-blue-700 hover:underline min-h-[44px] inline-flex items-center">
          {language === "hi" ? "नियम एवं शर्तें पढ़ें →" : "Read Terms & Conditions →"}
        </Link>
        <Link href="/help#permissions" className="text-slate-700 hover:underline min-h-[44px] inline-flex items-center">
          {language === "hi" ? "अनुमति सेटिंग्स बदलें →" : "Manage Permissions →"}
        </Link>
      </div>
    </div>
  );
}
