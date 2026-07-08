# PitchSync AI 🏟️⚽

> **GenAI-Powered Dual-Mode Stadium Operations & Fan Experience Platform for FIFA World Cup 2026™**

PitchSync AI is a production-grade, highly resilient web application optimized for zero-config Vercel deployment. It delivers real-time stadium operations intelligence and fan guidance through a single, responsive layout, operating strictly under a 10MB footprint using Vite, vanilla JavaScript, and modern CSS variables.

[![Vercel Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)
[![Size](https://img.shields.io/badge/Bundle-<1MB-green.svg)](#)

---

## 🎯 Chosen Vertical
**Stadium Operations & Fan Experience**  
PitchSync AI addresses real-time crowd dynamics, navigation bottlenecks, multilingual support, and operational synchronization for the FIFA World Cup 2026™.

---

## 🧠 Approach & Logic

### Dual-Mode GenAI Architecture

The platform runs as a Single Page Application (SPA) utilizing a reactive state-driven architecture split into two dynamic views:

1. **🎟️ Fan Copilot Mode**: A multilingual AI assistant that uses a rule-based natural language pipeline to provide seat mapping, dynamic transit routes, and stadium wayfinding options.
2. **📊 Ops Command Mode**: A real-time command dashboard showing live crowd densities per stadium zone, generating automated alerts, allowing resource assignment, and triggering a Proactive Operational Wizard to validate reroutes.

```
+-------------------------------------------------------------+
|                     PitchSync AI Shell                      |
| (Mode Switcher, Language Selection, Real-Time Online Badge) |
+------------------------------------+------------------------+
|                                    |                        |
|  [Fan Copilot / Ops Heatmap]       |  [Sidebar Widget]      |
|  - Live GenAI Chat                 |  - Transit Schedule    |
|  - Multi-tier Context Compression  |  - Active Alerts Feed  |
|  - Interactive Stadium SVG Map     |  - Staff Resources     |
|                                    |                        |
+------------------------------------+------------------------+
```

### Core Logic Engines

- **Intent Classification Engine**: A template-based natural language processing algorithm with keyword-based confidence scoring, sanitizing and routing queries into `wayfinding`, `transit`, `food`, `medical`, `accessibility`, `ticket`, and `crowd` modules.
- **Adaptive Context Compression**: A 3-tier sliding window mechanism that protects processing loops from overhead during heavy conversation. It keeps the last 20 messages in full fidelity, summarizes messages 21-50, and evicts older messages into a single system digest.
- **Proactive Validation Wizard**: An operations tool that validates proposed crowd reroutes. It runs checks against transit capacities, schedules, and accessibility obstacles to warn operators of potential secondary bottlenecks.

---

## ⚙️ How the Solution Works

### Local Setup & Development

To run PitchSync AI locally:

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd PitchSyncAI
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

### Running the Test Suite

PitchSync AI contains zero-dependency integration and unit tests using Node.js's native test runner (`node --test`), keeping the repository extremely clean and lightweight.

```bash
npm run test
```

### Vercel Deployment

PitchSync AI is pre-configured for instant deployment on Vercel:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Deployment via Vercel CLI
```bash
npm i -g vercel
vercel
vercel --prod
```

The repository includes `vercel.json` for routing, security header configuration, and optimized static asset caching headers.

---

## 🔮 Assumptions Made

1. **Google Ecosystem Services**: The Google Cloud Translation API, Maps Platform, and Firebase Firestore are simulated with realistic latencies (100–400ms) and functional contract structures. The architecture permits swapping the mocked service interfaces in `src/services/*` with actual client libraries without modifying core components.
2. **Congested Stadium Cell Networks**: Cell service inside stadiums during matches is highly congested. To address this, the app uses standard Tailwind via CDN (0-byte footprint inside the repository) and caches digital tickets, active wayfinding routes, and chat histories in LocalStorage, ensuring core helper screens load offline.
3. **Crowd Flow Algorithms**: Automated crowd trends (rising, falling, stable) are calculated by simulating zone influx over 5-second intervals. A density threshold above 85% automatically generates AI alerts for Ops command staff.
4. **Ops Security**: Authentication for Ops Command mode is simulated. For the hackathon demo, switching between Fan and Ops views is unrestricted to allow prompt auditing of both modes.

---

## ♿ Accessibility (WCAG AAA)

- **Contrast**: Text contrast strictly follows WCAG AAA standards (>7:1 ratio, deep blue `#1E40AF` on off-white `#FAFBFC`).
- **Screen Reader Support**: Implements ARIA live-regions (`announce()` notifications) and descriptive roles.
- **Keyboard Navigation**: Interactive elements can be fully focused via Tab. Focus traps are enforced in modal wizard windows.
- **Reduced Motion**: Disables SVG animations and fade transitions when `prefers-reduced-motion` is detected in the system settings.

---

## 📄 License
MIT License © 2026. PitchSync AI for the Prompt War Hackathon.
