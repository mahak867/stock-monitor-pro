import axios from 'axios';

const KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo';
const BASE = 'https://finnhub.io/api/v1';
const AV_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';

// ---- Types ----
export interface Quote {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number;
}
export interface Candle {
  t: number; o: number; h: number; l: number; c: number; v: number;
}
export interface Fundamentals {
  name: string; ticker: string; exchange: string; ipo: string;
  marketCapitalization: number; shareOutstanding: number;
  logo: string; weburl: string; industry: string; country: string;
}
export interface Metrics {
  peNormalizedAnnual?: number; epsNormalizedAnnual?: number;
  revenueGrowthAnnual?: number; grossMarginAnnual?: number;
  weekHigh52?: number; weekLow52?: number; beta?: number;
  dividendYieldIndicatedAnnual?: number; marketCapitalization?: number;
  roaRfy?: number; roeRfy?: number; currentRatioAnnual?: number;
  debtEquityAnnual?: number; pbAnnual?: number;
}
export interface NewsItem {
  id: number; headline: string; source: string;
  datetime: number; url: string; summary: string; image: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
}
export interface SearchResult { symbol: string; description: string; type: string; }
export interface EarningsItem { date: string; epsActual: number | null; epsEstimate: number | null; }

// ---- Sentiment scoring ----
function scoreSentiment(text: string): { label: 'positive' | 'negative' | 'neutral'; score: number } {
  const posWords = ['rally', 'surge', 'gain', 'rise', 'beat', 'upgrade', 'strong', 'bull', 'growth', 'record', 'high', 'profit', 'soar', 'jump', 'boom'];
  const negWords = ['fall', 'drop', 'crash', 'loss', 'miss', 'downgrade', 'weak', 'bear', 'decline', 'low', 'risk', 'warn', 'plunge', 'recession', 'layoff'];
  const lower = text.toLowerCase();
  let score = 0;
  posWords.forEach(w => { if (lower.includes(w)) score += 1; });
  negWords.forEach(w => { if (lower.includes(w)) score -= 1; });
  return { label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral', score };
}

// ---- Mock data fallbacks ----
const MOCK_PRICES: Record<string, number> = {
  AAPL: 171, MSFT: 382, GOOGL: 176, TSLA: 252, NVDA: 908, AMZN: 186,
  META: 521, NFLX: 632, BTC: 67400, ETH: 3520, SOL: 148, BNB: 412,
  XRP: 0.52, ADA: 0.44, 'NSE:RELIANCE': 2941, 'NSE:TCS': 3821,
  'NSE:HDFCBANK': 1641, 'NSE:INFY': 1421, 'NSE:ICICIBANK': 1041,
};

export function generateMockQuote(symbol: string): Quote {
  const base = MOCK_PRICES[symbol] || 150;
  const c = parseFloat((base + (Math.random() - 0.5) * base * 0.015).toFixed(2));
  const pc = parseFloat((base * (1 - (Math.random() * 0.01))).toFixed(2));
  const d = parseFloat((c - pc).toFixed(2));
  const dp = parseFloat(((d / pc) * 100).toFixed(2));
  return { c, d, dp, h: parseFloat((c * 1.008).toFixed(2)), l: parseFloat((c * 0.992).toFixed(2)), o: parseFloat((pc * 1.002).toFixed(2)), pc };
}

export function generateMockCandles(base: number, days = 90): Candle[] {
  let price = base;
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: days }, (_, i) => {
    const o = price;
    const change = (Math.random() - 0.47) * price * 0.022;
    const c = Math.max(0.01, parseFloat((o + change).toFixed(2)));
    const h = parseFloat((Math.max(o, c) * (1 + Math.random() * 0.008)).toFixed(2));
    const l = parseFloat((Math.min(o, c) * (1 - Math.random() * 0.008)).toFixed(2));
    price = c;
    return { t: now - (days - i) * 86400, o, h, l, c, v: Math.floor(Math.random() * 8000000 + 1000000) };
  });
}

// ---- API calls ----
export const getQuote = async (symbol: string): Promise<Quote> => {
  try {
    const r = await axios.get(`${BASE}/quote?symbol=${symbol}&token=${KEY}`, { timeout: 5000 });
    if (r.data && typeof r.data.c === 'number' && r.data.c > 0) return r.data;
    return generateMockQuote(symbol);
  } catch { return generateMockQuote(symbol); }
};

export const getCandles = async (symbol: string, resolution = 'D', days = 90): Promise<Candle[]> => {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 86400;
    const r = await axios.get(`${BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${KEY}`, { timeout: 5000 });
    if (r.data?.s === 'ok' && r.data.t?.length > 0) {
      return r.data.t.map((t: number, i: number) => ({
        t, o: r.data.o[i], h: r.data.h[i], l: r.data.l[i], c: r.data.c[i], v: r.data.v[i],
      }));
    }
    return generateMockCandles(MOCK_PRICES[symbol] || 150, days);
  } catch { return generateMockCandles(MOCK_PRICES[symbol] || 150, days); }
};

export const getFundamentals = async (symbol: string): Promise<Fundamentals | null> => {
  try {
    const r = await axios.get(`${BASE}/stock/profile2?symbol=${symbol}&token=${KEY}`, { timeout: 5000 });
    return r.data?.name ? r.data : null;
  } catch { return null; }
};

export const getMetrics = async (symbol: string): Promise<Metrics | null> => {
  try {
    const r = await axios.get(`${BASE}/stock/metric?symbol=${symbol}&metric=all&token=${KEY}`, { timeout: 5000 });
    const m = r.data?.metric || {};
    return {
      peNormalizedAnnual: m.peNormalizedAnnual, epsNormalizedAnnual: m.epsNormalizedAnnual,
      revenueGrowthAnnual: m.revenueGrowthAnnual, grossMarginAnnual: m.grossMarginAnnual,
      weekHigh52: m['52WeekHigh'], weekLow52: m['52WeekLow'], beta: m.beta,
      dividendYieldIndicatedAnnual: m.dividendYieldIndicatedAnnual,
      marketCapitalization: m.marketCapitalization, roaRfy: m.roaRfy, roeRfy: m.roeRfy,
      currentRatioAnnual: m.currentRatioAnnual, debtEquityAnnual: m.debtEquityAnnual, pbAnnual: m.pbAnnual,
    };
  } catch { return null; }
};

export const getNews = async (symbol?: string): Promise<NewsItem[]> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const url = symbol
      ? `${BASE}/company-news?symbol=${symbol}&from=${weekAgo}&to=${today}&token=${KEY}`
      : `${BASE}/news?category=general&token=${KEY}`;
    const r = await axios.get(url, { timeout: 5000 });
    if (!r.data?.length) return getMockNews();
    return r.data.slice(0, 12).map((n: NewsItem) => {
      const s = scoreSentiment(n.headline);
      return { ...n, sentiment: s.label, sentimentScore: s.score };
    });
  } catch { return getMockNews(); }
};

function getMockNews(): NewsItem[] {
  return [
    { id: 1, headline: 'Fed signals rate pause as inflation data cools', source: 'Reuters', datetime: Date.now() / 1000 - 3600, url: '#', summary: '', image: '', sentiment: 'positive', sentimentScore: 1 },
    { id: 2, headline: 'NVIDIA reports record quarterly earnings', source: 'Bloomberg', datetime: Date.now() / 1000 - 7200, url: '#', summary: '', image: '', sentiment: 'positive', sentimentScore: 2 },
    { id: 3, headline: 'Tech sector faces renewed selling pressure', source: 'CNBC', datetime: Date.now() / 1000 - 14400, url: '#', summary: '', image: '', sentiment: 'negative', sentimentScore: -1 },
    { id: 4, headline: 'Nifty 50 hits new high on FII inflows', source: 'Economic Times', datetime: Date.now() / 1000 - 18000, url: '#', summary: '', image: '', sentiment: 'positive', sentimentScore: 1 },
    { id: 5, headline: 'Bitcoin consolidates near resistance level', source: 'CoinDesk', datetime: Date.now() / 1000 - 21600, url: '#', summary: '', image: '', sentiment: 'neutral', sentimentScore: 0 },
  ];
}

export const searchSymbol = async (q: string): Promise<SearchResult[]> => {
  try {
    const r = await axios.get(`${BASE}/search?q=${q}&token=${KEY}`, { timeout: 5000 });
    return (r.data?.result || []).slice(0, 8);
  } catch { return []; }
};

export const getEarnings = async (symbol: string): Promise<EarningsItem[]> => {
  try {
    const r = await axios.get(`${BASE}/stock/earnings?symbol=${symbol}&limit=8&token=${KEY}`, { timeout: 5000 });
    return (r.data || []).map((e: EarningsItem) => ({
      date: e.date, epsActual: e.epsActual, epsEstimate: e.epsEstimate,
    }));
  } catch { return []; }
};

const CRYPTO_MAP: Record<string, string> = {
  BTC: 'BINANCE:BTCUSDT', ETH: 'BINANCE:ETHUSDT', SOL: 'BINANCE:SOLUSDT',
  BNB: 'BINANCE:BNBUSDT', XRP: 'BINANCE:XRPUSDT', ADA: 'BINANCE:ADAUSDT',
  DOGE: 'BINANCE:DOGEUSDT', MATIC: 'BINANCE:MATICUSDT',
};

export const getCryptoQuote = async (symbol: string): Promise<Quote> => {
  try {
    const mapped = CRYPTO_MAP[symbol] || 'BINANCE:' + symbol + 'USDT';
    const r = await axios.get(`${BASE}/quote?symbol=${mapped}&token=${KEY}`, { timeout: 5000 });
    if (r.data?.c > 0) return r.data;
    return generateMockQuote(symbol);
  } catch { return generateMockQuote(symbol); }
};

// ---- Claude AI analysis ----
export const getClaudeAnalysis = async (apiKey: string, symbol: string, quote: Quote, metrics: Metrics | null): Promise<string> => {
  try {
    const prompt = `You are a professional stock analyst. Analyze ${symbol} with this data:
Current Price: $${(quote.c ?? 0).toFixed(2)}
Day Change: ${(quote.dp ?? 0).toFixed(2)}%
52W High: $${(metrics?.weekHigh52 ?? 0).toFixed(2)} | 52W Low: $${(metrics?.weekLow52 ?? 0).toFixed(2)}
P/E Ratio: ${metrics?.peNormalizedAnnual?.toFixed(1) ?? 'N/A'}
EPS: ${metrics?.epsNormalizedAnnual?.toFixed(2) ?? 'N/A'}
Beta: ${metrics?.beta?.toFixed(2) ?? 'N/A'}
ROE: ${metrics?.roeRfy?.toFixed(1) ?? 'N/A'}%

Provide a concise 3-paragraph analysis covering: (1) current momentum and technical outlook, (2) fundamental valuation, (3) key risks and opportunities. Keep it under 200 words total. Use plain text, no markdown.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || 'Analysis unavailable.';
  } catch { return 'Analysis unavailable. Check your API key.'; }
};

export const INDIAN_STOCKS = [
  { symbol: 'NSE:RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'NSE:TCS', name: 'Tata Consultancy', sector: 'Technology' },
  { symbol: 'NSE:HDFCBANK', name: 'HDFC Bank', sector: 'Finance' },
  { symbol: 'NSE:INFY', name: 'Infosys', sector: 'Technology' },
  { symbol: 'NSE:ICICIBANK', name: 'ICICI Bank', sector: 'Finance' },
  { symbol: 'NSE:HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' },
  { symbol: 'NSE:BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance' },
  { symbol: 'NSE:WIPRO', name: 'Wipro', sector: 'Technology' },
  { symbol: 'NSE:ADANIENT', name: 'Adani Enterprises', sector: 'Conglomerate' },
  { symbol: 'NSE:TATAMOTORS', name: 'Tata Motors', sector: 'Auto' },
];

export const US_STOCKS = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Semiconductors' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Auto' },
  { symbol: 'META', name: 'Meta', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix', sector: 'Media' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Finance' },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finance' },
];

export const CRYPTO_LIST = [
  { symbol: 'BTC', name: 'Bitcoin' }, { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' }, { symbol: 'BNB', name: 'BNB' },
  { symbol: 'XRP', name: 'XRP' }, { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' }, { symbol: 'MATIC', name: 'Polygon' },
];

