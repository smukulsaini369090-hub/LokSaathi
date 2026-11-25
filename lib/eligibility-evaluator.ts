/**
 * 100% Deterministic Specific-Scheme Eligibility Evaluator.
 * Evaluates a user profile against a specific scheme's rules,
 * classifies gaps into hard disqualifiers vs fixable gaps,
 * resolves required document acquisition guides,
 * and provides alternative schemes if not eligible.
 */

import type { Scheme, EligibilityRule } from "@/lib/scheme-types";
import {
  matchSchemes,
  evaluateSingleRule,
  type UserProfile,
  type SchemeMatch,
} from "@/lib/scheme-matcher";
import { getDocumentGuide, type DocumentAcquisitionGuide } from "@/lib/document-guides";

export type CriterionGapType = "hard_disqualifier" | "fixable_gap";

export interface EvaluatedCriterion {
  field: string;
  ruleDescription_hi: string;
  ruleDescription_en: string;
  passed: boolean;
  gapType?: CriterionGapType;
  userValueSummary_hi: string;
  userValueSummary_en: string;
  remediation_hi?: string;
  remediation_en?: string;
}

export interface DocumentReadinessItem {
  documentName: string;
  guide: DocumentAcquisitionGuide;
}

export interface EligibilityAuditResult {
  schemeId: string;
  schemeName: { hi: string; en: string };
  verdict: "eligible" | "not_eligible" | "needs_more_info";
  passedCriteria: EvaluatedCriterion[];
  failedCriteria: EvaluatedCriterion[];
  missingFields: string[];
  documentReadiness: DocumentReadinessItem[];
  alternativeSchemes: SchemeMatch[];
  summary_hi: string;
  summary_en: string;
}

const STATE_NAMES: Record<string, { hi: string; en: string }> = {
  punjab: { hi: "पंजाब", en: "Punjab" },
  delhi: { hi: "दिल्ली", en: "Delhi" },
  haryana: { hi: "हरियाणा", en: "Haryana" },
  up: { hi: "उत्तर प्रदेश", en: "Uttar Pradesh" },
  other: { hi: "अन्य राज्य", en: "Other State" },
};

const GENDER_NAMES: Record<string, { hi: string; en: string }> = {
  male: { hi: "पुरुष", en: "Male" },
  female: { hi: "महिला", en: "Female" },
  other: { hi: "अन्य", en: "Other" },
};

const CATEGORY_NAMES: Record<string, { hi: string; en: string }> = {
  general: { hi: "सामान्य (General)", en: "General" },
  obc: { hi: "अन्य पिछड़ा वर्ग (OBC)", en: "OBC" },
  sc: { hi: "अनुसूचित जाति (SC)", en: "SC" },
  st: { hi: "अनुसूचित जनजाति (ST)", en: "ST" },
  ews: { hi: "आर्थिक रूप से कमजोर वर्ग (EWS)", en: "Economically Weaker Section (EWS)" },
};

const OCCUPATION_NAMES: Record<string, { hi: string; en: string }> = {
  farmer: { hi: "किसान", en: "Farmer" },
  student: { hi: "छात्र / विद्यार्थी", en: "Student" },
  researcher: { hi: "शोधार्थी (PhD)", en: "PhD / Research Scholar" },
  laborer: { hi: "श्रमिक / दैनिक मज़दूर", en: "Laborer / Daily Wage Worker" },
  worker: { hi: "असंगठित कामगार", en: "Unorganized Worker" },
  construction_worker: { hi: "निर्माण श्रमिक", en: "Construction Worker" },
  street_vendor: { hi: "रेहड़ी-पटरी / स्ट्रीट वेंडर", en: "Street Vendor" },
  vendor: { hi: "रेहड़ी-पटरी / स्ट्रीट वेंडर", en: "Street Vendor" },
  business: { hi: "छोटा व्यापारी / दुकानदार", en: "Small Business Owner" },
  self_employed: { hi: "स्वरोजगार", en: "Self-Employed" },
  homemaker: { hi: "गृहिणी", en: "Homemaker" },
  senior_citizen: { hi: "वरिष्ठ नागरिक", en: "Senior Citizen" },
  unemployed: { hi: "बेरोजगार", en: "Unemployed" },
  artisan: { hi: "कारीगर / शिल्पकार", en: "Artisan" },
};

function formatFieldValue(field: string, val: any): { hi: string; en: string } {
  if (val === undefined || val === null) {
    return { hi: "अज्ञात (दर्ज नहीं)", en: "Unknown (not specified)" };
  }

  if (field === "state") {
    return STATE_NAMES[String(val)] || { hi: String(val), en: String(val) };
  }
  if (field === "gender") {
    return GENDER_NAMES[String(val)] || { hi: String(val), en: String(val) };
  }
  if (field === "category") {
    return CATEGORY_NAMES[String(val)] || { hi: String(val), en: String(val) };
  }
  if (field === "annual_income_inr") {
    const formatted = typeof val === "number" ? val.toLocaleString("en-IN") : String(val);
    return { hi: `₹${formatted} वार्षिक`, en: `₹${formatted} per year` };
  }
  if (field === "age") {
    return { hi: `${val} वर्ष`, en: `${val} years` };
  }
  if (field === "land_owned_acres") {
    return { hi: `${val} एकड़`, en: `${val} acres` };
  }
  if (field === "occupation") {
    if (Array.isArray(val)) {
      const hiList = val.map((occ) => OCCUPATION_NAMES[String(occ)]?.hi || String(occ)).join(", ");
      const enList = val.map((occ) => OCCUPATION_NAMES[String(occ)]?.en || String(occ)).join(", ");
      return { hi: hiList, en: enList };
    }
    return {
      hi: OCCUPATION_NAMES[String(val)]?.hi || String(val),
      en: OCCUPATION_NAMES[String(val)]?.en || String(val),
    };
  }
  if (typeof val === "boolean") {
    return { hi: val ? "हाँ (Yes)" : "नहीं (No)", en: val ? "Yes" : "No" };
  }
  return { hi: String(val), en: String(val) };
}

function evaluateRuleMatch(
  rule: EligibilityRule,
  profile: Partial<UserProfile>
): "pass" | "fail" | "unknown" {
  return evaluateSingleRule(rule, profile);
}

/**
 * Classifies whether a failure is a permanent hard disqualifier
 * or an actionable fixable gap.
 */
function classifyGap(rule: EligibilityRule): {
  gapType: CriterionGapType;
  remediation_hi?: string;
  remediation_en?: string;
} {
  const f = rule.field;

  // Hard disqualifiers (cannot easily change or falsify)
  if (f === "state") {
    return {
      gapType: "hard_disqualifier",
      remediation_hi: "यह योजना विशेष राज्य के मूल निवासियों के लिए सीमित है। आप अपने राज्य की समकक्ष योजनाओं के लिए आवेदन कर सकते हैं।",
      remediation_en: "This scheme is restricted to permanent residents of this state. You can apply for equivalent schemes in your home state.",
    };
  }

  if (f === "gender") {
    return {
      gapType: "hard_disqualifier",
      remediation_hi: "यह योजना विशेष लिंग वर्ग (जैसे केवल महिला या केवल पुरुष) के लिए अधिसूचित है।",
      remediation_en: "This scheme is officially notified for a specific gender category.",
    };
  }

  if (f === "age") {
    return {
      gapType: "hard_disqualifier",
      remediation_hi: "आयु सीमा सरकारी अधिसूचना द्वारा तय की गई है जिसे बदला नहीं जा सकता।",
      remediation_en: "Age limits are determined by statutory government guidelines.",
    };
  }

  if (f === "annual_income_inr") {
    return {
      gapType: "hard_disqualifier",
      remediation_hi: "आपकी वार्षिक आय योजना की आधिकारिक सीमा से अधिक है। कृपया मध्यम वर्ग या गैर-सब्सिडी वाली योजनाओं की सूची देखें।",
      remediation_en: "Your annual income exceeds the official eligibility ceiling for this welfare program.",
    };
  }

  if (f === "land_owned_acres") {
    return {
      gapType: "hard_disqualifier",
      remediation_hi: "भूमि स्वामित्व सीमा सीमांत अथवा छोटे किसानों के लिए आरक्षित है।",
      remediation_en: "Landholding criteria is restricted to small and marginal agricultural categories.",
    };
  }

  if (f === "category") {
    return {
      gapType: "hard_disqualifier",
      remediation_hi: "यह योजना विशिष्ट सामाजिक वर्ग के लिए संवैधानिक प्रावधानों के तहत आरक्षित है।",
      remediation_en: "This scheme is earmarked for specific social categories under welfare guidelines.",
    };
  }

  if (f === "is_government_employee" || f === "is_income_tax_payer") {
    return {
      gapType: "hard_disqualifier",
      remediation_hi: "सरकारी कर्मचारी अथवा आयकर दाता इस कल्याणकारी सहायता के पात्र नहीं हैं।",
      remediation_en: "Government employees and income-tax payers are disqualified under statutory scheme guidelines.",
    };
  }

  // Fixable Gaps (actionable prerequisites)
  if (f === "has_bank_account") {
    return {
      gapType: "fixable_gap",
      remediation_hi: "आप नजदीकी बैंक शाखा अथवा डाकघर (IPPB) में मात्र 10 मिनट में आधार आधारित जन-धन बैंक खाता खुलवा सकते हैं।",
      remediation_en: "You can open a zero-balance Jan Dhan bank account at any branch or India Post Payments Bank in minutes.",
    };
  }

  if (f === "is_bpl") {
    return {
      gapType: "fixable_gap",
      remediation_hi: "यदि आपकी वास्तविक आय BPL सीमा के अंतर्गत है, तो आप अपने स्थानीय खाद्य आपूर्ति विभाग या सरल/ई-डिस्ट्रिक्ट पोर्टल पर राशन कार्ड हेतु आवेदन कर सकते हैं।",
      remediation_en: "If your family income is within limits, apply for an updated BPL / NFSA ration card on your state e-District portal.",
    };
  }

  if (f === "occupation") {
    return {
      gapType: "fixable_gap",
      remediation_hi: "इस योजना के लिए आवश्यक कार्य श्रेणी में आधिकारिक पंजीकरण (जैसे e-Shram कार्ड अथवा किसान क्रेडिट कार्ड) कराएं।",
      remediation_en: "Complete official registration under this occupational category (e.g. e-Shram registration or Farmer ID).",
    };
  }

  return {
    gapType: "fixable_gap",
    remediation_hi: "आवश्यक पात्रता प्रमाण पत्र बनवाकर सत्यापन पूरा करें।",
    remediation_en: "Obtain the required eligibility certificate and submit for verification.",
  };
}

function getRuleDescription(rule: EligibilityRule): { hi: string; en: string } {
  const f = rule.field;

  if (f === "state") {
    const sName = STATE_NAMES[String(rule.value)] || { hi: String(rule.value), en: String(rule.value) };
    return {
      hi: `${sName.hi} का मूल निवासी होना अनिवार्य`,
      en: `Must be a resident of ${sName.en}`,
    };
  }

  if (f === "annual_income_inr") {
    if (rule.operator === "lte") {
      const amount = typeof rule.value === "number" ? rule.value.toLocaleString("en-IN") : rule.value;
      return {
        hi: `पारिवारिक वार्षिक आय अधिकतम ₹${amount} होनी चाहिए`,
        en: `Family annual income must be ₹${amount} or less`,
      };
    }
  }

  if (f === "age") {
    if (rule.operator === "gte") {
      return { hi: `आयु न्यूनतम ${rule.value} वर्ष होनी चाहिए`, en: `Age must be at least ${rule.value} years` };
    }
    if (rule.operator === "lte") {
      return { hi: `आयु अधिकतम ${rule.value} वर्ष होनी चाहिए`, en: `Age must not exceed ${rule.value} years` };
    }
  }

  if (f === "gender") {
    const gName = GENDER_NAMES[String(rule.value)] || { hi: String(rule.value), en: String(rule.value) };
    return { hi: `आवेदक का लिंग ${gName.hi} होना चाहिए`, en: `Applicant gender must be ${gName.en}` };
  }

  if (f === "occupation") {
    const raw = Array.isArray(rule.value) ? rule.value : [rule.value];
    const occs = raw.map((o) => OCCUPATION_NAMES[String(o)]?.hi || String(o)).join(" या ");
    const occsEn = raw.map((o) => OCCUPATION_NAMES[String(o)]?.en || String(o)).join(" or ");
    return {
      hi: `व्यवसाय: ${occs}`,
      en: `Occupation: ${occsEn}`,
    };
  }

  if (f === "land_owned_acres") {
    return {
      hi: `कृषि भूमि अधिकतम ${rule.value} एकड़ होनी चाहिए`,
      en: `Cultivable landholding must be ${rule.value} acres or less`,
    };
  }

  if (f === "category") {
    const allowed = Array.isArray(rule.value) ? rule.value : [rule.value];
    const cats = allowed.map((c) => CATEGORY_NAMES[String(c)]?.hi || String(c)).join(" / ");
    const catsEn = allowed.map((c) => CATEGORY_NAMES[String(c)]?.en || String(c)).join(" / ");
    return {
      hi: `सामाजिक वर्ग: ${cats}`,
      en: `Social category: ${catsEn}`,
    };
  }

  if (f === "is_government_employee") {
    return { hi: "सरकारी कर्मचारी नहीं होना चाहिए", en: "Must not be a government employee" };
  }

  if (f === "is_income_tax_payer") {
    return { hi: "आयकर दाता नहीं होना चाहिए", en: "Must not be an income-tax payer" };
  }

  if (f === "is_bpl") {
    return { hi: "गरीबी रेखा से नीचे (BPL / अंत्योदय) परिवार", en: "Below Poverty Line (BPL / Antyodaya) family" };
  }

  if (f === "has_bank_account") {
    return { hi: "सक्रिय बैंक खाता होना अनिवार्य", en: "Must have an active bank account" };
  }

  if (f === "is_disabled") {
    return { hi: "न्यूनतम 40% दिव्यांगता (UDID) प्रमाण पत्र होना अनिवार्य", en: "Must hold a valid Disability / UDID certificate (≥40%)" };
  }

  if (f === "is_epfo_esic_member") {
    return { hi: "EPFO / ESIC संगठित क्षेत्र का सदस्य नहीं होना चाहिए", en: "Must not be an EPFO / ESIC formal sector member" };
  }

  if (f === "owns_pucca_house") {
    return { hi: "परिवार के नाम पक्का मकान नहीं होना चाहिए", en: "Family must not already own a pucca house" };
  }

  if (f === "has_lpg_connection") {
    return { hi: "घर में पहले से एलपीजी गैस कनेक्शन नहीं होना चाहिए", en: "Household must not already hold an active LPG connection" };
  }

  if (f === "has_other_pension") {
    return { hi: "किसी अन्य सरकारी सामाजिक पेंशन का लाभ न ले रहा हो", en: "Must not already receive another government pension" };
  }

  if (f === "is_capf_ward") {
    return { hi: "माता/पिता अर्धसैनिक बल (CAPF / असम राइफल्स) कर्मी या शहीद/पूर्व सैनिक होने चाहिए", en: "Parent must be serving/retired/deceased CAPF or Assam Rifles personnel" };
  }

  if (f === "is_phd_scholar") {
    return { hi: "मान्यता प्राप्त संस्थान में पूर्णकालिक PhD (इलेक्ट्रॉनिक्स/IT) शोध प्रवेश अनिवार्य", en: "Must be enrolled as a full-time PhD scholar in Electronics / IT" };
  }

  return { hi: `${f} नियम`, en: `${f} requirement` };
}

/**
 * Deterministic Specific-Scheme Eligibility Auditor.
 */
export function evaluateSchemeEligibility(
  profile: Partial<UserProfile> | null | undefined,
  scheme: Scheme,
  allSchemes: Scheme[] = []
): EligibilityAuditResult {
  const safeProfile: Partial<UserProfile> = profile && typeof profile === "object" ? profile : {};
  const passedCriteria: EvaluatedCriterion[] = [];
  const failedCriteria: EvaluatedCriterion[] = [];
  const missingFieldsSet = new Set<string>();

  // 1. Evaluate State Restriction
  if (scheme.state) {
    if (!safeProfile.state) {
      missingFieldsSet.add("state");
    } else if (safeProfile.state === scheme.state) {
      const sName = STATE_NAMES[scheme.state] || { hi: scheme.state, en: scheme.state };
      passedCriteria.push({
        field: "state",
        ruleDescription_hi: `${sName.hi} राज्य का निवासी होना अनिवार्य`,
        ruleDescription_en: `Must be a resident of ${sName.en}`,
        passed: true,
        userValueSummary_hi: `आपका राज्य: ${sName.hi} (सत्यापित ✅)`,
        userValueSummary_en: `Your state: ${sName.en} (Matched ✅)`,
      });
    } else {
      const sName = STATE_NAMES[scheme.state] || { hi: scheme.state, en: scheme.state };
      const uName = STATE_NAMES[safeProfile.state] || { hi: safeProfile.state, en: safeProfile.state };
      const gap = classifyGap({ field: "state", operator: "eq", value: scheme.state });
      failedCriteria.push({
        field: "state",
        ruleDescription_hi: `यह योजना केवल ${sName.hi} के निवासियों के लिए है`,
        ruleDescription_en: `This scheme is exclusively for residents of ${sName.en}`,
        passed: false,
        gapType: gap.gapType,
        userValueSummary_hi: `आपका दर्ज राज्य: ${uName.hi} ❌`,
        userValueSummary_en: `Your recorded state: ${uName.en} ❌`,
        remediation_hi: gap.remediation_hi,
        remediation_en: gap.remediation_en,
      });
    }
  }

  const mustMatchAll = Array.isArray(scheme.eligibility?.must_match_all)
    ? scheme.eligibility.must_match_all
    : [];
  const mustMatchNone = Array.isArray(scheme.eligibility?.must_match_none)
    ? scheme.eligibility.must_match_none
    : [];

  // 2. Evaluate must_match_all rules
  for (const rule of mustMatchAll) {
    // Avoid duplicate evaluation if state was already handled
    if (rule.field === "state" && scheme.state) continue;

    const res = evaluateRuleMatch(rule, safeProfile);
    const ruleDesc = getRuleDescription(rule);
    const userVal = (safeProfile as Record<string, any>)[rule.field];
    const userValFormatted = formatFieldValue(rule.field, userVal);

    if (res === "unknown") {
      missingFieldsSet.add(rule.field);
    } else if (res === "pass") {
      passedCriteria.push({
        field: rule.field,
        ruleDescription_hi: ruleDesc.hi,
        ruleDescription_en: ruleDesc.en,
        passed: true,
        userValueSummary_hi: `${userValFormatted.hi} (शर्त पूरी ✅)`,
        userValueSummary_en: `${userValFormatted.en} (Condition met ✅)`,
      });
    } else {
      const gap = classifyGap(rule);
      failedCriteria.push({
        field: rule.field,
        ruleDescription_hi: ruleDesc.hi,
        ruleDescription_en: ruleDesc.en,
        passed: false,
        gapType: gap.gapType,
        userValueSummary_hi: `${userValFormatted.hi} ❌`,
        userValueSummary_en: `${userValFormatted.en} ❌`,
        remediation_hi: gap.remediation_hi,
        remediation_en: gap.remediation_en,
      });
    }
  }

  // 3. Evaluate must_match_none rules (Disqualifiers like govt employee, income tax payer)
  for (const rule of mustMatchNone) {
    const res = evaluateRuleMatch(rule, safeProfile);
    const ruleDesc = getRuleDescription(rule);
    const userVal = (safeProfile as Record<string, any>)[rule.field];

    if (res === "pass") {
      // It matched a forbidden condition -> FAIL
      const gap = classifyGap(rule);
      const userValFormatted = formatFieldValue(rule.field, userVal);
      failedCriteria.push({
        field: rule.field,
        ruleDescription_hi: ruleDesc.hi,
        ruleDescription_en: ruleDesc.en,
        passed: false,
        gapType: "hard_disqualifier",
        userValueSummary_hi: `${userValFormatted.hi} (अयोग्यता नियम) ❌`,
        userValueSummary_en: `${userValFormatted.en} (Disqualifier rule met) ❌`,
        remediation_hi: gap.remediation_hi,
        remediation_en: gap.remediation_en,
      });
    } else if (res === "fail") {
      // It did NOT match the forbidden condition -> PASS
      passedCriteria.push({
        field: rule.field,
        ruleDescription_hi: ruleDesc.hi,
        ruleDescription_en: ruleDesc.en,
        passed: true,
        userValueSummary_hi: "अयोग्यता शर्त से मुक्त ✅",
        userValueSummary_en: "Free from disqualifying conditions ✅",
      });
    }
  }

  // 4. Compute Verdict
  let verdict: "eligible" | "not_eligible" | "needs_more_info";
  if (failedCriteria.length > 0) {
    verdict = "not_eligible";
  } else if (missingFieldsSet.size > 0) {
    verdict = "needs_more_info";
  } else {
    verdict = "eligible";
  }

  // 5. Document Readiness Checklist
  const documentReadiness: DocumentReadinessItem[] = (scheme.documents_required || []).map((doc) => ({
    documentName: doc,
    guide: getDocumentGuide(doc, safeProfile.state || scheme.state),
  }));

  // 6. Alternative Schemes if Not Eligible
  let alternativeSchemes: SchemeMatch[] = [];
  if (verdict === "not_eligible" && Array.isArray(allSchemes) && allSchemes.length > 0) {
    const otherSchemes = allSchemes.filter((s) => s.id !== scheme.id);
    const matches = matchSchemes(safeProfile, otherSchemes);
    alternativeSchemes = matches.slice(0, 3);
  }

  // 7. Plain Bilingual Summaries
  let summary_hi = "";
  let summary_en = "";

  if (verdict === "eligible") {
    summary_hi = `बधाई हो! आपकी प्रोफ़ाइल "${scheme.name.hi}" की सभी आवश्यक पात्रता शर्तों के अनुकूल है। नीचे दिए गए आवश्यक दस्तावेज़ों के साथ आधिकारिक पोर्टल पर आवेदन करें।`;
    summary_en = `Congratulations! Your profile matches all key eligibility criteria for "${scheme.name.en}". You can proceed to apply on the official government portal with the required documents.`;
  } else if (verdict === "not_eligible") {
    const hardGaps = failedCriteria.filter((c) => c.gapType === "hard_disqualifier");
    const fixableGaps = failedCriteria.filter((c) => c.gapType === "fixable_gap");

    if (hardGaps.length > 0) {
      summary_hi = `वर्तमान नियमों के अनुसार आप "${scheme.name.hi}" के पात्र नहीं हैं क्योंकि ${hardGaps.map((g) => g.ruleDescription_hi).join(", ")}। आपके लिए नीचे सुझाई गई अन्य सरकारी योजनाएं देखें।`;
      summary_en = `Based on current criteria, you do not qualify for "${scheme.name.en}" because: ${hardGaps.map((g) => g.ruleDescription_en).join(", ")}. Please explore alternative schemes listed below.`;
    } else {
      summary_hi = `आप इस योजना के पात्र हो सकते हैं, परंतु कुछ आवश्यक शर्तें अभी अधूरी हैं (${fixableGaps.map((g) => g.ruleDescription_hi).join(", ")})। नीचे दिए गए समाधान का पालन कर इन्हें पूरा करें।`;
      summary_en = `You may qualify once certain actionable prerequisites are met: ${fixableGaps.map((g) => g.ruleDescription_en).join(", ")}. Follow the remediation guide below.`;
    }
  } else {
    const missingArr = Array.from(missingFieldsSet);
    summary_hi = `पात्रता की सटीक पुष्टि के लिए कुछ और जानकारी चाहिए (${missingArr.join(", ")})। कृपया नीचे दिए गए विकल्पों में से चयन करें।`;
    summary_en = `A few additional details are required to confirm eligibility (${missingArr.join(", ")}). Please complete the details below.`;
  }

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    verdict,
    passedCriteria,
    failedCriteria,
    missingFields: Array.from(missingFieldsSet),
    documentReadiness,
    alternativeSchemes,
    summary_hi,
    summary_en,
  };
}

/**
 * Fuzzy target-scheme detector across Hindi, English, Hinglish, and acronyms.
 */
export function detectTargetScheme(message: string, allSchemes: Scheme[]): Scheme | null {
  if (!message || !allSchemes || allSchemes.length === 0) return null;
  const text = message.toLowerCase().trim();

  // Keyword dictionary mapping common nicknames to scheme IDs
  const KEYWORD_MAP: Array<{ keywords: string[]; schemeId: string }> = [
    // Central schemes
    { keywords: ["pm kisan", "pmkisan", "pm-kisan", "पीएम किसान", "पीएम-किसान", "किसान सम्मान निधि", "kisan samman nidhi", "kisan 6000"], schemeId: "pm-kisan" },
    { keywords: ["ayushman", "ayushman bharat", "आयुष्मान", "pm-jay", "pmjay", "5 lakh health"], schemeId: "ayushman-bharat" },
    { keywords: ["e-shram", "eshram", "ई-श्रम", "shramik card", "ई श्रम"], schemeId: "e-shram" },
    { keywords: ["mudra", "mudra loan", "मुद्रा", "shishu kishor tarun"], schemeId: "mudra-loan" },
    { keywords: ["fasal bima", "pmfby", "फसल बीमा", "crop insurance"], schemeId: "pm-fasal-bima" },
    { keywords: ["jan dhan", "pmjdy", "जन धन", "zero balance account"], schemeId: "pm-jan-dhan" },
    { keywords: ["ujjwala", "उज्ज्वला", "free gas cylinder", "lpg gas"], schemeId: "pm-ujjwala" },
    { keywords: ["sukanya", "sukanya samriddhi", "सुकन्या", "beti account"], schemeId: "sukanya-samriddhi" },
    { keywords: ["pm awas gramin", "pmay-g", "pmayg", "आवास ग्रामीण"], schemeId: "pm-awas-yojana-gramin" },
    { keywords: ["pm awas urban", "pmay-u", "pmayu", "आवास शहरी"], schemeId: "pm-awas-yojana-urban" },
    { keywords: ["street vendor", "svanidhi", "पीएम स्वनिधि", "rehdi patri"], schemeId: "pm-street-vendor-loan" },
    { keywords: ["matru vandana", "pmmvy", "मातृ वंदना", "pregnancy assistance"], schemeId: "pm-matru-vandana" },
    { keywords: ["pmegp", "पीएमईजीपी", "employment generation programme"], schemeId: "pmegp" },
    { keywords: ["national scholarship", "nsp", "छात्रवृत्ति पोर्टल"], schemeId: "national-scholarship-portal" },
    { keywords: ["social assistance", "nsap", "राष्ट्रीय सामाजिक सहायता"], schemeId: "national-social-assistance" },
    { keywords: ["kisan maan dhan", "kisan pension", "किसान मान-धन"], schemeId: "pm-kisan-maan-dhan" },
    { keywords: ["anganwadi", "आंगनवाड़ी"], schemeId: "anganwadi-services" },
    { keywords: ["poshan abhiyaan", "पोषण अभियान"], schemeId: "poshan-abhiyaan" },
    // Punjab schemes
    { keywords: ["sarbat sehat", "mukh mantri sehat", "sehat bima", "सेहत बीमा", "punjab health"], schemeId: "punjab-mukh-mantri-sehat-bima" },
    { keywords: ["ashirwad", "shagun scheme", "punjab ashirwad", "आशीर्वाद योजना", "ashirwad scheme"], schemeId: "punjab-ashirwad-scheme" },
    { keywords: ["mai bhago", "mai bhago vidya", "माई भागो", "cycle scheme"], schemeId: "punjab-mai-bhago-vidya" },
    { keywords: ["smart ration card", "punjab ration", "स्मार्ट राशन कार्ड"], schemeId: "punjab-smart-ration-card" },
    { keywords: ["punjab old age", "old age pension punjab", "पंजाब वृद्धावस्था पेंशन"], schemeId: "punjab-old-age-pension" },
    // State schemes
    { keywords: ["ladli", "लाडली"], schemeId: "delhi-ladli-scheme" },
    { keywords: ["kanya sumangala", "कन्या सुमंगला"], schemeId: "up-kanya-sumangala" },
    { keywords: ["shadi anudan", "शादी अनुदान"], schemeId: "up-shadi-anudan" },
    { keywords: ["kisan pension up", "वृद्धावस्था पेंशन यूपी"], schemeId: "up-old-age-pension" },
    { keywords: ["chhatravritti haryana", "post matric haryana"], schemeId: "haryana-post-matric-scholarship" },
  ];

  // 1. Direct keyword match
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      const match = allSchemes.find((s) => s.id === entry.schemeId);
      if (match) return match;
    }
  }

  // 2. Exact or substring match against Scheme ID
  for (const s of allSchemes) {
    const sId = s.id.toLowerCase();
    if (text.includes(sId)) return s;
  }

  // 3. Name match in Hindi or English
  for (const s of allSchemes) {
    const enName = s.name.en.toLowerCase();
    const hiName = s.name.hi.toLowerCase();

    // Check if entire name or significant portion appears in text
    if (text.includes(enName) || text.includes(hiName)) return s;

    // Check significant UNIQUE segments (excluding generic demographic/state words so saying "I am a kisan from Punjab" never falsely hijacks into a specific scheme)
    const STOPWORDS = new Set([
      "योजना", "योजनाएं", "scheme", "schemes", "yojana", "yojna", "yojnaa",
      "kisan", "किसान", "student", "छात्र", "pension", "पेंशन", "punjab", "पंजाब",
      "delhi", "दिल्ली", "haryana", "हरियाणा", "uttar", "pradesh", "प्रदेश", "उत्तर",
      "pradhan", "mantri", "प्रधानमंत्री", "mukh", "mantri", "मुख्यमंत्री", "national",
      "राष्ट्रीय", "central", "state", "राज्य", "welfare", "कल्याण", "india", "bharat",
    ]);
    const enSegments = Array.from(
      new Set(enName.split(/[\s()\-]+/).filter((seg) => seg.length >= 4 && !STOPWORDS.has(seg)))
    );
    const hiSegments = Array.from(
      new Set(hiName.split(/[\s()\-]+/).filter((seg) => seg.length >= 3 && !STOPWORDS.has(seg)))
    );

    const matchEnSegCount = enSegments.filter((seg) => text.includes(seg)).length;
    if (enSegments.length > 0 && matchEnSegCount >= Math.min(2, enSegments.length)) {
      return s;
    }

    const matchHiSegCount = hiSegments.filter((seg) => text.includes(seg)).length;
    if (hiSegments.length > 0 && matchHiSegCount >= Math.min(2, hiSegments.length)) {
      return s;
    }
  }

  return null;
}
