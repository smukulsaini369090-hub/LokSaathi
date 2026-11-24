"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="भाषा चुनें / Select Language"
      className="inline-flex items-center p-0.5 bg-slate-100 rounded-full border border-slate-200 shadow-2xs"
    >
      <button
        type="button"
        onClick={() => setLanguage("hi")}
        aria-pressed={language === "hi"}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
          language === "hi"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
          language === "en"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        English
      </button>
    </div>
  );
}
