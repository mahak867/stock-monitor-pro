"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useUser, UserButton, SignIn } from "@clerk/nextjs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, Search, Menu, X, Wallet,
  LayoutDashboard, Star, Filter, Settings,
  Bell, Plus, Trash2, CreditCard, RefreshCw,
  ChevronUp, ChevronDown, Globe, Brain, Bot, Send,
  CheckCircle, AlertTriangle, Zap, ArrowUpRight, ArrowDownRight,
  BarChart2, Mail, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../lib/store";
import {
  getQuote, getCandles, getProfile, getMetrics, getEarnings,
  getRecommendations, getNews, getCryptoQuote, searchSymbol,
  getClaudeAnalysis, mockCandles,
  US_STOCKS, INDIA_STOCKS, CRYPTO_LIST,
  MARKET_INDICES, FinnhubWS, isUSMarketOpen, isIndiaMarketOpen,
  safeN,
  type Quote, type Candle, type Profile, type Metrics,
  type NewsItem, type SearchResult, type EarningsItem, type RecommendationItem,
} from "../lib/api";

// -- helpers ------------------------------------------------------------------
const fmtPrice = (v: unknown, decimals = 2): string => {
  const n = safeN(v);
  return n.toFixed(decimals);
};
const fmtBig = (v: unknown, prefix = ''): string => {
  const n = safeN(v);
  if (n >= 1e12) return prefix + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return prefix + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return prefix + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return prefix + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return prefix + n.toFixed(2);
};
const timeAgo = (ts: number): string => {
  const d = Math.floor((Date.now() - (ts < 1e12 ? ts * 1000 : ts)) / 60000);
  if (d < 60) return d + 'm ago';
  if (d < 1440) return Math.floor(d / 60) + 'h ago';
  return Math.floor(d / 1440) + 'd ago';
};
const fmtDate = (ts: number): string =>
  new Date(ts * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

const UP_COLOR = '#10b981';
const DOWN_COLOR = '#f43f5e';
const BLUE = '#6366f1';

// -- Sparkline ----------------------------------------------------------------
function Spark({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return <div style={{ width: 72, height: 24 }} />;
  const vals = data.map(safeN);
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const pts = vals.map((v, i) =>
    `${(i / (vals.length - 1)) * 70},${22 - ((v - min) / range) * 20}`
  ).join(' ');
  const color = up ? UP_COLOR : DOWN_COLOR;
  return (
    <svg width={72} height={24} viewBox="0 0 72 24">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// -- Badge --------------------------------------------------------------------
function Badge({ dp }: { dp: number | undefined }) {
  const v = safeN(dp);
  const up = v >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: up ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
      color: up ? UP_COLOR : DOWN_COLOR,
      border: `1px solid ${up ? 'rgba(16,185,129,0.22)' : 'rgba(244,63,94,0.22)'}`,
      fontFamily: 'DM Mono, monospace',
      letterSpacing: '0.02em',
    }}>
      {up ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      {up ? '+' : ''}{v.toFixed(2)}%
    </span>
  );
}


// -- Market overview bar ─────────────────────────────────────────────────────
function MarketOverviewBar({ onSelect }: { onSelect: (s: string) => void }) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [usOpen] = useState(isUSMarketOpen);
  const [inOpen] = useState(isIndiaMarketOpen);

  useEffect(() => {
    const load = () => MARKET_INDICES.forEach(({ symbol }) =>
      getQuote(symbol).then(q => setQuotes(p => ({ ...p, [symbol]: q })))
    );
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em',
        background: usOpen ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
        color: usOpen ? '#10b981' : '#64748b',
        border: `1px solid ${usOpen ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
      }}>
        {usOpen ? '● US OPEN' : '○ US CLOSED'}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em',
        background: inOpen ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
        color: inOpen ? '#10b981' : '#64748b',
        border: `1px solid ${inOpen ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
      }}>
        {inOpen ? '● IN OPEN' : '○ IN CLOSED'}
      </span>
      <span style={{ width: 1, height: 16, background: 'rgba(99,102,241,0.15)', flexShrink: 0 }} />
      {MARKET_INDICES.map(({ symbol, abbr }) => {
        const q = quotes[symbol];
        const up = safeN(q?.dp) >= 0;
        return (
          <div key={symbol} onClick={() => onSelect(symbol)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              background: 'rgba(11,13,28,0.8)', border: '1px solid rgba(99,102,241,0.10)',
              borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.10)')}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>{abbr}</span>
            {q ? (
              <>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>
                  ${fmtPrice(q.c)}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>
                  {up ? '+' : ''}{fmtPrice(q.dp)}%
                </span>
              </>
            ) : (
              <span className="skeleton" style={{ width: 64, height: 14, borderRadius: 4 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// -- Ticker tape --------------------------------------------------------------
function Ticker({ quotes }: { quotes: Record<string, Quote> }) {
  const items = Object.entries(quotes);
  if (!items.length) return null;
  const tape = [...items, ...items];
  return (
    <div className="ticker-wrap" style={{ borderBottom: '1px solid rgba(99,102,241,0.10)', background: '#03030a', padding: '7px 0', flexShrink: 0 }}>
      <div className="ticker" style={{ display: 'flex', gap: 0, width: 'max-content', paddingLeft: 16 }}>
        {tape.map(([sym, q], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingRight: 40 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em' }}>
              {sym.replace('NSE:', '')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', fontFamily: 'DM Mono, monospace' }}>
              ${fmtPrice(q?.c)}
            </span>
            <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: safeN(q?.dp) >= 0 ? UP_COLOR : DOWN_COLOR }}>
              {safeN(q?.dp) >= 0 ? '+' : ''}{fmtPrice(q?.dp)}%
            </span>
            <span style={{ color: 'rgba(99,102,241,0.25)', fontSize: 8, flexShrink: 0 }}>◆</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function PriceChart({ candles, symbol, quote }: { candles: Candle[]; symbol: string; quote: Quote | null }) {
  const [range, setRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('3M');
  const days = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[range];
  const data = candles.slice(-days).map(c => ({
    date: fmtDate(c.t), price: c.c, vol: Math.round(c.v / 1e6 * 10) / 10,
  }));
  const first = safeN(data[0]?.price), last = safeN(data[data.length - 1]?.price);
  const up = last >= first;
  const color = up ? UP_COLOR : DOWN_COLOR;
  const gradId = 'g' + symbol.replace(/[^a-z]/gi, '');
  const pct = first ? ((last - first) / first * 100) : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', letterSpacing: '-0.02em' }}>
              ${fmtPrice(quote?.c)}
            </span>
            {quote && <Badge dp={quote.dp} />}
            <span style={{ fontSize: 12, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>
              {up ? '+' : ''}{pct.toFixed(2)}% ({range})
            </span>
          </div>
          {quote && (
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              {[['O', quote.o], ['H', quote.h], ['L', quote.l], ['Prev', quote.pc]].map(([l, v]) => (
                <span key={l as string} style={{ fontSize: 11, color: '#64748b' }}>
                  <span style={{ color: '#475569', marginRight: 4 }}>{l}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>${fmtPrice(v)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['1W', '1M', '3M', '6M', '1Y'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{
                padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: range === r ? 'rgba(99,102,241,0.20)' : 'transparent',
                color: range === r ? '#818cf8' : '#475569',
                border: range === r ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(99,102,241,0.10)',
                cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.02em',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 220, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(99,102,241,0.08)" strokeDasharray="4 10" />
            <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace' }} />
            <YAxis stroke="transparent" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace' }} domain={['auto', 'auto']} width={60} />
            <Tooltip
              contentStyle={{ background: '#0b0d1c', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, fontSize: 12, fontFamily: 'DM Mono, monospace' }}
              labelStyle={{ color: '#64748b' }}
              formatter={(v: unknown) => ['$' + fmtPrice(v), 'Price']}
            />
            <Area type="monotone" dataKey="price" stroke={color} fill={'url(#' + gradId + ')'} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ height: 60, minWidth: 0, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Bar dataKey="vol" fill="rgba(99,102,241,0.18)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// -- About / fundamentals ----------------------------------------------------
function AboutPanel({ symbol }: { symbol: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [recs, setRecs] = useState<RecommendationItem[]>([]);

  useEffect(() => {
    setProfile(null); setMetrics(null); setEarnings([]); setRecs([]);
    getProfile(symbol).then(setProfile);
    getMetrics(symbol).then(setMetrics);
    getEarnings(symbol).then(setEarnings);
    getRecommendations(symbol).then(setRecs);
  }, [symbol]);

  const stats = [
    { label: 'P/E Ratio', value: metrics?.peNormalizedAnnual?.toFixed(1) ?? 'â€”' },
    { label: 'EPS (TTM)', value: metrics?.epsNormalizedAnnual ? '$' + metrics.epsNormalizedAnnual.toFixed(2) : 'â€”' },
    { label: 'Market Cap', value: metrics?.marketCapitalization ? fmtBig(metrics.marketCapitalization * 1e6, '$') : 'â€”' },
    { label: '52W High', value: metrics?.weekHigh52 ? '$' + safeN(metrics.weekHigh52).toFixed(2) : 'â€”' },
    { label: '52W Low', value: metrics?.weekLow52 ? '$' + safeN(metrics.weekLow52).toFixed(2) : 'â€”' },
    { label: 'Beta', value: metrics?.beta?.toFixed(2) ?? 'â€”' },
    { label: 'ROE', value: metrics?.roeRfy ? safeN(metrics.roeRfy).toFixed(1) + '%' : 'â€”' },
    { label: 'Div Yield', value: metrics?.dividendYieldIndicatedAnnual ? safeN(metrics.dividendYieldIndicatedAnnual).toFixed(2) + '%' : 'â€”' },
    { label: 'P/B', value: metrics?.pbAnnual?.toFixed(2) ?? 'â€”' },
    { label: 'D/E', value: metrics?.debtEquityAnnual?.toFixed(2) ?? 'â€”' },
  ];

  const latest = recs[0];
  const total = latest ? (latest.buy + latest.hold + latest.sell + latest.strongBuy + latest.strongSell) || 1 : 1;
  const buyPct = latest ? Math.round((latest.buy + latest.strongBuy) / total * 100) : 0;
  const holdPct = latest ? Math.round(latest.hold / total * 100) : 0;
  const sellPct = latest ? Math.round((latest.sell + latest.strongSell) / total * 100) : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      {profile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          {profile.logo && (
            <Image src={profile.logo} alt={profile.name} width={36} height={36}
              style={{ borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 3 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{profile.finnhubIndustry} Â· {profile.exchange}</div>
          </div>
          {profile.weburl && (
            <a href={profile.weburl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: BLUE, textDecoration: 'none' }}>Website â†—</a>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: '#06081a', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {latest && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analyst Ratings ({latest.period})</div>
          <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 6, marginBottom: 6 }}>
            <div style={{ width: buyPct + '%', background: UP_COLOR }} />
            <div style={{ width: holdPct + '%', background: '#f59e0b' }} />
            <div style={{ width: sellPct + '%', background: DOWN_COLOR }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: UP_COLOR }}>Buy {buyPct}%</span>
            <span style={{ color: '#f59e0b' }}>Hold {holdPct}%</span>
            <span style={{ color: DOWN_COLOR }}>Sell {sellPct}%</span>
          </div>
        </div>
      )}

      {earnings.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>EPS History</div>
          <div style={{ height: 90, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earnings.slice(0, 6).reverse().map(e => ({
                q: `Q${e.quarter} ${e.year}`, actual: e.epsActual, estimate: e.epsEstimate,
              }))}>
                <XAxis dataKey="q" tick={{ fill: '#475569', fontSize: 9 }} stroke="transparent" />
                <Tooltip contentStyle={{ background: '#0b0d1c', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="actual" fill={BLUE} radius={[3, 3, 0, 0]} name="Actual" />
                <Bar dataKey="estimate" fill="#131628" radius={[3, 3, 0, 0]} name="Estimate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Claude AI ----------------------------------------------------------------â”€
function ClaudePanel({ symbol, quote, metrics }: { symbol: string; quote: Quote | null; metrics: Metrics | null }) {
  const { claudeKey, setClaudeKey } = useStore();
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyInput, setKeyInput] = useState(claudeKey);
  const [editing, setEditing] = useState(false);

  const run = async () => {
    if (!claudeKey || !quote) return;
    setLoading(true); setAnalysis('');
    const r = await getClaudeAnalysis(claudeKey, symbol, quote, metrics);
    setAnalysis(r); setLoading(false);
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={15} color="#6366f1" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Claude AI Analysis</span>
        </div>
        <button onClick={() => setEditing(!editing)}
          style={{ fontSize: 11, color: BLUE, background: 'none', border: 'none', cursor: 'pointer' }}>
          {claudeKey ? 'Change key' : 'Add API key'}
        </button>
      </div>

      {editing && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
            Your Anthropic API key. Stored in your browser, never on our servers.
          </p>
          <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
            placeholder="sk-ant-..."
            style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => { setClaudeKey(keyInput); setEditing(false); }}
              style={{ flex: 1, padding: '7px 0', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}>
              Save
            </button>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: '7px 0', background: 'rgba(99,102,241,0.12)', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'block' }}>
              Get key â†—
            </a>
          </div>
        </div>
      )}

      {!claudeKey && !editing ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 13 }}>
          <Brain size={28} color="#131628" style={{ margin: '0 auto 8px' }} />
          <p>Add your Claude API key to get AI stock analysis</p>
        </div>
      ) : claudeKey && !editing && (
        <button onClick={run} disabled={loading || !quote}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: loading ? 'rgba(99,102,241,0.10)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, opacity: loading || !quote ? 0.7 : 1,
          }}>
          {loading ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Zap size={13} /> Analyze {symbol}</>}
        </button>
      )}

      {analysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginTop: 12, padding: '12px 14px', background: '#06081a', borderRadius: 8, border: '1px solid rgba(99,102,241,0.12)' }}>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>{analysis}</p>
        </motion.div>
      )}
    </div>
  );
}

// -- News ----------------------------------------------------------------------
function NewsPanel({ symbol }: { symbol?: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  useEffect(() => {
    setLoading(true);
    getNews(symbol).then(d => { setNews(d); setLoading(false); });
  }, [symbol]);

  const shown = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
          {symbol ? symbol.replace('NSE:', '') + ' News' : 'Market News'}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'positive', 'negative'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: 'none', textTransform: 'capitalize',
                background: filter === f ? (f === 'positive' ? 'rgba(34,197,94,0.15)' : f === 'negative' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.12)') : 'transparent',
                color: filter === f ? (f === 'positive' ? UP_COLOR : f === 'negative' ? DOWN_COLOR : '#94a3b8') : '#475569',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 360, overflowY: 'auto' }}>
          {shown.map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 8px', borderRadius: 8, textDecoration: 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0b0d1c')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {item.sentiment === 'positive' ? <ArrowUpRight size={13} color={UP_COLOR} /> :
                  item.sentiment === 'negative' ? <ArrowDownRight size={13} color={DOWN_COLOR} /> :
                    <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#131628' }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.headline}
                </p>
                <p style={{ fontSize: 10, color: '#475569', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>
                  {item.source} Â· {timeAgo(item.datetime)}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Watchlist ----------------------------------------------------------------â”€
function WatchlistPanel({ onSelect, selected }: { onSelect: (s: string) => void; selected: string }) {
  const { watchlist, addWatch, removeWatch } = useStore();
  const [input, setInput] = useState('');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [hist, setHist] = useState<Record<string, number[]>>({});

  const loadQ = useCallback((sym: string) => {
    getQuote(sym).then(q => {
      setQuotes(p => ({ ...p, [sym]: q }));
      setHist(p => { const h = [...(p[sym] || []), safeN(q.c)].slice(-20); return { ...p, [sym]: h }; });
    });
  }, []);

  useEffect(() => {
    watchlist.forEach(({ symbol }) => loadQ(symbol));
    const t = setInterval(() => watchlist.forEach(({ symbol }) => loadQ(symbol)), 20000);
    return () => clearInterval(t);
  }, [watchlist, loadQ]);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Star size={14} color="#f59e0b" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Watchlist</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => {
            if (e.key === 'Enter' && input.trim()) {
              addWatch({ symbol: input.trim(), name: input.trim() });
              setInput('');
            }
          }}
          placeholder="Add symbol..." maxLength={15}
          style={{ flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        <button onClick={() => { if (input.trim()) { addWatch({ symbol: input.trim(), name: input.trim() }); setInput(''); } }}
          style={{ padding: '7px 12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 0 12px rgba(99,102,241,0.25)' }}>
          <Plus size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
        {watchlist.map(({ symbol, name }) => {
          const q = quotes[symbol];
          const up = safeN(q?.dp) >= 0;
          const h = hist[symbol] || [safeN(q?.pc), safeN(q?.c)];
          return (
            <div key={symbol} onClick={() => onSelect(symbol)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.1s',
                background: selected === symbol ? 'rgba(59,130,246,0.08)' : 'transparent',
                border: '1px solid ' + (selected === symbol ? 'rgba(59,130,246,0.2)' : 'transparent'),
              }}
              onMouseEnter={e => { if (selected !== symbol) e.currentTarget.style.background = '#0b0d1c'; }}
              onMouseLeave={e => { if (selected !== symbol) e.currentTarget.style.background = 'transparent'; }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selected === symbol ? BLUE : '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>
                  {symbol.replace('NSE:', '')}
                </div>
                <div style={{ fontSize: 10, color: '#475569' }}>{name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spark data={h} up={up} />
                <div style={{ textAlign: 'right', minWidth: 64 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>
                    ${fmtPrice(q?.c)}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: up ? UP_COLOR : DOWN_COLOR }}>
                    {up ? '+' : ''}{fmtPrice(q?.dp)}%
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); removeWatch(symbol); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#131628', padding: 2 }}
                  onMouseEnter={e => (e.currentTarget.style.color = DOWN_COLOR)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#131628')}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -- Alerts --------------------------------------------------------------------
function AlertsPanel() {
  const { alerts, addAlert, removeAlert, toggleAlert } = useStore();
  const [sym, setSym] = useState('');
  const [cond, setCond] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Bell size={14} color="#f59e0b" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Price Alerts</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <input value={sym} onChange={e => setSym(e.target.value.toUpperCase())} placeholder="Symbol"
          style={{ background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={cond} onChange={e => setCond(e.target.value as 'above' | 'below')}
            style={{ flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#f1f5f9', outline: 'none' }}>
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number"
            style={{ flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        </div>
        <button onClick={() => { if (sym && price) { addAlert({ symbol: sym, condition: cond, price: parseFloat(price), active: true }); setSym(''); setPrice(''); } }}
          style={{ padding: '8px 0', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: 9, color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
          + Set Alert
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
        {alerts.length === 0 && <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '12px 0' }}>No alerts set</p>}
        {alerts.map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#06081a', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => toggleAlert(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {a.triggered ? <AlertTriangle size={14} color="#f59e0b" /> : a.active ? <CheckCircle size={14} color={UP_COLOR} /> : <CheckCircle size={14} color="#131628" />}
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{a.symbol}</span>
              <span style={{ fontSize: 11, color: '#475569', fontFamily: 'DM Mono, monospace' }}>{a.condition} ${a.price}</span>
            </div>
            <button onClick={() => removeAlert(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#131628' }}
              onMouseEnter={e => (e.currentTarget.style.color = DOWN_COLOR)}
              onMouseLeave={e => (e.currentTarget.style.color = '#131628')}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Markets grid --------------------------------------------------------------
function MarketsGrid({ onSelect }: { onSelect: (s: string) => void }) {
  const { market, setMarket } = useStore();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setQuotes({});
    const stocks = market === 'india' ? INDIA_STOCKS : market === 'crypto' ? CRYPTO_LIST.map(c => ({ ...c, sector: 'Crypto' })) : US_STOCKS;
    const fn = market === 'crypto' ? getCryptoQuote : getQuote;
    Promise.all(stocks.map(({ symbol }) =>
      fn(symbol).then(q => [symbol, q] as const)
    )).then(results => {
      const map: Record<string, Quote> = {};
      results.forEach(([s, q]) => { map[s] = q; });
      setQuotes(map);
      setLoading(false);
    });
  }, [market]);

  const stocks = market === 'india' ? INDIA_STOCKS : market === 'crypto' ? CRYPTO_LIST.map(c => ({ ...c, sector: 'Crypto' })) : US_STOCKS;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={14} color="#64748b" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Markets</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['us', 'india', 'crypto'] as const).map(m => (
            <button key={m} onClick={() => setMarket(m)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: market === m ? 'rgba(99,102,241,0.18)' : 'transparent',
                color: market === m ? '#818cf8' : '#64748b',
                border: market === m ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(99,102,241,0.10)',
                textTransform: 'uppercase',
              }}>
              {m === 'us' ? 'US' : m === 'india' ? 'IN' : 'Crypto'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {loading
          ? Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)
          : stocks.map(({ symbol, name }) => {
            const q = quotes[symbol];
            const up = safeN(q?.dp) >= 0;
            const hist = [safeN(q?.pc) * 0.99, safeN(q?.pc), safeN(q?.o), safeN(q?.l), safeN(q?.c)];
            return (
              <div key={symbol} onClick={() => onSelect(symbol)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: '#06081a',
                  border: '1px solid transparent', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.28)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', marginBottom: 2 }}>
                    {symbol.replace('NSE:', '')}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Spark data={hist} up={up} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>${fmtPrice(q?.c)}</div>
                    <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: up ? UP_COLOR : DOWN_COLOR }}>
                      {up ? '+' : ''}{fmtPrice(q?.dp)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}


// -- Portfolio Analytics -------------------------------------------------------
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899', '#22d3ee'];

function PortfolioAnalyticsPanel() {
  const { portfolio, balance } = useStore();

  if (portfolio.length === 0) return null;

  const totalCost = portfolio.reduce((s, p) => s + safeN(p.avgPrice) * safeN(p.quantity), 0);
  const totalVal  = portfolio.reduce((s, p) => s + safeN(p.currentPrice || p.avgPrice) * safeN(p.quantity), 0);
  const pnl = totalVal - totalCost;
  const pnlPct = totalCost ? (pnl / totalCost) * 100 : 0;

  // Simulated returns for Sharpe (based on position P&L as a proxy)
  const returns = portfolio.map(p => {
    const cur = safeN(p.currentPrice || p.avgPrice);
    const cost = safeN(p.avgPrice);
    return cost ? (cur - cost) / cost : 0;
  });
  const avgReturn = returns.reduce((s, r) => s + r, 0) / (returns.length || 1);
  const variance = returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length || 1);
  const stdDev = Math.sqrt(variance);
  const riskFreeDaily = 0.045 / 252;
  const sharpeNum = stdDev > 0 ? (avgReturn - riskFreeDaily) / stdDev : null;
  const sharpeStr = sharpeNum !== null ? sharpeNum.toFixed(2) : 'N/A';

  // Max drawdown: worst single position P&L %
  const drawdowns = returns.map(r => r < 0 ? r * 100 : 0);
  const maxDrawdown = Math.min(0, ...drawdowns).toFixed(1);

  // Best / worst position
  const sorted = [...portfolio].sort((a, b) => {
    const ra = safeN(a.avgPrice) ? (safeN(a.currentPrice || a.avgPrice) - safeN(a.avgPrice)) / safeN(a.avgPrice) : 0;
    const rb = safeN(b.avgPrice) ? (safeN(b.currentPrice || b.avgPrice) - safeN(b.avgPrice)) / safeN(b.avgPrice) : 0;
    return rb - ra;
  });
  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Allocation data for pie
  const alloc = portfolio.map(p => ({
    name: p.symbol.replace('NSE:', ''),
    value: Math.round(safeN(p.currentPrice || p.avgPrice) * safeN(p.quantity)),
  }));
  if (balance > 0) alloc.push({ name: 'Cash', value: Math.round(balance) });

  const bestPct  = best  && safeN(best.avgPrice)  ? (safeN(best.currentPrice  || best.avgPrice)  - safeN(best.avgPrice))  / safeN(best.avgPrice)  * 100 : 0;
  const worstPct = worst && safeN(worst.avgPrice) ? (safeN(worst.currentPrice || worst.avgPrice) - safeN(worst.avgPrice)) / safeN(worst.avgPrice) * 100 : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BarChart2 size={14} color="#6366f1" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Portfolio Analytics</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Total Return', val: (pnlPct >= 0 ? '+' : '') + pnlPct.toFixed(2) + '%', color: pnlPct >= 0 ? '#10b981' : '#f43f5e' },
          { label: 'Sharpe Ratio', val: sharpeStr, color: sharpeNum !== null && sharpeNum > 1 ? '#10b981' : '#f59e0b' },
          { label: 'Max Drawdown', val: maxDrawdown + '%', color: parseFloat(maxDrawdown) < -10 ? '#f43f5e' : '#f59e0b' },
          { label: 'Positions', val: String(portfolio.length), color: '#f1f5f9' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#06081a', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'DM Mono, monospace' }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Top Performer</div>
          {best && (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{best.symbol.replace('NSE:', '')}</div>
              <div style={{ fontSize: 12, color: '#10b981', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{bestPct >= 0 ? '+' : ''}{bestPct.toFixed(2)}%</div>
            </div>
          )}
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Worst Performer</div>
          {worst && (
            <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{worst.symbol.replace('NSE:', '')}</div>
              <div style={{ fontSize: 12, color: '#f43f5e', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{worstPct.toFixed(2)}%</div>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Allocation</div>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={alloc} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                  dataKey="value" nameKey="name" paddingAngle={2} stroke="none">
                  {alloc.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0b0d1c', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, fontSize: 11, fontFamily: 'DM Mono, monospace' }}
                  formatter={(v: unknown) => ['$' + safeN(v).toLocaleString(), 'Value']}
                />
                <Legend iconType="circle" iconSize={7}
                  formatter={(v) => <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Alpaca Live Trade -------------------------------------------------------
function AlpacaTradePanel({ symbol }: { symbol: string }) {
  const { alpacaKey, alpacaSecret, alpacaMode } = useStore();
  const [qty, setQty] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!alpacaKey || !alpacaSecret) return null;

  const place = async () => {
    if (!qty || parseFloat(qty) <= 0) return;
    setLoading(true); setStatus(null);
    try {
      const r = await fetch('/api/alpaca-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, qty: parseFloat(qty), side, apiKey: alpacaKey, apiSecret: alpacaSecret, mode: alpacaMode }),
      });
      const d = await r.json();
      if (!r.ok) setStatus({ ok: false, msg: d.error || 'Order failed' });
      else setStatus({ ok: true, msg: `Order #${d.id?.slice(0, 8)} submitted — ${d.status}` });
    } catch { setStatus({ ok: false, msg: 'Network error' }); }
    setLoading(false);
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Activity size={13} color="#10b981" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Live Trade — Alpaca</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em',
          background: alpacaMode === 'live' ? 'rgba(244,63,94,0.10)' : 'rgba(245,158,11,0.10)',
          color: alpacaMode === 'live' ? '#f43f5e' : '#f59e0b',
          border: `1px solid ${alpacaMode === 'live' ? 'rgba(244,63,94,0.22)' : 'rgba(245,158,11,0.22)'}`,
        }}>{alpacaMode === 'live' ? '⚡ LIVE' : '📋 PAPER'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['buy', 'sell'] as const).map(s => (
          <button key={s} onClick={() => setSide(s)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              background: side === s ? (s === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)') : '#06081a',
              color: side === s ? (s === 'buy' ? '#10b981' : '#f43f5e') : '#475569',
              border: `1px solid ${side === s ? (s === 'buy' ? 'rgba(16,185,129,0.30)' : 'rgba(244,63,94,0.30)') : 'rgba(99,102,241,0.10)'}`,
            }}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1" placeholder="Qty"
          style={{ flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        <button onClick={place} disabled={loading || !qty}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
            background: side === 'buy' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f43f5e,#e11d48)',
            color: '#fff', opacity: loading || !qty ? 0.5 : 1,
          }}>{loading ? '...' : `${side.toUpperCase()} ${symbol.replace('NSE:', '')}`}</button>
      </div>
      {status && (
        <div style={{ fontSize: 11, padding: '6px 10px', borderRadius: 7, fontFamily: 'DM Mono, monospace',
          background: status.ok ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
          color: status.ok ? '#10b981' : '#f43f5e',
          border: `1px solid ${status.ok ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}`,
        }}>{status.msg}</div>
      )}
    </div>
  );
}

// -- Portfolio ----------------------------------------------------------------â”€
function PortfolioPage({ onSelect }: { onSelect: (s: string) => void }) {
  const { portfolio, balance, removePosition } = useStore();
  const totalVal = portfolio.reduce((s, p) => s + safeN(p.currentPrice || p.avgPrice) * safeN(p.quantity), 0);
  const totalCost = portfolio.reduce((s, p) => s + safeN(p.avgPrice) * safeN(p.quantity), 0);
  const pnl = totalVal - totalCost;
  const pnlPct = totalCost ? (pnl / totalCost * 100) : 0;
  const [selectedSym, setSelectedSym] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Value', value: '$' + (totalVal + balance).toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: 'Portfolio + Cash' },
          { label: 'Invested', value: '$' + totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: portfolio.length + ' positions' },
          { label: 'P&L', value: (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(0), color: pnl >= 0 ? UP_COLOR : DOWN_COLOR, sub: fmtPrice(pnlPct) + '%' },
          { label: 'Cash', value: '$' + balance.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: 'Available' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: color || '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 14 }}>Positions</div>
        {portfolio.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
            <p style={{ fontSize: 14 }}>No positions yet</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Search a symbol to start tracking</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 24px', gap: 8, padding: '0 10px', marginBottom: 4 }}>
              {['Symbol', 'Shares', 'Avg Price', 'Value', 'P&L', ''].map(h => (
                <span key={h} style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
              ))}
            </div>
            {portfolio.map(p => {
              const cur = safeN(p.currentPrice || p.avgPrice);
              const cost = safeN(p.avgPrice);
              const qty = safeN(p.quantity);
              const val = cur * qty;
              const pl = (cur - cost) * qty;
              const plPct = cost ? ((cur - cost) / cost * 100) : 0;
              return (
                <div key={p.symbol} onClick={() => { onSelect(p.symbol); setSelectedSym(p.symbol); }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 24px',
                    gap: 8, padding: '10px', borderRadius: 8, cursor: 'pointer', background: '#06081a',
                    alignItems: 'center', border: '1px solid transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{p.symbol}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{p.name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>{qty}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>${cost.toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>${val.toFixed(2)}</div>
                  <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: pl >= 0 ? UP_COLOR : DOWN_COLOR, fontWeight: 600 }}>
                    {pl >= 0 ? '+' : ''}{pl.toFixed(2)}<br />
                    <span style={{ fontSize: 10 }}>({fmtPrice(plPct)}%)</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removePosition(p.symbol); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#131628', padding: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.color = DOWN_COLOR)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#131628')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <PortfolioAnalyticsPanel />
      {selectedSym && <AlpacaTradePanel symbol={selectedSym} />}
      {portfolio.length > 0 && !selectedSym && (
        <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: '4px 0', fontFamily: 'DM Mono, monospace' }}>
          Click a position to enable Alpaca live trade for that symbol
        </div>
      )}
    </div>
  );
}

// -- Screener ------------------------------------------------------------------
function ScreenerPage({ onSelect }: { onSelect: (s: string) => void }) {
  const { recentSymbols, addRecent } = useStore();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(-1);
  const [previewQuotes, setPreviewQuotes] = useState<Record<string, Quote>>({});
  const [recentQuotes, setRecentQuotes] = useState<Record<string, Quote>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Search with debounce
  useEffect(() => {
    if (q.length < 2) { setResults([]); setFocused(-1); return; }
    setLoading(true);
    const t = setTimeout(() => {
      searchSymbol(q).then(r => { setResults(r); setLoading(false); setFocused(-1); });
    }, 380);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch live quotes for top search results
  useEffect(() => {
    if (results.length === 0) return;
    const top = results.slice(0, 5);
    top.forEach(r => getQuote(r.symbol).then(qr => setPreviewQuotes(p => ({ ...p, [r.symbol]: qr }))));
  }, [results]);

  // Fetch quotes for recently viewed
  useEffect(() => {
    recentSymbols.forEach(sym => getQuote(sym).then(qr => setRecentQuotes(p => ({ ...p, [sym]: qr }))));
  }, [recentSymbols]);

  const pick = (sym: string) => { addRecent(sym); onSelect(sym); };

  // Keyboard navigation
  const handleKey = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter' && focused >= 0) { e.preventDefault(); pick(results[focused].symbol); }
    if (e.key === 'Escape')    { setQ(''); setResults([]); setFocused(-1); }
  };

  const presets = [
    { label: 'Magnificent 7',    syms: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'] },
    { label: 'Indian Blue Chips', syms: ['NSE:RELIANCE', 'NSE:TCS', 'NSE:HDFCBANK', 'NSE:INFY'] },
    { label: 'Crypto Top 5',     syms: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'] },
    { label: 'Finance Leaders',  syms: ['JPM', 'BAC', 'GS', 'MS', 'WFC'] },
    { label: 'AI Plays',         syms: ['NVDA', 'MSFT', 'GOOGL', 'AMD', 'PLTR', 'C3.AI'] },
    { label: 'EV & Clean Energy',syms: ['TSLA', 'RIVN', 'NIO', 'ENPH', 'FSLR'] },
    { label: 'Indian IT',        syms: ['NSE:TCS', 'NSE:INFY', 'NSE:WIPRO', 'NSE:HCLTECH'] },
    { label: 'Dividend Kings',   syms: ['JNJ', 'PG', 'KO', 'MMM', 'CL'] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      {/* Search */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 14, letterSpacing: '-0.01em' }}>
          Deep Symbol Search
        </div>
        <div style={{ position: 'relative', marginBottom: results.length > 0 ? 0 : 0 }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value.toUpperCase())}
            onKeyDown={handleKey}
            placeholder="Search any stock, ETF, crypto, index…"
            autoComplete="off"
            style={{
              width: '100%', background: '#06081a',
              border: '1px solid rgba(99,102,241,0.16)', borderRadius: 10,
              padding: '11px 14px 11px 40px', fontSize: 13,
              color: '#f1f5f9', fontFamily: 'DM Mono, monospace',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.40)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.16)')}
          />
          {loading && (
            <RefreshCw size={13} color="#6366f1"
              style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', animation: 'spin 0.8s linear infinite' }} />
          )}
        </div>

        {/* Search results with live quote preview */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 10 }}>
            {results.map((r, i) => {
              const pq = previewQuotes[r.symbol];
              const up = safeN(pq?.dp) >= 0;
              return (
                <div key={r.symbol} onClick={() => pick(r.symbol)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 13px', borderRadius: 9, cursor: 'pointer',
                    background: focused === i ? 'rgba(99,102,241,0.10)' : '#06081a',
                    border: `1px solid ${focused === i ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.10)'}`,
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (focused !== i) { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)'; } }}
                  onMouseLeave={e => { if (focused !== i) { e.currentTarget.style.background = '#06081a'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.10)'; } }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', fontFamily: 'DM Mono, monospace' }}>{r.symbol}</span>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 10 }}>{r.description}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {pq ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>${fmtPrice(pq.c)}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>{up ? '+' : ''}{fmtPrice(pq.dp)}%</span>
                      </div>
                    ) : (
                      <span className="skeleton" style={{ width: 80, height: 14, borderRadius: 4 }} />
                    )}
                    <span style={{ fontSize: 10, color: '#475569', background: 'rgba(99,102,241,0.10)', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>{r.type}</span>
                  </div>
                </div>
              );
            })}
            <p style={{ fontSize: 10, color: '#2d3a52', textAlign: 'center', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
              ↑↓ navigate · Enter select · Esc clear
            </p>
          </div>
        )}
      </div>

      {/* Recently Viewed */}
      {recentSymbols.length > 0 && q.length === 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Recently Viewed
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recentSymbols.map(sym => {
              const rq = recentQuotes[sym];
              const up = safeN(rq?.dp) >= 0;
              return (
                <div key={sym} onClick={() => pick(sym)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                    background: '#06081a', border: '1px solid rgba(99,102,241,0.12)',
                    borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)'; }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', fontFamily: 'DM Mono, monospace' }}>
                    {sym.replace('NSE:', '')}
                  </span>
                  {rq ? (
                    <>
                      <span style={{ fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>${fmtPrice(rq.c)}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>
                        {up ? '+' : ''}{fmtPrice(rq.dp)}%
                      </span>
                    </>
                  ) : (
                    <span className="skeleton" style={{ width: 64, height: 12, borderRadius: 4 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Screens */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 14 }}>Preset Screens</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {presets.map(p => (
            <div key={p.label} style={{ background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>{p.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.syms.map(s => (
                  <button key={s} onClick={() => pick(s)}
                    style={{ padding: '4px 10px', background: '#090b1c', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 20, fontSize: 11, color: '#64748b', cursor: 'pointer', fontFamily: 'DM Mono, monospace', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#64748b'; }}>
                    {s.replace('NSE:', '')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// -- Settings ------------------------------------------------------------------
function SettingsPage() {
  const { claudeKey, setClaudeKey, alpacaKey, setAlpacaKey, alpacaSecret, setAlpacaSecret, alpacaMode, setAlpacaMode, notifyEmail, setNotifyEmail } = useStore();
  const [k, setK] = useState(claudeKey);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [aKey, setAKey] = useState(alpacaKey);
  const [aSecret, setASecret] = useState(alpacaSecret);
  const [alpacaSaved, setAlpacaSaved] = useState(false);
  const [emailInput, setEmailInput] = useState(notifyEmail);
  const [emailSaved, setEmailSaved] = useState(false);

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const r = await fetch('/api/checkout', { method: 'POST' });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
    } catch { alert('Payment unavailable.'); }
    finally { setUpgrading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      {/* Claude AI */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Brain size={16} color="#6366f1" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Claude AI Integration</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
          Connect your Anthropic API key to get real-time AI analysis for any stock directly in the dashboard. Your key is stored only in your browser.
        </p>
        <input type="password" value={k} onChange={e => setK(e.target.value)}
          placeholder="sk-ant-api03-..."
          style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setClaudeKey(k); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            style={{ flex: 1, padding: '9px 0', background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: saved ? UP_COLOR : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saved ? '\u2713 Saved' : 'Save API Key'}
          </button>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 0', background: 'rgba(99,102,241,0.12)', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Get API Key \u2197
          </a>
        </div>
        {claudeKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: UP_COLOR }}>
            <CheckCircle size={13} /> Claude AI connected
          </div>
        )}
      </div>

      {/* Alpaca Brokerage */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Activity size={15} color="#10b981" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Alpaca Brokerage</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: alpacaKey ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
            color: alpacaKey ? '#10b981' : '#475569',
            border: `1px solid ${alpacaKey ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
          }}>{alpacaKey ? '\u25cf Connected' : '\u25cb Not connected'}</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
          Connect Alpaca to execute real trades. Paper trading is risk-free. Your keys are stored only in your browser.
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['paper', 'live'] as const).map(m => (
            <button key={m} onClick={() => setAlpacaMode(m)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: alpacaMode === m ? (m === 'live' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.12)') : '#06081a',
                color: alpacaMode === m ? (m === 'live' ? '#f43f5e' : '#f59e0b') : '#475569',
                border: `1px solid ${alpacaMode === m ? (m === 'live' ? 'rgba(244,63,94,0.30)' : 'rgba(245,158,11,0.25)') : 'rgba(99,102,241,0.10)'}`,
              }}>{m === 'live' ? '\u26a1 Live Trading' : '\ud83d\udccb Paper Trading'}</button>
          ))}
        </div>
        {alpacaMode === 'live' && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: 8, fontSize: 11, color: '#f43f5e' }}>
            \u26a0 Live mode uses real money. Ensure you understand the risks before placing orders.
          </div>
        )}
        <input type="password" value={aKey} onChange={e => setAKey(e.target.value)}
          placeholder="Alpaca API Key ID"
          style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
        <input type="password" value={aSecret} onChange={e => setASecret(e.target.value)}
          placeholder="Alpaca Secret Key"
          style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setAlpacaKey(aKey); setAlpacaSecret(aSecret); setAlpacaSaved(true); setTimeout(() => setAlpacaSaved(false), 2000); }}
            style={{ flex: 1, padding: '9px 0', background: alpacaSaved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, color: alpacaSaved ? UP_COLOR : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {alpacaSaved ? '\u2713 Saved' : 'Save Alpaca Keys'}
          </button>
          <a href="https://alpaca.markets/docs/api-references/trading-api/" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 0', background: 'rgba(99,102,241,0.12)', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Get Alpaca Keys \u2197
          </a>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Mail size={15} color="#f59e0b" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Email Price Alerts</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: notifyEmail ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
            color: notifyEmail ? '#10b981' : '#475569',
            border: `1px solid ${notifyEmail ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
          }}>{notifyEmail ? '\u25cf Active' : '\u25cb Off'}</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
          Get email notifications when your price alerts trigger. Requires <code style={{ background: '#06081a', padding: '1px 5px', borderRadius: 4, fontSize: 11, color: '#818cf8' }}>RESEND_API_KEY</code> to be set on the server.
        </p>
        <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
          placeholder="you@example.com"
          style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <button onClick={() => { setNotifyEmail(emailInput); setEmailSaved(true); setTimeout(() => setEmailSaved(false), 2000); }}
          style={{ width: '100%', padding: '9px 0', background: emailSaved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 8, color: emailSaved ? UP_COLOR : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {emailSaved ? '\u2713 Saved' : 'Save Email'}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>StockPro Premium</div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Upgrade for real-time streaming, unlimited alerts, and priority Claude analysis.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {['Real-time quotes', 'Unlimited alerts', 'Options chain', 'CSV export', 'Advanced screener', 'Priority AI'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
              <CheckCircle size={12} color={UP_COLOR} /> {f}
            </div>
          ))}
        </div>
        <button onClick={upgrade} disabled={upgrading} className="btn-primary" style={{ width: '100%', padding: '10px 0' }}>
          <CreditCard size={14} style={{ display: 'inline', marginRight: 6 }} />
          {upgrading ? 'Redirecting...' : 'Upgrade \u2014 $19/month'}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Data Sources</div>
        {[
          { name: 'Finnhub', desc: 'Real-time quotes, fundamentals, news', status: 'Active', link: 'https://finnhub.io' },
          { name: 'Anthropic Claude', desc: 'AI-powered stock analysis', status: claudeKey ? 'Connected' : 'Not connected', link: 'https://console.anthropic.com' },
          { name: 'Alpaca Markets', desc: 'Brokerage & order execution', status: alpacaKey ? `Connected (${alpacaMode})` : 'Not connected', link: 'https://alpaca.markets' },
        ].map(({ name, desc, status, link }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{name}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: status === 'Active' || status.startsWith('Connected') ? UP_COLOR : '#475569' }}>{status}</span>
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: BLUE }}>Manage \u2197</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// -- Symbol view --------------------------------------------------------------â”€
function SymbolView({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getQuote(symbol).then(setQuote),
      getCandles(symbol, 'D', 365).then(c => setCandles(c.length > 10 ? c : mockCandles(symbol, 365))),
      getMetrics(symbol).then(setMetrics),
    ]).finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    load();
    const t = setInterval(() => getQuote(symbol).then(setQuote), 15000);
    return () => clearInterval(t);
  }, [symbol, load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', margin: 0, letterSpacing: '-0.02em' }}>
            {symbol.replace('NSE:', '')}
          </h1>
        </div>
        {quote && <Badge dp={quote.dp} />}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.10)', padding: '4px 11px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.22)', letterSpacing: '0.05em' }}>
          <span className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          LIVE
        </span>
        <button onClick={load} disabled={loading}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 9, color: '#818cf8', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
          <RefreshCw size={12} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>
      <PriceChart candles={candles} symbol={symbol} quote={quote} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <AboutPanel symbol={symbol} />
        <ClaudePanel symbol={symbol} quote={quote} metrics={metrics} />
      </div>
    </div>
  );
}


// ─── Trade action types ──────────────────────────────────────────────────────
interface TradeAction {
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  quantity: number;
  price: number;
  reason: string;
}
interface MonitorAction {
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  reason: string;
}
interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  trade?: TradeAction;
  monitor?: MonitorAction;
  actionStatus?: 'pending' | 'executed' | 'rejected';
}

// ─── Claude AI Trade Assistant tab ──────────────────────────────────────────
function ClaudeTradeTab({ onSelect }: { onSelect: (s: string) => void }) {
  const { claudeKey, portfolio, watchlist, balance, addPosition, sellPosition, addAlert } = useStore();
  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: 'assistant',
    content: "Hi! I'm your AI trade assistant. I can analyze stocks, review your portfolio, and execute paper trades.\n\nTry asking me:\n• \"Analyze NVDA and should I buy?\"\n• \"Review my portfolio risks\"\n• \"Buy 5 shares of AAPL\"\n• \"Set a price alert for TSLA above $280\"",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg: ChatMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Build message history (only role+content, no UI fields)
    const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/claude-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, portfolio, watchlist, balance, apiKey: claudeKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'An error occurred.' }]);
      } else {
        const hasAction = data.trade || data.monitor;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          trade: data.trade ?? undefined,
          monitor: data.monitor ?? undefined,
          actionStatus: hasAction ? 'pending' : undefined,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to reach Claude. Check your API key in Settings.' }]);
    }
    setLoading(false);
  };

  const executeAction = (idx: number, confirm: boolean) => {
    const msg = messages[idx];
    if (msg.actionStatus !== 'pending') return;

    if (confirm) {
      if (msg.trade && msg.trade.action !== 'HOLD') {
        const t = msg.trade;
        if (t.action === 'BUY') {
          addPosition({ symbol: t.symbol, name: t.symbol, quantity: t.quantity, avgPrice: t.price, currentPrice: t.price });
        } else if (t.action === 'SELL') {
          sellPosition(t.symbol, t.quantity, t.price);
        }
      }
      if (msg.monitor) {
        const m = msg.monitor;
        addAlert({ symbol: m.symbol, condition: m.condition, price: m.price, active: true });
      }
    }
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, actionStatus: confirm ? 'executed' : 'rejected' } : m));
  };

  const QUICK_PROMPTS = [
    "Review my portfolio and suggest improvements",
    "What are the top momentum stocks today?",
    "Analyze risk in my current positions",
    "Find undervalued tech stocks to buy",
    "What should I sell based on my portfolio?",
    "Explain today\'s market conditions",
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, height: 'calc(100vh - 176px)', minHeight: 0 }}>
      {/* Chat panel */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(99,102,241,0.10)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(99,102,241,0.30)' }}>
            <Bot size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Claude AI Trade Assistant</span>
          <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 'auto', padding: '3px 9px', borderRadius: 20, letterSpacing: '0.04em',
            background: claudeKey ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
            color: claudeKey ? '#10b981' : '#475569',
            border: `1px solid ${claudeKey ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
          }}>
            {claudeKey ? '● Live' : '○ No API Key'}
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {/* Bubble */}
              <div style={{
                maxWidth: '82%', padding: '10px 14px', fontSize: 13, color: '#f1f5f9', lineHeight: 1.65, whiteSpace: 'pre-wrap',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(11,13,28,0.90)',
                border: msg.role === 'assistant' ? '1px solid rgba(99,102,241,0.12)' : 'none',
              }}>{msg.content}</div>

              {/* Trade card */}
              {(msg.trade || msg.monitor) && (
                <div style={{
                  maxWidth: '82%', width: '100%',
                  background: 'rgba(6,8,26,0.97)',
                  border: `1px solid ${msg.trade?.action === 'BUY' ? 'rgba(16,185,129,0.25)' : msg.trade?.action === 'SELL' ? 'rgba(244,63,94,0.25)' : 'rgba(99,102,241,0.25)'}`,
                  borderRadius: 12, padding: '13px 15px',
                }}>
                  {msg.trade && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, letterSpacing: '0.07em',
                          background: msg.trade.action === 'BUY' ? 'rgba(16,185,129,0.15)' : msg.trade.action === 'SELL' ? 'rgba(244,63,94,0.15)' : 'rgba(99,102,241,0.15)',
                          color: msg.trade.action === 'BUY' ? UP_COLOR : msg.trade.action === 'SELL' ? DOWN_COLOR : BLUE,
                        }}>{msg.trade.action}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{msg.trade.symbol}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>
                          {msg.trade.quantity} shares @ ${msg.trade.price.toFixed(2)}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginLeft: 'auto', fontFamily: 'DM Mono, monospace' }}>
                          ≈${(msg.trade.quantity * msg.trade.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </>
                  )}
                  {msg.monitor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, letterSpacing: '0.07em', background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        ALERT
                      </span>
                      <Bell size={12} color="#f59e0b" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{msg.monitor.symbol}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>
                        {msg.monitor.condition} ${msg.monitor.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10, lineHeight: 1.5 }}>
                    {msg.trade?.reason || msg.monitor?.reason}
                  </p>
                  {msg.actionStatus === 'pending' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => executeAction(i, true)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          background: msg.trade ? (msg.trade.action === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)') : 'rgba(245,158,11,0.12)',
                          border: `1px solid ${msg.trade ? (msg.trade.action === 'BUY' ? 'rgba(16,185,129,0.30)' : 'rgba(244,63,94,0.30)') : 'rgba(245,158,11,0.25)'}`,
                          color: msg.trade ? (msg.trade.action === 'BUY' ? UP_COLOR : DOWN_COLOR) : '#f59e0b',
                        }}>
                        ✓ {msg.trade ? `Execute ${msg.trade.action}` : 'Set Alert'}
                      </button>
                      <button onClick={() => executeAction(i, false)}
                        style={{ padding: '8px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 8, color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: msg.actionStatus === 'executed' ? UP_COLOR : '#475569' }}>
                      {msg.actionStatus === 'executed' ? <CheckCircle size={12} /> : <X size={12} />}
                      {msg.actionStatus === 'executed' ? (msg.trade ? 'Trade executed (paper)' : 'Alert set') : 'Dismissed'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: 'rgba(11,13,28,0.9)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '14px 14px 14px 4px', alignSelf: 'flex-start' }}>
              <RefreshCw size={12} color={BLUE} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>Claude is thinking…</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(99,102,241,0.10)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={claudeKey ? 'Ask Claude to analyze, monitor, or trade…' : 'Add Claude API key in Settings to enable AI trading'}
              disabled={!claudeKey || loading}
              rows={2}
              style={{
                flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 10,
                padding: '9px 13px', fontSize: 13, color: '#f1f5f9', fontFamily: 'Inter, sans-serif',
                outline: 'none', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box',
                opacity: (claudeKey && !loading) ? 1 : 0.55, transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.40)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.14)')}
            />
            <button onClick={() => send()}
              disabled={!claudeKey || !input.trim() || loading}
              style={{
                padding: '9px 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
                borderRadius: 10, color: '#fff', cursor: 'pointer', flexShrink: 0,
                opacity: (claudeKey && input.trim() && !loading) ? 1 : 0.45,
                transition: 'opacity 0.15s', boxShadow: '0 0 14px rgba(99,102,241,0.28)',
              }}>
              <Send size={14} />
            </button>
          </div>
          <p style={{ fontSize: 10, color: '#2d3a52', marginTop: 5, fontFamily: 'DM Mono, monospace' }}>
            Enter to send · Shift+Enter for newline · Simulated paper trading only
          </p>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        {/* Quick prompts */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Quick Prompts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {QUICK_PROMPTS.map(q => (
              <button key={q} onClick={() => send(q)}
                style={{
                  padding: '8px 12px', background: '#06081a', border: '1px solid rgba(99,102,241,0.10)',
                  borderRadius: 8, color: '#64748b', fontSize: 11, cursor: 'pointer',
                  textAlign: 'left', lineHeight: 1.4, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)'; e.currentTarget.style.color = '#94a3b8'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.10)'; e.currentTarget.style.color = '#64748b'; }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio context Claude sees */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Claude&apos;s Context
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Cash Available', val: `$${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
              { label: 'Positions', val: String(portfolio.length) },
              { label: 'Watchlist Items', val: String(watchlist.length) },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
                <span style={{ color: '#475569' }}>{label}</span>
                <span style={{ color: '#f1f5f9', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
          {portfolio.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {portfolio.map(p => {
                const cur = p.currentPrice || p.avgPrice;
                const pnl = (cur - p.avgPrice) * p.quantity;
                const up = pnl >= 0;
                return (
                  <div key={p.symbol} onClick={() => onSelect(p.symbol)}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#06081a', borderRadius: 7, cursor: 'pointer', border: '1px solid transparent', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', fontFamily: 'DM Mono, monospace' }}>{p.symbol}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>
                        {up ? '+' : ''}${Math.abs(pnl).toFixed(0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <AlertTriangle size={11} color="#f59e0b" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>DISCLAIMER</span>
          </div>
          <p style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            All trades are simulated paper trading only. Claude AI analysis is not financial advice. Do not make real investment decisions based on this tool.
          </p>
        </div>
      </div>
    </div>
  );
}

// -- App shell ----------------------------------------------------------------â”€
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
                  ● US OPEN
                </span>
              )}
              {market === 'us' && !isUSMarketOpen() && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'rgba(100,116,139,0.08)', color: '#64748b', border: '1px solid rgba(100,116,139,0.15)', letterSpacing: '0.06em' }}>
                  ○ US CLOSED
                </span>
              )}
              {market === 'india' && isIndiaMarketOpen() && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'rgba(16,185,129,0.10)', color: '#10b981', border: '1px solid rgba(16,185,129,0.20)', letterSpacing: '0.06em' }}>
                  ● IN OPEN
                </span>
              )}
              {market === 'india' && !isIndiaMarketOpen() && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'rgba(100,116,139,0.08)', color: '#64748b', border: '1px solid rgba(100,116,139,0.15)', letterSpacing: '0.06em' }}>
                  ○ IN CLOSED
                </span>
              )}
              {market === 'crypto' && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'rgba(16,185,129,0.10)', color: '#10b981', border: '1px solid rgba(16,185,129,0.20)', letterSpacing: '0.06em' }}>
                  ● 24/7
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
      </div>
    </div>
  );
}

