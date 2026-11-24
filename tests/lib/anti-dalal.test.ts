import { describe, it, expect } from "vitest";
import { resolveAntiDalalInfo, getNearbyCenterMapsUrl } from "@/lib/anti-dalal";
import type { Scheme } from "@/lib/scheme-types";

describe("Anti-Dalal Rules & Resolver Engine", () => {
  const centralScheme: Scheme = {
    id: "pm-kisan",
    name: {
      hi: "प्रधानमंत्री किसान सम्मान निधि",
      en: "PM Kisan Samman Nidhi",
    },
    last_verified: "2026-11-24",
    source_url: "https://pmkisan.gov.in",
    apply_url: "https://pmkisan.gov.in/registrationform.aspx",
    eligibility: {
      must_match_all: [],
      must_match_none: [],
    },
    benefit: {
      summary_hi: "₹6,000 प्रति वर्ष",
      summary_en: "₹6,000 per year",
    },
    documents_required: ["आधार कार्ड"],
    confidence: "verified",
  };

  const punjabScheme: Scheme = {
    id: "punjab-old-age-pension",
    name: {
      hi: "पंजाब वृद्धावस्था पेंशन",
      en: "Punjab Old Age Pension",
    },
    last_verified: "2026-11-24",
    source_url: "https://socialsecurity.punjab.gov.in",
    apply_url: "https://connect.punjab.gov.in",
    state: "punjab",
    eligibility: {
      must_match_all: [],
      must_match_none: [],
    },
    benefit: {
      summary_hi: "₹1,500 प्रतिमाह",
      summary_en: "₹1,500 monthly",
    },
    documents_required: ["आधार कार्ड"],
    confidence: "verified",
  };

  const upScheme: Scheme = {
    id: "up-bocw-shramik",
    name: {
      hi: "यूपी श्रमिक पंजीकरण",
      en: "UP BOCW Shramik Card",
    },
    last_verified: "2026-11-24",
    source_url: "https://upbocw.in",
    apply_url: "https://upbocw.in/portal/apply",
    state: "up",
    eligibility: {
      must_match_all: [],
      must_match_none: [],
    },
    benefit: {
      summary_hi: "श्रमिक कल्याण योजनाएं",
      summary_en: "Labour welfare schemes",
    },
    documents_required: ["आधार कार्ड"],
    confidence: "verified",
  };

  const customScheme: Scheme = {
    id: "custom-scheme",
    name: {
      hi: "कस्टम योजना",
      en: "Custom Scheme",
    },
    last_verified: "2026-11-24",
    source_url: "https://example.gov.in",
    apply_url: "https://example.gov.in/apply",
    eligibility: {
      must_match_all: [],
      must_match_none: [],
    },
    benefit: {
      summary_hi: "लाभ",
      summary_en: "Benefit",
    },
    documents_required: ["आधार कार्ड"],
    confidence: "verified",
    anti_dalal: {
      official_fee_inr: 25,
      fee_label_hi: "₹25 आधिकारिक चालान फीस",
      fee_label_en: "₹25 official fee",
      timeline_hi: "5 कार्य दिवस",
      timeline_en: "5 working days",
      helpline: "1800-000-0000",
    },
  };

  it("resolves smart safe defaults for Central scheme in Hindi", () => {
    const info = resolveAntiDalalInfo(centralScheme, "hi");
    expect(info.officialFeeLabel).toContain("₹0");
    expect(info.cscFeeNote).toContain("₹30");
    expect(info.centerName).toContain("सीएससी");
    expect(info.helpline).toBe("14599");
    expect(info.receiptRule).toContain("रसीद");
    expect(info.mapsSearchUrl).toContain("CSC%20Common%20Service%20Centre%20near%20me");
    expect(info.officialPortalUrl).toBe("https://pmkisan.gov.in/registrationform.aspx");
    expect(info.whatsappShareText).toContain("दलालों से सावधान");
  });

  it("resolves Punjab Sewa Kendra defaults for Punjab scheme", () => {
    const infoHi = resolveAntiDalalInfo(punjabScheme, "hi");
    expect(infoHi.centerName).toContain("ਸੇਵਾ ਕੇਂਦਰ");
    expect(infoHi.helpline).toBe("1100");
    expect(infoHi.mapsSearchUrl).toContain("Sewa%20Kendra%20near%20me");

    const infoEn = resolveAntiDalalInfo(punjabScheme, "en");
    expect(infoEn.centerName).toContain("Punjab Sewa Kendra");
    expect(infoEn.officialFeeLabel).toContain("Free");
    expect(infoEn.receiptRule).toContain("acknowledgement slip");
  });

  it("resolves UP Jan Seva Kendra defaults for UP scheme", () => {
    const info = resolveAntiDalalInfo(upScheme, "hi");
    expect(info.centerName).toContain("जन सेवा केंद्र");
    expect(info.helpline).toBe("1076");
    expect(info.mapsSearchUrl).toContain("Jan%20Seva%20Kendra%20CSC%20near%20me");
  });

  it("respects custom anti_dalal overrides when provided", () => {
    const infoHi = resolveAntiDalalInfo(customScheme, "hi");
    expect(infoHi.officialFeeLabel).toBe("₹25 आधिकारिक चालान फीस");
    expect(infoHi.processingTimeline).toBe("5 कार्य दिवस");
    expect(infoHi.helpline).toBe("1800-000-0000");

    const infoEn = resolveAntiDalalInfo(customScheme, "en");
    expect(infoEn.officialFeeLabel).toBe("₹25 official fee");
    expect(infoEn.processingTimeline).toBe("5 working days");
  });

  it("generates valid Google Maps search URLs without API keys", () => {
    const defaultUrl = getNearbyCenterMapsUrl();
    expect(defaultUrl).toBe(
      "https://www.google.com/maps/search/?api=1&query=CSC%20Common%20Service%20Centre%20near%20me"
    );

    const punjabUrl = getNearbyCenterMapsUrl("punjab");
    expect(punjabUrl).toContain("Sewa%20Kendra%20near%20me");

    const customUrl = getNearbyCenterMapsUrl("haryana", "Saral Kendra Rohtak");
    expect(customUrl).toContain("Saral%20Kendra%20Rohtak");
  });
});
