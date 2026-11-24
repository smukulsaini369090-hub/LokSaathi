import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import type { Scheme } from "@/lib/scheme-types";

const REQUIRED_FIELDS: (keyof Scheme)[] = [
  "id",
  "name",
  "last_verified",
  "source_url",
  "eligibility",
  "benefit",
  "documents_required",
  "apply_url",
  "confidence",
];

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

describe("Scheme JSON schema validation", () => {
  const baseDir = join(process.cwd(), "data/schemes");
  const files = getAllSchemeFiles(baseDir);

  it("finds at least 25 scheme files", () => {
    expect(files.length).toBeGreaterThanOrEqual(25);
  });

  if (files.length > 0) {
    files.forEach((file) => {
      it(`${file} has all required fields`, () => {
        const scheme: Scheme = JSON.parse(readFileSync(file, "utf-8"));
        for (const field of REQUIRED_FIELDS) {
          expect(scheme[field], `missing field: ${field} in ${file}`).toBeDefined();
        }
      });

      it(`${file} has valid last_verified ISO date`, () => {
        const scheme: Scheme = JSON.parse(readFileSync(file, "utf-8"));
        expect(new Date(scheme.last_verified).toString()).not.toBe("Invalid Date");
      });

      it(`${file} apply_url starts with https://`, () => {
        const scheme: Scheme = JSON.parse(readFileSync(file, "utf-8"));
        expect(scheme.apply_url).toMatch(/^https:\/\//);
      });
    });
  }
});
