import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Position {
  symbol: string; name: string; quantity: number;
  avgPrice: number; currentPrice: number;
}
export interface Alert {
  id: string; symbol: string; condition: 'above' | 'below';
  price: number; active: boolean; triggered: boolean;
}
export interface WatchItem { symbol: string; name: string; }

interface Store {
  tab: string; setTab: (t: string) => void;
  symbol: string; setSymbol: (s: string) => void;
  market: 'us' | 'india' | 'crypto'; setMarket: (m: 'us' | 'india' | 'crypto') => void;
  portfolio: Position[]; balance: number;
  addPosition: (p: Position) => void;
  removePosition: (sym: string) => void;
  /** Sell quantity shares at price; returns proceeds to cash balance. */
  sellPosition: (sym: string, quantity: number, price: number) => void;
  updatePrice: (sym: string, price: number) => void;
  watchlist: WatchItem[];
  addWatch: (item: WatchItem) => void;
  removeWatch: (sym: string) => void;
  alerts: Alert[];
  addAlert: (a: Omit<Alert,'id'|'triggered'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  claudeKey: string; setClaudeKey: (k: string) => void;
  recentSymbols: string[]; addRecent: (sym: string) => void;
  triggerAlert: (id: string) => void;
}

export const useStore = create<Store>()(persist(
  (set) => ({
    tab: 'dashboard', setTab: (t) => set({ tab: t }),
    symbol: 'AAPL', setSymbol: (s) => set({ symbol: s }),
    market: 'us', setMarket: (m) => set({ market: m }),
    portfolio: [], balance: 100000,
    addPosition: (p) => set((s) => {
      const ex = s.portfolio.find(x => x.symbol === p.symbol);
      const cost = p.quantity * p.avgPrice;
      if (ex) return {
        portfolio: s.portfolio.map(x => x.symbol===p.symbol ? {...x,quantity:x.quantity+p.quantity,avgPrice:(x.avgPrice*x.quantity+p.avgPrice*p.quantity)/(x.quantity+p.quantity)} : x),
        balance: Math.max(0, s.balance - cost),
      };
      return { portfolio: [...s.portfolio, p], balance: Math.max(0, s.balance - cost) };
    }),
    removePosition: (sym) => set((s) => ({ portfolio: s.portfolio.filter(x => x.symbol!==sym) })),
    sellPosition: (sym, quantity, price) => set((s) => {
      const pos = s.portfolio.find(x => x.symbol === sym);
      if (!pos) return s;
      const qty = Math.min(quantity, pos.quantity);
      const proceeds = qty * price;
      if (qty >= pos.quantity) {
        return { portfolio: s.portfolio.filter(x => x.symbol !== sym), balance: s.balance + proceeds };
      }
      return {
        portfolio: s.portfolio.map(x => x.symbol === sym ? { ...x, quantity: x.quantity - qty } : x),
        balance: s.balance + proceeds,
      };
    }),
    updatePrice: (sym, price) => set((s) => ({ portfolio: s.portfolio.map(x => x.symbol===sym ? {...x,currentPrice:price} : x) })),
    watchlist: [
      {symbol:'AAPL',name:'Apple'},{symbol:'TSLA',name:'Tesla'},
      {symbol:'MSFT',name:'Microsoft'},{symbol:'NSE:RELIANCE',name:'Reliance'},{symbol:'BTC',name:'Bitcoin'},
    ],
    addWatch: (item) => set((s) => ({ watchlist: s.watchlist.find(x=>x.symbol===item.symbol) ? s.watchlist : [...s.watchlist, item] })),
    removeWatch: (sym) => set((s) => ({ watchlist: s.watchlist.filter(x => x.symbol!==sym) })),
    alerts: [],
    addAlert: (a) => set((s) => ({ alerts: [...s.alerts, {...a,id:Date.now().toString(),triggered:false}] })),
    removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter(x => x.id!==id) })),
    toggleAlert: (id) => set((s) => ({ alerts: s.alerts.map(x => x.id===id ? {...x,active:!x.active} : x) })),
    claudeKey: '', setClaudeKey: (k) => set({ claudeKey: k }),
    recentSymbols: [],
    addRecent: (sym) => set((s) => ({ recentSymbols: [sym, ...s.recentSymbols.filter(x => x !== sym)].slice(0, 8) })),
    triggerAlert: (id) => set((s) => ({ alerts: s.alerts.map(x => x.id === id ? { ...x, active: false, triggered: true } : x) })),
  }),
  { name: 'qp-v4' }
));

