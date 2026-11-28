import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { SchemeDetailClient } from "@/components/SchemeDetailClient";
import { loadAllSchemes, findSchemeByIdOrCode } from "@/lib/schemes-loader";
import { getRedirectByLegacySlug } from "@/lib/scheme-redirects";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const allSchemes = loadAllSchemes();
  const scheme = findSchemeByIdOrCode(id, allSchemes);

  if (!scheme) {
    const redirect = getRedirectByLegacySlug(id);
    if (redirect) {
      return {
        title: `${redirect.old_name_hi} (${redirect.old_name_en}) | LokSaathi`,
        description: redirect.alert_message_hi,
      };
    }
    return {
      title: "Scheme Not Found | LokSaathi",
    };
  }

  const title = `${scheme.name.hi} (${scheme.name.en}) | LokSaathi`;
  const description = `लाभ: ${scheme.benefit.summary_hi} | पात्रता जांच, ज़रूरी कागज़ात और दलाल-मुक्त आधिकारिक शुल्क जानकारी।`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://lok-saathi.vercel.app/schemes/${scheme.id}`,
      type: "article",
      images: [
        {
          url: "/icons/icon-512.png",
          width: 512,
          height: 512,
          alt: scheme.name.en,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SchemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const allSchemes = loadAllSchemes();
  const scheme = findSchemeByIdOrCode(id, allSchemes);

  if (!scheme) {
    const redirect = getRedirectByLegacySlug(id);
    if (redirect) {
      const replacementSchemes = redirect.replacement_codes
        .map((code) => findSchemeByIdOrCode(code, allSchemes))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));

      return (
        <div className="px-4 py-8 max-w-2xl mx-auto space-y-6">
          <Link
            href="/schemes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>सभी योजनाएं देखें / All Schemes</span>
          </Link>

          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {redirect.status.replace(/_/g, " ")}
                </span>
                <h1 className="text-xl font-extrabold text-gray-900">
                  {redirect.old_name_hi}
                </h1>
                <p className="text-sm font-semibold text-gray-600">
                  {redirect.old_name_en}
                </p>
              </div>
            </div>

            <div className="bg-white/90 rounded-2xl p-4 border border-amber-200 space-y-2 text-sm text-gray-800 leading-relaxed">
              <p className="font-bold text-amber-900">{redirect.alert_title_hi}</p>
              <p className="font-semibold">{redirect.alert_message_hi}</p>
              <p className="text-gray-600 text-xs">{redirect.alert_message_en}</p>
            </div>

            {replacementSchemes.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  सक्रिय / प्रतिस्थापन योजना (Active Replacement Scheme)
                </h2>
                <div className="grid gap-2.5">
                  {replacementSchemes.map((rep) => (
                    <Link
                      key={rep.id}
                      href={`/schemes/${rep.id}`}
                      prefetch={false}
                      className="flex items-center justify-between gap-3 bg-white hover:bg-blue-50 border border-blue-200 rounded-2xl p-4 transition-colors shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {rep.scheme_code && (
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              {rep.scheme_code}
                            </span>
                          )}
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {rep.name.hi}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{rep.name.en}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    notFound();
  }

  return <SchemeDetailClient scheme={scheme} allSchemes={allSchemes} />;
}
