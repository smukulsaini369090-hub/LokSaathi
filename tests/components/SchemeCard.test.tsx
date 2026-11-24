import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import type { SchemeMatch } from "@/lib/scheme-matcher";

vi.mock("@/lib/offline", () => ({
  isSchemeSaved: vi.fn(async () => false),
  saveScheme: vi.fn(async () => {}),
  removeScheme: vi.fn(async () => {}),
}));

const mockMatch: SchemeMatch = {
  scheme: {
    id: "pm-kisan",
    name: {
      hi: "प्रधानमंत्री किसान सम्मान निधि",
      en: "PM Kisan Samman Nidhi",
    },
    last_verified: "2026-11-24",
    source_url: "https://pmkisan.gov.in",
    eligibility: { must_match_all: [], must_match_none: [] },
    benefit: {
      summary_hi: "₹6,000 प्रति वर्ष",
      summary_en: "₹6,000 per year",
      amount_inr: 6000,
    },
    documents_required: ["आधार कार्ड", "बैंक पासबुक", "खतौनी"],
    apply_url: "https://pmkisan.gov.in/registrationform.aspx",
    confidence: "verified",
  },
  match_confidence: "high",
  match_reason_hi: "आप 2 एकड़ जमीन वाले किसान हैं।",
  match_reason_en: "You are a farmer owning 2 acres.",
  missing_fields: [],
};

describe("SchemeCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders scheme name, benefit summary and confidence badge in Hindi", async () => {
    const { SchemeCard } = await import("@/components/SchemeCard");
    render(<SchemeCard match={mockMatch} language="hi" />);

    expect(screen.getByText(/प्रधानमंत्री किसान सम्मान निधि/i)).toBeInTheDocument();
    expect(screen.getByText(/₹6,000 प्रति वर्ष/i)).toBeInTheDocument();
    expect(screen.getByText(/सत्यापित|Verified/i)).toBeInTheDocument();
  });

  it("renders required documents as badge chips", async () => {
    const { SchemeCard } = await import("@/components/SchemeCard");
    render(<SchemeCard match={mockMatch} language="hi" />);

    expect(screen.getByText("आधार कार्ड")).toBeInTheDocument();
    expect(screen.getByText("बैंक पासबुक")).toBeInTheDocument();
  });

  it("renders external apply link pointing to official portal with security attributes", async () => {
    const { SchemeCard } = await import("@/components/SchemeCard");
    render(<SchemeCard match={mockMatch} language="hi" />);

    const link = screen.getByRole("link", { name: /आवेदन करें|Apply/i });
    expect(link).toHaveAttribute(
      "href",
      "https://pmkisan.gov.in/registrationform.aspx"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("triggers onSave callback when bookmark button is clicked", async () => {
    const onSave = vi.fn();
    const { SchemeCard } = await import("@/components/SchemeCard");
    render(<SchemeCard match={mockMatch} language="hi" onSave={onSave} />);

    const saveBtn = screen.getByRole("button", { name: /सहेजें|save/i });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(mockMatch);
    });
  });

  it("renders audio Suno button for voice playback of scheme details", async () => {
    const { SchemeCard } = await import("@/components/SchemeCard");
    render(<SchemeCard match={mockMatch} language="hi" />);

    const listenBtn = screen.getByRole("button", { name: /सुनें|listen/i });
    expect(listenBtn).toBeInTheDocument();
  });
});
