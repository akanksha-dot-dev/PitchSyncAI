# FIFA MatchDay GenAI Nexus 🏟️⚽

> **GenAI-Powered Dual-Mode Stadium Operations Platform for FIFA World Cup 2026™**

A production-ready, ultra-lightweight web application delivering AI-powered real-time stadium intelligence through two dynamic modes: **Fan Copilot** for multilingual fan assistance and **Ops Command** for crowd management and operational decision support.

[![Vercel Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)
[![Size](https://img.shields.io/badge/Bundle-<1MB-green.svg)](#)

---

## 🎯 Chosen Approach

### Dual-Mode Architecture

The application operates as a **unified SPA with two dynamic states**, each targeting a distinct stakeholder group at the FIFA World Cup 2026:

| Mode | Target User | Primary Functions |
|------|-------------|-------------------|
| **🎟️ Fan Copilot** | International fans | Multilingual GenAI chat, accessible wayfinding, live transit schedules, digital ticket management |
| **📊 Ops Command** | Stadium staff & volunteers | Real-time crowd density heatmap, AI-generated alerts, staff resource deployment, reroute validation |

### Why This Approach?

1. **Maximum Impact**: Addresses both sides of the stadium experience — fans and operations — through a single codebase
2. **Real-world Viability**: Every feature maps to an actual FIFA World Cup 2026 operational need
3. **Accessibility First**: WCAG AAA compliance ensures the diverse, international fan base can use the system
4. **Network Resilience**: Offline-first architecture with localStorage snapshots — critical in congested stadium cell networks

---

## 🧠 Data & Assistant Logic Flow

### GenAI Processing Pipeline

```
Fan/Staff Input → Sanitization → Language Detection → Intent Classification → Context Assembly → Response Generation → Rich UI Rendering
```

#### Intent Classification Engine

The GenAI engine uses a multi-language keyword pattern matching classifier with confidence scoring:

| Intent | Keywords (Sample) | Confidence | Response Type |
|--------|-------------------|------------|---------------|
| `wayfinding` | navigate, find, seat, directions | 0.85 | Route card with steps |
| `transit` | bus, metro, shuttle, schedule | 0.85 | Transit schedule embed |
| `food` | food, eat, hungry, drink | 0.80 | Nearby food list |
| `medical` | doctor, emergency, hurt | 0.90 | Medical station info |
| `accessibility` | wheelchair, elevator, ramp | 0.85 | Accessible route options |
| `ticket` | ticket, pass, seat number | 0.80 | Digital ticket card |
| `crowd` | crowded, wait, queue, density | 0.75 | Live density report |
| `greeting` | hello, hi, help, start | 0.70 | Welcome message |

#### Adaptive Context Compression

A 3-tier sliding window algorithm maintains conversation quality under high load:

```
Tier 1: Full Fidelity     (last 20 messages) — complete text
Tier 2: Summarized         (messages 21-50)   — intent + entities only
Tier 3: Evicted → Digest   (messages 50+)     — single system digest
```

**Priority pinning**: Messages containing accessibility preferences or ticket data are never evicted.

### Real-Time Data Flow (Ops Mode)

```
Firebase Mock (5s interval) → Crowd Density Updates → State Manager → Heatmap SVG + Metrics + Alert Engine
                                                                    ↓
                                                          Alert Threshold Check (>85%)
                                                                    ↓
                                                          AI Alert Generation → Alert Feed
                                                                    ↓
                                                          Reroute Validation Wizard (if triggered)
```

---

## 🔌 Integration & Testing Matrix

### Google Services Integration

| Service | Status | Implementation | Swap to Production |
|---------|--------|----------------|-------------------|
| **Google Cloud Translation API** | 🟡 Mocked | 10-language phrase dictionary + language detection patterns | Replace `translation.js` internals with `googleapis` client |
| **Google Maps Platform** | 🟡 Mocked | SVG stadium map + pre-built route data with accessibility modifiers | Replace `maps.js` with Maps JS API + Directions Service |
| **Google Firebase/Firestore** | 🟡 Mocked | `setInterval`-based crowd simulation + subscriber pattern | Replace `firebase.js` with `firebase/firestore` SDK |

> **Security Note**: No API keys are exposed in the client. All mock services are structured as drop-in replacements — swap the service file internals without changing any component code.

### Edge Case Testing Matrix

| Scenario | Handling | Component |
|----------|----------|-----------|
| Empty chat input | `validateMessage()` blocks send | `chat.js` + `validators.js` |
| XSS in user input | `sanitizeHTML()` escapes all HTML entities | `validators.js` |
| Transit data fails | Graceful empty state with retry button | `transit-card.js` |
| Offline mode | localStorage snapshot restoration, visual indicator | `cache.js` + `header.js` |
| Language switch mid-chat | Quick replies update, AI responds in new language | `chat.js` + `genai-engine.js` |
| High density (>85%) | Pulse animation on zones, auto-alert generation | `stadium-map.js` + `firebase.js` |
| Accessibility reroute conflict | Validation wizard Step 2 warns ops staff | `validation-wizard.js` |
| Transit capacity exceeded | Validation wizard Step 3 blocks reroute | `validation-wizard.js` |
| Quota exceeded on localStorage | `pruneStorage()` removes oldest 25% of entries | `cache.js` |
| Rapid message sending | `createRateLimiter()` prevents abuse | `validators.js` |
| Conversation overflow (50+ msgs) | 3-tier context compression activates | `context-manager.js` |
| Network reconnect | `online` event restores real-time sync | `main.js` |

---

## 🏗️ Architecture

### File Structure

```
PitchSyncAI/
├── index.html                   # Semantic HTML5 entry point
├── vite.config.js               # Vite build configuration
├── package.json                 # Single dev dependency (vite)
├── vercel.json                  # Deployment routing + security headers
├── README.md                    # This file
├── public/
│   └── favicon.svg              # FIFA-themed icon
└── src/
    ├── main.js                  # App bootstrap + routing
    ├── styles/
    │   ├── variables.css        # Design tokens (colors, typography, spacing)
    │   ├── base.css             # Modern reset + WCAG AAA styles
    │   ├── components.css       # Reusable component library
    │   ├── fan-mode.css         # Fan Copilot layout + chat styles
    │   └── ops-mode.css         # Ops Command dashboard styles
    ├── core/
    │   ├── state.js             # Proxy-based reactive state manager
    │   ├── events.js            # Pub/sub event bus
    │   ├── cache.js             # Dual-layer cache (Memory + localStorage)
    │   └── router.js            # Hash-based SPA router
    ├── services/
    │   ├── genai-engine.js      # Intent classification + response generation
    │   ├── context-manager.js   # 3-tier adaptive context compression
    │   ├── translation.js       # Google Translation API (mocked)
    │   ├── maps.js              # Google Maps Platform (mocked)
    │   ├── firebase.js          # Firebase/Firestore (mocked)
    │   └── transit.js           # Transit schedule service
    ├── components/
    │   ├── header.js            # Branding + mode toggle + language selector
    │   ├── chat.js              # GenAI chat interface
    │   ├── stadium-map.js       # Interactive SVG stadium map
    │   ├── transit-card.js      # Transit departure cards
    │   ├── ticket-card.js       # Digital ticket display
    │   ├── heatmap.js           # Crowd density heatmap (Ops)
    │   ├── metrics-panel.js     # KPI dashboard cards (Ops)
    │   ├── alert-feed.js        # AI-generated alert feed (Ops)
    │   ├── resource-panel.js    # Staff deployment panel (Ops)
    │   └── validation-wizard.js # Reroute conflict checker (Ops)
    └── utils/
        ├── dom.js               # DOM helpers + hyperscript
        ├── a11y.js              # Accessibility utilities
        ├── validators.js        # Input validation + sanitization
        └── constants.js         # Mock data + stadium definitions
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Build | Vite 6.x | Sub-second HMR, zero-config, tree-shaking |
| Logic | Vanilla JavaScript (ES2022) | Zero runtime dependencies, maximum control |
| Styling | CSS Custom Properties + Tailwind CDN | Design tokens + utility classes, 0 bytes in repo |
| State | Proxy-based reactive system | No library needed, native performance |
| Routing | Custom hash router | Lightweight, no history API complexity |
| Caching | localStorage + in-memory Map | Dual-layer with TTL and auto-save |
| Real-time | Mocked Firebase with `setInterval` | Drop-in replacement ready |

---

## 🚀 Vercel Deployment Guidelines

### Prerequisites

- Node.js 18+ installed
- Vercel CLI: `npm i -g vercel`

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy to Vercel

#### Option 1: Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy (follows vercel.json config)
vercel

# Deploy to production
vercel --prod
```

#### Option 2: Git Integration

1. Push to GitHub/GitLab/Bitbucket
2. Import project on [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Vite, configures build:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Deploy ✅

### Deployment Configuration

The `vercel.json` includes:
- **SPA Routing**: All paths rewrite to `index.html`
- **Asset Caching**: Immutable caching for hashed assets (1 year)
- **Security Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`

### Environment Variables (Production)

When integrating real Google APIs, set these in Vercel dashboard:

```
VITE_GOOGLE_MAPS_KEY=AIza...
VITE_FIREBASE_CONFIG={"apiKey":"...","projectId":"..."}
VITE_TRANSLATION_KEY=AIza...
```

---

## ♿ Accessibility (WCAG AAA)

- **Contrast**: 7:1 minimum ratio (slate-800 on off-white)
- **Focus**: Visible 3px blue outline on all interactive elements
- **Keyboard**: Full tab navigation, arrow key support in lists
- **Screen Reader**: ARIA live regions, role attributes, aria-labels
- **Motion**: `prefers-reduced-motion` disables all animations
- **Skip Link**: Hidden skip-to-content link for keyboard users
- **Focus Trap**: Modals and wizards trap focus appropriately

---

## 📄 License

Built for the **Prompt War Hackathon** — FIFA World Cup 2026™ GenAI Challenge.

MIT License © 2026
