"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Volume2,
  Square,
  Share2,
  PhoneCall,
  FileText,
  CheckSquare,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { resolveAntiDalalInfo } from "@/lib/anti-dalal";
import type { Scheme } from "@/lib/scheme-types";

interface AntiDalalShieldProps {
  scheme: Scheme;
  compact?: boolean;
}

export function AntiDalalShield({ scheme, compact = false }: AntiDalalShieldProps) {
  const { language } = useLanguage();
  const { speak, stop, isPlaying, prewarmTTS } = useSpeechSynthesis();

  const info = resolveAntiDalalInfo(scheme, language);

  // Local storage key for the receipt verification checklist
  const storageKey = `loksaathi_receipt_ack_${scheme.id}`;

  const [receiptChecks, setReceiptChecks] = useState<{
    gotReceipt: boolean;
    hasRefNumber: boolean;
    savedPhoto: boolean;
  }>({
    gotReceipt: false,
    hasRefNumber: false,
    savedPhoto: false,
  });

  // Load persisted receipt checklist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setReceiptChecks(JSON.parse(saved));
      }
    } catch {
      // safe fallback
    }
  }, [storageKey]);

  const toggleCheck = (key: keyof typeof receiptChecks) => {
    setReceiptChecks((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // safe fallback
      }
      return updated;
    });
  };

  const allChecksComplete =
    receiptChecks.gotReceipt &&
    receiptChecks.hasRefNumber &&
    receiptChecks.savedPhoto;

  const handleAudioPlayback = () => {
    prewarmTTS();
    if (isPlaying) {
      stop();
    } else {
      speak(info.audioSpeechText, language);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      info.whatsappShareText
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`rounded-3xl border-2 transition-all ${
        compact
          ? "bg-amber-50/60 border-amber-300 p-4"
          : "bg-white border-amber-400/90 shadow-md p-5 sm:p-6"
      }`}
    >
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {language === "hi" ? "दलाल मुक्त सेवा" : "Zero Middleman"}
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% {language === "hi" ? "सत्यापित" : "Verified"}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {language === "hi"
                ? "एंटी-दलाल सुरक्षा कवच (Anti-Dalal Citizen Shield)"
                : "Anti-Dalal Zero-Middleman Citizen Shield"}
            </h3>
          </div>
        </div>

        {/* Audio "Suno" & WhatsApp Share Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAudioPlayback}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isPlaying
                ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
            aria-label={
              isPlaying
                ? language === "hi"
                  ? "ऑडियो रोकें"
                  : "Stop Audio"
                : language === "hi"
                ? "नियम सुनें"
                : "Listen to Rules"
            }
          >
            {isPlaying ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            <span>
              {isPlaying
                ? language === "hi"
                  ? "रोकें"
                  : "Stop"
                : language === "hi"
                ? "नियम सुनें"
                : "Listen"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            aria-label={language === "hi" ? "व्हाट्सएप पर शेयर करें" : "Share on WhatsApp"}
          >
            <Share2 className="w-4 h-4" />
            <span>
              {language === "hi" ? "व्हाट्सएप शेयर" : "Share"}
            </span>
          </button>
        </div>
      </div>

      {/* Grid: 1. Official Fee vs CSC Fee & 2. Processing Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Official Fee Box */}
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{language === "hi" ? "आधिकारिक पोर्टल फीस:" : "Official Portal Fee:"}</span>
          </div>
          <p className="text-base font-black text-emerald-950">
            {info.officialFeeLabel}
          </p>
          <p className="text-[11px] text-emerald-800 mt-1 leading-snug">
            {language === "hi"
              ? "सरकारी वेबसाइट पर ऑनलाइन आवेदन पूर्णतः निःशुल्क या न्यूनतम सरकारी शुल्क पर होता है।"
              : "Direct online application on official government portal is free or statutory fee only."}
          </p>
        </div>

        {/* CSC / Kendra Facilitation Fee */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {language === "hi"
                ? "केंद्र (CSC/सेवा केंद्र) ऑपरेटर शुल्क:"
                : "Center Facilitation Fee:"}
            </span>
          </div>
          <p className="text-sm font-bold text-blue-950">
            {info.cscFeeNote}
          </p>
          <p className="text-[11px] text-blue-800 mt-1 leading-snug">
            {language === "hi"
              ? "यदि ऑपरेटर से फॉर्म भरवाएं, केवल तभी यह सामान्य सुविधा शुल्क देय है।"
              : "Payable only if the kiosk operator fills, scans and submits on your behalf."}
          </p>
        </div>
      </div>

      {/* Warning Box Against Middlemen */}
      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl mb-4 flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-xs text-rose-950 leading-relaxed">
          <strong className="font-bold">
            {language === "hi" ? "दलालों से सख्त चेतावनी:" : "Middlemen Alert:"}
          </strong>{" "}
          {info.antiDalalWarning}
        </div>
      </div>

      {/* Timeline & Expected SLA */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600 shrink-0" />
          <span>
            <strong className="font-bold">
              {language === "hi" ? "मानक समय-सीमा:" : "Expected Timeline:"}
            </strong>{" "}
            {info.processingTimeline}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <PhoneCall className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            {language === "hi" ? "शिकायत हेल्पलाइन:" : "Helpline:"}{" "}
            {(() => {
              const dialable = info.helpline.split("/")[0].replace(/[^0-9+]/g, "");
              return dialable.length >= 3 ? (
                <a
                  href={`tel:${dialable}`}
                  className="font-black text-blue-700 hover:underline"
                >
                  {info.helpline}
                </a>
              ) : (
                <span className="font-bold text-slate-800">{info.helpline}</span>
              );
            })()}
          </span>
        </div>
      </div>

      {/* Interactive Acknowledgement Slip ("रसीद") Checklist */}
      <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-amber-800 shrink-0" />
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
            {language === "hi"
              ? "पक्की रसीद (Acknowledgement Slip) सुरक्षा चेकलिस्ट"
              : "Mandatory Receipt & Tracking Checklist"}
          </h4>
        </div>
        <p className="text-xs text-amber-900 mb-3 leading-relaxed">
          {info.receiptRule}
        </p>

        <div className="space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-xl bg-white/90 border border-amber-200 hover:bg-white transition-colors">
            <input
              type="checkbox"
              checked={receiptChecks.gotReceipt}
              onChange={() => toggleCheck("gotReceipt")}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-800">
              {language === "hi"
                ? "1. ऑपरेटर से सरकारी पक्की पावती / रसीद (Receipt) ले ली है।"
                : "1. Collected official printed acknowledgement slip from operator."}
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-xl bg-white/90 border border-amber-200 hover:bg-white transition-colors">
            <input
              type="checkbox"
              checked={receiptChecks.hasRefNumber}
              onChange={() => toggleCheck("hasRefNumber")}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-800">
              {language === "hi"
                ? "2. रसीद पर आवेदन संख्या / ट्रैकिंग आईडी (Application ID) स्पष्ट दर्ज है।"
                : "2. Receipt clearly shows the official application tracking ID."}
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-xl bg-white/90 border border-amber-200 hover:bg-white transition-colors">
            <input
              type="checkbox"
              checked={receiptChecks.savedPhoto}
              onChange={() => toggleCheck("savedPhoto")}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-800">
              {language === "hi"
                ? "3. रसीद की फोटो खींचकर फोन में सुरक्षित कर ली है।"
                : "3. Saved a clear photo of the receipt on this phone for tracking."}
            </span>
          </label>
        </div>

        {allChecksComplete && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {language === "hi"
                ? "सुरक्षा कवच सक्रिय: आपकी रसीद सुरक्षित है — आप दलालों के धोखे से पूरी तरह सुरक्षित हैं!"
                : "Shield Active: Your receipt is verified — you are safe from middlemen fraud!"}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons: Direct Portal + Nearby Center on Google Maps */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        {info.officialPortalUrl && (
          <a
            href={info.officialPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[48px] px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
          >
            <span>
              {language === "hi"
                ? "आधिकारिक सरकारी पोर्टल खोलें (.gov.in)"
                : "Open Official Portal (.gov.in)"}
            </span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>
        )}

        <a
          href={info.mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-[48px] px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
        >
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {language === "hi"
              ? `नजदीकी ${info.centerName} खोजें (Maps)`
              : `Find Nearest ${info.centerName} (Maps)`}
          </span>
        </a>
      </div>
    </div>
  );
}
