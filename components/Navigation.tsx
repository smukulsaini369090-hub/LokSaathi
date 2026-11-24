"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, FileText, Bookmark, KeyRound, HelpCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { hasStoredApiKey, onApiKeyChange } from "@/lib/client-api-key";

export function Header() {
  const { language } = useLanguage();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    setHasCustomKey(hasStoredApiKey());
    const unsub = onApiKeyChange(() => {
      setHasCustomKey(hasStoredApiKey());
    });
    return unsub;
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              लो
            </div>
            <div translate="no" className="notranslate">
              <span className="font-extrabold text-base tracking-tight text-gray-900 block leading-tight">
                लोकसाथी <span className="text-blue-600 font-semibold text-xs">LokSaathi</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                hasCustomKey
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
              title={
                hasCustomKey
                  ? language === "hi"
                    ? "आपकी कस्टम API Key सक्रिय है"
                    : "Custom API Key active"
                  : language === "hi"
                  ? "अपनी Gemini API Key जोड़ें"
                  : "Add your Gemini API Key"
              }
              aria-label="API Key Settings"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {hasCustomKey ? (language === "hi" ? "कुंजी सक्रिय" : "Key Active") : "API Key"}
              </span>
              {hasCustomKey && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <Link
              href="/help"
              className="p-1.5 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              title={language === "hi" ? "मदद व डिवाइस सेटअप" : "Help & Device Setup"}
              aria-label={language === "hi" ? "मदद केंद्र" : "Help Center"}
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();

  const navItems = [
    {
      href: "/",
      label: language === "hi" ? "होम" : "Home",
      icon: Home,
    },
    {
      href: "/schemes",
      label: language === "hi" ? "योजनाएं" : "Schemes",
      icon: Search,
    },
    {
      href: "/document",
      label: language === "hi" ? "दस्तावेज़" : "Document",
      icon: FileText,
    },
    {
      href: "/saved",
      label: language === "hi" ? "सहेजी गई" : "Saved",
      icon: Bookmark,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg pb-safe">
      <div className="max-w-2xl mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? "text-blue-600 font-bold" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
