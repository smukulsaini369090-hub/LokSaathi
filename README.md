# LokSaathi (लोकसाथी) 🇮🇳

**Zero-Guesswork, Anti-Dalal Civic Welfare & Government Scheme Assistant for Bharat — Built at ₹0 Infrastructure Cost.**

[![Live App](https://img.shields.io/badge/Live-lok--saathi.vercel.app-0F766E?style=for-the-badge)](https://lok-saathi.vercel.app)
[![Schemes Indexed](https://img.shields.io/badge/Verified_Index-519_Schemes-1D4ED8?style=for-the-badge)](#jurisdiction--scheme-coverage)
[![Cost](https://img.shields.io/badge/Operating_Cost-%E2%82%B90-15803D?style=for-the-badge)](#architecture--zero-cost-engineering)
[![Security Hardened](https://img.shields.io/badge/Security-CSP_%7C_PII_Scrub_%7C_Red--Teamed-B91C1C?style=for-the-badge)](#security--privacy-architecture)

---

## Why LokSaathi?

Millions of eligible citizens lose welfare benefits or fall prey to middlemen (*dalals*) because government scheme rules are scattered across portals, confused across NCR state borders, or mixed up with discontinued and viral fake schemes.

**LokSaathi** replaces generic LLM guesswork with a **deterministic, bilingual (Hindi + English), offline-first civic assistant**:

- **0% AI Hallucination on Rules:** Statutory eligibility (`Pass / Fail / Missing`), `hard_disqualifier` vs. `fixable_gap` classification, and top alternatives run on a deterministic rules engine over verified structured data.
- **Delhi NCR Jurisdiction Disambiguation:** Prevents cross-border rejection by separating **Delhi (NCT)** (`CFC / e-District`), **Haryana NCR** (`Antyodaya Saral Kendra + PPP`), and **Uttar Pradesh NCR** (`Jan Seva Kendra / e-Sathi + Family ID`).
- **Discontinued & Viral Fake-Scheme Redirect Shield:** Detects outdated or misleading queries (e.g., *"Delhi Ladli Behna Yojana"*, *Ladli 2008 → Lakhpati Bitiya*, *FAME-II → PM E-DRIVE*, *PMVVY vs. Ayushman Vaya Vandana*) and redirects citizens to active official schemes.
- **Anti-Dalal Citizen Shield:** Displays official portal fee (`₹0` / statutory fee), nominal kiosk facilitation norms, expected SLA timelines, official helplines, and a 3-point acknowledgement receipt checklist on every scheme.
- **Bilingual Document Acquisition Guides:** Interactive readiness checklist with step-by-step `"How to Get It?" / "कैसे बनवाएं?"` portals and local center guidance.
- **Client-Side Finger-Blur Privacy Redaction (`/document`):** Citizens can redact sensitive ID numbers on document photos directly in the browser before sharing—zero server upload.
- **Bring Your Own Key (BYOK) + Offline Deterministic Fallback:** Works offline or without a paid key using the built-in deterministic rules engine, while letting citizens optionally supply their own Gemini API key locally in browser `localStorage`.

---

## Jurisdiction & Scheme Coverage

LokSaathi indexes **519 schemes across 12 welfare categories** (including **95 full deep-dive specifications for Delhi NCT**):

| Jurisdiction | Schemes Indexed | Local Facilitation Ecosystem |
| :--- | :---: | :--- |
| **Delhi (NCT)** | **95** (`DL-001` – `DL-095`, Deep-Dive Complete) | Citizen Facilitation Centre (CFC) / e-District Delhi |
| **Haryana** *(incl. Haryana NCR)* | **119** (`HR-001` – `HR-119`) | Antyodaya Saral Kendra + Parivar Pehchan Patra (PPP) |
| **Uttar Pradesh** *(incl. UP NCR)* | **112** (`UP-001` – `UP-112`) | Jan Seva Kendra / e-Sathi + UP Family ID |
| **Punjab** | **90** (`PB-001` – `PB-090`) | Sewa Kendra / Connect Punjab + 1076 Doorstep |
| **Central Government (All India)** | **103** (`IN-001` – `IN-103`) | Common Service Centre (CSC) / myScheme / UMANG |
| **Total** | **519 Schemes** | **12 Categories • 32 Discontinued/Fake Redirect Rules** |

---

## Architecture & Zero-Cost Engineering

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS with native `system-ui` font stacks (zero external font blocking, fast on low-bandwidth mobile connections).
- **Deterministic Core (`lib/`):**
  - `schemes-loader.ts` — Cached, deduplicated index loader for all 519 Central & State schemes.
  - `intake-state-machine.ts` — Multi-turn guided intake with NCR disambiguation.
  - `eligibility-evaluator.ts` & `scheme-matcher.ts` — Rule-based statutory audit and gap remediation.
  - `scheme-redirects.ts` — Discontinued, merged, and viral fake-scheme interception (32 rules).
  - `document-guides.ts` & `anti-dalal.ts` — Bilingual document acquisition steps and transparency metadata.
- **PWA / Offline Support:** Serwist service worker, `/offline` fallback, `/saved` offline bookmarking via IndexedDB, and 1-tap Home Screen install on Android, iOS, and desktop browsers.

---

## Security & Privacy Architecture

- **Zero PII Server Storage:** LokSaathi never asks for or stores Aadhaar, PAN, or bank account numbers on any backend.
- **Hardened HTTP Headers (`next.config.ts`):** Strict Content-Security-Policy (CSP), HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and strict `Referrer-Policy`.
- **Input & Prompt Defense (`lib/security.ts` & `tests/security/`):** Prompt-injection filtering, homoglyph normalization, PII log scrubbing, and automated Vitest security & prompt red-team tests.

---

## Local Development

### 1. Clone & Install (Node.js 20+)

```bash
git clone https://github.com/smukulsaini369090-hub/LokSaathi.git
cd LokSaathi
npm install
```

### 2. Optional Environment Configuration

Create a `.env.local` file in the root directory if you want server-side Gemini Vision/Voice extraction or Upstash rate-limiting (the deterministic rules engine and 519-scheme catalog work with zero keys configured):

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 3. Run Development Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Docker & Mobile PWA

- **Self-Host with Docker:**
  ```bash
  docker compose up -d --build
  ```
- **Mobile Installation (PWA):**
  - **Android (Chrome / Brave / Edge):** Open browser menu (`⋮`) → **Install app** / **Add to Home Screen**.
  - **iPhone / iPad (Safari):** Tap **Share** (`⎋`) → **Add to Home Screen** (`+`).
  - **Desktop (Chrome / Edge):** Click the install icon in the address bar (`⊕`).

---

## Testing & Verification

LokSaathi is verified by a **137-test automated suite across 28 test files** (including 519-scheme schema validation, redirect tests, multi-turn intake state-machine integration tests, and security red-team tests):

```bash
# Run TypeScript type verification
npx tsc --noEmit

# Run all 137 unit, integration & security tests
npx vitest run

# Build production bundle
npm run build
```
