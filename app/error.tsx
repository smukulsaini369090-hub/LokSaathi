"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function RouteErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();

  useEffect(() => {
    // Log strictly an opaque digest ID — never raw stack paths or citizen inputs
    console.warn("LokSaathi route boundary recovered:", error?.digest || "client_route_error");
  }, [error?.digest]);

  return (
    <div className="px-4 py-12 max-w-lg mx-auto text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-black text-slate-900">
          {language === "hi"
            ? "पेज लोड करने में अस्थायी बाधा आई"
            : "Temporary Issue Loading This Screen"}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {language === "hi"
            ? "चिंता न करें — आपका सहेजा हुआ डेटा सुरक्षित है। कृपया 'फिर कोशिश करें' दबाएं या होम पेज पर वापस जाएं।"
            : "Don't worry — your saved data is safe. Tap Try Again or return to the home screen."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-[48px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{language === "hi" ? "फिर कोशिश करें" : "Try Again"}</span>
        </button>

        <Link
          href="/"
          className="min-h-[48px] px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm inline-flex items-center justify-center gap-2 border border-slate-200"
        >
          <Home className="w-4 h-4" />
          <span>{language === "hi" ? "होम पर जाएं" : "Go Home"}</span>
        </Link>
      </div>

      <div>
        <Link
          href="/schemes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline min-h-[44px]"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{language === "hi" ? "519 सरकारी योजनाएं देखें" : "Browse 519 Verified Schemes"}</span>
        </Link>
      </div>
    </div>
  );
}
