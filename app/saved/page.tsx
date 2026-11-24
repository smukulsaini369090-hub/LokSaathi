"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Search, WifiOff } from "lucide-react";
import { SchemeCard } from "@/components/SchemeCard";
import { useLanguage } from "@/components/LanguageContext";
import { getSavedSchemes } from "@/lib/offline";
import type { SchemeMatch } from "@/lib/scheme-matcher";

export default function SavedPage() {
  const { language } = useLanguage();
  const [savedSchemes, setSavedSchemes] = useState<SchemeMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const schemes = await getSavedSchemes();
      setSavedSchemes(schemes);
    } catch (err) {
      console.error("Failed to load saved schemes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  const handleRemove = (schemeId: string) => {
    setSavedSchemes((prev) => prev.filter((s) => s.scheme.id !== schemeId));
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Title & Offline Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            {language === "hi" ? "सहेजी गई योजनाएं" : "Saved Schemes"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === "hi"
              ? "यह सूची आपके फोन में सुरक्षित है और बिना इंटरनेट के भी उपलब्ध है।"
              : "This list is stored on your device and works offline."}
          </p>
        </div>

        <div className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
          <WifiOff className="w-3 h-3 text-emerald-600" />
          <span>{language === "hi" ? "ऑफ़लाइन मोड" : "Offline Ready"}</span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-sm text-gray-500">
          {language === "hi" ? "सहेजी गई योजनाएं लोड हो रही हैं..." : "Loading saved schemes..."}
        </div>
      )}

      {!loading && savedSchemes.length === 0 && (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-sm mt-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {language === "hi"
              ? "अभी कोई योजना सहेजी नहीं गई है"
              : "No Saved Schemes Yet"}
          </h3>
          <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6 leading-relaxed">
            {language === "hi"
              ? "जब आप योजना खोजेंगे, तो कार्ड के ऊपर बुकमार्क आइकन दबाकर अपनी योजनाएं यहाँ ऑफ़लाइन सुरक्षित रख सकते हैं।"
              : "When you discover schemes, tap the bookmark icon on any card to save it here for offline viewing."}
          </p>

          <Link
            href="/schemes"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-2xl transition-all shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>{language === "hi" ? "योजनाएं खोजें" : "Find Schemes"}</span>
          </Link>
        </div>
      )}

      {!loading && savedSchemes.length > 0 && (
        <div className="space-y-4">
          {savedSchemes.map((m) => (
            <SchemeCard
              key={m.scheme.id}
              match={m}
              language={language}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
