export type SchemeJurisdiction = "delhi" | "haryana" | "up" | "punjab" | "central";

export type SchemeCategory =
  | "Education"
  | "Health"
  | "Women & Girl Child"
  | "Pensions & Seniors"
  | "Agriculture & Animal Husbandry"
  | "Housing & Shelter"
  | "Employment, Skill & MSME"
  | "Labour & BOCW"
  | "SC/ST/OBC/Minority Welfare"
  | "Divyangjan Welfare"
  | "Utility Subsidies & Food"
  | "Sports, Legal & Niche";

export type SchemeScale = "Major" | "Minor";
export type SchemeVerificationStatus = "verified" | "verify_latest_notification";

export interface EligibilityRule {
  field: string;
  operator: "eq" | "lte" | "gte" | "includes" | "not_includes";
  value: string | number | boolean | string[];
}

export interface StructuredEligibilityCriteria {
  domicile_ncr_rule: string;
  age_range: string;
  income_cap: string;
  category_rules: string;
  academic_or_work_rules: string;
  exclusions: string;
}

export interface ApplicationStepsInfo {
  online: string;
  offline: string;
  facilitation_center: string;
}

export interface AntiDalalRules {
  official_fee_inr?: number;
  official_fee?: string;
  fee_label_hi?: string;
  fee_label_en?: string;
  max_csc_fee_inr?: number;
  csc_fee_note_hi?: string;
  csc_fee_note_en?: string;
  processing_days?: string;
  timeline_hi?: string;
  timeline_en?: string;
  receipt_rule?: string;
  receipt_rule_hi?: string;
  receipt_rule_en?: string;
  middleman_warning?: string;
  anti_dalal_warning_hi?: string;
  anti_dalal_warning_en?: string;
  helpline?: string;
  center_name_hi?: string;
  center_name_en?: string;
  center_search_query?: string;
}

export interface Scheme {
  id: string;
  scheme_code?: string; // e.g. DL-001..DL-095, HR-001..HR-119, UP-001..UP-112, PB-001..PB-090, IN-001..IN-103
  jurisdiction?: SchemeJurisdiction;
  category?: SchemeCategory;
  scale?: SchemeScale;
  department?: string;
  name: {
    hi: string;
    en: string;
  };
  bilingual_title?: {
    en: string;
    hi: string;
  };
  last_verified: string; // ISO date string YYYY-MM-DD
  source_url: string; // Official portal (.gov.in or official agency)
  eligibility: {
    must_match_all: EligibilityRule[];
    must_match_none: EligibilityRule[];
  };
  eligibility_criteria?: StructuredEligibilityCriteria;
  benefit: {
    summary_hi: string;
    summary_en: string;
    amount_inr?: number;
    frequency?: string;
    mode?: string;
  };
  benefit_summary?: {
    en: string;
    hi: string;
  };
  documents_required: string[];
  application_steps?: ApplicationStepsInfo;
  apply_url: string;
  deadline?: string | null;
  confidence: "verified" | "web-grounded" | "needs-verification";
  verification_status?: SchemeVerificationStatus;
  verification_note?: {
    hi: string;
    en: string;
  };
  state?: "delhi" | "haryana" | "up" | "punjab"; // absent = central/all-India
  anti_dalal?: AntiDalalRules;
}
