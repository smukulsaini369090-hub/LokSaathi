/**
 * Structured Citizen Permissions & Preferences Store for LokSaathi.
 * Versioned localStorage schema with SSR safety, corrupt-JSON recovery,
 * passive capability detection, and explicit user-initiated permission prompts.
 */
import { clearAllSchemes } from "@/lib/offline";
import { clearStoredUserProfile } from "@/lib/storage";
import { clearStoredApiKey } from "@/lib/client-api-key";

export const PREFERENCES_STORAGE_KEY = "loksaathi_preferences_v1";
export const PREFERENCES_UPDATED_EVENT = "loksaathi_preferences_updated";

export type PermissionKey = "mic" | "location" | "offline_tts";
export type PermissionChoice = "unset" | "allowed" | "later" | "denied" | "unsupported";

export interface LokSaathiPreferences {
  version: 1;
  mic: PermissionChoice;
  location: PermissionChoice;
  offline_tts: PermissionChoice;
  legal_acknowledged: boolean;
  legal_acknowledged_at: string | null;
  updated_at: string;
}

const VALID_CHOICES = new Set<PermissionChoice>([
  "unset",
  "allowed",
  "later",
  "denied",
  "unsupported",
]);

export function getDefaultPreferences(): LokSaathiPreferences {
  return {
    version: 1,
    mic: "unset",
    location: "unset",
    offline_tts: "unset",
    legal_acknowledged: false,
    legal_acknowledged_at: null,
    updated_at: "",
  };
}

function sanitizeChoice(val: unknown): PermissionChoice {
  return typeof val === "string" && VALID_CHOICES.has(val as PermissionChoice)
    ? (val as PermissionChoice)
    : "unset";
}

export function getStoredPreferences(): LokSaathiPreferences {
  const defaults = getDefaultPreferences();
  if (typeof window === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return defaults;
    }

    return {
      version: 1,
      mic: sanitizeChoice(parsed.mic),
      location: sanitizeChoice(parsed.location),
      offline_tts: sanitizeChoice(parsed.offline_tts),
      legal_acknowledged: Boolean(parsed.legal_acknowledged),
      legal_acknowledged_at:
        typeof parsed.legal_acknowledged_at === "string" ? parsed.legal_acknowledged_at : null,
      updated_at: typeof parsed.updated_at === "string" ? parsed.updated_at : "",
    };
  } catch {
    return defaults;
  }
}

export function savePreferenceUpdate(
  partial: Partial<Omit<LokSaathiPreferences, "version">>
): LokSaathiPreferences {
  const current = getStoredPreferences();
  const nowIso = new Date().toISOString();

  const nextLegalAck =
    partial.legal_acknowledged !== undefined
      ? Boolean(partial.legal_acknowledged)
      : current.legal_acknowledged;

  const updated: LokSaathiPreferences = {
    version: 1,
    mic: partial.mic !== undefined ? sanitizeChoice(partial.mic) : current.mic,
    location: partial.location !== undefined ? sanitizeChoice(partial.location) : current.location,
    offline_tts:
      partial.offline_tts !== undefined ? sanitizeChoice(partial.offline_tts) : current.offline_tts,
    legal_acknowledged: nextLegalAck,
    legal_acknowledged_at:
      nextLegalAck && !current.legal_acknowledged_at
        ? nowIso
        : partial.legal_acknowledged === false
        ? null
        : current.legal_acknowledged_at,
    updated_at: nowIso,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent(PREFERENCES_UPDATED_EVENT, { detail: updated }));
    } catch {}
  }

  return updated;
}

export function resetPermissionPreferences(): LokSaathiPreferences {
  return savePreferenceUpdate({
    mic: "unset",
    location: "unset",
    offline_tts: "unset",
  });
}

/**
 * DPDP Act 2023 One-Tap Local Erasure:
 * Permanently clears preferences, demographic profile, saved schemes,
 * receipt checklists, onboarding status, and optional BYOK key from this device.
 */
export async function eraseAllLocalUserData(): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      clearStoredUserProfile();
      clearStoredApiKey();
      localStorage.removeItem(PREFERENCES_STORAGE_KEY);
      localStorage.removeItem("loksaathi_onboarding_v1_done");
      localStorage.removeItem("loksaathi_lang");

      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("loksaathi_receipt_ack_")) {
          keysToDelete.push(k);
        }
      }
      for (const k of keysToDelete) {
        localStorage.removeItem(k);
      }
    } catch {}

    try {
      sessionStorage.removeItem("loksaathi_install_dismissed");
    } catch {}

    try {
      window.dispatchEvent(
        new CustomEvent(PREFERENCES_UPDATED_EVENT, { detail: getDefaultPreferences() })
      );
    } catch {}
  }

  if (typeof indexedDB !== "undefined") {
    try {
      await clearAllSchemes();
    } catch {}
  }
}

export interface BrowserCapabilities {
  hasMicAPI: boolean;
  hasLocationAPI: boolean;
  hasSpeechAPI: boolean;
  hasStorageAPI: boolean;
}

export function checkBrowserCapabilities(): BrowserCapabilities {
  if (typeof window === "undefined") {
    return {
      hasMicAPI: false,
      hasLocationAPI: false,
      hasSpeechAPI: false,
      hasStorageAPI: false,
    };
  }

  let hasStorageAPI = false;
  try {
    localStorage.setItem("__loksaathi_cap_probe", "1");
    localStorage.removeItem("__loksaathi_cap_probe");
    hasStorageAPI = true;
  } catch {
    hasStorageAPI = false;
  }

  return {
    hasMicAPI: Boolean(typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia),
    hasLocationAPI: Boolean(typeof navigator !== "undefined" && navigator.geolocation?.getCurrentPosition),
    hasSpeechAPI: "speechSynthesis" in window,
    hasStorageAPI,
  };
}

/**
 * Reads browser Permissions API passively without triggering any OS prompt.
 */
export async function queryPassivePermissionState(
  name: "microphone" | "geolocation"
): Promise<"allowed" | "denied" | null> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return null;
  }
  try {
    const status = await navigator.permissions.query({ name: name as PermissionName });
    if (status.state === "granted") return "allowed";
    if (status.state === "denied") return "denied";
    return null;
  } catch {
    return null;
  }
}

/**
 * Triggered ONLY by explicit citizen tap on "Allow / अनुमति दें" for Microphone.
 */
export async function requestMicrophonePermission(): Promise<PermissionChoice> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    savePreferenceUpdate({ mic: "unsupported" });
    return "unsupported";
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    savePreferenceUpdate({ mic: "allowed" });
    return "allowed";
  } catch (err: any) {
    const errName = err?.name || "";
    const choice: PermissionChoice =
      errName === "NotFoundError" || errName === "DevicesNotFoundError"
        ? "unsupported"
        : "denied";
    savePreferenceUpdate({ mic: choice });
    return choice;
  }
}

/**
 * Triggered ONLY by explicit citizen tap on "Allow / अनुमति दें" for Nearby Center Location.
 * Never persists or transmits raw GPS coordinates to any server.
 */
export async function requestLocationPermission(): Promise<PermissionChoice> {
  if (typeof navigator === "undefined" || !navigator.geolocation?.getCurrentPosition) {
    savePreferenceUpdate({ location: "unsupported" });
    return "unsupported";
  }

  return new Promise((resolve) => {
    try {
      navigator.geolocation.getCurrentPosition(
        () => {
          savePreferenceUpdate({ location: "allowed" });
          resolve("allowed");
        },
        (err) => {
          const choice: PermissionChoice = err?.code === 1 ? "denied" : "later";
          savePreferenceUpdate({ location: choice });
          resolve(choice);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      );
    } catch {
      savePreferenceUpdate({ location: "unsupported" });
      resolve("unsupported");
    }
  });
}

/**
 * Enables offline storage preference and local browser SpeechSynthesis readiness.
 */
export function enableOfflineAndTTSPreference(): PermissionChoice {
  const caps = checkBrowserCapabilities();
  const choice: PermissionChoice =
    caps.hasStorageAPI || caps.hasSpeechAPI ? "allowed" : "unsupported";
  savePreferenceUpdate({ offline_tts: choice });
  return choice;
}

export function markPreferenceLater(key: PermissionKey): LokSaathiPreferences {
  return savePreferenceUpdate({ [key]: "later" });
}
