import type { Scheme, EligibilityRule } from "@/lib/scheme-types";

export interface UserProfile {
  state: "delhi" | "haryana" | "up" | "other";
  age: number;
  gender: "male" | "female" | "other";
  occupation: string[];
  annual_income_inr: number;
  category: "general" | "obc" | "sc" | "st";
  land_owned_acres?: number;
  is_bpl?: boolean;
  has_bank_account?: boolean;
  is_disabled?: boolean;
  is_minority?: boolean;
  household_size?: number;
  is_income_tax_payer?: boolean;
  is_government_employee?: boolean;
  owns_pucca_house?: boolean;
  has_lpg_connection?: boolean;
  is_epfo_esic_member?: boolean;
  has_other_pension?: boolean;
}

export interface SchemeMatch {
  scheme: Scheme;
  match_confidence: "high" | "medium";
  match_reason_hi: string;
  match_reason_en: string;
  missing_fields: string[];
}

type RuleResult = "pass" | "fail" | "unknown";

function evaluateRule(
  rule: EligibilityRule,
  profile: Partial<UserProfile>
): RuleResult {
  const profileVal = (profile as Record<string, any>)[rule.field];

  if (profileVal === undefined || profileVal === null) {
    return "unknown";
  }

  switch (rule.operator) {
    case "eq":
      return profileVal === rule.value ? "pass" : "fail";

    case "lte":
      return typeof profileVal === "number" && profileVal <= (rule.value as number)
        ? "pass"
        : "fail";

    case "gte":
      return typeof profileVal === "number" && profileVal >= (rule.value as number)
        ? "pass"
        : "fail";

    case "includes": {
      const allowed = Array.isArray(rule.value) ? rule.value : [rule.value];
      if (Array.isArray(profileVal)) {
        return profileVal.some((item) => allowed.includes(item))
          ? "pass"
          : "fail";
      }
      return allowed.includes(profileVal) ? "pass" : "fail";
    }

    case "not_includes": {
      const forbidden = Array.isArray(rule.value) ? rule.value : [rule.value];
      if (Array.isArray(profileVal)) {
        return !profileVal.some((item) => forbidden.includes(item))
          ? "pass"
          : "fail";
      }
      return !forbidden.includes(profileVal) ? "pass" : "fail";
    }

    default:
      return "unknown";
  }
}

export function matchSchemes(
  profile: Partial<UserProfile>,
  schemes: Scheme[]
): SchemeMatch[] {
  const matches: SchemeMatch[] = [];

  for (const scheme of schemes) {
    const missingFieldsSet = new Set<string>();
    let disqualified = false;

    // Check state restriction if scheme is state-specific
    if (scheme.state) {
      if (profile.state) {
        if (profile.state !== scheme.state) {
          continue; // User is in a different state, skip scheme
        }
      } else {
        // State not yet specified in profile
        missingFieldsSet.add("state");
      }
    }

    // Check must_match_all conditions
    for (const rule of scheme.eligibility.must_match_all) {
      const result = evaluateRule(rule, profile);
      if (result === "fail") {
        disqualified = true;
        break;
      }
      if (result === "unknown") {
        missingFieldsSet.add(rule.field);
      }
    }

    if (disqualified) continue;

    // Check must_match_none conditions
    for (const rule of scheme.eligibility.must_match_none) {
      const result = evaluateRule(rule, profile);
      if (result === "pass") {
        disqualified = true;
        break; // Met a disqualifier condition
      }
      // If unknown for a must_match_none rule, do not disqualify
    }

    if (disqualified) continue;

    const missing_fields = Array.from(missingFieldsSet);
    const match_confidence: "high" | "medium" =
      missing_fields.length === 0 ? "high" : "medium";

    // Generate plain language reason
    const reasonHi =
      match_confidence === "high"
        ? `आपकी योग्यता इस योजना के सभी प्राथमिक नियमों के अनुकूल है।`
        : `आप इस योजना के पात्र हो सकते हैं (${missing_fields.join(", ")} की पुष्टि शेष है)।`;

    const reasonEn =
      match_confidence === "high"
        ? `Your profile matches all primary eligibility criteria for this scheme.`
        : `You may qualify (verification needed for: ${missing_fields.join(", ")}).`;

    matches.push({
      scheme,
      match_confidence,
      match_reason_hi: reasonHi,
      match_reason_en: reasonEn,
      missing_fields,
    });
  }

  // Sort matches: high confidence first, then by scheme id
  matches.sort((a, b) => {
    if (a.match_confidence === "high" && b.match_confidence === "medium") return -1;
    if (a.match_confidence === "medium" && b.match_confidence === "high") return 1;
    return a.scheme.id.localeCompare(b.scheme.id);
  });

  return matches;
}
