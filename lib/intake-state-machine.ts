/**
 * Deterministic Multi-Turn Intake State Machine for LokSaathi (AI Sahayak).
 * Guarantees zero premature scheme dumping, explicit Delhi NCR state disambiguation,
 * rich Hinglish/Devanagari/English multi-fact extraction, specific-scheme fast-pathing,
 * and 100% continuity under offline / 429 Gemini fallback conditions.
 */

import type { Scheme } from "@/lib/scheme-types";
import { matchSchemes, type UserProfile, type SchemeMatch } from "@/lib/scheme-matcher";
import {
  detectTargetScheme,
  evaluateSchemeEligibility,
  type EligibilityAuditResult,
} from "@/lib/eligibility-evaluator";
import { detectSchemeRedirect, type SchemeRedirectEntry } from "@/lib/scheme-redirects";

export type CoreIntakeField =
  | "state"
  | "age"
  | "gender"
  | "occupation"
  | "annual_income_inr"
  | "category";

export const REQUIRED_CORE_FIELDS: CoreIntakeField[] = [
  "state",
  "age",
  "gender",
  "occupation",
  "annual_income_inr",
];

export interface IntakeStateMachineInput {
  userMessage: string;
  currentProfile?: Partial<UserProfile> | null;
  llmResult?: {
    profile_updates?: Partial<UserProfile>;
    acknowledgment?: string;
    next_question?: string;
    suggested_chips?: string[];
    is_complete?: boolean;
  } | null;
  targetSchemeId?: string | null;
  forceComplete?: boolean;
  allSchemes: Scheme[];
  language: "hi" | "en";
}

export interface IntakeStateMachineOutput {
  extracted_profile_updates: Partial<UserProfile>;
  merged_profile: Partial<UserProfile>;
  next_question: string;
  suggested_chips: string[];
  is_profile_complete: boolean;
  needs_state_disambiguation: boolean;
  pending_fields: CoreIntakeField[];
  potential_schemes_count: number;
  matched_schemes: SchemeMatch[];
  target_scheme: { id: string; name: { hi: string; en: string }; scheme_code?: string } | null;
  eligibility_audit: EligibilityAuditResult | null;
  scheme_redirect?: SchemeRedirectEntry | null;
}

/**
 * Checks whether citizen wrote ambiguous "Delhi NCR" / "NCR" without specifying
 * NCT of Delhi vs Haryana NCR (Gurugram/Faridabad) vs UP NCR (Noida/Ghaziabad).
 */
export function isDelhiNCRAmbiguous(text: string): boolean {
  const lower = (text || "").toLowerCase();
  const mentionsNcr =
    /\bncr\b/i.test(lower) ||
    lower.includes("एनसीआर") ||
    lower.includes("delhi ncr") ||
    lower.includes("दिल्ली ncr") ||
    lower.includes("दिल्ली (ncr)");
  if (!mentionsNcr) return false;

  const hasConcreteState =
    /\bnct\b/i.test(lower) ||
    lower.includes("haryana") ||
    lower.includes("हरियाणा") ||
    lower.includes("gurgaon") ||
    lower.includes("gurugram") ||
    lower.includes("गुरुग्राम") ||
    lower.includes("faridabad") ||
    lower.includes("फरीदाबाद") ||
    lower.includes("sonipat") ||
    lower.includes("सोनीपत") ||
    /\bup\b/i.test(lower) ||
    lower.includes("uttar pradesh") ||
    lower.includes("उत्तर प्रदेश") ||
    lower.includes("यूपी") ||
    lower.includes("noida") ||
    lower.includes("नोएडा") ||
    lower.includes("ghaziabad") ||
    lower.includes("गाज़ियाबाद") ||
    lower.includes("गाजियाबाद");

  return !hasConcreteState;
}

function getNextMissingCoreField(profile: Partial<UserProfile>): CoreIntakeField | null {
  if (!profile.state) return "state";
  if (profile.age === undefined || profile.age === null) return "age";
  if (!profile.gender) return "gender";
  if (!Array.isArray(profile.occupation) || profile.occupation.length === 0) return "occupation";
  if (profile.annual_income_inr === undefined || profile.annual_income_inr === null) {
    return "annual_income_inr";
  }
  if (!profile.category) return "category";
  return null;
}

export function getPendingCoreFields(profile: Partial<UserProfile>): CoreIntakeField[] {
  const fields: CoreIntakeField[] = [
    "state",
    "age",
    "gender",
    "occupation",
    "annual_income_inr",
    "category",
  ];
  return fields.filter((f) => {
    const val = (profile as Record<string, any>)[f];
    if (f === "occupation") return !Array.isArray(val) || val.length === 0;
    return val === undefined || val === null || val === "";
  });
}

function isSkipOrShowNowIntent(text: string): boolean {
  const lower = (text || "").toLowerCase().trim();
  return (
    lower.includes("योजनाएं दिखाएं") ||
    lower.includes("सीधे योजनाएं दिखाएं") ||
    lower.includes("show schemes") ||
    lower.includes("skip") ||
    lower.includes("अभी दिखाएं")
  );
}

/**
 * Extracts demographic profile fields deterministically from messy Hinglish,
 * Hindi Devanagari, English, and quick-reply chip taps without needing an LLM.
 */
export function extractRuleBasedProfile(
  text: string,
  existingProfile: Partial<UserProfile> = {},
  expectedField?: string
): Partial<UserProfile> {
  const raw = (text || "").trim();
  if (!raw) return {};
  const lower = raw.toLowerCase();
  const updates: Partial<UserProfile> = {};

  // 1. State extraction (respecting Delhi NCR disambiguation)
  if (!isDelhiNCRAmbiguous(raw)) {
    if (
      lower.includes("haryana") ||
      lower.includes("हरियाणा") ||
      /\bhr\b/.test(lower) ||
      lower.includes("gurugram") ||
      lower.includes("gurgaon") ||
      lower.includes("गुरुग्राम") ||
      lower.includes("faridabad") ||
      lower.includes("फरीदाबाद") ||
      lower.includes("sonipat") ||
      lower.includes("rohtak")
    ) {
      updates.state = "haryana";
    } else if (
      lower.includes("uttar pradesh") ||
      lower.includes("उत्तर प्रदेश") ||
      lower.includes("यूपी") ||
      /\bup\b/.test(lower) ||
      lower.includes("noida") ||
      lower.includes("नोएडा") ||
      lower.includes("ghaziabad") ||
      lower.includes("गाजियाबाद") ||
      lower.includes("गाज़ियाबाद") ||
      lower.includes("lucknow") ||
      lower.includes("लखनऊ")
    ) {
      updates.state = "up";
    } else if (
      lower.includes("punjab") ||
      lower.includes("पंजाब") ||
      /\bpb\b/.test(lower) ||
      lower.includes("ludhiana") ||
      lower.includes("amritsar") ||
      lower.includes("sangrur")
    ) {
      updates.state = "punjab";
    } else if (
      lower.includes("delhi") ||
      lower.includes("दिल्ली") ||
      /\bnct\b/.test(lower) ||
      /\bdl\b/.test(lower)
    ) {
      updates.state = "delhi";
    } else if (
      lower.includes("अन्य राज्य") ||
      lower.includes("other state") ||
      lower.includes("bihar") ||
      lower.includes("rajasthan") ||
      lower.includes("मध्य प्रदेश") ||
      lower.includes("महाराष्ट्र")
    ) {
      updates.state = "other";
    }
  }

  // 2. Annual income extraction (parse BEFORE age so large digits aren't misread as age)
  let extractedIncome: number | undefined;
  const cleanedMoneyText = lower.replace(/,/g, "");

  if (lower.includes("₹1 लाख से कम") || lower.includes("below ₹1 lakh") || lower.includes("below 1 lakh")) {
    extractedIncome = 80000;
  } else if (lower.includes("1 से 2.5 लाख") || lower.includes("1-2.5") || lower.includes("1 – ₹2.5")) {
    extractedIncome = 175000;
  } else if (lower.includes("2.5 से 5 लाख") || lower.includes("2.5-5") || lower.includes("2.5 – ₹5")) {
    extractedIncome = 350000;
  } else if (lower.includes("5 लाख से अधिक") || lower.includes("above ₹5") || lower.includes("above 5 lakh")) {
    extractedIncome = 600000;
  } else if (lower.includes("डेढ़ लाख") || lower.includes("dedh lakh")) {
    extractedIncome = 150000;
  } else {
    const lakhMatch = cleanedMoneyText.match(/(\d+(?:\.\d+)?)\s*(?:लाख|lakh|lac|lpa)\b/i);
    const hazarMatch = cleanedMoneyText.match(/(\d+(?:\.\d+)?)\s*(?:हजार|hajar|hazaar|k)\b/i);
    const largeNumberMatch = cleanedMoneyText.match(/\b([1-9]\d{3,7})\b/);

    if (lakhMatch) {
      extractedIncome = Math.round(parseFloat(lakhMatch[1]) * 100000);
    } else if (hazarMatch) {
      extractedIncome = Math.round(parseFloat(hazarMatch[1]) * 1000);
    } else if (largeNumberMatch) {
      extractedIncome = parseInt(largeNumberMatch[1], 10);
    }
  }

  if (extractedIncome !== undefined && !Number.isNaN(extractedIncome)) {
    updates.annual_income_inr = extractedIncome;
  }

  // 3. Age extraction (digits 1-110 with explicit age cues OR contextual short reply OR quick age chips)
  if (lower.includes("18–25") || lower.includes("18-25")) {
    updates.age = 22;
  } else if (lower.includes("26–40") || lower.includes("26-40")) {
    updates.age = 33;
  } else if (lower.includes("41–59") || lower.includes("41-59")) {
    updates.age = 50;
  } else if (lower.includes("60+") || lower.includes("60 वर्ष से अधिक")) {
    updates.age = 65;
  } else {
    const explicitAgeMatch =
      raw.match(/(\d{1,3})\s*(?:साल|वर्ष|yrs?|years?|saal)/i) ||
      raw.match(/(?:age|umar|उम्र|आयु)\s*(?:is|hai|:|-)?\s*(\d{1,3})\b/i);
    if (explicitAgeMatch) {
      const parsedAge = parseInt(explicitAgeMatch[1], 10);
      if (parsedAge >= 1 && parsedAge <= 110) updates.age = parsedAge;
    } else if (
      /^\d{1,3}$/.test(raw) &&
      (expectedField === "age" ||
        (existingProfile.state && (existingProfile.age === undefined || existingProfile.age === null)))
    ) {
      const parsedAge = parseInt(raw, 10);
      if (parsedAge >= 1 && parsedAge <= 110) updates.age = parsedAge;
    }
  }

  // 4. Gender extraction (check female strictly before male so "female" never matches "male")
  if (
    lower.includes("female") ||
    lower.includes("महिला") ||
    lower.includes("mahila") ||
    lower.includes("aurat") ||
    lower.includes("औरत") ||
    lower.includes("लड़की") ||
    /\bwoman\b/i.test(lower) ||
    /\bgirl\b/i.test(lower)
  ) {
    updates.gender = "female";
  } else if (
    /\bmale\b/i.test(lower) ||
    lower.includes("पुरुष") ||
    lower.includes("purush") ||
    lower.includes("aadmi") ||
    lower.includes("आदमी") ||
    lower.includes("लड़का") ||
    /\bman\b/i.test(lower) ||
    /\bboy\b/i.test(lower)
  ) {
    updates.gender = "male";
  } else if (
    expectedField === "gender" &&
    (lower.includes("other") || lower.includes("अन्य") || lower.includes("transgender"))
  ) {
    updates.gender = "other";
  }

  // 5. Occupation extraction (avoid word collisions; support Hinglish & regional equivalents)
  const occ = new Set<string>();
  if (
    lower.includes("farmer") ||
    lower.includes("किसान") ||
    lower.includes("kisan") ||
    lower.includes("खेती") ||
    lower.includes("kheti")
  ) {
    occ.add("farmer");
  }
  if (
    lower.includes("student") ||
    lower.includes("छात्र") ||
    lower.includes("विद्यार्थी") ||
    lower.includes("vidyarthi") ||
    lower.includes("study") ||
    lower.includes("पढ़ाई") ||
    lower.includes("padhai") ||
    /\b(bca|bsc|btech|b\.tech|ba|bcom|iti)\b/i.test(lower)
  ) {
    occ.add("student");
  }
  if (lower.includes("phd") || lower.includes("researcher") || lower.includes("शोधार्थी")) {
    occ.add("student");
    occ.add("researcher");
    updates.is_phd_scholar = true;
  }
  if (
    lower.includes("labor") ||
    lower.includes("labour") ||
    lower.includes("worker") ||
    lower.includes("मजदूर") ||
    lower.includes("मज़दूर") ||
    lower.includes("श्रमिक") ||
    lower.includes("कामगार") ||
    lower.includes("construction") ||
    lower.includes("दिहाड़ी")
  ) {
    occ.add("laborer");
  }
  if (
    lower.includes("vendor") ||
    lower.includes("वेंडर") ||
    lower.includes("रेहड़ी") ||
    lower.includes("ठेला") ||
    lower.includes("hawker")
  ) {
    occ.add("street_vendor");
  }
  if (
    lower.includes("business") ||
    lower.includes("व्यापार") ||
    lower.includes("व्यापारी") ||
    lower.includes("दुकान") ||
    lower.includes("shopkeeper") ||
    lower.includes("self employed") ||
    lower.includes("self-employed") ||
    lower.includes("स्वरोजगार")
  ) {
    occ.add("business");
  }
  if (
    lower.includes("homemaker") ||
    lower.includes("गृहिणी") ||
    lower.includes("housewife") ||
    lower.includes("grihini")
  ) {
    occ.add("homemaker");
  }
  if (
    lower.includes("unemployed") ||
    lower.includes("बेरोजगार") ||
    lower.includes("berojgar") ||
    lower.includes("नौकरी")
  ) {
    occ.add("unemployed");
  }
  if (
    lower.includes("artisan") ||
    lower.includes("कारीगर") ||
    lower.includes("हस्तशिल्प")
  ) {
    occ.add("artisan");
  }
  if (
    lower.includes("senior citizen") ||
    lower.includes("वरिष्ठ नागरिक") ||
    lower.includes("retired")
  ) {
    occ.add("senior_citizen");
  }

  if (occ.size > 0) {
    updates.occupation = Array.from(occ);
  }

  // 6. Category extraction (strict word boundaries)
  if (/\bews\b/i.test(lower) || lower.includes("ईडब्ल्यूएस")) {
    updates.category = "ews";
  } else if (/\bgeneral\b/i.test(lower) || lower.includes("सामान्य")) {
    updates.category = "general";
  } else if (/\bobc\b/i.test(lower) || lower.includes("ओबीसी") || lower.includes("पिछड़ा")) {
    updates.category = "obc";
  } else if (/\bsc\b/i.test(lower) || lower.includes("अनुसूचित जाति")) {
    updates.category = "sc";
  } else if (/\bst\b/i.test(lower) || lower.includes("अनुसूचित जनजाति")) {
    updates.category = "st";
  }

  // 7. Landholding & targeted boolean flags (useful for specific-scheme queries like PM-KISAN / BPL)
  const landMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:एकड़|acres?|acre)/i);
  if (landMatch) {
    updates.land_owned_acres = parseFloat(landMatch[1]);
  }
  if (/\bbpl\b/i.test(lower) || lower.includes("बीपीएल") || lower.includes("अंत्योदय")) {
    updates.is_bpl = true;
  }
  if (
    lower.includes("नहीं, सरकारी कर्मचारी नहीं") ||
    lower.includes("not govt") ||
    lower.includes("no govt job") ||
    lower.includes("नहीं, मैं करदाता व सरकारी")
  ) {
    updates.is_government_employee = false;
    updates.is_income_tax_payer = false;
  }

  return updates;
}

const STATE_NAME_DISPLAY: Record<string, { hi: string; en: string }> = {
  delhi: { hi: "दिल्ली (NCT)", en: "Delhi (NCT)" },
  haryana: { hi: "हरियाणा", en: "Haryana" },
  up: { hi: "उत्तर प्रदेश", en: "Uttar Pradesh" },
  punjab: { hi: "पंजाब", en: "Punjab" },
  other: { hi: "अन्य राज्य / केंद्र", en: "Other State / Central" },
};

function buildPromptAndChipsForField(
  field: string,
  merged: Partial<UserProfile>,
  language: "hi" | "en",
  customAck?: string
): { question: string; chips: string[] } {
  const ackPrefix = customAck ? `${customAck}\n\n` : "";

  switch (field) {
    case "state_disambiguation":
      return {
        question:
          language === "hi"
            ? "दिल्ली-एनसीआर में सरकारी योजनाओं की पात्रता आपके असली निवास राज्य (राशन कार्ड / आधार के पते) पर निर्भर करती है। कृपया बताएं आप किस क्षेत्र के निवासी हैं?"
            : "In Delhi NCR, welfare eligibility depends strictly on your legal state of residence. Please select which jurisdiction applies to you:",
        chips:
          language === "hi"
            ? [
                "🏛️ दिल्ली (NCT)",
                "🌾 हरियाणा NCR (गुरुग्राम/फरीदाबाद)",
                "🏛️ यूपी NCR (नोएडा/गाजियाबाद)",
              ]
            : [
                "🏛️ Delhi (NCT)",
                "🌾 Haryana NCR (Gurugram/Faridabad)",
                "🏛️ UP NCR (Noida/Ghaziabad)",
              ],
      };

    case "state":
      return {
        question:
          ackPrefix +
          (language === "hi"
            ? "कृपया बताइए आप किस राज्य के निवासी हैं?"
            : "Which state do you currently reside in?"),
        chips:
          language === "hi"
            ? ["🏛️ दिल्ली (NCT)", "🏛️ उत्तर प्रदेश (UP)", "🌾 पंजाब (PB)", "🌾 हरियाणा (HR)", "🇮🇳 अन्य राज्य"]
            : ["🏛️ Delhi (NCT)", "🏛️ Uttar Pradesh (UP)", "🌾 Punjab (PB)", "🌾 Haryana (HR)", "🇮🇳 Other State"],
      };

    case "age": {
      const stateDisp = merged.state
        ? STATE_NAME_DISPLAY[merged.state]?.[language] || merged.state.toUpperCase()
        : "";
      const stateAck =
        !customAck && stateDisp
          ? language === "hi"
            ? `धन्यवाद! आपका राज्य (${stateDisp}) दर्ज हो गया है।\n\n`
            : `Got it — recorded your state as ${stateDisp}.\n\n`
          : ackPrefix;
      return {
        question:
          stateAck +
          (language === "hi"
            ? "आपकी आयु (उम्र) कितने वर्ष है? (आप लिख भी सकते हैं जैसे '22')"
            : "What is your age in years? (You can type a number like '22' or tap a range)"),
        chips:
          language === "hi"
            ? ["18–25 साल", "26–40 साल", "41–59 साल", "60+ वरिष्ठ नागरिक"]
            : ["18–25 yrs", "26–40 yrs", "41–59 yrs", "60+ Senior Citizen"],
      };
    }

    case "gender":
      return {
        question:
          ackPrefix +
          (language === "hi"
            ? "कृपया अपना लिंग चुनें (महिला/पुरुष — कई योजनाएं महिलाओं व छात्राओं के लिए विशेष लाभ देती हैं):"
            : "Please select your gender (several welfare schemes have dedicated grants for women and girls):"),
        chips:
          language === "hi"
            ? ["👨 पुरुष (Male)", "👩 महिला (Female)", "अन्य (Other)"]
            : ["👨 Male", "👩 Female", "Other"],
      };

    case "occupation":
      return {
        question:
          ackPrefix +
          (language === "hi"
            ? "आप मुख्य रूप से क्या कार्य या पढ़ाई करते हैं?"
            : "What is your primary occupation or current work/study?"),
        chips:
          language === "hi"
            ? [
                "🌾 किसान",
                "📚 छात्र / विद्यार्थी",
                "👷 श्रमिक / कामगार",
                "🛒 रेहड़ी / छोटा व्यापार",
                "👩 गृहिणी",
                "🔍 बेरोजगार / अन्य",
              ]
            : [
                "🌾 Farmer",
                "📚 Student",
                "👷 Worker / Labour",
                "🛒 Street Vendor / Business",
                "👩 Homemaker",
                "🔍 Unemployed / Other",
              ],
      };

    case "annual_income_inr":
      return {
        question:
          ackPrefix +
          (language === "hi"
            ? "आपके परिवार की लगभग कुल वार्षिक आय (सालाना कमाई) कितनी है?"
            : "What is your approximate total annual family income?"),
        chips:
          language === "hi"
            ? ["₹1 लाख से कम", "₹1 से 2.5 लाख", "₹2.5 से 5 लाख", "₹5 लाख से अधिक"]
            : ["Below ₹1 Lakh", "₹1 – ₹2.5 Lakhs", "₹2.5 – ₹5 Lakhs", "Above ₹5 Lakhs"],
      };

    case "category":
      return {
        question:
          ackPrefix +
          (language === "hi"
            ? "अंतिम चरण: आप किस सामाजिक वर्ग (Category) से आते हैं? (या सीधे अपनी योजना सूची देखें)"
            : "Final step: Which social category applies to you? (Or skip directly to your matched schemes)"),
        chips:
          language === "hi"
            ? ["सामान्य (General)", "OBC", "SC", "ST", "EWS", "सीधे योजनाएं दिखाएं"]
            : ["General", "OBC", "SC", "ST", "EWS", "Skip & Show Schemes"],
      };

    case "land_owned_acres":
      return {
        question:
          ackPrefix +
          (language === "hi"
            ? "PM-KISAN पात्रता जांच के लिए बताएं: आपके पास लगभग कितनी कृषि भूमि है?"
            : "For PM-KISAN eligibility verification, approximately how many acres of cultivable land do you own?"),
        chips:
          language === "hi"
            ? ["1 एकड़", "2 एकड़", "5 एकड़ से कम", "5 एकड़ से अधिक"]
            : ["1 acre", "2 acres", "Under 5 acres", "Over 5 acres"],
      };

    default:
      return {
        question:
          ackPrefix +
          (language === "hi"
            ? "कृपया इस योजना के लिए शेष आवश्यक जानकारी साझा करें:"
            : "Please share the remaining detail needed to confirm eligibility:"),
        chips:
          language === "hi"
            ? ["हाँ (Yes)", "नहीं (No)", "नहीं, सरकारी कर्मचारी नहीं"]
            : ["Yes", "No", "Not Govt Employee"],
      };
  }
}

/**
 * Authoritative deterministic state machine invoked on every conversation turn.
 * Guarantees accurate multi-fact absorption, Delhi NCR disambiguation, step-by-step intake,
 * and zero premature scheme dumping regardless of whether Gemini succeeded or fell back.
 */
export function runIntakeStateMachine(
  input: IntakeStateMachineInput
): IntakeStateMachineOutput {
  const {
    userMessage,
    currentProfile = {},
    llmResult,
    targetSchemeId,
    forceComplete = false,
    allSchemes,
    language,
  } = input;

  const baseProfile: Partial<UserProfile> = { ...(currentProfile || {}) };
  const needsStateDisambiguation = isDelhiNCRAmbiguous(userMessage) && !baseProfile.state;

  const nextMissingBeforeTurn = getNextMissingCoreField(baseProfile) || undefined;
  const ruleUpdates = extractRuleBasedProfile(userMessage, baseProfile, nextMissingBeforeTurn);

  // Combine Gemini updates (if any) with deterministic rule extraction
  const combinedUpdates: Partial<UserProfile> = {
    ...(llmResult?.profile_updates || {}),
    ...ruleUpdates,
  };

  // CRITICAL: Never allow Gemini or heuristics to blindly lock in "delhi" if citizen said "Delhi NCR"
  if (needsStateDisambiguation) {
    delete combinedUpdates.state;
  }

  // Normalize category if skip button tapped on category stage
  const userTappedSkip = isSkipOrShowNowIntent(userMessage) || forceComplete;

  const mergedProfile: Partial<UserProfile> = {
    ...baseProfile,
    ...combinedUpdates,
  };

  // Preserve accumulated occupation array safely if both base and update had values
  if (baseProfile.occupation?.length && combinedUpdates.occupation?.length) {
    mergedProfile.occupation = Array.from(
      new Set([...baseProfile.occupation, ...combinedUpdates.occupation])
    );
  }

  // Check if query references a discontinued, merged, or viral/fake scheme name
  const schemeRedirect = targetSchemeId ? null : detectSchemeRedirect(userMessage);

  // Check if query targets a specific scheme (direct target ID, keyword, code, or redirect replacement)
  let targetScheme: Scheme | null = targetSchemeId
    ? allSchemes.find(
        (s) =>
          s.id === targetSchemeId ||
          s.scheme_code?.toLowerCase() === targetSchemeId.toLowerCase()
      ) || null
    : detectTargetScheme(userMessage, allSchemes);

  if (!targetScheme && schemeRedirect && schemeRedirect.replacement_codes.length > 0) {
    for (const code of schemeRedirect.replacement_codes) {
      targetScheme =
        allSchemes.find(
          (s) =>
            s.scheme_code?.toLowerCase() === code.toLowerCase() ||
            s.id.toLowerCase() === code.toLowerCase()
        ) || null;
      if (targetScheme) break;
    }
  }

  const redirectNoticePrefix = schemeRedirect
    ? `${language === "hi" ? schemeRedirect.alert_title_hi : schemeRedirect.alert_title_en}\n${
        language === "hi" ? schemeRedirect.alert_message_hi : schemeRedirect.alert_message_en
      }\n\n`
    : "";

  if (schemeRedirect && !targetScheme) {
    const matched = matchSchemes(mergedProfile, allSchemes);
    return {
      extracted_profile_updates: combinedUpdates,
      merged_profile: mergedProfile,
      next_question: redirectNoticePrefix.trim(),
      suggested_chips:
        language === "hi"
          ? ["सभी उपयुक्त योजनाएं खोजें", "नई जांच शुरू करें"]
          : ["Discover all eligible schemes", "Start Fresh"],
      is_profile_complete: false,
      needs_state_disambiguation: false,
      pending_fields: getPendingCoreFields(mergedProfile),
      potential_schemes_count: matched.length,
      matched_schemes: matched,
      target_scheme: null,
      eligibility_audit: null,
      scheme_redirect: schemeRedirect,
    };
  }

  let eligibilityAudit: EligibilityAuditResult | null = null;
  if (targetScheme) {
    eligibilityAudit = evaluateSchemeEligibility(mergedProfile, targetScheme, allSchemes);

    // If still missing rules specific to THAT scheme, ask ONLY its first missing criterion
    if (
      eligibilityAudit.verdict === "needs_more_info" &&
      eligibilityAudit.missingFields.length > 0 &&
      !userTappedSkip
    ) {
      const nextSchemeField = eligibilityAudit.missingFields[0];
      const promptSpec = buildPromptAndChipsForField(
        nextSchemeField,
        mergedProfile,
        language,
        llmResult?.acknowledgment
      );
      const matched = matchSchemes(mergedProfile, allSchemes);

      return {
        extracted_profile_updates: combinedUpdates,
        merged_profile: mergedProfile,
        next_question: redirectNoticePrefix + promptSpec.question,
        suggested_chips: promptSpec.chips,
        is_profile_complete: false,
        needs_state_disambiguation: needsStateDisambiguation,
        pending_fields: getPendingCoreFields(mergedProfile),
        potential_schemes_count: matched.length,
        matched_schemes: matched,
        target_scheme: {
          id: targetScheme.id,
          scheme_code: targetScheme.scheme_code,
          name: targetScheme.name,
        },
        eligibility_audit: eligibilityAudit,
        scheme_redirect: schemeRedirect,
      };
    }

    // Specific scheme verdict reached (eligible / not_eligible)
    const matched = matchSchemes(mergedProfile, allSchemes);
    return {
      extracted_profile_updates: combinedUpdates,
      merged_profile: mergedProfile,
      next_question:
        redirectNoticePrefix +
        (language === "hi"
          ? eligibilityAudit.summary_hi
          : eligibilityAudit.summary_en),
      suggested_chips:
        language === "hi"
          ? ["सभी उपयुक्त योजनाएं खोजें", "नई जांच शुरू करें"]
          : ["Discover all eligible schemes", "Start Fresh"],
      is_profile_complete: false,
      needs_state_disambiguation: false,
      pending_fields: getPendingCoreFields(mergedProfile),
      potential_schemes_count: matched.length,
      matched_schemes: matched,
      target_scheme: {
        id: targetScheme.id,
        scheme_code: targetScheme.scheme_code,
        name: targetScheme.name,
      },
      eligibility_audit: eligibilityAudit,
      scheme_redirect: schemeRedirect,
    };
  }

  // Delhi NCR Disambiguation takes absolute priority if state is still unconfirmed
  if (needsStateDisambiguation) {
    const disambigSpec = buildPromptAndChipsForField("state_disambiguation", mergedProfile, language);
    const matched = matchSchemes(mergedProfile, allSchemes);
    return {
      extracted_profile_updates: combinedUpdates,
      merged_profile: mergedProfile,
      next_question: disambigSpec.question,
      suggested_chips: disambigSpec.chips,
      is_profile_complete: false,
      needs_state_disambiguation: true,
      pending_fields: getPendingCoreFields(mergedProfile),
      potential_schemes_count: matched.length,
      matched_schemes: matched,
      target_scheme: null,
      eligibility_audit: null,
    };
  }

  // Evaluate general core intake completeness
  const coreIncomplete = REQUIRED_CORE_FIELDS.some((f) => {
    const val = (mergedProfile as Record<string, any>)[f];
    if (f === "occupation") return !Array.isArray(val) || val.length === 0;
    return val === undefined || val === null;
  });

  const nextMissing = getNextMissingCoreField(mergedProfile);
  const allMatched = matchSchemes(mergedProfile, allSchemes);
  const pendingFields = getPendingCoreFields(mergedProfile);

  // Only allow completion when:
  // 1. All 5 core fields AND category are complete, OR
  // 2. All 5 core fields are complete AND user skipped/explicitly requested schemes, OR
  // 3. Explicit manual forceComplete trigger after at least 1 field
  const canCompleteNow =
    (!coreIncomplete && !nextMissing) ||
    (!coreIncomplete && nextMissing === "category" && userTappedSkip) ||
    (forceComplete && Object.keys(mergedProfile).length > 0);

  if (canCompleteNow) {
    return {
      extracted_profile_updates: combinedUpdates,
      merged_profile: mergedProfile,
      next_question:
        language === "hi"
          ? `बढ़िया! आपकी पूरी प्रोफ़ाइल के आधार पर ${allMatched.length} उपयुक्त सरकारी योजनाएं तैयार हैं। नीचे दी गई सूची देखें:`
          : `All set! Based on your complete profile, here are ${allMatched.length} matched government schemes tailored to you:`,
      suggested_chips: [],
      is_profile_complete: true,
      needs_state_disambiguation: false,
      pending_fields: pendingFields,
      potential_schemes_count: allMatched.length,
      matched_schemes: allMatched,
      target_scheme: null,
      eligibility_audit: null,
    };
  }

  // Interview must continue: pick single next missing field
  const targetField = nextMissing || "state";
  const nextSpec = buildPromptAndChipsForField(
    targetField,
    mergedProfile,
    language,
    llmResult?.acknowledgment
  );

  // Preserve valid Gemini follow-up question when LLM respected progressive intake;
  // otherwise use our deterministic prompt + tailored quick-reply chips.
  const hasValidLlmFollowUp =
    llmResult &&
    !llmResult.is_complete &&
    typeof llmResult.next_question === "string" &&
    llmResult.next_question.trim().length > 5 &&
    !llmResult.next_question.includes("technical issue") &&
    !llmResult.next_question.includes("तकनीकी समस्या");

  const finalQuestion = hasValidLlmFollowUp
    ? llmResult.next_question!.trim()
    : nextSpec.question;

  const finalChips =
    hasValidLlmFollowUp &&
    Array.isArray(llmResult.suggested_chips) &&
    llmResult.suggested_chips.length > 0
      ? llmResult.suggested_chips
      : nextSpec.chips;

  return {
    extracted_profile_updates: combinedUpdates,
    merged_profile: mergedProfile,
    next_question: finalQuestion,
    suggested_chips: finalChips,
    is_profile_complete: false,
    needs_state_disambiguation: false,
    pending_fields: pendingFields,
    potential_schemes_count: allMatched.length,
    matched_schemes: allMatched,
    target_scheme: null,
    eligibility_audit: null,
  };
}
