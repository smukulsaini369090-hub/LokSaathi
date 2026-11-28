import { describe, it, expect } from "vitest";
import { loadAllSchemes, findSchemeByIdOrCode } from "@/lib/schemes-loader";
import {
  SCHEME_REDIRECTS,
  detectSchemeRedirect,
  getRedirectByLegacySlug,
} from "@/lib/scheme-redirects";
import { detectTargetScheme } from "@/lib/eligibility-evaluator";
import { runIntakeStateMachine } from "@/lib/intake-state-machine";
import { POST as schemeMatchPost } from "@/app/api/scheme-match/route";
import { NextRequest } from "next/server";

describe("Discontinued, Merged & Fake Scheme Redirect Registry", () => {
  const allSchemes = loadAllSchemes();

  it("loads all 519 unique schemes with valid replacement targets for every redirect rule", () => {
    expect(allSchemes.length).toBe(519);
    expect(SCHEME_REDIRECTS.length).toBeGreaterThanOrEqual(25);

    for (const rule of SCHEME_REDIRECTS) {
      for (const code of rule.replacement_codes) {
        const target = findSchemeByIdOrCode(code, allSchemes);
        expect(target, `Missing replacement scheme ${code} for redirect ${rule.id}`).toBeDefined();
      }
    }
  });

  it("redirects discontinued Delhi Ladli Scheme (2008) to Delhi Lakhpati Bitiya (DL-022)", () => {
    const r = detectSchemeRedirect("Delhi Ladli Scheme 2008 kaise apply kare");
    expect(r?.id).toBe("delhi-ladli-2008-discontinued");
    expect(r?.status).toBe("discontinued");
    expect(r?.replacement_codes).toContain("DL-022");

    const bySlug = getRedirectByLegacySlug("delhi-ladli-scheme");
    expect(bySlug?.id).toBe("delhi-ladli-2008-discontinued");

    const target = detectTargetScheme("Delhi Ladli Scheme 2008", allSchemes);
    expect(target?.scheme_code).toBe("DL-022");
  });

  it("redirects viral/fake Delhi Ladli Behna queries to Delhi Lakshmi Yojana (DL-021)", () => {
    const r = detectSchemeRedirect("Delhi Ladli Behna Yojana 2500 form");
    expect(r?.id).toBe("delhi-ladli-behna-fake-viral");
    expect(r?.status).toBe("fake_or_confused");
    expect(r?.replacement_codes).toContain("DL-021");

    const target = detectTargetScheme("Delhi Ladli Behna Yojana", allSchemes);
    expect(target?.scheme_code).toBe("DL-021");
  });

  it("redirects Mohalla Clinics to Ayushman Arogya Mandir Delhi (DL-015) and Ghar-Ghar Ration to DL-079", () => {
    expect(detectSchemeRedirect("Aam Aadmi Mohalla Clinic near me")?.replacement_codes).toContain("DL-015");
    expect(detectSchemeRedirect("Mukhyamantri Ghar-Ghar Ration Yojana Delhi")?.replacement_codes).toContain("DL-079");
  });

  it("handles Haryana, UP, Punjab & Central redirects accurately", () => {
    expect(detectSchemeRedirect("Old Haryana Ladli 2005")?.replacement_codes).toContain("HR-025");
    expect(detectSchemeRedirect("Samajwadi Pension Yojana UP")?.replacement_codes).toEqual(["UP-031", "UP-032", "UP-088"]);
    expect(detectSchemeRedirect("UP Kanya Vidya Dhan")?.replacement_codes).toContain("UP-022");
    expect(detectSchemeRedirect("UP Free Laptop 2012")?.replacement_codes).toContain("UP-003");
    expect(detectSchemeRedirect("Punjab Shagun Scheme")?.replacement_codes).toContain("PB-020");
    expect(detectSchemeRedirect("BPSSBY Punjab")?.replacement_codes).toContain("PB-011");
    expect(detectSchemeRedirect("Captain Smart Connect")?.status).toBe("discontinued");
    expect(detectSchemeRedirect("Old 200 unit free power Punjab")?.replacement_codes).toContain("PB-073");
    expect(detectSchemeRedirect("FAME-II electric scooter subsidy")?.replacement_codes).toContain("IN-091");
    expect(detectSchemeRedirect("MANF fellowship minority")?.status).toBe("discontinued");
    expect(detectSchemeRedirect("Seekho Aur Kamao minority")?.replacement_codes).toContain("IN-080");
    expect(detectSchemeRedirect("PMAY-U 1.0 CLSS interest subsidy")?.replacement_codes).toContain("IN-055");
    expect(detectSchemeRedirect("PMVVY senior citizen")?.status).toBe("discontinued");
    expect(detectSchemeRedirect("Jai Bhim Mukhyamantri Pratibha Vikas Yojana")?.status).toBe("verify_latest_notification");
    expect(detectSchemeRedirect("Farishtey Dilli Ke")?.status).toBe("verify_latest_notification");
    expect(detectSchemeRedirect("1076 Doorstep Delivery Delhi")?.status).toBe("verify_latest_notification");
    expect(detectSchemeRedirect("Manual BPL Haryana")?.replacement_codes).toEqual(["HR-032", "HR-104"]);
    expect(detectSchemeRedirect("Pre-2021 Haryana Scholarship portal")?.replacement_codes).toContain("HR-012");
    expect(detectSchemeRedirect("Lado Lakshmi split payout")?.replacement_codes).toEqual(["HR-023"]);
    expect(detectSchemeRedirect("UP Berozgari Bhatta 2012")?.replacement_codes).toEqual(["UP-056", "UP-004", "UP-060"]);
    expect(detectSchemeRedirect("1000 women punjab")?.status).toBe("verify_latest_notification");
    expect(detectSchemeRedirect("Padho Pardesh")?.status).toBe("discontinued");
    expect(detectSchemeRedirect("USTTAD")?.replacement_codes).toContain("IN-080");
    expect(detectSchemeRedirect("Hamari Dharohar")?.replacement_codes).toContain("IN-080");
    expect(detectSchemeRedirect("Nai Roshni")?.replacement_codes).toContain("IN-080");
    expect(detectSchemeRedirect("Nai Manzil")?.replacement_codes).toContain("IN-080");
    expect(detectSchemeRedirect("MSSC")?.replacement_codes).toContain("IN-027");
  });

  it("surfaces scheme_redirect alert inside conversational intake state machine and /api/scheme-match", async () => {
    const stateOut = runIntakeStateMachine({
      userMessage: "Delhi Ladli Behna Yojana ke paise kab milenge?",
      currentProfile: {},
      allSchemes,
      language: "hi",
    });

    expect(stateOut.scheme_redirect?.id).toBe("delhi-ladli-behna-fake-viral");
    expect(stateOut.target_scheme?.scheme_code).toBe("DL-021");
    expect(stateOut.next_question).toContain("DL-021");

    const req = new NextRequest("http://localhost:3000/api/scheme-match", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-loksaathi-ratelimited": "1" },
      body: JSON.stringify({
        user_profile: { state: "up", age: 65, gender: "male", occupation: ["senior_citizen"], annual_income_inr: 35000 },
        query: "Samajwadi Pension Yojana",
        language: "en",
      }),
    });
    const res = await schemeMatchPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.scheme_redirect?.id).toBe("up-samajwadi-pension-discontinued");
    expect(json.target_scheme?.scheme_code).toBe("UP-031");
  });
});
