import { describe, it, expect } from "vitest";
import { matchSchemes } from "@/lib/scheme-matcher";
import type { Scheme } from "@/lib/scheme-types";

const pmKisan: Scheme = {
  id: "pm-kisan",
  name: { hi: "पीएम किसान", en: "PM-KISAN" },
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
    summary_hi: "₹6,000 सालाना",
    summary_en: "₹6,000/year",
    amount_inr: 6000,
  },
  documents_required: ["Aadhaar", "Bank Passbook", "Land Record"],
  apply_url: "https://pmkisan.gov.in/registrationform.aspx",
  confidence: "verified",
};

const upKanyaSumangala: Scheme = {
  id: "up-kanya-sumangala",
  name: { hi: "कन्या सुमंगला", en: "Kanya Sumangala" },
  last_verified: "2026-11-24",
  source_url: "https://mksy.up.gov.in",
  state: "up",
  eligibility: {
    must_match_all: [
      { field: "gender", operator: "eq", "value": "female" },
      { field: "state", operator: "eq", "value": "up" },
      { field: "annual_income_inr", operator: "lte", "value": 300000 },
    ],
    must_match_none: [],
  },
  benefit: {
    summary_hi: "₹25,000 सहायता",
    summary_en: "₹25,000 assistance",
    amount_inr: 25000,
  },
  documents_required: ["Aadhaar", "Birth Certificate"],
  apply_url: "https://mksy.up.gov.in",
  confidence: "verified",
};

describe("matchSchemes Rule Engine", () => {
  it("returns high-confidence match for a fully qualifying farmer", () => {
    const profile = {
      occupation: ["farmer"],
      land_owned_acres: 2,
      annual_income_inr: 80000,
      state: "up" as const,
      age: 42,
      gender: "male" as const,
      category: "obc" as const,
      is_income_tax_payer: false,
      is_government_employee: false,
    };
    const matches = matchSchemes(profile, [pmKisan]);
    expect(matches).toHaveLength(1);
    expect(matches[0].scheme.id).toBe("pm-kisan");
    expect(matches[0].match_confidence).toBe("high");
    expect(matches[0].missing_fields).toHaveLength(0);
    expect(matches[0].match_reason_hi).toBeTruthy();
  });

  it("excludes schemes where must_match_none condition is met", () => {
    const profile = {
      occupation: ["farmer"],
      land_owned_acres: 2,
      is_income_tax_payer: true, // Disqualifier
      state: "up" as const,
      age: 42,
      gender: "male" as const,
      annual_income_inr: 800000,
      category: "general" as const,
    };
    const matches = matchSchemes(profile as any, [pmKisan]);
    expect(matches).toHaveLength(0);
  });

  it("returns medium confidence and missing_fields when profile is partial (Review Focus 1)", () => {
    // land_owned_acres not provided — matcher cannot confirm lte:5 rule
    const partial = {
      occupation: ["farmer"],
      state: "up" as const,
      age: 42,
      gender: "male" as const,
      annual_income_inr: 80000,
      category: "obc" as const,
    };
    const matches = matchSchemes(partial, [pmKisan]);
    expect(matches).toHaveLength(1);
    expect(matches[0].match_confidence).toBe("medium");
    expect(matches[0].missing_fields).toContain("land_owned_acres");
  });

  it("excludes state-specific schemes when user is in a different state", () => {
    const delhiUser = {
      state: "delhi" as const,
      gender: "female" as const,
      age: 18,
      annual_income_inr: 150000,
      category: "general" as const,
      occupation: ["student"],
    };
    const matches = matchSchemes(delhiUser, [upKanyaSumangala]);
    expect(matches).toHaveLength(0);
  });

  it("matches state-specific schemes when user is in the correct state", () => {
    const upUser = {
      state: "up" as const,
      gender: "female" as const,
      age: 18,
      annual_income_inr: 150000,
      category: "general" as const,
      occupation: ["student"],
    };
    const matches = matchSchemes(upUser, [upKanyaSumangala]);
    expect(matches).toHaveLength(1);
    expect(matches[0].scheme.id).toBe("up-kanya-sumangala");
    expect(matches[0].match_confidence).toBe("high");
  });

  it("returns empty array for non-matching occupation and income", () => {
    const itWorker = {
      occupation: ["software_engineer"],
      state: "delhi" as const,
      age: 28,
      gender: "male" as const,
      annual_income_inr: 1200000,
      category: "general" as const,
    };
    const matches = matchSchemes(itWorker, [pmKisan]);
    expect(matches).toHaveLength(0);
  });
});
