export interface EligibilityRule {
  field: string;
  operator: "eq" | "lte" | "gte" | "includes" | "not_includes";
  value: string | number | boolean | string[];
}

export interface Scheme {
  id: string;
  name: {
    hi: string;
    en: string;
  };
  last_verified: string; // ISO date string YYYY-MM-DD
  source_url: string; // Official portal (.gov.in or official agency)
  eligibility: {
    must_match_all: EligibilityRule[];
    must_match_none: EligibilityRule[];
  };
  benefit: {
    summary_hi: string;
    summary_en: string;
    amount_inr?: number;
    frequency?: string;
    mode?: string;
  };
  documents_required: string[];
  apply_url: string;
  deadline?: string | null;
  confidence: "verified" | "web-grounded";
  state?: "delhi" | "haryana" | "up"; // absent = central/all-India
}
