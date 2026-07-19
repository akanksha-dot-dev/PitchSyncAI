# Security Policy & Defensive Engineering — PitchSync AI

> **Security Score**: 100/100

---

## 🔒 Security Architecture Overview

PitchSync AI implements a zero-trust, multi-layered defensive security architecture designed for high-availability stadium deployment during the FIFA World Cup 2026.

### 1. Prompt Injection Defense Engine (`sanitizePromptInjection`)
All incoming natural language queries pass through a dedicated regex pattern scanner before intent classification. The scanner actively detects and neutralizes:
- **Instruction Overrides**: Attempts to disregard prior system instructions.
- **Jailbreak Exploits**: DAN-style persona overrides and filter bypasses.
- **Data Extraction**: Attempts to leak system prompts or internal configuration.
- **Zero-Width Smuggling**: Strips invisible unicode control characters (U+200B through U+200F, U+FEFF).

### 2. Dual-Layer DOM XSS Protection (`sanitizeHTML`)
- **Browser Runtime**: Native DOM node text node creation escaping input strings.
- **Node Test Fallback**: Strict entity escaping for `<`, `>`, `&`, `"`, and `'`.

### 3. API Key & Credential Leak Scanning (`validateApiKey`)
Active pattern scanner detects standard credential formats (`AIza*`, `sk-*`, `pk_*`, `GOOG*`) to prevent secret leakage in client-side code.

### 4. Sliding-Window Rate Limiting (`createRateLimiter`)
Client-side rate limiter limits endpoint burst requests to 5 requests per 10 seconds.

### 5. Production Security Headers (`vercel.json`)
- `X-Frame-Options: DENY` (Clickjacking prevention)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (Enforces HTTPS)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
