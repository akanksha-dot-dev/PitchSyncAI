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

- **Crowd bottlenecks** at gates, concourses, and food courts with no real-time visibility
- **Language barriers** for international fans needing wayfinding, transit, and emergency help
- **Accessibility gaps** where wheelchair users, visually impaired fans, and sensory-sensitive attendees lack tailored guidance
- **Disconnected operations** where staff lack AI-driven situational awareness for proactive rerouting

### The Solution: Dual-Mode GenAI Architecture

PitchSync AI operates as a **unified Single Page Application (SPA) with two dynamic modes**, each targeting a distinct stakeholder group:

| Mode | Target User | Core Capabilities |
|------|-------------|-------------------|
| **🎟️ Fan Copilot** | International fans | Multilingual AI chat assistant, accessible wayfinding with route cards, live transit departure schedules, digital ticket wallet with offline save |
| **📊 Ops Command** | Stadium staff & volunteers | Real-time crowd density heatmap (SVG), 4 KPI metric cards with sparklines, AI-generated alert feed with acknowledge/resolve actions, staff resource deployment panel, proactive reroute validation wizard |

### GenAI Processing Pipeline

```
User Input → XSS Sanitization → Prompt Injection Defense → Language Detection → Intent Classification
                                                                                    ↓
                                                                            [Ambiguity Check]
                                                                             /             \
                                                                         (Low Conf.)    (High Conf.)
                                                                           /                 \
                                                              Disambiguation Prompt    Context Assembly
                                                                                             ↓
                                                                                    Follow-up Detection
                                                                                             ↓
                                                                                    Response Generation
                                                                                             ↓
                                                                                    Context Compression
                                                                                             ↓
                                                                                    Rich UI Card Rendering
```

**Intent Classification Engine**: Template-based NLP with multi-language keyword matching across 8 intent categories (`wayfinding`, `transit`, `food`, `medical`, `accessibility`, `ticket`, `crowd`, `greeting`) with confidence scoring (0.70–0.90).

**Prompt Injection Defense**: A dedicated regex-based scanner (`sanitizePromptInjection`) detects and neutralizes adversarial prompt patterns — instruction overrides, system prompt extraction, jailbreak attempts, and role impersonation — before any user input reaches intent classification. Zero-width unicode characters are also stripped to prevent invisible injection vectors.

**Follow-up Intent Detection**: The `detectFollowUp()` function in the context manager analyses sequential intent patterns to identify contextual transitions (e.g. `wayfinding` → `food` triggers "food along the route" suggestions, `transit` → `wayfinding` triggers "walking directions from drop-off" enrichment).

**Ambiguity Disambiguation**: When the top two intent candidates score within 30% of each other and confidence is below 0.3, the engine triggers a clarification prompt asking the user to specify their need rather than guessing incorrectly.

### Adaptive Context Compression (3-Tier Sliding Window)

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER 1: Full Fidelity   │ Last 20 messages — complete text     │
│ TIER 2: Summarized      │ Messages 21–50  — intent + excerpt   │
│ TIER 3: Evicted → Digest│ 50+  — single system summary         │
└─────────────────────────────────────────────────────────────────┘
```

**Priority Pinning**: Messages containing accessibility preferences, ticket data, or emergency intents are **never evicted** regardless of window position. This ensures the AI retains critical user context (e.g. wheelchair preferences, ticket seat info) across arbitrarily long conversations.

### Real-Time Ops Data Flow

```
Firebase Mock (5s interval) → Crowd Density Updates → Reactive State Manager
    ↓                                                        ↓
Smooth ±5% transitions                          Heatmap SVG + KPI Metrics
    ↓                                                        ↓
Alert Threshold (>85%)                              AI Alert Generation
    ↓                                                        ↓
Ops Alert Feed                              Reroute Validation Wizard
```

The **Validation Wizard** runs 4 automated checks before approving any crowd reroute:
1. **Reroute Proposal** — Summary of the proposed action with affected zones
2. **Accessibility Pathway Check** — Detects conflicts with wheelchair/elevator routes
3. **Transit Capacity Check** — Validates that redirected flow won't exceed shuttle capacity
4. **Impact Summary** — Pass/Warning/Fail decision with actionable recommendations

---

## ⚙️ How the Solution Works

### Prerequisites

- **Node.js** 18+ installed
- **npm** (bundled with Node.js)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/akanksha-dot-dev/PitchSyncAI.git
cd PitchSyncAI

# 2. Install dependencies (single dev dependency: Vite)
npm install

# 3. Start the development server
npm run dev
# Opens at http://localhost:5173

# 4. Run the test suite
npm run test

# 5. Build for production
npm run build

# 6. Preview the production build
npm run preview
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|---------  |
| Build | Vite 6.x | Sub-second HMR, tree-shaking, zero-config |
| Logic | Vanilla JavaScript (ES2022) | Zero runtime dependencies, maximum control |
| Styling | CSS Custom Properties + Tailwind CDN | Design tokens + utility classes, 0 bytes in repo |
| State | Proxy-based reactive system | No library needed, native browser performance |
| Routing | Custom hash-based SPA router | Lightweight, no history API complexity |
| Caching | localStorage + in-memory Map | Dual-layer with TTL and auto-save |
| Security | Prompt Injection + XSS Defenses | Multi-layer sanitization pipeline |
| Testing | Node.js native test runner | Zero test dependencies, `node --test` |
| Real-time | Mocked Firebase with `setInterval` | Drop-in production replacement ready |

### Deploying to Vercel

PitchSync AI is pre-configured for instant Vercel deployment:

1. Push to GitHub (single `main` branch)
2. Go to [vercel.com/new](https://vercel.com/new) → Import Git Repository
3. Vercel auto-detects Vite:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Deploy** ✅

The included `vercel.json` configures:
- **SPA Routing**: All paths rewrite to `index.html`
- **Asset Caching**: Immutable caching for hashed assets (1 year)
- **Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block`

### File Structure

```
PitchSyncAI/
├── index.html              # Semantic HTML5 shell with Tailwind CDN
├── package.json            # Single dev dependency (vite)
├── vite.config.js          # Vite build configuration
├── vercel.json             # Deployment routing + security headers
├── README.md               # This file
├── .gitignore              # Strict exclusions (node_modules, dist, .env)
├── public/
│   └── favicon.svg         # FIFA-themed SVG icon
└── src/
    ├── main.js             # App bootstrap + routing + mode switching
    ├── core/               # State management, events, cache, router
    │   ├── state.js        # Proxy-based reactive state with batch(), subscribe()
    │   ├── events.js       # Pub/sub event bus with namespace wildcards
    │   ├── router.js       # Hash-based SPA router with guards
    │   └── cache.js        # Dual-layer L1/L2 caching with TTL
    ├── services/           # GenAI engine, context manager, mock APIs
    │   ├── genai-engine.js # Intent classifier, entity extractor, response gen
    │   ├── context-manager.js  # 3-tier context compression + follow-up detection
    │   ├── firebase.js     # Mock real-time crowd & alert data
    │   ├── maps.js         # Mock accessible wayfinding routes
    │   ├── transit.js      # Mock transit schedules with surge detection
    │   └── translation.js  # Script detection + dictionary translation
    ├── components/         # 10 UI components (chat, heatmap, alerts, etc.)
    │   ├── chat.js         # GenAI chat with rich cards + quick replies
    │   ├── heatmap.js      # SVG crowd density visualization
    │   ├── alert-feed.js   # Real-time ops alerts with ack/resolve
    │   ├── header.js       # Mode toggle + language selector
    │   ├── ticket-card.js  # Digital ticket with offline save
    │   ├── transit-card.js # Live departure schedules
    │   ├── stadium-map.js  # Interactive zone navigation
    │   ├── metrics-panel.js # KPI cards with sparklines
    │   ├── resource-panel.js # Staff deployment tracker
    │   └── validation-wizard.js # 4-step reroute validation
    ├── utils/              # DOM helpers, a11y, validators, constants
    │   ├── validators.js   # XSS sanitizer, prompt injection defense, rate limiter
    │   ├── a11y.js         # WCAG AAA: live regions, focus traps, contrast
    │   ├── dom.js          # Hyperscript h(), $, $$, debounce, throttle
    │   ├── format.js       # Markdown-to-HTML safe formatter
    │   └── constants.js    # Stadium zones, venues, thresholds, templates
    ├── styles/             # CSS design system (variables, base, components)
    └── tests/              # 120 tests across 14 test files
        ├── genai-engine.test.js     # Intent pipeline + prompt injection
        ├── context-manager.test.js  # Compression + follow-up detection
        ├── state.test.js            # Reactive state + batch updates
        ├── validators.test.js       # XSS + injection + rate limiter
        ├── maps.test.js             # Accessible wayfinding routes
        ├── firebase.test.js         # Live simulations + alert push
        ├── format.test.js           # Safe markdown formatting
        ├── a11y.test.js             # WCAG contrast validation
        ├── constants.test.js        # Threshold + data integrity
        ├── integration.test.js      # End-to-end pipeline flows
        ├── router.test.js           # Route matching + guards
        ├── events.test.js           # Pub/sub + wildcards
        ├── transit.test.js          # Schedules + surge detection
        └── translation.test.js      # Language detection + translation
```

---

## 📋 Assumptions Made

1. **Mocked Google APIs**: Google Cloud Translation, Maps Platform, and Firebase Firestore are simulated with realistic latencies (100–400ms) and functional contract structures. Each mock service in `src/services/` is architected as a drop-in replacement — swap the internals with real SDK clients without modifying any component code.

2. **No Exposed API Keys**: Zero API keys are present in the client-side code. The `validateApiKey()` utility actively detects potential key leaks. In production, keys would be injected via Vercel environment variables (`VITE_*` prefix).

3. **Stadium Cell Network Congestion**: Cell service inside stadiums during matches is severely congested. The app addresses this with:
   - Offline-first architecture using localStorage snapshots
   - Digital ticket saved for offline access
   - Tailwind loaded via CDN (0 bytes in repository)
   - Total production bundle under 100 KB gzipped

4. **Crowd Flow Algorithms**: Crowd density trends (rising/falling/stable) are simulated via smooth ±5% transitions per 5-second tick. A density threshold above 85% automatically generates AI alerts for operations staff. This models realistic crowd dynamics without requiring real sensor data.

5. **Ops Mode Access Control**: Authentication for Ops Command mode is intentionally unrestricted in this demo to allow judges to freely audit both modes. In production, Ops mode would require staff authentication via Firebase Auth.

6. **Real FIFA 2026 Venues**: The app uses actual FIFA World Cup 2026 host city data (MetLife Stadium, NJ) and realistic venue configurations (16 zones, 6 gates, medical stations, food courts) for maximum problem-statement alignment.

---

## ♿ Accessibility (WCAG AAA)

- **Contrast**: Primary text uses `#1E40AF` on `#FAFBFC` — **8.95:1** contrast ratio (exceeds 7:1 AAA requirement)
- **Screen Reader**: ARIA live-regions for chat messages, zone density announcements, and alert notifications
- **Keyboard**: Full tab navigation, Enter/Space activation, focus traps in modal wizard
- **Skip Link**: Hidden skip-to-content link for keyboard-first users
- **Reduced Motion**: `prefers-reduced-motion` media query disables all animations
- **Accessible Routes**: Wayfinding engine modifies routes for wheelchair, elevator, and low-sensory paths
- **RTL Support**: Dynamic `lang` and `dir` attributes on `<html>` for Arabic and other RTL languages
- **Noscript Fallback**: `<noscript>` element for users without JavaScript

---

## 🧪 Testing

PitchSync AI includes a comprehensive, zero-dependency test suite using Node.js's native test runner:

```bash
npm run test
```

| Test Suite | Tests | Coverage |
|-----------|-------|---------|
| `genai-engine.test.js` | 22 | NLP pipelines, prompt injection defense, intent classification, entity extraction, XSS safety |
| `context-manager.test.js` | 11 | Token estimation, 3-tier context compression, priority pinning, follow-up detection, context assembly |
| `state.test.js` | 7 | Proxy reactivity, subscriber notification, batch updates without double-fire, state reset, snapshots |
| `validators.test.js` | 24 | XSS sanitization, prompt injection scanner, message validation, rate limiter, gate/zone checks, API key leak detection |
| `maps.test.js` | 5 | Accessible route generation, low-sensory detour injection, elevator path substitution |
| `firebase.test.js` | 6 | Live crowd data subscriptions, alert pushing, state sync, cleanup lifecycle |
| `format.test.js` | 6 | Markdown formatting, XSS safety during formatting, combined formatting |
| `a11y.test.js` | 5 | WCAG AAA contrast ratio validation |
| `constants.test.js` | 9 | Density threshold ordering, crowd data generator, transit schedules, venue/zone integrity |
| `integration.test.js` | 8 | End-to-end pipeline, multi-turn context tracking, compression lifecycle, XSS through pipeline |
| `events.test.js` | 4 | Pub/sub event broker, wildcard namespace matching, once subscriptions |
| `router.test.js` | 3 | Dynamic route matching, navigation guards, 404 fallback |
| `transit.test.js` | 5 | Schedule caching, mode filtering, countdown calculation, surge scheduling |
| `translation.test.js` | 5 | Script detection (Latin/CJK/Arabic/Devanagari), dictionary lookups, language listing |
| **Total** | **120** | **All passing ✅** |

---

## 📄 License

MIT License © 2026 — Built for the **Prompt War Hackathon**.
