import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import type { Scheme } from "@/lib/scheme-types";

let cachedSchemes: Scheme[] | null = null;

function jurisdictionSortKey(scheme: Scheme): string {
  const code = scheme.scheme_code || scheme.id;
  return `${scheme.jurisdiction || scheme.state || "central"}:${code}`;
}

/**
 * Reads and deduplicates all scheme JSON records across `data/schemes/`.
 * Safe for both Next.js Server Components and API Route Handlers.
 */
export function loadAllSchemes(): Scheme[] {
  if (cachedSchemes && cachedSchemes.length > 0) {
    return cachedSchemes;
  }

  const baseDir = join(process.cwd(), "data/schemes");
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
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
          const content = readFileSync(fullPath, "utf-8");
          const parsed = JSON.parse(content) as Scheme;
          if (!parsed?.id) continue;

          const normId = parsed.id.toLowerCase();
          const normCode = parsed.scheme_code?.toLowerCase();
          if (seenIds.has(normId)) continue;
          if (normCode && seenCodes.has(normCode)) continue;

          seenIds.add(normId);
          if (normCode) seenCodes.add(normCode);
          schemes.push(parsed);
        } catch (err) {
          console.error(`Failed to load scheme at ${fullPath}:`, err);
        }
      }
    }
  }

  walk(baseDir);
  schemes.sort((a, b) => jurisdictionSortKey(a).localeCompare(jurisdictionSortKey(b)));
  cachedSchemes = schemes;
  return schemes;
}

/**
 * Finds an active scheme by either its canonical slug `id` (e.g. "pm-kisan")
 * or its Master Index `scheme_code` (e.g. "DL-022", "IN-041") case-insensitively.
 */
export function findSchemeByIdOrCode(
  idOrCode: string,
  allSchemes?: Scheme[]
): Scheme | null {
  if (!idOrCode) return null;
  const list = allSchemes || loadAllSchemes();
  const key = idOrCode.trim().toLowerCase();
  return (
    list.find(
      (s) =>
        s.id.toLowerCase() === key ||
        (s.scheme_code && s.scheme_code.toLowerCase() === key)
    ) || null
  );
}

/**
 * Clears in-memory scheme cache (primarily for unit tests).
 */
export function resetSchemesCache(): void {
  cachedSchemes = null;
}

export function getCatalogStats(allSchemes?: Scheme[]) {
  const list = allSchemes || loadAllSchemes();
  const counts: Record<string, number> = {
    delhi: 0,
    haryana: 0,
    up: 0,
    punjab: 0,
    central: 0,
  };
  let verifyLatestCount = 0;

  for (const s of list) {
    const j = s.jurisdiction || s.state || "central";
    counts[j] = (counts[j] || 0) + 1;
    if (
      s.verification_status === "verify_latest_notification" ||
      s.confidence === "needs-verification"
    ) {
      verifyLatestCount++;
    }
  }

  return {
    total: list.length,
    byJurisdiction: counts,
    verifyLatestCount,
  };
}
