"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton, SignIn } from "@clerk/nextjs";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Area
} from "recharts";
import {
  TrendingUp, Search, Menu, X, Wallet,
  LayoutDashboard, BarChart2, Star, Newspaper,
  Plus, Trash2, CreditCard, ChevronUp, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../lib/store";
import { getQuote, getNews } from "../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
interface NewsItem { headline: string; source: string; datetime: number; url: string; }
interface QuoteData { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; }

// ─── Mock chart data generator ───────────────────────────────────────────────
const generateChartData = (base = 100) => {
  let price = base;
  return Array.from({ length: 50 }, (_, i) => {
    price += (Math.random() - 0.48) * 2;
    return {
      time: `${i}m`,
      price: parseFloat(price.toFixed(2)),
      sma: parseFloat((price + 0.5).toFixed(2)),
      ema: parseFloat((price - 0.2).toFixed(2)),
      volume: Math.floor(Math.random() * 10000),
    };
  });
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, positive }: {
  label: string; value: string; sub?: string; positive?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <h3 className={`text-2xl font-bold ${positive === undefined ? "text-white" : positive ? "text-emerald-400" : "text-red-400"}`}>
        {value}
      </h3>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Technical Chart ─────────────────────────────────────────────────────────
function TechnicalChart({ symbol }: { symbol: string }) {
  const [data, setData] = useState<ReturnType<typeof generateChartData>>([]);
  const [quote, setQuote] = useState<QuoteData | null>(null);

  useEffect(() => {
    const base = symbol === "AAPL" ? 170 : symbol === "TSLA" ? 250 : symbol === "MSFT" ? 380 : 150;
    setData(generateChartData(base));

    getQuote(symbol).then((q) => { if (q && q.c) setQuote(q); });

    const interval = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1]?.price ?? 150;
        const next = last + (Math.random() - 0.48) * 1.5;
        const point = {
          time: `${prev.length}m`,
          price: parseFloat(next.toFixed(2)),
          sma: parseFloat((next + 0.5).toFixed(2)),
          ema: parseFloat((next - 0.2).toFixed(2)),
          volume: Math.floor(Math.random() * 10000),
        };
        return [...prev.slice(-49), point];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [symbol]);

  const last = data[data.length - 1]?.price ?? 0;
  const first = data[0]?.price ?? 0;
  const isUp = last >= first;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">{symbol}</h3>
            {quote && (
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${quote.dp >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                {quote.dp >= 0 ? "+" : ""}{quote.dp?.toFixed(2)}%
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live · updates every 3s
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">${last.toFixed(2)}</p>
          <p className={`text-sm font-medium ${isUp ? "text-emerald-400" : "text-red-400"} flex items-center justify-end gap-1`}>
            {isUp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {Math.abs(last - first).toFixed(2)} today
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <span className="px-2 py-1 bg-blue-500/15 text-blue-400 rounded-lg text-xs font-medium">SMA</span>
        <span className="px-2 py-1 bg-purple-500/15 text-purple-400 rounded-lg text-xs font-medium">EMA</span>
        <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded-lg text-xs font-medium">Volume</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#1e293b" tick={{ fill: "#475569", fontSize: 10 }} />
            <YAxis yAxisId="l" stroke="#1e293b" tick={{ fill: "#475569", fontSize: 10 }} domain={["auto", "auto"]} />
            <YAxis yAxisId="r" orientation="right" stroke="#1e293b" tick={{ fill: "#475569", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", fontSize: "12px" }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Area yAxisId="l" type="monotone" dataKey="price" stroke="#3b82f6" fill="url(#priceGrad)" strokeWidth={2} dot={false} />
            <Line yAxisId="l" type="monotone" dataKey="sma" stroke="#60a5fa" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
            <Line yAxisId="l" type="monotone" dataKey="ema" stroke="#a855f7" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
            <Bar yAxisId="r" dataKey="volume" fill="#1e293b" barSize={3} radius={[2, 2, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Analyst Ratings ─────────────────────────────────────────────────────────
function AnalystRatings() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-widest">Analyst Consensus</h3>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div className="w-[60%] bg-emerald-500 rounded-l-full" />
        <div className="w-[30%] bg-amber-400" />
        <div className="w-[10%] bg-red-500 rounded-r-full" />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-2.5">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Buy 60%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Hold 30%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Sell 10%</span>
      </div>
    </div>
  );
}

// ─── Watchlist Panel ─────────────────────────────────────────────────────────
function WatchlistPanel({ onSelect, selected }: { onSelect: (s: string) => void; selected: string }) {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useStore();
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const sym = input.trim().toUpperCase();
    if (sym.length > 0 && sym.length <= 5) {
      addToWatchlist(sym);
      setInput("");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
      <h3 className="font-semibold text-white text-sm uppercase tracking-widest flex items-center gap-2">
        <Star size={14} className="text-amber-400" /> Watchlist
      </h3>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add symbol…"
          maxLength={5}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500 uppercase"
        />
        <button onClick={handleAdd} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
          <Plus size={14} className="text-white" />
        </button>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {watchlist.map((sym) => (
          <div
            key={sym}
            onClick={() => onSelect(sym)}
            className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${selected === sym ? "bg-blue-600/20 border border-blue-500/30" : "hover:bg-slate-800 border border-transparent"}`}
          >
            <span className={`text-sm font-semibold ${selected === sym ? "text-blue-400" : "text-white"}`}>{sym}</span>
            <button
              onClick={(e) => { e.stopPropagation(); removeFromWatchlist(sym); }}
              className="text-slate-600 hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── News Feed ────────────────────────────────────────────────────────────────
function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNews().then((data) => {
      if (data && data.length > 0) setNews(data);
      else setNews([
        { headline: "Markets Rally Amid Fed Policy Update", source: "Bloomberg", datetime: Date.now() - 120000, url: "#" },
        { headline: "Analysts Upgrade Apple to Strong Buy", source: "Reuters", datetime: Date.now() - 900000, url: "#" },
        { headline: "S&P 500 Hits New All-Time High", source: "CNBC", datetime: Date.now() - 3600000, url: "#" },
        { headline: "Tech Earnings Season Kicks Off Strong", source: "WSJ", datetime: Date.now() - 7200000, url: "#" },
      ]);
      setLoading(false);
    });
  }, []);

  const timeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts * (ts < 1e12 ? 1000 : 1)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="font-semibold text-white text-sm uppercase tracking-widest flex items-center gap-2 mb-4">
        <Newspaper size={14} className="text-slate-400" /> Market News
      </h3>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-3/4 mb-2" />
              <div className="h-2 bg-slate-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-b border-slate-800 last:border-0 pb-3 last:pb-0 hover:bg-slate-800/40 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
            >
              <p className="text-sm font-medium text-slate-200 leading-snug">{item.headline}</p>
              <p className="text-xs text-slate-500 mt-1">{item.source} · {timeAgo(item.datetime)}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Upgrade Banner ───────────────────────────────────────────────────────────
function UpgradeBanner() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Payment unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
        <p className="text-xs text-slate-400 mt-0.5">Real-time data, alerts & advanced analytics</p>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <CreditCard size={14} />
        {loading ? "Redirecting…" : "$19 / mo"}
      </button>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function Dashboard() {
  const { user } = useUser();
  const { portfolio, balance } = useStore();
  const [symbol, setSymbol] = useState("AAPL");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "portfolio" | "watchlist">("dashboard");

  const portfolioValue = portfolio.reduce((acc, s) => acc + s.price * s.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) { setSymbol(search.trim().toUpperCase()); setSearch(""); }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "portfolio", label: "Portfolio", icon: Wallet },
    { id: "watchlist", label: "Watchlist", icon: Star },
  ] as const;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 72 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-slate-900 border-r border-slate-800 flex flex-col py-5 overflow-hidden shrink-0"
      >
        <div className="flex items-center justify-between px-4 mb-8">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2">
                <TrendingUp className="text-blue-500 shrink-0" size={20} />
                <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">StockPro</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors shrink-0">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 flex-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium
                ${activeTab === id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <Icon size={17} className="shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-nowrap">{label}</motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        <div className="px-4 border-t border-slate-800 pt-4 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-sm font-semibold text-white truncate max-w-[120px]">
                  {user?.firstName || "Trader"}
                </p>
                <p className="text-xs text-emerald-400">Pro Plan</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900/60 backdrop-blur border-b border-slate-800 px-6 py-3 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white capitalize">{activeTab}</h2>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              placeholder="Search symbol…"
              maxLength={5}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm w-56
                focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500 uppercase"
            />
          </form>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {activeTab === "dashboard" && (
            <div className="space-y-5 max-w-7xl mx-auto">
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Balance" value={`$${balance.toLocaleString()}`} sub="Available cash" />
                <StatCard label="Portfolio" value={`$${portfolioValue.toLocaleString()}`} sub={`${portfolio.length} positions`} />
                <StatCard label="Day P/L" value="+2.4%" positive={true} sub="vs yesterday" />
                <StatCard label="All-time" value="+18.7%" positive={true} sub="since inception" />
              </div>

              {/* Upgrade */}
              <UpgradeBanner />

              {/* Chart + Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="lg:col-span-3 space-y-5">
                  <TechnicalChart symbol={symbol} />
                  <AnalystRatings />
                </div>
                <div className="space-y-5">
                  <WatchlistPanel onSelect={setSymbol} selected={symbol} />
                  <NewsFeed />
                </div>
              </div>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="max-w-3xl mx-auto space-y-4">
              <h3 className="text-white font-bold text-lg">Your Positions</h3>
              {portfolio.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
                  <BarChart2 size={36} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No positions yet. Search for a symbol to get started.</p>
                </div>
              ) : (
                portfolio.map((s) => (
                  <div key={s.symbol} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{s.symbol}</p>
                      <p className="text-xs text-slate-400">{s.quantity} shares @ ${s.price}</p>
                    </div>
                    <p className="font-semibold text-white">${(s.price * s.quantity).toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "watchlist" && (
            <div className="max-w-lg mx-auto">
              <WatchlistPanel onSelect={(s) => { setSymbol(s); setActiveTab("dashboard"); }} selected={symbol} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <TrendingUp className="text-blue-500 animate-pulse" size={36} />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <TrendingUp className="text-blue-500" size={32} />
          <h1 className="text-4xl font-bold text-white tracking-tight">StockPro</h1>
        </div>
        <p className="text-slate-400">Professional stock monitoring & portfolio tracking</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm">
        <SignIn routing="hash" appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white w-full rounded-xl",
            card: "bg-transparent shadow-none",
            headerTitle: "text-white font-bold",
            headerSubtitle: "text-slate-400",
            formFieldInput: "bg-slate-800 border-slate-700 text-white rounded-xl",
            footerActionLink: "text-blue-400 hover:text-blue-300",
          }
        }} />
      </div>
    </div>
  );

  return <Dashboard />;
}
