"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-xs text-gray-500 border-t border-gray-200 mt-8 mb-20 space-y-2">
      <div className="flex items-center justify-center gap-1.5 text-gray-700 font-semibold">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>
          {language === "hi"
            ? "महत्वपूर्ण सूचना एवं अस्वीकरण (Disclaimer)"
            : "Important Non-Government Disclaimer"}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-gray-500 max-w-lg mx-auto">
        {language === "hi"
          ? "लोकसाथी (LokSaathi) एक स्वतंत्र, निःशुल्क नागरिक सहायता मंच है। यह भारत सरकार या किसी भी राज्य सरकार का आधिकारिक विभाग या वेबसाइट नहीं है। सभी योजना विवरण, शुल्क नियम व आवेदन लिंक आधिकारिक सरकारी पोर्टलों (.gov.in) से सत्यापित किए गए हैं।"
          : "LokSaathi is an independent, free citizen-assistive platform and is not an official central or state government agency. All scheme details, fee rules, and links are verified directly from official government portals (.gov.in)."}
      </p>

      <p className="text-[10px] text-gray-400 pt-1">
        © 2026 LokSaathi • 100% Free &amp; Open Citizen Assistant • Built for Bharat 🇮🇳
      </p>
    </footer>
  );
}
