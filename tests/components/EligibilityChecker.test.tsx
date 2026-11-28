import React from "react";
import { renderToString } from "react-dom/server";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EligibilityChecker } from "@/components/EligibilityChecker";
import { LanguageProvider } from "@/components/LanguageContext";
import { USER_PROFILE_STORAGE_KEY } from "@/lib/storage";
import type { Scheme } from "@/lib/scheme-types";

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

const mockScheme: Scheme = {
  id: "pm-kisan",
  name: {
    hi: "प्रधानमंत्री किसान सम्मान निधि",
    en: "PM Kisan Samman Nidhi",
  },
  last_verified: "2026-11-24",
  source_url: "https://pmkisan.gov.in",
  eligibility: {
    must_match_all: [
      { field: "occupation", operator: "includes", value: ["farmer"] },
      { field: "land_owned_acres", operator: "lte", value: 5 },
    ],
    must_match_none: [
      { field: "is_income_tax_payer", operator: "eq", value: true },
      { field: "is_government_employee", operator: "eq", value: true },
    ],
  },
  benefit: {
    summary_hi: "₹6,000 प्रति वर्ष",
    summary_en: "₹6,000 per year via DBT",
  },
  documents_required: ["आधार कार्ड", "बैंक खाता पासबुक", "भूमि के दस्तावेज (खतौनी/जमाबंदी)"],
  apply_url: "https://pmkisan.gov.in",
  confidence: "verified",
};

const mockAlternativeScheme: Scheme = {
  id: "e-shram",
  name: {
    hi: "ई-श्रम कार्ड",
    en: "e-Shram Card",
  },
  last_verified: "2026-11-24",
  source_url: "https://eshram.gov.in",
  eligibility: {
    must_match_all: [
      { field: "age", operator: "gte", value: 16 },
      { field: "age", operator: "lte", value: 59 },
    ],
    must_match_none: [],
  },
  benefit: {
    summary_hi: "दुर्घटना बीमा",
    summary_en: "Accident insurance",
  },
  documents_required: ["आधार कार्ड"],
  apply_url: "https://eshram.gov.in",
  confidence: "verified",
};

describe("EligibilityChecker Component (components/EligibilityChecker.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = (props = {}) => {
    return render(
      <LanguageProvider>
        <EligibilityChecker
          scheme={mockScheme}
          allSchemes={[mockScheme, mockAlternativeScheme]}
          {...props}
        />
      </LanguageProvider>
    );
  };

  it("renders with eligible verdict when stored profile satisfies all criteria", () => {
    const eligibleProfile = {
      state: "up",
      age: 38,
      occupation: ["farmer"],
      land_owned_acres: 2,
      is_government_employee: false,
      is_income_tax_payer: false,
    };
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(eligibleProfile));

    renderComponent();

    expect(screen.getByText(/बधाई हो! आप इस योजना के पात्र हैं|Congratulations! You are eligible/i)).toBeInTheDocument();
    expect(screen.getAllByText(/संतुष्ट शर्तें|Satisfied Criteria/i).length).toBeGreaterThan(0);
  });

  it("renders not-eligible verdict with failure reason and alternative schemes", () => {
    const ineligibleProfile = {
      state: "up",
      age: 30,
      occupation: ["student"], // Not a farmer
      land_owned_acres: 0,
      is_government_employee: false,
      is_income_tax_payer: false,
    };
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(ineligibleProfile));

    renderComponent();

    expect(screen.getByText(/वर्तमान में आप इस योजना के पात्र नहीं हैं|Currently you do not meet/i)).toBeInTheDocument();
    expect(screen.getByText(/अपूर्ण या बाधित शर्तें|Unmatched Criteria/i)).toBeInTheDocument();
    // Alternative scheme recommendation
    expect(screen.getByText(/ई-श्रम कार्ड|e-Shram Card/i)).toBeInTheDocument();
  });

  it("expands step-by-step 'Kaise Banwayein' guide when user taps How to Get It", () => {
    renderComponent();

    const guideButtons = screen.getAllByRole("button", { name: /कैसे बनवाएं\?|How to Get It\?/i });
    expect(guideButtons.length).toBeGreaterThan(0);

    // Expand first document guide (Aadhaar or Khatauni)
    fireEvent.click(guideButtons[0]);

    // Should reveal step-by-step instructions and official portal details
    expect(screen.getByText(/आवेदन के मुख्य कदम:|Step-by-step Procedure:/i)).toBeInTheDocument();
  });

  it("allows updating profile fields via interactive mini-form", () => {
    renderComponent();

    // Tap on Farmer chip
    const farmerChip = screen.getByRole("button", { name: /किसान|Farmer/i });
    fireEvent.click(farmerChip);

    // Check stored profile in localStorage
    const saved = JSON.parse(localStorage.getItem(USER_PROFILE_STORAGE_KEY) || "{}");
    expect(saved.occupation).toContain("farmer");
  });

  it("renders cleanly in English when language is switched", async () => {
    localStorage.setItem("loksaathi_lang", "en");
    renderComponent();
    expect(await screen.findByText("Am I Eligible for this Scheme?")).toBeInTheDocument();
    expect(screen.getByText(/Exact Eligibility Audit/i)).toBeInTheDocument();
  });

  it("matches SSR HTML on initial pass even when localStorage already has a saved profile (no React #418 hydration mismatch)", () => {
    const emptyRender = renderToString(
      <LanguageProvider>
        <EligibilityChecker scheme={mockScheme} allSchemes={[mockScheme, mockAlternativeScheme]} />
      </LanguageProvider>
    );

    localStorage.setItem(
      USER_PROFILE_STORAGE_KEY,
      JSON.stringify({ state: "delhi", occupation: ["farmer"], land_owned_acres: 2 })
    );

    const populatedFirstPassRender = renderToString(
      <LanguageProvider>
        <EligibilityChecker scheme={mockScheme} allSchemes={[mockScheme, mockAlternativeScheme]} />
      </LanguageProvider>
    );

    expect(populatedFirstPassRender).toBe(emptyRender);
  });
});
