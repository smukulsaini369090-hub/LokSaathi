import { describe, it, expect } from "vitest";
import { getDocumentGuide, getGenericDocumentGuide } from "@/lib/document-guides";

describe("Document Acquisition Guide Registry (lib/document-guides.ts)", () => {
  it("resolves state-specific income certificate guides", () => {
    const delhiGuide = getDocumentGuide("आय प्रमाण पत्र", "delhi");
    expect(delhiGuide.id).toBe("income-cert-delhi");
    expect(delhiGuide.portal_url).toContain("edistrict.delhigovt.nic.in");

    const haryanaGuide = getDocumentGuide("Income Certificate", "haryana");
    expect(haryanaGuide.id).toBe("income-cert-haryana");
    expect(haryanaGuide.portal_url).toContain("saralharyana.gov.in");

    const upGuide = getDocumentGuide("आय प्रमाण पत्र", "up");
    expect(upGuide.id).toBe("income-cert-up");
    expect(upGuide.portal_url).toContain("esathi.up.gov.in");

    const punjabGuide = getDocumentGuide("आय प्रमाण पत्र", "punjab");
    expect(punjabGuide.id).toBe("income-cert-punjab");
    expect(punjabGuide.portal_url).toContain("eservices.punjab.gov.in");

    const centralGuide = getDocumentGuide("Income Certificate", "central");
    expect(centralGuide.id).toBe("income-cert-central");
  });

  it("resolves state-specific domicile / residence certificate guides", () => {
    const delhiGuide = getDocumentGuide("निवास प्रमाण पत्र", "delhi");
    expect(delhiGuide.id).toBe("residence-cert-delhi");

    const haryanaGuide = getDocumentGuide("Haryana Resident Certificate (Domicile)", "haryana");
    expect(haryanaGuide.id).toBe("residence-cert-haryana");

    const upGuide = getDocumentGuide("मूल निवास प्रमाण पत्र", "up");
    expect(upGuide.id).toBe("residence-cert-up");

    const punjabGuide = getDocumentGuide("Punjab Residence Certificate", "punjab");
    expect(punjabGuide.id).toBe("residence-cert-punjab");
  });

  it("resolves land records (Khatauni / Jamabandi / Fard) guides", () => {
    const upLand = getDocumentGuide("भूमि के दस्तावेज (खतौनी/जमाबंदी)", "up");
    expect(upLand.id).toBe("land-records-up");
    expect(upLand.portal_url).toContain("upbhulekh.gov.in");

    const haryanaLand = getDocumentGuide("जमाबंदी नकल", "haryana");
    expect(haryanaLand.id).toBe("land-records-haryana");
    expect(haryanaLand.portal_url).toContain("jamabandi.nic.in");

    const punjabLand = getDocumentGuide("जमाबंदी फर्द (Punjab Fard)", "punjab");
    expect(punjabLand.id).toBe("land-records-punjab");
    expect(punjabLand.portal_url).toContain("plrs.org.in");
  });

  it("resolves DBT banking and Aadhaar seeding guides", () => {
    const dbtGuide = getDocumentGuide("बैंक खाता पासबुक (आधार सीडिंग अनिवार्य)");
    expect(dbtGuide.id).toBe("dbt-aadhaar-seeding");
    expect(dbtGuide.category).toBe("banking_dbt");
    expect(dbtGuide.offline_option.hi).toContain("डाकघर");
  });

  it("resolves Disability (UDID) card guides", () => {
    const udidGuide = getDocumentGuide("दिव्यांगता प्रमाण पत्र (UDID Card)");
    expect(udidGuide.id).toBe("udid-disability-card");
    expect(udidGuide.portal_url).toContain("swavlambancard.gov.in");
  });

  it("resolves Aadhaar update and identity guides", () => {
    const aadhaarGuide = getDocumentGuide("आधार कार्ड (Aadhaar Card)");
    expect(aadhaarGuide.id).toBe("aadhaar-update");
    expect(aadhaarGuide.portal_url).toContain("myaadhaar.uidai.gov.in");
  });

  it("falls back cleanly to generic government service guide for unknown documents", () => {
    const customDoc = getDocumentGuide("विशिष्ट प्रमाण पत्र (Custom Certificate)");
    expect(customDoc.id).toContain("generic");
    expect(customDoc.portal_url).toBe("https://services.india.gov.in");
    expect(customDoc.steps.hi.length).toBeGreaterThan(0);
  });
});
