"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useUser, UserButton, SignIn } from "@clerk/nextjs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  TrendingUp, Search, Menu, X, Wallet,
  LayoutDashboard, Star, Filter, Settings,
  Bell, Plus, Trash2, CreditCard, RefreshCw,
  ChevronUp, ChevronDown, Globe, Brain,
  CheckCircle, AlertTriangle, Zap, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../lib/store";
import {
  getQuote, getCandles, getProfile, getMetrics, getEarnings,
  getRecommendations, getNews, getCryptoQuote, searchSymbol,
  getClaudeAnalysis, mockCandles,
  US_STOCKS, INDIA_STOCKS, CRYPTO_LIST,
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

const UP_COLOR = '#22c55e';
const DOWN_COLOR = '#ef4444';
const BLUE = '#3b82f6';

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
      padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
      background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      color: up ? UP_COLOR : DOWN_COLOR,
      fontFamily: 'DM Mono, monospace',
    }}>
      {up ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      {up ? '+' : ''}{v.toFixed(2)}%
    </span>
  );
}

// -- Ticker tape --------------------------------------------------------------â”€
function Ticker({ quotes }: { quotes: Record<string, Quote> }) {
  const items = Object.entries(quotes);
  if (!items.length) return null;
  const tape = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', borderBottom: '1px solid #1a2035', background: '#0a0a0f', padding: '6px 0', flexShrink: 0 }}>
      <div className="ticker" style={{ display: 'flex', gap: 40, width: 'max-content', paddingLeft: 16 }}>
        {tape.map(([sym, q], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>
              {sym.replace('NSE:', '')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#e8eaf0', fontFamily: 'DM Mono, monospace' }}>
              ${fmtPrice(q?.c)}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: safeN(q?.dp) >= 0 ? UP_COLOR : DOWN_COLOR }}>
              {safeN(q?.dp) >= 0 ? '+' : ''}{fmtPrice(q?.dp)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Chart --------------------------------------------------------------------
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
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'DM Mono, monospace' }}>
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
                padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: range === r ? BLUE : 'transparent',
                color: range === r ? '#fff' : '#64748b',
                border: range === r ? 'none' : '1px solid #1a2035',
                cursor: 'pointer', transition: 'all 0.15s',
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
            <CartesianGrid stroke="#1a2035" strokeDasharray="4 8" />
            <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace' }} />
            <YAxis stroke="transparent" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace' }} domain={['auto', 'auto']} width={60} />
            <Tooltip
              contentStyle={{ background: '#0f1221', border: '1px solid #1a2035', borderRadius: 8, fontSize: 12, fontFamily: 'DM Mono, monospace' }}
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
            <Bar dataKey="vol" fill="#1e2535" radius={[2, 2, 0, 0]} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #1a2035' }}>
          {profile.logo && (
            <img src={profile.logo} alt={profile.name}
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 3 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</div>
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
          <div key={label} style={{ background: '#080b14', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', fontFamily: 'DM Mono, monospace' }}>{value}</div>
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
                <Tooltip contentStyle={{ background: '#0f1221', border: '1px solid #1a2035', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="actual" fill={BLUE} radius={[3, 3, 0, 0]} name="Actual" />
                <Bar dataKey="estimate" fill="#1e2535" radius={[3, 3, 0, 0]} name="Estimate" />
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
          <Brain size={15} color="#7c3aed" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>Claude AI Analysis</span>
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
            style={{ width: '100%', background: '#080b14', border: '1px solid #1a2035', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => { setClaudeKey(keyInput); setEditing(false); }}
              style={{ flex: 1, padding: '7px 0', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Save
            </button>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: '7px 0', background: '#1a2035', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'block' }}>
              Get key â†—
            </a>
          </div>
        </div>
      )}

      {!claudeKey && !editing ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 13 }}>
          <Brain size={28} color="#1e2535" style={{ margin: '0 auto 8px' }} />
          <p>Add your Claude API key to get AI stock analysis</p>
        </div>
      ) : claudeKey && !editing && (
        <button onClick={run} disabled={loading || !quote}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: loading ? '#1a2035' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, opacity: loading || !quote ? 0.7 : 1,
          }}>
          {loading ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Zap size={13} /> Analyze {symbol}</>}
        </button>
      )}

      {analysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginTop: 12, padding: '12px 14px', background: '#080b14', borderRadius: 8, border: '1px solid #1a2035' }}>
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
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>
          {symbol ? symbol.replace('NSE:', '') + ' News' : 'Market News'}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'positive', 'negative'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: 'none', textTransform: 'capitalize',
                background: filter === f ? (f === 'positive' ? 'rgba(34,197,94,0.15)' : f === 'negative' ? 'rgba(239,68,68,0.15)' : '#1a2035') : 'transparent',
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
              onMouseEnter={e => (e.currentTarget.style.background = '#0f1221')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {item.sentiment === 'positive' ? <ArrowUpRight size={13} color={UP_COLOR} /> :
                  item.sentiment === 'negative' ? <ArrowDownRight size={13} color={DOWN_COLOR} /> :
                    <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#1e2535' }} />}
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
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>Watchlist</span>
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
          style={{ flex: 1, background: '#080b14', border: '1px solid #1a2035', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        <button onClick={() => { if (input.trim()) { addWatch({ symbol: input.trim(), name: input.trim() }); setInput(''); } }}
          style={{ padding: '7px 12px', background: BLUE, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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
              onMouseEnter={e => { if (selected !== symbol) e.currentTarget.style.background = '#0f1221'; }}
              onMouseLeave={e => { if (selected !== symbol) e.currentTarget.style.background = 'transparent'; }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selected === symbol ? BLUE : '#e8eaf0', fontFamily: 'DM Mono, monospace' }}>
                  {symbol.replace('NSE:', '')}
                </div>
                <div style={{ fontSize: 10, color: '#475569' }}>{name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spark data={h} up={up} />
                <div style={{ textAlign: 'right', minWidth: 64 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', fontFamily: 'DM Mono, monospace' }}>
                    ${fmtPrice(q?.c)}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: up ? UP_COLOR : DOWN_COLOR }}>
                    {up ? '+' : ''}{fmtPrice(q?.dp)}%
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); removeWatch(symbol); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e2535', padding: 2 }}
                  onMouseEnter={e => (e.currentTarget.style.color = DOWN_COLOR)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#1e2535')}>
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
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>Price Alerts</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <input value={sym} onChange={e => setSym(e.target.value.toUpperCase())} placeholder="Symbol"
          style={{ background: '#080b14', border: '1px solid #1a2035', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={cond} onChange={e => setCond(e.target.value as 'above' | 'below')}
            style={{ flex: 1, background: '#080b14', border: '1px solid #1a2035', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#e8eaf0', outline: 'none' }}>
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number"
            style={{ flex: 1, background: '#080b14', border: '1px solid #1a2035', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        </div>
        <button onClick={() => { if (sym && price) { addAlert({ symbol: sym, condition: cond, price: parseFloat(price), active: true }); setSym(''); setPrice(''); } }}
          style={{ padding: '8px 0', background: '#1a2035', border: '1px solid #252d45', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          + Set Alert
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
        {alerts.length === 0 && <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '12px 0' }}>No alerts set</p>}
        {alerts.map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#080b14', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => toggleAlert(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {a.triggered ? <AlertTriangle size={14} color="#f59e0b" /> : a.active ? <CheckCircle size={14} color={UP_COLOR} /> : <CheckCircle size={14} color="#1e2535" />}
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e8eaf0', fontFamily: 'DM Mono, monospace' }}>{a.symbol}</span>
              <span style={{ fontSize: 11, color: '#475569', fontFamily: 'DM Mono, monospace' }}>{a.condition} ${a.price}</span>
            </div>
            <button onClick={() => removeAlert(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e2535' }}
              onMouseEnter={e => (e.currentTarget.style.color = DOWN_COLOR)}
              onMouseLeave={e => (e.currentTarget.style.color = '#1e2535')}>
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
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>Markets</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['us', 'india', 'crypto'] as const).map(m => (
            <button key={m} onClick={() => setMarket(m)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: market === m ? BLUE : 'transparent',
                color: market === m ? '#fff' : '#64748b',
                border: market === m ? 'none' : '1px solid #1a2035',
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
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: '#080b14',
                  border: '1px solid transparent', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#252d45')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', marginBottom: 2 }}>
                    {symbol.replace('NSE:', '')}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Spark data={hist} up={up} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0', fontFamily: 'DM Mono, monospace' }}>${fmtPrice(q?.c)}</div>
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

// -- Portfolio ----------------------------------------------------------------â”€
function PortfolioPage({ onSelect }: { onSelect: (s: string) => void }) {
  const { portfolio, balance, removePosition } = useStore();
  const totalVal = portfolio.reduce((s, p) => s + safeN(p.currentPrice || p.avgPrice) * safeN(p.quantity), 0);
  const totalCost = portfolio.reduce((s, p) => s + safeN(p.avgPrice) * safeN(p.quantity), 0);
  const pnl = totalVal - totalCost;
  const pnlPct = totalCost ? (pnl / totalCost * 100) : 0;
  const alloc = portfolio.map(p => ({ name: p.symbol, value: safeN(p.currentPrice || p.avgPrice) * safeN(p.quantity) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Value', value: '$' + (totalVal + balance).toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: 'Portfolio + Cash' },
          { label: 'Invested', value: '$' + totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: portfolio.length + ' positions' },
          { label: 'P&L', value: (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(0), color: pnl >= 0 ? UP_COLOR : DOWN_COLOR, sub: fmtPrice(pnlPct) + '%' },
          { label: 'Cash', value: '$' + balance.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: 'Available' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: color || '#e8eaf0', fontFamily: 'DM Mono, monospace' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', marginBottom: 14 }}>Positions</div>
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
                <div key={p.symbol} onClick={() => onSelect(p.symbol)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 24px',
                    gap: 8, padding: '10px', borderRadius: 8, cursor: 'pointer', background: '#080b14',
                    alignItems: 'center', border: '1px solid transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a2035')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', fontFamily: 'DM Mono, monospace' }}>{p.symbol}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{p.name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>{qty}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>${cost.toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>${val.toFixed(2)}</div>
                  <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: pl >= 0 ? UP_COLOR : DOWN_COLOR, fontWeight: 600 }}>
                    {pl >= 0 ? '+' : ''}{pl.toFixed(2)}<br />
                    <span style={{ fontSize: 10 }}>({fmtPrice(plPct)}%)</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removePosition(p.symbol); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e2535', padding: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.color = DOWN_COLOR)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#1e2535')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// -- Screener ------------------------------------------------------------------
function ScreenerPage({ onSelect }: { onSelect: (s: string) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => { searchSymbol(q).then(r => { setResults(r); setLoading(false); }); }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const presets = [
    { label: 'Magnificent 7', syms: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'] },
    { label: 'Indian Blue Chips', syms: ['NSE:RELIANCE', 'NSE:TCS', 'NSE:HDFCBANK', 'NSE:INFY'] },
    { label: 'Crypto Top 5', syms: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'] },
    { label: 'Finance Leaders', syms: ['JPM', 'BAC', 'GS', 'MS', 'WFC'] },
    { label: 'AI Plays', syms: ['NVDA', 'MSFT', 'GOOGL', 'AMD', 'PLTR', 'C3.AI'] },
    { label: 'EV & Clean Energy', syms: ['TSLA', 'RIVN', 'NIO', 'ENPH', 'FSLR'] },
    { label: 'Indian IT', syms: ['NSE:TCS', 'NSE:INFY', 'NSE:WIPRO', 'NSE:HCLTECH'] },
    { label: 'Dividend Kings', syms: ['JNJ', 'PG', 'KO', 'MMM', 'CL'] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', marginBottom: 14 }}>Symbol Search</div>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={q} onChange={e => setQ(e.target.value.toUpperCase())}
            placeholder="Search stocks, ETFs, indices..."
            style={{ width: '100%', background: '#080b14', border: '1px solid #1a2035', borderRadius: 8, padding: '10px 12px 10px 38px', fontSize: 13, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {loading && <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '8px 0' }}>Searching...</p>}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {results.map(r => (
              <div key={r.symbol} onClick={() => onSelect(r.symbol)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: '#080b14', border: '1px solid #1a2035' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = BLUE + '40')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a2035')}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: BLUE, fontFamily: 'DM Mono, monospace' }}>{r.symbol}</span>
                  <span style={{ fontSize: 12, color: '#64748b', marginLeft: 10 }}>{r.description}</span>
                </div>
                <span style={{ fontSize: 10, color: '#475569', background: '#1a2035', padding: '3px 8px', borderRadius: 4 }}>{r.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', marginBottom: 14 }}>Preset Screens</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {presets.map(p => (
            <div key={p.label} style={{ background: '#080b14', border: '1px solid #1a2035', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0', marginBottom: 8 }}>{p.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.syms.map(s => (
                  <button key={s} onClick={() => onSelect(s)}
                    style={{ padding: '4px 10px', background: '#111420', border: '1px solid #1a2035', borderRadius: 20, fontSize: 11, color: '#64748b', cursor: 'pointer', fontFamily: 'DM Mono, monospace', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2035'; e.currentTarget.style.color = '#64748b'; }}>
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
  const { claudeKey, setClaudeKey } = useStore();
  const [k, setK] = useState(claudeKey);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

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
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Brain size={16} color="#7c3aed" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0' }}>Claude AI Integration</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
          Connect your Anthropic API key to get real-time AI analysis for any stock directly in the dashboard. Your key is stored only in your browser.
        </p>
        <input type="password" value={k} onChange={e => setK(e.target.value)}
          placeholder="sk-ant-api03-..."
          style={{ width: '100%', background: '#080b14', border: '1px solid #1a2035', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setClaudeKey(k); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            style={{ flex: 1, padding: '9px 0', background: saved ? 'rgba(34,197,94,0.2)' : '#7c3aed', border: 'none', borderRadius: 8, color: saved ? UP_COLOR : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saved ? 'âœ“ Saved' : 'Save API Key'}
          </button>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 0', background: '#1a2035', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Get API Key â†—
          </a>
        </div>
        {claudeKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: UP_COLOR }}>
            <CheckCircle size={13} /> Claude AI connected
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>StockPro Premium</div>
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
          {upgrading ? 'Redirecting...' : 'Upgrade â€” $19/month'}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0', marginBottom: 16 }}>Data Sources</div>
        {[
          { name: 'Finnhub', desc: 'Real-time quotes, fundamentals, news', status: 'Active', link: 'https://finnhub.io' },
          { name: 'Anthropic Claude', desc: 'AI-powered stock analysis', status: claudeKey ? 'Connected' : 'Not connected', link: 'https://console.anthropic.com' },
        ].map(({ name, desc, status, link }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a2035' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>{name}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: status === 'Active' || status === 'Connected' ? UP_COLOR : '#475569' }}>{status}</span>
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: BLUE }}>Manage â†—</a>
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', margin: 0 }}>
            {symbol.replace('NSE:', '')}
          </h1>
        </div>
        {quote && <Badge dp={quote.dp} />}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: UP_COLOR, background: 'rgba(34,197,94,0.08)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.15)' }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: UP_COLOR, display: 'inline-block' }} />
          Live
        </span>
        <button onClick={load} disabled={loading}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: '1px solid #1a2035', borderRadius: 8, color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
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

// -- App shell ----------------------------------------------------------------â”€
type Tab = 'dashboard' | 'markets' | 'portfolio' | 'watchlist' | 'screener' | 'settings';

export default function App() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { tab, setTab, symbol, setSymbol } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [tickerQ, setTickerQ] = useState<Record<string, Quote>>({});
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    const syms = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL', 'BTC', 'ETH'];
    const loadTicker = () => {
      syms.forEach(s => {
        const fn = ['BTC', 'ETH'].includes(s) ? getCryptoQuote : getQuote;
        fn(s).then(q => setTickerQ(p => ({ ...p, [s]: q })));
      });
    };
    loadTicker();
    const t = setInterval(loadTicker, 25000);
    return () => clearInterval(t);
  }, [isSignedIn]);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchRes([]); return; }
    const t = setTimeout(() => searchSymbol(searchQ).then(setSearchRes), 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (s: string) => { setSymbol(s); setTab('dashboard'); setSearchQ(''); setSearchRes([]); setShowSearch(false); };

  const nav: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'markets', label: 'Markets', icon: <Globe size={16} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Wallet size={16} /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Star size={16} /> },
    { id: 'screener', label: 'Screener', icon: <Filter size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  if (!isLoaded) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
      <div style={{ textAlign: 'center' }}>
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ width: 52, height: 52, background: BLUE, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <TrendingUp size={24} color="#fff" />
        </motion.div>
        <p style={{ color: '#475569', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>Loading...</p>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', padding: 16 }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, background: BLUE, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#e8eaf0', margin: 0 }}>StockPro</h1>
        </div>
        <p style={{ color: '#475569', fontSize: 13 }}>Track US, India & Crypto markets with AI analysis</p>
      </div>
      <div style={{ background: '#0f1221', border: '1px solid #1a2035', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380 }}>
        <SignIn routing="hash" appearance={{
          elements: {
            formButtonPrimary: 'btn-primary',
            card: 'bg-transparent shadow-none',
            headerTitle: 'text-white',
            headerSubtitle: 'text-slate-500',
            formFieldInput: 'bg-[#080b14] border-[#1a2035] text-white',
            footerActionLink: 'text-blue-500',
          },
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0f' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 200 : 60 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ background: '#0a0a0f', borderRight: '1px solid #1a2035', display: 'flex', flexDirection: 'column', paddingTop: 16, paddingBottom: 16, flexShrink: 0, overflow: 'hidden', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, paddingRight: 10, marginBottom: 24 }}>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, background: BLUE, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={14} color="#fff" />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#e8eaf0', whiteSpace: 'nowrap' }}>StockPro</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 6, display: 'flex' }}>
            {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
          {nav.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8,
                background: tab === id ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: tab === id ? BLUE : '#64748b',
                border: tab === id ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: tab === id ? 600 : 400, textAlign: 'left',
                transition: 'all 0.15s', width: '100%',
              }}
              onMouseEnter={e => { if (tab !== id) { e.currentTarget.style.background = '#0f1221'; e.currentTarget.style.color = '#94a3b8'; } }}
              onMouseLeave={e => { if (tab !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}>
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

        <div style={{ padding: '12px 12px 0', borderTop: '1px solid #1a2035', display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserButton afterSignOutUrl="/" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0', whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.firstName || 'Trader'}
                </div>
                <div style={{ fontSize: 10, color: '#475569' }}>Free plan</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Ticker quotes={tickerQ} />

        {/* Header */}
        <div style={{ borderBottom: '1px solid #1a2035', background: '#0a0a0f', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0', textTransform: 'capitalize' }}>
            {tab === 'dashboard' ? symbol.replace('NSE:', '') : tab}
          </div>
          <div ref={searchRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f1221', border: '1px solid #1a2035', borderRadius: 8, padding: '7px 12px', width: 220 }}>
              <Search size={13} color="#475569" />
              <input value={searchQ}
                onChange={e => { setSearchQ(e.target.value.toUpperCase()); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                placeholder="Search symbol..."
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#e8eaf0', fontFamily: 'DM Mono, monospace', width: '100%' }} />
            </div>
            <AnimatePresence>
              {showSearch && searchRes.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#0f1221', border: '1px solid #1a2035', borderRadius: 10, zIndex: 100, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', width: 280 }}>
                  {searchRes.map(r => (
                    <button key={r.symbol} onClick={() => select(r.symbol)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #1a2035', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#080b14')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, fontFamily: 'DM Mono, monospace' }}>{r.symbol}</span>
                        <span style={{ fontSize: 11, color: '#475569', marginLeft: 8, display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#475569', background: '#1a2035', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{r.type}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab + symbol}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}>
              {tab === 'dashboard' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, maxWidth: 1600 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                    <SymbolView symbol={symbol} />
                    <NewsPanel symbol={symbol} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <WatchlistPanel onSelect={select} selected={symbol} />
                    <AlertsPanel />
                  </div>
                </div>
              )}
              {tab === 'markets' && <MarketsGrid onSelect={select} />}
              {tab === 'portfolio' && <PortfolioPage onSelect={select} />}
              {tab === 'watchlist' && <WatchlistPanel onSelect={select} selected={symbol} />}
              {tab === 'screener' && <ScreenerPage onSelect={select} />}
              {tab === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

