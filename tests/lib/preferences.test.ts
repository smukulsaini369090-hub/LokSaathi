import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PREFERENCES_STORAGE_KEY,
  getDefaultPreferences,
  getStoredPreferences,
  savePreferenceUpdate,
  resetPermissionPreferences,
  eraseAllLocalUserData,
  requestMicrophonePermission,
  requestLocationPermission,
} from "@/lib/preferences";

describe("Preferences & Permissions Store (lib/preferences.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("returns safe defaults and recovers cleanly from corrupt JSON in localStorage", () => {
    const def = getDefaultPreferences();
    expect(def.mic).toBe("unset");
    expect(def.location).toBe("unset");
    expect(def.offline_tts).toBe("unset");
    expect(def.version).toBe(1);

    localStorage.setItem(PREFERENCES_STORAGE_KEY, "{corrupt-json!!!");
    const recovered = getStoredPreferences();
    expect(recovered.mic).toBe("unset");
    expect(recovered.location).toBe("unset");
    expect(recovered.offline_tts).toBe("unset");
  });

  it("persists allow / later / denied updates and resets permission preferences cleanly", () => {
    savePreferenceUpdate({ mic: "allowed", location: "later", offline_tts: "allowed", legal_acknowledged: true });
    const loaded = getStoredPreferences();
    expect(loaded.mic).toBe("allowed");
    expect(loaded.location).toBe("later");
    expect(loaded.offline_tts).toBe("allowed");
    expect(loaded.legal_acknowledged).toBe(true);

    const afterReset = resetPermissionPreferences();
    expect(afterReset.mic).toBe("unset");
    expect(afterReset.location).toBe("unset");
    expect(afterReset.offline_tts).toBe("unset");
  });

  it("eraseAllLocalUserData removes citizen profile, preferences, receipt checklists, and onboarding keys", async () => {
    localStorage.setItem("loksaathi_user_profile", JSON.stringify({ state: "delhi", age: 30 }));
    localStorage.setItem("loksaathi_receipt_ack_pm-kisan", JSON.stringify({ gotReceipt: true }));
    localStorage.setItem("loksaathi_onboarding_v1_done", "true");
    savePreferenceUpdate({ mic: "allowed" });

    await eraseAllLocalUserData();

    expect(localStorage.getItem("loksaathi_user_profile")).toBeNull();
    expect(localStorage.getItem("loksaathi_receipt_ack_pm-kisan")).toBeNull();
    expect(localStorage.getItem("loksaathi_onboarding_v1_done")).toBeNull();
    expect(localStorage.getItem(PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it("handles missing or denied browser media/geolocation APIs gracefully without throwing", async () => {
    const origMedia = navigator.mediaDevices;
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      configurable: true,
    });
    const micUnsupported = await requestMicrophonePermission();
    expect(micUnsupported).toBe("unsupported");
    expect(getStoredPreferences().mic).toBe("unsupported");

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValueOnce(Object.assign(new Error("Denied"), { name: "NotAllowedError" })),
      },
      configurable: true,
    });
    const micDenied = await requestMicrophonePermission();
    expect(micDenied).toBe("denied");
    expect(getStoredPreferences().mic).toBe("denied");

    Object.defineProperty(navigator, "mediaDevices", { value: origMedia, configurable: true });

    const origGeo = navigator.geolocation;
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });
    const locUnsupported = await requestLocationPermission();
    expect(locUnsupported).toBe("unsupported");
    expect(getStoredPreferences().location).toBe("unsupported");
    Object.defineProperty(navigator, "geolocation", { value: origGeo, configurable: true });
  });
});
