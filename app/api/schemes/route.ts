import { NextResponse } from "next/server";
import { loadAllSchemes, getCatalogStats } from "@/lib/schemes-loader";
import { SCHEME_REDIRECTS } from "@/lib/scheme-redirects";

export async function GET() {
  const schemes = loadAllSchemes();
  const stats = getCatalogStats(schemes);
  return NextResponse.json({ schemes, redirects: SCHEME_REDIRECTS, stats });
}
