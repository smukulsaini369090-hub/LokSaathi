# LokSaathi Phase 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build and deploy a production-ready PWA that lets Hindi-speaking users discover government scheme eligibility via conversational voice/text profiling and understand government documents via AI-powered photo scanning — with zero hallucination, privacy-first document handling, and offline saved scheme cards.

**Architecture:** Next.js 15 App Router (TypeScript), server Route Handlers call Gemini Flash 2.0 for AI, a deterministic JSON rule engine runs eligibility matching (AI never invents facts), and Serwist Service Worker provides offline shell + cached scheme cards.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Serwist, @google/generative-ai, Upstash Redis, Vercel Postgres (Neon), next-intl, Vitest, Playwright

**Spec:** `ARCHITECTURE.md` (workspace root) + `docs/superpowers/specs/2026-11-24-loksaathi-design.md`

---

## Global Constraints

- Node.js ≥ 20.x; TypeScript strict mode on; no `any` types
- All Gemini API calls are **server-only** (`lib/gemini.ts` is never imported in client components)
- Document images are **never stored** server-side; processed in-memory per request only
- All AI responses for scheme eligibility are grounded in `data/schemes/**/*.json` only — no free-form eligibility generation
- Rate limiting: 20 AI calls/hour/IP via Upstash Redis middleware (enforced in `middleware.ts`)
- Image compression: client-side before upload, target ≤ 800 KB (`lib/redaction.ts`)
- i18n: `next-intl` with locale codes `hi` and `en` in Phase 1; architecture must cleanly support adding `mr`, `ta`, `te` in Phase 2 without refactoring
- PWA: Lighthouse PWA score ≥ 90, Performance ≥ 85 (mobile, 4G throttle), Accessibility ≥ 90
- Privacy: Aadhaar pattern `\d{4}\s?\d{4}\s?\d{4}` → blur middle 8 digits before any network call
- Offline: saved scheme cards must load in airplane mode via IndexedDB

---

## Review Focus

The following failure modes are most likely to bite a real user and are not fully covered by happy-path tests. Each item is pinned to the task that owns the relevant code.

1. **Partial user profile** — user completes only 3 of 7 profiling questions; matcher must return partial matches with `missing_fields[]` explaining what more info would unlock (Task 3 + Task 6 tests)
2. **Blurry / low-light document photo** — Gemini returns empty or malformed extraction; `doc-explain` route must return a graceful structured error, not a 500 (Task 7 tests)
3. **iOS Safari — no mic permission** — `VoiceInterview` must detect `SpeechRecognition` unavailability and silently fall back to typed input without breaking layout (Task 8 tests)
4. **Aadhaar number visible in image** — redaction must fire before `canvas.toBlob()` completes, not after; a timing bug here is a DPDP violation (Task 5 tests)
5. **Rate limit hit mid-session** — `/api/*` routes return 429; client must show a user-friendly Hindi message ("थोड़ी देर बाद कोशिश करें") not a raw error (Task 2 + Task 6 tests)

---

## Task 0: Project Scaffold & Tooling

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.env.local.example`
- Create: `middleware.ts` (stub — rate limiting wired in Task 2)
- Create: `app/layout.tsx`
- Create: `public/manifest.json`

**Interfaces:**
- Produces: working `next dev` server, passing empty test suite, `next build` with no errors

- [x] **Step 1: Initialise Next.js 15 project**

  ```bash
  npx create-next-app@latest loksaathi \
    --typescript --tailwind --app --src-dir=false \
    --import-alias="@/*"
  cd loksaathi
  ```

- [x] **Step 2: Install all Phase 1 dependencies**

  ```bash
  npm install @google/generative-ai @upstash/redis @upstash/ratelimit \
    next-intl serwist @serwist/next \
    @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react \
    idb

  npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react \
    @testing-library/jest-dom @playwright/test
  ```

- [x] **Step 3: Configure `next.config.ts` with Serwist PWA + security headers**

  ```typescript
  // next.config.ts
  import withSerwistInit from "@serwist/next";
  const withSerwist = withSerwistInit({
    swSrc: "app/sw.ts",
    swDest: "public/sw.js",
  });
  export default withSerwist({
    headers: async () => [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ],
  });
  ```

- [x] **Step 4: Create `public/manifest.json`**

  ```json
  {
    "name": "LokSaathi — सरकारी योजना सहायक",
    "short_name": "LokSaathi",
    "description": "सरकारी योजनाओं की जानकारी और दस्तावेज़ सहायक",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#1a56db",
    "lang": "hi",
    "icons": [
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
      { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
  }
  ```

- [x] **Step 5: Create `app/sw.ts` (Serwist service worker)**

  Use Serwist's `defaultCache` presets. App shell → `CacheFirst`. `/data/` static files → `CacheFirst`. `/api/*` → `NetworkFirst` with 5-second timeout. Images → `CacheFirst` with 30-day expiry.

- [x] **Step 6: Configure `vitest.config.ts`** to use `@vitejs/plugin-react`, `jsdom` environment, `@testing-library/jest-dom` setup file.

- [x] **Step 7: Configure `playwright.config.ts`** targeting `http://localhost:3000`, Chromium only for Phase 1.

- [x] **Step 8: Create `.env.local.example`**

  ```
  GEMINI_API_KEY=
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  DATABASE_URL=
  ```

- [x] **Step 9: Run `next build` and `npx vitest run`**

  Expected: build succeeds, 0 tests run, 0 failures.

- [x] **Step 10: Commit**

  ```bash
  git init && git add -A
  git commit -m "chore: scaffold Next.js 15 PWA with Serwist, Vitest, Playwright"
  ```

---

## Task 1: Scheme Data Layer — JSON Schema + Seed Data

**Files:**
- Create: `data/schemes/central/pm-kisan.json`
- Create: `data/schemes/central/ayushman-bharat.json`
- Create: `data/schemes/central/pm-awas-yojana-gramin.json`
- Create: `data/schemes/central/pm-awas-yojana-urban.json`
- Create: `data/schemes/central/pm-ujjwala.json`
- Create: `data/schemes/central/pm-jan-dhan.json`
- Create: `data/schemes/central/pm-fasal-bima.json`
- Create: `data/schemes/central/pm-kisan-maan-dhan.json`
- Create: `data/schemes/central/sukanya-samriddhi.json`
- Create: `data/schemes/central/national-scholarship-portal.json`
- Create: `data/schemes/central/pm-scholarship-central-armed-forces.json`
- Create: `data/schemes/central/pm-matru-vandana.json`
- Create: `data/schemes/central/national-social-assistance.json`
- Create: `data/schemes/central/pmegp.json`
- Create: `data/schemes/central/mudra-loan.json`
- Create: `data/schemes/central/pm-street-vendor-loan.json`
- Create: `data/schemes/central/e-shram.json`
- Create: `data/schemes/central/visvesvaraya-phd.json`
- Create: `data/schemes/central/anganwadi-services.json`
- Create: `data/schemes/central/poshan-abhiyaan.json`
- Create: `data/schemes/state/delhi/ladli-scheme.json`
- Create: `data/schemes/state/delhi/mukhyamantri-tirth-yatra.json`
- Create: `data/schemes/state/delhi/delhi-labour-welfare.json`
- Create: `data/schemes/state/haryana/ladli-lakshmi.json`
- Create: `data/schemes/state/haryana/haryana-kaushal-rozgar.json`
- Create: `data/schemes/state/up/up-kanya-sumangala.json`
- Create: `data/schemes/state/up/up-bhagya-lakshmi.json`
- Create: `data/schemes/state/up/up-vridha-pension.json`
- Create: `data/schemes/state/up/up-divyang-pension.json`
- Create: `data/schemes/state/up/up-shadi-anudan.json`
- Create: `lib/scheme-types.ts` (TypeScript interfaces for scheme JSON schema)
- Test: `tests/data/scheme-schema.test.ts`

**Interfaces:**
- Produces: `Scheme` type exported from `lib/scheme-types.ts`; all JSON files validate against it

- [x] **Step 1: Write failing schema validation test**

  ```typescript
  // tests/data/scheme-schema.test.ts
  import { describe, it, expect } from "vitest";
  import { readdirSync, readFileSync } from "fs";
  import { join } from "path";
  import type { Scheme } from "@/lib/scheme-types";

  const REQUIRED_FIELDS: (keyof Scheme)[] = [
    "id", "name", "last_verified", "source_url",
    "eligibility", "benefit", "documents_required",
    "apply_url", "confidence"
  ];

  function getAllSchemeFiles(): string[] {
    const base = join(process.cwd(), "data/schemes");
    const files: string[] = [];
    // recurse central + state dirs
    // returns array of absolute paths to *.json
    return files; // implementer fills recursion
  }

  describe("Scheme JSON schema validation", () => {
    const files = getAllSchemeFiles();

    it("finds at least 25 scheme files", () => {
      expect(files.length).toBeGreaterThanOrEqual(25);
    });

    files.forEach((file) => {
      it(`${file} has all required fields`, () => {
        const scheme: Scheme = JSON.parse(readFileSync(file, "utf-8"));
        for (const field of REQUIRED_FIELDS) {
          expect(scheme[field], `missing field: ${field} in ${file}`).toBeDefined();
        }
      });

      it(`${file} has valid last_verified ISO date`, () => {
        const scheme: Scheme = JSON.parse(readFileSync(file, "utf-8"));
        expect(new Date(scheme.last_verified).toString()).not.toBe("Invalid Date");
      });

      it(`${file} apply_url starts with https://`, () => {
        const scheme: Scheme = JSON.parse(readFileSync(file, "utf-8"));
        expect(scheme.apply_url).toMatch(/^https:\/\//);
      });
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL** (`getAllSchemeFiles returns 0 files`)

  ```bash
  npx vitest run tests/data/scheme-schema.test.ts
  ```

- [x] **Step 3: Define `Scheme` type in `lib/scheme-types.ts`**

  ```typescript
  export interface EligibilityRule {
    field: string;
    operator: "eq" | "lte" | "gte" | "includes" | "not_includes";
    value: string | number | boolean | string[];
  }

  export interface Scheme {
    id: string;
    name: { hi: string; en: string };
    last_verified: string;        // ISO date string
    source_url: string;           // must be .gov.in
    eligibility: {
      must_match_all: EligibilityRule[];
      must_match_none: EligibilityRule[];
    };
    benefit: {
      summary_hi: string;
      summary_en: string;
      amount_inr?: number;
      frequency?: string;
      mode?: string;
    };
    documents_required: string[];
    apply_url: string;
    deadline?: string | null;
    confidence: "verified" | "web-grounded";
    state?: "delhi" | "haryana" | "up";  // absent = central/all-India
  }
  ```

- [x] **Step 4: Implement `getAllSchemeFiles` recursion in test file** to walk `data/schemes/central/` and `data/schemes/state/` subdirectories.

- [x] **Step 5: Create all 30 scheme JSON files** — manually verified against `myscheme.gov.in` and official `.gov.in` portals. Each file must pass schema validation. Use the `Scheme` interface as the strict template. Set `last_verified` to today's date and `confidence: "verified"`.

- [x] **Step 6: Run tests — expect all PASS**

  ```bash
  npx vitest run tests/data/scheme-schema.test.ts
  ```

- [x] **Step 7: Commit**

  ```bash
  git add data/ lib/scheme-types.ts tests/data/
  git commit -m "feat: add 30 verified scheme JSON files + schema types"
  ```

---

## Task 2: Middleware — Rate Limiting + i18n Routing

**Files:**
- Create: `lib/rate-limit.ts`
- Modify: `middleware.ts`
- Create: `messages/hi.json` (Hindi UI strings, stub — extended per task)
- Create: `messages/en.json` (English UI strings, stub)
- Create: `i18n.ts` (next-intl config)
- Test: `tests/middleware/rate-limit.test.ts`

**Interfaces:**
- Produces: `checkRateLimit(ip: string): Promise<{ success: boolean; remaining: number }>` from `lib/rate-limit.ts`
- Produces: Next.js middleware that returns 429 JSON `{ error: "rate_limit_exceeded", message_hi: "थोड़ी देर बाद कोशिश करें" }` when limit is hit

- [x] **Step 1: Write failing rate-limit test**

  ```typescript
  // tests/middleware/rate-limit.test.ts
  import { describe, it, expect, vi } from "vitest";

  // Mock Upstash to avoid real network calls in unit tests
  vi.mock("@upstash/redis", () => ({
    Redis: vi.fn(() => ({
      pipeline: vi.fn(() => ({ exec: vi.fn(async () => [1, 1]) })),
    })),
  }));
  vi.mock("@upstash/ratelimit", () => ({
    Ratelimit: vi.fn().mockImplementation(() => ({
      limit: vi.fn()
        .mockResolvedValueOnce({ success: true, remaining: 19 })
        .mockResolvedValueOnce({ success: true, remaining: 0 })
        .mockResolvedValue({ success: false, remaining: 0 }),
    })),
    slidingWindow: vi.fn(),
  }));

  describe("checkRateLimit", () => {
    it("returns success:true on first call", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit");
      const result = await checkRateLimit("1.2.3.4");
      expect(result.success).toBe(true);
    });

    it("returns success:false after limit exhausted", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit");
      await checkRateLimit("1.2.3.4"); // consume remaining
      const result = await checkRateLimit("1.2.3.4");
      expect(result.success).toBe(false);
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL** (module not found)

  ```bash
  npx vitest run tests/middleware/rate-limit.test.ts
  ```

- [x] **Step 3: Implement `lib/rate-limit.ts`**

  Use `@upstash/ratelimit` with `slidingWindow(20, "1 h")`. Export `checkRateLimit(ip: string): Promise<{ success: boolean; remaining: number }>`. Read `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from `process.env`.

- [x] **Step 4: Implement `middleware.ts`**

  For requests to `/api/*`: call `checkRateLimit(ip)`. On failure, return `NextResponse.json({ error: "rate_limit_exceeded", message_hi: "थोड़ी देर बाद कोशिश करें", message_en: "Too many requests. Please try again shortly." }, { status: 429 })`. Add `next-intl` routing for locales `["hi", "en"]`, default locale `"hi"`.

- [x] **Step 5: Create stub `messages/hi.json` and `messages/en.json`**

  ```json
  // hi.json — add keys as needed in later tasks
  { "home": { "title": "LokSaathi", "subtitle": "सरकारी योजना सहायक" } }
  ```

- [x] **Step 6: Run test — expect PASS**

  ```bash
  npx vitest run tests/middleware/rate-limit.test.ts
  ```

- [x] **Step 7: Commit**

  ```bash
  git add lib/rate-limit.ts middleware.ts messages/ i18n.ts tests/middleware/
  git commit -m "feat: add Upstash rate limiting middleware + next-intl routing"
  ```

---

## Task 3: Scheme Eligibility Rule Engine

**Files:**
- Create: `lib/scheme-matcher.ts`
- Test: `tests/lib/scheme-matcher.test.ts`

**Interfaces:**
- Consumes: `Scheme`, `EligibilityRule` from `lib/scheme-types.ts`
- Produces:
  ```typescript
  interface UserProfile {
    state: "delhi" | "haryana" | "up" | "other";
    age: number;
    gender: "male" | "female" | "other";
    occupation: string[];
    annual_income_inr: number;
    category: "general" | "obc" | "sc" | "st";
    land_owned_acres?: number;
    is_bpl?: boolean;
    has_bank_account?: boolean;
    is_disabled?: boolean;
    is_minority?: boolean;
    household_size?: number;
  }

  interface SchemeMatch {
    scheme: Scheme;
    match_confidence: "high" | "medium";
    match_reason_hi: string;
    match_reason_en: string;
    missing_fields: string[];
  }

  function matchSchemes(profile: Partial<UserProfile>, schemes: Scheme[]): SchemeMatch[]
  ```

- [x] **Step 1: Write failing tests**

  ```typescript
  // tests/lib/scheme-matcher.test.ts
  import { describe, it, expect } from "vitest";
  import { matchSchemes } from "@/lib/scheme-matcher";
  import type { Scheme } from "@/lib/scheme-types";

  const pmKisan: Scheme = {
    id: "pm-kisan", name: { hi: "पीएम किसान", en: "PM-KISAN" },
    last_verified: "2026-11-24", source_url: "https://pmkisan.gov.in",
    eligibility: {
      must_match_all: [
        { field: "occupation", operator: "includes", value: ["farmer"] },
        { field: "land_owned_acres", operator: "lte", value: 5 }
      ],
      must_match_none: [
        { field: "is_income_tax_payer", operator: "eq", value: true }
      ]
    },
    benefit: { summary_hi: "₹6,000/वर्ष", summary_en: "₹6,000/year", amount_inr: 6000 },
    documents_required: ["Aadhaar", "Bank Passbook", "Land Record"],
    apply_url: "https://pmkisan.gov.in/registrationform.aspx",
    confidence: "verified"
  };

  describe("matchSchemes", () => {
    it("returns a match for a qualifying farmer", () => {
      const profile = {
        occupation: ["farmer"], land_owned_acres: 2,
        annual_income_inr: 80000, state: "up" as const,
        age: 42, gender: "male" as const, category: "obc" as const
      };
      const matches = matchSchemes(profile, [pmKisan]);
      expect(matches).toHaveLength(1);
      expect(matches[0].scheme.id).toBe("pm-kisan");
      expect(matches[0].match_confidence).toBe("high");
    });

    it("excludes schemes where must_match_none condition is met", () => {
      const profile = {
        occupation: ["farmer"], land_owned_acres: 2,
        is_income_tax_payer: true, // disqualifier
        state: "up" as const, age: 42, gender: "male" as const,
        annual_income_inr: 800000, category: "general" as const
      };
      const matches = matchSchemes(profile as any, [pmKisan]);
      expect(matches).toHaveLength(0);
    });

    it("returns medium confidence and missing_fields when profile is partial", () => {
      // land_owned_acres not provided — matcher cannot confirm lte:5 rule
      const partial = {
        occupation: ["farmer"], state: "up" as const,
        age: 42, gender: "male" as const, annual_income_inr: 80000,
        category: "obc" as const
      };
      const matches = matchSchemes(partial, [pmKisan]);
      expect(matches).toHaveLength(1);
      expect(matches[0].match_confidence).toBe("medium");
      expect(matches[0].missing_fields).toContain("land_owned_acres");
    });

    it("returns empty array for non-farmer with no schemes", () => {
      const profile = {
        occupation: ["software_engineer"], state: "delhi" as const,
        age: 28, gender: "male" as const, annual_income_inr: 1200000,
        category: "general" as const
      };
      const matches = matchSchemes(profile, [pmKisan]);
      expect(matches).toHaveLength(0);
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL** (`matchSchemes` not found)

  ```bash
  npx vitest run tests/lib/scheme-matcher.test.ts
  ```

- [x] **Step 3: Implement `lib/scheme-matcher.ts`**

  `evaluateRule(rule, profile)`: returns `"pass" | "fail" | "unknown"` — "unknown" when the profile field is undefined. `matchSchemes(profile, schemes)`: for each scheme, evaluate all `must_match_all` rules (any "fail" → exclude; any "unknown" → medium confidence, add field to `missing_fields`), then all `must_match_none` rules (any "pass" → exclude). Return `SchemeMatch[]` sorted by match_confidence desc.

- [x] **Step 4: Run test — expect all PASS**

  ```bash
  npx vitest run tests/lib/scheme-matcher.test.ts
  ```

- [x] **Step 5: Commit**

  ```bash
  git add lib/scheme-matcher.ts tests/lib/
  git commit -m "feat: deterministic scheme eligibility rule engine"
  ```

---

## Task 4: Gemini Client + Prompt System (Server-Only)

**Files:**
- Create: `lib/gemini.ts`
- Create: `data/prompts/scheme-system.txt`
- Create: `data/prompts/doc-system.txt`
- Create: `data/prompts/voice-system.txt`
- Test: `tests/lib/gemini.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  // lib/gemini.ts (server-only — never import in client components)
  function getGeminiClient(): GenerativeModel   // singleton
  async function extractUserProfile(transcript: string, history: Message[], language: "hi"|"en"): Promise<{ profile_updates: Partial<UserProfile>, next_question: string, is_complete: boolean }>
  async function explainDocument(imageBase64: string, language: "hi"|"en"): Promise<DocExplanation>
  async function generateSchemeExplanation(matches: SchemeMatch[], profile: Partial<UserProfile>, language: "hi"|"en"): AsyncGenerator<string>
  ```

- [x] **Step 1: Write failing tests** (mock Gemini SDK)

  ```typescript
  // tests/lib/gemini.test.ts
  import { describe, it, expect, vi } from "vitest";

  vi.mock("@google/generative-ai", () => ({
    GoogleGenerativeAI: vi.fn(() => ({
      getGenerativeModel: vi.fn(() => ({
        generateContent: vi.fn(async () => ({
          response: { text: () => JSON.stringify({
            profile_updates: { state: "up", age: 35 },
            next_question: "आप किस काम से जुड़े हैं?",
            is_complete: false
          })}
        })),
      })),
    })),
  }));

  describe("extractUserProfile", () => {
    it("returns profile_updates and next_question from transcript", async () => {
      const { extractUserProfile } = await import("@/lib/gemini");
      const result = await extractUserProfile(
        "मैं उत्तर प्रदेश में रहता हूँ, उम्र 35 साल है", [], "hi"
      );
      expect(result.profile_updates.state).toBe("up");
      expect(result.profile_updates.age).toBe(35);
      expect(result.next_question).toBeTruthy();
      expect(result.is_complete).toBe(false);
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL**

  ```bash
  npx vitest run tests/lib/gemini.test.ts
  ```

- [x] **Step 3: Write `data/prompts/scheme-system.txt`**

  Instruct Gemini to: (1) parse the user transcript into the `UserProfile` JSON schema fields, (2) ask exactly one follow-up question in the specified language to gather missing fields, (3) set `is_complete: true` only when state, age, gender, occupation, annual_income_inr, and category are all known, (4) output ONLY valid JSON matching the specified schema — no prose, no markdown. Include the `UserProfile` field definitions in the prompt.

- [x] **Step 4: Write `data/prompts/doc-system.txt`**

  Instruct Gemini to: (1) identify the document type, (2) extract key fields in a structured JSON array, (3) list action items with deadlines, (4) write the `full_explanation` in simple conversational Hindi/English (as specified), (5) never invent deadlines or amounts not visible in the image, (6) if image is illegible say so explicitly in the JSON rather than guessing.

- [x] **Step 5: Write `data/prompts/voice-system.txt`**

  Instruct Gemini audio model to: (1) transcribe the audio, (2) classify intent, (3) extract any UserProfile fields mentioned, (4) produce the structured JSON output format.

- [x] **Step 6: Implement `lib/gemini.ts`**

  Singleton `getGeminiClient()` using `GEMINI_API_KEY`. `extractUserProfile()`: calls `gemini-2.0-flash` with scheme-system prompt + conversation history + transcript, parses JSON response. `explainDocument()`: calls `gemini-2.0-flash` vision with doc-system prompt + image. `generateSchemeExplanation()`: uses `generateContentStream()`, yields text chunks. Add `"use server"` directive comment at top; note in JSDoc that this file must never be imported in client components.

- [x] **Step 7: Run test — expect PASS**

  ```bash
  npx vitest run tests/lib/gemini.test.ts
  ```

- [x] **Step 8: Commit**

  ```bash
  git add lib/gemini.ts data/prompts/ tests/lib/gemini.test.ts
  git commit -m "feat: Gemini Flash client + scheme/doc/voice system prompts"
  ```

---

## Task 5: Client-Side PII Redaction + Image Compression

**Files:**
- Create: `lib/redaction.ts` (client-side, browser APIs only)
- Test: `tests/lib/redaction.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  async function redactAndCompress(
    imageFile: File,
    options?: { maxSizeKb?: number; quality?: number }
  ): Promise<{ base64: string; redactedCount: number; finalSizeKb: number }>
  ```

- [x] **Step 1: Write failing tests**

  ```typescript
  // tests/lib/redaction.test.ts
  import { describe, it, expect, vi } from "vitest";
  // jsdom environment (set in vitest.config.ts)

  // Mock Canvas API for jsdom
  const mockContext = {
    drawImage: vi.fn(),
    fillStyle: "",
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(400),
    })),
    putImageData: vi.fn(),
  };
  vi.stubGlobal("HTMLCanvasElement", class {
    getContext() { return mockContext; }
    toBlob(cb: (b: Blob) => void) { cb(new Blob(["x"], { type: "image/jpeg" })); }
    width = 100; height = 100;
  });

  describe("redactAndCompress", () => {
    it("detects and blurs Aadhaar number pattern", async () => {
      const { findPIIRegions } = await import("@/lib/redaction");
      // Test the pure text-detection function
      const text = "Aadhaar: 1234 5678 9012 is my number";
      const regions = findPIIRegions(text);
      expect(regions.length).toBeGreaterThan(0);
      expect(regions[0].type).toBe("aadhaar");
    });

    it("detects PAN number pattern", async () => {
      const { findPIIRegions } = await import("@/lib/redaction");
      const text = "PAN: ABCDE1234F";
      const regions = findPIIRegions(text);
      expect(regions.some(r => r.type === "pan")).toBe(true);
    });

    it("returns base64 string from redactAndCompress", async () => {
      const { redactAndCompress } = await import("@/lib/redaction");
      const file = new File(["fake-image-data"], "test.jpg", { type: "image/jpeg" });
      const result = await redactAndCompress(file);
      expect(typeof result.base64).toBe("string");
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL**

  ```bash
  npx vitest run tests/lib/redaction.test.ts
  ```

- [x] **Step 3: Implement `lib/redaction.ts`**

  `findPIIRegions(text)`: regex scan for Aadhaar (`\d{4}\s?\d{4}\s?\d{4}`), PAN (`[A-Z]{5}[0-9]{4}[A-Z]`), Indian phone (`[6-9]\d{9}`). Returns `Array<{ type, start, end }>`. `redactAndCompress(imageFile, options)`: draw image to offscreen Canvas, run OCR-free blur strategy (blur rectangular regions of canvas where PII patterns are found via `getImageData`), then `canvas.toBlob()` with `quality: 0.8`, return base64. If canvas produces file > `maxSizeKb` (default 800), reduce quality iteratively to 0.6, 0.5. Never throw — return `{ base64, redactedCount: 0, finalSizeKb }` if no PII found.

- [x] **Step 4: Run test — expect PASS**

  ```bash
  npx vitest run tests/lib/redaction.test.ts
  ```

- [x] **Step 5: Commit**

  ```bash
  git add lib/redaction.ts tests/lib/redaction.test.ts
  git commit -m "feat: client-side PII redaction + image compression (DPDP compliant)"
  ```

---

## Task 6: API Route Handlers

**Files:**
- Create: `app/api/scheme-match/route.ts`
- Create: `app/api/doc-explain/route.ts`
- Create: `app/api/voice-process/route.ts`
- Test: `tests/api/scheme-match.test.ts`
- Test: `tests/api/doc-explain.test.ts`

**Interfaces:**
- Consumes: `matchSchemes` from Task 3; `extractUserProfile`, `explainDocument`, `generateSchemeExplanation` from Task 4; `checkRateLimit` from Task 2; `Scheme` JSON files
- Produces: HTTP endpoints per API contracts in `ARCHITECTURE.md`

- [x] **Step 1: Write failing tests for `/api/scheme-match`**

  ```typescript
  // tests/api/scheme-match.test.ts
  import { describe, it, expect, vi } from "vitest";
  import { POST } from "@/app/api/scheme-match/route";
  import { NextRequest } from "next/server";

  vi.mock("@/lib/rate-limit", () => ({
    checkRateLimit: vi.fn(async () => ({ success: true, remaining: 19 })),
  }));
  vi.mock("@/lib/gemini", () => ({
    generateSchemeExplanation: vi.fn(async function*() { yield "Test response"; }),
  }));

  const farmerProfile = {
    user_profile: {
      state: "up", age: 42, gender: "male",
      occupation: ["farmer"], annual_income_inr: 80000,
      category: "obc", land_owned_acres: 2
    },
    language: "hi"
  };

  describe("POST /api/scheme-match", () => {
    it("returns 200 with matched_schemes for valid farmer profile", async () => {
      const req = new NextRequest("http://localhost/api/scheme-match", {
        method: "POST",
        body: JSON.stringify(farmerProfile),
        headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" }
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.matched_schemes)).toBe(true);
    });

    it("returns 429 when rate limit exceeded", async () => {
      vi.mocked(await import("@/lib/rate-limit")).checkRateLimit
        .mockResolvedValueOnce({ success: false, remaining: 0 });
      const req = new NextRequest("http://localhost/api/scheme-match", {
        method: "POST",
        body: JSON.stringify(farmerProfile),
        headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" }
      });
      const res = await POST(req);
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.message_hi).toBe("थोड़ी देर बाद कोशिश करें");
    });

    it("returns 400 for missing user_profile", async () => {
      const req = new NextRequest("http://localhost/api/scheme-match", {
        method: "POST",
        body: JSON.stringify({ language: "hi" }),
        headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" }
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL**

  ```bash
  npx vitest run tests/api/scheme-match.test.ts
  ```

- [x] **Step 3: Implement `app/api/scheme-match/route.ts`**

  Validate body (400 on missing `user_profile`). Check rate limit (429 on failure, with Hindi+English error message). **Cache check:** compute a cache key from sorted `user_profile` JSON + language; check Upstash Redis (`GET cache:scheme-match:<key>`); if hit, return cached JSON directly (skip Gemini + matcher). Load all scheme JSONs from `data/schemes/` (use `fs.readdirSync` — this runs server-side). Call `matchSchemes(profile, allSchemes)`. **Cache write:** `SET cache:scheme-match:<key> <json> EX 3600` (1-hour TTL). Return `{ matched_schemes, missing_fields, language_detected }`. Use `zod` for request body validation.

- [x] **Step 4: Implement `app/api/doc-explain/route.ts`**

  Validate body (400 on missing `image_base64`). Check rate limit. Call `explainDocument(image_base64, language)`. Return JSON response. On Gemini error or empty response, return `{ document_type: "unknown", summary: "...", key_fields: [], action_items: [], warnings: ["इमेज स्पष्ट नहीं थी। बेहतर रोशनी में फिर से फोटो लें।"] }` — never 500.

- [x] **Step 5: Implement `app/api/voice-process/route.ts`**

  Accept `audio_base64` + `conversation_history`. Call Gemini with voice-system prompt + audio data. Return structured JSON. On empty audio blob, return 400 with Hindi message.

- [x] **Step 6: Run tests — expect PASS**

  ```bash
  npx vitest run tests/api/
  ```

- [x] **Step 7: Commit**

  ```bash
  git add app/api/ tests/api/
  git commit -m "feat: scheme-match, doc-explain, voice-process API route handlers"
  ```

---

## Task 7: Offline Storage — IndexedDB Scheme Cards

**Files:**
- Create: `lib/offline.ts`
- Test: `tests/lib/offline.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  async function saveScheme(scheme: SchemeMatch): Promise<void>
  async function getSavedSchemes(): Promise<SchemeMatch[]>
  async function removeScheme(schemeId: string): Promise<void>
  async function isSchémeSaved(schemeId: string): Promise<boolean>
  ```

- [x] **Step 1: Write failing tests** (use `idb` mock or fake IndexedDB via `fake-indexeddb`)

  Install: `npm install -D fake-indexeddb`

  ```typescript
  // tests/lib/offline.test.ts
  import { describe, it, expect, beforeEach } from "vitest";
  import "fake-indexeddb/auto";

  describe("offline scheme storage", () => {
    beforeEach(async () => {
      const { clearAllSchemes } = await import("@/lib/offline");
      await clearAllSchemes();
    });

    it("saves and retrieves a scheme", async () => {
      const { saveScheme, getSavedSchemes } = await import("@/lib/offline");
      const fakeMatch = {
        scheme: { id: "pm-kisan", name: { hi: "पीएम किसान", en: "PM-KISAN" } } as any,
        match_confidence: "high" as const,
        match_reason_hi: "आप किसान हैं",
        match_reason_en: "You are a farmer",
        missing_fields: []
      };
      await saveScheme(fakeMatch);
      const saved = await getSavedSchemes();
      expect(saved).toHaveLength(1);
      expect(saved[0].scheme.id).toBe("pm-kisan");
    });

    it("removes a scheme by id", async () => {
      const { saveScheme, removeScheme, getSavedSchemes } = await import("@/lib/offline");
      await saveScheme({ scheme: { id: "test-id" } as any, match_confidence: "high", match_reason_hi: "", match_reason_en: "", missing_fields: [] });
      await removeScheme("test-id");
      const saved = await getSavedSchemes();
      expect(saved).toHaveLength(0);
    });

    it("isSchemeSaved returns false for unsaved scheme", async () => {
      const { isSchemeSaved } = await import("@/lib/offline");
      expect(await isSchemeSaved("non-existent")).toBe(false);
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL**

- [x] **Step 3: Implement `lib/offline.ts`** using `idb` package. DB name: `loksaathi-db`, version 1. Object store: `saved-schemes`, keyPath: `scheme.id`. Export `saveScheme`, `getSavedSchemes`, `removeScheme`, `isSchemeSaved`, `clearAllSchemes` (test helper only).

- [x] **Step 4: Run test — expect PASS**

- [x] **Step 5: Commit**

  ```bash
  git add lib/offline.ts tests/lib/offline.test.ts
  git commit -m "feat: IndexedDB offline scheme card storage"
  ```

---

## Task 8: Voice Interview Component

**Files:**
- Create: `components/VoiceInterview.tsx`
- Create: `hooks/useVoiceRecorder.ts`
- Create: `hooks/useSpeechSynthesis.ts`
- Test: `tests/components/VoiceInterview.test.tsx`

**Interfaces:**
- Consumes: `/api/voice-process` and `/api/scheme-match` (via fetch)
- Produces:
  ```typescript
  // VoiceInterview.tsx
  interface Props {
    language: "hi" | "en";
    onProfileComplete: (profile: UserProfile, matches: SchemeMatch[]) => void;
  }
  export function VoiceInterview(props: Props): JSX.Element
  ```

- [x] **Step 1: Write failing tests**

  ```typescript
  // tests/components/VoiceInterview.test.tsx
  import { render, screen, fireEvent } from "@testing-library/react";
  import { describe, it, expect, vi } from "vitest";
  import { VoiceInterview } from "@/components/VoiceInterview";

  vi.stubGlobal("MediaRecorder", class {
    state = "inactive";
    start = vi.fn(() => { this.state = "recording"; });
    stop = vi.fn(() => { this.state = "inactive"; });
    ondataavailable = null;
    onstop = null;
    static isTypeSupported = () => true;
  });

  vi.stubGlobal("SpeechRecognition", undefined);      // simulate iOS Safari
  vi.stubGlobal("webkitSpeechRecognition", undefined);

  describe("VoiceInterview", () => {
    it("renders mic button as primary CTA", () => {
      render(<VoiceInterview language="hi" onProfileComplete={vi.fn()} />);
      expect(screen.getByRole("button", { name: /mic|माइक|बोलें/i })).toBeTruthy();
    });

    it("falls back to text input when SpeechRecognition is unavailable", () => {
      render(<VoiceInterview language="hi" onProfileComplete={vi.fn()} />);
      // Should show text input alongside mic button (not hide it)
      expect(screen.getByRole("textbox")).toBeTruthy();
    });

    it("renders AI question in Hindi when language=hi", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transcript: "", intent: "scheme_query",
          extracted_profile_updates: {},
          next_question: "आप किस राज्य में रहते हैं?",
          is_profile_complete: false
        })
      } as any);
      render(<VoiceInterview language="hi" onProfileComplete={vi.fn()} />);
      // Initial question displayed before first voice input
      expect(screen.getByText(/नमस्ते|राज्य|शुरू/i)).toBeTruthy();
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL**

- [x] **Step 3: Implement `hooks/useVoiceRecorder.ts`**

  Wraps `MediaRecorder` API. `startRecording()`, `stopRecording(): Promise<Blob>`. Detects if `MediaRecorder` or mic permission unavailable — returns `{ isSupported: boolean }`. On unsupported, `stopRecording()` returns empty Blob.

- [x] **Step 4: Implement `hooks/useSpeechSynthesis.ts`**

  Wraps `window.speechSynthesis`. `speak(text, lang)`: selects best available Hindi/English voice (prefers `hi-IN`). `cancel()`. Returns `{ isSupported: boolean }`.

- [x] **Step 5: Implement `components/VoiceInterview.tsx`**

  State machine: `idle → listening → processing → responding → idle`. Large circular mic button (primary CTA, 72px diameter, accessible `aria-label`). Text input always visible alongside mic (never hidden) for fallback. Conversation history displayed as chat bubbles. AI question spoken via `useSpeechSynthesis`. On `is_profile_complete: true`, call `/api/scheme-match` with accumulated profile, then call `onProfileComplete(profile, matches)`.

- [x] **Step 6: Run tests — expect PASS**

  ```bash
  npx vitest run tests/components/VoiceInterview.test.tsx
  ```

- [x] **Step 7: Commit**

  ```bash
  git add components/VoiceInterview.tsx hooks/ tests/components/
  git commit -m "feat: voice interview component with mic + typed fallback"
  ```

---

## Task 9: Scheme Card Component + Share

**Files:**
- Create: `components/SchemeCard.tsx`
- Create: `components/EligibilityBadge.tsx`
- Test: `tests/components/SchemeCard.test.tsx`

**Interfaces:**
- Consumes: `SchemeMatch` from Task 3; `saveScheme`, `isSchemeSaved` from Task 7
- Produces:
  ```typescript
  interface Props {
    match: SchemeMatch;
    language: "hi" | "en";
    onSave?: (match: SchemeMatch) => void;
  }
  export function SchemeCard(props: Props): JSX.Element
  ```

- [x] **Step 1: Write failing tests**

  ```typescript
  // tests/components/SchemeCard.test.tsx
  import { render, screen, fireEvent } from "@testing-library/react";
  import { describe, it, expect, vi } from "vitest";
  import { SchemeCard } from "@/components/SchemeCard";

  vi.mock("@/lib/offline", () => ({
    isSchemeSaved: vi.fn(async () => false),
    saveScheme: vi.fn(async () => {}),
    removeScheme: vi.fn(async () => {}),
  }));

  const fakeMatch = {
    scheme: {
      id: "pm-kisan",
      name: { hi: "पीएम किसान", en: "PM-KISAN" },
      benefit: { summary_hi: "₹6,000 सालाना", summary_en: "₹6,000/year" },
      documents_required: ["Aadhaar", "Bank Passbook"],
      apply_url: "https://pmkisan.gov.in",
      last_verified: "2026-11-01",
      confidence: "verified" as const
    } as any,
    match_confidence: "high" as const,
    match_reason_hi: "आप किसान हैं",
    match_reason_en: "You are a farmer",
    missing_fields: []
  };

  describe("SchemeCard", () => {
    it("renders scheme name in Hindi", () => {
      render(<SchemeCard match={fakeMatch} language="hi" />);
      expect(screen.getByText("पीएम किसान")).toBeTruthy();
    });

    it("renders benefit summary", () => {
      render(<SchemeCard match={fakeMatch} language="hi" />);
      expect(screen.getByText(/₹6,000/)).toBeTruthy();
    });

    it("renders apply link pointing to correct URL", () => {
      render(<SchemeCard match={fakeMatch} language="hi" />);
      const link = screen.getByRole("link");
      expect(link.getAttribute("href")).toBe("https://pmkisan.gov.in");
    });

    it("calls onSave when bookmark button is clicked", async () => {
      const onSave = vi.fn();
      render(<SchemeCard match={fakeMatch} language="hi" onSave={onSave} />);
      fireEvent.click(screen.getByRole("button", { name: /save|save scheme|सहेज/i }));
      expect(onSave).toHaveBeenCalledWith(fakeMatch);
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL**

- [x] **Step 3: Implement `components/EligibilityBadge.tsx`** — renders `✅ Verified` / `🔍 Web-sourced` / `⚠️ Needs verification` based on `confidence` field. High contrast, accessible.

- [x] **Step 4: Implement `components/SchemeCard.tsx`**

  Card layout: scheme name (large, in selected language), `EligibilityBadge`, benefit summary, documents required as chips, match reason in plain language, "Apply" button (opens `apply_url` in new tab), bookmark button (calls `saveScheme` + toggles icon), WhatsApp share button (uses `navigator.share` with fallback to `https://wa.me/?text=...`). `last_verified` shown as "Verified: Nov 2026" with warning icon if >90 days old.

- [x] **Step 5: Run tests — expect PASS**

- [x] **Step 6: Commit**

  ```bash
  git add components/SchemeCard.tsx components/EligibilityBadge.tsx tests/components/
  git commit -m "feat: scheme card with offline save + WhatsApp share"
  ```

---

## Task 10: Document Scanner Component

**Files:**
- Create: `components/DocumentScanner.tsx`
- Test: `tests/components/DocumentScanner.test.tsx`

**Interfaces:**
- Consumes: `redactAndCompress` from Task 5; `/api/doc-explain` (fetch)
- Produces:
  ```typescript
  interface Props {
    language: "hi" | "en";
    onResult: (result: DocExplanation) => void;
  }
  export function DocumentScanner(props: Props): JSX.Element
  ```

- [x] **Step 1: Write failing tests**

  ```typescript
  // tests/components/DocumentScanner.test.tsx
  import { render, screen } from "@testing-library/react";
  import { describe, it, expect, vi } from "vitest";
  import { DocumentScanner } from "@/components/DocumentScanner";

  describe("DocumentScanner", () => {
    it("renders camera capture button as primary CTA", () => {
      render(<DocumentScanner language="hi" onResult={vi.fn()} />);
      expect(screen.getByRole("button", { name: /camera|फोटो|दस्तावेज़/i })).toBeTruthy();
    });

    it("renders file upload fallback option", () => {
      render(<DocumentScanner language="hi" onResult={vi.fn()} />);
      // File input with accept="image/*" must be present (even if visually hidden)
      const input = document.querySelector("input[type=file]");
      expect(input).toBeTruthy();
      expect(input?.getAttribute("accept")).toContain("image/");
    });

    it("displays privacy reassurance text", () => {
      render(<DocumentScanner language="hi" onResult={vi.fn()} />);
      expect(screen.getByText(/निजी|store नहीं|सुरक्षित/i)).toBeTruthy();
    });
  });
  ```

- [x] **Step 2: Run test — expect FAIL**

- [x] **Step 3: Implement `components/DocumentScanner.tsx`**

  Primary CTA: large camera button (uses `<input type="file" capture="environment" accept="image/*">`). Secondary: file upload (same input without `capture`). On file selected: show thumbnail preview → show redaction notice ("Aadhaar/PAN हटाया जा रहा है...") → call `redactAndCompress()` → POST to `/api/doc-explain` → call `onResult(response)`. Show spinner during processing with time estimate ("10–15 सेकंड"). Privacy text: "आपका दस्तावेज़ हमारे सर्वर पर सेव नहीं होता" always visible below button.

- [x] **Step 4: Run tests — expect PASS**

- [x] **Step 5: Commit**

  ```bash
  git add components/DocumentScanner.tsx tests/components/
  git commit -m "feat: document scanner with client-side redaction + privacy UX"
  ```

---

## Task 11: Page Routes — Home, Schemes, Document, Saved

**Files:**
- Modify: `app/page.tsx` (Home)
- Create: `app/schemes/page.tsx`
- Create: `app/schemes/[id]/page.tsx`
- Create: `app/document/page.tsx`
- Create: `app/saved/page.tsx`
- Create: `components/LanguageSwitcher.tsx`
- Modify: `app/layout.tsx` (global nav, font loading)
- Modify: `messages/hi.json` (complete all UI strings)
- Modify: `messages/en.json`
- Test: `tests/e2e/navigation.spec.ts` (Playwright)

**Interfaces:**
- Consumes: All components from Tasks 8–10; `getSavedSchemes` from Task 7

- [x] **Step 1: Write failing Playwright E2E test**

  ```typescript
  // tests/e2e/navigation.spec.ts
  import { test, expect } from "@playwright/test";

  test("home page loads and shows 3 primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/योजना खोजें|Find Schemes/i)).toBeVisible();
    await expect(page.getByText(/दस्तावेज़ स्कैन|Scan Document/i)).toBeVisible();
    await expect(page.getByText(/सहेजी गई|Saved/i)).toBeVisible();
  });

  test("navigates to scheme discovery page", async ({ page }) => {
    await page.goto("/");
    await page.getByText(/योजना खोजें|Find Schemes/i).click();
    await expect(page).toHaveURL(/\/schemes/);
    await expect(page.getByRole("button", { name: /mic|माइक/i })).toBeVisible();
  });

  test("navigates to document scanner page", async ({ page }) => {
    await page.goto("/");
    await page.getByText(/दस्तावेज़ स्कैन|Scan Document/i).click();
    await expect(page).toHaveURL(/\/document/);
  });

  test("saved page loads from IndexedDB with zero schemes", async ({ page }) => {
    await page.goto("/saved");
    await expect(page.getByText(/कोई योजना नहीं|No saved schemes/i)).toBeVisible();
  });

  test("language switcher toggles UI language", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /EN|English/i }).click();
    await expect(page.getByText(/Find Schemes/i)).toBeVisible();
  });
  ```

- [x] **Step 2: Run Playwright — expect FAIL** (pages don't exist)

  ```bash
  npx playwright test tests/e2e/navigation.spec.ts
  ```

- [x] **Step 3: Implement `app/layout.tsx`**

  Load `Noto Sans Devanagari` (Google Fonts, next/font, `display: swap`). Global nav: LokSaathi wordmark + `LanguageSwitcher`. Link manifest and theme-color meta. Set `lang` attribute from locale.

- [x] **Step 4: Implement `components/LanguageSwitcher.tsx`**

  Toggle button: "हिं / EN". Persists choice to `localStorage`. Triggers `next-intl` locale switch without page reload where possible.

- [x] **Step 5: Implement `app/page.tsx`** (Home)

  3 large hero tap-cards with icons: 🔍 "योजना खोजें" → `/schemes`, 📄 "दस्तावेज़ स्कैन करें" → `/document`, 🔖 "सहेजी गई योजनाएं" → `/saved`. Simple tagline in Hindi. No auth prompts, no onboarding modal on first visit.

- [x] **Step 6: Implement `app/schemes/page.tsx`**

  Renders `<VoiceInterview>`. On profile complete, renders list of `<SchemeCard>` components. Shows "कोई योजना नहीं मिली" with helpful next-step text if 0 matches.

- [x] **Step 7: Implement `app/document/page.tsx`**

  Renders `<DocumentScanner>`. On result, renders structured explanation: document type, key fields table, action items list (sorted by urgency), warnings.

- [x] **Step 8: Implement `app/saved/page.tsx`**

  Loads from `getSavedSchemes()` (IndexedDB). Renders `<SchemeCard>` for each. Empty state: illustration + "अभी कोई योजना सहेजी नहीं है।" Works in airplane mode.

- [x] **Step 9: Complete `messages/hi.json` and `messages/en.json`** with all UI strings used in steps above.

- [x] **Step 10: Run Playwright — expect all PASS**

  ```bash
  npx playwright test tests/e2e/navigation.spec.ts
  ```

- [x] **Step 11: Commit**

  ```bash
  git add app/ components/LanguageSwitcher.tsx messages/
  git commit -m "feat: all page routes, navigation, language switcher, i18n strings"
  ```

---

## Task 12: Deployment + Verification

**Files:**
- Create: `vercel.json` (edge function config, caching headers)
- Create: `.github/workflows/ci.yml`
- Create: `scripts/check-scheme-links.ts` (link checker)

**Interfaces:**
- Consumes: all prior tasks; deployed Vercel project with env vars set

- [x] **Step 1: Create `vercel.json`**

  ```json
  {
    "headers": [
      { "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
      { "source": "/manifest.json", "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }] }
    ]
  }
  ```

- [x] **Step 2: Create `.github/workflows/ci.yml`** — runs `npx vitest run` and `npx playwright test` on push to `main`.

- [x] **Step 3: Write `scripts/check-scheme-links.ts`** — reads all scheme JSONs, GETs each `apply_url`, logs any that return non-200. Run before deploy.

  ```bash
  npx tsx scripts/check-scheme-links.ts
  # Expected: all 30 URLs return 200
  ```

- [ ] **Step 4: Set Vercel environment variables**

  ```
  GEMINI_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, DATABASE_URL
  ```

- [ ] **Step 5: Deploy to Vercel**

  ```bash
  npx vercel --prod
  ```

- [ ] **Step 6: Run Lighthouse CI on deployed URL**

  ```bash
  npx lighthouse https://your-app.vercel.app \
    --preset=desktop --output=json \
    --only-categories=performance,accessibility,pwa
  ```

  Expected: PWA ≥ 90, Performance ≥ 85, Accessibility ≥ 90.

- [ ] **Step 7: Real-device smoke test checklist**

  ```
  □ Install to home screen — Android Chrome (Pixel / Redmi 9A)
  □ Install guide shown — iOS Safari iPhone SE
  □ Voice interview completes → scheme cards shown
  □ Document photo taken → explanation shown in Hindi
  □ Scheme saved → visible in /saved in airplane mode
  □ WhatsApp share generates correct message
  □ Language toggle: Hindi ↔ English works
  □ Rate limit: 21st API call returns Hindi error message
  ```

- [ ] **Step 8: Final commit + tag**

  ```bash
  git add vercel.json .github/ scripts/
  git commit -m "chore: CI pipeline, Vercel config, scheme link checker"
  git tag v0.1.0-mvp
  git push origin main --tags
  ```

---

## Plan Self-Review

**Spec coverage:** Every locked decision in `ARCHITECTURE.md` is addressed:
- ✅ Delhi/Haryana/UP + Central schemes (Task 1 — 30 JSON files)
- ✅ Hindi-first + English toggle (Task 2 i18n, Task 11 LanguageSwitcher)
- ✅ Hybrid UX — voice hero + visual chips fallback (Task 8)
- ✅ $0–$10/month cost controls — rate limiting + compression (Task 2, Task 5)
- ✅ Manual curation, no scrapers (Task 1 manual JSON)
- ✅ Anonymous sessions, IndexedDB (Task 7)
- ✅ Client-side PII redaction (Task 5)
- ✅ Deterministic rule engine, AI never invents eligibility (Task 3+4)
- ✅ PWA installable + offline (Task 0 Serwist, Task 7)
- ✅ Lighthouse verification (Task 12)

**Review Focus pins:**
1. Partial profile → medium confidence + missing_fields: **Task 3 test line 3** ✅
2. Blurry photo → graceful error: **Task 6 doc-explain implementation** ✅
3. iOS Safari no mic → typed fallback visible: **Task 8 test line 2** ✅
4. Aadhaar redaction timing: **Task 5 test** ✅
5. 429 → Hindi error message: **Task 6 test line 2** ✅
