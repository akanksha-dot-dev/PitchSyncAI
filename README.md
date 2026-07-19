# PitchSync AI 🏟️⚽

> **GenAI-Powered Dual-Mode Stadium Operations & Fan Experience Platform for FIFA World Cup 2026™**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/akanksha-dot-dev/PitchSyncAI)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

🔗 **Live Demo**: [https://pitchsync-ai.vercel.app](https://pitchsync-ai.vercel.app)

---

## 📌 Chosen Vertical

**Stadium Operations & Fan Experience** — Enhancing real-time crowd management, accessible navigation, multilingual assistance, and operational intelligence for the FIFA World Cup 2026.

---

## 🧠 Approach and Logic

### The Problem

FIFA World Cup 2026 stadiums will serve 80,000+ multilingual fans per match across 16 venues in three countries. Key operational challenges include:

- **Crowd bottlenecks** at gates, concourses, and food courts with no real-time visibility.
- **Language barriers** for international fans needing wayfinding, transit, and emergency help.
- **Accessibility gaps** where wheelchair users, visually impaired fans, and sensory-sensitive attendees lack tailored guidance.
- **Disconnected operations** where staff lack AI-driven situational awareness for proactive crowd rerouting.

### The Solution: Dual-Mode GenAI Architecture

PitchSync AI operates as a **unified Single Page Application (SPA) with two dynamic modes**, each targeting a distinct stakeholder group:

| Mode | Target User | Core Capabilities |
|------|-------------|-------------------|
| **🎟️ Fan Copilot** | International fans | Multilingual AI chat assistant, accessible wayfinding with route cards, live transit departure schedules, digital ticket wallet with offline save |
| **📊 Ops Command** | Stadium staff & volunteers | Real-time crowd density heatmap (SVG), 4 KPI metric cards with sparklines, AI-generated alert feed with acknowledge/resolve actions, staff resource deployment panel, proactive reroute validation wizard |

---

## 🏗️ Architecture & Decision-Making Flow

### GenAI Processing Pipeline

Below is the sequence of operations applied to every fan query:

```
User Message → XSS Sanitizer → Prompt Injection Defense → Language Detector → Intent Classifier
                                                                               ↓
                                                                       [Is Ambiguous?]
                                                                        /           \
                                                                    (Yes)          (No)
                                                                    /                 \
                                                       Disambiguation Prompt      Context Assembler
                                                                                       ↓
                                                                              Follow-up Detector
                                                                                       ↓
                                                                              Response Generator
                                                                                       ↓
                                                                              Context Compressor
                                                                                       ↓
                                                                                  Rich UI Render
```

1. **XSS Sanitizer**: Strips or encodes HTML elements (DOM-based in browser, fallback regex in Node test environment).
2. **Prompt Injection Defense**: Scans input against known adversarial regex patterns (e.g., instruction override, jailbreaks) and neutralizes them before processing.
3. **Language Detector**: Determines language code (ISO 639-1) for dynamic RTL (Right-to-Left) and font loading.
4. **Intent Classifier**: Scans keywords across 8 intent types (`wayfinding`, `transit`, `food`, `medical`, `accessibility`, `ticket`, `crowd`, `greeting`).
5. **Ambiguity Checker**: If the top two intents score within 30% of each other with low confidence, triggers a disambiguation message rather than returning a generic fallback.
6. **Context Assembler**: Gathers user profile, accessibility flags, ticket metadata, and chat history.
7. **Follow-up Detector**: Identifies patterns like `wayfinding` → `food` to proactively suggest food concession stands along the route.
8. **Response Generator**: Pairs context and intent to produce localized templates, fetching real-time data where required.
9. **Context Compressor**: Evicts older conversation items to prevent token overflow.

---

### 3-Tier Sliding Window Context Compression

To avoid chat history exceeding GenAI context limits, history is automatically compressed:

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER 1: Full Fidelity   │ Last 20 messages — complete text     │
│ TIER 2: Summarized      │ Messages 21–50  — intent + excerpt   │
│ TIER 3: Evicted → Digest│ 50+  — single system summary         │
└─────────────────────────────────────────────────────────────────┘
```

* **Priority Pinning**: Messages with `accessibility`, `ticket`, or `emergency` intents are **never evicted**, maintaining critical user preferences across arbitrarily long sessions.

---

## ⚡ Deployment on Vercel

PitchSync AI is pre-configured for instant Vercel deployment. Follow these steps to deploy your own instance:

### Option A: Using the Deploy Button (Recommended)
1. Click the **Deploy** button at the top of this README.
2. Log in with your GitHub, GitLab, or Bitbucket account.
3. Choose a name for your repository and click **Create**.
4. Vercel will clone the repository, run the build script, and deploy the application automatically.

### Option B: Deploying from an Existing Repository
1. Push your repository to GitHub (ensure it's on a single `main` branch).
2. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** → **Project**.
3. Import your project repository.
4. Vercel will auto-detect the configuration settings:
   - **Framework Preset**: `Vite` (Vite 6.x is auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy**. Your app will be live in less than a minute!

### What is Configured in `vercel.json`?
The repository contains a production-ready [vercel.json](file:///d:/PitchSyncAI/vercel.json) that configures:
- **SPA Routing**: Rewrites all client-side URL requests (`/(.*)`) to `index.html`, allowing the custom hash-based router to manage navigation seamlessly.
- **Asset Caching**: Configures immutable cache headers for compiled static assets (`/assets/(.*)`) with `max-age=31536000` (1 year) to optimize load speed and reduce network traffic.
- **Premium Security Headers**:
  - `X-Content-Type-Options: nosniff` (prevents mime-sniffing)
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-XSS-Protection: 1; mode=block` (forces XSS blocks)
  - `Referrer-Policy: strict-origin-when-cross-origin` (protects metadata)
  - `Strict-Transport-Security` (enforces HTTPS)

---

## ⚙️ How the Solution Works

### Prerequisites
- **Node.js** 18+
- **npm** 9+

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/akanksha-dot-dev/PitchSyncAI.git
cd PitchSyncAI

# 2. Install dependencies (Vite)
npm install

# 3. Start the dev server
npm run dev
# Server opens at http://localhost:5173

# 4. Run the automated test suite
npm run test

# 5. Build the production bundle
npm run build

# 6. Preview the production build locally
npm run preview
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Build** | Vite 6.x | Sub-second HMR, tree-shaking, fast builds |
| **Logic** | Vanilla JavaScript (ES2022) | Zero runtime overhead, native execution |
| **Styling** | CSS Custom Properties + Tailwind CSS | Custom design tokens + responsive utilities |
| **State** | Proxy-based Reactive Tree | Native Proxy observer pattern, no dependencies |
| **Routing** | Custom SPA Hash Router | Micro-router, zero external code, works offline |
| **Caching** | Dual-layer memory + LocalStorage | L1/L2 caching with TTL auto-promotions |
| **Security** | Prompt Injection + XSS Defenses | Active scanning/sanitization layers |
| **Testing** | Node.js Native Test Runner | `node --test`, zero testing packages, extremely fast |

---

## ♿ Accessibility (WCAG AAA)

- **Contrast**: Primary text uses `#1E40AF` (FIFA Blue) on `#FAFBFC` (Surface-50) yielding an **8.95:1** contrast ratio (exceeding WCAG AAA 7:1 limit). Verified by automated contrast checks.
- **Screen Reader**: Integrated ARIA live-regions (`aria-live="polite"` / `aria-live="assertive"`) announce chat replies, real-time alert updates, and mode switches.
- **Keyboard Navigation**: Focus-trap modal for Ops wizard, tab indexes on heatmap components, and skip-to-content accessibility link.
- **Motion**: respects `prefers-reduced-motion` to disable transitions.
- **HTML Attributes**: Dynamically updates `lang` and `dir` (RTL support for Arabic) at the document level.

---

## 🧪 Testing

PitchSync AI includes a comprehensive, zero-dependency test suite running on Node's native test runner (`node --test`).

```bash
npm run test
```

### Test Suite Summary

The test runner tests all critical core modules, services, utility functions, and pipelines.

| Test File | Tests | Coverage |
|-----------|-------|----------|
| [genai-engine.test.js](file:///d:/PitchSyncAI/src/tests/genai-engine.test.js) | 22 | NLP pipelines, prompt injection, intent classification, entity extraction |
| [context-manager.test.js](file:///d:/PitchSyncAI/src/tests/context-manager.test.js) | 11 | 3-tier context compression, priority pinning, token heuristics, follow-up intent detection |
| [state.test.js](file:///d:/PitchSyncAI/src/tests/state.test.js) | 7 | Reactive state tree, batch updates, shallow compare, subscribe lifecycle |
| [validators.test.js](file:///d:/PitchSyncAI/src/tests/validators.test.js) | 24 | HTML sanitization, prompt injection scanner, rate limiter, stadium gate constraints |
| [maps.test.js](file:///d:/PitchSyncAI/src/tests/maps.test.js) | 5 | Accessible route generation, low-sensory detour injection, elevator paths |
| [firebase.test.js](file:///d:/PitchSyncAI/src/tests/firebase.test.js) | 6 | Live simulation subscriptions, staff alerts pushing, state sync, simulations cleanup |
| [format.test.js](file:///d:/PitchSyncAI/src/tests/format.test.js) | 6 | Markdown format parser, XSS safety during formatting, list formatters |
| [events.test.js](file:///d:/PitchSyncAI/src/tests/events.test.js) | 4 | Pub/sub event broker, wildcard namespace matching, once subscriptions |
| [router.test.js](file:///d:/PitchSyncAI/src/tests/router.test.js) | 3 | Dynamic route parameter mapping, before routing guards, fallback routes |
| [transit.test.js](file:///d:/PitchSyncAI/src/tests/transit.test.js) | 5 | Upcoming departures calculations, countdown timers, density-driven surge schedules |
| [translation.test.js](file:///d:/PitchSyncAI/src/tests/translation.test.js) | 5 | Multilingual script language identification, dictionary lookups, translator fallbacks |
| [a11y.test.js](file:///d:/PitchSyncAI/src/tests/a11y.test.js) | 5 | WCAG color contrast validation |
| [constants.test.js](file:///d:/PitchSyncAI/src/tests/constants.test.js) | 9 | Threshold boundaries, mock ticket schemas, transit modes configuration |
| [integration.test.js](file:///d:/PitchSyncAI/src/tests/integration.test.js) | 8 | End-to-end processing pipeline, multi-turn state tracking, context compression lifecycle |
| **Total** | **120** | **100% Passing** |

---

## 📄 License

MIT License © 2026 — Built for the **Prompt War Hackathon**.
