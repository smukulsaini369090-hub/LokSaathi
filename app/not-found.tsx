"use client";

import React from "react";
import Link from "next/link";
import { Home, Search, HelpCircle, Compass } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function NotFoundPage() {
  const { language } = useLanguage();

  return (
    <div className="px-4 py-12 max-w-lg mx-auto text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
        <Compass className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          404
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          {language === "hi" ? "यह पेज नहीं मिला" : "Page Not Found"}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {language === "hi"
            ? "हो सकता है यह पता बदल गया हो। नीचे दिए विकल्पों से आप सीधे योजनाएं खोज सकते हैं:"
            : "This page may have moved or the link is outdated. Jump directly to verified schemes below:"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="min-h-[48px] px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>{language === "hi" ? "होम पर जाएं" : "Go Home"}</span>
        </Link>

        <Link
          href="/schemes"
          className="min-h-[48px] px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <Search className="w-4 h-4" />
          <span>{language === "hi" ? "योजनाएं खोजें" : "Find Schemes"}</span>
        </Link>

        <Link
          href="/help"
          className="min-h-[48px] px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm inline-flex items-center justify-center gap-2 border border-slate-200"
        >
          <HelpCircle className="w-4 h-4" />
          <span>{language === "hi" ? "मदद केंद्र" : "Help"}</span>
        </Link>
      </div>
    </div>
  );
}
