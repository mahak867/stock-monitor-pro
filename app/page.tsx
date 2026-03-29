"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser, UserButton, SignIn } from "@clerk/nextjs";
import {
  ComposedChart, AreaChart, Area, Line, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, Search, Menu, X, Wallet,
  LayoutDashboard, Star, Newspaper, BarChart2,
  Bell, Settings, Sun, Moon, Plus, Trash2, CreditCard,
  ChevronUp, ChevronDown, Bitcoin, Globe, Filter,
  AlertTriangle, CheckCircle, Info, ArrowUpRight, ArrowDownRight,
  RefreshCw, BookOpen, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../lib/store";
import {
  getQuote, getCandles, getFundamentals, getMetrics,
  getNews, getCryptoQuote, searchSymbol, generateMockCandles,
  INDIAN_STOCKS, US_STOCKS, CRYPTO_LIST,
  type Quote, type Candle, type NewsItem,
  type Fundamentals, type Metrics, type SearchResult,
} from "../lib/api";


const fmt = (n: number | undefined, prefix = '') => {
  if (n === undefined || n === null || isNaN(n)) return 'â€”';
  if (Math.abs(n) >= 1e9) return prefix + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return prefix + (n / 1e6).toFixed(2) + 'M';
  return prefix + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};
const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
const timeAgo = (ts: number) => {
  const diff = Math.floor((Date.now() - ts * (ts < 1e12 ? 1000 : 1)) / 60000);
  if (diff < 60) return diff + 'm ago';
  if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
  return Math.floor(diff / 1440) + 'd ago';
};


const T = {
  bg: 'bg-[#080b14]',
  sidebar: 'bg-[#0c1020]',
  card: 'bg-[#0f1629]',
  border: 'border-[#1a2444]',
  text: 'text-white',
  muted: 'text-[#5a6a8a]',
  accent: '#3b7cff',
  green: 'text-emerald-400',
  red: 'text-red-400',
};


function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 80;
    const y = 20 - ((v - min) / (max - min || 1)) * 18;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="80" height="20" viewBox="0 0 80 20">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


function CandlestickChart({ candles, symbol }: { candles: Candle[]; symbol: string }) {
  const [chartType, setChartType] = useState<'candle' | 'area' | 'bar'>('area');
  const [range, setRange] = useState<'1W' | '1M' | '3M' | '1Y'>('3M');

  const filtered = (() => {
    const days = { '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }[range];
    return candles.slice(-days);
  })();

  const areaData = filtered.map(c => ({
    date: fmtDate(c.t), price: c.c, open: c.o, high: c.h, low: c.l, volume: c.v,
  }));

  const isUp = filtered.length > 1
    ? filtered[filtered.length - 1].c >= filtered[0].c
    : true;
  const color = isUp ? '#10b981' : '#ef4444';

  return (
    <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1">
          {(['1W', '1M', '3M', '1Y'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={"px-3 py-1 rounded-lg text-xs font-semibold transition-colors " + (range === r ? "bg-blue-600 text-white" : "text-[#5a6a8a] hover:text-white hover:bg-[#1a2444]")}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['area', 'candle', 'bar'] as const).map(t => (
            <button key={t} onClick={() => setChartType(t)}
              className={"px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors " + (chartType === t ? "bg-[#1a2444] text-white" : "text-[#5a6a8a] hover:text-white")}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <ComposedChart data={areaData}>
              <CartesianGrid stroke="#1a2444" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#1a2444" tick={{ fill: '#5a6a8a', fontSize: 10 }} />
              <YAxis stroke="#1a2444" tick={{ fill: '#5a6a8a', fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1a2444', borderRadius: '10px', fontSize: '11px' }} labelStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="volume" fill="#1a2444" radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="price" stroke={color} dot={false} strokeWidth={2} />
            </ComposedChart>
          ) : (
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id={"grad-" + symbol} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a2444" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#1a2444" tick={{ fill: '#5a6a8a', fontSize: 10 }} />
              <YAxis stroke="#1a2444" tick={{ fill: '#5a6a8a', fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#0f1629', border: '1px solid #1a2444', borderRadius: '10px', fontSize: '11px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v: unknown) => ['$' + (v as number).toFixed(2), 'Price']}
              />
              <Area type="monotone" dataKey="price" stroke={color} fill={"url(#grad-" + symbol + ")"} strokeWidth={2} dot={false} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}


function FundamentalsPanel({ symbol }: { symbol: string }) {
  const [fund, setFund] = useState<Fundamentals | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    getFundamentals(symbol).then(setFund);
    getMetrics(symbol).then(setMetrics);
  }, [symbol]);

  const rows = [
    { label: 'P/E Ratio', value: fmt(metrics?.peNormalizedAnnual) },
    { label: 'EPS', value: fmt(metrics?.epsNormalizedAnnual, '$') },
    { label: 'Market Cap', value: fmt(metrics?.marketCapitalization, '$') },
    { label: '52W High', value: fmt(metrics?.weekHigh52, '$') },
    { label: '52W Low', value: fmt(metrics?.weekLow52, '$') },
    { label: 'Beta', value: fmt(metrics?.beta) },
    { label: 'Div Yield', value: metrics?.dividendYieldIndicatedAnnual ? (metrics.dividendYieldIndicatedAnnual ?? 0).toFixed(2) + '%' : 'â€”' },
    { label: 'ROE', value: metrics?.roeRfy ? (metrics.roeRfy ?? 0).toFixed(1) + '%' : 'â€”' },
  ];

  return (
    <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
      <div className="flex items-center gap-3 mb-4">
        {fund?.logo && <img src={fund.logo} alt={fund.name} className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />}
        <div>
          <h4 className="text-white font-bold text-sm">{fund?.name || symbol}</h4>
          <p className="text-[#5a6a8a] text-xs">{fund?.industry || 'Loading...'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="bg-[#080b14] rounded-xl p-3">
            <p className="text-[#5a6a8a] text-xs mb-1">{label}</p>
            <p className="text-white font-semibold text-sm">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


function NewsFeed({ symbol }: { symbol?: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getNews(symbol).then(data => {
      if (data.length > 0) setNews(data);
      else setNews([
        { id: 1, headline: 'Markets rally as inflation data cools', source: 'Reuters', datetime: Date.now() - 120000, url: '#', summary: '', image: '', sentiment: 'positive' },
        { id: 2, headline: 'Fed signals potential rate pause', source: 'Bloomberg', datetime: Date.now() - 900000, url: '#', summary: '', image: '', sentiment: 'neutral' },
        { id: 3, headline: 'Tech selloff deepens amid rate concerns', source: 'CNBC', datetime: Date.now() - 3600000, url: '#', summary: '', image: '', sentiment: 'negative' },
        { id: 4, headline: 'Nifty 50 hits all-time high on FII inflows', source: 'Economic Times', datetime: Date.now() - 7200000, url: '#', summary: '', image: '', sentiment: 'positive' },
      ]);
      setLoading(false);
    });
  }, [symbol]);

  const sentimentIcon = (s?: string) => {
    if (s === 'positive') return <ArrowUpRight size={12} className="text-emerald-400" />;
    if (s === 'negative') return <ArrowDownRight size={12} className="text-red-400" />;
    return <Info size={12} className="text-blue-400" />;
  };

  return (
    <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
      <h3 className="text-xs font-bold text-[#5a6a8a] uppercase tracking-widest mb-4 flex items-center gap-2">
        <Newspaper size={13} /> Market News
      </h3>
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="animate-pulse h-10 bg-[#0f1629] rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {news.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 rounded-xl hover:bg-[#1a2444]/40 transition-colors block">
              <span className="mt-0.5 shrink-0">{sentimentIcon(item.sentiment)}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 leading-snug line-clamp-2">{item.headline}</p>
                <p className="text-[10px] text-[#5a6a8a] mt-0.5">{item.source} | {timeAgo(item.datetime)}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}


function AlertsPanel() {
  const { alerts, addAlert, removeAlert, toggleAlert } = useStore();
  const [sym, setSym] = useState('');
  const [cond, setCond] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');

  const handleAdd = () => {
    if (!sym || !price) return;
    addAlert({ symbol: sym.toUpperCase(), condition: cond, price: parseFloat(price), active: true });
    setSym(''); setPrice('');
  };

  return (
    <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
      <h3 className="text-xs font-bold text-[#5a6a8a] uppercase tracking-widest mb-4 flex items-center gap-2">
        <Bell size={13} /> Price Alerts
      </h3>

      <div className="space-y-2 mb-4">
        <input value={sym} onChange={e => setSym(e.target.value)} placeholder="Symbol (e.g. AAPL)"
          className="w-full bg-[#080b14] border border-[#1a2444] rounded-xl px-3 py-2 text-xs text-white placeholder-[#5a6a8a] outline-none focus:border-blue-500 uppercase" />
        <div className="flex gap-2">
          <select value={cond} onChange={e => setCond(e.target.value as 'above' | 'below')}
            className="flex-1 bg-[#080b14] border border-[#1a2444] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500">
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number"
            className="flex-1 bg-[#080b14] border border-[#1a2444] rounded-xl px-3 py-2 text-xs text-white placeholder-[#5a6a8a] outline-none focus:border-blue-500" />
        </div>
        <button onClick={handleAdd}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2">
          <Plus size={13} /> Add Alert
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {alerts.length === 0 && <p className="text-[#5a6a8a] text-xs text-center py-4">No alerts set</p>}
        {alerts.map(a => (
          <div key={a.id} className="flex items-center justify-between bg-[#080b14] rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <button onClick={() => toggleAlert(a.id)}>
                {a.active
                  ? <CheckCircle size={14} className="text-emerald-400" />
                  : <AlertTriangle size={14} className="text-[#5a6a8a]" />}
              </button>
              <span className="text-xs text-white font-semibold">{a.symbol}</span>
              <span className="text-[10px] text-[#5a6a8a]">{a.condition} ${a.price}</span>
            </div>
            <button onClick={() => removeAlert(a.id)} className="text-[#5a6a8a] hover:text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


function WatchlistPanel({ onSelect, selected }: { onSelect: (s: string) => void; selected: string }) {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useStore();
  const [input, setInput] = useState('');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});

  useEffect(() => {
    watchlist.forEach(({ symbol }) => {
      getQuote(symbol).then(q => { if (q) setQuotes(prev => ({ ...prev, [symbol]: q })); });
    });
  }, [watchlist]);

  const handleAdd = () => {
    const sym = input.trim().toUpperCase();
    if (sym) { addToWatchlist({ symbol: sym, name: sym }); setInput(''); }
  };

  const sparkData = (symbol: string) => {
    const q = quotes[symbol];
    if (!q) return [];
    const base = q.pc;
    return Array.from({ length: 12 }, (_, i) => base + (Math.random() - 0.5) * base * 0.02 * i * 0.3);
  };

  return (
    <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
      <h3 className="text-xs font-bold text-[#5a6a8a] uppercase tracking-widest mb-4 flex items-center gap-2">
        <Star size={13} className="text-amber-400" /> Watchlist
      </h3>
      <div className="flex gap-2 mb-3">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add symbol..." maxLength={15}
          className="flex-1 bg-[#080b14] border border-[#1a2444] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#5a6a8a] outline-none focus:border-blue-500 uppercase" />
        <button onClick={handleAdd} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors">
          <Plus size={13} className="text-white" />
        </button>
      </div>
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {watchlist.map(({ symbol, name }) => {
          const q = quotes[symbol];
          const isUp = (q && typeof q.dp === 'number') ? q.dp >= 0 : true;
          return (
            <div key={symbol} onClick={() => onSelect(symbol)}
              className={"flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors border " + (selected === symbol ? "bg-blue-600/10 border-blue-500/30" : "hover:bg-[#1a2444]/40 border-transparent")}>
              <div className="flex items-center gap-3">
                <div>
                  <p className={"text-xs font-bold " + (selected === symbol ? "text-blue-400" : "text-white")}>{symbol.replace('NSE:', '')}</p>
                  <p className="text-[10px] text-[#5a6a8a]">{name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sparkline data={sparkData(symbol)} color={isUp ? '#10b981' : '#ef4444'} />
                <div className="text-right min-w-[60px]">
                  <p className="text-xs font-semibold text-white">{q ? '$' + (q.c ?? 0).toFixed(2) : 'â€”'}</p>
                  <p className={"text-[10px] font-medium " + (isUp ? "text-emerald-400" : "text-red-400")}>
                    {q ? (q.dp >= 0 ? '+' : '') + (q.dp ?? 0).toFixed(2) + '%' : ''}
                  </p>
                </div>
                <button onClick={e => { e.stopPropagation(); removeFromWatchlist(symbol); }}
                  className="text-[#5a6a8a] hover:text-red-400 transition-colors">
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


function ScreenerPanel({ onSelect }: { onSelect: (s: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      searchSymbol(query).then(r => { setResults(r); setLoading(false); });
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const filters = [
    { label: 'Large Cap', desc: 'Market cap > $10B' },
    { label: 'High Growth', desc: 'Revenue growth > 20%' },
    { label: 'Dividend', desc: 'Yield > 2%' },
    { label: 'Value', desc: 'P/E < 15' },
    { label: 'Momentum', desc: 'Near 52W high' },
    { label: 'India NSE', desc: 'Indian market stocks' },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
        <h3 className="text-xs font-bold text-[#5a6a8a] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Filter size={13} /> Stock Screener
        </h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a] w-4 h-4" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search any stock, ETF, or crypto..."
            className="w-full bg-[#080b14] border border-[#1a2444] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#5a6a8a] outline-none focus:border-blue-500 uppercase" />
        </div>
        {loading && <p className="text-[#5a6a8a] text-xs text-center py-2">Searching...</p>}
        {results.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {results.map(r => (
              <div key={r.symbol} onClick={() => onSelect(r.symbol)}
                className="flex items-center justify-between p-3 bg-[#080b14] rounded-xl cursor-pointer hover:bg-[#1a2444]/50 transition-colors">
                <div>
                  <span className="text-sm font-bold text-white">{r.symbol}</span>
                  <span className="text-xs text-[#5a6a8a] ml-2">{r.description}</span>
                </div>
                <span className="text-xs text-[#5a6a8a] bg-[#1a2444] px-2 py-0.5 rounded-lg">{r.type}</span>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {filters.map(f => (
            <div key={f.label} className="bg-[#080b14] border border-[#1a2444] rounded-xl p-3 cursor-pointer hover:border-blue-500/50 transition-colors">
              <p className="text-xs font-semibold text-white">{f.label}</p>
              <p className="text-[10px] text-[#5a6a8a] mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function CryptoPanel({ onSelect }: { onSelect: (s: string) => void }) {
  const [quotes, setQuotes] = useState<Record<string, { c: number; dp: number }>>({});

  useEffect(() => {
    CRYPTO_LIST.forEach(({ symbol }) => {
      getCryptoQuote(symbol).then(q => {
        if (q) setQuotes(prev => ({ ...prev, [symbol]: q }));
      });
    });
  }, []);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
        <h3 className="text-xs font-bold text-[#5a6a8a] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Bitcoin size={13} className="text-amber-400" /> Crypto Markets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CRYPTO_LIST.map(({ symbol, name }) => {
            const q = quotes[symbol];
            const isUp = (q && typeof q.dp === 'number') ? q.dp >= 0 : true;
            return (
              <div key={symbol} onClick={() => onSelect(symbol)}
                className="flex items-center justify-between bg-[#080b14] border border-[#1a2444] rounded-2xl p-4 cursor-pointer hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Bitcoin size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{symbol}</p>
                    <p className="text-xs text-[#5a6a8a]">{name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{q ? '$' + q.c.toLocaleString() : 'â€”'}</p>
                  <p className={"text-xs font-semibold " + (isUp ? "text-emerald-400" : "text-red-400")}>
                    {q ? (q.dp >= 0 ? '+' : '') + (q.dp ?? 0).toFixed(2) + '%' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function PortfolioPage({ onSelect }: { onSelect: (s: string) => void }) {
  const { portfolio, balance, removePosition } = useStore();

  const totalValue = portfolio.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
  const totalCost = portfolio.reduce((s, p) => s + p.avgPrice * p.quantity, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost ? (totalPnl / totalCost) * 100 : 0;

  const pnlHistory = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: totalValue * (0.85 + Math.random() * 0.15 + i * 0.002),
  }));

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Value', value: '$' + (totalValue + balance).toLocaleString(), sub: 'Portfolio + Cash' },
          { label: 'Invested', value: '$' + totalCost.toLocaleString(), sub: portfolio.length + ' positions' },
          { label: 'Total P&L', value: (totalPnl >= 0 ? '+' : '') + '$' + (totalPnl ?? 0).toFixed(0), positive: totalPnl >= 0, sub: (totalPnlPct ?? 0).toFixed(2) + '%' },
          { label: 'Cash Balance', value: '$' + balance.toLocaleString(), sub: 'Available' },
        ].map(({ label, value, sub, positive }) => (
          <div key={label} className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
            <p className="text-xs text-[#5a6a8a] uppercase tracking-widest mb-2">{label}</p>
            <p className={"text-2xl font-bold " + (positive === undefined ? "text-white" : positive ? "text-emerald-400" : "text-red-400")}>{value}</p>
            <p className="text-xs text-[#5a6a8a] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* P&L Chart */}
      <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
        <h3 className="text-xs font-bold text-[#5a6a8a] uppercase tracking-widest mb-4">Portfolio Value â€” Last 30 Days</h3>
        <div className="h-40 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pnlHistory}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b7cff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b7cff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#1a2444" tick={{ fill: '#5a6a8a', fontSize: 10 }} />
              <YAxis stroke="#1a2444" tick={{ fill: '#5a6a8a', fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1a2444', borderRadius: '10px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="value" stroke="#3b7cff" fill="url(#pnlGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Positions */}
      <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
        <h3 className="text-xs font-bold text-[#5a6a8a] uppercase tracking-widest mb-4">Positions</h3>
        {portfolio.length === 0 ? (
          <div className="text-center py-10">
            <BarChart2 size={36} className="text-[#1a2444] mx-auto mb-3" />
            <p className="text-[#5a6a8a] text-sm">No positions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {portfolio.map(p => {
              const pnl = ((p.currentPrice || p.avgPrice || 0) - (p.avgPrice || 0)) * (p.quantity || 0);
              const pct = p.avgPrice ? (((p.currentPrice || p.avgPrice) - p.avgPrice) / p.avgPrice) * 100 : 0;
              return (
                <div key={p.symbol} onClick={() => onSelect(p.symbol)}
                  className="flex items-center justify-between bg-[#080b14] rounded-2xl p-4 cursor-pointer hover:bg-[#1a2444]/40 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-white">{p.symbol}</p>
                    <p className="text-xs text-[#5a6a8a]">{p.quantity} shares @ ${p.avgPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${(p.currentPrice * p.quantity).toFixed(2)}</p>
                    <p className={"text-xs font-semibold " + (pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {pnl >= 0 ? '+' : ''}${(pnl ?? 0).toFixed(2)} ({(pct ?? 0).toFixed(2)}%)
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removePosition(p.symbol); }}
                    className="ml-4 text-[#5a6a8a] hover:text-red-400 transition-colors">
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


function MarketsGrid({ onSelect }: { onSelect: (s: string) => void }) {
  const { marketTab, setMarketTab } = useStore();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});

  useEffect(() => {
    const stocks = marketTab === 'india' ? INDIAN_STOCKS : marketTab === 'crypto' ? [] : US_STOCKS;
    stocks.forEach(({ symbol }) => {
      getQuote(symbol).then(q => { if (q) setQuotes(prev => ({ ...prev, [symbol]: q })); });
    });
  }, [marketTab]);

  return (
    <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5"}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-[#5a6a8a] uppercase tracking-widest flex items-center gap-2">
          <Globe size={13} /> Markets
        </h3>
        <div className="flex gap-1">
          {(['us', 'india', 'crypto'] as const).map(t => (
            <button key={t} onClick={() => setMarketTab(t)}
              className={"px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors " + (marketTab === t ? "bg-blue-600 text-white" : "text-[#5a6a8a] hover:text-white")}>
              {t === 'us' ? 'ðŸ‡ºðŸ‡¸ US' : t === 'india' ? 'ðŸ‡®ðŸ‡³ India' : 'â‚¿ Crypto'}
            </button>
          ))}
        </div>
      </div>
      {marketTab === 'crypto' ? (
        <CryptoPanel onSelect={onSelect} />
      ) : (
        <div className="space-y-2">
          {(marketTab === 'india' ? INDIAN_STOCKS : US_STOCKS).map(({ symbol, name }) => {
            const q = quotes[symbol];
            const isUp = (q && typeof q.dp === 'number') ? q.dp >= 0 : true;
            const displaySym = symbol.replace('NSE:', '');
            return (
              <div key={symbol} onClick={() => onSelect(symbol)}
                className="flex items-center justify-between p-3 bg-[#080b14] rounded-xl cursor-pointer hover:bg-[#1a2444]/40 transition-colors">
                <div>
                  <p className="text-sm font-bold text-white">{displaySym}</p>
                  <p className="text-xs text-[#5a6a8a]">{name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Sparkline data={Array.from({length: 12}, () => (q?.c || 100) + (Math.random()-0.5)*5)} color={isUp ? '#10b981' : '#ef4444'} />
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm font-bold text-white">{q ? '$' + (q.c ?? 0).toFixed(2) : 'â€”'}</p>
                    <p className={"text-xs font-semibold " + (isUp ? "text-emerald-400" : "text-red-400")}>
                      {q ? (q.dp >= 0 ? '+' : '') + (q.dp ?? 0).toFixed(2) + '%' : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function SettingsPage() {
  const { theme, toggleTheme } = useStore();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { alert('Payment unavailable.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className={"rounded-2xl border " + T.border + " " + T.card + " p-5 space-y-4"}>
        <h3 className="text-xs font-bold text-[#5a6a8a] uppercase tracking-widest flex items-center gap-2">
          <Settings size={13} /> Preferences
        </h3>
        <div className="flex items-center justify-between py-3 border-b border-[#1a2444]">
          <div>
            <p className="text-sm font-semibold text-white">Theme</p>
            <p className="text-xs text-[#5a6a8a]">Currently {theme} mode</p>
          </div>
          <button onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 bg-[#080b14] border border-[#1a2444] rounded-xl text-xs text-white hover:border-blue-500 transition-colors">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-[#1a2444]">
          <div>
            <p className="text-sm font-semibold text-white">Data refresh</p>
            <p className="text-xs text-[#5a6a8a]">Chart updates every 3 seconds</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" /> Live
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold text-white">Data source</p>
            <p className="text-xs text-[#5a6a8a]">Finnhub API | Free tier (demo mode if no key set)</p>
          </div>
          <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Get API key â†’</a>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Zap size={24} className="text-blue-400 mt-1 shrink-0" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-white mb-1">Upgrade to StockPro Premium</h3>
            <p className="text-xs text-slate-400 mb-4">Real-time streaming data, unlimited alerts, advanced screener, options chain, and priority support.</p>
            <ul className="space-y-1.5 mb-5">
              {['Real-time WebSocket data', 'Unlimited price alerts', 'Options chain viewer', 'Advanced stock screener', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle size={12} className="text-emerald-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgrade} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors">
              <CreditCard size={15} /> {loading ? 'Redirecting...' : 'Upgrade â€” $19/mo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function ChartView({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    const base = symbol === 'AAPL' ? 170 : symbol === 'TSLA' ? 250 : symbol === 'MSFT' ? 380 : symbol === 'NVDA' ? 900 : 150;
    getQuote(symbol).then(q => { if (q && q.c) setQuote(q); });
    getCandles(symbol, 'D', 90).then(c => {
      setCandles(c.length > 0 ? c : generateMockCandles(base));
      setRefreshing(false);
    });
  }, [symbol]);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const isUp = quote ? quote.dp >= 0 : true;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-black text-white tracking-tight">{symbol.replace('NSE:', '')}</h2>
            {quote && (
              <>
                <span className="text-3xl font-bold text-white">${(quote.c ?? 0).toFixed(2)}</span>
                <span className={"flex items-center gap-1 text-lg font-bold px-3 py-1 rounded-xl " + (isUp ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                  {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {isUp ? '+' : ''}{(quote.d ?? 0).toFixed(2)} ({(quote.dp ?? 0).toFixed(2)}%)
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-[#5a6a8a]">
            {quote && <>
              <span>O: ${(quote.o ?? 0).toFixed(2)}</span>
              <span>H: ${(quote.h ?? 0).toFixed(2)}</span>
              <span>L: ${(quote.l ?? 0).toFixed(2)}</span>
              <span>Prev: ${(quote.pc ?? 0).toFixed(2)}</span>
            </>}
          </div>
        </div>
        <button onClick={load} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f1629] border border-[#1a2444] rounded-xl text-xs text-[#5a6a8a] hover:text-white hover:border-blue-500 transition-colors">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Chart */}
      <CandlestickChart candles={candles} symbol={symbol} />

      {/* Fundamentals */}
      <FundamentalsPanel symbol={symbol} />
    </div>
  );
}


type Tab = 'dashboard' | 'portfolio' | 'watchlist' | 'screener' | 'crypto' | 'settings';

function Dashboard() {
  const { user } = useUser();
  const { activeSymbol, setActiveSymbol, theme, toggleTheme } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      searchSymbol(searchQuery).then(setSearchResults);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSelect = (sym: string) => {
    setActiveSymbol(sym);
    setActiveTab('dashboard');
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const nav: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Wallet size={16} /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Star size={16} /> },
    { id: 'screener', label: 'Screener', icon: <Filter size={16} /> },
    { id: 'crypto', label: 'Crypto', icon: <Bitcoin size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className={"flex h-screen overflow-hidden " + (theme === 'dark' ? 'bg-[#080b14]' : 'bg-slate-100')}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 68 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-[#0c1020] border-r border-[#1a2444] flex flex-col py-5 overflow-hidden shrink-0 z-10"
      >
        <div className="flex items-center justify-between px-4 mb-8">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <TrendingUp size={14} className="text-white" />
                </div>
                <span className="font-black text-white text-base tracking-tight whitespace-nowrap">StockPro</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[#1a2444] rounded-xl text-[#5a6a8a] transition-colors shrink-0">
            {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 flex-1">
          {nav.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={"flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium " + (activeTab === id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-[#5a6a8a] hover:bg-[#1a2444] hover:text-white")}>
              <span className="shrink-0">{icon}</span>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-nowrap">{label}</motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        <div className="px-3 pt-4 border-t border-[#1a2444]">
          <div className="flex items-center gap-3 px-2">
            <UserButton afterSignOutUrl="/" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-bold text-white truncate max-w-[110px]">{user?.firstName || 'Trader'}</p>
                  <p className="text-[10px] text-emerald-400">Pro Plan</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0c1020]/80 backdrop-blur-xl border-b border-[#1a2444] px-6 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white capitalize">{activeTab}</h2>
            {activeTab === 'dashboard' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <div className="flex items-center gap-2 bg-[#0f1629] border border-[#1a2444] rounded-xl px-3 py-2 w-56 focus-within:border-blue-500 transition-colors">
                <Search size={14} className="text-[#5a6a8a] shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value.toUpperCase()); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Search symbol..."
                  className="bg-transparent text-xs text-white placeholder-[#5a6a8a] outline-none w-full"
                />
              </div>
              <AnimatePresence>
                {showSearch && searchResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-2 left-0 w-72 bg-[#0f1629] border border-[#1a2444] rounded-2xl shadow-2xl overflow-hidden z-50">
                    {searchResults.map(r => (
                      <button key={r.symbol} onClick={() => handleSelect(r.symbol)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1a2444] transition-colors text-left">
                        <div>
                          <span className="text-xs font-bold text-white">{r.symbol}</span>
                          <span className="text-[10px] text-[#5a6a8a] ml-2 block">{r.description}</span>
                        </div>
                        <span className="text-[10px] text-[#5a6a8a] bg-[#1a2444] px-2 py-0.5 rounded-lg shrink-0">{r.type}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={toggleTheme}
              className="p-2 bg-[#0f1629] border border-[#1a2444] rounded-xl text-[#5a6a8a] hover:text-white hover:border-blue-500 transition-colors">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#080b14]">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 max-w-[1600px] mx-auto">
              <div className="xl:col-span-3 space-y-5">
                <ChartView symbol={activeSymbol} />
                <MarketsGrid onSelect={handleSelect} />
              </div>
              <div className="space-y-5">
                <WatchlistPanel onSelect={handleSelect} selected={activeSymbol} />
                <AlertsPanel />
                <NewsFeed symbol={activeSymbol} />
              </div>
            </div>
          )}
          {activeTab === 'portfolio' && <PortfolioPage onSelect={handleSelect} />}
          {activeTab === 'watchlist' && (
            <div className="max-w-lg">
              <WatchlistPanel onSelect={handleSelect} selected={activeSymbol} />
            </div>
          )}
          {activeTab === 'screener' && <ScreenerPanel onSelect={handleSelect} />}
          {activeTab === 'crypto' && <CryptoPanel onSelect={handleSelect} />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}


export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center bg-[#080b14]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse">
          <TrendingUp size={20} className="text-white" />
        </div>
        <p className="text-[#5a6a8a] text-sm">Loading StockPro...</p>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#080b14] px-4">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">StockPro</h1>
        </div>
        <p className="text-[#5a6a8a] text-sm">Professional stock monitoring | US | India | Crypto</p>
      </div>
      <div className="bg-[#0c1020] border border-[#1a2444] p-6 rounded-2xl shadow-2xl w-full max-w-sm">
        <SignIn routing="hash" appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white w-full rounded-xl',
            card: 'bg-transparent shadow-none',
            headerTitle: 'text-white font-bold',
            headerSubtitle: 'text-[#5a6a8a]',
            formFieldInput: 'bg-[#080b14] border-[#1a2444] text-white rounded-xl',
            footerActionLink: 'text-blue-400 hover:text-blue-300',
          },
        }} />
      </div>
    </div>
  );

  return <Dashboard />;
}

