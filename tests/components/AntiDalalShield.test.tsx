import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AntiDalalShield } from "@/components/AntiDalalShield";
import { LanguageProvider } from "@/components/LanguageContext";
import type { Scheme } from "@/lib/scheme-types";

const mockSpeak = vi.fn();
const mockStop = vi.fn();
const mockPrewarm = vi.fn();

vi.mock("@/hooks/useSpeechSynthesis", () => ({
  useSpeechSynthesis: () => ({
    speak: mockSpeak,
    stop: mockStop,
    isPlaying: false,
    isSupported: true,
    prewarmTTS: mockPrewarm,
  }),
}));

const mockScheme: Scheme = {
  id: "pm-kisan",
  name: {
    hi: "प्रधानमंत्री किसान सम्मान निधि",
    en: "PM Kisan Samman Nidhi",
  },
  last_verified: "2026-11-24",
  source_url: "https://pmkisan.gov.in",
  apply_url: "https://pmkisan.gov.in/registrationform.aspx",
  eligibility: {
    must_match_all: [],
    must_match_none: [],
  },
  benefit: {
    summary_hi: "₹6,000 प्रति वर्ष",
    summary_en: "₹6,000 per year",
  },
  documents_required: ["आधार कार्ड"],
  confidence: "verified",
};

describe("AntiDalalShield Component (components/AntiDalalShield.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders official fee, CSC fee, and anti-middlemen warning in Hindi by default", () => {
    render(
      <LanguageProvider>
        <AntiDalalShield scheme={mockScheme} />
      </LanguageProvider>
    );

    expect(
      screen.getByText(/एंटी-दलाल सुरक्षा कवच/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/दलालों से सख्त चेतावनी/i)).toBeInTheDocument();
    expect(
      screen.getByText(/निःशुल्क सरकारी पोर्टल आवेदन/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/पक्की रसीद \(Acknowledgement Slip\) सुरक्षा चेकलिस्ट/i)
    ).toBeInTheDocument();
  });

  it("switches cleanly to English when language is switched", async () => {
    localStorage.setItem("loksaathi_lang", "en");

    render(
      <LanguageProvider>
        <AntiDalalShield scheme={mockScheme} />
      </LanguageProvider>
    );

    expect(
      await screen.findByText(/Anti-Dalal Zero-Middleman Citizen Shield/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Middlemen Alert:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Free on official government portal/i)
    ).toBeInTheDocument();
  });

  it("toggles receipt checklist checkboxes and reveals success confirmation", () => {
    render(
      <LanguageProvider>
        <AntiDalalShield scheme={mockScheme} />
      </LanguageProvider>
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(3);

    // Initially success banner is not visible
    expect(
      screen.queryByText(/सुरक्षा कवच सक्रिय: आपकी रसीद सुरक्षित है/i)
    ).not.toBeInTheDocument();

    // Check all three
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    // Success banner should now be visible
    expect(
      screen.getByText(/सुरक्षा कवच सक्रिय: आपकी रसीद सुरक्षित है/i)
    ).toBeInTheDocument();
  });

  it("triggers audio playback when user taps 'नियम सुनें'", () => {
    render(
      <LanguageProvider>
        <AntiDalalShield scheme={mockScheme} />
      </LanguageProvider>
    );

    const listenBtn = screen.getByRole("button", { name: /नियम सुनें/i });
    fireEvent.click(listenBtn);

    expect(mockPrewarm).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    expect(mockSpeak.mock.calls[0][0]).toContain("एंटी-दलाल सुरक्षा कवच");
  });

  it("renders Google Maps center search and official portal links", () => {
    render(
      <LanguageProvider>
        <AntiDalalShield scheme={mockScheme} />
      </LanguageProvider>
    );

    const portalLink = screen.getByRole("link", {
      name: /आधिकारिक सरकारी पोर्टल खोलें/i,
    });
    expect(portalLink).toHaveAttribute(
      "href",
      "https://pmkisan.gov.in/registrationform.aspx"
    );

    const mapsLink = screen.getByRole("link", {
      name: /नजदीकी सीएससी जन सेवा केंद्र \(CSC Common Service Centre\) खोजें/i,
    });
    expect(mapsLink.getAttribute("href")).toContain(
      "https://www.google.com/maps/search/?api=1&query=CSC%20Common%20Service%20Centre%20near%20me"
    );
  });
});
