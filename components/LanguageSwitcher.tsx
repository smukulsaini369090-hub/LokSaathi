"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label="भाषा बदलें / Change Language"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors border border-gray-200"
      title={language === "hi" ? "Switch to English" : "हिंदी में बदलें"}
    >
      <Languages className="w-3.5 h-3.5 text-blue-600" />
      <span>{language === "hi" ? "EN" : "हिन्दी"}</span>
    </button>
  );
}
