import axios from 'axios';

const KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo';
const BASE = 'https://finnhub.io/api/v1';

// Quote
export interface Quote {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number;
}
export const getQuote = async (symbol: string): Promise<Quote | null> => {
  try {
    const r = await axios.get(`${BASE}/quote?symbol=${symbol}&token=${KEY}`);
    if (r.data && typeof r.data.c === 'number' && r.data.c > 0) return r.data;
    return generateMockQuote(symbol);
  } catch { return generateMockQuote(symbol); }
};

function generateMockQuote(symbol: string): Quote {
  const bases: Record<string, number> = {
    AAPL: 171, MSFT: 380, GOOGL: 175, TSLA: 251, NVDA: 905,
    AMZN: 185, META: 520, NFLX: 630, BTC: 67000, ETH: 3500,
  };
  const base = bases[symbol] || 150;
  const c = parseFloat((base + (Math.random() - 0.5) * base * 0.01).toFixed(2));
  const pc = parseFloat((base * 0.99).toFixed(2));
  const d = parseFloat((c - pc).toFixed(2));
  const dp = parseFloat(((d / pc) * 100).toFixed(2));
  return { c, d, dp, h: c * 1.005, l: c * 0.995, o: pc, pc };
}

// Candles (OHLC)
export interface Candle {
  t: number; o: number; h: number; l: number; c: number; v: number;
}
export const getCandles = async (
  symbol: string,
  resolution = 'D',
  days = 90
): Promise<Candle[]> => {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 86400;
    const r = await axios.get(
      `${BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${KEY}`
    );
    if (r.data.s !== 'ok') return [];
    return r.data.t.map((t: number, i: number) => ({
      t, o: r.data.o[i], h: r.data.h[i], l: r.data.l[i], c: r.data.c[i], v: r.data.v[i],
    }));
  } catch { return []; }
};

// Company Profile
export interface Fundamentals {
  name: string; ticker: string; exchange: string; ipo: string;
  marketCapitalization: number; shareOutstanding: number;
  logo: string; weburl: string; industry: string;
}
export const getFundamentals = async (symbol: string): Promise<Fundamentals | null> => {
  try {
    const r = await axios.get(`${BASE}/stock/profile2?symbol=${symbol}&token=${KEY}`);
    return r.data;
  } catch { return null; }
};

// Financial Metrics
export interface Metrics {
  peNormalizedAnnual?: number;
  epsNormalizedAnnual?: number;
  revenueGrowthAnnual?: number;
  grossMarginAnnual?: number;
  weekHigh52?: number;
  weekLow52?: number;
  beta?: number;
  dividendYieldIndicatedAnnual?: number;
  marketCapitalization?: number;
  roaRfy?: number;
  roeRfy?: number;
}
export const getMetrics = async (symbol: string): Promise<Metrics | null> => {
  try {
    const r = await axios.get(`${BASE}/stock/metric?symbol=${symbol}&metric=all&token=${KEY}`);
    const m = r.data.metric || {};
    return {
      peNormalizedAnnual: m.peNormalizedAnnual,
      epsNormalizedAnnual: m.epsNormalizedAnnual,
      revenueGrowthAnnual: m.revenueGrowthAnnual,
      grossMarginAnnual: m.grossMarginAnnual,
      weekHigh52: m['52WeekHigh'],
      weekLow52: m['52WeekLow'],
      beta: m.beta,
      dividendYieldIndicatedAnnual: m.dividendYieldIndicatedAnnual,
      marketCapitalization: m.marketCapitalization,
      roaRfy: m.roaRfy,
      roeRfy: m.roeRfy,
    };
  } catch { return null; }
};

// News with sentiment
export interface NewsItem {
  id: number; headline: string; source: string;
  datetime: number; url: string; summary: string; image: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

function scoreSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const pos = /rally|surge|gain|rise|beat|upgrade|strong|bull|growth|record|high/i;
  const neg = /fall|drop|crash|loss|miss|downgrade|weak|bear|decline|low|risk|warn/i;
  if (pos.test(text)) return 'positive';
  if (neg.test(text)) return 'negative';
  return 'neutral';
}

export const getNews = async (symbol?: string): Promise<NewsItem[]> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const url = symbol
      ? `${BASE}/company-news?symbol=${symbol}&from=${weekAgo}&to=${today}&token=${KEY}`
      : `${BASE}/news?category=general&token=${KEY}`;
    const r = await axios.get(url);
    return (r.data || []).slice(0, 10).map((n: NewsItem) => ({
      ...n,
      sentiment: scoreSentiment(n.headline),
    }));
  } catch { return []; }
};

// Symbol search
export interface SearchResult { symbol: string; description: string; type: string; }
export const searchSymbol = async (q: string): Promise<SearchResult[]> => {
  try {
    const r = await axios.get(`${BASE}/search?q=${q}&token=${KEY}`);
    return (r.data.result || []).slice(0, 8);
  } catch { return []; }
};

// Crypto quotes
export interface CryptoQuote { c: number; d: number; dp: number; }
const CRYPTO_MAP: Record<string, string> = {
  BTC: 'BINANCE:BTCUSDT', ETH: 'BINANCE:ETHUSDT',
  SOL: 'BINANCE:SOLUSDT', BNB: 'BINANCE:BNBUSDT',
  XRP: 'BINANCE:XRPUSDT', ADA: 'BINANCE:ADAUSDT',
};
export const getCryptoQuote = async (symbol: string): Promise<CryptoQuote | null> => {
  try {
    const mapped = CRYPTO_MAP[symbol] || 'BINANCE:' + symbol + 'USDT';
    const r = await axios.get(`${BASE}/quote?symbol=${mapped}&token=${KEY}`);
    return r.data;
  } catch { return null; }
};

// Indian market stocks
export const INDIAN_STOCKS = [
  { symbol: 'NSE:RELIANCE', name: 'Reliance Industries' },
  { symbol: 'NSE:TCS', name: 'Tata Consultancy' },
  { symbol: 'NSE:HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'NSE:INFY', name: 'Infosys' },
  { symbol: 'NSE:ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'NSE:HINDUNILVR', name: 'Hindustan Unilever' },
  { symbol: 'NSE:BAJFINANCE', name: 'Bajaj Finance' },
  { symbol: 'NSE:WIPRO', name: 'Wipro' },
];

export const US_STOCKS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'NFLX', name: 'Netflix' },
];

export const CRYPTO_LIST = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
];

// Mock candle fallback
export const generateMockCandles = (base: number, days = 90): Candle[] => {
  let price = base;
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: days }, (_, i) => {
    const o = price;
    const change = (Math.random() - 0.48) * price * 0.02;
    const c = parseFloat((o + change).toFixed(2));
    const h = parseFloat((Math.max(o, c) * (1 + Math.random() * 0.01)).toFixed(2));
    const l = parseFloat((Math.min(o, c) * (1 - Math.random() * 0.01)).toFixed(2));
    price = c;
    return { t: now - (days - i) * 86400, o, h, l, c, v: Math.floor(Math.random() * 5000000) };
  });
};

