"use client";

import React, { useState, useEffect } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Share2,
  ExternalLink,
  Volume2,
  Square,
  FileText,
  Calendar,
} from "lucide-react";
import { EligibilityBadge } from "@/components/EligibilityBadge";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { isSchemeSaved, saveScheme, removeScheme } from "@/lib/offline";
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
    const shareText =
      language === "hi"
        ? `🏛️ ${scheme.name.hi}\n💰 लाभ: ${scheme.benefit.summary_hi}\n📄 ज़रूरी कागज़: ${scheme.documents_required.join(", ")}\n🌐 आवेदन लिंक: ${scheme.apply_url}\n\n✅ लोकसाथी ऐप से अपनी पात्रता जांचें:`
        : `🏛️ ${scheme.name.en}\n💰 Benefit: ${scheme.benefit.summary_en}\n📄 Required Documents: ${scheme.documents_required.join(", ")}\n🌐 Apply: ${scheme.apply_url}\n\n✅ Check your scheme eligibility on LokSaathi:`;

    if (navigator.share) {
      navigator
        .share({
          title: schemeName,
          text: shareText,
          url: scheme.apply_url,
        })
        .catch(() => {});
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(
        shareText + " " + scheme.apply_url
      )}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
      <div>
        {/* Header with Name, Badge and Audio/Save CTAs */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <EligibilityBadge
                confidence={scheme.confidence}
                language={language}
              />
              {match_confidence === "medium" && (
                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                  {language === "hi" ? "संभावित पात्र" : "Likely Eligible"}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 leading-snug">
              {schemeName}
            </h3>
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
                  {doc}
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

      {/* Action Footer: Apply Link + WhatsApp Share */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <a
          href={scheme.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm"
        >
          <span>{language === "hi" ? "आवेदन करें" : "Apply Now"}</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          type="button"
          onClick={handleWhatsAppShare}
          aria-label={
            language === "hi"
              ? "व्हाट्सएप पर शेयर करें"
              : "Share on WhatsApp"
          }
          className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 px-3.5 rounded-xl transition-colors shadow-sm"
          title="WhatsApp Share"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">
            {language === "hi" ? "शेयर" : "Share"}
          </span>
        </button>
      </div>
    </div>
  );
}
