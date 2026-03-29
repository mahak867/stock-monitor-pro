import axios from 'axios';

const KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo';
const BASE = 'https://finnhub.io/api/v1';

// ── Quote ─────────────────────────────────────────────────────────────────────
export interface Quote {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number;
}
export const getQuote = async (symbol: string): Promise<Quote | null> => {
  try {
    const r = await axios.get(`${BASE}/quote?symbol=${symbol}&token=${KEY}`);
    return r.data;
  } catch { return null; }
};

// ── Candles (OHLC) ────────────────────────────────────────────────────────────
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

// ── Company Fundamentals ──────────────────────────────────────────────────────
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

// ── Financial Metrics ─────────────────────────────────────────────────────────
export interface Metrics {
  peNormalizedAnnual?: number; epsNormalizedAnnual?: number;
  revenueGrowthAnnual?: number; grossMarginAnnual?: number;
  52WeekHigh?: number; 52WeekLow?: number; beta?: number;
  dividendYieldIndicatedAnnual?: number; marketCapitalization?: number;
  roaRfy?: number; roeRfy?: number;
}
export const getMetrics = async (symbol: string): Promise<Metrics | null> => {
  try {
    const r = await axios.get(`${BASE}/stock/metric?symbol=${symbol}&metric=all&token=${KEY}`);
    return r.data.metric || null;
  } catch { return null; }
};

// ── News ──────────────────────────────────────────────────────────────────────
export interface NewsItem {
  id: number; headline: string; source: string;
  datetime: number; url: string; summary: string; image: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}
export const getNews = async (symbol?: string): Promise<NewsItem[]> => {
  try {
    const url = symbol
      ? `${BASE}/company-news?symbol=${symbol}&from=${new Date(Date.now()-7*86400000).toISOString().slice(0,10)}&to=${new Date().toISOString().slice(0,10)}&token=${KEY}`
      : `${BASE}/news?category=general&token=${KEY}`;
    const r = await axios.get(url);
    const items: NewsItem[] = (r.data || []).slice(0, 10).map((n: NewsItem) => ({
      ...n,
      sentiment: scoreSentiment(n.headline),
    }));
    return items;
  } catch { return []; }
};

function scoreSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const pos = /rally|surge|gain|rise|beat|upgrade|strong|bull|growth|record|high/i;
  const neg = /fall|drop|crash|loss|miss|downgrade|weak|bear|decline|low|risk|warn/i;
  if (pos.test(text)) return 'positive';
  if (neg.test(text)) return 'negative';
  return 'neutral';
}

// ── Search ────────────────────────────────────────────────────────────────────
export interface SearchResult { symbol: string; description: string; type: string; }
export const searchSymbol = async (q: string): Promise<SearchResult[]> => {
  try {
    const r = await axios.get(`${BASE}/search?q=${q}&token=${KEY}`);
    return (r.data.result || []).slice(0, 8);
  } catch { return []; }
};

// ── Crypto ────────────────────────────────────────────────────────────────────
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

// ── Indian Markets (NSE symbols via Finnhub) ──────────────────────────────────
export const INDIAN_STOCKS = [
  { symbol: 'NSE:RELIANCE', name: 'Reliance Industries' },
  { symbol: 'NSE:TCS', name: 'Tata Consultancy Services' },
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

// ── Mock OHLC fallback ────────────────────────────────────────────────────────
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
