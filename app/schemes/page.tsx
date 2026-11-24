"use client";

import React, { useState } from "react";
import { VoiceInterview } from "@/components/VoiceInterview";
import { SchemeCard } from "@/components/SchemeCard";
import { useLanguage } from "@/components/LanguageContext";
import { Sparkles, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import type { UserProfile, SchemeMatch } from "@/lib/scheme-matcher";

export default function SchemesPage() {
  const { language } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<SchemeMatch[] | null>(null);

  const handleProfileComplete = (
    completedProfile: UserProfile,
    matchedSchemes: SchemeMatch[]
  ) => {
    setProfile(completedProfile);
    setMatches(matchedSchemes);
  };

  const handleReset = () => {
    setProfile(null);
    setMatches(null);
  };

  return (
    <div className="py-4">
      {/* Page Title & Subtitle */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {matches
                ? language === "hi"
                  ? "आपके लिए उपयुक्त योजनाएं"
                  : "Schemes You Qualify For"
                : language === "hi"
                ? "सरकारी योजना पात्रता सहायक"
                : "Government Scheme Eligibility Guide"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {matches
                ? language === "hi"
                  ? `${matches.length} योजनाएं आपके विवरण के अनुकूल पाई गईं`
                  : `Found ${matches.length} schemes matching your profile`
                : language === "hi"
                ? "माइक दबाकर बोलें या नीचे टाइप करें"
                : "Tap the mic to speak or type below"}
            </p>
          </div>

          {matches && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === "hi" ? "दोबारा जांचें" : "Start Over"}</span>
            </button>
          )}
        </div>
      </div>

      {/* View 1: Voice Interview Mode */}
      {!matches && (
        <VoiceInterview
          language={language}
          onProfileComplete={handleProfileComplete}
        />
      )}

      {/* View 2: Matched Scheme Cards */}
      {matches && (
        <div className="px-4 space-y-4">
          {matches.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-200">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {language === "hi"
                  ? "कोई योजना नहीं मिली"
                  : "No Direct Matches Found"}
              </h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6">
                {language === "hi"
                  ? "आपके वर्तमान विवरण के अनुसार कोई प्रत्यक्ष योजना नहीं मिली। कृपया अपने विवरण (जैसे आय, पेशा या राज्य) दोबारा जांचें।"
                  : "No schemes directly matched your provided criteria. Try updating your details like income, occupation, or state."}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                {language === "hi" ? "पुनः प्रयास करें" : "Try Again"}
              </button>
            </div>
          ) : (
            matches.map((m) => (
              <SchemeCard key={m.scheme.id} match={m} language={language} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
