export interface EligibilityRule {
  field: string;
  operator: "eq" | "lte" | "gte" | "includes" | "not_includes";
  value: string | number | boolean | string[];
}

export interface AntiDalalRules {
  official_fee_inr?: number;
  fee_label_hi?: string;
  fee_label_en?: string;
  max_csc_fee_inr?: number;
  csc_fee_note_hi?: string;
  csc_fee_note_en?: string;
  processing_days?: string;
  timeline_hi?: string;
  timeline_en?: string;
  receipt_rule_hi?: string;
  receipt_rule_en?: string;
  anti_dalal_warning_hi?: string;
  anti_dalal_warning_en?: string;
  helpline?: string;
  center_name_hi?: string;
  center_name_en?: string;
  center_search_query?: string;
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
  state?: "delhi" | "haryana" | "up" | "punjab"; // absent = central/all-India
  anti_dalal?: AntiDalalRules;
}
