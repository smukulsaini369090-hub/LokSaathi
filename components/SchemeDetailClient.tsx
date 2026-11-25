"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  FileText,
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
    const speech =
      language === "hi"
        ? `${scheme.name.hi}। लाभ: ${scheme.benefit.summary_hi}। आवश्यक दस्तावेज़: ${(scheme.documents_required || []).join(", ")}।`
        : `${scheme.name.en}. Benefit: ${scheme.benefit.summary_en}. Required documents: ${(scheme.documents_required || []).join(", ")}.`;
    speak(speech, language);
  };

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

        {/* Verification & Official .gov.in Source */}
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
          {scheme.source_url && (
            <a
              href={ensureSafeHttpUrl(scheme.source_url, scheme.apply_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
            >
              <span>
                {language === "hi"
                  ? "आधिकारिक स्रोत (.gov.in)"
                  : "Official Source (.gov.in)"}
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Required Documents */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>
              {language === "hi"
                ? "आवेदन के लिए आवश्यक दस्तावेज़"
                : "Required Documents to Apply"}
            </span>
          </h2>
          <ul className="space-y-2">
            {(scheme.documents_required || []).map((doc, idx) => (
              <li
                key={idx}
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Interactive Eligibility Checker */}
        <div className="pt-2">
          <EligibilityChecker
            id="eligibility-check"
            scheme={scheme}
            allSchemes={allSchemes}
          />
        </div>

        {/* Anti-Dalal Transparency & Zero-Middleman Citizen Shield */}
        <div className="pt-2">
          <AntiDalalShield scheme={scheme} />
        </div>

        {/* Non-Government Trust Disclaimer */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed text-center">
          ⚖️{" "}
          <strong>
            {language === "hi" ? "महत्वपूर्ण सूचना (Disclaimer):" : "Important Notice:"}
          </strong>{" "}
          {language === "hi"
            ? "लोकसाथी (LokSaathi) एक स्वतंत्र नागरिक सहायता मंच है। यह किसी भी सरकारी विभाग की आधिकारिक वेबसाइट नहीं है। योजना विवरण आधिकारिक सरकारी पोर्टलों (.gov.in) से सत्यापित हैं।"
            : "LokSaathi is an independent civic helper platform and not an official government portal. All details are grounded from official .gov.in sources."}
        </div>
      </div>
    </div>
  );
}
