# 🇮🇳 लोकसाथी (LokSaathi) — AI Citizen Welfare Companion

> **Empowering 1.4 Billion Citizens to Discover, Understand, and Claim Government Welfare Schemes.**  
> Built with Next.js 16, Gemini Flash, DPDP Act 2023 on-device privacy redaction, and offline PWA support.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black)](https://nextjs.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Tests](https://img.shields.io/badge/Tests-139%20Passed-brightgreen)](https://vitest.dev)
[![Architecture](https://img.shields.io/badge/Budget-%E2%82%B90%20Zero%20Cost-orange)](https://github.com)

---

## 🌟 Key Features

- 🗣️ **Universal Dual-Engine Voice Assistant**: 100% natural speech-to-text and text-to-speech supporting **Hindi (हिंदी)** and **English**. Universal compatibility across Chrome, Brave, Edge, Safari, and Firefox.
- 📜 **30+ Verified Central & State Welfare Schemes**: Direct links to official `.gov.in` application portals (PM-KISAN, Ayushman Bharat, PM Awas, Ladli Behna, etc.) with zero hallucinated URLs.
- 🛡️ **DPDP Act 2023 Compliant On-Device Redaction**: Aadhaar (12-digit UID) and PAN numbers are automatically blurred in-browser via HTML5 Canvas before image compression. Zero server-side image storage.
- 📱 **Universal Progressive Web App (PWA)**: Works offline, installs on Android, iOS, Windows, macOS, and Linux with 1-tap home-screen access.
- 💰 **₹0 / Free-Tier Architecture**: Powered entirely by Gemini Flash free tier, Vercel free hosting, and client-side IndexedDB.

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- Node.js 20 or higher
- A free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/LokSaathi.git
cd LokSaathi
npm install --legacy-peer-deps
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
DATABASE_URL=
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Deploy to Production (100% Free on Vercel)

The fastest and easiest way to make LokSaathi live for the entire world:

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "feat: production release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/LokSaathi.git
   git push -u origin main
   ```
2. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
3. Click **"Add New"** > **"Project"** and import `LokSaathi`.
4. In the **Environment Variables** section, add:
   - `GEMINI_API_KEY`: *(your Gemini API key)*
   - `GEMINI_MODEL`: `gemini-2.0-flash`
5. Click **"Deploy"**. Within ~60 seconds, your site is live with a global HTTPS URL (e.g., `https://loksaathi.vercel.app`)!

---

## 🐳 Self-Hosting with Docker

Run LokSaathi on any operating system (Windows, Linux, macOS, Ubuntu VPS) using Docker:

```bash
# Build and run with docker compose
docker compose up -d --build
```
Your instance will be accessible at `http://localhost:3000`.

---

## 📱 Mobile Installation (PWA)

LokSaathi installs directly onto smartphones without an app store:

- **Android (Chrome / Brave / Edge)**: Tap the three dots menu (⋮) > Tap **"Install app"** or **"Add to Home Screen"**.
- **iPhone / iPad (Safari)**: Tap the Share button (⎋) > Tap **"Add to Home Screen"** (+).
- **Windows / macOS (Chrome / Edge)**: Click the install icon in the URL bar (⊕) > Click **"Install"**.

---

## 🧪 Testing & Verification

LokSaathi is backed by a rigorous 139-test verification suite:

```bash
# Run all unit and integration tests
npx vitest run

# Run TypeScript type verification
npx tsc --noEmit

# Test production build
npm run build
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
