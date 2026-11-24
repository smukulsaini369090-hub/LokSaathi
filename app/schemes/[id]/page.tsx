import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { ArrowLeft, ExternalLink, ShieldCheck, FileText, Calendar, Share2 } from "lucide-react";
import { EligibilityBadge } from "@/components/EligibilityBadge";
import type { Scheme } from "@/lib/scheme-types";

function findSchemeById(id: string): Scheme | null {
  const baseDir = join(process.cwd(), "data/schemes");

  function walk(dir: string): Scheme | null {
    if (!existsSync(dir)) return null;
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        const found = walk(fullPath);
        if (found) return found;
      } else if (entry.endsWith(".json")) {
        try {
          const scheme: Scheme = JSON.parse(readFileSync(fullPath, "utf-8"));
          if (scheme.id === id) return scheme;
        } catch {}
      }
    }
    return null;
  }

  return walk(baseDir);
}

export default async function SchemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scheme = findSchemeById(id);

  if (!scheme) {
    notFound();
  }

  const detailUrl = `https://lok-saathi.vercel.app/schemes/${scheme.id}`;
  const waShareText = `🏛️ *${scheme.name.hi}*\n💰 *लाभ:* ${scheme.benefit.summary_hi}\n📄 *ज़रूरी कागज़:* ${scheme.documents_required.join(", ")}\n\n✅ *लोकसाथी पर पात्रता और आवेदन देखें:*\n${detailUrl}`;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waShareText)}`;

  return (
    <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
      <Link
        href="/schemes"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>योजना सूची पर वापस जाएं (Back to schemes)</span>
      </Link>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
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
        <p className="text-sm text-gray-500 mb-6 font-medium">
          {scheme.name.en}
        </p>

        {/* Benefit Box */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6">
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

        {/* Required Documents */}
        <div className="mb-6">
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

        {/* Verification & Official .gov.in Source */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-gray-700">
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

        {/* Action Buttons: Apply + 1-Tap WhatsApp Share */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <a
            href={scheme.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md active:scale-95"
          >
            <span>आधिकारिक पोर्टल पर आवेदन करें</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md active:scale-95"
          >
            <Share2 className="w-5 h-5" />
            <span>व्हाट्सएप पर शेयर करें</span>
          </a>
        </div>

        {/* Non-Government Trust Disclaimer */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed text-center">
          ⚖️ <strong>महत्वपूर्ण सूचना (Disclaimer):</strong> लोकसाथी (LokSaathi) एक स्वतंत्र नागरिक सहायता मंच है। यह किसी भी सरकारी विभाग की आधिकारिक वेबसाइट नहीं है। योजना विवरण आधिकारिक सरकारी पोर्टलों (.gov.in) से सत्यापित हैं।
        </div>
      </div>
    </div>
  );
}
