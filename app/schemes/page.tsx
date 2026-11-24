"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VoiceInterview } from "@/components/VoiceInterview";
import { SchemeCard } from "@/components/SchemeCard";
import { useLanguage } from "@/components/LanguageContext";
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Bot,
  ExternalLink,
  Share2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import type { UserProfile, SchemeMatch } from "@/lib/scheme-matcher";
import type { Scheme } from "@/lib/scheme-types";

export default function SchemesPage() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"assistant" | "catalog">("assistant");

  // Conversational Assistant state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<SchemeMatch[] | null>(null);

  // Direct Catalog state
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Fetch all schemes on mount or when switching to catalog
  useEffect(() => {
    let isMounted = true;
    async function loadSchemes() {
      if (allSchemes.length > 0) return;
      setIsLoadingCatalog(true);
      try {
        const res = await fetch("/api/schemes");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.schemes)) {
            setAllSchemes(data.schemes);
          }
        }
      } catch (err) {
        console.error("Failed to load catalog schemes:", err);
      } finally {
        if (isMounted) setIsLoadingCatalog(false);
      }
    }
    loadSchemes();
    return () => {
      isMounted = false;
    };
  }, [allSchemes.length]);

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

  // Client-side instant filtering (0 API Calls)
  const filteredSchemes = useMemo(() => {
    return allSchemes.filter((scheme) => {
      // 1. State filter
      if (selectedState !== "all") {
        if (selectedState === "central") {
          if (scheme.state) return false;
        } else if (scheme.state !== selectedState) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== "all") {
        const textToSearch = (
          scheme.name.hi +
          " " +
          scheme.name.en +
          " " +
          scheme.benefit.summary_hi +
          " " +
          scheme.benefit.summary_en +
          " " +
          JSON.stringify(scheme.eligibility)
        ).toLowerCase();

        switch (selectedCategory) {
          case "kisan":
            if (
              !textToSearch.includes("किसान") &&
              !textToSearch.includes("farmer") &&
              !textToSearch.includes("kisan") &&
              !textToSearch.includes("खेती")
            )
              return false;
            break;
          case "student":
            if (
              !textToSearch.includes("छात्र") &&
              !textToSearch.includes("विद्यार्थी") &&
              !textToSearch.includes("student") &&
              !textToSearch.includes("scholarship") &&
              !textToSearch.includes("साइकिल")
            )
              return false;
            break;
          case "women":
            if (
              !textToSearch.includes("महिला") &&
              !textToSearch.includes("बालिका") &&
              !textToSearch.includes("female") &&
              !textToSearch.includes("kanya") &&
              !textToSearch.includes("ladli") &&
              !textToSearch.includes("बेटी")
            )
              return false;
            break;
          case "health":
            if (
              !textToSearch.includes("स्वास्थ्य") &&
              !textToSearch.includes("health") &&
              !textToSearch.includes("sehat") &&
              !textToSearch.includes("इलाज") &&
              !textToSearch.includes("bima")
            )
              return false;
            break;
          case "pension":
            if (
              !textToSearch.includes("पेंशन") &&
              !textToSearch.includes("pension") &&
              !textToSearch.includes("वृद्धावस्था") &&
              !textToSearch.includes("senior")
            )
              return false;
            break;
          case "housing":
            if (
              !textToSearch.includes("आवास") &&
              !textToSearch.includes("awas") &&
              !textToSearch.includes("घर") &&
              !textToSearch.includes("मकान") &&
              !textToSearch.includes("labour") &&
              !textToSearch.includes("श्रमिक")
            )
              return false;
            break;
        }
      }

      // 3. Keyword Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName =
          scheme.name.hi.toLowerCase().includes(query) ||
          scheme.name.en.toLowerCase().includes(query);
        const matchesBenefit =
          scheme.benefit.summary_hi.toLowerCase().includes(query) ||
          scheme.benefit.summary_en.toLowerCase().includes(query);
        const matchesDoc = scheme.documents_required?.some((d) =>
          d.toLowerCase().includes(query)
        );
        return matchesName || matchesBenefit || matchesDoc;
      }

      return true;
    });
  }, [allSchemes, selectedState, selectedCategory, searchQuery]);

  return (
    <div className="py-4">
      {/* Top Main Navigation Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("assistant")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "assistant"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>
              {language === "hi"
                ? "AI पात्रता सहायक (बातचीत)"
                : "AI Sahayak (Chat Guide)"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "catalog"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              {language === "hi"
                ? "सभी योजनाएं (डायरेक्ट सर्च)"
                : "All Schemes (Direct Search)"}
            </span>
          </button>
        </div>
      </div>

      {/* Mode 1: AI Assistant (Conversational) */}
      {activeTab === "assistant" && (
        <>
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

          {!matches && (
            <VoiceInterview
              language={language}
              onProfileComplete={handleProfileComplete}
            />
          )}

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
                      ? "आपके वर्तमान विवरण के अनुसार कोई प्रत्यक्ष योजना नहीं मिली। कृपया अपने विवरण दोबारा जांचें या 'सभी योजनाएं' टैब में सीधे देखें।"
                      : "No schemes directly matched your criteria. You can search directly in the All Schemes tab."}
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
        </>
      )}

      {/* Mode 2: Direct Search & Filter Catalog (Zero-Cost, 0 API Calls) */}
      {activeTab === "catalog" && (
        <div className="px-4 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "hi"
                  ? "योजना का नाम खोजें (जैसे: किसान, राशन, पेंशन, साइकिल)..."
                  : "Search schemes by name or keyword (e.g. Kisan, Ration, Pension)..."
              }
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* State Filter Chips */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {language === "hi" ? "राज्य चुनें:" : "Filter by State:"}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all", hi: "सभी राज्य / केंद्र", en: "All States / Central" },
                { id: "central", hi: "🇮🇳 केंद्र सरकार", en: "Central Govt" },
                { id: "punjab", hi: "🌾 पंजाब", en: "Punjab" },
                { id: "up", hi: "🏛️ उत्तर प्रदेश", en: "Uttar Pradesh" },
                { id: "delhi", hi: "🏛️ दिल्ली (NCR)", en: "Delhi" },
                { id: "haryana", hi: "🏛️ हरियाणा", en: "Haryana" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedState(item.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 transition-all ${
                    selectedState === item.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {language === "hi" ? item.hi : item.en}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {language === "hi" ? "श्रेणी चुनें:" : "Filter by Category:"}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all", hi: "सभी श्रेणियां", en: "All Categories" },
                { id: "kisan", hi: "🚜 किसान", en: "Farmers" },
                { id: "student", hi: "🎓 विद्यार्थी / छात्र", en: "Students" },
                { id: "women", hi: "👩 महिला एवं बालिका", en: "Women & Girls" },
                { id: "health", hi: "🏥 स्वास्थ्य / इलाज", en: "Health" },
                { id: "pension", hi: "👴 पेंशन", en: "Pension" },
                { id: "housing", hi: "🏠 आवास एवं श्रमिक", en: "Housing & Labour" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCategory(item.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 transition-all ${
                    selectedCategory === item.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {language === "hi" ? item.hi : item.en}
                </button>
              ))}
            </div>
          </div>

          {/* Schemes Results Counter */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>
              {language === "hi"
                ? `कुल ${allSchemes.length} में से ${filteredSchemes.length} योजनाएं उपलब्ध हैं`
                : `Showing ${filteredSchemes.length} of ${allSchemes.length} schemes`}
            </span>
            {(selectedState !== "all" ||
              selectedCategory !== "all" ||
              searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedState("all");
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                {language === "hi" ? "फ़िल्टर हटाएं" : "Clear Filters"}
              </button>
            )}
          </div>

          {/* Catalog Cards List */}
          {isLoadingCatalog ? (
            <div className="py-12 text-center text-gray-500">
              <Sparkles className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-sm">
                {language === "hi" ? "योजनाएं लोड हो रही हैं..." : "Loading schemes..."}
              </p>
            </div>
          ) : filteredSchemes.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-200">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">
                {language === "hi"
                  ? "चयनित फ़िल्टर के अनुसार कोई योजना नहीं मिली"
                  : "No schemes match your selected filters"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedState("all");
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-3 text-xs font-semibold text-blue-600 underline"
              >
                {language === "hi" ? "सभी योजनाएं देखें" : "View all schemes"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSchemes.map((scheme) => {
                const fakeMatch: SchemeMatch = {
                  scheme,
                  match_confidence: "high",
                  match_reason_hi: scheme.state
                    ? `${scheme.state.toUpperCase()} राज्य के नागरिकों के लिए उपलब्ध`
                    : "अखिल भारतीय / केंद्र सरकार की कल्याणकारी योजना",
                  match_reason_en: scheme.state
                    ? `Available for citizens of ${scheme.state.toUpperCase()}`
                    : "Pan-India Central Welfare Scheme",
                  missing_fields: [],
                };
                return (
                  <SchemeCard
                    key={scheme.id}
                    match={fakeMatch}
                    language={language}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
