/**
 * Local Profile Storage for LokSaathi.
 * Persists non-sensitive demographic profile in localStorage so citizens
 * can audit multiple schemes without repeatedly typing their information.
 *
 * PRIVACY GUARANTEE:
 * - Only stores non-identifiable demographic attributes (state, age, gender, occupation, income, category).
 * - NEVER requests, accepts, or stores Aadhaar, PAN, phone, or bank numbers.
 * - Entirely client-side on the user's phone/browser.
 */

import type { UserProfile } from "@/lib/scheme-matcher";

export const USER_PROFILE_STORAGE_KEY = "loksaathi_user_profile";
export const PROFILE_UPDATED_EVENT = "loksaathi_profile_updated";

const ALLOWED_FIELDS: Array<keyof UserProfile> = [
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
];

export function getStoredUserProfile(): Partial<UserProfile> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    // Filter to strictly allowed non-sensitive fields
    const sanitized: Partial<UserProfile> = {};
    for (const key of ALLOWED_FIELDS) {
      if (parsed[key] !== undefined && parsed[key] !== null) {
        (sanitized as any)[key] = parsed[key];
      }
    }
    return sanitized;
  } catch (err) {
    console.error("Failed to read stored user profile:", err);
    return {};
  }
}

export function saveStoredUserProfile(profile: Partial<UserProfile>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getStoredUserProfile();
    const updated = { ...existing };

    for (const key of ALLOWED_FIELDS) {
      if (profile[key] !== undefined && profile[key] !== null) {
        (updated as any)[key] = profile[key];
      }
    }

    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updated));

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: updated }));
    }
  } catch (err) {
    console.error("Failed to save user profile to localStorage:", err);
  }
}

export function clearStoredUserProfile(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: {} }));
    }
  } catch (err) {
    console.error("Failed to clear user profile:", err);
  }
}
