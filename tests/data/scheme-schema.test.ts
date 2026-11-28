import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import type { Scheme, SchemeCategory, SchemeJurisdiction } from "@/lib/scheme-types";
import { translateDocumentName } from "@/lib/document-guides";

const REQUIRED_FIELDS: (keyof Scheme)[] = [
  "id",
  "scheme_code",
  "jurisdiction",
  "category",
  "scale",
  "department",
  "name",
  "bilingual_title",
  "last_verified",
  "source_url",
  "eligibility",
  "eligibility_criteria",
  "benefit",
  "benefit_summary",
  "documents_required",
  "application_steps",
  "apply_url",
  "confidence",
  "verification_status",
  "anti_dalal",
];

const VALID_CATEGORIES = new Set<SchemeCategory>([
  "Education",
  "Health",
  "Women & Girl Child",
  "Pensions & Seniors",
  "Agriculture & Animal Husbandry",
  "Housing & Shelter",
  "Employment, Skill & MSME",
  "Labour & BOCW",
  "SC/ST/OBC/Minority Welfare",
  "Divyangjan Welfare",
  "Utility Subsidies & Food",
  "Sports, Legal & Niche",
]);

const VALID_JURISDICTIONS = new Set<SchemeJurisdiction>([
  "delhi",
  "haryana",
  "up",
  "punjab",
  "central",
]);

function getAllSchemeFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  let files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files = files.concat(getAllSchemeFiles(fullPath));
    } else if (entry.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Scheme JSON schema & 519-scheme catalog validation", () => {
  const baseDir = join(process.cwd(), "data/schemes");
  const files = getAllSchemeFiles(baseDir);
  const schemes: Array<{ file: string; data: Scheme }> = files.map((file) => ({
    file,
    data: JSON.parse(readFileSync(file, "utf-8")) as Scheme,
  }));

  it("ingests exact 519 unique active scheme files with zero duplicates", () => {
    expect(schemes.length).toBe(519);

    const ids = new Set<string>();
    const codes = new Set<string>();
    const byJurisdiction: Record<string, number> = {
      delhi: 0,
      haryana: 0,
      up: 0,
      punjab: 0,
      central: 0,
    };

    for (const { file, data } of schemes) {
      expect(ids.has(data.id), `Duplicate id ${data.id} in ${file}`).toBe(false);
      ids.add(data.id);

      expect(data.scheme_code, `Missing scheme_code in ${file}`).toBeTruthy();
      expect(codes.has(data.scheme_code!), `Duplicate scheme_code ${data.scheme_code} in ${file}`).toBe(false);
      codes.add(data.scheme_code!);

      expect(VALID_JURISDICTIONS.has(data.jurisdiction!), `Invalid jurisdiction in ${file}`).toBe(true);
      byJurisdiction[data.jurisdiction!]++;
    }

    expect(byJurisdiction).toEqual({
      delhi: 95,
      haryana: 119,
      up: 112,
      punjab: 90,
      central: 103,
    });
  });

  it("validates all required fields, 12 categories, bilingual titles, anti-dalal rules, and HTTPS URLs across all 519 schemes", () => {
    let verifyLatestCount = 0;

    for (const { file, data } of schemes) {
      for (const field of REQUIRED_FIELDS) {
        expect(data[field], `missing field: ${field} in ${file}`).toBeDefined();
      }

      expect(VALID_CATEGORIES.has(data.category!), `invalid category ${data.category} in ${file}`).toBe(true);
      expect(data.name.hi.trim().length, `empty name.hi in ${file}`).toBeGreaterThan(0);
      expect(data.name.en.trim().length, `empty name.en in ${file}`).toBeGreaterThan(0);
      expect(data.bilingual_title?.hi.trim().length, `empty bilingual_title.hi in ${file}`).toBeGreaterThan(0);
      expect(data.bilingual_title?.en.trim().length, `empty bilingual_title.en in ${file}`).toBeGreaterThan(0);
      expect(data.benefit.summary_hi.trim().length, `empty summary_hi in ${file}`).toBeGreaterThan(0);
      expect(data.benefit.summary_en.trim().length, `empty summary_en in ${file}`).toBeGreaterThan(0);
      expect(data.documents_required.length, `empty documents_required in ${file}`).toBeGreaterThan(0);
      expect(new Date(data.last_verified).toString(), `invalid date in ${file}`).not.toBe("Invalid Date");
      expect(data.apply_url, `non-https apply_url in ${file}`).toMatch(/^https:\/\//);
      expect(data.source_url, `non-https source_url in ${file}`).toMatch(/^https:\/\//);
      expect(data.application_steps?.facilitation_center, `missing facilitation_center in ${file}`).toBeTruthy();
      expect(data.anti_dalal?.receipt_rule, `missing receipt_rule in ${file}`).toBeTruthy();
      expect(data.anti_dalal?.middleman_warning, `missing middleman_warning in ${file}`).toBeTruthy();

      if (data.verification_status === "verify_latest_notification") {
        verifyLatestCount++;
      }
    }

    expect(verifyLatestCount).toBe(102);
  });

  it("ensures 100% bilingual document translation parity (0 Devanagari in EN mode, 0 untranslated ASCII in HI mode)", () => {
    const devanagariRe = /[\u0900-\u097F]/;
    const leakedEn: string[] = [];
    const leakedHi: string[] = [];

    for (const { data } of schemes) {
      for (const doc of data.documents_required) {
        const enDoc = translateDocumentName(doc, "en");
        const hiDoc = translateDocumentName(doc, "hi");
        if (devanagariRe.test(enDoc)) {
          leakedEn.push(`${data.scheme_code}: ${doc} -> ${enDoc}`);
        }
        if (!devanagariRe.test(hiDoc)) {
          leakedHi.push(`${data.scheme_code}: ${doc} -> ${hiDoc}`);
        }
      }
    }

    expect(leakedEn, `Devanagari leaked in English mode:\n${leakedEn.slice(0, 10).join("\n")}`).toEqual([]);
    expect(leakedHi, `English untranslated in Hindi mode:\n${leakedHi.slice(0, 10).join("\n")}`).toEqual([]);
  });
});
