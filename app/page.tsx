"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton, SignIn } from "@clerk/nextjs";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line, Bar
} from "recharts";
import { 
  TrendingUp, TrendingDown, Search, Menu, X, Bell, Wallet, 
  LayoutDashboard, Settings, Newspaper, BarChart2, Star, Activity
} from "lucide-react";
import { motion } from "framer-motion";

// --- CONFIGURATION ---
// Uses demo data if no key provided
const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "demo";

// --- MOCK DATA GENERATOR (Real-Time Simulation) ---
const generateData = (base = 100) => {
  const data = [];
  let price = base;
  for (let i = 0; i < 50; i++) {
    const change = (Math.random() - 0.5) * 2;
    price += change;
    data.push({
      time: `${i}m`,
      price: parseFloat(price.toFixed(2)),
      sma: parseFloat((price + 0.5).toFixed(2)),
      ema: parseFloat((price - 0.2).toFixed(2)),
      volume: Math.floor(Math.random() * 10000)
    });
  }
  return data;
};

// --- COMPONENTS ---

function TechnicalChart({ symbol }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Set initial data based on symbol
    const basePrice = symbol === "AAPL" ? 170 : symbol === "TSLA" ? 250 : 150;
    setData(generateData(basePrice));

    // Simulate Real-Time Updates
    const interval = setInterval(() => {
      setData(prev => {
        const lastPrice = prev.length > 0 ? prev[prev.length - 1].price : 100;
        const newPrice = lastPrice + (Math.random() - 0.5);
        const newPoint = {
          time: `${prev.length}m`,
          price: parseFloat(newPrice.toFixed(2)),
          sma: parseFloat((newPrice + 0.5).toFixed(2)),
          ema: parseFloat((newPrice - 0.2).toFixed(2)),
          volume: Math.floor(Math.random() * 10000)
        };
        // Keep last 50 points
        return [...prev.slice(-49), newPoint];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 col-span-2">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-lg text-white">{symbol} Chart</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1"><Activity size={12}/> Live Feed</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">SMA</span>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">EMA</span>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis yAxisId="left" stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
            <YAxis yAxisId="right" orientation="right" stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area yAxisId="left" type="monotone" dataKey="price" stroke="#2563eb" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="sma" stroke="#60a5fa" dot={false} strokeWidth={1} />
            <Line yAxisId="left" type="monotone" dataKey="ema" stroke="#a855f7" dot={false} strokeWidth={1} />
            <Bar yAxisId="right" dataKey="volume" fill="#334155" barSize={4} opacity={0.5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function NewsFeed() {
  const news = [
    { title: "Markets Rally Amid Fed Policy Update", source: "Bloomberg", time: "2m ago" },
    { title: "Analysts Upgrade Apple to Strong Buy", source: "Reuters", time: "15m ago" },
    { title: "Bitcoin Surges Past $65k Resistance", source: "CoinDesk", time: "1h ago" },
  ];

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 h-full">
      <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><Newspaper size={18}/> News</h3>
      <div className="space-y-4">
        {news.map((item, i) => (
          <div key={i} className="border-b border-slate-800 pb-3 cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg">
            <h4 className="text-sm font-medium text-slate-200">{item.title}</h4>
            <p className="text-xs text-slate-500 mt-1">{item.source} • {item.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useUser();
  const [symbol, setSymbol] = useState("AAPL");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search) setSymbol(search.toUpperCase());
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 240 : 80 }}
        className="bg-slate-900 border-r border-slate-800 flex flex-col p-4"
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
          {sidebarOpen && <h1 className="font-bold text-xl text-white flex items-center gap-2"><TrendingUp className="text-blue-500"/> StockPro</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            {sidebarOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
        
        <nav className="space-y-1 flex-1">
          <button className="flex items-center gap-3 w-full p-3 bg-blue-600 text-white rounded-lg"><LayoutDashboard size={18}/> {sidebarOpen && "Dashboard"}</button>
          <button className="flex items-center gap-3 w-full p-3 text-slate-400 hover:bg-slate-800 rounded-lg"><BarChart2 size={18}/> {sidebarOpen && "Markets"}</button>
          <button className="flex items-center gap-3 w-full p-3 text-slate-400 hover:bg-slate-800 rounded-lg"><Wallet size={18}/> {sidebarOpen && "Portfolio"}</button>
          <button className="flex items-center gap-3 w-full p-3 text-slate-400 hover:bg-slate-800 rounded-lg"><Star size={18}/> {sidebarOpen && "Watchlist"}</button>
        </nav>

        <div className="border-t border-slate-700 pt-4 flex items-center gap-3">
          <UserButton afterSignOutUrl="/"/>
          {sidebarOpen && <div><p className="text-sm font-semibold text-white">{user?.firstName || "User"}</p><p className="text-xs text-green-400">Pro Plan</p></div>}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-900/50 border-b border-slate-800 px-6 py-3 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white">Dashboard</h2>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4"/>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search (TSLA, AAPL)"
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none text-white"
            />
          </form>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"><p className="text-xs text-slate-500 mb-1">Portfolio</p><h3 className="text-2xl font-bold text-white">$125,430</h3></div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"><p className="text-xs text-slate-500 mb-1">Day P/L</p><h3 className="text-2xl font-bold text-green-400">+2.4%</h3></div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"><p className="text-xs text-slate-500 mb-1">Positions</p><h3 className="text-2xl font-bold text-white">12</h3></div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"><p className="text-xs text-slate-500 mb-1">Watchlist</p><h3 className="text-2xl font-bold text-white">24</h3></div>
          </div>

          {/* Charts & News */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 grid grid-cols-1 gap-4">
                <TechnicalChart symbol={symbol} />
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <h3 className="font-bold text-lg text-white mb-4">Analyst Ratings</h3>
                    <div className="flex h-4 rounded-full overflow-hidden">
                        <div className="w-[60%] bg-green-500"></div>
                        <div className="w-[30%] bg-yellow-500"></div>
                        <div className="w-[10%] bg-red-500"></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                        <span>Buy 60%</span><span>Hold 30%</span><span>Sell 10%</span>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1"><NewsFeed /></div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">StockPro</h1>
          <p className="text-slate-400">Sign in to access dashboard</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md">
          <SignIn routing="hash" appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white w-full",
              card: "bg-transparent",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-400",
              formFieldInput: "bg-slate-800 border-slate-700 text-white",
            }
          }} />
        </div>
      </div>
    );
  }

  return <Dashboard />;
}