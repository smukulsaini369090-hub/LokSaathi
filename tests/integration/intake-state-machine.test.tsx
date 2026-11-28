import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { NextRequest } from "next/server";

// Do NOT mock @/lib/intake-state-machine so we test real state transitions!
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ success: true, remaining: 59 })),
}));

const mockGenerateContent = vi.fn();
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: mockGenerateContent,
      };
    }
  },
}));

describe("Phase 1 & 3: Multi-Turn Progressive Intake State Machine & Production Stability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Test Case A: Tapping 'Delhi NCR' triggers state disambiguation and NEVER dumps schemes", async () => {
    const { POST } = await import("@/app/api/voice-process/route");

    // Simulate even an aggressive LLM returning state: "delhi" + is_complete: true prematurely
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            profile_updates: { state: "delhi" },
            acknowledgment: "ठीक है",
            next_question: "आपकी योजनाएं तैयार हैं।",
            suggested_chips: [],
            is_complete: true,
          }),
      },
    });

    const req = new NextRequest("http://localhost/api/voice-process", {
      method: "POST",
      body: JSON.stringify({
        transcript: "दिल्ली (NCR)",
        language: "hi",
        user_profile: {},
      }),
      headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.needs_state_disambiguation).toBe(true);
    expect(body.extracted_profile_updates?.state).toBeUndefined();
    expect(body.merged_profile?.state).toBeUndefined();
    expect(body.is_profile_complete).toBe(false);
    expect(body.next_question).toMatch(/NCR|दिल्ली|हरियाणा|यूपी|निवास/i);
    expect(body.next_question).not.toContain("**");
    expect(body.suggested_chips.some((c: string) => /NCT|दिल्ली/i.test(c))).toBe(true);
    expect(body.suggested_chips.some((c: string) => /हरियाणा|Haryana/i.test(c))).toBe(true);
    expect(body.suggested_chips.some((c: string) => /यूपी|UP/i.test(c))).toBe(true);
  });

  it("Test Case B: Full 6-turn intake (Delhi -> 22 -> Male -> Student -> 1,50,000 -> OBC) collects step-by-step and emits precision student schemes only at completion", async () => {
    const { POST } = await import("@/app/api/voice-process/route");
    mockGenerateContent.mockRejectedValue(new Error("429 RESOURCE_EXHAUSTED"));

    let profile: Record<string, any> = {};

    const runTurn = async (transcript: string, extraBody: Record<string, any> = {}) => {
      const req = new NextRequest("http://localhost/api/voice-process", {
        method: "POST",
        body: JSON.stringify({
          transcript,
          language: "hi",
          user_profile: profile,
          ...extraBody,
        }),
        headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.5" },
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      profile = data.merged_profile || { ...profile, ...data.extracted_profile_updates };
      return data;
    };

    // Turn 1: Delhi (NCT)
    const t1 = await runTurn("दिल्ली (NCT)");
    expect(profile.state).toBe("delhi");
    expect(t1.is_profile_complete).toBe(false);
    expect(t1.next_question).toMatch(/उम्र|आयु|age/i);

    // Turn 2: 22
    const t2 = await runTurn("22");
    expect(profile.age).toBe(22);
    expect(t2.is_profile_complete).toBe(false);
    expect(t2.next_question).toMatch(/लिंग|महिला|पुरुष|gender/i);

    // Turn 3: Male
    const t3 = await runTurn("पुरुष (Male)");
    expect(profile.gender).toBe("male");
    expect(t3.is_profile_complete).toBe(false);
    expect(t3.next_question).toMatch(/कार्य|पेशा|पढ़ाई|occupation/i);

    // Turn 4: Student
    const t4 = await runTurn("छात्र / विद्यार्थी");
    expect(profile.occupation).toContain("student");
    expect(t4.is_profile_complete).toBe(false);
    expect(t4.next_question).toMatch(/आय|कमाई|income/i);

    // Turn 5: 1,50,000
    const t5 = await runTurn("1,50,000");
    expect(profile.annual_income_inr).toBe(150000);
    expect(t5.is_profile_complete).toBe(false);
    expect(t5.next_question).toMatch(/वर्ग|श्रेणी|OBC|SC|General|category/i);

    // Turn 6: OBC
    const t6 = await runTurn("OBC");
    expect(profile.category).toBe("obc");
    expect(t6.is_profile_complete).toBe(true);
    expect(Array.isArray(t6.matched_schemes)).toBe(true);
    expect(t6.matched_schemes.length).toBeGreaterThan(0);

    const matchedIds = t6.matched_schemes.map((m: any) => m.scheme.id);
    expect(matchedIds).toContain("national-scholarship-portal");
    expect(matchedIds[0]).toBe("national-scholarship-portal");
    expect(matchedIds).not.toContain("pm-kisan");
    expect(matchedIds).not.toContain("punjab-old-age-pension");
    expect(matchedIds).not.toContain("up-vridha-pension");
    expect(matchedIds).not.toContain("delhi-ladli-scheme");
    expect(matchedIds).not.toContain("delhi-mukhyamantri-tirth-yatra");
    expect(matchedIds).not.toContain("e-shram");
  });

  it("Test Case C: Multi-fact single prompt extracts all 4 facts and only asks remaining field before completing", async () => {
    const { POST } = await import("@/app/api/voice-process/route");
    mockGenerateContent.mockRejectedValue(new Error("503 Service Unavailable"));

    const req1 = new NextRequest("http://localhost/api/voice-process", {
      method: "POST",
      body: JSON.stringify({
        transcript: "Main 65 saal ka kisan hu Punjab se, income 80000",
        language: "hi",
        user_profile: {},
      }),
      headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.6" },
    });

    const body1 = await (await POST(req1)).json();
    expect(body1.merged_profile.age).toBe(65);
    expect(body1.merged_profile.occupation).toContain("farmer");
    expect(body1.merged_profile.state).toBe("punjab");
    expect(body1.merged_profile.annual_income_inr).toBe(80000);
    expect(body1.is_profile_complete).toBe(false);
    expect(body1.next_question).toMatch(/लिंग|महिला|पुरुष|gender/i);

    const req2 = new NextRequest("http://localhost/api/voice-process", {
      method: "POST",
      body: JSON.stringify({
        transcript: "Male",
        language: "hi",
        user_profile: body1.merged_profile,
      }),
      headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.6" },
    });
    const body2 = await (await POST(req2)).json();

    const req3 = new NextRequest("http://localhost/api/voice-process", {
      method: "POST",
      body: JSON.stringify({
        transcript: "General",
        language: "hi",
        user_profile: body2.merged_profile,
      }),
      headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.6" },
    });
    const body3 = await (await POST(req3)).json();

    expect(body3.is_profile_complete).toBe(true);
    const ids = body3.matched_schemes.map((m: any) => m.scheme.id);
    expect(ids).toContain("pm-kisan");
    expect(ids).not.toContain("up-vridha-pension");
    expect(ids).not.toContain("delhi-ladli-scheme");
  });

  it("Test Case D: Specific-scheme query locks onto PM-Kisan and asks only PM-Kisan criteria", async () => {
    const { POST } = await import("@/app/api/voice-process/route");
    mockGenerateContent.mockRejectedValue(new Error("429 quota exceeded"));

    const req1 = new NextRequest("http://localhost/api/voice-process", {
      method: "POST",
      body: JSON.stringify({
        transcript: "Kya main PM-Kisan ke liye eligible hoon?",
        language: "en",
        user_profile: {},
      }),
      headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.7" },
    });
    const body1 = await (await POST(req1)).json();
    expect(body1.target_scheme?.id).toBe("pm-kisan");
    expect(body1.eligibility_audit?.verdict).toBe("needs_more_info");
    expect(body1.is_profile_complete).toBe(false);
    expect(body1.next_question).toMatch(/farmer|land|occupation|PM-KISAN/i);
  });

  it("Test Case F: VoiceInterview UI ignores polluted localStorage, shows Progress Bar + Reset button, and never dumps schemes on Turn 1 'Delhi NCR'", async () => {
    localStorage.setItem(
      "loksaathi_user_profile",
      JSON.stringify({
        state: "up",
        age: 65,
        gender: "female",
        occupation: ["farmer"],
        annual_income_inr: 40000,
      })
    );

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transcript: "Delhi NCR",
        extracted_profile_updates: {},
        merged_profile: {},
        pending_fields: ["state", "age", "gender", "occupation", "annual_income_inr"],
        needs_state_disambiguation: true,
        potential_schemes_count: 35,
        next_question: "दिल्ली-एनसीआर में पात्रता आपके सही निवास राज्य पर निर्भर करती है।",
        suggested_chips: ["दिल्ली (NCT)", "हरियाणा NCR", "यूपी NCR"],
        is_profile_complete: false,
      }),
    });
    global.fetch = mockFetch as any;

    const onProfileComplete = vi.fn();
    const { VoiceInterview } = await import("@/components/VoiceInterview");
    render(<VoiceInterview language="hi" onProfileComplete={onProfileComplete} />);

    expect(screen.getByText(/प्रोफ़ाइल प्रगति|Profile Progress/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /नया शुरू करें|Start Fresh|Reset/i })).toBeInTheDocument();

    const ncrChip = screen.getByRole("button", { name: /दिल्ली.*NCR|Delhi.*NCR/i });
    fireEvent.click(ncrChip);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(onProfileComplete).not.toHaveBeenCalled();

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.user_profile).toEqual({});

    expect(await screen.findByRole("button", { name: /हरियाणा NCR/i })).toBeInTheDocument();
  });

  it("Test Case G: Start Fresh Reset clears polluted localStorage & restores full bilingual UI switching", async () => {
    localStorage.setItem(
      "loksaathi_user_profile",
      JSON.stringify({ state: "up", age: 40, gender: "male", occupation: ["farmer"] })
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transcript: "Delhi (NCT)",
        extracted_profile_updates: { state: "delhi" },
        merged_profile: { state: "delhi" },
        pending_fields: ["age", "gender", "occupation", "annual_income_inr", "category"],
        needs_state_disambiguation: false,
        potential_schemes_count: 14,
        next_question: "What is your age in years?",
        suggested_chips: ["18–25 yrs", "26–40 yrs"],
        is_profile_complete: false,
      }),
    });
    global.fetch = mockFetch as any;

    const { VoiceInterview } = await import("@/components/VoiceInterview");
    render(<VoiceInterview language="en" onProfileComplete={vi.fn()} />);

    expect(screen.getByText("Profile Progress")).toBeInTheDocument();
    const delhiChip = screen.getByRole("button", { name: /Delhi/i });
    fireEvent.click(delhiChip);

    expect(await screen.findByText(/14 potential schemes/i)).toBeInTheDocument();
    const resetBtn = screen.getByRole("button", { name: /Start Fresh/i });
    fireEvent.click(resetBtn);

    expect(localStorage.getItem("loksaathi_user_profile")).toBeNull();
    expect(screen.getByText("0 / 6")).toBeInTheDocument();
  });

  it("Test Case H: SchemeDetailClient deduplicates AntiDalalShield, CTAs, disclaimers & switches docs cleanly in English", async () => {
    localStorage.setItem("loksaathi_lang", "en");
    const { LanguageProvider } = await import("@/components/LanguageContext");
    const { SchemeDetailClient } = await import("@/components/SchemeDetailClient");
    const { Footer } = await import("@/components/Footer");

    const sampleScheme: any = {
      id: "pm-kisan",
      name: { hi: "पीएम किसान", en: "PM Kisan Samman Nidhi" },
      last_verified: "2026-11-24",
      source_url: "https://pmkisan.gov.in",
      apply_url: "https://pmkisan.gov.in",
      eligibility: { must_match_all: [], must_match_none: [] },
      benefit: { summary_hi: "₹6,000 प्रति वर्ष", summary_en: "₹6,000 per year" },
      documents_required: ["आधार कार्ड", "बैंक खाता पासबुक"],
      confidence: "verified",
    };

    render(
      <LanguageProvider>
        <SchemeDetailClient scheme={sampleScheme} allSchemes={[sampleScheme]} />
        <Footer />
      </LanguageProvider>
    );

    expect(await screen.findByText("Back to schemes")).toBeInTheDocument();
    expect(screen.getAllByText("Required Documents to Apply")).toHaveLength(1);
    expect(screen.getByText("Aadhaar Card")).toBeInTheDocument();
    expect(screen.getByText("Bank Account Passbook")).toBeInTheDocument();
    expect(screen.queryByText("आधार कार्ड")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Anti-Dalal Zero-Middleman Citizen Shield/i)).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /Open Official Portal/i })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /Find Nearest/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /Share/i })).toHaveLength(1);
    expect(screen.getAllByText(/independent.*citizen-assistive platform/i)).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /How to Get It\?/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: /Listen to scheme/i })).toBeInTheDocument();
  });

  it("Test Case I: Matcher & Evaluator safely handle null/malformed inputs and worker-to-construction_worker aliases", async () => {
    const { matchSchemes } = await import("@/lib/scheme-matcher");
    const { evaluateSchemeEligibility } = await import("@/lib/eligibility-evaluator");

    expect(matchSchemes(null as any, null as any)).toEqual([]);

    const delhiConstruction: any = {
      id: "delhi-labour-welfare",
      name: { hi: "श्रमिक योजना", en: "Delhi Construction Welfare" },
      last_verified: "2026-11-24",
      source_url: "https://bocw.delhi.gov.in",
      apply_url: "https://edistrict.delhigovt.nic.in",
      state: "delhi",
      eligibility: {
        must_match_all: [
          { field: "occupation", operator: "includes", value: ["construction_worker"] },
          { field: "age", operator: "gte", value: 18 },
        ],
        must_match_none: [],
      },
      benefit: { summary_hi: "लाभ", summary_en: "Benefit" },
      documents_required: [],
      confidence: "verified",
    };

    const matches = matchSchemes(
      { state: "delhi", occupation: ["worker"] as any, age: 30 },
      [delhiConstruction]
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].match_confidence).toBe("high");
    expect(matches[0].match_reason_en).toContain("Occupation:");

    const audit = evaluateSchemeEligibility(undefined, delhiConstruction, [delhiConstruction]);
    expect(audit.verdict).toBe("needs_more_info");
  });

  it("Test Case J: Middleware bypasses rate-limit on BYOK x-gemini-api-key and GET /api/schemes", async () => {
    const { middleware } = await import("@/middleware");
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockClear();

    const byokReq = new NextRequest("http://localhost/api/voice-process", {
      method: "POST",
      headers: { "x-gemini-api-key": "AIzaSyCustomUserKey123456789012345" },
    });
    const byokRes = await middleware(byokReq);
    expect(byokRes.status).toBe(200);
    expect(checkRateLimit).not.toHaveBeenCalled();

    const schemesReq = new NextRequest("http://localhost/api/schemes", { method: "GET" });
    const schemesRes = await middleware(schemesReq);
    expect(schemesRes.status).toBe(200);
    expect(checkRateLimit).not.toHaveBeenCalled();
  });
});
