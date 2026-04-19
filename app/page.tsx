"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, UserButton, SignIn } from "@clerk/nextjs";
import {
  TrendingUp, Search, Menu, X, Wallet,
  LayoutDashboard, Star, Filter, Settings,
  Bell, Globe, Bot, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../lib/store";
import {
  getQuote, getCryptoQuote, searchSymbol,
  FinnhubWS, isUSMarketOpen, isIndiaMarketOpen,
  safeN,
  type Quote, type SearchResult,
} from "../lib/api";

import { Ticker } from "./components/Ticker";
import { MarketOverviewBar } from "./components/MarketOverviewBar";
import { SymbolView } from "./components/SymbolView";
import { NewsPanel } from "./components/NewsPanel";
import { WatchlistPanel } from "./components/WatchlistPanel";
import { AlertsPanel } from "./components/AlertsPanel";
import { MarketsGrid } from "./components/MarketsGrid";
import { PortfolioPage } from "./components/PortfolioPage";
import { ScreenerPage } from "./components/ScreenerPage";
import { SettingsPage } from "./components/SettingsPage";
import { ClaudeTradeTab } from "./components/ClaudeTradeTab";

type Tab = 'dashboard' | 'markets' | 'portfolio' | 'watchlist' | 'screener' | 'claude' | 'settings';

export default function App() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { tab, setTab, symbol, setSymbol, market, setMarket, addRecent, alerts, triggerAlert, addAlert, notifyEmail } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [tickerQ, setTickerQ] = useState<Record<string, Quote>>({});
  const searchRef = useRef<HTMLDivElement>(null);

  // Market-mode default symbol
  const MARKET_DEFAULTS: Record<'us' | 'india' | 'crypto', string> = {
    us: 'AAPL',
    india: 'NSE:RELIANCE',
    crypto: 'BTC',
  };

  // When market mode changes, switch dashboard to the mode's flagship symbol
  useEffect(() => {
    setSymbol(MARKET_DEFAULTS[market]);
    setTab('dashboard');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market]);

  // Ticker symbols per market
  const TICKER_SYMS: Record<'us' | 'india' | 'crypto', string[]> = {
    us:     ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL', 'AMZN', 'META'],
    india:  ['NSE:RELIANCE', 'NSE:TCS', 'NSE:HDFCBANK', 'NSE:INFY', 'NSE:ICICIBANK', 'NSE:WIPRO'],
    crypto: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE'],
  };

  // WebSocket for real-time ticker updates
  const wsRef = useRef<FinnhubWS | null>(null);
  useEffect(() => {
    if (!isSignedIn) return;
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo';
    const syms = TICKER_SYMS[market];
    const CRYPTO_SYMS = new Set(TICKER_SYMS.crypto);
    // Initial REST poll
    const loadTicker = () => {
      setTickerQ({});
      syms.forEach(s => {
        const fn = CRYPTO_SYMS.has(s) ? getCryptoQuote : getQuote;
        fn(s).then(q => setTickerQ(p => ({ ...p, [s]: q })));
      });
    };
    loadTicker();
    const t = setInterval(loadTicker, 25000);
    // Real-time WebSocket layer (if real API key is configured, US only)
    if (apiKey !== 'demo' && market === 'us') {
      const ws = new FinnhubWS(apiKey);
      wsRef.current = ws;
      syms.forEach(s => {
        ws.subscribe(s, (price) => {
          setTickerQ(p => {
            const existing = p[s];
            if (!existing) return p;
            const d = price - existing.pc;
            const dp = existing.pc ? (d / existing.pc) * 100 : 0;
            return { ...p, [s]: { ...existing, c: price, d, dp } };
          });
        });
      });
    }
    return () => {
      clearInterval(t);
      wsRef.current?.destroy();
      wsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, market]);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchRes([]); return; }
    const t = setTimeout(() => searchSymbol(searchQ).then(setSearchRes), 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  // Alert auto-checker
  const [alertToast, setAlertToast] = useState<string | null>(null);
  useEffect(() => {
    if (!isSignedIn) return;
    const check = async () => {
      const active = alerts.filter(a => a.active && !a.triggered);
      for (const alert of active) {
        try {
          const q = await getQuote(alert.symbol);
          const price = safeN(q.c);
          if (price > 0) {
            const hit =
              (alert.condition === 'above' && price >= alert.price) ||
              (alert.condition === 'below' && price <= alert.price);
            if (hit) {
              triggerAlert(alert.id);
              setAlertToast(`🔔 ${alert.symbol} is ${alert.condition} $${alert.price} (now $${price.toFixed(2)})`);
              setTimeout(() => setAlertToast(null), 6000);
              // Send email notification if configured
              if (notifyEmail) {
                fetch('/api/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: notifyEmail,
                    symbol: alert.symbol,
                    condition: alert.condition,
                    triggerPrice: alert.price,
                    currentPrice: price,
                  }),
                }).catch(() => { /* ignore email errors */ });
              }
            }
          }
        } catch { /* ignore */ }
      }
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [isSignedIn, alerts, triggerAlert, notifyEmail]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (s: string) => { setSymbol(s); setTab('dashboard'); setSearchQ(''); setSearchRes([]); setShowSearch(false); addRecent(s); };

  const nav: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'markets', label: 'Markets', icon: <Globe size={16} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Wallet size={16} /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Star size={16} /> },
    { id: 'screener', label: 'Screener', icon: <Filter size={16} /> },
    { id: 'claude', label: 'AI Trader', icon: <Bot size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  if (!isLoaded) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03030a', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <motion.div
          animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 24px rgba(99,102,241,0.3)', '0 0 48px rgba(99,102,241,0.55)', '0 0 24px rgba(99,102,241,0.3)'] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <TrendingUp size={28} color="#fff" />
        </motion.div>
        <p style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 6 }}>StockPro</p>
        <p style={{ color: '#475569', fontSize: 12, fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}>Initialising...</p>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#03030a', padding: 16, position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow circles */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', top: '-200px', left: '-200px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', bottom: '-150px', right: '-100px', pointerEvents: 'none' }} />
      <div style={{ marginBottom: 40, textAlign: 'center', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(99,102,241,0.40)' }}>
            <TrendingUp size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.03em' }}>StockPro</h1>
        </div>
        <p style={{ color: '#475569', fontSize: 13, letterSpacing: '0.01em' }}>Professional market intelligence — US, India & Crypto</p>
      </div>
      <div style={{ background: 'rgba(11,13,28,0.85)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)', position: 'relative' }}>
        <SignIn routing="hash" appearance={{
          elements: {
            formButtonPrimary: 'btn-primary',
            card: 'bg-transparent shadow-none',
            headerTitle: 'text-white',
            headerSubtitle: 'text-slate-500',
            formFieldInput: 'bg-[#060817] border-[rgba(99,102,241,0.15)] text-white',
            footerActionLink: 'text-indigo-400',
          },
        }} />
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#03030a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Alert Toast */}
      <AnimatePresence>
        {alertToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed', top: 16, left: '50%', zIndex: 1000,
              background: 'rgba(10,12,28,0.95)', border: '1px solid rgba(99,102,241,0.30)',
              borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600,
              color: '#f1f5f9', backdropFilter: 'blur(20px)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.10)',
              display: 'flex', alignItems: 'center', gap: 10, maxWidth: 440,
            }}>
            <Bell size={14} color="#f59e0b" />
            {alertToast}
            <button onClick={() => setAlertToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2, marginLeft: 4 }}>
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 210 : 62 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          background: 'rgba(5,6,18,0.92)',
          borderRight: '1px solid rgba(99,102,241,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
          paddingTop: 18, paddingBottom: 18, flexShrink: 0,
          overflow: 'hidden', zIndex: 20,
        }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, paddingRight: 10, marginBottom: 28 }}>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(99,102,241,0.35)' }}>
                  <TrendingUp size={15} color="#fff" />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>StockPro</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 6, display: 'flex', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
            {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>

        {/* Market mode switcher */}
        <div style={{ padding: '0 8px', marginBottom: 14 }}>
          {sidebarOpen ? (
            <div style={{ display: 'flex', gap: 4, background: 'rgba(6,8,26,0.9)', borderRadius: 10, padding: 4, border: '1px solid rgba(99,102,241,0.10)' }}>
              {([
                { id: 'us',     label: '🇺🇸 US',     color: '#60a5fa' },
                { id: 'india',  label: '🇮🇳 India',   color: '#f97316' },
                { id: 'crypto', label: '₿ Crypto',    color: '#f59e0b' },
              ] as const).map(m => (
                <button key={m.id} onClick={() => setMarket(m.id)}
                  style={{
                    flex: 1, padding: '5px 0', borderRadius: 7, fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                    background: market === m.id ? `rgba(99,102,241,0.18)` : 'transparent',
                    color: market === m.id ? '#f1f5f9' : '#475569',
                    outline: market === m.id ? `1px solid rgba(99,102,241,0.35)` : 'none',
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            // Collapsed: show single icon cycling through modes
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              {([
                { id: 'us',     icon: '🇺🇸' },
                { id: 'india',  icon: '🇮🇳' },
                { id: 'crypto', icon: '₿' },
              ] as const).map(m => (
                <button key={m.id} onClick={() => setMarket(m.id)}
                  style={{
                    width: 34, height: 26, borderRadius: 7, fontSize: 14, cursor: 'pointer',
                    background: market === m.id ? 'rgba(99,102,241,0.18)' : 'transparent',
                    border: market === m.id ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  {m.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
          {nav.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 10,
                position: 'relative',
                background: tab === id ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: tab === id ? '#818cf8' : '#64748b',
                border: tab === id ? '1px solid rgba(99,102,241,0.22)' : '1px solid transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: tab === id ? 600 : 400, textAlign: 'left',
                transition: 'all 0.15s', width: '100%',
              }}
              onMouseEnter={e => { if (tab !== id) { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.color = '#94a3b8'; } }}
              onMouseLeave={e => { if (tab !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}>
              {tab === id && (
                <span style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: 2, background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)', borderRadius: '0 2px 2px 0' }} />
              )}
              <span style={{ flexShrink: 0 }}>{icon}</span>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ whiteSpace: 'nowrap' }}>{label}</motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 12px 0', borderTop: '1px solid rgba(99,102,241,0.10)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserButton afterSignOutUrl="/" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.firstName || 'Trader'}
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 1, letterSpacing: '0.02em' }}>Free plan</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Ticker quotes={tickerQ} />

        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(99,102,241,0.10)', background: 'rgba(3,3,10,0.80)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              {tab === 'dashboard' ? symbol.replace('NSE:', '') : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
            {/* Market mode badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.04em',
              background: market === 'us' ? 'rgba(96,165,250,0.10)' : market === 'india' ? 'rgba(249,115,22,0.10)' : 'rgba(245,158,11,0.10)',
              color: market === 'us' ? '#60a5fa' : market === 'india' ? '#f97316' : '#f59e0b',
              border: `1px solid ${market === 'us' ? 'rgba(96,165,250,0.22)' : market === 'india' ? 'rgba(249,115,22,0.22)' : 'rgba(245,158,11,0.22)'}`,
            }}>
              {market === 'us' ? '🇺🇸 US Market' : market === 'india' ? '🇮🇳 India Market' : '₿ Crypto'}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {market === 'us' && isUSMarketOpen() && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'rgba(16,185,129,0.10)', color: '#10b981', border: '1px solid rgba(16,185,129,0.20)', letterSpacing: '0.06em' }}>
                   US OPEN
                </span>
              )}
              {market === 'us' && !isUSMarketOpen() && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'rgba(100,116,139,0.08)', color: '#64748b', border: '1px solid rgba(100,116,139,0.15)', letterSpacing: '0.06em' }}>
                  ○ US CLOSED
                </span>
              )}
              {market === 'india' && isIndiaMarketOpen() && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'rgba(16,185,129,0.10)', color: '#10b981', border: '1px solid rgba(16,185,129,0.20)', letterSpacing: '0.06em' }}>
                   IN OPEN
                </span>
              )}
              {market === 'india' && !isIndiaMarketOpen() && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'rgba(100,116,139,0.08)', color: '#64748b', border: '1px solid rgba(100,116,139,0.15)', letterSpacing: '0.06em' }}>
                  ○ IN CLOSED
                </span>
              )}
              {market === 'crypto' && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'rgba(16,185,129,0.10)', color: '#10b981', border: '1px solid rgba(16,185,129,0.20)', letterSpacing: '0.06em' }}>
                   24/7
                </span>
              )}
            </div>
          </div>
          <div ref={searchRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(6,8,26,0.9)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 10, padding: '8px 13px', width: 230, transition: 'border-color 0.2s' }}
              onFocus={() => {}} >
              <Search size={13} color="#475569" />
              <input value={searchQ}
                onChange={e => { setSearchQ(e.target.value.toUpperCase()); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                placeholder="Search symbol..."
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', width: '100%', letterSpacing: '0.02em' }} />
            </div>
            <AnimatePresence>
              {showSearch && searchRes.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: 'rgba(10,12,28,0.97)', border: '1px solid rgba(99,102,241,0.16)', borderRadius: 12, zIndex: 100, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.06)', width: 290, backdropFilter: 'blur(20px)' }}>
                  {searchRes.map(r => (
                    <button key={r.symbol} onClick={() => select(r.symbol)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 15px', background: 'none', border: 'none', borderBottom: '1px solid rgba(99,102,241,0.08)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', fontFamily: 'DM Mono, monospace' }}>{r.symbol}</span>
                        <span style={{ fontSize: 11, color: '#475569', marginLeft: 8, display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#475569', background: 'rgba(99,102,241,0.10)', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>{r.type}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22, background: 'rgba(3,3,10,0.5)' }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab + symbol}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}>
              {tab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1600 }}>
                  <MarketOverviewBar onSelect={select} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                    <SymbolView symbol={symbol} />
                    <NewsPanel symbol={symbol} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <WatchlistPanel onSelect={select} selected={symbol} />
                    <AlertsPanel />
                  </div>
                </div>
                </div>
              )}
              {tab === 'markets' && <MarketsGrid onSelect={select} />}
              {tab === 'portfolio' && <PortfolioPage onSelect={select} />}
              {tab === 'watchlist' && <WatchlistPanel onSelect={select} selected={symbol} />}
              {tab === 'screener' && <ScreenerPage onSelect={select} />}
              {tab === 'claude' && <ClaudeTradeTab onSelect={select} />}
              {tab === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Persistent disclaimer bar */}
        <div style={{
          flexShrink: 0, borderTop: '1px solid rgba(245,158,11,0.14)',
          background: 'rgba(245,158,11,0.04)', padding: '6px 22px',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <AlertTriangle size={11} color="#f59e0b" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: '#f59e0b', letterSpacing: '0.04em' }}>DISCLAIMER </span>
            For educational purposes only. Not financial advice. All trades are simulated paper trading. Do not make real investment decisions based on data or AI analysis shown here.
          </p>
        </div>
      </div>
    </div>
  );
}
