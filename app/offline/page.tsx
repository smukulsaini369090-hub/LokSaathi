"use client";

import React from "react";
import Link from "next/link";
import { WifiOff, BookmarkCheck, RefreshCw, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function OfflinePage() {
  const { language } = useLanguage();

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
        <WifiOff className="w-8 h-8" />
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-2">
        {language === "hi"
          ? "आप अभी ऑफ़लाइन हैं"
          : "You are currently offline"}
      </h1>

      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        {language === "hi"
          ? "इंटरनेट कनेक्शन उपलब्ध नहीं है। लेकिन आप अपनी पहले से सहेजी गई (Saved) योजनाओं को बिना इंटरनेट भी देख सकते हैं।"
          : "No internet connection detected. However, you can still view your saved schemes without internet."}
      </p>

      <div className="space-y-3">
        <Link
          href="/saved"
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-sm transition-all"
        >
          <BookmarkCheck className="w-5 h-5" />
          <span>
            {language === "hi"
              ? "सहेजी गई योजनाएं देखें"
              : "View Saved Schemes"}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-2xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>
            {language === "hi" ? "दोबारा कनेक्ट करें" : "Retry Connection"}
          </span>
        </button>
      </div>
    </div>
  );
}
