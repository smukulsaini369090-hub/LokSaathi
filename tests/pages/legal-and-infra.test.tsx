import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LanguageProvider } from "@/components/LanguageContext";

describe("Terms, Privacy, Footer, Error Boundaries, and PWA/SEO Infrastructure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders bilingual Terms & Privacy content with DPDP Act 2023, Non-Affiliation, and 1930 Cyber Helpline", async () => {
    const { TermsContent, PrivacyContent } = await import("@/components/TermsPrivacyContent");

    // Hindi default
    const { unmount } = render(
      <LanguageProvider>
        <TermsContent />
        <PrivacyContent />
      </LanguageProvider>
    );

    expect(screen.getByRole("heading", { name: /नियम एवं शर्तें|Terms/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /गोपनीयता सूचना|Privacy Notice/i })).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/1930/);
    expect(document.body.textContent).toMatch(/DPDP/i);
    expect(document.body.textContent).toMatch(/\.gov\.in/);
    unmount();

    // English mode
    localStorage.setItem("loksaathi_lang", "en");
    render(
      <LanguageProvider>
        <TermsContent />
        <PrivacyContent />
      </LanguageProvider>
    );
    expect(screen.getByRole("heading", { name: /Terms & Conditions/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Privacy & DPDP/i })).toBeInTheDocument();
  });

  it("Footer renders links to /terms, /privacy, /help, Permissions trigger, and 519-scheme note without duplicating shields", async () => {
    const { Footer } = await import("@/components/Footer");
    render(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    );

    expect(screen.getByRole("link", { name: /नियम|Terms/i })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: /गोपनीयता|Privacy/i })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: /मदद|Help/i })).toHaveAttribute("href", "/help");
    expect(screen.getByRole("button", { name: /अनुमतियाँ|Permissions/i })).toBeInTheDocument();
    expect(document.body.textContent).toContain("519");
  });

  it("route error.tsx and 404 not-found.tsx render calmly in hi/en without leaking stacks or internal paths", async () => {
    const ErrorBoundary = (await import("@/app/error")).default;
    const NotFoundPage = (await import("@/app/not-found")).default;
    const mockReset = vi.fn();

    const secretErr = new Error("ENOENT C:\\Users\\mukul\\Downloads\\LokSaathi\\secret.ts at line 42");
    const { unmount } = render(
      <LanguageProvider>
        <ErrorBoundary error={secretErr} reset={mockReset} />
      </LanguageProvider>
    );

    const errText = document.body.textContent || "";
    expect(errText).not.toContain("ENOENT");
    expect(errText).not.toContain("Users\\mukul");
    expect(errText).not.toContain("secret.ts");
    fireEvent.click(screen.getByRole("button", { name: /फिर कोशिश करें|Try Again/i }));
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /होम पर जाएं|Go Home/i })).toHaveAttribute("href", "/");
    unmount();

    localStorage.setItem("loksaathi_lang", "en");
    render(
      <LanguageProvider>
        <NotFoundPage />
      </LanguageProvider>
    );
    expect(screen.getByRole("heading", { name: /Page Not Found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Go Home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Find Schemes/i })).toHaveAttribute("href", "/schemes");
  });

  it("public/manifest.json has valid PWA metadata, shortcuts, and icon paths matching existing assets", async () => {
    const { readFileSync, existsSync } = await import("fs");
    const { join } = await import("path");
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "public/manifest.json"), "utf-8"));

    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("hi");
    expect(Array.isArray(manifest.icons)).toBe(true);
    for (const ic of manifest.icons) {
      expect(existsSync(join(process.cwd(), "public", ic.src.replace(/^\//, "")))).toBe(true);
    }
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);
  });

  it("global-error.tsx works completely standalone WITHOUT LanguageProvider context", async () => {
    const GlobalError = (await import("@/app/global-error")).default;
    const mockReset = vi.fn();
    const boomErr = new Error("C:\\secret\\stack_trace_leak");

    // Suppress expected <html> hydration warning inside jsdom container when testing global-error directly
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<GlobalError error={boomErr} reset={mockReset} />);
    errSpy.mockRestore();

    const text = document.body.textContent || "";
    expect(text).not.toContain("stack_trace_leak");
    expect(text).toMatch(/फिर कोशिश करें|Try Again/i);
    expect(screen.getByRole("link", { name: /होम|Home/i })).toHaveAttribute("href", "/");
  });

  it("robots.ts and sitemap.ts expose verified routes & 519 schemes with zero dev or /api path leaks", async () => {
    const robots = (await import("@/app/robots")).default;
    const sitemap = (await import("@/app/sitemap")).default;

    const robotsConfig = robots();
    expect(robotsConfig.sitemap).toBe("https://lok-saathi.vercel.app/sitemap.xml");
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
    expect(JSON.stringify(rules)).toContain("/api/");

    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://lok-saathi.vercel.app");
    expect(urls).toContain("https://lok-saathi.vercel.app/schemes");
    expect(urls).toContain("https://lok-saathi.vercel.app/terms");
    expect(urls).toContain("https://lok-saathi.vercel.app/privacy");
    expect(urls.filter((u) => u.includes("/schemes/")).length).toBe(519);
    expect(urls.some((u) => u.includes("/api/") || u.includes("/offline"))).toBe(false);
  });
});
