<div align="center">

# 📈 Stock Monitor Pro

### Professional Stock Monitoring, Portfolio Tracking & AI-Powered Trading

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)](https://clerk.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Claude AI](https://img.shields.io/badge/AI-Claude%20Sonnet-CC785C?style=flat-square)](https://anthropic.com/)
[![CI](https://github.com/mahak867/stock-monitor-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/mahak867/stock-monitor-pro/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Contributing](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)

> A full-stack, investor-ready stock monitoring platform with **three global market modes** (🇺🇸 US · 🇮🇳 India · ₿ Crypto), live WebSocket streaming, AI-powered paper trading, deep symbol search, portfolio analytics, and Stripe-powered premium subscriptions.

**[🚀 Live Demo](https://stock-monitor-pro.vercel.app)** · **[📖 Contributing](./CONTRIBUTING.md)** · **[🔒 Security](./SECURITY.md)**

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌍 **Global Market Mode Switcher** | One-click mode selector in the sidebar — choose 🇺🇸 US, 🇮🇳 India, or ₿ Crypto; everything updates automatically |
| 📊 **Live Technical Charts** | Real-time price charts with SMA, EMA overlays and volume bars |
| ⚡ **WebSocket Streaming** | Real-time trade data via Finnhub WebSocket with automatic REST fallback |
| 🤖 **Claude AI Trade Assistant** | Full chat interface — analyze stocks, get buy/sell recommendations, execute simulated paper trades, and set price alerts via natural language |
| 🦙 **Alpaca Brokerage Integration** | Submit real market orders (paper or live) directly from the app via the Alpaca API |
| 🔐 **Auth with Clerk** | Secure sign-in / sign-up with social login support |
| 💳 **Stripe Checkout** | One-click upgrade to Pro ($19/mo) via Stripe-hosted checkout |
| 📰 **Market News Feed** | Live headlines from Finnhub's market news API with sentiment labels |
| ⭐ **Persistent Watchlist** | Add/remove symbols, persisted to localStorage via Zustand |
| 💼 **Portfolio Tracker** | Track positions with cost basis, P&L, and allocation chart |
| 🔔 **Smart Price Alerts** | Auto-checking alert system with toast notifications when thresholds are crossed |
| 📧 **Email Alert Notifications** | Triggered price alerts send a branded email via Resend (optional — requires `RESEND_API_KEY`) |
| 🔎 **Deep Symbol Search** | Live quote preview in results, keyboard navigation (↑↓ Enter Esc), recently viewed history |
| 📈 **Market Overview Bar** | S&P 500, Nasdaq 100, Dow Jones, Nifty 50 live mini-cards + US/IN market-open status |
| 🧮 **Fundamentals Panel** | P/E, EPS, Beta, ROE, 52-week range, analyst recommendations, EPS history chart |
| 📱 **PWA + Responsive Layout** | Installable as a standalone Progressive Web App; collapsible sidebar for desktop and tablet |
| 🌐 **Finnhub Integration** | Real stock quotes, candles, news, and symbol search |

---

## 🌍 Market Modes

Stock Monitor Pro supports **three global market modes**, selectable from the sidebar at any time. Switching modes updates the entire app instantly — ticker tape, dashboard symbol, market status badge, and the Markets tab all reflect the chosen market.

### 🇺🇸 US Market
- **Default symbol:** `AAPL`
- **Ticker tape:** AAPL · MSFT · TSLA · NVDA · GOOGL · AMZN · META
- **Status badge:** `● US OPEN` (9:30–16:00 ET, Mon–Fri) or `○ US CLOSED`
- **Markets tab:** Top 10 US stocks (Apple, Microsoft, Alphabet, Amazon, NVIDIA, Tesla, Meta, Netflix, JPMorgan, Berkshire)

### 🇮🇳 India Market
- **Default symbol:** `NSE:RELIANCE`
- **Ticker tape:** RELIANCE · TCS · HDFCBANK · INFY · ICICIBANK · WIPRO
- **Status badge:** `● IN OPEN` (9:15–15:30 IST, Mon–Fri) or `○ IN CLOSED`
- **Markets tab:** Top 10 NSE stocks (Reliance, TCS, HDFC Bank, Infosys, ICICI Bank, Wipro, HUL, Bajaj Finance, Adani, Tata Motors)

### ₿ Crypto
- **Default symbol:** `BTC`
- **Ticker tape:** BTC · ETH · SOL · BNB · XRP · ADA · DOGE
- **Status badge:** `● 24/7` (crypto never closes)
- **Markets tab:** BTC, ETH, SOL, BNB, XRP, ADA, DOGE, MATIC

### Sidebar switcher

| Sidebar state | Appearance |
|---|---|
| **Expanded** | Three pill buttons `🇺🇸 US` · `🇮🇳 India` · `₿ Crypto` in a segmented control |
| **Collapsed** | Three compact emoji icon buttons stacked vertically |

The active mode is persisted to `localStorage` via Zustand, so your market preference is remembered across sessions.

---

## 🤖 Claude AI Trade Assistant

The **AI Trader** tab gives you a full chat interface powered by Claude Sonnet. Claude has complete visibility into your portfolio and watchlist and can:

- **Analyze** any stock with technical + fundamental context
- **Recommend** buy/sell actions with structured trade cards you can confirm or reject
- **Execute** simulated paper trades directly from chat (BUY, SELL)
- **Set price alerts** via natural language ("monitor TSLA above $280")
- **Review** your portfolio risk, suggest rebalancing, or compare positions

### Example prompts

```
"Analyze NVDA and should I buy?"
"Review my portfolio and suggest improvements"
"Buy 5 shares of AAPL"
"Set a price alert for TSLA above $280"
"What are the top momentum stocks today?"
"Explain the risk in my current positions"
```

> All trades are **simulated paper trading only**. Claude AI analysis is not financial advice.

---

## 🖥️ App Preview

> 📽️ **[Watch the 60-second demo video →](https://stock-monitor-pro.vercel.app)**
>
> *(Deploy to Vercel and record a screen capture — see [Try it in 5 minutes](#-try-it-in-5-minutes) below.)*

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📈 StockPro  │  AAPL  🇺🇸 US Market  ● US OPEN  [ Search symbol… ]         │
├───────────────┼──────────────────────────────────────────────────────────────┤
│  ┌──────────┐ │  SPX +0.4%  QQQ +0.6%  DJI -0.1%  NIFTY +0.8%             │
│  │🇺🇸 US    │ ├──────────────────────────────────────────────────────────────┤
│  │🇮🇳 India │ │  AAPL  $171.34  +1.2%  ● LIVE          [Refresh]            │
│  │₿ Crypto  │ │  ▁▂▃▄▅▆▅▄▆▇▆▅▄▃▄▅▆▇▆▅ ─ SMA ··· EMA  ▌ Vol               │
│  └──────────┘ │  About    P/E: 28.4   Beta: 1.24   52W: $124–$199           │
│  Dashboard ●  │  Claude  [Analyze AAPL ▶]   "Strong momentum..."            │
│  Markets      ├──────────────────────────────────────────────────────────────┤
│  Portfolio    │  ⭐ Watchlist          🔔 Alerts                             │
│  Watchlist    │  AAPL ● $171  +1.2%   TSLA above $280 ✓                    │
│  Screener     │  TSLA   $251  -0.4%                                         │
│  AI Trader    │  MSFT   $382  +0.8%                                         │
│  Settings     │                                                              │
│               │                                                              │
│  [Upgrade →]  │                                                              │
│  👤 Mahak     │                                                              │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR, API routes, routing |
| **Language** | TypeScript 5 | Type safety |
| **UI** | React 19 + Tailwind CSS | Components & styling |
| **Animation** | Framer Motion | Sidebar, page transitions, toasts |
| **Charts** | Recharts | Area, composed & bar charts |
| **Auth** | Clerk | User authentication & sessions |
| **Payments** | Stripe | Premium subscription checkout |
| **Brokerage** | Alpaca Markets API | Real paper & live market order execution |
| **Email** | Resend | Branded email notifications for price alerts |
| **State** | Zustand (persisted) | Portfolio, watchlist, alerts, market mode, recent symbols |
| **HTTP** | Axios | Finnhub REST API calls |
| **WebSocket** | Finnhub WS | Real-time trade streaming |
| **AI** | Anthropic Claude Sonnet | Stock analysis & paper trade execution |
| **Data** | Finnhub API | Live quotes, candles, news, symbol search |
| **Icons** | Lucide React | UI iconography |
| **PWA** | Next.js Web Manifest | Installable standalone app |

---

## 🗂️ Project Structure

```
stock-monitor-pro/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts          # Claude stock analysis (single stock)
│   │   ├── alpaca-order/
│   │   │   └── route.ts          # Alpaca brokerage order placement & position fetch
│   │   ├── claude-trade/
│   │   │   └── route.ts          # Claude AI trade assistant (chat + trade execution)
│   │   ├── checkout/
│   │   │   └── route.ts          # Stripe checkout session API
│   │   ├── notify/
│   │   │   └── route.ts          # Email price-alert notifications via Resend
│   │   └── webhooks/
│   │       └── stripe/           # Stripe webhook handler
│   ├── components/
│   │   └── ErrorBoundary.tsx     # React error boundary wrapper
│   ├── globals.css
│   ├── layout.tsx                 # Root layout with ClerkProvider
│   ├── manifest.ts                # PWA web app manifest
│   ├── page.tsx                   # Main dashboard (all UI components)
│   └── favicon.ico
├── lib/
│   ├── api.ts                     # Finnhub REST + WebSocket helpers, market indices, hours
│   └── store.ts                   # Zustand store (portfolio, watchlist, alerts, market mode, Alpaca, notify email)
├── public/                        # Static assets
├── middleware.ts                  # Clerk auth middleware (protects all routes)
├── next.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## ⚡ Try it in 5 Minutes

> No Finnhub key? No problem — leave it as `demo` and the app runs entirely on realistic simulated data.

```bash
# 1. Clone & install (30 sec)
git clone https://github.com/mahak867/stock-monitor-pro.git
cd stock-monitor-pro
npm install

# 2. Create env file (1 min)
cp .env.example .env.local
# Open .env.local and fill in at minimum:
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
#   CLERK_SECRET_KEY=sk_test_...
# Leave NEXT_PUBLIC_FINNHUB_API_KEY=demo for simulated data

# 3. Start dev server (30 sec)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Clerk, and the full dashboard loads instantly.

**Want AI features too?** Grab a free [Anthropic API key](https://console.anthropic.com/settings/keys) and paste it into **Settings → Claude AI Integration**. No server restart required.

**Want live prices?** Get a free [Finnhub key](https://finnhub.io/) and set `NEXT_PUBLIC_FINNHUB_API_KEY` in `.env.local`.

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** v18+
- A [Clerk](https://clerk.com/) account (free)
- A [Stripe](https://stripe.com/) account (free test mode)
- A [Finnhub](https://finnhub.io/) API key (free tier)
- An [Anthropic](https://console.anthropic.com/) API key (optional — for Claude AI features)

### 1. Clone & Install

```bash
git clone https://github.com/mahak867/stock-monitor-pro.git
cd stock-monitor-pro
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_URL=http://localhost:3000

NEXT_PUBLIC_FINNHUB_API_KEY=your_key_here

# Optional — Claude AI Trade Assistant
# Can also be provided per-user in the Settings tab
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional — Email price-alert notifications (Resend)
RESEND_API_KEY=re_...

# Optional — Alpaca brokerage (entered per-user in Settings)
# ALPACA_KEY and ALPACA_SECRET are stored client-side via Zustand Settings tab
# No server-side env vars needed; keys are passed from the browser to /api/alpaca-order
```

> Leave `NEXT_PUBLIC_FINNHUB_API_KEY=demo` to run with simulated data — no API key needed.
>
> If `ANTHROPIC_API_KEY` is not set server-side, users can provide their own key in **Settings → Claude AI Integration**.
>
> If `RESEND_API_KEY` is not set, price-alert emails are silently skipped — the rest of the alert system still works.

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign in with Clerk and the dashboard loads.

### 4. Build for Production

```bash
npm run build
npm run start
```

---

## 🤖 Claude AI Integration

### How it works

The `/api/claude-trade` route:
1. Builds a rich system prompt containing the user's portfolio, watchlist, and cash balance
2. Sends the conversation history to `claude-sonnet-4-20250514`
3. Parses optional `<trade>` and `<monitor>` action blocks from Claude's response
4. Returns `{ reply, trade?, monitor? }` to the client

The **AI Trader** tab:
- Renders a chat UI with message history
- Displays trade/alert action cards with **Execute / Dismiss** buttons
- Confirmed BUY/SELL actions update the Zustand portfolio store directly
- Confirmed MONITOR actions add a price alert to the alerts store

### Security

- The Anthropic API key is only used server-side in the `/api/claude-trade` route
- Users can supply their own key via Settings if no server key is configured
- All routes are protected by Clerk authentication

---

## 💳 Stripe Setup (Premium Checkout)

The `/api/checkout` route creates a Stripe Checkout session for the **StockPro Premium** plan ($19/mo).

To test payments locally:
1. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC
2. After payment, Stripe redirects back to `NEXT_PUBLIC_URL/?success=true`
3. To test cancellation, use `NEXT_PUBLIC_URL/?canceled=true`

---

## 🔒 Authentication & Middleware

All routes are protected by Clerk via `middleware.ts`. Unauthenticated users see the sign-in screen.

To make specific routes public (e.g. a landing page), use `createRouteMatcher` from `@clerk/nextjs/server`.

---

## 🛡️ Security Model & Threat Model

### Route protection

| Route | Protection layer |
|---|---|
| All app pages | Clerk middleware (`auth.protect()`) |
| `/api/analyze` | Clerk middleware **+** explicit `auth.protect()` in handler |
| `/api/claude-trade` | Clerk middleware **+** explicit `auth.protect()` in handler |
| `/api/checkout` | Clerk middleware **+** explicit `auth.protect()` in handler |
| `/api/alpaca-order` | Clerk middleware **+** explicit `auth.protect()` in handler |
| `/api/notify` | Clerk middleware |
| `/api/webhooks/stripe` | Public (required by Stripe) — verified via HMAC signature |

### Session & authentication protection

- All routes except `/api/webhooks/(.*)` are matched by the Clerk middleware and call `auth.protect()`. Unauthenticated requests are redirected to the Clerk sign-in screen.
- Clerk handles session token issuance, rotation, and revocation. Tokens are short-lived JWTs; Clerk's SDK validates them on every request.
- Social login (OAuth) is handled entirely by Clerk — no OAuth tokens are stored in this application.

### Stripe webhook verification

The `/api/webhooks/stripe` handler is intentionally public so Stripe can reach it.
Every request is verified with [`stripe.webhooks.constructEvent`](https://stripe.com/docs/webhooks/signatures) using the `STRIPE_WEBHOOK_SECRET` environment variable.
Requests with a missing or invalid `stripe-signature` header are rejected with HTTP 400 before any business logic runs.

```
POST /api/webhooks/stripe
  ├─ Read raw body (required for HMAC check)
  ├─ Reject if stripe-signature header is absent          → 400
  ├─ stripe.webhooks.constructEvent(body, sig, secret)
  │    └─ Reject if signature verification fails          → 400
  └─ Process verified event (checkout.session.completed, …)
```

### Rate limiting

`/api/analyze` and `/api/claude-trade` are protected by an in-memory sliding-window rate limiter (`lib/rateLimit.ts`), keyed by Clerk user ID:

| Route | Limit |
|---|---|
| `/api/analyze` | 20 requests / user / minute |
| `/api/claude-trade` | 30 requests / user / minute |

Blocked requests receive HTTP **429** with a `Retry-After` header.

> For multi-instance / multi-region deployments, replace the in-memory Map with a Redis-backed store such as [`@upstash/ratelimit`](https://github.com/upstash/ratelimit) for globally consistent limits. The `checkRateLimit` interface in `lib/rateLimit.ts` is designed to make this drop-in.

### Request logging & secrets hygiene

- **Server logs** — Vercel / Next.js access logs record request URLs. The app never places secrets in URL query parameters. Alpaca credentials are forwarded in request headers (`APCA-API-KEY-ID` / `APCA-API-SECRET-KEY`), not in query strings, to avoid log exposure.
- **Error responses** — API error handlers return opaque messages (`"Anthropic API returned 502"`, `"Internal error"`) that do not echo back raw error strings from third-party services to the client.
- **Environment variables** — `.gitignore` excludes all `.env*` files. Use your hosting provider's secret manager (Vercel Environment Variables, GitHub Actions Secrets) to inject keys at build/runtime.
- **Dependency scanning** — The repository runs `npm audit` as part of CI. Review and patch flagged packages before promoting to production.

### API key boundaries

| Key | Where it lives | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server env only | Never sent to the client |
| `STRIPE_WEBHOOK_SECRET` | Server env only | Used for HMAC verification |
| `ANTHROPIC_API_KEY` | Server env (preferred) | Falls back to user-supplied key in request body when not set |
| `RESEND_API_KEY` | Server env only | Never sent to the client |
| `CLERK_SECRET_KEY` | Server env only | Never sent to the client |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public (safe to expose) | Clerk publishable key by design |
| `NEXT_PUBLIC_FINNHUB_API_KEY` | Public | Finnhub free-tier key; proxy server-side if you need to keep it private |
| Alpaca `apiKey` / `apiSecret` | User-supplied per request | Forwarded in request headers to `/api/alpaca-order`; never stored server-side |

> **Note on Alpaca credentials:** Users enter their own Alpaca paper/live API key and secret in the Settings tab. These are stored in `localStorage` via Zustand and forwarded to `/api/alpaca-order` in request headers on each call. They are **never** stored in your server environment. The route is protected by Clerk authentication, so only signed-in users can call it.

---

## 📡 Data & API Keys

| Service | Free Tier | Used For |
|---|---|---|
| [Finnhub](https://finnhub.io/) | 60 calls/min | Live quotes, candles, news, symbol search, WebSocket |
| [Anthropic Claude](https://anthropic.com/) | Pay-per-use | AI stock analysis and paper trade execution |
| [Alpaca Markets](https://alpaca.markets/) | Free paper trading | Real paper & live market order execution |
| [Resend](https://resend.com/) | 100 emails/day free | Branded price-alert email notifications |

> If no Finnhub key is set, the app generates realistic **simulated data** locally — fully functional without any external calls.

---

## 🚀 Deploying to Vercel

```bash
# Push to GitHub, then:
# 1. Go to vercel.com/new → import this repo
# 2. Add all environment variables from .env.example in the Vercel dashboard
# 3. Deploy — Vercel auto-detects Next.js
```

Make sure to set `NEXT_PUBLIC_URL` to your production Vercel URL for Stripe redirects.

---

## 🗺️ Roadmap

- [x] Real-time WebSocket price streaming
- [x] Price alerts with toast notifications
- [x] AI-powered stock analysis (Claude)
- [x] Claude AI Trade Assistant (chat, buy/sell, monitor)
- [x] Deep symbol search with live quote preview + keyboard navigation
- [x] Market overview bar (SPX, QQQ, DJI, Nifty 50)
- [x] US / India / Crypto multi-market support
- [x] Recently viewed symbols
- [x] Security headers (X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy)
- [x] In-memory rate limiting on AI routes (sliding window, per-user)
- [x] Input validation & HTML escaping on all API routes
- [ ] Advanced technical indicators (RSI, MACD, Bollinger Bands)
- [ ] Options chain viewer
- [ ] CSV portfolio export
- [x] Email alert notifications (Resend)
- [x] Unit test suite (Jest + ts-jest)
- [x] GitHub Actions CI (lint + typecheck + test + audit)
- [ ] Dark / light theme toggle
- [ ] Redis-backed distributed rate limiting for multi-instance deployments
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 🔒 Security

To report a vulnerability, please follow the process in [SECURITY.md](./SECURITY.md).

---

## ⚠️ Disclaimer

Stock Monitor Pro is a **personal project for educational purposes**. It is **not financial advice**. Do not make real investment decisions based on data or AI analysis shown in this application. All trades within the platform are simulated paper trading only.

---

## 📄 License

MIT — free to use, fork, and adapt.

---

<div align="center">

Built with 📈 by [mahak867](https://github.com/mahak867)

</div>
