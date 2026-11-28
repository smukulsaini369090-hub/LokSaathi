import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingGuide, ONBOARDING_STORAGE_KEY } from "@/components/OnboardingGuide";
import { LanguageProvider } from "@/components/LanguageContext";
import { getStoredPreferences } from "@/lib/preferences";

vi.mock("@/hooks/useSpeechSynthesis", () => ({
  useSpeechSynthesis: () => ({
    speak: vi.fn(),
    stop: vi.fn(),
    isPlaying: false,
    isSupported: true,
    prewarmTTS: vi.fn(),
  }),
}));

describe("Non-Blocking Permissions Onboarding & Preference Controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("NEVER calls getUserMedia or geolocation automatically on render and allows 1-tap Skip / Escape dismissal", () => {
    const getUserMediaSpy = vi.fn();
    const getGeoSpy = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaSpy },
      configurable: true,
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: getGeoSpy },
      configurable: true,
    });

    render(
      <LanguageProvider>
        <OnboardingGuide forceOpen={true} />
      </LanguageProvider>
    );

    // Must not auto-prompt browser permissions on open
    expect(getUserMediaSpy).not.toHaveBeenCalled();
    expect(getGeoSpy).not.toHaveBeenCalled();

    // Step 1 renders Terms & Privacy links without blocking progress
    expect(screen.getByRole("link", { name: /नियम|Terms/i })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: /गोपनीयता|Privacy/i })).toHaveAttribute("href", "/privacy");

    // Escape dismisses dialog & marks completed cleanly
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
  });

  it("requests mic/location ONLY on explicit Allow tap and persists Not Now choice cleanly", async () => {
    const mockStopTrack = vi.fn();
    const getUserMediaSpy = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: mockStopTrack }],
    });
    const getGeoSpy = vi.fn((success) =>
      success({ coords: { latitude: 28.61, longitude: 77.2 } })
    );
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaSpy },
      configurable: true,
    });
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: getGeoSpy },
      configurable: true,
    });

    render(
      <LanguageProvider>
        <OnboardingGuide forceOpen={true} />
      </LanguageProvider>
    );

    // Advance to Step 4 (Device & Permissions Setup)
    const nextBtn = screen.getByRole("button", { name: /आगे बढ़ें|Next/i });
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);

    expect(getUserMediaSpy).not.toHaveBeenCalled();
    expect(getGeoSpy).not.toHaveBeenCalled();

    const allowButtons = screen.getAllByRole("button", { name: /अनुमति दें|Allow/i });
    const notNowButtons = screen.getAllByRole("button", { name: /अभी नहीं|Not Now/i });
    expect(allowButtons.length).toBeGreaterThanOrEqual(3);
    expect(notNowButtons.length).toBeGreaterThanOrEqual(3);

    // Explicit Allow for Microphone (first row)
    fireEvent.click(allowButtons[0]);
    await waitFor(() => expect(getUserMediaSpy).toHaveBeenCalledTimes(1));
    expect(mockStopTrack).toHaveBeenCalled();
    expect(getStoredPreferences().mic).toBe("allowed");

    // Explicit Not Now for Location (second row) — zero browser prompt fired
    fireEvent.click(notNowButtons[1]);
    expect(getGeoSpy).not.toHaveBeenCalled();
    expect(getStoredPreferences().location).toBe("later");
  });

  it("does NOT flash modal for returning users and jumps cleanly to Permissions via loksaathi_open_permissions", async () => {
    vi.useFakeTimers();
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");

    render(
      <LanguageProvider>
        <OnboardingGuide />
      </LanguageProvider>
    );

    await vi.advanceTimersByTimeAsync(1200);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Footer trigger dispatches loksaathi_open_permissions -> jumps cleanly to Permissions & Setup
    fireEvent(window, new Event("loksaathi_open_permissions"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/आवाज़ और माइक्रोफ़ोन|Voice & Microphone/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
