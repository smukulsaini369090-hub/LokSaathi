"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VoiceInterview } from "@/components/VoiceInterview";
import { SchemeCard } from "@/components/SchemeCard";
import { useLanguage } from "@/components/LanguageContext";
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
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
import { detectSchemeRedirect } from "@/lib/scheme-redirects";

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
  const [visibleCount, setVisibleCount] = useState(24);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  useEffect(() => {
    setVisibleCount(24);
  }, [selectedState, selectedCategory, searchQuery]);

  const matchedRedirect = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return detectSchemeRedirect(searchQuery);
  }, [searchQuery]);

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

      // 2. Category filter (all 12 Master Index categories + legacy aliases)
      if (selectedCategory !== "all") {
        if (scheme.category) {
          if (scheme.category !== selectedCategory) return false;
        } else {
          return false;
        }
      }

      // 3. Keyword / Scheme Code Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = scheme.scheme_code?.toLowerCase().includes(query);
        const matchesDept = scheme.department?.toLowerCase().includes(query);
        const matchesName =
          scheme.name.hi.toLowerCase().includes(query) ||
          scheme.name.en.toLowerCase().includes(query);
        const matchesBenefit =
          scheme.benefit.summary_hi.toLowerCase().includes(query) ||
          scheme.benefit.summary_en.toLowerCase().includes(query);
        const matchesDoc = scheme.documents_required?.some((d) =>
          d.toLowerCase().includes(query)
        );
        return Boolean(matchesCode || matchesDept || matchesName || matchesBenefit || matchesDoc);
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

          {/* Category Filter Chips (All 12 Master Index Categories) */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {language === "hi" ? "श्रेणी चुनें (12 वर्ग):" : "Filter by Category (12 Sectors):"}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all", hi: "सभी श्रेणियां", en: "All Categories" },
                { id: "Education", hi: "🎓 शिक्षा / छात्रवृत्ति", en: "Education" },
                { id: "Health", hi: "🏥 स्वास्थ्य / इलाज", en: "Health" },
                { id: "Women & Girl Child", hi: "👩 महिला एवं बालिका", en: "Women & Girl Child" },
                { id: "Pensions & Seniors", hi: "👴 पेंशन एवं वरिष्ठजन", en: "Pensions & Seniors" },
                { id: "Agriculture & Animal Husbandry", hi: "🚜 कृषि एवं पशुपालन", en: "Agriculture & Dairy" },
                { id: "Housing & Shelter", hi: "🏠 आवास एवं आश्रय", en: "Housing & Shelter" },
                { id: "Employment, Skill & MSME", hi: "💼 रोजगार, कौशल व MSME", en: "Jobs, Skill & MSME" },
                { id: "Labour & BOCW", hi: "👷 श्रमिक / BOCW / गिग", en: "Labour & BOCW" },
                { id: "SC/ST/OBC/Minority Welfare", hi: "⚖️ SC/ST/OBC/अल्पसंख्यक", en: "SC/ST/OBC/Minority" },
                { id: "Divyangjan Welfare", hi: "♿ दिव्यांगजन कल्याण", en: "Divyangjan" },
                { id: "Utility Subsidies & Food", hi: "⚡ बिजली, पानी व राशन", en: "Utilities & Food" },
                { id: "Sports, Legal & Niche", hi: "🏅 खेल, कानूनी व विशेष", en: "Sports, Legal & Niche" },
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

          {/* Discontinued / Merged / Fake Scheme Alert Card */}
          {matchedRedirect && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    {language === "hi"
                      ? matchedRedirect.alert_title_hi
                      : matchedRedirect.alert_title_en}
                  </p>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    {language === "hi"
                      ? matchedRedirect.alert_message_hi
                      : matchedRedirect.alert_message_en}
                  </p>
                </div>
              </div>
              {matchedRedirect.replacement_codes.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-7">
                  {matchedRedirect.replacement_codes.map((code) => {
                    const rep = allSchemes.find((s) => s.scheme_code === code);
                    if (!rep) return null;
                    return (
                      <Link
                        key={rep.id}
                        href={`/schemes/${rep.id}`}
                        prefetch={false}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors"
                      >
                        <span className="font-mono text-[11px] text-blue-800">{code}</span>
                        <span>{language === "hi" ? rep.name.hi : rep.name.en}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Schemes Results Counter */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>
              {language === "hi"
                ? `कुल ${allSchemes.length} में से ${filteredSchemes.length} योजनाएं मिलीं (${Math.min(visibleCount, filteredSchemes.length)} प्रदर्शित)`
                : `Showing ${Math.min(visibleCount, filteredSchemes.length)} of ${filteredSchemes.length} matched (${allSchemes.length} total)`}
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
              {filteredSchemes.slice(0, visibleCount).map((scheme) => {
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

              {visibleCount < filteredSchemes.length && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                    className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-xs transition-colors"
                  >
                    <span>
                      {language === "hi"
                        ? `और योजनाएं दिखाएं (${filteredSchemes.length - visibleCount} शेष)`
                        : `Load More Schemes (${filteredSchemes.length - visibleCount} remaining)`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
