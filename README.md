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
User Input → XSS Sanitization → Language Detection → Intent Classification → Context Assembly → Response Generation → Rich UI Card Rendering
```

**Intent Classification Engine**: Template-based NLP with multi-language keyword matching across 8 intent categories (`wayfinding`, `transit`, `food`, `medical`, `accessibility`, `ticket`, `crowd`, `greeting`) with confidence scoring (0.70–0.90).

**Adaptive Context Compression**: A 3-tier sliding window algorithm prevents conversation overflow:

| Tier | Messages | Treatment |
|------|----------|-----------|
| Full Fidelity | Last 20 | Complete text preserved |
| Summarized | 21–50 | Intent + entities only |
| Evicted → Digest | 50+ | Compressed into a single system summary |

**Priority Pinning**: Messages containing accessibility preferences or ticket data are never evicted.

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

The Validation Wizard runs 4 automated checks before approving any crowd reroute:
1. **Reroute Proposal** — Summary of the proposed action
2. **Accessibility Pathway Check** — Detects conflicts with wheelchair routes
3. **Transit Capacity Check** — Validates that redirected flow won't exceed shuttle capacity
4. **Impact Summary** — Pass/Warning/Fail decision with recommendations

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
|-------|-----------|-----------|
| Build | Vite 6.x | Sub-second HMR, tree-shaking, zero-config |
| Logic | Vanilla JavaScript (ES2022) | Zero runtime dependencies, maximum control |
| Styling | CSS Custom Properties + Tailwind CDN | Design tokens + utility classes, 0 bytes in repo |
| State | Proxy-based reactive system | No library needed, native browser performance |
| Routing | Custom hash-based SPA router | Lightweight, no history API complexity |
| Caching | localStorage + in-memory Map | Dual-layer with TTL and auto-save |
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
- **Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`

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
    ├── services/           # GenAI engine, context manager, mock APIs
    ├── components/         # 10 UI components (chat, heatmap, alerts, etc.)
    ├── utils/              # DOM helpers, a11y, validators, constants
    ├── styles/             # CSS design system (variables, base, components)
    └── tests/              # Native Node.js unit tests
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

6. **Real FIFA 2026 Venues**: The app uses actual FIFA World Cup 2026 host city data (MetLife Stadium, NJ) and realistic venue configurations for maximum problem-statement alignment.

---

## ♿ Accessibility (WCAG AAA)

- **Contrast**: Primary text uses `#1E40AF` on `#FAFBFC` — **8.95:1** contrast ratio (exceeds 7:1 AAA requirement)
- **Screen Reader**: ARIA live-regions for chat messages, zone density announcements, and alert notifications
- **Keyboard**: Full tab navigation, Enter/Space activation, focus traps in modal wizard
- **Skip Link**: Hidden skip-to-content link for keyboard-first users
- **Reduced Motion**: `prefers-reduced-motion` media query disables all animations
- **Accessible Routes**: Wayfinding engine modifies routes for wheelchair, elevator, and low-sensory paths

---

## 🧪 Testing

PitchSync AI includes a zero-dependency test suite using Node.js's native test runner:

```bash
npm run test
```

| Test Suite | Coverage |
|-----------|----------|
| `validators.test.js` | XSS sanitization, message validation, rate limiter, gate/zone checks, API key leak detection |
| `context-manager.test.js` | Token estimation, 3-tier context compression, priority pinning, context assembly |
| `state.test.js` | Proxy reactivity, subscriber notification, batch updates, state reset |

---

## 📄 License

MIT License © 2026 — Built for the **Prompt War Hackathon**.
