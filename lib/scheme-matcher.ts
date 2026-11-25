import type { Scheme, EligibilityRule } from "@/lib/scheme-types";

export interface UserProfile {
  state: "delhi" | "haryana" | "up" | "punjab" | "other";
  age: number;
  gender: "male" | "female" | "other";
  occupation: string[];
  annual_income_inr: number;
  category: "general" | "obc" | "sc" | "st" | "ews";
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
  is_capf_ward?: boolean;
  is_phd_scholar?: boolean;
}

export interface SchemeMatch {
  scheme: Scheme;
  match_confidence: "high" | "medium";
  match_reason_hi: string;
  match_reason_en: string;
  missing_fields: string[];
}

export type RuleResult = "pass" | "fail" | "unknown";

const OCCUPATION_SYNONYMS: Record<string, string[]> = {
  vendor: ["vendor", "street_vendor"],
  street_vendor: ["street_vendor", "vendor"],
  worker: ["worker", "laborer", "construction_worker"],
  laborer: ["laborer", "worker", "construction_worker"],
  construction_worker: ["construction_worker", "laborer", "worker"],
  business: ["business", "self_employed"],
  self_employed: ["self_employed", "business"],
};

/**
 * Expands user occupation values with recognized official synonyms
 * so e.g. "laborer" and "construction_worker" or "vendor" and "street_vendor" match reliably.
 */
export function expandOccupationValues(occupations: string[]): string[] {
  const expanded = new Set<string>();
  for (const occ of occupations) {
    const clean = String(occ || "").toLowerCase().trim();
    if (!clean) continue;
    expanded.add(clean);
    const syns = OCCUPATION_SYNONYMS[clean];
    if (syns) {
      syns.forEach((s) => expanded.add(s));
    }
  }
  return Array.from(expanded);
}

/**
 * Evaluates a single scheme rule deterministically against a partial UserProfile.
 */
export function evaluateSingleRule(
  rule: EligibilityRule,
  profile: Partial<UserProfile> | null | undefined
): RuleResult {
  if (!rule || !rule.field || !profile) return "unknown";

  const profileVal = (profile as Record<string, any>)[rule.field];

  if (profileVal === undefined || profileVal === null) {
    return "unknown";
  }

  switch (rule.operator) {
    case "eq":
      if (rule.field === "category" && profileVal === "ews" && rule.value === "general") {
        return "pass";
      }
      return profileVal === rule.value ? "pass" : "fail";

    case "lte":
      return typeof profileVal === "number" && !Number.isNaN(profileVal) && profileVal <= (rule.value as number)
        ? "pass"
        : "fail";

    case "gte":
      return typeof profileVal === "number" && !Number.isNaN(profileVal) && profileVal >= (rule.value as number)
        ? "pass"
        : "fail";

    case "includes": {
      const allowed = (Array.isArray(rule.value) ? rule.value : [rule.value]).map((v) =>
        typeof v === "string" ? v.toLowerCase() : v
      );
      if (rule.field === "occupation") {
        const userOccs = Array.isArray(profileVal)
          ? expandOccupationValues(profileVal.map(String))
          : expandOccupationValues([String(profileVal)]);
        if (userOccs.length === 0) return "unknown";
        return userOccs.some((item) => allowed.includes(item)) ? "pass" : "fail";
      }
      if (Array.isArray(profileVal)) {
        if (profileVal.length === 0) return "unknown";
        return profileVal.some((item) => allowed.includes(item)) ? "pass" : "fail";
      }
      return allowed.includes(typeof profileVal === "string" ? profileVal.toLowerCase() : profileVal)
        ? "pass"
        : "fail";
    }

    case "not_includes": {
      const forbidden = (Array.isArray(rule.value) ? rule.value : [rule.value]).map((v) =>
        typeof v === "string" ? v.toLowerCase() : v
      );
      if (rule.field === "occupation") {
        const userOccs = Array.isArray(profileVal)
          ? expandOccupationValues(profileVal.map(String))
          : expandOccupationValues([String(profileVal)]);
        if (userOccs.length === 0) return "unknown";
        return !userOccs.some((item) => forbidden.includes(item)) ? "pass" : "fail";
      }
      if (Array.isArray(profileVal)) {
        return !profileVal.some((item) => forbidden.includes(item)) ? "pass" : "fail";
      }
      return !forbidden.includes(typeof profileVal === "string" ? profileVal.toLowerCase() : profileVal)
        ? "pass"
        : "fail";
    }

    default:
      return "unknown";
  }
}

const STATE_LABELS: Record<string, { hi: string; en: string }> = {
  delhi: { hi: "दिल्ली", en: "Delhi" },
  haryana: { hi: "हरियाणा", en: "Haryana" },
  up: { hi: "उत्तर प्रदेश", en: "Uttar Pradesh" },
  punjab: { hi: "पंजाब", en: "Punjab" },
  other: { hi: "भारत", en: "India" },
};

const OCC_LABELS: Record<string, { hi: string; en: string }> = {
  farmer: { hi: "किसान", en: "Farmer" },
  student: { hi: "छात्र", en: "Student" },
  laborer: { hi: "श्रमिक", en: "Worker" },
  worker: { hi: "कामगार", en: "Worker" },
  construction_worker: { hi: "निर्माण श्रमिक", en: "Construction Worker" },
  street_vendor: { hi: "स्ट्रीट वेंडर", en: "Street Vendor" },
  vendor: { hi: "स्ट्रीट वेंडर", en: "Vendor" },
  business: { hi: "व्यापारी", en: "Business" },
  self_employed: { hi: "स्वरोजगार", en: "Self-Employed" },
  homemaker: { hi: "गृहिणी", en: "Homemaker" },
  senior_citizen: { hi: "वरिष्ठ नागरिक", en: "Senior Citizen" },
  unemployed: { hi: "रोजगार तलाश", en: "Job Seeker" },
  researcher: { hi: "शोधार्थी", en: "Researcher" },
  artisan: { hi: "कारीगर", en: "Artisan" },
};

const FIELD_NAMES_HI: Record<string, string> = {
  state: "राज्य",
  age: "आयु",
  gender: "लिंग",
  occupation: "पेशा",
  annual_income_inr: "वार्षिक आय",
  land_owned_acres: "कृषि भूमि",
  is_bpl: "BPL कार्ड",
  is_capf_ward: "CAPF कर्मी आश्रित",
  is_phd_scholar: "PhD शोध छात्र",
  is_disabled: "दिव्यांगता प्रमाण",
};

const GENERIC_FALLBACK_IDS = new Set([
  "pm-jan-dhan",
  "mudra-loan",
  "pmegp",
]);

function computeRelevanceScore(
  scheme: Scheme,
  profile: Partial<UserProfile>,
  matchedFields: Set<string>,
  missingFields: string[],
  confidence: "high" | "medium"
): number {
  let score = confidence === "high" ? 1000 : 100;

  if (scheme.state && profile.state && scheme.state === profile.state) {
    score += 300;
  }

  if (matchedFields.has("occupation")) {
    score += 250;
  }

  if (matchedFields.has("annual_income_inr")) {
    score += 120;
  }

  if (matchedFields.has("age")) {
    score += 60;
  }

  if (GENERIC_FALLBACK_IDS.has(scheme.id)) {
    score -= 180;
  }

  score -= missingFields.length * 40;

  return score;
}

export function matchSchemes(
  profile: Partial<UserProfile> | null | undefined,
  schemes: Scheme[] | null | undefined
): SchemeMatch[] {
  if (!Array.isArray(schemes) || schemes.length === 0) {
    return [];
  }

  const safeProfile: Partial<UserProfile> = profile && typeof profile === "object" ? profile : {};
  const matchesWithScore: Array<{ match: SchemeMatch; score: number }> = [];

  for (const scheme of schemes) {
    if (!scheme || !scheme.id) continue;

    const missingFieldsSet = new Set<string>();
    const matchedFieldsSet = new Set<string>();
    const matchedHighlightsHi: string[] = [];
    const matchedHighlightsEn: string[] = [];
    let disqualified = false;

    if (scheme.state) {
      if (safeProfile.state) {
        if (safeProfile.state !== scheme.state) {
          continue;
        }
        matchedFieldsSet.add("state");
        const st = STATE_LABELS[scheme.state] || { hi: scheme.state, en: scheme.state };
        matchedHighlightsHi.push(`राज्य: ${st.hi}`);
        matchedHighlightsEn.push(`State: ${st.en}`);
      } else {
        missingFieldsSet.add("state");
      }
    }

    const mustMatchAll = Array.isArray(scheme.eligibility?.must_match_all)
      ? scheme.eligibility.must_match_all
      : [];
    const mustMatchNone = Array.isArray(scheme.eligibility?.must_match_none)
      ? scheme.eligibility.must_match_none
      : [];

    for (const rule of mustMatchAll) {
      const result = evaluateSingleRule(rule, safeProfile);
      if (result === "fail") {
        disqualified = true;
        break;
      }
      if (result === "unknown") {
        missingFieldsSet.add(rule.field);
      } else if (result === "pass") {
        matchedFieldsSet.add(rule.field);
        if (rule.field === "occupation" && Array.isArray(safeProfile.occupation)) {
          const occLabels = safeProfile.occupation.map((o) => OCC_LABELS[o]?.hi || o).join("/");
          const occLabelsEn = safeProfile.occupation.map((o) => OCC_LABELS[o]?.en || o).join("/");
          matchedHighlightsHi.push(`पेशा: ${occLabels}`);
          matchedHighlightsEn.push(`Occupation: ${occLabelsEn}`);
        } else if (rule.field === "age" && safeProfile.age !== undefined) {
          matchedHighlightsHi.push(`आयु: ${safeProfile.age} वर्ष`);
          matchedHighlightsEn.push(`Age: ${safeProfile.age} yrs`);
        } else if (rule.field === "annual_income_inr" && safeProfile.annual_income_inr !== undefined) {
          const formatted = safeProfile.annual_income_inr.toLocaleString("en-IN");
          matchedHighlightsHi.push(`आय: ₹${formatted}`);
          matchedHighlightsEn.push(`Income: ₹${formatted}`);
        } else if (rule.field === "gender" && safeProfile.gender) {
          matchedHighlightsHi.push(
            safeProfile.gender === "female" ? "महिला श्रेणी" : safeProfile.gender === "male" ? "पुरुष" : "अन्य"
          );
          matchedHighlightsEn.push(`Gender: ${safeProfile.gender}`);
        }
      }
    }

    if (disqualified) continue;

    for (const rule of mustMatchNone) {
      const result = evaluateSingleRule(rule, safeProfile);
      if (result === "pass") {
        disqualified = true;
        break;
      }
    }

    if (disqualified) continue;

    const missing_fields = Array.from(missingFieldsSet);
    const match_confidence: "high" | "medium" =
      missing_fields.length === 0 ? "high" : "medium";

    const uniqueHi = Array.from(new Set(matchedHighlightsHi));
    const uniqueEn = Array.from(new Set(matchedHighlightsEn));
    const missingHi = missing_fields.map((f) => FIELD_NAMES_HI[f] || f).join(", ");

    let reasonHi: string;
    let reasonEn: string;

    if (match_confidence === "high") {
      reasonHi =
        uniqueHi.length > 0
          ? `पात्रता मेल खाई — ${uniqueHi.join(" • ")} सभी नियम पूरे हैं।`
          : `आपकी योग्यता इस योजना के सभी प्राथमिक नियमों के अनुकूल है।`;
      reasonEn =
        uniqueEn.length > 0
          ? `Matched criteria — ${uniqueEn.join(" • ")} satisfy all rules.`
          : `Your profile matches all primary eligibility criteria for this scheme.`;
    } else {
      reasonHi =
        uniqueHi.length > 0
          ? `${uniqueHi.join(" • ")} मेल खाता है (${missingHi} की पुष्टि शेष)।`
          : `आप इस योजना के पात्र हो सकते हैं (${missingHi} की पुष्टि शेष है)।`;
      reasonEn =
        uniqueEn.length > 0
          ? `Matches ${uniqueEn.join(" • ")} (confirmation needed: ${missing_fields.join(", ")}).`
          : `You may qualify (verification needed for: ${missing_fields.join(", ")}).`;
    }

    const score = computeRelevanceScore(
      scheme,
      safeProfile,
      matchedFieldsSet,
      missing_fields,
      match_confidence
    );

    matchesWithScore.push({
      match: {
        scheme,
        match_confidence,
        match_reason_hi: reasonHi,
        match_reason_en: reasonEn,
        missing_fields,
      },
      score,
    });
  }

  matchesWithScore.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.match.scheme.id.localeCompare(b.match.scheme.id);
  });

  return matchesWithScore.map((item) => item.match);
}
