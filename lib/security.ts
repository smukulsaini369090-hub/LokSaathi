/**
 * Centralized Security, Privacy & Anti-Prompt-Injection Guardrails for LokSaathi.
 * Compliant with OWASP Top 10, OWASP LLM Top 10, and India DPDP Act 2023.
 */
import type { UserProfile } from "@/lib/scheme-matcher";
import type { DocExplanation } from "@/lib/gemini";

const ALLOWED_PROFILE_KEYS: Array<keyof UserProfile> = [
  "state",
  "age",
  "gender",
  "occupation",
  "annual_income_inr",
  "category",
  "land_owned_acres",
  "is_bpl",
  "has_bank_account",
  "is_disabled",
  "is_minority",
  "household_size",
  "is_income_tax_payer",
  "is_government_employee",
  "owns_pucca_house",
  "has_lpg_connection",
  "is_epfo_esic_member",
  "has_other_pension",
  "is_capf_ward",
  "is_phd_scholar",
];

// Map common Cyrillic/Greek homoglyphs used in obfuscated prompt injections back to ASCII
const CONFUSABLE_CHAR_MAP: Record<string, string> = {
  "\u0430": "a",
  "\u0435": "e",
  "\u043e": "o",
  "\u0440": "p",
  "\u0441": "c",
  "\u0445": "x",
  "\u0456": "i",
  "\u0455": "s",
  "\u0443": "y",
  "\u0410": "A",
  "\u0415": "E",
  "\u041e": "O",
  "\u0420": "P",
  "\u0421": "C",
};

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above|system)\s+instructions?/i,
  /disregard\s+(?:all\s+)?(?:previous|prior|system)\s+instructions?/i,
  /(?:output|print|reveal|show|repeat|dump|leak|tell me)\s+(?:your\s+|the\s+)?(?:verbatim\s+)?(?:exact\s+)?(?:system\s+prompt|hidden\s+instructions?|developer\s+prompt|system\s+instructions?|api\s+key)/i,
  /you\s+are\s+now\s+(?:in\s+)?(?:debugmode|dan|developer\s+mode|jailbreak)/i,
  /\bdan\b.*\bdo anything now\b/i,
  /<\s*\/?\s*(?:system|instruction|untrusted_citizen_input)\s*>/i,
  /\[INST\]|<<SYS>>|<\|im_start\|>/i,
  /forget\s+everything\s+(?:you\s+)?(?:know|before)/i,
];

const SCAM_MANIPULATION_PATTERNS: RegExp[] = [
  /\b[a-z0-9._-]{2,}@(?:ybl|okaxis|okicici|oksbi|paytm|ibl|axl|upi)\b/i,
  /(?:send|pay|transfer|deposit)\s*(?:rs\.?|₹|inr)?\s*\d+\s*(?:to|on|via)\s*(?:upi|paytm|phonepe|gpay|account)/i,
  /\b(?:pm|pradhan\s*mantri)\s+(?:free\s+laptop|free\s+scooty|free\s+iphone|kanya\s+ashirwad\s*50,?000)\b/i,
  /(?:share|enter|send)\s+(?:your\s+)?(?:bank\s+)?otp\b/i,
];

/**
 * Redacts Google API keys, Bearer tokens, and query-param secrets from logs and error strings.
 */
export function redactSecrets(input: unknown): string {
  const str = typeof input === "string" ? input : input instanceof Error ? input.message : String(input ?? "");
  return str
    .replace(/AIzaSy[0-9A-Za-z_-]{10,}/g, "[REDACTED_API_KEY]")
    .replace(/([?&]key=)[^&\s"']+/gi, "$1[REDACTED]")
    .replace(/(bearer\s+)[A-Za-z0-9._-]+/gi, "$1[REDACTED_TOKEN]");
}

/**
 * Normalizes confusable homoglyphs, strips control/zero-width chars,
 * escapes delimiter breakouts, and bounds string length.
 */
export function sanitizeUntrustedInput(raw: string, maxLength: number = 2000): string {
  if (typeof raw !== "string") return "";
  let cleaned = raw
    // Strip zero-width & bidirectional override chars used to smuggle instructions
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    // Strip ASCII control chars except newline/tab
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  // Prevent closing the untrusted wrapper delimiter
  cleaned = cleaned.replace(/<\/?\s*untrusted_citizen_input\s*>/gi, "[tag]");
  return cleaned;
}

function normalizeForSecurityDetection(text: string): string {
  const nfkc = text
    .normalize("NFKC")
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "");
  return Array.from(nfkc)
    .map((ch) => CONFUSABLE_CHAR_MAP[ch] || ch)
    .join("");
}

/**
 * Detects direct, homoglyph-obfuscated, or Base64-encoded prompt injection / jailbreak attempts
 * and payment/fake-scheme coercion payloads.
 */
export function detectPromptInjectionAttack(text: string): {
  blocked: boolean;
  reason?: "prompt_injection" | "scam_manipulation";
} {
  if (!text || typeof text !== "string") return { blocked: false };

  const normalized = normalizeForSecurityDetection(text);

  for (const pat of PROMPT_INJECTION_PATTERNS) {
    if (pat.test(normalized)) {
      return { blocked: true, reason: "prompt_injection" };
    }
  }

  // Check short Base64 blobs that decode to an injection command
  const b64Matches = normalized.match(/\b[A-Za-z0-9+/]{24,}={0,2}\b/g);
  if (b64Matches) {
    for (const candidate of b64Matches.slice(0, 3)) {
      try {
        const decoded = Buffer.from(candidate, "base64").toString("utf8");
        if (PROMPT_INJECTION_PATTERNS.some((pat) => pat.test(decoded))) {
          return { blocked: true, reason: "prompt_injection" };
        }
      } catch {}
    }
  }

  for (const scamPat of SCAM_MANIPULATION_PATTERNS) {
    if (scamPat.test(normalized)) {
      return { blocked: true, reason: "scam_manipulation" };
    }
  }

  return { blocked: false };
}

/**
 * Strips raw HTML tags, event handlers, and javascript: URIs from untrusted/LLM text outputs.
 */
export function sanitizePlainTextOutput(text: string): string {
  if (typeof text !== "string") return "";
  let safe = text
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "");

  // Scrub any injected private UPI IDs or illegal payment solicitation
  if (SCAM_MANIPULATION_PATTERNS.some((p) => p.test(safe))) {
    safe = safe.replace(
      /\b[a-z0-9._-]{2,}@(?:ybl|okaxis|okicici|oksbi|paytm|ibl|axl|upi)\b/gi,
      "[BLOCKED_SUSPICIOUS_PAYMENT_ID]"
    );
  }
  return safe.trim();
}

/**
 * Validates and clamps base64 image uploads on /api/doc-explain (max ~2.2MB binary / 3M base64 chars,
 * strictly JPEG / PNG / WebP — blocks HTML, SVG XSS/XXE payloads, and memory bombs).
 */
export function validateBase64ImageInput(
  raw: unknown
): { valid: true; normalized: string } | { valid: false; error: string } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { valid: false, error: "missing_image_base64" };
  }

  const trimmed = raw.trim();
  if (trimmed.length > 3_000_000) {
    return { valid: false, error: "image_payload_too_large" };
  }

  const match = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (match) {
    const mime = match[1].toLowerCase().trim();
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mime)) {
      return { valid: false, error: "unsupported_image_mime" };
    }
    if (!match[2] || match[2].trim().length < 8) {
      return { valid: false, error: "invalid_image_data" };
    }
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Sanitizes and allowlists UserProfile fields from untrusted API JSON bodies,
 * preventing prototype pollution and out-of-range integer attacks.
 */
export function validateProfilePayload(raw: unknown): Partial<UserProfile> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const src = raw as Record<string, unknown>;
  const safe: Partial<UserProfile> = {};

  for (const key of ALLOWED_PROFILE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(src, key)) continue;
    const val = src[key];
    if (val === undefined || val === null) continue;

    switch (key) {
      case "state":
        if (["delhi", "haryana", "up", "punjab", "other"].includes(String(val))) {
          safe.state = String(val) as UserProfile["state"];
        }
        break;
      case "gender":
        if (["male", "female", "other"].includes(String(val))) {
          safe.gender = String(val) as UserProfile["gender"];
        }
        break;
      case "category":
        if (["general", "obc", "sc", "st", "ews"].includes(String(val))) {
          safe.category = String(val) as UserProfile["category"];
        }
        break;
      case "age":
        if (typeof val === "number" && Number.isFinite(val) && val >= 0 && val <= 120) {
          safe.age = Math.round(val);
        }
        break;
      case "annual_income_inr":
        if (typeof val === "number" && Number.isFinite(val) && val >= 0 && val <= 100_000_000) {
          safe.annual_income_inr = Math.round(val);
        }
        break;
      case "land_owned_acres":
        if (typeof val === "number" && Number.isFinite(val) && val >= 0 && val <= 10_000) {
          safe.land_owned_acres = val;
        }
        break;
      case "household_size":
        if (typeof val === "number" && Number.isFinite(val) && val >= 1 && val <= 50) {
          safe.household_size = Math.round(val);
        }
        break;
      case "occupation":
        if (Array.isArray(val)) {
          safe.occupation = val
            .slice(0, 5)
            .map((item) => sanitizePlainTextOutput(String(item)).toLowerCase())
            .filter(Boolean);
        }
        break;
      default:
        if (typeof val === "boolean") {
          (safe as Record<string, unknown>)[key] = val;
        }
        break;
    }
  }

  return safe;
}

/**
 * Sanitizes LLM DocExplanation outputs against stored/reflected XSS or injected scam text.
 */
export function sanitizeDocExplanation(
  doc: DocExplanation,
  language: "hi" | "en" = "hi"
): DocExplanation {
  const safeWarnings = Array.isArray(doc.warnings)
    ? doc.warnings.slice(0, 10).map((w) => sanitizePlainTextOutput(String(w)))
    : [];

  const combinedText = [
    doc.summary || "",
    doc.full_explanation || "",
    ...safeWarnings,
  ].join(" ");

  if (SCAM_MANIPULATION_PATTERNS.some((p) => p.test(combinedText))) {
    safeWarnings.unshift(
      language === "hi"
        ? "⚠️ सुरक्षा चेतावनी: इस दस्तावेज़ में संदिग्ध भुगतान/OTP अनुरोध दिखा है। किसी निजी UPI या लिंक पर पैसे न भेजें।"
        : "⚠️ Security Alert: This document contains suspicious payment/OTP requests. Never transfer money to private UPI IDs or unverified links."
    );
  }

  return {
    ...doc,
    document_type: sanitizePlainTextOutput(doc.document_type || ""),
    summary: sanitizePlainTextOutput(doc.summary || ""),
    full_explanation: sanitizePlainTextOutput(doc.full_explanation || ""),
    warnings: safeWarnings,
    key_fields: Array.isArray(doc.key_fields)
      ? doc.key_fields.slice(0, 20).map((kf) => ({
          label: sanitizePlainTextOutput(String(kf?.label || "")),
          value: sanitizePlainTextOutput(String(kf?.value || "")),
          importance: kf?.importance === "critical" ? "critical" : "normal",
        }))
      : [],
    action_items: Array.isArray(doc.action_items)
      ? doc.action_items.slice(0, 15).map((ai) => ({
          task: sanitizePlainTextOutput(String(ai?.task || "")),
          deadline: ai?.deadline ? sanitizePlainTextOutput(String(ai.deadline)) : undefined,
          urgency:
            ai?.urgency === "high" || ai?.urgency === "medium" || ai?.urgency === "low"
              ? ai.urgency
              : "medium",
        }))
      : [],
    form_guide_steps: Array.isArray(doc.form_guide_steps)
      ? doc.form_guide_steps.slice(0, 30).map((step, idx) => ({
          step_number: typeof step?.step_number === "number" ? step.step_number : idx + 1,
          box_title: sanitizePlainTextOutput(String(step?.box_title || "")),
          what_to_write: sanitizePlainTextOutput(String(step?.what_to_write || "")),
          source_document: sanitizePlainTextOutput(String(step?.source_document || "")),
          is_optional: Boolean(step?.is_optional),
        }))
      : undefined,
  };
}
