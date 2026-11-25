"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Volume2,
  Square,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trash2,
  Edit3,
  FileText,
  Clock,
  ShieldCheck,
  Building,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { AntiDalalShield } from "@/components/AntiDalalShield";
import { ensureSafeHttpUrl } from "@/lib/anti-dalal";
import type { Scheme } from "@/lib/scheme-types";
import type { UserProfile } from "@/lib/scheme-matcher";
import {
  evaluateSchemeEligibility,
  type EligibilityAuditResult,
  type EvaluatedCriterion,
} from "@/lib/eligibility-evaluator";
import {
  getStoredUserProfile,
  saveStoredUserProfile,
  clearStoredUserProfile,
  PROFILE_UPDATED_EVENT,
} from "@/lib/storage";

interface EligibilityCheckerProps {
  id?: string;
  scheme: Scheme;
  allSchemes?: Scheme[];
  initialProfile?: Partial<UserProfile>;
  onProfileUpdate?: (profile: Partial<UserProfile>) => void;
  compact?: boolean;
}

export function EligibilityChecker({
  id = "eligibility-check",
  scheme,
  allSchemes = [],
  initialProfile,
  onProfileUpdate,
  compact = false,
}: EligibilityCheckerProps) {
  const { language } = useLanguage();
  const { speak, stop, isPlaying, prewarmTTS } = useSpeechSynthesis();

  const [profile, setProfile] = useState<Partial<UserProfile>>(() => {
    return initialProfile && Object.keys(initialProfile).length > 0
      ? initialProfile
      : getStoredUserProfile();
  });

  const [isEditing, setIsEditing] = useState(false);
  const [expandedDocGuide, setExpandedDocGuide] = useState<string | null>(null);
  const [readyDocs, setReadyDocs] = useState<Record<string, boolean>>({});

  // Sync from localStorage and listen to cross-tab/component updates
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<UserProfile>>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        setProfile(getStoredUserProfile());
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
  }, []);

  // Compute audit result deterministically
  const audit: EligibilityAuditResult = useMemo(() => {
    return evaluateSchemeEligibility(profile, scheme, allSchemes);
  }, [profile, scheme, allSchemes]);

  // If user profile is missing any fields required by this scheme, open edit mode by default
  useEffect(() => {
    if (audit.verdict === "needs_more_info") {
      setIsEditing(true);
    }
  }, [audit.verdict]);

  const handleFieldChange = (field: keyof UserProfile, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    saveStoredUserProfile(updated);
    if (onProfileUpdate) onProfileUpdate(updated);
  };

  const handleClearProfile = () => {
    if (
      window.confirm(
        language === "hi"
          ? "क्या आप अपनी सहेजी गई जानकारी हटाना चाहते हैं?"
          : "Are you sure you want to clear your saved profile details?"
      )
    ) {
      clearStoredUserProfile();
      setProfile({});
      setIsEditing(true);
    }
  };

  const toggleDocCheck = (docName: string) => {
    setReadyDocs((prev) => ({ ...prev, [docName]: !prev[docName] }));
  };

  const handleAudioPlayback = () => {
    prewarmTTS();
    if (isPlaying) {
      stop();
    } else {
      const textToSpeak = language === "hi" ? audit.summary_hi : audit.summary_en;
      speak(textToSpeak, language);
    }
  };

  const handleWhatsAppShare = () => {
    const detailUrl = `https://lok-saathi.vercel.app/schemes/${scheme.id}`;
    const missingDocs = audit.documentReadiness
      .filter((d) => !readyDocs[d.documentName])
      .map((d) => `• ${d.documentName}`)
      .join("\n");

    const shareText =
      language === "hi"
        ? `🏛️ *${scheme.name.hi}*\n📋 *पात्रता स्थिति:* ${
            audit.verdict === "eligible"
              ? "✅ आप पात्र हैं!"
              : audit.verdict === "not_eligible"
              ? "❌ वर्तमान में पात्र नहीं"
              : "⏳ अधूरी जानकारी"
          }\n\n📄 *आवश्यक दस्तावेज़:*\n${missingDocs || "सभी दस्तावेज़ तैयार हैं"}\n\n🔗 *पात्रता व आवेदन देखें:*\n${detailUrl}`
        : `🏛️ *${scheme.name.en}*\n📋 *Eligibility Status:* ${
            audit.verdict === "eligible"
              ? "✅ You are eligible!"
              : audit.verdict === "not_eligible"
              ? "❌ Currently not eligible"
              : "⏳ More info needed"
          }\n\n📄 *Required Documents:*\n${missingDocs || "All documents ready"}\n\n🔗 *Check details on LokSaathi:*\n${detailUrl}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const isProfileEmpty = Object.keys(profile).length === 0;

  return (
    <section
      id={id}
      aria-label={language === "hi" ? "पात्रता परीक्षक" : "Eligibility Auditor"}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6 scroll-mt-20"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {language === "hi" ? "सटीक पात्रता जांच (0% अनुमान)" : "Exact Eligibility Audit (0% Guesswork)"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {language === "hi" ? "क्या मैं इस योजना के पात्र हूँ?" : "Am I Eligible for this Scheme?"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "hi"
              ? "अपनी जानकारी दर्ज करें और तुरंत आधिकारिक सरकारी नियमों पर आधारित फैसला जानें।"
              : "Check your profile against statutory government rules with instant remediation."}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Audio Suno Button */}
          <button
            type="button"
            onClick={handleAudioPlayback}
            className={`p-2.5 rounded-full transition-all ${
              isPlaying
                ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            }`}
            title={isPlaying ? "रोकें (Stop)" : "फैसला सुनें (Listen)"}
            aria-label={isPlaying ? "Stop audio" : "Listen to eligibility verdict"}
          >
            {isPlaying ? (
              <Square className="w-4 h-4 fill-current text-red-600" />
            ) : (
              <Volume2 className="w-4 h-4 text-blue-700" />
            )}
          </button>

          {/* Toggle Edit Mini-Form */}
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title={isEditing ? "फॉर्म छुपाएं" : "जानकारी बदलें"}
            aria-label="Edit details"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Color-Coded Verdict Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          audit.verdict === "eligible"
            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
            : audit.verdict === "not_eligible"
            ? "bg-rose-50/80 border-rose-200 text-rose-950"
            : "bg-amber-50/80 border-amber-200 text-amber-950"
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div className="shrink-0 mt-0.5">
            {audit.verdict === "eligible" ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : audit.verdict === "not_eligible" ? (
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                <XCircle className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
                <HelpCircle className="w-6 h-6" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-black leading-tight">
                {audit.verdict === "eligible"
                  ? language === "hi"
                    ? "बधाई हो! आप इस योजना के पात्र हैं 🎉"
                    : "Congratulations! You are eligible 🎉"
                  : audit.verdict === "not_eligible"
                  ? language === "hi"
                    ? "वर्तमान में आप इस योजना के पात्र नहीं हैं"
                    : "Currently you do not meet the criteria"
                  : language === "hi"
                  ? "पात्रता जांचने के लिए कुछ विवरण आवश्यक हैं"
                  : "Additional details needed to verify eligibility"}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === "hi" ? "व्हाट्सएप" : "Share"}</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm mt-2 leading-relaxed font-medium opacity-90">
              {language === "hi" ? audit.summary_hi : audit.summary_en}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Mini-Form (Collapsible or Shown when needed) */}
      {isEditing && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === "hi" ? "अपनी प्रोफ़ाइल जानकारी दर्ज करें:" : "Update Your Profile:"}
              </span>
            </h4>

            {!isProfileEmpty && (
              <button
                type="button"
                onClick={handleClearProfile}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === "hi" ? "जानकारी हटाएं" : "Clear Profile"}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "hi" ? "1. निवास राज्य (State)" : "1. Residence State"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "punjab", name: language === "hi" ? "पंजाब" : "Punjab" },
                  { id: "up", name: language === "hi" ? "उत्तर प्रदेश" : "UP" },
                  { id: "delhi", name: language === "hi" ? "दिल्ली" : "Delhi" },
                  { id: "haryana", name: language === "hi" ? "हरियाणा" : "Haryana" },
                  { id: "other", name: language === "hi" ? "अन्य राज्य" : "Other" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleFieldChange("state", s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center justify-center ${
                      profile.state === s.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "hi" ? "2. लिंग (Gender)" : "2. Gender"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "female", name: language === "hi" ? "महिला (Female)" : "Female" },
                  { id: "male", name: language === "hi" ? "पुरुष (Male)" : "Male" },
                  { id: "other", name: language === "hi" ? "अन्य" : "Other" },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleFieldChange("gender", g.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center justify-center ${
                      profile.gender === g.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "hi" ? "3. आयु (Age in Years)" : "3. Age (Years)"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={profile.age ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "age",
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  placeholder="e.g. 24"
                  className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-1">
                  {[18, 25, 45, 60].map((quickAge) => (
                    <button
                      key={quickAge}
                      type="button"
                      onClick={() => handleFieldChange("age", quickAge)}
                      className="px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-xs font-semibold text-slate-800"
                    >
                      {quickAge}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Annual Income Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "hi" ? "4. पारिवारिक वार्षिक आय (Annual Income ₹)" : "4. Annual Income (₹)"}
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={profile.annual_income_inr ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "annual_income_inr",
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  placeholder="e.g. 150000"
                  className="w-36 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-1">
                  {[
                    { val: 100000, label: "₹1L" },
                    { val: 200000, label: "₹2L" },
                    { val: 250000, label: "₹2.5L" },
                    { val: 500000, label: "₹5L" },
                  ].map((inc) => (
                    <button
                      key={inc.val}
                      type="button"
                      onClick={() => handleFieldChange("annual_income_inr", inc.val)}
                      className="px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-xs font-semibold text-slate-800"
                    >
                      {inc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Occupation Picker */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "hi" ? "5. व्यवसाय / कार्य (Occupation)" : "5. Primary Occupation"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "farmer", name: language === "hi" ? "🌾 किसान" : "🌾 Farmer" },
                  { id: "student", name: language === "hi" ? "📚 छात्र / विद्यार्थी" : "📚 Student" },
                  { id: "laborer", name: language === "hi" ? "👷 श्रमिक / मज़दूर" : "👷 Worker / Labour" },
                  { id: "street_vendor", name: language === "hi" ? "🛒 स्ट्रीट वेंडर" : "🛒 Street Vendor" },
                  { id: "business", name: language === "hi" ? "💼 छोटा व्यापारी" : "💼 Small Business" },
                  { id: "homemaker", name: language === "hi" ? "👩 गृहिणी" : "👩 Homemaker" },
                  { id: "unemployed", name: language === "hi" ? "बेरोजगार" : "Unemployed" },
                ].map((occ) => {
                  const isSelected =
                    profile.occupation?.includes(occ.id) ||
                    (profile.occupation as any) === occ.id;
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(profile.occupation) ? profile.occupation : [];
                        const updated = current.includes(occ.id)
                          ? current.filter((x) => x !== occ.id)
                          : [...current, occ.id];
                        handleFieldChange("occupation", updated);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center justify-center ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {occ.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Social Category Picker */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === "hi" ? "6. सामाजिक वर्ग (Category)" : "6. Category"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "general", name: language === "hi" ? "सामान्य (General)" : "General" },
                  { id: "obc", name: language === "hi" ? "अन्य पिछड़ा वर्ग (OBC)" : "OBC" },
                  { id: "sc", name: language === "hi" ? "अनुसूचित जाति (SC)" : "SC" },
                  { id: "st", name: language === "hi" ? "अनुसूचित जनजाति (ST)" : "ST" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleFieldChange("category", cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center justify-center ${
                      profile.category === cat.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              {language === "hi" ? "जांच पूरी करें (Save & Check)" : "Done & Check Verdict"}
            </button>
          </div>
        </div>
      )}

      {/* Criteria Breakdown Grid */}
      <div className="space-y-4">
        {/* Passed Criteria */}
        {audit.passedCriteria.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {language === "hi"
                  ? `संतुष्ट शर्तें (${audit.passedCriteria.length} अनुकूल)`
                  : `Satisfied Criteria (${audit.passedCriteria.length} Matched)`}
              </span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {audit.passedCriteria.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-950 flex items-start gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <div>
                    <p className="font-bold">
                      {language === "hi" ? c.ruleDescription_hi : c.ruleDescription_en}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {language === "hi" ? c.userValueSummary_hi : c.userValueSummary_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Criteria / Gaps with Actionable Remediation */}
        {audit.failedCriteria.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2.5 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>
                {language === "hi"
                  ? `अपूर्ण या बाधित शर्तें (${audit.failedCriteria.length} अंतर)`
                  : `Unmatched Criteria (${audit.failedCriteria.length} Gaps)`}
              </span>
            </h4>
            <div className="space-y-2.5">
              {audit.failedCriteria.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">
                      {language === "hi" ? c.ruleDescription_hi : c.ruleDescription_en}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        c.gapType === "hard_disqualifier"
                          ? "bg-rose-200 text-rose-900"
                          : "bg-amber-200 text-amber-900"
                      }`}
                    >
                      {c.gapType === "hard_disqualifier"
                        ? language === "hi"
                          ? "अपरिवर्तनीय नियम"
                          : "Statutory Rule"
                        : language === "hi"
                        ? "समाधान संभव"
                        : "Fixable Gap"}
                    </span>
                  </div>

                  <p className="text-[11px] text-rose-800">
                    {language === "hi" ? c.userValueSummary_hi : c.userValueSummary_en}
                  </p>

                  {(c.remediation_hi || c.remediation_en) && (
                    <div className="p-2 bg-white/80 rounded-lg border border-rose-200 text-[11px] text-slate-800 leading-relaxed font-medium">
                      💡 <strong>{language === "hi" ? "मार्गदर्शन:" : "Remediation Guide:"}</strong>{" "}
                      {language === "hi" ? c.remediation_hi : c.remediation_en}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Document Readiness Checklist & "Kaise Banwayein" Guide */}
      <div className="pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>
            {language === "hi"
              ? "ज़रूरी दस्तावेज़ तैयारी (Document Readiness Checklist)"
              : "Required Document Acquisition Checklist"}
          </span>
        </h4>
        <p className="text-xs text-slate-500 mb-3">
          {language === "hi"
            ? "यदि आपके पास कोई दस्तावेज़ नहीं है, तो 'कैसे बनवाएं?' बटन दबाकर आधिकारिक सरकारी पोर्टल व प्रक्रिया देखें।"
            : "If you don't have a document, tap 'How to Get It?' to view official portal links and step-by-step guidance."}
        </p>

        <div className="space-y-2.5">
          {audit.documentReadiness.map((item, idx) => {
            const isReady = !!readyDocs[item.documentName];
            const isGuideOpen = expandedDocGuide === item.documentName;
            const guide = item.guide;

            return (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-all"
              >
                <div className="p-3 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isReady}
                      onChange={() => toggleDocCheck(item.documentName)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`text-xs font-bold ${
                        isReady ? "text-emerald-800 line-through opacity-80" : "text-slate-800"
                      }`}
                    >
                      {item.documentName}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDocGuide((prev) =>
                        prev === item.documentName ? null : item.documentName
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                  >
                    <span>
                      {isGuideOpen
                        ? language === "hi"
                          ? "गाइड छुपाएं"
                          : "Hide Guide"
                        : language === "hi"
                        ? "कैसे बनवाएं?"
                        : "How to Get It?"}
                    </span>
                    {isGuideOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Collapsible Document Acquisition Guide */}
                {isGuideOpen && (
                  <div className="px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-800 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {language === "hi"
                            ? guide.portal_name.hi
                            : guide.portal_name.en}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {language === "hi"
                            ? guide.estimated_days.hi
                            : guide.estimated_days.en}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-700">
                      <strong>{language === "hi" ? "ऑफलाइन सुविधा:" : "Offline Option:"}</strong>{" "}
                      {language === "hi" ? guide.offline_option.hi : guide.offline_option.en}
                    </div>

                    {guide.official_fee && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-950">
                        <strong>{language === "hi" ? "सरकारी फीस:" : "Official Fee:"}</strong>{" "}
                        {language === "hi" ? guide.official_fee.hi : guide.official_fee.en}
                      </div>
                    )}

                    {guide.anti_dalal_tip && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-950 flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>{language === "hi" ? "दलाल अलर्ट:" : "Middleman Alert:"}</strong>{" "}
                          {language === "hi" ? guide.anti_dalal_tip.hi : guide.anti_dalal_tip.en}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-[11px] text-slate-700 mb-1">
                        {language === "hi" ? "आवेदन के मुख्य कदम:" : "Step-by-step Procedure:"}
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                        {(language === "hi" ? guide.steps.hi : guide.steps.en).map(
                          (step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          )
                        )}
                      </ol>
                    </div>

                    {guide.portal_url && (
                      <div className="pt-1">
                        <a
                          href={ensureSafeHttpUrl(guide.portal_url, scheme.apply_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <span>{language === "hi" ? "आधिकारिक पोर्टल पर जाएं" : "Visit Official Portal"}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Alternative Schemes (if Not Eligible) */}
      {audit.verdict === "not_eligible" && audit.alternativeSchemes.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {language === "hi"
                ? "आपके लिए अन्य बेहतर योजनाएं (Alternative Schemes You Qualify For)"
                : "Alternative Schemes You Qualify For"}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {audit.alternativeSchemes.map((alt, idx) => (
              <Link
                key={idx}
                href={`/schemes/${alt.scheme.id}`}
                className="p-3.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-200/80 rounded-2xl transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                    {alt.scheme.state ? alt.scheme.state.toUpperCase() : "CENTRAL"}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 mt-0.5">
                    {language === "hi" ? alt.scheme.name.hi : alt.scheme.name.en}
                  </h5>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                    {language === "hi" ? alt.scheme.benefit.summary_hi : alt.scheme.benefit.summary_en}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-blue-600 mt-2 inline-flex items-center gap-1">
                  <span>{language === "hi" ? "पात्रता देखें" : "View Scheme"}</span>
                  <span>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Anti-Dalal Transparency & Citizen Protection Shield */}
      <div className="pt-2">
        <AntiDalalShield scheme={scheme} compact />
      </div>

      {/* Official Apply Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <a
          href={ensureSafeHttpUrl(scheme.apply_url, scheme.source_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
        >
          <span>
            {language === "hi"
              ? "आधिकारिक पोर्टल पर सीधे आवेदन करें"
              : "Apply on Official Government Portal"}
          </span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
        >
          <Share2 className="w-4 h-4" />
          <span>{language === "hi" ? "चेकलिस्ट व्हाट्सएप पर भेजें" : "Share on WhatsApp"}</span>
        </button>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 text-center leading-relaxed">
        🔒 <strong>{language === "hi" ? "सुरक्षा व गोपनीयता:" : "Privacy Guarantee:"}</strong>{" "}
        {language === "hi"
          ? "आपकी प्रोफ़ाइल जानकारी केवल आपके डिवाइस में सुरक्षित है और सर्वर पर स्टोर नहीं होती। लोकसाथी कभी भी आधार या बैंक खाता नंबर नहीं मांगता।"
          : "Your profile details are stored locally on your device only. LokSaathi never asks for or stores Aadhaar or banking numbers."}
      </div>
    </section>
  );
}
