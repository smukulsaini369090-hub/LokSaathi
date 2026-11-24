"use client";

import React from "react";
import Link from "next/link";
import { Search, FileText, Bookmark, Mic, Sparkles, Volume2, Square, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

export default function HomePage() {
  const { language } = useLanguage();
  const { speak, stop, isPlaying } = useSpeechSynthesis();

  const welcomeText =
    language === "hi"
      ? "लोकसाथी में आपका स्वागत है। आप अपनी आवाज़ में बोलकर जान सकते हैं कि आप और आपका परिवार किन सरकारी योजनाओं के पात्र हैं, या किसी भी सरकारी कागज़ या नोटिस की फोटो खींचकर उसका सरल अर्थ समझ सकते हैं।"
      : "Welcome to LokSaathi. Speak in your natural language to discover which government schemes you and your family qualify for, or photograph any government notice or form to understand it easily.";

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>
              {language === "hi"
                ? "निःशुल्क सरकारी योजना सहायक"
                : "Free Government Scheme Helper"}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight mb-2 leading-tight">
            {language === "hi"
              ? "आपके हक़ की योजनाएं, अब आपकी भाषा में।"
              : "Government Schemes You Deserve, in Your Language."}
          </h1>

          <p className="text-blue-100 text-sm leading-relaxed mb-4">
            {language === "hi"
              ? "केंद्र सरकार, उत्तर प्रदेश, हरियाणा और दिल्ली की योजनाओं की सही जानकारी।"
              : "Verified schemes from Central Government, Uttar Pradesh, Haryana, and Delhi."}
          </p>

          <button
            type="button"
            onClick={() => (isPlaying ? stop() : speak(welcomeText, language))}
            aria-label={isPlaying ? "रोकें" : "बोलकर सुनें"}
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current text-red-500" />
                <span>{language === "hi" ? "आवाज रोकें" : "Stop Voice"}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{language === "hi" ? "🔊 बोलकर सुनें" : "🔊 Listen in Voice"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Large Primary Hero Action Cards */}
      <div className="space-y-4">
        {/* Card 1: Scheme Discovery */}
        <Link
          href="/schemes"
          className="group block bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-[0.99] relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Search className="w-7 h-7" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {language === "hi" ? "योजना खोजें" : "Find Schemes"}
                </h2>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {language === "hi"
                  ? "बोलकर या चुनकर जानें कि आप किन-किन योजनाओं के पात्र हैं।"
                  : "Speak or select your details to find verified schemes you qualify for."}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 2: Document Scanner */}
        <Link
          href="/document"
          className="group block bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-[0.99] relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileText className="w-7 h-7" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {language === "hi" ? "दस्तावेज़ स्कैन करें" : "Scan Document"}
                </h2>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {language === "hi"
                  ? "सरकारी नोटिस, पत्र या फॉर्म की फोटो लें और सरल भाषा में समझें।"
                  : "Photograph any official notice, form, or rejection letter to understand it simply."}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 3: Saved Schemes Offline */}
        <Link
          href="/saved"
          className="group block bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-[0.99] relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Bookmark className="w-7 h-7" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                  {language === "hi" ? "सहेजी गई योजनाएं" : "Saved Schemes"}
                </h2>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {language === "hi"
                  ? "बिना इंटरनेट (ऑफ़लाइन) भी अपनी सहेजी गई योजनाएं और आवश्यक कागज़ देखें।"
                  : "View your bookmarked schemes and checklist even without internet."}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Trust & DPDP Privacy Footer Pill */}
      <div className="bg-slate-100 rounded-2xl p-4 text-center border border-slate-200">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {language === "hi"
              ? "100% निःशुल्क और निजी"
              : "100% Free & Privacy-First"}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
          {language === "hi"
            ? "कोई लॉगिन आवश्यक नहीं। आपका आधार या पहचान विवरण कभी सर्वर पर स्टोर नहीं किया जाता।"
            : "No login needed. Your Aadhaar and personal details are processed locally and never stored."}
        </p>
      </div>
    </div>
  );
}
