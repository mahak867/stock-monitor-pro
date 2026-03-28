<div align="center">

# 📈 Stock Monitor Pro

### Professional Stock Monitoring, Portfolio Tracking & Real-Time Analytics

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)](https://clerk.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)

> A full-stack stock monitoring dashboard with live charts, portfolio management, watchlists, market news, and Stripe-powered premium subscriptions.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Live Technical Charts** | Real-time price charts with SMA, EMA overlays and volume bars |
| 🔐 **Auth with Clerk** | Secure sign-in / sign-up with social login support |
| 💳 **Stripe Checkout** | One-click upgrade to Pro ($19/mo) via Stripe-hosted checkout |
| 📰 **Market News Feed** | Live headlines from Finnhub's market news API |
| ⭐ **Persistent Watchlist** | Add/remove symbols, persisted to localStorage via Zustand |
| 💼 **Portfolio Tracker** | Track positions with quantity and cost basis |
| 🔎 **Symbol Search** | Instantly switch charts by searching any ticker |
| 📱 **Responsive Layout** | Collapsible sidebar, works on desktop and tablet |
| 🌐 **Finnhub Integration** | Real stock quotes and news (falls back to demo data) |

---

## 🖥️ App Preview

```
┌──────────────────────────────────────────────────────────────────┐
│  📈 StockPro  │  Dashboard                    [ Search symbol… ] │
├───────────────┼──────────────────────────────────────────────────┤
│               │  Balance        Portfolio      Day P/L  All-time │
│  Dashboard ●  │  $100,000       $0             +2.4%    +18.7%   │
│  Portfolio    ├──────────────────────────────────────────────────┤
│  Watchlist    │  ╔═══════════════════════════╗  ⭐ Watchlist     │
│               │  ║  AAPL  +1.2%   $171.34   ║  AAPL ●          │
│               │  ║  ▁▂▃▄▅▆▅▄▆▇▆▅▄▃▄▅▆▇▆▅  ║  TSLA            │
│               │  ║  — SMA  ··· EMA  ▌ Vol  ║  MSFT            │
│               │  ╚═══════════════════════════╝                   │
│  [Upgrade →]  │  Analyst Ratings: Buy 60% ██████ Hold 30% ███   │
│               │  Market News: Markets rally…   2m ago            │
│  👤 Mahak     │                                                   │
└───────────────┴──────────────────────────────────────────────────┘
```

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR, API routes, routing |
| **Language** | TypeScript 5 | Type safety |
| **UI** | React 19 + Tailwind CSS | Components & styling |
| **Animation** | Framer Motion | Sidebar, page transitions |
| **Charts** | Recharts | Area, composed & bar charts |
| **Auth** | Clerk | User authentication & sessions |
| **Payments** | Stripe | Premium subscription checkout |
| **State** | Zustand (persisted) | Portfolio & watchlist state |
| **HTTP** | Axios | Finnhub API calls |
| **Data** | Finnhub API | Live quotes & market news |
| **Icons** | Lucide React | UI iconography |

---

## 🗂️ Project Structure

```
stock-monitor-pro/
├── app/
│   ├── api/
│   │   └── checkout/
│   │       └── route.ts      # Stripe checkout session API
│   ├── globals.css
│   ├── layout.tsx             # Root layout with ClerkProvider
│   ├── page.tsx               # Main dashboard (all UI components)
│   └── favicon.ico
├── lib/
│   ├── api.ts                 # Finnhub API helpers (getQuote, getNews)
│   └── store.ts               # Zustand store (portfolio, watchlist, balance)
├── public/                    # Static assets
├── middleware.ts              # Clerk auth middleware (protects all routes)
├── .env.example               # Environment variable template
├── next.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** v18+
- A [Clerk](https://clerk.com/) account (free)
- A [Stripe](https://stripe.com/) account (free test mode)
- A [Finnhub](https://finnhub.io/) API key (free tier available)

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
```

> Leave `NEXT_PUBLIC_FINNHUB_API_KEY=demo` to run with simulated data — no API key needed.

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

## 💳 Stripe Setup (Premium Checkout)

The `/api/checkout` route creates a Stripe Checkout session for the **StockPro Premium** plan ($19/mo).

To test payments locally:
1. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC
2. After payment, Stripe redirects back to `NEXT_PUBLIC_URL/?success=true`
3. To test cancellation, use `NEXT_PUBLIC_URL/?canceled=true`

> 💡 In production, consider switching `mode: 'payment'` to `mode: 'subscription'` in `route.ts` for recurring billing.

---

## 🔒 Authentication & Middleware

All routes are protected by Clerk via `middleware.ts`. Unauthenticated users see the sign-in screen and cannot access the dashboard.

```ts
// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
export default clerkMiddleware();
```

To make specific routes public (e.g. a landing page), use `createRouteMatcher` from `@clerk/nextjs/server`.

---

## 📡 Data & API Keys

| Service | Free Tier | Used For |
|---|---|---|
| [Finnhub](https://finnhub.io/) | 60 calls/min | Live quotes, market news |
| [Alpha Vantage](https://www.alphavantage.co/) | 25 calls/day | Optional alternative data |

> If no API key is set, the app generates realistic **simulated data** locally — fully functional without any external calls.

---

## 🚀 Deploying to Vercel

```bash
# Push to GitHub, then:
# 1. Go to vercel.com/new → import this repo
# 2. Add all environment variables from .env.example in the Vercel dashboard
# 3. Deploy — Vercel auto-detects Next.js
```

Make sure to set `NEXT_PUBLIC_URL` to your production Vercel URL for Stripe redirects to work correctly.

---

## 🗺️ Roadmap

- [ ] Real-time WebSocket price streaming
- [ ] Price alerts & email notifications
- [ ] Advanced technical indicators (RSI, MACD, Bollinger Bands)
- [ ] Full portfolio P/L tracking with cost basis
- [ ] Dark / light theme toggle
- [ ] Mobile app (React Native)

---

## ⚠️ Disclaimer

Stock Monitor Pro is a **personal project for educational purposes**. It is not financial advice. Do not make investment decisions based on data shown in this application.

---

## 📄 License

MIT — free to use, fork, and adapt.

---

<div align="center">

Built with 📈 by [mahak867](https://github.com/mahak867)

</div>
