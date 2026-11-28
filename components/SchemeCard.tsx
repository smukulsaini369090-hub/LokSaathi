"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  Share2,
  ExternalLink,
  Volume2,
  Square,
  FileText,
  Calendar,
  Sparkles,
} from "lucide-react";
import { EligibilityBadge } from "@/components/EligibilityBadge";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { isSchemeSaved, saveScheme, removeScheme } from "@/lib/offline";
import { ensureSafeHttpUrl } from "@/lib/anti-dalal";
import { translateDocumentName } from "@/lib/document-guides";
import type { SchemeMatch } from "@/lib/scheme-matcher";

interface SchemeCardProps {
  match: SchemeMatch;
  language?: "hi" | "en";
  onSave?: (match: SchemeMatch) => void;
  onRemove?: (schemeId: string) => void;
}

export function SchemeCard({
  match,
  language = "hi",
  onSave,
  onRemove,
}: SchemeCardProps) {
  const { scheme, match_confidence, match_reason_hi, match_reason_en } = match;
  const [saved, setSaved] = useState(false);
  const { speak, stop, isPlaying } = useSpeechSynthesis();

  const schemeName = language === "hi" ? scheme.name.hi : scheme.name.en;
  const benefitSummary =
    language === "hi" ? scheme.benefit.summary_hi : scheme.benefit.summary_en;
  const reason = language === "hi" ? match_reason_hi : match_reason_en;

  // Check saved status on mount
  useEffect(() => {
    isSchemeSaved(scheme.id).then(setSaved);
  }, [scheme.id]);

  const handleSaveToggle = async () => {
    if (saved) {
      await removeScheme(scheme.id);
      setSaved(false);
      if (onRemove) onRemove(scheme.id);
    } else {
      await saveScheme(match);
      setSaved(true);
      if (onSave) onSave(match);
    }
  };

  const handleAudioPlayback = () => {
    if (isPlaying) {
      stop();
    } else {
      const speechText = `${schemeName}. ${benefitSummary}. ${reason}`;
      speak(speechText, language);
    }
  };

  const handleWhatsAppShare = () => {
    const detailUrl = `https://lok-saathi.vercel.app/schemes/${scheme.id}`;
    const shareText =
      language === "hi"
        ? `🏛️ *${scheme.name.hi}*\n💰 *लाभ:* ${scheme.benefit.summary_hi}\n📄 *ज़रूरी कागज़:* ${scheme.documents_required.join(", ")}\n\n✅ *लोकसाथी पर पात्रता और आवेदन देखें:*\n${detailUrl}`
        : `🏛️ *${scheme.name.en}*\n💰 *Benefit:* ${scheme.benefit.summary_en}\n📄 *Required Documents:* ${scheme.documents_required.join(", ")}\n\n✅ *Check eligibility & apply on LokSaathi:*\n${detailUrl}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
      <div>
        {/* Header with Name, Badge and Audio/Save CTAs */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              {scheme.scheme_code && (
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                  {scheme.scheme_code}
                </span>
              )}
              <EligibilityBadge
                confidence={scheme.confidence}
                verificationStatus={scheme.verification_status}
                language={language}
              />
              <Link
                href={`/schemes/${scheme.id}#eligibility-check`}
                prefetch={false}
                className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{language === "hi" ? "पात्रता जांचें" : "Am I Eligible?"}</span>
              </Link>
              {match_confidence === "medium" && (
                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                  {language === "hi" ? "संभावित पात्र" : "Likely Eligible"}
                </span>
              )}
            </div>
            <Link href={`/schemes/${scheme.id}`} prefetch={false} className="hover:text-blue-600 transition-colors">
              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                {schemeName}
              </h3>
            </Link>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Audio Suno Playback Button */}
            <button
              type="button"
              onClick={handleAudioPlayback}
              aria-label={isPlaying ? "रोकें (Stop audio)" : "सुनें (Listen to scheme details)"}
              className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
              title={language === "hi" ? "योजना विवरण सुनें" : "Listen in audio"}
            >
              {isPlaying ? (
                <Square className="w-5 h-5 fill-current text-red-500" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Offline Bookmark Button */}
            <button
              type="button"
              onClick={handleSaveToggle}
              aria-label={saved ? "सहेजी गई (Saved)" : "सहेजें (Save scheme offline)"}
              className={`p-2 rounded-full transition-colors ${
                saved
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title={
                saved
                  ? language === "hi"
                    ? "सहेजा हुआ"
                    : "Saved"
                  : language === "hi"
                  ? "ऑफ़लाइन सहेजें"
                  : "Save offline"
              }
            >
              {saved ? (
                <BookmarkCheck className="w-5 h-5 fill-current" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Benefit Summary Box */}
        <div className="mb-4 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
          <p className="text-xs text-emerald-800 font-semibold mb-0.5 uppercase tracking-wide">
            {language === "hi" ? "योजना का मुख्य लाभ" : "Primary Benefit"}
          </p>
          <p className="text-sm text-emerald-950 font-medium leading-relaxed">
            {benefitSummary}
          </p>
        </div>

        {/* Eligibility Reason */}
        <div className="mb-4 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
          <span className="font-semibold text-gray-700">
            {language === "hi" ? "आपकी पात्रता:" : "Your Eligibility:"}{" "}
          </span>
          {reason}
        </div>

        {/* Required Documents Chips */}
        {scheme.documents_required && scheme.documents_required.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1 font-medium">
              <FileText className="w-3.5 h-3.5" />
              {language === "hi" ? "आवश्यक दस्तावेज़:" : "Required Documents:"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {scheme.documents_required.map((doc, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md border border-gray-200 font-normal"
                >
                  {translateDocumentName(doc, language)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verification Date */}
        <div className="mb-4 text-[11px] text-gray-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>
            {language === "hi" ? "आधिकारिक पोर्टल सत्यापन:" : "Last Verified:"}{" "}
            {scheme.last_verified}
          </span>
        </div>
      </div>

      {/* Action Footer: Check Eligibility + Apply Link + WhatsApp Share */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <Link
          href={`/schemes/${scheme.id}#eligibility-check`}
          prefetch={false}
          className="inline-flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2.5 px-3 rounded-xl border border-emerald-200 transition-colors shadow-2xs"
          title={language === "hi" ? "पात्रता जांचें" : "Check Eligibility"}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === "hi" ? "पात्रता जांचें" : "Check"}</span>
        </Link>

        <a
          href={ensureSafeHttpUrl(scheme.apply_url, scheme.source_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl transition-colors shadow-sm"
        >
          <span>{language === "hi" ? "आवेदन करें" : "Apply"}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          type="button"
          onClick={handleWhatsAppShare}
          aria-label={
            language === "hi"
              ? "व्हाट्सएप पर शेयर करें"
              : "Share on WhatsApp"
          }
          className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl transition-colors shadow-sm"
          title="WhatsApp Share"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {language === "hi" ? "शेयर" : "Share"}
          </span>
        </button>
      </div>
    </div>
  );
}
