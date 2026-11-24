import { describe, it, expect } from "vitest";
import {
  evaluateSchemeEligibility,
  detectTargetScheme,
} from "@/lib/eligibility-evaluator";
import type { Scheme } from "@/lib/scheme-types";
import type { UserProfile } from "@/lib/scheme-matcher";

const mockSchemes: Scheme[] = [
  {
    id: "pm-kisan",
    name: {
      hi: "प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)",
      en: "PM Kisan Samman Nidhi (PM-KISAN)",
    },
    last_verified: "2026-11-24",
    source_url: "https://pmkisan.gov.in",
    eligibility: {
      must_match_all: [
        { field: "occupation", operator: "includes", value: ["farmer"] },
        { field: "land_owned_acres", operator: "lte", value: 5 },
      ],
      must_match_none: [
        { field: "is_income_tax_payer", operator: "eq", value: true },
        { field: "is_government_employee", operator: "eq", value: true },
      ],
    },
    benefit: {
      summary_hi: "₹6,000 प्रति वर्ष",
      summary_en: "₹6,000 per year via DBT",
      amount_inr: 6000,
    },
    documents_required: [
      "आधार कार्ड",
      "बैंक खाता पासबुक",
      "भूमि के दस्तावेज (खतौनी/जमाबंदी)",
    ],
    apply_url: "https://pmkisan.gov.in",
    confidence: "verified",
  },
  {
    id: "punjab-mukh-mantri-sehat-bima",
    name: {
      hi: "मुख्यमंत्री सेहत बीमा योजना (सरबत सेहत बीमा)",
      en: "Mukh Mantri Sehat Bima Yojana (Sarbat Sehat Bima)",
    },
    last_verified: "2026-11-24",
    source_url: "https://sha.punjab.gov.in",
    state: "punjab",
    eligibility: {
      must_match_all: [
        { field: "state", operator: "eq", value: "punjab" },
        { field: "annual_income_inr", operator: "lte", value: 250000 },
      ],
      must_match_none: [
        { field: "is_government_employee", operator: "eq", value: true },
      ],
    },
    benefit: {
      summary_hi: "₹5 लाख तक का कैशलेस इलाज",
      summary_en: "Up to ₹5 lakh cashless healthcare",
      amount_inr: 500000,
    },
    documents_required: ["आधार कार्ड", "पंजाब निवास प्रमाण पत्र (Domicile)"],
    apply_url: "https://sha.punjab.gov.in",
    confidence: "verified",
  },
  {
    id: "ayushman-bharat",
    name: {
      hi: "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना",
      en: "Ayushman Bharat - PM-JAY",
    },
    last_verified: "2026-11-24",
    source_url: "https://pmjay.gov.in",
    eligibility: {
      must_match_all: [
        { field: "annual_income_inr", operator: "lte", value: 250000 },
      ],
      must_match_none: [
        { field: "is_government_employee", operator: "eq", value: true },
      ],
    },
    benefit: {
      summary_hi: "₹5 लाख स्वास्थ्य बीमा",
      summary_en: "₹5 lakh health insurance",
    },
    documents_required: ["आधार कार्ड", "राशन कार्ड"],
    apply_url: "https://pmjay.gov.in",
    confidence: "verified",
  },
  {
    id: "e-shram",
    name: {
      hi: "ई-श्रम कार्ड योजना",
      en: "e-Shram Card Scheme",
    },
    last_verified: "2026-11-24",
    source_url: "https://eshram.gov.in",
    eligibility: {
      must_match_all: [
        { field: "age", operator: "gte", value: 16 },
        { field: "age", operator: "lte", value: 59 },
      ],
      must_match_none: [
        { field: "is_government_employee", operator: "eq", value: true },
      ],
    },
    benefit: {
      summary_hi: "₹2 लाख दुर्घटना बीमा",
      summary_en: "₹2 lakh accident insurance",
    },
    documents_required: ["आधार कार्ड", "बैंक पासबुक"],
    apply_url: "https://eshram.gov.in",
    confidence: "verified",
  },
];

describe("Specific-Scheme Eligibility Evaluator (lib/eligibility-evaluator.ts)", () => {
  it("evaluates an eligible user correctly with 0 LLM calls", () => {
    const profile: Partial<UserProfile> = {
      state: "up",
      age: 40,
      gender: "male",
      occupation: ["farmer"],
      annual_income_inr: 120000,
      land_owned_acres: 2.5,
      is_government_employee: false,
      is_income_tax_payer: false,
    };

    const result = evaluateSchemeEligibility(profile, mockSchemes[0], mockSchemes);

    expect(result.verdict).toBe("eligible");
    expect(result.failedCriteria.length).toBe(0);
    expect(result.passedCriteria.length).toBeGreaterThan(0);
    expect(result.missingFields.length).toBe(0);
    expect(result.documentReadiness.length).toBe(3);
    expect(result.documentReadiness[0].guide.id).toBe("aadhaar-update");
    expect(result.summary_hi).toContain("बधाई हो");
    expect(result.summary_en).toContain("Congratulations");
  });

  it("evaluates state mismatch as hard_disqualifier and returns alternative schemes", () => {
    const profile: Partial<UserProfile> = {
      state: "up", // UP user applying for Punjab scheme
      age: 35,
      annual_income_inr: 150000,
      is_government_employee: false,
    };

    const result = evaluateSchemeEligibility(profile, mockSchemes[1], mockSchemes);

    expect(result.verdict).toBe("not_eligible");
    expect(result.failedCriteria.length).toBeGreaterThan(0);

    const stateGap = result.failedCriteria.find((c) => c.field === "state");
    expect(stateGap).toBeDefined();
    expect(stateGap?.gapType).toBe("hard_disqualifier");
    expect(stateGap?.userValueSummary_hi).toContain("उत्तर प्रदेश");

    // Must return alternative schemes the user DOES qualify for
    expect(result.alternativeSchemes.length).toBeGreaterThan(0);
    expect(result.alternativeSchemes.some((alt) => alt.scheme.id === "ayushman-bharat")).toBe(true);
  });

  it("evaluates income above threshold as hard_disqualifier", () => {
    const profile: Partial<UserProfile> = {
      state: "punjab",
      annual_income_inr: 600000, // Exceeds ₹2,50,000 cap
      is_government_employee: false,
    };

    const result = evaluateSchemeEligibility(profile, mockSchemes[1], mockSchemes);

    expect(result.verdict).toBe("not_eligible");
    const incomeGap = result.failedCriteria.find((c) => c.field === "annual_income_inr");
    expect(incomeGap).toBeDefined();
    expect(incomeGap?.gapType).toBe("hard_disqualifier");
  });

  it("evaluates partial profile as needs_more_info returning only missing fields for that scheme", () => {
    const partialProfile: Partial<UserProfile> = {
      occupation: ["farmer"],
      // land_owned_acres is missing!
    };

    const result = evaluateSchemeEligibility(partialProfile, mockSchemes[0], mockSchemes);

    expect(result.verdict).toBe("needs_more_info");
    expect(result.missingFields).toContain("land_owned_acres");
    expect(result.failedCriteria.length).toBe(0);
  });

  describe("detectTargetScheme fuzzy matching", () => {
    it("detects schemes by English keywords and acronyms", () => {
      expect(detectTargetScheme("Am I eligible for PM-Kisan?", mockSchemes)?.id).toBe("pm-kisan");
      expect(detectTargetScheme("Can I apply for ayushman bharat card?", mockSchemes)?.id).toBe("ayushman-bharat");
      expect(detectTargetScheme("Tell me about sarbat sehat bima yojana", mockSchemes)?.id).toBe("punjab-mukh-mantri-sehat-bima");
    });

    it("detects schemes by Hindi Devanagari text", () => {
      expect(detectTargetScheme("क्या मुझे किसान सम्मान निधि मिल सकती है?", mockSchemes)?.id).toBe("pm-kisan");
      expect(detectTargetScheme("आयुष्मान भारत योजना के नियम बताएं", mockSchemes)?.id).toBe("ayushman-bharat");
      expect(detectTargetScheme("ई-श्रम कार्ड पात्रता", mockSchemes)?.id).toBe("e-shram");
    });

    it("detects schemes by Hinglish transliterations", () => {
      expect(detectTargetScheme("kya main pm kisan ke liye eligible hoon?", mockSchemes)?.id).toBe("pm-kisan");
      expect(detectTargetScheme("mukh mantri sehat bima ka form kaise bharein", mockSchemes)?.id).toBe("punjab-mukh-mantri-sehat-bima");
    });

    it("returns null for generic messages with no target scheme", () => {
      expect(detectTargetScheme("Namaste, mujhe sarkari madad chahiye", mockSchemes)).toBeNull();
      expect(detectTargetScheme("Main 25 saal ka student hoon", mockSchemes)).toBeNull();
    });
  });
});
