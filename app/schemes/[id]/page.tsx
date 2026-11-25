import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { SchemeDetailClient } from "@/components/SchemeDetailClient";
import type { Scheme } from "@/lib/scheme-types";

let cachedSchemes: Scheme[] | null = null;

function loadAllSchemes(): Scheme[] {
  if (cachedSchemes && cachedSchemes.length > 0) {
    return cachedSchemes;
  }

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
  cachedSchemes = schemes;
  return schemes;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const scheme = loadAllSchemes().find((s) => s.id === id);

  if (!scheme) {
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
  const scheme = allSchemes.find((s) => s.id === id);

  if (!scheme) {
    notFound();
  }

  return <SchemeDetailClient scheme={scheme} allSchemes={allSchemes} />;
}
