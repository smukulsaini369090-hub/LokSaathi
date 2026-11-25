"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Volume2,
  Square,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { EligibilityBadge } from "@/components/EligibilityBadge";
import { EligibilityChecker } from "@/components/EligibilityChecker";
import { AntiDalalShield } from "@/components/AntiDalalShield";
import { ensureSafeHttpUrl } from "@/lib/anti-dalal";
import { translateDocumentName } from "@/lib/document-guides";
import type { Scheme } from "@/lib/scheme-types";

interface SchemeDetailClientProps {
  scheme: Scheme;
  allSchemes: Scheme[];
}

const STATE_BADGES: Record<string, { hi: string; en: string }> = {
  punjab: { hi: "🏛️ पंजाब राज्य", en: "🏛️ Punjab State" },
  up: { hi: "🏛️ उत्तर प्रदेश", en: "🏛️ Uttar Pradesh" },
  delhi: { hi: "🏛️ दिल्ली", en: "🏛️ Delhi Govt" },
  haryana: { hi: "🏛️ हरियाणा", en: "🏛️ Haryana State" },
};

export function SchemeDetailClient({
  scheme,
  allSchemes,
}: SchemeDetailClientProps) {
  const { language } = useLanguage();
  const { speak, stop, isPlaying, prewarmTTS } = useSpeechSynthesis();

  const title = language === "hi" ? scheme.name.hi : scheme.name.en;
  const subTitle = language === "hi" ? scheme.name.en : scheme.name.hi;
  const benefitPrimary =
    language === "hi" ? scheme.benefit.summary_hi : scheme.benefit.summary_en;
  const benefitSecondary =
    language === "hi" ? scheme.benefit.summary_en : scheme.benefit.summary_hi;

  const handleListenSummary = () => {
    prewarmTTS();
    if (isPlaying) {
      stop();
      return;
    }
    const docsList = (scheme.documents_required || [])
      .map((doc) => translateDocumentName(doc, language))
      .join(", ");
    const speech =
      language === "hi"
        ? `${scheme.name.hi}। लाभ: ${scheme.benefit.summary_hi}। आवश्यक दस्तावेज़: ${docsList}।`
        : `${scheme.name.en}. Benefit: ${scheme.benefit.summary_en}. Required documents: ${docsList}.`;
    speak(speech, language);
  };

  let verifiedDomain = "";
  if (scheme.source_url) {
    try {
      verifiedDomain = new URL(ensureSafeHttpUrl(scheme.source_url, scheme.apply_url)).hostname;
    } catch {
      verifiedDomain = "";
    }
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/schemes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 min-h-[36px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {language === "hi" ? "योजना सूची पर वापस जाएं" : "Back to schemes"}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleListenSummary}
            aria-label={language === "hi" ? "योजना सुनें" : "Listen to scheme"}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors min-h-[36px] border cursor-pointer ${
              isPlaying
                ? "bg-rose-600 text-white border-rose-600 animate-pulse"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
            }`}
          >
            {isPlaying ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            <span>
              {isPlaying
                ? language === "hi"
                  ? "रोकें"
                  : "Stop"
                : language === "hi"
                ? "सुनें"
                : "Listen"}
            </span>
          </button>

          <a
            href="#eligibility-check"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors min-h-[36px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === "hi" ? "क्या मैं पात्र हूँ?" : "Am I Eligible?"}
            </span>
          </a>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-6">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <EligibilityBadge
              confidence={scheme.confidence}
              language={language}
            />
            {scheme.state && (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {STATE_BADGES[scheme.state]?.[language] || scheme.state.toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-1.5 leading-snug">
            {title}
          </h1>
          <p className="text-sm text-gray-500 mb-4 font-medium">{subTitle}</p>

          {/* Benefit Box */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <h2 className="text-xs uppercase font-bold text-emerald-800 tracking-wide mb-1">
              {language === "hi" ? "योजना का मुख्य लाभ" : "Primary Benefit"}
            </h2>
            <p className="text-base text-emerald-950 font-semibold leading-relaxed">
              {benefitPrimary}
            </p>
            <p className="text-xs text-emerald-700 mt-1">{benefitSecondary}</p>
          </div>
        </div>

        {/* Verification Metadata Strip */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <span className="font-semibold text-gray-900">
                {language === "hi" ? "अंतिम सत्यापन:" : "Last Verified:"}
              </span>{" "}
              {scheme.last_verified}
            </span>
          </div>
          {verifiedDomain && (
            <span className="font-semibold text-slate-600">
              {language === "hi" ? "आधिकारिक स्रोत:" : "Verified Source:"}{" "}
              <span className="text-blue-700">{verifiedDomain}</span>
            </span>
          )}
        </div>

        {/* Interactive Eligibility Checker & Unified Document Checklist */}
        <div className="pt-2">
          <EligibilityChecker
            id="eligibility-check"
            scheme={scheme}
            allSchemes={allSchemes}
          />
        </div>

        {/* Anti-Dalal Transparency & Zero-Middleman Citizen Shield (Rendered Strictly Once) */}
        <div className="pt-2">
          <AntiDalalShield scheme={scheme} />
        </div>
      </div>
    </div>
  );
}
