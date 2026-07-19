# PitchSync AI 🏟️⚽

> **GenAI-Powered Dual-Mode Stadium Operations & Fan Experience Platform for FIFA World Cup 2026™**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/akanksha-dot-dev/PitchSyncAI)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

🔗 **Live Demo**: [https://pitchsync-ai.vercel.app](https://pitchsync-ai.vercel.app)

---

## 📌 Chosen Vertical & Problem Alignment

### Vertical
**Stadium Operations & Fan Experience (FIFA World Cup 2026™)**

### Core Objective
To build a **smart, dynamic assistant** with **logical decision-making based on user context** (accessibility needs, ticket location, language, and real-time stadium density).

### Core Operational Challenges Solved
1. **Crowd Bottlenecks & Overcrowding**: Gates, concourses, and food courts suffer from sudden congestion with zero real-time visibility for fans or operations staff.
2. **Multilingual Communication Gaps**: Over 80,000 international fans per venue speaking 10+ languages need immediate, context-aware assistance for wayfinding, transit, and emergency help.
3. **Accessibility Obstacles**: Fans with wheelchairs, visual impairments, or sensory sensitivities lack real-time detour routes that dynamically avoid crowded or inaccessible stadium areas.
4. **Siloed Operations Management**: Stadium operational staff lack AI-assisted situational awareness to execute proactive crowd rerouting without creating secondary bottlenecks.

---

## 💡 The Solution: Dual-Mode GenAI Architecture

PitchSync AI provides a single, high-performance Single Page Application (SPA) with **two dynamic operating modes**:

```
                                 ┌───────────────────────────────┐
                                 │       PitchSync AI SPA        │
                                 └──────────────┬────────────────┘
                                                │
                      ┌─────────────────────────┴─────────────────────────┐
                      ▼                                                   ▼
            🎟️ Fan Copilot Mode                                 📊 Ops Command Mode
   ──────────────────────────────────                  ───────────────────────────────────
   • Multilingual AI Chat Assistant                    • Real-Time Crowd Heatmap (SVG)
   • Context-Aware Accessible Routing                  • 4 Key Performance Metric Sparklines
   • Live Transit Departure Schedules                  • Real-Time Staff Alert Feed
   • Digital Ticket Wallet & Save                      • Staff Resource Auto-Balancer
   • Instant Quick-Reply Chips                         • 4-Step Reroute Validation Wizard
```

---

## 🏗️ Technical Architecture & GenAI Pipeline

### 1. GenAI NLP Processing Engine

Every incoming fan query undergoes a multi-stage, security-hardened natural language processing pipeline:

```
[User Input] 
     │
     ▼
┌─────────────────────────┐
│  1. XSS Sanitization    │ ── DOM-based & regex escaping (zero script injection)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 2. Prompt Injection Sec │ ── Neutralizes instruction overrides & adversarial prompts
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 3. Language Detection   │ ── ISO 639-1 script analysis & dynamic RTL layout sync
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 4. Intent Classification│ ── Multi-signal keyword matching across 8 intent types
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 5. Entity Extraction    │ ── Extract Gates (A-H), Sections, Rows, Seats, and Zones
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 6. Ambiguity Check      │ ── Low confidence (<0.3) triggers disambiguation prompt
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 7. Context Assembly     │ ── Merges Accessibility Prefs, Ticket Data & User Profile
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 8. Follow-up Detection  │ ── Recognizes intent sequences (e.g. wayfinding → food)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 9. Response Generation  │ ── Generates localized markdown & rich UI element payloads
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 10. Context Compression │ ── 3-Tier sliding window with priority message pinning
└──────────┬──────────────┘
           │
           ▼
 [Rich Card UI Render]
```

### 2. Adaptive Context Compression (3-Tier Sliding Window)

To maintain conversation history within context window limits without losing critical user preferences, the context manager applies a 3-tier sliding window strategy:

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER 1: Full Fidelity   │ Last 20 messages — complete text     │
│ TIER 2: Summarized      │ Messages 21–50  — intent + excerpt   │
│ TIER 3: Evicted → Digest│ 50+  — single system summary         │
└─────────────────────────────────────────────────────────────────┘
```

* **Priority Pinning**: Messages containing `accessibility`, `ticket`, or `emergency` intents are **never evicted**, guaranteeing that wheelchair preferences or seat locations persist throughout the entire session.

### 3. Real-Time Ops Data Flow & Validation Wizard

```
Firebase Simulation Stream (5s interval)
           │
           ▼
    Reactive State Proxy ──────────────► SVG Heatmap & KPI Metrics Updates
           │
           ▼
Density Alert (>85% Threshold)
           │
           ▼
   Ops Alert Feed Trigger
           │
           ▼
  [Validation Wizard] ──► 1. Reroute Proposal Summary
                          2. Accessibility Pathway Check (Wheelchair detour conflicts)
                          3. Transit Capacity Check (Shuttle bottleneck prevention)
                          4. Impact Summary & Recommendation (Pass / Warning / Fail)
```

---

## 📊 Feature Capability Matrix

| Feature | Stakeholder | AI / Logic Decision | Real-World Value |
|---------|-------------|---------------------|------------------|
| **Multilingual AI Assistant** | Fans | Script detection & intent classification across 10 languages | Eliminates language barriers for 80,000+ international fans |
| **Accessible Wayfinding** | Fans | Swaps stairs/escalators for ramps/elevators when wheelchair flag is active | WCAG AAA compliant navigation for disabled attendees |
| **Crowd-Aware Rerouting** | Fans | Injects crowd density alerts into route guidance if destination >75% | Prevents fans from walking into concourse bottlenecks |
| **Follow-up Intent Hinting** | Fans | Pattern matching (`wayfinding` → `food`) suggests food along the route | Enhances fan experience and increases concession revenue |
| **Real-Time Heatmap** | Ops Staff | Dynamic SVG fill color calculation based on live density percentage | Provides staff instant visual situational awareness |
| **Proactive Alert Feed** | Ops Staff | Auto-pushes alerts when density crosses 85% threshold | Enables proactive crowd control before incidents occur |
| **Staff Resource Auto-Balancer** | Ops Staff | Proportional allocation algorithm distributing staff to hot zones | Optimizes security and medical personnel deployment |
| **Reroute Validation Wizard** | Ops Staff | 4-step conflict checker verifying accessibility & shuttle capacity | Prevents staff from causing secondary crowd bottlenecks |

---

## 🎯 Constraint Compliance Checklist

| Constraint | Requirement | Implementation | Status |
|------------|-------------|----------------|--------|
| **Repository Size** | Under 10MB | Total repository size is **< 1MB** (zero heavy node_modules committed) | ✅ PASS |
| **Git Branches** | Single Branch | Strictly built and maintained on single `main` branch | ✅ PASS |
| **Real-World Usability** | High functionality | Offline ticket saving, L1/L2 caching, resilient fallback state | ✅ PASS |
| **Test Suite** | Comprehensive | **120 tests passing (100% pass rate)** using native Node harness | ✅ PASS |
| **Security** | High score | Prompt injection defense + DOM XSS sanitization + API key leak scanner | ✅ PASS |
| **Accessibility** | High score | WCAG AAA contrast (8.95:1), ARIA live-regions, focus traps, RTL support | ✅ PASS |

---

## 📋 Technical Assumptions & Architecture

1. **Modular Mock Services as Production SDK Contracts**: Google Cloud Translation, Maps Platform, and Firebase Firestore are architected inside `src/services/` with clean interface contracts. Replacing mocks with live SDK clients requires changing only the internal fetch calls without altering UI code.
2. **Zero Exposed API Keys**: No credentials or API keys are stored in the client codebase. The `validateApiKey()` function actively scans inputs to prevent credential leaks.
3. **Network Resilience & Cell Congestion**: Designed for high-density stadium environments with cell network congestion:
   - Offline-first architecture with localStorage snapshotting
   - Tailwind loaded via lightweight CDN (0 bytes in repository)
   - Total production bundle under 100 KB gzipped
4. **Crowd Simulation Dynamics**: Real-time crowd density changes are generated via smooth ±5% transitions per 5-second tick, modeling realistic crowd movement.

---

## ⚡ Quick Start & Deployment

### Prerequisites
- **Node.js** 18+ installed
- **npm** (bundled with Node.js)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/akanksha-dot-dev/PitchSyncAI.git
cd PitchSyncAI

# 2. Install dependencies (Vite)
npm install

# 3. Run development server
npm run dev
# Server opens at http://localhost:5173

# 4. Run native test suite (120 tests)
npm run test

# 5. Build production bundle
npm run build

# 6. Preview production build
npm run preview
```

### Vercel Deployment

PitchSync AI includes a pre-configured `vercel.json` for single-click deployment:

1. Push commit to GitHub (`main` branch)
2. Import repository on [Vercel Dashboard](https://vercel.com/new)
3. Vercel auto-detects Vite configuration (`npm run build`, output: `dist`)
4. Click **Deploy** ✅

Included `vercel.json` configures SPA rewrites, 1-year asset caching, and security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `X-XSS-Protection`).

---

## 📁 File Structure

```
PitchSyncAI/
├── index.html              # Semantic HTML5 shell with Tailwind CDN
├── package.json            # Package metadata & single dev dependency (vite)
├── vite.config.js          # Vite build configuration
├── vercel.json             # Deployment SPA routing + security headers
├── README.md               # Complete project documentation
├── .gitignore              # Strict exclusions (node_modules, dist, .env)
├── public/
│   └── favicon.svg         # FIFA-themed SVG icon
└── src/
    ├── main.js             # App bootstrap + routing + mode switching
    ├── core/               # Reactive state, pub/sub events, router, L1/L2 cache
    │   ├── state.js        # Proxy-based reactive state with batch() & subscribe()
    │   ├── events.js       # Pub/sub event bus with namespace wildcards
    │   ├── router.js       # Hash-based SPA router with navigation guards
    │   └── cache.js        # Dual-layer L1/L2 caching with TTL & snapshotting
    ├── services/           # GenAI processing, context compression, mock APIs
    │   ├── genai-engine.js # Intent classification, entity extraction, response gen
    │   ├── context-manager.js  # 3-tier context compression + follow-up detection
    │   ├── firebase.js     # Real-time crowd & alert data simulation stream
    │   ├── maps.js         # Accessible wayfinding route generator
    │   ├── transit.js      # Transit schedules & surge scheduling
    │   └── translation.js  # Script identification & dictionary translator
    ├── components/         # 10 modular UI components
    │   ├── chat.js         # GenAI chat UI with rich cards & quick replies
    │   ├── heatmap.js      # SVG crowd density visualization overlay
    │   ├── alert-feed.js   # Real-time ops alerts with ack/resolve actions
    │   ├── header.js       # Mode toggle + language selector + status indicator
    │   ├── ticket-card.js  # Digital ticket with offline save capability
    │   ├── transit-card.js # Live departure countdown schedules
    │   ├── stadium-map.js  # Interactive zone navigation overlay
    │   ├── metrics-panel.js # 4 KPI cards with inline SVG sparklines
    │   ├── resource-panel.js # Staff deployment tracker & auto-balancer
    │   └── validation-wizard.js # 4-step reroute validation modal
    ├── utils/              # DOM helpers, WCAG AAA a11y, validators, constants
    │   ├── validators.js   # XSS sanitizer, prompt injection scanner, rate limiter
    │   ├── a11y.js         # WCAG AAA: live regions, focus traps, contrast check
    │   ├── dom.js          # Hyperscript h(), $, $$, debounce, throttle
    │   ├── format.js       # Safe markdown-to-HTML formatter
    │   └── constants.js    # Stadium zones, venues, thresholds, templates
    ├── styles/             # Modular CSS design system
    └── tests/              # 120 tests across 14 test modules
        ├── genai-engine.test.js     # Intent pipeline & prompt injection (22 tests)
        ├── context-manager.test.js  # 3-tier compression & follow-up (11 tests)
        ├── state.test.js            # Proxy reactivity & batching (7 tests)
        ├── validators.test.js       # XSS & prompt injection scanner (24 tests)
        ├── maps.test.js             # Accessible wayfinding routes (5 tests)
        ├── firebase.test.js         # Live simulations & alert pushing (6 tests)
        ├── format.test.js           # Markdown HTML formatting (6 tests)
        ├── a11y.test.js             # WCAG contrast checking (5 tests)
        ├── constants.test.js        # Data & threshold integrity (9 tests)
        ├── integration.test.js      # E2E pipeline & context lifecycle (8 tests)
        ├── events.test.js           # Event bus & namespace wildcards (4 tests)
        ├── router.test.js           # Route matching & guards (3 tests)
        ├── transit.test.js          # Schedules & surge detection (5 tests)
        └── translation.test.js      # Language detection & translation (5 tests)
```

---

## 🧪 Comprehensive Test Suite

PitchSync AI features a zero-dependency automated test suite using Node.js's native test runner (`node --test`).

```bash
npm run test
```

### Test Suite Execution Output
```
✔ State snapshotting save and restore
✔ density thresholds are ordered correctly
✔ generateCrowdData returns valid zone data
✔ processMessage: wheelchair context routes via accessible path
✔ processMessage: prompt injection is neutralized
✔ integration: full pipeline — user message to AI response
✔ integration: multi-turn conversation with context tracking
✔ integration: accessibility profile affects all wayfinding responses
...
ℹ tests 120
ℹ pass 120
ℹ fail 0
ℹ duration_ms 3541.78
```

---

## 📄 License

MIT License © 2026 — Built for the **Prompt War Hackathon**.
