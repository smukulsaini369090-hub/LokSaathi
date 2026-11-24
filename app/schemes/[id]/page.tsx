import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { ArrowLeft, ExternalLink, ShieldCheck, FileText, Calendar, Share2, Sparkles } from "lucide-react";
import { EligibilityBadge } from "@/components/EligibilityBadge";
import { EligibilityChecker } from "@/components/EligibilityChecker";
import type { Scheme } from "@/lib/scheme-types";

function loadAllSchemes(): Scheme[] {
  const baseDir = join(process.cwd(), "data/schemes");
  const schemes: Scheme[] = [];

  function walk(dir: string) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".json")) {
        try {
          const scheme: Scheme = JSON.parse(readFileSync(fullPath, "utf-8"));
          schemes.push(scheme);
        } catch {}
      }
    }
  }

  walk(baseDir);
  return schemes;
}

export default async function SchemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const allSchemes = loadAllSchemes();
  const scheme = allSchemes.find((s) => s.id === id);

  if (!scheme) {
    notFound();
  }

  const detailUrl = `https://lok-saathi.vercel.app/schemes/${scheme.id}`;
  const waShareText = `🏛️ *${scheme.name.hi}*\n💰 *लाभ:* ${scheme.benefit.summary_hi}\n📄 *ज़रूरी कागज़:* ${scheme.documents_required.join(", ")}\n\n✅ *लोकसाथी पर पात्रता और आवेदन देखें:*\n${detailUrl}`;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waShareText)}`;

  return (
    <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/schemes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>योजना सूची पर वापस जाएं (Back to schemes)</span>
        </Link>

        <a
          href="#eligibility-check"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>क्या मैं पात्र हूँ? (Check Eligibility)</span>
        </a>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <EligibilityBadge confidence={scheme.confidence} language="hi" />
            {scheme.state && (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {scheme.state === "punjab"
                  ? "🏛️ पंजाब राज्य"
                  : scheme.state === "up"
                  ? "🏛️ उत्तर प्रदेश"
                  : scheme.state === "delhi"
                  ? "🏛️ दिल्ली"
                  : "🏛️ हरियाणा"}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-2">
            {scheme.name.hi}
          </h1>
          <p className="text-sm text-gray-500 mb-4 font-medium">
            {scheme.name.en}
          </p>

          {/* Benefit Box */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <h2 className="text-xs uppercase font-bold text-emerald-800 tracking-wide mb-1">
              योजना का मुख्य लाभ (Benefit)
            </h2>
            <p className="text-base text-emerald-950 font-semibold leading-relaxed">
              {scheme.benefit.summary_hi}
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              {scheme.benefit.summary_en}
            </p>
          </div>
        </div>

        {/* Verification & Official .gov.in Source */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <span className="font-semibold text-gray-900">अंतिम सत्यापन:</span>{" "}
              {scheme.last_verified}
            </span>
          </div>
          {scheme.source_url && (
            <a
              href={scheme.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
            >
              <span>आधिकारिक स्रोत (.gov.in)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Required Documents */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>आवेदन के लिए आवश्यक दस्तावेज़ (Required Documents)</span>
          </h2>
          <ul className="space-y-2">
            {scheme.documents_required.map((doc, idx) => (
              <li
                key={idx}
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Interactive Eligibility Checker */}
        <div className="pt-2">
          <EligibilityChecker id="eligibility-check" scheme={scheme} allSchemes={allSchemes} />
        </div>

        {/* Non-Government Trust Disclaimer */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed text-center">
          ⚖️ <strong>महत्वपूर्ण सूचना (Disclaimer):</strong> लोकसाथी (LokSaathi) एक स्वतंत्र नागरिक सहायता मंच है। यह किसी भी सरकारी विभाग की आधिकारिक वेबसाइट नहीं है। योजना विवरण आधिकारिक सरकारी पोर्टलों (.gov.in) से सत्यापित हैं।
        </div>
      </div>
    </div>
  );
}
