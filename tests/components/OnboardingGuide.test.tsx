import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingGuide, ONBOARDING_STORAGE_KEY } from "@/components/OnboardingGuide";
import { LanguageProvider } from "@/components/LanguageContext";

const mockSpeak = vi.fn();
const mockStop = vi.fn();

vi.mock("@/hooks/useSpeechSynthesis", () => ({
  useSpeechSynthesis: () => ({
    speak: mockSpeak,
    stop: mockStop,
    isPlaying: false,
    isSupported: true,
    prewarmTTS: vi.fn(),
  }),
}));

describe("OnboardingGuide Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWithLanguage = (ui: React.ReactElement) => {
    return render(<LanguageProvider>{ui}</LanguageProvider>);
  };

  it("renders when forceOpen is true", () => {
    renderWithLanguage(<OnboardingGuide forceOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/लोकसाथी में आपका स्वागत है|Welcome to LokSaathi/i)).toBeInTheDocument();
  });

  it("advances through the 4 onboarding steps with Next and Back buttons", () => {
    renderWithLanguage(<OnboardingGuide forceOpen={true} />);

    // Step 1: Welcome
    expect(screen.getByText(/लोकसाथी में आपका स्वागत है|Welcome to LokSaathi/i)).toBeInTheDocument();

    // Click Next -> Step 2 (Schemes Discovery)
    const nextBtn = screen.getByRole("button", { name: /आगे बढ़ें|Next/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/योजनाएं खोजने के 2 आसान तरीके|2 Easy Ways to Find Schemes/i)).toBeInTheDocument();

    // Click Next -> Step 3 (Documents)
    fireEvent.click(nextBtn);
    expect(screen.getByText(/सरकारी नोटिस व फॉर्म आसानी से समझें|Understand Notices & Forms Simply/i)).toBeInTheDocument();

    // Click Next -> Step 4 (Device Setup)
    fireEvent.click(nextBtn);
    expect(screen.getByText(/अपने डिवाइस को 100% तैयार करें|Ensure Your Device is 100% Ready/i)).toBeInTheDocument();

    // Click Back -> Returns to Step 3
    const backBtn = screen.getByRole("button", { name: /पीछे जाएं|Back/i });
    fireEvent.click(backBtn);
    expect(screen.getByText(/सरकारी नोटिस व फॉर्म आसानी से समझें|Understand Notices & Forms Simply/i)).toBeInTheDocument();
  });

  it("includes audio Suno/Listen button that triggers speech playback", () => {
    renderWithLanguage(<OnboardingGuide forceOpen={true} />);

    const listenBtn = screen.getByRole("button", { name: /सुनें|Listen/i });
    expect(listenBtn).toBeInTheDocument();

    fireEvent.click(listenBtn);
    expect(mockSpeak).toHaveBeenCalled();
  });

  it("sets localStorage flag when Skip button is clicked and closes modal", () => {
    renderWithLanguage(<OnboardingGuide forceOpen={true} />);

    const skipBtn = screen.getByRole("button", { name: /छोड़ें|Skip/i });
    fireEvent.click(skipBtn);

    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("allows switching language directly inside Step 1", () => {
    renderWithLanguage(<OnboardingGuide forceOpen={true} />);

    const englishBtn = screen.getByRole("button", { name: /English/i });
    fireEvent.click(englishBtn);

    expect(screen.getByText(/Welcome to LokSaathi/i)).toBeInTheDocument();
  });
});
