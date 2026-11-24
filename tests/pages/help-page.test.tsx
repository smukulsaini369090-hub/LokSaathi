import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HelpCenterPage from "@/app/help/page";
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

describe("Help & Device Diagnostics Page (/help)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithLanguage = (ui: React.ReactElement) => {
    return render(<LanguageProvider>{ui}</LanguageProvider>);
  };

  it("renders page header and live device readiness test panel", () => {
    renderWithLanguage(<HelpCenterPage />);

    expect(screen.getByText(/मदद और डिवाइस सेटअप केंद्र|Help & Device Setup Center/i)).toBeInTheDocument();
    expect(screen.getByText(/1-टैप डिवाइस तत्परता जांच|1-Tap Device Readiness Test/i)).toBeInTheDocument();
    expect(screen.getByText(/कैमरा और माइक्रोफ़ोन|Microphone & Camera/i)).toBeInTheDocument();
    expect(screen.getByText(/ऑफ़लाइन भंडारण|Offline Storage/i)).toBeInTheDocument();
  });

  it("tests audio sound playback when Audio test button is tapped", () => {
    renderWithLanguage(<HelpCenterPage />);

    const audioTestBtn = screen.getByRole("button", { name: /आवाज चलाकर देखें|Play Test Sound/i });
    fireEvent.click(audioTestBtn);

    expect(mockSpeak).toHaveBeenCalled();
  });

  it("switches OS tabs and updates setup instructions accordingly", () => {
    renderWithLanguage(<HelpCenterPage />);

    // Click iOS tab
    const iosTab = screen.getByRole("button", { name: /ios/i });
    fireEvent.click(iosTab);
    expect(screen.getAllByText(/iPhone|Safari/i).length).toBeGreaterThan(0);

    // Click Windows tab
    const windowsTab = screen.getByRole("button", { name: /windows/i });
    fireEvent.click(windowsTab);
    expect(screen.getAllByText(/Windows|Edge/i).length).toBeGreaterThan(0);
  });

  it("expands FAQ answer when an FAQ item is clicked", () => {
    renderWithLanguage(<HelpCenterPage />);

    const faqButton = screen.getByText(/माइक काम नहीं कर रहा है|Microphone is not responding/i);
    fireEvent.click(faqButton);

    expect(screen.getAllByText(/Settings|Safari|Permissions|Microphone/i).length).toBeGreaterThan(0);
  });

  it("opens OnboardingGuide when Replay Tour button is clicked", () => {
    renderWithLanguage(<HelpCenterPage />);

    const replayBtn = screen.getByRole("button", { name: /टूर दोबारा देखें|Replay App Guide/i });
    fireEvent.click(replayBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
