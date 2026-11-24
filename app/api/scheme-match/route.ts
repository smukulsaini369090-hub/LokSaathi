import { NextRequest, NextResponse } from "next/server";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { checkRateLimit } from "@/lib/rate-limit";
import { matchSchemes, type UserProfile } from "@/lib/scheme-matcher";
import type { Scheme } from "@/lib/scheme-types";

// Cache in-memory scheme files list so we don't hit disk on every call
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
          const content = readFileSync(fullPath, "utf-8");
          schemes.push(JSON.parse(content));
        } catch (err) {
          console.error(`Failed to load scheme at ${fullPath}:`, err);
        }
      }
    }
  }

  walk(baseDir);
  cachedSchemes = schemes;
  return schemes;
}

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  // Enforce rate limit
  const rateLimitResult = await checkRateLimit(ip);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "rate_limit_exceeded",
        message_hi: "थोड़ी देर बाद कोशिश करें",
        message_en: "Too many requests. Please try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "3600",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }

  if (!body || !body.user_profile || typeof body.user_profile !== "object") {
    return NextResponse.json(
      {
        error: "missing_user_profile",
        message_hi: "उपयोगकर्ता प्रोफ़ाइल विवरण आवश्यक है",
      },
      { status: 400 }
    );
  }

  const userProfile: Partial<UserProfile> = body.user_profile;
  const language = body.language === "en" ? "en" : "hi";

  const allSchemes = loadAllSchemes();
  const matched_schemes = matchSchemes(userProfile, allSchemes);

  // Extract unique missing fields across matched schemes
  const missingFieldsSet = new Set<string>();
  for (const m of matched_schemes) {
    for (const f of m.missing_fields) {
      missingFieldsSet.add(f);
    }
  }

  return NextResponse.json({
    matched_schemes,
    missing_fields: Array.from(missingFieldsSet),
    language_detected: language,
    total_matched: matched_schemes.length,
  });
}
