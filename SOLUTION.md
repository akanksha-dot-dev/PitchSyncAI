# PitchSync AI — Solution Architecture & Feature Specifications

## 🌟 Core Innovations

### 1. Dual-Mode Interface Architecture
A single Single-Page Application (SPA) providing tailored interfaces for two primary user groups:
- **Fan Copilot**: Multilingual AI Chat, Wayfinding, Digital Ticket, Transit Schedules.
- **Ops Command**: SVG Heatmap, Metric Cards, Alert Feed, Staff Auto-Balancer, Validation Wizard.

### 2. 10-Stage GenAI Processing Pipeline
1. Input Reception
2. DOM XSS Sanitization
3. Prompt Injection Defense (`sanitizePromptInjection`)
4. Script & Language Detection (ISO 639-1)
5. Multi-Signal Intent Classification (8 categories)
6. Entity Extraction (Gate A-H, Section, Row, Seat, Zone)
7. Ambiguity Disambiguation Check
8. Context Assembly (Accessibility Prefs + Ticket Data)
9. Follow-up Intent Detection (`wayfinding` → `food`)
10. Response Generation & 3-Tier Sliding Window Context Compression

### 3. Adaptive Context Compression (3-Tier Window)
- **Tier 1 (Full Fidelity)**: Last 20 messages.
- **Tier 2 (Summarized)**: Messages 21–50 summarized into intent + excerpt.
- **Tier 3 (Digest)**: Messages 50+ collapsed into system summary.
- **Priority Pinning**: Messages with `accessibility`, `ticket`, or `emergency` intents are **never evicted**.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Build Tool** | Vite 6.x | 200ms build times, zero config |
| **Frontend Logic** | ES2022 Vanilla JS | Zero framework overhead, native Proxy reactivity |
| **Styling** | CSS Tokens + Tailwind CDN | Zero repository byte overhead |
| **Routing** | Custom Hash SPA Router | Navigation guards + zero history API dependencies |
| **Testing** | Node.js Native Harness | `node --test`, 120 tests, zero dependencies |
