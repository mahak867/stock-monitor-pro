import axios from 'axios';

const FKEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo';
const BASE = 'https://finnhub.io/api/v1';

export interface Quote {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t?: number;
}
export interface Candle {
  t: number; o: number; h: number; l: number; c: number; v: number;
}
export interface Profile {
  name: string; ticker: string; exchange: string; ipo: string;
  marketCapitalization: number; shareOutstanding: number;
  logo: string; weburl: string; finnhubIndustry: string; country: string;
}
export interface Metrics {
  peNormalizedAnnual?: number; epsNormalizedAnnual?: number;
  revenueGrowthAnnual?: number; grossMarginAnnual?: number;
  weekHigh52?: number; weekLow52?: number; beta?: number;
  dividendYieldIndicatedAnnual?: number; marketCapitalization?: number;
  roaRfy?: number; roeRfy?: number; pbAnnual?: number; psAnnual?: number;
  currentRatioAnnual?: number; debtEquityAnnual?: number;
  revenueGrowthQuarterlyYoy?: number; epsGrowthTTMYoy?: number;
}
export interface NewsItem {
  id: number; headline: string; source: string;
  datetime: number; url: string; summary: string; image: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}
export interface SearchResult { symbol: string; description: string; type: string; }
export interface EarningsItem { date: string; epsActual: number | null; epsEstimate: number | null; quarter: number; year: number; }
export interface RecommendationItem { buy: number; hold: number; sell: number; strongBuy: number; strongSell: number; period: string; }

// Sentiment
function sentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const pos = /rally|surge|gain|rise|beat|upgrade|strong|bull|growth|record|profit|soar|jump|boost|optimistic/i;
  const neg = /fall|drop|crash|loss|miss|downgrade|weak|bear|decline|risk|warn|plunge|layoff|recession|concern/i;
  if (pos.test(text)) return 'positive';
  if (neg.test(text)) return 'negative';
  return 'neutral';
}

// Safe number
export const safeN = (v: unknown): number => {
  if (v == null || typeof v !== 'number' || isNaN(v)) return 0;
  return v;
};

// Mock prices for fallback
const MOCK: Record<string, number> = {
  AAPL:171, MSFT:382, GOOGL:176, TSLA:251, NVDA:908, AMZN:186,
  META:521, NFLX:632, JPM:198, BRK_B:415, 'BRK.B':415,
  // Index ETFs
  SPY:520, QQQ:445, DIA:395,
  BTC:67400, ETH:3520, SOL:148, BNB:412, XRP:0.52, ADA:0.44, DOGE:0.09,
  'NSE:RELIANCE':2941,'NSE:TCS':3821,'NSE:HDFCBANK':1641,
  'NSE:INFY':1421,'NSE:ICICIBANK':1041,'NSE:WIPRO':462,
  'NSE:NIFTY50':22500,
};

export function mockQuote(symbol: string): Quote {
  const base = MOCK[symbol] || MOCK[symbol.replace('NSE:','')] || 150;
  const c = parseFloat((base * (1 + (Math.random()-0.5)*0.012)).toFixed(2));
  const pc = parseFloat((base * (1 - Math.random()*0.008)).toFixed(2));
  const d = parseFloat((c-pc).toFixed(2));
  const dp = parseFloat(((d/pc)*100).toFixed(2));
  return { c, d, dp, h:parseFloat((c*1.007).toFixed(2)), l:parseFloat((c*0.993).toFixed(2)), o:parseFloat((pc*1.003).toFixed(2)), pc, t:Math.floor(Date.now()/1000) };
}

export function mockCandles(symbol: string, days=90): Candle[] {
  let p = MOCK[symbol] || 150;
  const now = Math.floor(Date.now()/1000);
  return Array.from({length:days},(_,i)=>{
    const o=p, ch=(Math.random()-0.47)*p*0.02, c=Math.max(0.01,parseFloat((o+ch).toFixed(2)));
    const h=parseFloat((Math.max(o,c)*(1+Math.random()*0.007)).toFixed(2));
    const l=parseFloat((Math.min(o,c)*(1-Math.random()*0.007)).toFixed(2));
    p=c;
    return {t:now-(days-i)*86400,o,h,l,c,v:Math.floor(Math.random()*8e6+5e5)};
  });
}

// API wrappers â€” always resolve, never throw
export const getQuote = async (sym: string): Promise<Quote> => {
  try {
    const r = await axios.get(`${BASE}/quote?symbol=${sym}&token=${FKEY}`,{timeout:5000});
    if (r.data?.c > 0) return r.data;
    return mockQuote(sym);
  } catch { return mockQuote(sym); }
};

export const getCandles = async (sym: string, res='D', days=365): Promise<Candle[]> => {
  try {
    const to=Math.floor(Date.now()/1000), from=to-days*86400;
    const r=await axios.get(`${BASE}/stock/candle?symbol=${sym}&resolution=${res}&from=${from}&to=${to}&token=${FKEY}`,{timeout:6000});
    if(r.data?.s==='ok'&&r.data.t?.length>5){
      return r.data.t.map((t:number,i:number)=>({t,o:r.data.o[i],h:r.data.h[i],l:r.data.l[i],c:r.data.c[i],v:r.data.v[i]}));
    }
    return mockCandles(sym,days);
  } catch { return mockCandles(sym,days); }
};

export const getProfile = async (sym: string): Promise<Profile|null> => {
  try {
    const r=await axios.get(`${BASE}/stock/profile2?symbol=${sym}&token=${FKEY}`,{timeout:5000});
    return r.data?.name ? r.data : null;
  } catch { return null; }
};

export const getMetrics = async (sym: string): Promise<Metrics|null> => {
  try {
    const r=await axios.get(`${BASE}/stock/metric?symbol=${sym}&metric=all&token=${FKEY}`,{timeout:5000});
    const m=r.data?.metric||{};
    return {
      peNormalizedAnnual:m.peNormalizedAnnual, epsNormalizedAnnual:m.epsNormalizedAnnual,
      revenueGrowthAnnual:m.revenueGrowthAnnual, grossMarginAnnual:m.grossMarginAnnual,
      weekHigh52:m['52WeekHigh'], weekLow52:m['52WeekLow'], beta:m.beta,
      dividendYieldIndicatedAnnual:m.dividendYieldIndicatedAnnual,
      marketCapitalization:m.marketCapitalization, roaRfy:m.roaRfy, roeRfy:m.roeRfy,
      pbAnnual:m.pbAnnual, psAnnual:m.psAnnual, currentRatioAnnual:m.currentRatioAnnual,
      debtEquityAnnual:m.debtEquityAnnual,
      revenueGrowthQuarterlyYoy:m.revenueGrowthQuarterlyYoy, epsGrowthTTMYoy:m.epsGrowthTTMYoy,
    };
  } catch { return null; }
};

export const getEarnings = async (sym: string): Promise<EarningsItem[]> => {
  try {
    const r=await axios.get(`${BASE}/stock/earnings?symbol=${sym}&limit=8&token=${FKEY}`,{timeout:5000});
    return (r.data||[]).map((e:EarningsItem)=>({date:e.date,epsActual:e.epsActual,epsEstimate:e.epsEstimate,quarter:e.quarter,year:e.year}));
  } catch { return []; }
};

export const getRecommendations = async (sym: string): Promise<RecommendationItem[]> => {
  try {
    const r=await axios.get(`${BASE}/stock/recommendation?symbol=${sym}&token=${FKEY}`,{timeout:5000});
    return (r.data||[]).slice(0,4);
  } catch { return []; }
};

export const getNews = async (sym?: string): Promise<NewsItem[]> => {
  try {
    const today=new Date().toISOString().slice(0,10);
    const week=new Date(Date.now()-7*86400000).toISOString().slice(0,10);
    const url=sym
      ? `${BASE}/company-news?symbol=${sym}&from=${week}&to=${today}&token=${FKEY}`
      : `${BASE}/news?category=general&token=${FKEY}`;
    const r=await axios.get(url,{timeout:5000});
    if(!r.data?.length) return MOCK_NEWS;
    return r.data.slice(0,15).map((n:NewsItem)=>({...n,sentiment:sentiment(n.headline)}));
  } catch { return MOCK_NEWS; }
};

const MOCK_NEWS: NewsItem[] = [
  {id:1,headline:'Fed signals rate pause as inflation cools for third consecutive month',source:'Reuters',datetime:Date.now()/1000-3600,url:'#',summary:'',image:'',sentiment:'positive'},
  {id:2,headline:'NVIDIA posts record revenue driven by AI chip demand',source:'Bloomberg',datetime:Date.now()/1000-7200,url:'#',summary:'',image:'',sentiment:'positive'},
  {id:3,headline:'Tech sector faces renewed pressure on rising Treasury yields',source:'CNBC',datetime:Date.now()/1000-14400,url:'#',summary:'',image:'',sentiment:'negative'},
  {id:4,headline:'Nifty 50 scales new peak as FII inflows hit monthly high',source:'Economic Times',datetime:Date.now()/1000-18000,url:'#',summary:'',image:'',sentiment:'positive'},
  {id:5,headline:'Bitcoin holds above key support level ahead of halving',source:'CoinDesk',datetime:Date.now()/1000-21600,url:'#',summary:'',image:'',sentiment:'neutral'},
  {id:6,headline:'Apple reports iPhone sales slowdown in China market',source:'WSJ',datetime:Date.now()/1000-25200,url:'#',summary:'',image:'',sentiment:'negative'},
];

export const searchSymbol = async (q: string): Promise<SearchResult[]> => {
  try {
    const r=await axios.get(`${BASE}/search?q=${q}&token=${FKEY}`,{timeout:5000});
    return (r.data?.result||[]).slice(0,8);
  } catch { return []; }
};

const CMAP: Record<string,string> = {
  BTC:'BINANCE:BTCUSDT',ETH:'BINANCE:ETHUSDT',SOL:'BINANCE:SOLUSDT',
  BNB:'BINANCE:BNBUSDT',XRP:'BINANCE:XRPUSDT',ADA:'BINANCE:ADAUSDT',
  DOGE:'BINANCE:DOGEUSDT',MATIC:'BINANCE:MATICUSDT',
};
export const getCryptoQuote = async (sym: string): Promise<Quote> => {
  try {
    const mapped=CMAP[sym]||'BINANCE:'+sym+'USDT';
    const r=await axios.get(`${BASE}/quote?symbol=${mapped}&token=${FKEY}`,{timeout:5000});
    if(r.data?.c>0) return r.data;
    return mockQuote(sym);
  } catch { return mockQuote(sym); }
};

export const getClaudeAnalysis = async (key: string, sym: string, q: Quote, m: Metrics|null): Promise<string> => {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: sym,
        price: safeN(q.c),
        changePercent: safeN(q.dp),
        pe: m?.peNormalizedAnnual,
        eps: m?.epsNormalizedAnnual,
        beta: m?.beta,
        roe: m?.roeRfy,
        weekLow52: m?.weekLow52,
        weekHigh52: m?.weekHigh52,
        apiKey: key,
      }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || 'Analysis unavailable.';
    return data.analysis || 'Analysis unavailable.';
  } catch { return 'Unable to connect to Claude. Check your API key.'; }
};

export const US_STOCKS = [
  {symbol:'AAPL',name:'Apple',sector:'Technology'},
  {symbol:'MSFT',name:'Microsoft',sector:'Technology'},
  {symbol:'GOOGL',name:'Alphabet',sector:'Technology'},
  {symbol:'AMZN',name:'Amazon',sector:'Consumer'},
  {symbol:'NVDA',name:'NVIDIA',sector:'Semiconductors'},
  {symbol:'TSLA',name:'Tesla',sector:'Auto'},
  {symbol:'META',name:'Meta',sector:'Technology'},
  {symbol:'NFLX',name:'Netflix',sector:'Media'},
  {symbol:'JPM',name:'JPMorgan',sector:'Finance'},
  {symbol:'BRK.B',name:'Berkshire',sector:'Finance'},
];

export const INDIA_STOCKS = [
  {symbol:'NSE:RELIANCE',name:'Reliance Industries',sector:'Energy'},
  {symbol:'NSE:TCS',name:'TCS',sector:'Technology'},
  {symbol:'NSE:HDFCBANK',name:'HDFC Bank',sector:'Finance'},
  {symbol:'NSE:INFY',name:'Infosys',sector:'Technology'},
  {symbol:'NSE:ICICIBANK',name:'ICICI Bank',sector:'Finance'},
  {symbol:'NSE:WIPRO',name:'Wipro',sector:'Technology'},
  {symbol:'NSE:HINDUNILVR',name:'HUL',sector:'FMCG'},
  {symbol:'NSE:BAJFINANCE',name:'Bajaj Finance',sector:'Finance'},
  {symbol:'NSE:ADANIENT',name:'Adani Enterprises',sector:'Conglomerate'},
  {symbol:'NSE:TATAMOTORS',name:'Tata Motors',sector:'Auto'},
];

export const CRYPTO_LIST = [
  {symbol:'BTC',name:'Bitcoin'},
  {symbol:'ETH',name:'Ethereum'},
  {symbol:'SOL',name:'Solana'},
  {symbol:'BNB',name:'BNB'},
  {symbol:'XRP',name:'XRP'},
  {symbol:'ADA',name:'Cardano'},
  {symbol:'DOGE',name:'Dogecoin'},
  {symbol:'MATIC',name:'Polygon'},
];

// ─── Market Indices ────────────────────────────────────────────────────────────
export const MARKET_INDICES = [
  { symbol: 'SPY',          name: 'S&P 500',    abbr: 'SPX'   },
  { symbol: 'QQQ',          name: 'Nasdaq 100', abbr: 'QQQ'   },
  { symbol: 'DIA',          name: 'Dow Jones',  abbr: 'DJI'   },
  { symbol: 'NSE:NIFTY50',  name: 'Nifty 50',  abbr: 'NIFTY' },
] as const;

// ─── Market-hours helpers ─────────────────────────────────────────────────────
export const isUSMarketOpen = (): boolean => {
  try {
    const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const d = et.getDay();
    if (d === 0 || d === 6) return false;
    const m = et.getHours() * 60 + et.getMinutes();
    return m >= 570 && m < 960; // 9:30–16:00 ET
  } catch { return false; }
};

export const isIndiaMarketOpen = (): boolean => {
  try {
    const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const d = ist.getDay();
    if (d === 0 || d === 6) return false;
    const m = ist.getHours() * 60 + ist.getMinutes();
    return m >= 555 && m < 930; // 9:15–15:30 IST
  } catch { return false; }
};

// ─── WebSocket streaming ──────────────────────────────────────────────────────
export class FinnhubWS {
  private ws: WebSocket | null = null;
  private subs = new Set<string>();
  private handlers = new Map<string, Set<(price: number) => void>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private retryCount = 0;
  private static readonly MAX_RETRIES = 8;
  private static readonly BASE_DELAY_MS = 2000;

  constructor(private readonly apiKey: string) {
    this.connect();
  }

  private connect() {
    if (this.closed || typeof window === 'undefined') return;
    try {
      this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);
      this.ws.onopen = () => {
        this.retryCount = 0;
        this.subs.forEach(s => this.sendMsg({ type: 'subscribe', symbol: s }));
      };
      this.ws.onmessage = ({ data }) => {
        try {
          const msg = JSON.parse(data as string) as { type: string; data?: Array<{ p: number; s: string }> };
          if (msg.type === 'trade') msg.data?.forEach(t => this.handlers.get(t.s)?.forEach(h => h(t.p)));
        } catch { /* ignore */ }
      };
      this.ws.onclose = () => {
        if (!this.closed && this.retryCount < FinnhubWS.MAX_RETRIES) {
          const delay = Math.min(FinnhubWS.BASE_DELAY_MS * 2 ** this.retryCount, 30000);
          this.retryCount++;
          this.reconnectTimer = setTimeout(() => this.connect(), delay);
        }
      };
      this.ws.onerror  = () => this.ws?.close();
    } catch { /* SSR / unsupported */ }
  }

  private sendMsg(msg: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  /** Subscribe to real-time trades. Returns an unsubscribe function. */
  subscribe(symbol: string, handler: (price: number) => void): () => void {
    if (!this.subs.has(symbol)) { this.subs.add(symbol); this.sendMsg({ type: 'subscribe', symbol }); }
    if (!this.handlers.has(symbol)) this.handlers.set(symbol, new Set());
    this.handlers.get(symbol)!.add(handler);
    return () => {
      const s = this.handlers.get(symbol);
      s?.delete(handler);
      if (!s?.size) { this.subs.delete(symbol); this.sendMsg({ type: 'unsubscribe', symbol }); }
    };
  }

  destroy() {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}
