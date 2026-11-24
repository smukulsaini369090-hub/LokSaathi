import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { ArrowLeft, ExternalLink, ShieldCheck, FileText, Calendar } from "lucide-react";
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

  return (
    <div className="px-4 py-6 space-y-6">
      <Link
        href="/schemes"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>योजना सूची पर वापस जाएं (Back to schemes)</span>
      </Link>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <div className="mb-3">
          <EligibilityBadge confidence={scheme.confidence} language="hi" />
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

        {/* Meta verification */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 pt-4 border-t border-gray-100">
          <Calendar className="w-4 h-4" />
          <span>अंतिम सरकारी सत्यापन: {scheme.last_verified}</span>
        </div>

        {/* Action Button */}
        <a
          href={scheme.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md"
        >
          <span>आधिकारिक पोर्टल पर आवेदन करें</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
