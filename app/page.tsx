"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser, UserButton, SignIn } from "@clerk/nextjs";
import {
  ComposedChart, AreaChart, Area, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart,
} from "recharts";
import {
  TrendingUp, TrendingDown, Search, Menu, X, Wallet, LayoutDashboard,
  Star, Newspaper, BarChart2, Bell, Settings, Sun, Moon, Plus, Trash2,
  CreditCard, ChevronUp, ChevronDown, Bitcoin, Globe, Filter,
  AlertTriangle, CheckCircle, Zap, Brain, RefreshCw, ArrowUpRight,
  ArrowDownRight, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../lib/store";
import {
  getQuote, getCandles, getFundamentals, getMetrics, getNews,
  getCryptoQuote, searchSymbol, generateMockCandles, getClaudeAnalysis, getEarnings,
  INDIAN_STOCKS, US_STOCKS, CRYPTO_LIST,
  type Quote, type Candle, type NewsItem, type Fundamentals,
  type Metrics, type SearchResult, type EarningsItem,
} from "../lib/api";

// ---- Helpers ----
const n = (v: number | null | undefined, d = 2) => {
  if (v == null || isNaN(v as number)) return 0;
  return v as number;
};
const fmt = (v: number | null | undefined, prefix = '', suffix = '') => {
  const num = n(v);
  if (Math.abs(num) >= 1e9) return prefix + (num / 1e9).toFixed(2) + 'B' + suffix;
  if (Math.abs(num) >= 1e6) return prefix + (num / 1e6).toFixed(2) + 'M' + suffix;
  if (Math.abs(num) >= 1e3) return prefix + num.toLocaleString(undefined, { maximumFractionDigits: 2 }) + suffix;
  return prefix + num.toFixed(2) + suffix;
};
const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
const timeAgo = (ts: number) => {
  const d = Math.floor((Date.now() - (ts < 1e12 ? ts * 1000 : ts)) / 60000);
  if (d < 60) return d + 'm ago';
  if (d < 1440) return Math.floor(d / 60) + 'h ago';
  return Math.floor(d / 1440) + 'd ago';
};

// ---- Bubble Background ----
function BubbleBg() {
  const bubbles = Array.from({ length: 8 }, (_, i) => ({
    id: i, size: 60 + Math.random() * 120,
    x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
    delay: i * 0.5, dur: 4 + Math.random() * 3,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bubbles.map(b => (
        <motion.div key={b.id}
          animate={{ y: [0, -30, 0], scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: b.dur, repeat: Infinity, delay: b.delay, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: b.x + '%', top: b.y + '%', width: b.size, height: b.size }}
          className="rounded-full border border-cyan-500/10"
          children={
            <div className="w-full h-full rounded-full"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(0,212,255,0.04), transparent 70%)' }} />
          }
        />
      ))}
      <div className="absolute inset-0 grid-bg opacity-100" />
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
    </div>
  );
}

// ---- Ticker Tape ----
function TickerTape({ quotes }: { quotes: Record<string, Quote> }) {
  const items = Object.entries(quotes).slice(0, 12);
  if (items.length === 0) return null;
  const tape = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-[#0f2040] bg-[#040810]/80 backdrop-blur-xl py-1.5 shrink-0">
      <div className="ticker-tape flex gap-8 w-max px-4">
        {tape.map(([sym, q], i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-cyan-400 mono">{sym.replace('NSE:', '')}</span>
            <span className="text-xs font-semibold mono text-white">${n(q?.c).toFixed(2)}</span>
            <span className={"text-xs mono font-medium " + (n(q?.dp) >= 0 ? "text-emerald-400" : "text-red-400")}>
              {n(q?.dp) >= 0 ? '+' : ''}{n(q?.dp).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Sparkline ----
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return <div className="w-20 h-5" />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * 80},${18 - ((v - min) / range) * 16}`
  ).join(' ');
  return (
    <svg width={80} height={20} viewBox="0 0 80 20" className="overflow-visible">
      <polyline points={pts} fill="none" stroke={up ? '#00e676' : '#ff1744'}
        strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---- Price Chip ----
function PriceChip({ dp }: { dp: number | null | undefined }) {
  const val = n(dp);
  const up = val >= 0;
  return (
    <span className={"inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-bold mono " +
      (up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
      {up ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      {up ? '+' : ''}{val.toFixed(2)}%
    </span>
  );
}

// ---- Chart ----
function StockChart({ candles, symbol, quote }: { candles: Candle[]; symbol: string; quote: Quote | null }) {
  const [range, setRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('3M');
  const [type, setType] = useState<'area' | 'bars'>('area');

  const days = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[range];
  const data = candles.slice(-days).map(c => ({
    date: fmtDate(c.t), price: c.c, open: c.o, high: c.h, low: c.l,
    vol: Math.round(c.v / 1000),
  }));

  const first = data[0]?.price ?? 0;
  const last = data[data.length - 1]?.price ?? 0;
  const up = last >= first;
  const color = up ? '#00e676' : '#ff1744';
  const gradId = 'g' + symbol.replace(/[^a-z]/gi, '');

  return (
    <div className="glow-border rounded-2xl bg-[#080f1e] p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {quote && (
            <>
              <span className="text-3xl font-black mono text-white">${n(quote.c).toFixed(2)}</span>
              <PriceChip dp={quote.dp} />
              <span className={"text-sm mono " + (n(quote.d) >= 0 ? "text-emerald-400" : "text-red-400")}>
                {n(quote.d) >= 0 ? '+' : ''}{n(quote.d).toFixed(2)} today
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#040810] rounded-xl p-1 border border-[#0f2040]">
            {(['1W', '1M', '3M', '6M', '1Y'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={"px-2.5 py-1 rounded-lg text-xs font-bold transition-all " +
                  (range === r ? "bg-cyan-500/20 text-cyan-400" : "text-[#4a6080] hover:text-white")}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex bg-[#040810] rounded-xl p-1 border border-[#0f2040]">
            {(['area', 'bars'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={"px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all " +
                  (type === t ? "bg-cyan-500/20 text-cyan-400" : "text-[#4a6080] hover:text-white")}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {quote && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Open', value: '$' + n(quote.o).toFixed(2) },
            { label: 'High', value: '$' + n(quote.h).toFixed(2) },
            { label: 'Low', value: '$' + n(quote.l).toFixed(2) },
            { label: 'Prev Close', value: '$' + n(quote.pc).toFixed(2) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#040810] rounded-xl p-3 border border-[#0f2040]">
              <p className="text-[10px] text-[#4a6080] uppercase tracking-widest">{label}</p>
              <p className="text-sm font-bold mono text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="h-60 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bars' ? (
            <ComposedChart data={data}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#0f2040" strokeDasharray="3 6" />
              <XAxis dataKey="date" stroke="#0f2040" tick={{ fill: '#4a6080', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="#0f2040" tick={{ fill: '#4a6080', fontSize: 10, fontFamily: 'JetBrains Mono' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#080f1e', border: '1px solid #1a3060', borderRadius: '12px', fontSize: '11px', fontFamily: 'JetBrains Mono' }} labelStyle={{ color: '#4a6080' }} />
              <Bar dataKey="vol" yAxisId={0} fill="#0f2040" barSize={4} radius={[2, 2, 0, 0]} />
              <Area yAxisId={0} type="monotone" dataKey="price" stroke={color} fill={'url(#' + gradId + ')'} strokeWidth={2} dot={false} />
            </ComposedChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#0f2040" strokeDasharray="3 6" />
              <XAxis dataKey="date" stroke="#0f2040" tick={{ fill: '#4a6080', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="#0f2040" tick={{ fill: '#4a6080', fontSize: 10, fontFamily: 'JetBrains Mono' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#080f1e', border: '1px solid #1a3060', borderRadius: '12px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                labelStyle={{ color: '#4a6080' }}
                formatter={(v: unknown) => ['$' + n(v as number).toFixed(2), 'Price']}
              />
              <Area type="monotone" dataKey="price" stroke={color} fill={'url(#' + gradId + ')'} strokeWidth={2} dot={false} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- Fundamentals ----
function FundamentalsPanel({ symbol }: { symbol: string }) {
  const [fund, setFund] = useState<Fundamentals | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);

  useEffect(() => {
    getFundamentals(symbol).then(setFund);
    getMetrics(symbol).then(setMetrics);
    getEarnings(symbol).then(setEarnings);
  }, [symbol]);

  const rows = [
    { label: 'P/E', value: fmt(metrics?.peNormalizedAnnual) },
    { label: 'EPS', value: fmt(metrics?.epsNormalizedAnnual, '$') },
    { label: 'P/B', value: fmt(metrics?.pbAnnual) },
    { label: 'Beta', value: fmt(metrics?.beta) },
    { label: '52W H', value: fmt(metrics?.weekHigh52, '$') },
    { label: '52W L', value: fmt(metrics?.weekLow52, '$') },
    { label: 'ROE', value: fmt(metrics?.roeRfy, '', '%') },
    { label: 'Div Yield', value: metrics?.dividendYieldIndicatedAnnual ? n(metrics.dividendYieldIndicatedAnnual).toFixed(2) + '%' : 'â€”' },
    { label: 'Mkt Cap', value: fmt(metrics?.marketCapitalization ? metrics.marketCapitalization * 1e6 : 0, '$') },
    { label: 'D/E', value: fmt(metrics?.debtEquityAnnual) },
  ];

  return (
    <div className="glow-border rounded-2xl bg-[#080f1e] p-5 space-y-4">
      {fund && (
        <div className="flex items-center gap-3">
          {fund.logo && (
            <img src={fund.logo} alt={fund.name}
              className="w-9 h-9 rounded-xl object-contain bg-white/5 p-1 border border-[#0f2040]" />
          )}
          <div>
            <p className="text-sm font-bold text-white">{fund.name}</p>
            <p className="text-xs text-[#4a6080]">{fund.exchange} | {fund.industry}</p>
          </div>
          {fund.weburl && (
            <a href={fund.weburl} target="_blank" rel="noopener noreferrer"
              className="ml-auto text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              Visit site
            </a>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="bg-[#040810] rounded-xl px-3 py-2 border border-[#0f2040]">
            <p className="text-[10px] text-[#4a6080] uppercase tracking-widest">{label}</p>
            <p className="text-sm font-bold mono text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>
      {earnings.length > 0 && (
        <div>
          <p className="text-[10px] text-[#4a6080] uppercase tracking-widest mb-2">EPS History</p>
          <div className="h-28 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earnings.slice(0, 6).reverse()}>
                <XAxis dataKey="date" tick={{ fill: '#4a6080', fontSize: 9, fontFamily: 'JetBrains Mono' }} stroke="#0f2040" />
                <Tooltip contentStyle={{ background: '#080f1e', border: '1px solid #1a3060', borderRadius: '10px', fontSize: '10px' }} />
                <Bar dataKey="epsActual" fill="#00d4ff" radius={[3, 3, 0, 0]} name="Actual" />
                <Bar dataKey="epsEstimate" fill="#0f2040" radius={[3, 3, 0, 0]} name="Estimate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Claude AI Panel ----
function ClaudePanel({ symbol, quote, metrics }: { symbol: string; quote: Quote | null; metrics: Metrics | null }) {
  const { claudeApiKey, setClaudeApiKey } = useStore();
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyInput, setKeyInput] = useState(claudeApiKey);
  const [showKey, setShowKey] = useState(false);

  const analyze = async () => {
    if (!claudeApiKey || !quote) return;
    setLoading(true);
    setAnalysis('');
    const result = await getClaudeAnalysis(claudeApiKey, symbol, quote, metrics);
    setAnalysis(result);
    setLoading(false);
  };

  const saveKey = () => { setClaudeApiKey(keyInput); setShowKey(false); };

  return (
    <div className="glow-border rounded-2xl bg-[#080f1e] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#4a6080] uppercase tracking-widest flex items-center gap-2">
          <Brain size={13} className="text-violet-400" /> Claude AI Analysis
        </h3>
        <button onClick={() => setShowKey(!showKey)}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
          {claudeApiKey ? 'Change key' : 'Add API key'}
        </button>
      </div>

      <AnimatePresence>
        {showKey && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="space-y-2">
              <p className="text-[10px] text-[#4a6080]">Enter your Anthropic API key. Stored locally, never sent to our servers.</p>
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-[#040810] border border-[#0f2040] rounded-xl px-3 py-2 text-xs text-white mono outline-none focus:border-cyan-500/50 transition-colors"
              />
              <div className="flex gap-2">
                <button onClick={saveKey}
                  className="flex-1 py-1.5 bg-violet-600/30 border border-violet-500/30 rounded-xl text-xs text-violet-300 font-bold hover:bg-violet-600/50 transition-colors">
                  Save Key
                </button>
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-1.5 bg-[#040810] border border-[#0f2040] rounded-xl text-xs text-[#4a6080] text-center hover:text-white transition-colors">
                  Get API Key
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!claudeApiKey && !showKey && (
        <div className="bg-[#040810] border border-violet-500/20 rounded-xl p-4 text-center">
          <Brain size={24} className="text-violet-400 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-[#4a6080]">Add your Claude API key to get AI-powered stock analysis</p>
        </div>
      )}

      {claudeApiKey && !showKey && (
        <button onClick={analyze} disabled={loading || !quote}
          className="w-full py-2.5 bg-gradient-to-r from-violet-600/30 to-cyan-600/30 border border-violet-500/30 rounded-xl text-sm font-bold text-white hover:border-violet-400/50 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? (
            <><RefreshCw size={14} className="animate-spin" /> Analyzing {symbol}...</>
          ) : (
            <><Zap size={14} className="text-yellow-400" /> Analyze {symbol} with Claude</>
          )}
        </button>
      )}

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#040810] border border-[#0f2040] rounded-xl p-4">
          <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{analysis}</p>
        </motion.div>
      )}
    </div>
  );
}

// ---- News Feed ----
function NewsFeed({ symbol }: { symbol?: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

  useEffect(() => {
    setLoading(true);
    getNews(symbol).then(d => { setNews(d); setLoading(false); });
  }, [symbol]);

  const filtered = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  const SIcon = ({ s }: { s?: string }) => {
    if (s === 'positive') return <ArrowUpRight size={11} className="text-emerald-400 shrink-0" />;
    if (s === 'negative') return <ArrowDownRight size={11} className="text-red-400 shrink-0" />;
    return <Info size={11} className="text-cyan-400 shrink-0" />;
  };

  return (
    <div className="glow-border rounded-2xl bg-[#080f1e] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#4a6080] uppercase tracking-widest flex items-center gap-2">
          <Newspaper size={12} /> {symbol ? symbol + ' News' : 'Market News'}
        </h3>
        <div className="flex gap-1">
          {(['all', 'positive', 'negative'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={"px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all " +
                (filter === f ? (f === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : f === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400') : 'text-[#4a6080] hover:text-white')}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-10 bg-[#040810] rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {filtered.map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 p-2.5 rounded-xl hover:bg-[#040810] border border-transparent hover:border-[#0f2040] transition-all block">
              <SIcon s={item.sentiment} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 leading-snug line-clamp-2">{item.headline}</p>
                <p className="text-[10px] text-[#4a6080] mt-0.5 mono">{item.source} | {timeAgo(item.datetime)}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Watchlist ----
function WatchlistPanel({ onSelect, selected }: { onSelect: (s: string) => void; selected: string }) {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useStore();
  const [input, setInput] = useState('');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [history, setHistory] = useState<Record<string, number[]>>({});

  const loadQuote = useCallback((symbol: string) => {
    getQuote(symbol).then(q => {
      setQuotes(prev => ({ ...prev, [symbol]: q }));
      setHistory(prev => {
        const h = [...(prev[symbol] || []), q.c].slice(-20);
        return { ...prev, [symbol]: h };
      });
    });
  }, []);

  useEffect(() => {
    watchlist.forEach(({ symbol }) => loadQuote(symbol));
    const t = setInterval(() => watchlist.forEach(({ symbol }) => loadQuote(symbol)), 15000);
    return () => clearInterval(t);
  }, [watchlist, loadQuote]);

  const handleAdd = () => {
    const sym = input.trim().toUpperCase();
    if (sym) { addToWatchlist({ symbol: sym, name: sym }); setInput(''); }
  };

  return (
    <div className="glow-border rounded-2xl bg-[#080f1e] p-5">
      <h3 className="text-xs font-bold text-[#4a6080] uppercase tracking-widest mb-3 flex items-center gap-2">
        <Star size={12} className="text-amber-400" /> Watchlist
      </h3>
      <div className="flex gap-2 mb-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add symbol..." maxLength={15}
          className="flex-1 bg-[#040810] border border-[#0f2040] rounded-xl px-3 py-1.5 text-xs mono text-white placeholder-[#4a6080] outline-none focus:border-cyan-500/50 uppercase transition-colors" />
        <button onClick={handleAdd}
          className="p-2 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-xl transition-colors">
          <Plus size={13} className="text-cyan-400" />
        </button>
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {watchlist.map(({ symbol, name }) => {
          const q = quotes[symbol];
          const up = n(q?.dp) >= 0;
          const hist = history[symbol] || [];
          return (
            <motion.div key={symbol} onClick={() => onSelect(symbol)}
              whileHover={{ x: 2 }}
              className={"flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border " +
                (selected === symbol ? "bg-cyan-500/5 border-cyan-500/20" : "hover:bg-[#040810] border-transparent hover:border-[#0f2040]")}>
              <div>
                <p className={"text-xs font-bold mono " + (selected === symbol ? "text-cyan-400" : "text-white")}>
                  {symbol.replace('NSE:', '')}
                </p>
                <p className="text-[10px] text-[#4a6080]">{name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Sparkline data={hist.length > 1 ? hist : [n(q?.pc), n(q?.c)]} up={up} />
                <div className="text-right min-w-[64px]">
                  <p className="text-xs font-bold mono text-white">${n(q?.c).toFixed(2)}</p>
                  <p className={"text-[10px] mono font-semibold " + (up ? "text-emerald-400" : "text-red-400")}>
                    {up ? '+' : ''}{n(q?.dp).toFixed(2)}%
                  </p>
                </div>
                <button onClick={e => { e.stopPropagation(); removeFromWatchlist(symbol); }}
                  className="text-[#4a6080] hover:text-red-400 transition-colors ml-1">
                  <Trash2 size={11} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Alerts ----
function AlertsPanel({ currentPrices }: { currentPrices: Record<string, number> }) {
  const { alerts, addAlert, removeAlert, toggleAlert, triggerAlert } = useStore();
  const [sym, setSym] = useState('');
  const [cond, setCond] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');
  const [triggered, setTriggered] = useState<string[]>([]);

  useEffect(() => {
    alerts.forEach(a => {
      if (!a.active || a.triggered) return;
      const current = currentPrices[a.symbol];
      if (!current) return;
      const hit = a.condition === 'above' ? current >= a.price : current <= a.price;
      if (hit && !triggered.includes(a.id)) {
        setTriggered(prev => [...prev, a.id]);
        triggerAlert(a.id);
      }
    });
  }, [currentPrices, alerts, triggered, triggerAlert]);

  const handleAdd = () => {
    if (!sym || !price) return;
    addAlert({ symbol: sym.toUpperCase(), condition: cond, price: parseFloat(price), active: true });
    setSym(''); setPrice('');
  };

  return (
    <div className="glow-border rounded-2xl bg-[#080f1e] p-5">
      <h3 className="text-xs font-bold text-[#4a6080] uppercase tracking-widest mb-3 flex items-center gap-2">
        <Bell size={12} className="text-amber-400" /> Price Alerts
      </h3>
      <div className="space-y-2 mb-3">
        <input value={sym} onChange={e => setSym(e.target.value)} placeholder="Symbol"
          className="w-full bg-[#040810] border border-[#0f2040] rounded-xl px-3 py-1.5 text-xs mono text-white placeholder-[#4a6080] outline-none focus:border-cyan-500/50 uppercase transition-colors" />
        <div className="flex gap-2">
          <select value={cond} onChange={e => setCond(e.target.value as 'above' | 'below')}
            className="flex-1 bg-[#040810] border border-[#0f2040] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50">
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="$0.00" type="number"
            className="flex-1 bg-[#040810] border border-[#0f2040] rounded-xl px-3 py-1.5 text-xs mono text-white placeholder-[#4a6080] outline-none focus:border-cyan-500/50 transition-colors" />
        </div>
        <button onClick={handleAdd}
          className="w-full py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2">
          <Plus size={12} /> Set Alert
        </button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {alerts.length === 0 && <p className="text-[10px] text-[#4a6080] text-center py-3">No alerts set</p>}
        {alerts.map(a => (
          <div key={a.id}
            className={"flex items-center justify-between rounded-xl px-3 py-2 border " +
              (a.triggered ? "bg-amber-500/5 border-amber-500/20" : "bg-[#040810] border-[#0f2040]")}>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleAlert(a.id)}>
                {a.triggered ? <AlertTriangle size={13} className="text-amber-400" /> :
                  a.active ? <CheckCircle size={13} className="text-emerald-400" /> :
                    <CheckCircle size={13} className="text-[#4a6080]" />}
              </button>
              <span className="text-xs font-bold mono text-white">{a.symbol}</span>
              <span className="text-[10px] text-[#4a6080] mono">{a.condition} ${a.price}</span>
            </div>
            <button onClick={() => removeAlert(a.id)} className="text-[#4a6080] hover:text-red-400 transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Portfolio ----
function PortfolioPage({ onSelect }: { onSelect: (s: string) => void }) {
  const { portfolio, balance, removePosition } = useStore();
  const totalValue = portfolio.reduce((s, p) => s + n(p.currentPrice || p.avgPrice) * n(p.quantity), 0);
  const totalCost = portfolio.reduce((s, p) => s + n(p.avgPrice) * n(p.quantity), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost ? (totalPnl / totalCost) * 100 : 0;

  const pnlHistory = Array.from({ length: 30 }, (_, i) => ({
    day: 'D' + (i + 1),
    value: Math.max(0, (totalValue || 100000) * (0.88 + i * 0.004 + (Math.random() - 0.5) * 0.02)),
  }));

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Value', value: '$' + (totalValue + balance).toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: 'Portfolio + Cash' },
          { label: 'Invested', value: '$' + totalCost.toFixed(0), sub: portfolio.length + ' positions' },
          { label: 'Total P&L', value: (totalPnl >= 0 ? '+$' : '-$') + Math.abs(totalPnl).toFixed(0), sub: n(totalPnlPct).toFixed(2) + '%', color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Cash', value: '$' + balance.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: 'Available' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="glow-border rounded-2xl bg-[#080f1e] p-5">
            <p className="text-[10px] text-[#4a6080] uppercase tracking-widest mb-2">{label}</p>
            <p className={"text-2xl font-black mono " + (color || "text-white")}>{value}</p>
            <p className="text-[10px] text-[#4a6080] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="glow-border rounded-2xl bg-[#080f1e] p-5">
        <p className="text-[10px] text-[#4a6080] uppercase tracking-widest mb-4">30-Day Portfolio Performance</p>
        <div className="h-36 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pnlHistory}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#0f2040" tick={{ fill: '#4a6080', fontSize: 9 }} />
              <YAxis stroke="#0f2040" tick={{ fill: '#4a6080', fontSize: 9 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#080f1e', border: '1px solid #1a3060', borderRadius: '10px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="value" stroke="#00d4ff" fill="url(#portGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glow-border rounded-2xl bg-[#080f1e] p-5">
        <p className="text-[10px] text-[#4a6080] uppercase tracking-widest mb-4">Positions</p>
        {portfolio.length === 0 ? (
          <div className="text-center py-10">
            <BarChart2 size={32} className="text-[#0f2040] mx-auto mb-3" />
            <p className="text-sm text-[#4a6080]">No positions yet. Search for a symbol to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {portfolio.map(p => {
              const cur = p.currentPrice || p.avgPrice || 0;
              const cost = p.avgPrice || 0;
              const qty = p.quantity || 0;
              const pnl = (cur - cost) * qty;
              const pct = cost ? ((cur - cost) / cost) * 100 : 0;
              return (
                <div key={p.symbol} onClick={() => onSelect(p.symbol)}
                  className="flex items-center justify-between bg-[#040810] rounded-2xl p-4 cursor-pointer hover:border-cyan-500/20 border border-[#0f2040] transition-all">
                  <div>
                    <p className="text-sm font-bold mono text-white">{p.symbol}</p>
                    <p className="text-xs text-[#4a6080]">{qty} shares @ ${cost.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold mono text-white">${(cur * qty).toFixed(2)}</p>
                    <p className={"text-xs mono font-semibold " + (pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({n(pct).toFixed(2)}%)
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removePosition(p.symbol); }}
                    className="ml-4 text-[#4a6080] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
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

// ---- Markets Grid ----
function MarketsGrid({ onSelect }: { onSelect: (s: string) => void }) {
  const { marketTab, setMarketTab } = useStore();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  const stocks = marketTab === 'india' ? INDIAN_STOCKS : marketTab === 'crypto' ? CRYPTO_LIST.map(c => ({ ...c, sector: 'Crypto' })) : US_STOCKS;

  useEffect(() => {
    setLoading(true);
    setQuotes({});
    const fn = marketTab === 'crypto' ? getCryptoQuote : getQuote;
    Promise.all(stocks.map(({ symbol }) => fn(symbol).then(q => [symbol, q] as const))).then(results => {
      const map: Record<string, Quote> = {};
      results.forEach(([s, q]) => { map[s] = q; });
      setQuotes(map);
      setLoading(false);
    });
  }, [marketTab]);

  const tabs = [
    { id: 'us', label: 'US', flag: 'US' },
    { id: 'india', label: 'India', flag: 'IN' },
    { id: 'crypto', label: 'Crypto', flag: 'BTC' },
  ] as const;

  return (
    <div className="glow-border rounded-2xl bg-[#080f1e] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-[#4a6080] uppercase tracking-widest flex items-center gap-2">
          <Globe size={12} /> Markets
        </h3>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setMarketTab(t.id)}
              className={"px-3 py-1.5 rounded-xl text-xs font-bold transition-all " +
                (marketTab === t.id ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "text-[#4a6080] hover:text-white border border-transparent")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        {loading ? (
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="animate-pulse h-12 bg-[#040810] rounded-xl" />
          ))
        ) : (
          stocks.map(({ symbol, name }) => {
            const q = quotes[symbol];
            const up = n(q?.dp) >= 0;
            const hist = [n(q?.pc) * 0.99, n(q?.pc), n(q?.o), n(q?.l), n(q?.c)];
            return (
              <motion.div key={symbol} onClick={() => onSelect(symbol)}
                whileHover={{ x: 3 }}
                className="flex items-center justify-between px-3 py-2.5 bg-[#040810] rounded-xl cursor-pointer hover:bg-[#0a1428] border border-transparent hover:border-[#0f2040] transition-all">
                <div className="flex items-center gap-3">
                  <div className={"w-1.5 h-8 rounded-full " + (up ? "bg-emerald-500" : "bg-red-500")} />
                  <div>
                    <p className="text-xs font-bold mono text-white">{symbol.replace('NSE:', '')}</p>
                    <p className="text-[10px] text-[#4a6080]">{name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Sparkline data={hist} up={up} />
                  <div className="text-right min-w-[80px]">
                    <p className="text-xs font-bold mono text-white">${n(q?.c).toFixed(n(q?.c) > 100 ? 2 : 4)}</p>
                    <p className={"text-[10px] mono font-semibold " + (up ? "text-emerald-400" : "text-red-400")}>
                      {up ? '+' : ''}{n(q?.dp).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---- Screener ----
function ScreenerPage({ onSelect }: { onSelect: (s: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      searchSymbol(query).then(r => { setResults(r); setSearching(false); });
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const presets = [
    { label: 'Magnificent 7', symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'] },
    { label: 'Indian Blue Chips', symbols: ['NSE:RELIANCE', 'NSE:TCS', 'NSE:HDFCBANK', 'NSE:INFY'] },
    { label: 'Crypto Top', symbols: ['BTC', 'ETH', 'SOL', 'BNB'] },
    { label: 'Dividend Kings', symbols: ['JNJ', 'PG', 'KO', 'MMM'] },
    { label: 'EV & Clean Energy', symbols: ['TSLA', 'RIVN', 'NIO', 'ENPH'] },
    { label: 'AI Plays', symbols: ['NVDA', 'MSFT', 'GOOGL', 'AMD', 'PLTR'] },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="glow-border rounded-2xl bg-[#080f1e] p-5">
        <h3 className="text-xs font-bold text-[#4a6080] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Filter size={12} /> Symbol Search
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080] w-4 h-4" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search any stock, ETF, index..."
            className="w-full bg-[#040810] border border-[#0f2040] rounded-xl pl-10 pr-4 py-3 text-sm mono text-white placeholder-[#4a6080] outline-none focus:border-cyan-500/50 transition-colors uppercase" />
        </div>
        {searching && <p className="text-xs text-cyan-400 mt-2 mono">Searching...</p>}
        {results.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {results.map(r => (
              <div key={r.symbol} onClick={() => onSelect(r.symbol)}
                className="flex items-center justify-between px-4 py-3 bg-[#040810] rounded-xl cursor-pointer hover:bg-[#0a1428] border border-[#0f2040] hover:border-cyan-500/20 transition-all">
                <div>
                  <span className="text-sm font-bold mono text-cyan-400">{r.symbol}</span>
                  <span className="text-xs text-[#4a6080] ml-3">{r.description}</span>
                </div>
                <span className="text-[10px] text-[#4a6080] bg-[#0f2040] px-2 py-1 rounded-lg mono">{r.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="glow-border rounded-2xl bg-[#080f1e] p-5">
        <h3 className="text-xs font-bold text-[#4a6080] uppercase tracking-widest mb-4">Preset Watchlists</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {presets.map(p => (
            <div key={p.label} className="bg-[#040810] border border-[#0f2040] rounded-2xl p-4 hover:border-cyan-500/20 transition-all">
              <p className="text-sm font-bold text-white mb-2">{p.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {p.symbols.map(s => (
                  <button key={s} onClick={() => onSelect(s)}
                    className="px-2 py-1 bg-[#0f2040] hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg text-[10px] mono text-[#4a6080] transition-colors">
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

// ---- Settings ----
function SettingsPage() {
  const { theme, toggleTheme, claudeApiKey, setClaudeApiKey } = useStore();
  const [keyInput, setKeyInput] = useState(claudeApiKey);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveKey = () => { setClaudeApiKey(keyInput); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { alert('Payment unavailable. Try again later.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="glow-border rounded-2xl bg-[#080f1e] p-5 space-y-4">
        <h3 className="text-xs font-bold text-[#4a6080] uppercase tracking-widest flex items-center gap-2">
          <Brain size={12} className="text-violet-400" /> Claude AI Integration
        </h3>
        <p className="text-xs text-[#4a6080]">
          Connect your own Anthropic API key to get AI-powered stock analysis directly in the dashboard.
          Your key is stored locally and never sent to our servers.
        </p>
        <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="w-full bg-[#040810] border border-[#0f2040] rounded-xl px-3 py-2.5 text-sm mono text-white placeholder-[#4a6080] outline-none focus:border-violet-500/50 transition-colors" />
        <div className="flex gap-2">
          <button onClick={saveKey}
            className={"flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors " +
              (saved ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30")}>
            {saved ? "Saved!" : "Save API Key"}
          </button>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2.5 bg-[#040810] border border-[#0f2040] rounded-xl text-sm text-center text-[#4a6080] hover:text-white transition-colors">
            Get API Key
          </a>
        </div>
        {claudeApiKey && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle size={13} /> Claude AI is connected
          </div>
        )}
      </div>

      <div className="glow-border rounded-2xl bg-[#080f1e] p-5 space-y-4">
        <h3 className="text-xs font-bold text-[#4a6080] uppercase tracking-widest flex items-center gap-2">
          <Settings size={12} /> Preferences
        </h3>
        <div className="flex items-center justify-between py-2 border-b border-[#0f2040]">
          <div>
            <p className="text-sm font-semibold text-white">Theme</p>
            <p className="text-xs text-[#4a6080]">Currently {theme} mode</p>
          </div>
          <button onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 bg-[#040810] border border-[#0f2040] rounded-xl text-xs text-white hover:border-cyan-500/30 transition-colors">
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-[#0f2040]">
          <div>
            <p className="text-sm font-semibold text-white">Data Source</p>
            <p className="text-xs text-[#4a6080]">Finnhub API â€” real market data with mock fallback</p>
          </div>
          <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
            Upgrade key
          </a>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold text-white">Auto-refresh</p>
            <p className="text-xs text-[#4a6080]">Quotes refresh every 15 seconds</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(124,58,237,0.08) 100%)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <div className="flex items-start gap-4">
          <Zap size={22} className="text-cyan-400 mt-1 shrink-0" />
          <div className="flex-1">
            <h3 className="text-base font-black text-white mb-1">StockPro Premium</h3>
            <p className="text-xs text-[#4a6080] mb-4">Real-time streaming, unlimited alerts, options data, and priority AI analysis.</p>
            <div className="grid grid-cols-2 gap-1.5 mb-5">
              {['WebSocket streaming', 'Unlimited alerts', 'Options chain', 'Advanced screener', 'Export to CSV', 'Priority support'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle size={11} className="text-emerald-400 shrink-0" /> {f}
                </div>
              ))}
            </div>
            <button onClick={handleUpgrade} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all">
              <CreditCard size={14} /> {loading ? 'Redirecting...' : 'Upgrade â€” $19/mo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main Chart View ----
function ChartView({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { claudeApiKey } = useStore();

  const load = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      getQuote(symbol).then(q => { setQuote(q); return q; }),
      getCandles(symbol, 'D', 365).then(c => {
        setCandles(c.length > 5 ? c : generateMockCandles(150, 365));
      }),
      getMetrics(symbol).then(setMetrics),
    ]).finally(() => setRefreshing(false));
  }, [symbol]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      getQuote(symbol).then(setQuote);
    }, 15000);
    return () => clearInterval(t);
  }, [symbol, load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-4xl font-black text-white tracking-tight mono">{symbol.replace('NSE:', '')}</h2>
          {quote && <PriceChip dp={quote.dp} />}
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20 mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
          </span>
        </div>
        <button onClick={load} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#080f1e] border border-[#0f2040] rounded-xl text-xs text-[#4a6080] hover:text-white hover:border-cyan-500/30 transition-all">
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <StockChart candles={candles} symbol={symbol} quote={quote} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FundamentalsPanel symbol={symbol} />
        <ClaudePanel symbol={symbol} quote={quote} metrics={metrics} />
      </div>
    </div>
  );
}

// ---- App Shell ----
type Tab = 'dashboard' | 'portfolio' | 'watchlist' | 'screener' | 'settings';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const { activeSymbol, setActiveSymbol, activeTab, setActiveTab, theme } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [tickerQuotes, setTickerQuotes] = useState<Record<string, Quote>>({});
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const searchRef = useRef<HTMLDivElement>(null);

  const tickerSymbols = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL', 'BTC', 'ETH', 'NSE:RELIANCE', 'NSE:TCS'];

  useEffect(() => {
    if (!isSignedIn) return;
    const load = () => {
      tickerSymbols.forEach(sym => {
        const fn = ['BTC', 'ETH'].includes(sym) ? getCryptoQuote : getQuote;
        fn(sym).then(q => {
          setTickerQuotes(prev => ({ ...prev, [sym]: q }));
          setCurrentPrices(prev => ({ ...prev, [sym]: q.c }));
        });
      });
    };
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [isSignedIn]);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchRes([]); return; }
    const t = setTimeout(() => searchSymbol(searchQ).then(setSearchRes), 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (sym: string) => {
    setActiveSymbol(sym);
    setActiveTab('dashboard');
    setSearchQ('');
    setSearchRes([]);
    setShowSearch(false);
  };

  const nav: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Wallet size={15} /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Star size={15} /> },
    { id: 'screener', label: 'Screener', icon: <Filter size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center bg-[#040810]">
      <BubbleBg />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
          <TrendingUp size={26} className="text-white" />
        </motion.div>
        <p className="text-[#4a6080] text-sm mono">Initializing StockPro...</p>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#040810] px-4 relative">
      <BubbleBg />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-10 text-center">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <TrendingUp size={28} className="text-white" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight">StockPro</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-[#4a6080] text-sm mono">US | India | Crypto | AI Analysis</motion.p>
        </div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="glow-border bg-[#080f1e] p-6 rounded-2xl">
          <SignIn routing="hash" appearance={{
            elements: {
              formButtonPrimary: 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 text-white w-full rounded-xl font-bold',
              card: 'bg-transparent shadow-none',
              headerTitle: 'text-white font-black',
              headerSubtitle: 'text-[#4a6080]',
              formFieldInput: 'bg-[#040810] border-[#0f2040] text-white rounded-xl',
              footerActionLink: 'text-cyan-400 hover:text-cyan-300',
            },
          }} />
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#040810] relative">
      <BubbleBg />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 210 : 64 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-20 bg-[#040810]/95 backdrop-blur-xl border-r border-[#0f2040] flex flex-col py-5 overflow-hidden shrink-0"
        style={{ boxShadow: '4px 0 30px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center justify-between px-3 mb-8">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shrink-0">
                  <TrendingUp size={15} className="text-white" />
                </div>
                <span className="font-black text-white text-base tracking-tight whitespace-nowrap">StockPro</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[#080f1e] rounded-xl text-[#4a6080] transition-colors shrink-0">
            {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {nav.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={"flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold relative " +
                (activeTab === id
                  ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20"
                  : "text-[#4a6080] hover:text-white hover:bg-[#080f1e] border border-transparent")}>
              <span className="shrink-0">{icon}</span>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-nowrap">{label}</motion.span>
                )}
              </AnimatePresence>
              {activeTab === id && (
                <motion.div layoutId="activePill"
                  className="absolute left-0 w-0.5 h-5 rounded-r-full bg-cyan-400"
                  style={{ boxShadow: '0 0 8px rgba(0,212,255,0.8)' }} />
              )}
            </button>
          ))}
        </nav>

        <div className="px-2 pt-4 border-t border-[#0f2040]">
          <div className="flex items-center gap-3 px-2">
            <UserButton afterSignOutUrl="/" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-bold text-white truncate max-w-[110px]">
                    {useStore.getState().claudeApiKey ? 'ðŸ¤– AI Active' : 'Free Plan'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Ticker tape */}
        <TickerTape quotes={tickerQuotes} />

        {/* Header */}
        <header className="bg-[#040810]/80 backdrop-blur-xl border-b border-[#0f2040] px-6 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-white capitalize tracking-wide">{activeTab}</h2>
            {activeTab === 'dashboard' && (
              <span className="text-xs font-bold mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                {activeSymbol.replace('NSE:', '')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div ref={searchRef} className="relative">
              <div className="flex items-center gap-2 bg-[#080f1e] border border-[#0f2040] focus-within:border-cyan-500/40 rounded-xl px-3 py-2 w-52 transition-colors">
                <Search size={13} className="text-[#4a6080] shrink-0" />
                <input value={searchQ}
                  onChange={e => { setSearchQ(e.target.value.toUpperCase()); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Search symbol..."
                  className="bg-transparent text-xs mono text-white placeholder-[#4a6080] outline-none w-full" />
              </div>
              <AnimatePresence>
                {showSearch && searchRes.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-2 left-0 w-72 bg-[#080f1e] border border-[#1a3060] rounded-2xl shadow-2xl overflow-hidden z-50"
                    style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
                    {searchRes.map(r => (
                      <button key={r.symbol} onClick={() => handleSelect(r.symbol)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#0a1428] transition-colors text-left border-b border-[#0f2040] last:border-0">
                        <div>
                          <span className="text-xs font-black mono text-cyan-400">{r.symbol}</span>
                          <span className="text-[10px] text-[#4a6080] ml-2 block truncate max-w-[150px]">{r.description}</span>
                        </div>
                        <span className="text-[10px] text-[#4a6080] bg-[#0f2040] px-2 py-0.5 rounded-lg mono shrink-0">{r.type}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}>

              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 max-w-[1800px] mx-auto">
                  <div className="xl:col-span-3 space-y-5">
                    <ChartView symbol={activeSymbol} />
                    <MarketsGrid onSelect={handleSelect} />
                    <NewsFeed symbol={activeSymbol} />
                  </div>
                  <div className="space-y-5">
                    <WatchlistPanel onSelect={handleSelect} selected={activeSymbol} />
                    <AlertsPanel currentPrices={currentPrices} />
                  </div>
                </div>
              )}
              {activeTab === 'portfolio' && <PortfolioPage onSelect={handleSelect} />}
              {activeTab === 'watchlist' && (
                <div className="max-w-lg">
                  <WatchlistPanel onSelect={sym => { handleSelect(sym); }} selected={activeSymbol} />
                </div>
              )}
              {activeTab === 'screener' && <ScreenerPage onSelect={handleSelect} />}
              {activeTab === 'settings' && <SettingsPage />}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

