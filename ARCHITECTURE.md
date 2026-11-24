# LokSaathi — Locked Architecture
> **Status: LOCKED ✅** | Locked: 2026-11-24 | Decision Gate: PASSED

## Product

**LokSaathi** ("People's Helper") — A Hindi-first PWA that helps Indian citizens discover government scheme eligibility and understand government documents through conversational AI, multimodal document scanning, and a zero-hallucination curated data layer.

**Anti-goal:** This is NOT a general-purpose government information portal. It is a hyper-focused eligibility assistant and document explainer for low-digital-literacy Bharat users.

---

## Locked Decisions (from Decision Gate 2026-11-24)

### Decision 1 — Target Geography & Language
- **Phase 1 States:** Delhi, Haryana, Uttar Pradesh + All-India Central Schemes
- **Primary Language:** Hindi-first (Devanagari script + Hinglish voice comprehension)
- **Secondary Language:** English (toggle, Phase 1)
- **i18n Architecture:** i18n-ready from Day 1 so Marathi/Tamil/Bengali plug in cleanly in Phase 2
- **Locale codes in use:** `hi`, `en` (Phase 1); `mr`, `ta`, `te`, `bn`, `gu`, `kn` (Phase 2 slots reserved)

### Decision 2 — UX Paradigm
- **Hybrid UX:** Voice is the hero input for profiling (large mic button, primary CTA)
- **Visual navigation:** Large high-contrast tap-cards, quick-select chips (not dropdowns)
- **iOS Safari fallback:** Web Speech API → typed fallback with Devanagari keyboard
- **No purely form-based profiling** in MVP

### Decision 3 — API Budget
- **Hard ceiling:** $0–$10/month during MVP phase
- **Model routing:** Gemini 2.0 Flash exclusively in Phase 1 (cost + speed)
- **Cost controls:**
  - Client-side image compression to ≤800KB before API call
  - Aggressive server-side response caching (Upstash Redis, 1-hour TTL for scheme responses)
  - Per-IP rate limiting: 20 AI calls/hour/IP (Upstash middleware)
  - Per-session rate limiting: 50 AI calls/day/session-token
  - Gemini Flash input pricing: ~$0.075/1M tokens → 100 DAU × 5 calls × 500 tokens ≈ $0.019/day
- **Upgrade trigger:** If DAU > 500, apply for Google for Startups / AI for Social Good credits

### Decision 4 — Data Freshness
- **Phase 1:** Manual curation only
- **Seed dataset:** 25–30 verified schemes from myscheme.gov.in + official .gov.in portals
- **Coverage:** Top Central schemes + Delhi/Haryana/UP state-specific schemes
- **Verification:** Each JSON entry manually verified, `last_verified` date stamped
- **Live grounding:** Optional Gemini Google Search grounding for real-time URL/rule spot-checks
- **Phase 2:** Automated GitHub Actions weekly scraper + human review PR queue

### Decision 5 — Auth
- **Phase 1:** Zero auth. Anonymous sessions only.
- **Persistence:** `localStorage` for preferences/language; `IndexedDB` for saved scheme cards + profile
- **Privacy:** No PII ever touches server storage. No cookies beyond session rate-limit token.
- **Phase 2 trigger:** Only add phone OTP (NextAuth v5) when cross-device sync is a validated user request

---

## Tech Stack (Locked)

```
Layer             Technology                          Rationale
─────────────────────────────────────────────────────────────────────────
Frontend          Next.js 15 (App Router, TypeScript) RSC + Streaming, full-stack
Styling           Tailwind CSS v4 + shadcn/ui          Accessible, WAI-ARIA, tiny CSS
PWA               Serwist (Workbox fork, Next.js 15)   Modern SW, CacheFirst strategies
AI SDK            @google/generative-ai (server-only)  Official SDK, structured JSON
AI Model          Gemini 2.0 Flash (primary)           Cost: ~$0.075/1M tokens, fast
                  Gemini 2.5 Pro (Phase 2 fallback)    Complex degraded-image parsing
Voice In          Gemini Flash native audio input       Handles Hinglish/dialects natively
                  Web Speech API (fallback)             iOS Safari + no-mic environments
Voice Out         Web Speech API SpeechSynthesis        Zero cost, OS Hindi voices
                  Google Cloud TTS Neural2 (Phase 2)   Higher quality voice output
Database          Vercel Postgres (Neon)                Scheme metadata, free tier
Cache             Upstash Redis                         Rate limiting, response cache
Hosting           Vercel                                Edge network, free tier generous
Analytics         Plausible (self-host or $9/mo)        Privacy-first, GDPR/DPDP OK
i18n              next-intl                             Type-safe, App Router compatible
─────────────────────────────────────────────────────────────────────────
```

---

## Data Architecture (Locked)

```
LAYER 1: Curated Ground-Truth JSON (eligibility authority)
  /data/schemes/central/*.json    — 20 Central schemes
  /data/schemes/state/delhi/      — 3–5 Delhi schemes
  /data/schemes/state/haryana/    — 3–5 Haryana schemes
  /data/schemes/state/up/         — 5–8 UP schemes
  Schema: id, name{hi,en}, last_verified, source_url,
          eligibility{must_match_all[], must_match_none[]},
          benefit, documents_required[], apply_url, deadline, confidence

LAYER 2: Deterministic Rule Engine (lib/scheme-matcher.ts)
  Input:  UserProfile JSON
  Output: SchemeMatch[] with match_reason[], missing_fields[]
  Rule:   AI never computes eligibility — it only parses user language into profile

LAYER 3: AI as Interpreter (Gemini Flash, server Route Handlers)
  Jobs:   1) Parse natural language / audio → UserProfile JSON
          2) Generate plain-language explanations of matches
          3) Explain document photos in simple Hindi/English
  NOT:    Inventing eligibility facts, URLs, income limits, deadlines

LAYER 4: Gemini Google Search Grounding (optional, low-traffic)
  When:   User asks about a scheme NOT in Layer 1
  Output: Response tagged confidence:"web-grounded", source URL shown
  Gate:   Only .gov.in sources accepted as authoritative
```

---

## Privacy Architecture (Locked — DPDP Act 2023 Compliant)

```
Document Upload Pipeline:
  1. User photos document → Canvas API renders locally (browser only)
  2. Client-side PII detection: Aadhaar (\d{4}\s\d{4}\s\d{4}) → blur middle 8 digits
     PAN ([A-Z]{5}[0-9]{4}[A-Z]) → blur last 4 chars; phone → blur
  3. Client-side compression: target ≤800KB (canvas.toBlob quality:0.8)
  4. Redacted + compressed image → POST to /api/doc-explain
  5. Server: processes in memory, calls Gemini, returns JSON, NO image stored
  6. Architecturally: no DB write path exists for document images

User Profile:
  - Stored in IndexedDB only (browser-local)
  - Never transmitted to server as a named entity
  - Sent as anonymous JSON payload per API call

Server Logs:
  - No PII in logs (middleware strips query params containing personal fields)
  - Rate-limit token: random UUID, no link to identity
```

---

## PWA Configuration (Locked)

```
Install:        Chrome Android — standard BeforeInstallPrompt
                iOS Safari — animated "Add to Home Screen" guide (shown visit 2+)
Manifest:       name:"LokSaathi", short_name:"LokSaathi"
                theme_color: #1a56db (accessible blue)
                icons: 192×192, 512×512, 512×512 maskable
Service Worker: Serwist, strategies:
                  App shell → CacheFirst
                  /data/schemes/ → CacheFirst (versioned)
                  /api/* → NetworkFirst (5s timeout → cached fallback)
                  Images → CacheFirst + 30-day expiry
Offline:        Saved scheme cards → IndexedDB → full offline access
                AI features → graceful "No connection" message
TWA:            /.well-known/assetlinks.json (Phase 2 Play Store)
```

---

## API Contracts (Locked)

### POST /api/scheme-match
```typescript
// Request
{
  user_profile: {
    state: "delhi" | "haryana" | "up" | "other",
    age: number,
    gender: "male" | "female" | "other",
    occupation: string[],             // ["farmer", "small_farmer", "laborer", "student", ...]
    annual_income_inr: number,
    category: "general" | "obc" | "sc" | "st",
    land_owned_acres?: number,
    is_bpl?: boolean,
    has_bank_account?: boolean,
    is_disabled?: boolean,
    is_minority?: boolean,
    household_size?: number
  },
  language: "hi" | "en",
  raw_voice_transcript?: string       // for context in explanation
}
// Response
{
  matched_schemes: Array<{
    id: string,
    name: string,
    benefit_summary: string,          // in requested language, plain words
    documents_required: string[],
    apply_url: string,
    match_confidence: "high" | "medium",
    match_reason: string,             // why user qualifies, in plain language
    last_verified: string             // ISO date
  }>,
  missing_fields: string[],           // profile fields that would unlock more matches
  language_detected: "hi" | "en"
}
```

### POST /api/doc-explain
```typescript
// Request
{ image_base64: string, language: "hi" | "en" }
// Response (streamed)
{
  document_type: string,
  summary: string,
  key_fields: Array<{ label: string, value: string, importance: "critical"|"normal" }>,
  action_items: Array<{ task: string, deadline?: string, urgency: "high"|"medium"|"low" }>,
  warnings: string[],
  full_explanation: string
}
```

### POST /api/voice-process
```typescript
// Request
{ audio_base64: string, language_hint?: string, conversation_history: Array<{role:"user"|"model", text:string}> }
// Response
{
  transcript: string,
  intent: "scheme_query" | "doc_question" | "general_info",
  extracted_profile_updates: Partial<UserProfile>,
  next_question: string,
  is_profile_complete: boolean
}
```

---

## Folder Structure (Locked)

```
loksaathi/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Home: 3 hero CTAs
│   ├── schemes/
│   │   ├── page.tsx                    # Scheme discovery (voice interview)
│   │   └── [id]/page.tsx              # Scheme detail + share
│   ├── document/
│   │   └── page.tsx                    # Document scanner + explainer
│   ├── saved/
│   │   └── page.tsx                    # Offline saved scheme cards (IndexedDB)
│   └── api/
│       ├── scheme-match/route.ts
│       ├── doc-explain/route.ts
│       └── voice-process/route.ts
├── components/
│   ├── ui/                             # shadcn/ui base components
│   ├── VoiceInterview.tsx
│   ├── SchemeCard.tsx
│   ├── DocumentScanner.tsx
│   ├── EligibilityBadge.tsx
│   └── LanguageSwitcher.tsx
├── lib/
│   ├── gemini.ts                       # Server-only Gemini client
│   ├── scheme-matcher.ts               # Deterministic eligibility logic
│   ├── redaction.ts                    # Client-side PII redaction
│   ├── tts.ts                          # SpeechSynthesis wrapper
│   ├── offline.ts                      # IndexedDB scheme storage
│   └── rate-limit.ts                   # Upstash Redis rate limiter
├── data/
│   ├── schemes/
│   │   ├── central/                    # 20 × scheme JSON files
│   │   ├── state/delhi/               # 3–5 × scheme JSON files
│   │   ├── state/haryana/             # 3–5 × scheme JSON files
│   │   └── state/up/                  # 5–8 × scheme JSON files
│   └── prompts/
│       ├── scheme-system.txt
│       └── doc-system.txt
├── messages/
│   ├── hi.json                         # next-intl Hindi strings
│   └── en.json                         # next-intl English strings
├── public/
│   ├── manifest.json
│   ├── sw.js                           # Serwist-generated
│   └── icons/
├── middleware.ts                        # Rate limiting + i18n routing
├── next.config.ts                       # PWA + security headers
├── ARCHITECTURE.md                     # ← this file
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-11-24-loksaathi-design.md   # Master Blueprint reference
        └── plans/
            └── 2026-11-24-loksaathi-phase1.md   # Phase 1 implementation plan
```

---

## Phase Map

| Phase | Scope | Timeline |
|---|---|---|
| **Phase 1 (MVP)** | Voice profiling, scheme matching, doc explain, 25–30 schemes, Hindi+English, PWA install, offline saved cards | Weeks 1–8 |
| **Phase 2** | Form overlay guide, doc readiness score, rejection decoder, 10 more states, 5 more languages, TWA/Play Store, automated data refresh | Weeks 9–20 |
| **Phase 3** | WhatsApp bot, push notifications, NGO partner dashboard, NIC API integration, B2G revenue | Months 6–12 |

---

*This file is the locked source of truth for Phase 1. Any change to decisions above requires explicit sign-off before code changes.*
