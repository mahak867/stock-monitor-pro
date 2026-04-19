# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ Yes |
| Older branches | ❌ No |

---

## Reporting a Vulnerability

We take security issues seriously. If you discover a potential vulnerability — regardless of severity — please follow the responsible disclosure process below.

### How to report

**Do not open a public GitHub issue.** Instead, report privately by emailing:

> **security@stockpro.app**

Include in your report:
- A description of the vulnerability and its potential impact.
- The affected component or route (e.g. `/api/claude-trade`).
- Step-by-step reproduction instructions (proof-of-concept code is welcome).
- Any mitigating factors you have identified.

### What to expect

| Timeframe | Action |
|---|---|
| Within 48 hours | Acknowledgement of your report |
| Within 7 days | Initial assessment and severity triage |
| Within 30 days | Patch released (critical/high issues are prioritised) |
| After patch release | Credit in release notes (if desired) |

We will keep you informed throughout the process and will not take legal action against researchers who act in good faith.

---

## Scope

### In scope

- Authentication and session handling (Clerk integration)
- API route security (input validation, rate limiting, authorization)
- Data injection vulnerabilities (SQL, HTML, prompt injection)
- Cryptographic weaknesses (Stripe webhook verification, key handling)
- Exposed secrets or credentials
- Dependency vulnerabilities in `package.json`

### Out of scope

- Vulnerabilities in third-party services (Clerk, Stripe, Finnhub, Anthropic, Alpaca, Resend). Please report those directly to the respective vendors.
- Issues that require physical access to a user's device.
- Social-engineering attacks.
- Denial-of-service attacks that only affect a single user account.

---

## Known limitations

- **Alpaca API keys** are stored in `localStorage` and forwarded in request headers. Users should treat these as sensitive credentials.
- **Finnhub API key** (`NEXT_PUBLIC_FINNHUB_API_KEY`) is a public client-side variable. Use server-side proxying if you need it kept private.
- **Rate limiting** uses an in-memory store. On multi-instance deployments, limits are per-instance. Switch to a Redis-backed store (e.g. `@upstash/ratelimit`) for global limits.
