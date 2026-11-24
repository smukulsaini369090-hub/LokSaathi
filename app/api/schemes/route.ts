import { NextResponse } from "next/server";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import type { Scheme } from "@/lib/scheme-types";

let cachedSchemes: Scheme[] | null = null;

export async function GET() {
  if (cachedSchemes && cachedSchemes.length > 0) {
    return NextResponse.json({ schemes: cachedSchemes });
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
          const content = readFileSync(fullPath, "utf-8");
          schemes.push(JSON.parse(content));
        } catch (err) {
          console.error(`Failed to parse scheme at ${fullPath}:`, err);
        }
      }
    }
  }

  walk(baseDir);
  cachedSchemes = schemes;
  return NextResponse.json({ schemes });
}
