import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import type { SchemeMatch } from "@/lib/scheme-matcher";

const mockMatch: SchemeMatch = {
  scheme: {
    id: "pm-kisan",
    name: { hi: "पीएम किसान", en: "PM-KISAN" },
    last_verified: "2026-11-24",
    source_url: "https://pmkisan.gov.in",
    eligibility: { must_match_all: [], must_match_none: [] },
    benefit: { summary_hi: "₹6,000", summary_en: "₹6,000" },
    documents_required: ["Aadhaar"],
    apply_url: "https://pmkisan.gov.in",
    confidence: "verified",
  },
  match_confidence: "high",
  match_reason_hi: "पात्र हैं",
  match_reason_en: "Eligible",
  missing_fields: [],
};

describe("Offline Scheme Storage (lib/offline.ts)", () => {
  beforeEach(async () => {
    const { clearAllSchemes } = await import("@/lib/offline");
    await clearAllSchemes();
  });

  it("saves and retrieves a scheme match", async () => {
    const { saveScheme, getSavedSchemes } = await import("@/lib/offline");
    await saveScheme(mockMatch);

    const saved = await getSavedSchemes();
    expect(saved).toHaveLength(1);
    expect(saved[0].scheme.id).toBe("pm-kisan");
    expect(saved[0].match_confidence).toBe("high");
  });

  it("isSchemeSaved correctly detects saved and unsaved schemes", async () => {
    const { saveScheme, isSchemeSaved } = await import("@/lib/offline");
    expect(await isSchemeSaved("pm-kisan")).toBe(false);

    await saveScheme(mockMatch);
    expect(await isSchemeSaved("pm-kisan")).toBe(true);
    expect(await isSchemeSaved("unknown-scheme")).toBe(false);
  });

  it("removes a saved scheme by id", async () => {
    const { saveScheme, removeScheme, getSavedSchemes, isSchemeSaved } =
      await import("@/lib/offline");
    await saveScheme(mockMatch);
    expect(await isSchemeSaved("pm-kisan")).toBe(true);

    await removeScheme("pm-kisan");
    expect(await isSchemeSaved("pm-kisan")).toBe(false);
    const saved = await getSavedSchemes();
    expect(saved).toHaveLength(0);
  });
});
