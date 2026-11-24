"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export function PWAInstallBanner() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("loksaathi_install_dismissed") === "true") return;

    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;
    if (isStandalone) return;

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If iOS and not standalone, show after a 3 second delay
    if (isIOSDevice && !isStandalone) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("loksaathi_install_dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <aside aria-label="App installation" className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              लो
            </div>
            <div>
              <h4 className="text-sm font-bold leading-tight">
                {language === "hi"
                  ? "लोकसाथी ऐप इंस्टॉल करें"
                  : "Install LokSaathi App"}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {language === "hi"
                  ? "बिना इंटरनेट भी सहेजी गई योजनाएं देखें"
                  : "Access saved schemes offline anytime"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="बंद करें (Close)"
            className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Safari Instruction Modal / Tooltip */}
        {showIOSGuide && isIOS && (
          <div className="p-2.5 bg-slate-800 rounded-xl text-xs text-slate-200 border border-slate-700 space-y-1">
            <p className="font-semibold text-amber-300">
              {language === "hi" ? "iPhone / iPad पर इंस्टॉल करने का तरीका:" : "How to install on iOS:"}
            </p>
            <p className="flex items-center gap-1.5">
              1. Safari में नीचे <Share className="w-3.5 h-3.5 text-blue-400" /> (Share) बटन दबाएं।
            </p>
            <p className="flex items-center gap-1.5">
              2. नीचे स्क्रॉल करके <PlusSquare className="w-3.5 h-3.5 text-emerald-400" /> &apos;Add to Home Screen&apos; चुनें।
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isIOS
                ? language === "hi"
                  ? "इंस्टॉल गाइड देखें"
                  : "View Install Steps"
                : language === "hi"
                ? "फोन में इंस्टॉल करें"
                : "Install on Device"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            {language === "hi" ? "बाद में" : "Later"}
          </button>
        </div>
      </div>
    </aside>
  );
}
