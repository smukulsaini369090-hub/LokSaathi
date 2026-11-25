import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit shared API calls cleanly (bypass read-only catalog, health, and BYOK key users)
  if (pathname.startsWith("/api/")) {
    const isReadOnlyCatalogOrHealth =
      pathname === "/api/health" ||
      (pathname === "/api/schemes" && request.method === "GET");
    const hasCustomKey = !!request.headers.get("x-gemini-api-key")?.trim();

    if (isReadOnlyCatalogOrHealth || hasCustomKey) {
      return NextResponse.next();
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

    const { success, remaining } = await checkRateLimit(ip);

    if (!success) {
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

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-loksaathi-ratelimited", "1");
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - sw.js, manifest.json, icons/ (PWA assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons).*)",
  ],
};
