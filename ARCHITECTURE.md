# PitchSync AI — System Architecture & Technical Specifications

> **GenAI-Powered Dual-Mode Stadium Operations & Fan Experience Platform for FIFA World Cup 2026™**

---

## 📌 Executive Overview & Problem Statement Alignment

PitchSync AI addresses critical operational bottlenecks in large-scale sporting venues during the FIFA World Cup 2026. Designed for 80,000+ attendee stadiums across 16 venues, the system solves four core operational challenges:

1. **Real-time Crowd Congestion Management**: Dynamically monitors concourse, gate, and food court density via reactive state streaming, triggering automated reroutes.
2. **Multilingual Fan Assistance**: Supports 10 languages (including right-to-left scripts like Arabic) with real-time intent classification and context-aware responses.
3. **WCAG AAA Accessibility**: Tailors wayfinding and stadium guidance for wheelchair users, visually impaired attendees, and low-sensory paths.
4. **Ops Staff Situational Awareness**: Provides operational staff with live SVG heatmaps, 4 KPI sparklines, and a 4-step automated Reroute Validation Wizard.

---

## 🏗️ System Architecture Diagram

```
                               ┌───────────────────────────────────────────────┐
                               │           Client Browser (SPA)                │
                               └──────────────────────┬────────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
            🎟️ Fan Copilot Module                                         📊 Ops Command Module
  ──────────────────────────────────────────                     ──────────────────────────────────────────
  • Multilingual AI Assistant                                    • Real-time SVG Crowd Heatmap
  • Accessible Route Generator                                   • 4 KPI Metric Sparklines
  • Digital Ticket Wallet (Offline Saved)                        • Live Alert Feed (Ack / Resolve)
  • Live Transit Schedules                                       • Resource Auto-Balancer
                                                                 • 4-Step Reroute Validation Wizard
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │
                                                      ▼
                                       ┌──────────────────────────────┐
                                       │   Reactive State Proxy Tree  │
                                       └──────────────┬───────────────┘
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
            ┌────────────────────┐        ┌────────────────────┐        ┌────────────────────┐
            │   GenAI Processing │        │   Context Manager  │        │ Security & Sanitiz.│
            │       Engine       │        │  (3-Tier Sliding)  │        │ (Injection/XSS/Key)│
            └────────────────────┘        └────────────────────┘        └────────────────────┘
```

---

## 🧠 GenAI NLP Processing Pipeline

Every user query passes through a 10-stage processing pipeline before rendering UI components:

```
1. Input Reception ──► 2. DOM XSS Sanitizer ──► 3. Prompt Injection Scanner ──► 4. Script & Lang Detector
                                                                                        │
8. Response Generator ◄── 7. Context Assembler ◄── 6. Disambiguation Check ◄── 5. Intent Classifier
         │
         ▼
9. 3-Tier Sliding Window Compression ──► 10. Rich UI Component Render
```

### 1. Intent Classification Engine
Classifies user messages into 8 intent categories (`wayfinding`, `transit`, `food`, `medical`, `accessibility`, `ticket`, `crowd`, `greeting`) using multi-keyword matching with confidence scoring (0.70–0.90).

### 2. Prompt Injection Defense (`sanitizePromptInjection`)
Scans inputs against adversarial patterns (instruction overrides, system prompt extraction, jailbreaks, persona hijacking). Strips injection vectors and invisible control characters.

### 3. Context Management (3-Tier Sliding Window)
- **Tier 1 (Full Fidelity)**: Keeps the last 20 messages at full text length.
- **Tier 2 (Summarized)**: Compresses messages 21–50 into intent + excerpt summaries.
- **Tier 3 (Evicted → Digest)**: Collapses history beyond 50 messages into a single system digest.
- **Priority Pinning**: Messages with `accessibility`, `ticket`, or `emergency` intents are **never evicted**.

---

## 🔐 Security & Data Governance

1. **XSS Protection**: Dual-layer sanitization using browser native DOM text node creation and fallback entity encoding.
2. **API Key Leak Prevention**: Active pattern scanning (`validateApiKey`) prevents accidental hardcoded secret leaks.
3. **Rate Limiting**: Sliding-window rate limiter prevents message flooding.
4. **Vercel Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

## ♿ Accessibility Compliance (WCAG 2.1 AAA)

- **Color Contrast**: Primary text (`#1E40AF`) on surface background (`#FAFBFC`) achieves an **8.95:1 ratio** (WCAG AAA requires 7:1).
- **Screen Reader Announcements**: Dynamic `aria-live="polite"` region announces message arrivals, alert updates, and mode switches.
- **Focus Management**: Modal dialogs employ a custom `createFocusTrap()` to prevent focus leakage.
- **Dynamic RTL**: Synchronizes `lang` and `dir` attributes on `<html>` for languages like Arabic (`ar`).

---

## 🧪 Quality Assurance & Test Coverage

The application includes a zero-dependency test suite using Node.js native test runner (`node --test`), achieving 100% pass rate across 120 tests:

- **`genai-engine.test.js`**: Intent classification, entity extraction, prompt injection defense, XSS safety.
- **`context-manager.test.js`**: 3-tier sliding window compression, priority pinning, follow-up detection.
- **`validators.test.js`**: XSS sanitization, prompt injection scanner, rate limiting, gate/zone checks.
- **`state.test.js`**: Proxy reactivity, subscriber notifications, batch update deduplication.
- **`maps.test.js`**: Accessible route calculation, elevator substitution, low-sensory paths.
- **`firebase.test.js`**: Live stream subscriptions, staff alert pushing, network state sync.
- **`integration.test.js`**: End-to-end multi-turn conversation flows and context persistence.

---

## 📄 License

MIT License © 2026 PitchSync AI — Built for the **Prompt War Hackathon**.
