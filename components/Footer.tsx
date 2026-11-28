"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  const { language } = useLanguage();

  const handleOpenPermissions = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("loksaathi_open_permissions"));
    }
  };

  return (
    <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-xs text-gray-600 border-t border-gray-200 mt-8 mb-20 space-y-4">
      <nav
        aria-label={language === "hi" ? "महत्वपूर्ण लिंक" : "Footer Navigation"}
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold"
      >
        <Link
          href="/terms"
          className="text-blue-700 hover:underline min-h-[44px] inline-flex items-center px-1"
        >
          {language === "hi" ? "नियम एवं शर्तें" : "Terms & Conditions"}
        </Link>
        <Link
          href="/privacy"
          className="text-blue-700 hover:underline min-h-[44px] inline-flex items-center px-1"
        >
          {language === "hi" ? "गोपनीयता (DPDP 2023)" : "Privacy Notice"}
        </Link>
        <Link
          href="/help"
          className="text-slate-700 hover:underline min-h-[44px] inline-flex items-center px-1"
        >
          {language === "hi" ? "मदद केंद्र" : "Help & Setup"}
        </Link>
        <button
          type="button"
          onClick={handleOpenPermissions}
          className="text-slate-700 hover:text-blue-700 hover:underline min-h-[44px] inline-flex items-center px-1 cursor-pointer"
        >
          {language === "hi" ? "अनुमतियाँ और सेटिंग्स" : "Permissions & Preferences"}
        </button>
      </nav>

      <div className="flex items-center justify-center gap-1.5 text-gray-700 font-semibold">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          {language === "hi"
            ? "महत्वपूर्ण सूचना एवं अस्वीकरण (Disclaimer)"
            : "Important Non-Government Disclaimer"}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-gray-600 max-w-lg mx-auto">
        {language === "hi"
          ? "लोकसाथी (LokSaathi) एक स्वतंत्र, निःशुल्क नागरिक सहायता मंच है। यह भारत सरकार या किसी भी राज्य सरकार का आधिकारिक विभाग या वेबसाइट नहीं है। सभी 519 योजना विवरण (दिल्ली 95 • हरियाणा 119 • यूपी 112 • पंजाब 90 • केंद्र 103) आधिकारिक सरकारी पोर्टलों (.gov.in) से सत्यापित हैं।"
          : "LokSaathi is an independent, free citizen-assistive platform and is not an official central or state government agency. All 519 indexed schemes (Delhi 95, Haryana 119, UP 112, Punjab 90, Central 103) are compiled from official government portals (.gov.in)."}
      </p>

      <p className="text-[11px] text-gray-500 pt-1">
        © 2026 LokSaathi • 100% Free Citizen Assistant • Built for Bharat 🇮🇳
      </p>
    </footer>
  );
}
