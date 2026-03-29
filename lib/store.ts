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
export interface WatchlistItem { symbol: string; name: string; }

interface StoreState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  portfolio: Position[];
  balance: number;
  addPosition: (p: Position) => void;
  removePosition: (symbol: string) => void;
  updatePrice: (symbol: string, price: number) => void;

  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;

  alerts: Alert[];
  addAlert: (a: Omit<Alert, 'id' | 'triggered'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  triggerAlert: (id: string) => void;

  activeSymbol: string;
  setActiveSymbol: (s: string) => void;

  marketTab: 'us' | 'india' | 'crypto';
  setMarketTab: (t: 'us' | 'india' | 'crypto') => void;

  claudeApiKey: string;
  setClaudeApiKey: (k: string) => void;

  activeTab: string;
  setActiveTab: (t: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      portfolio: [],
      balance: 100000,
      addPosition: (p) => set((s) => {
        const ex = s.portfolio.find(x => x.symbol === p.symbol);
        if (ex) {
          return {
            portfolio: s.portfolio.map(x => x.symbol === p.symbol
              ? { ...x, quantity: x.quantity + p.quantity, avgPrice: (x.avgPrice * x.quantity + p.avgPrice * p.quantity) / (x.quantity + p.quantity) }
              : x)
          };
        }
        return { portfolio: [...s.portfolio, p], balance: Math.max(0, s.balance - p.quantity * p.avgPrice) };
      }),
      removePosition: (symbol) => set((s) => ({ portfolio: s.portfolio.filter(x => x.symbol !== symbol) })),
      updatePrice: (symbol, price) => set((s) => ({
        portfolio: s.portfolio.map(x => x.symbol === symbol ? { ...x, currentPrice: price } : x)
      })),

      watchlist: [
        { symbol: 'AAPL', name: 'Apple' }, { symbol: 'TSLA', name: 'Tesla' },
        { symbol: 'MSFT', name: 'Microsoft' }, { symbol: 'NSE:RELIANCE', name: 'Reliance' },
        { symbol: 'BTC', name: 'Bitcoin' },
      ],
      addToWatchlist: (item) => set((s) => ({
        watchlist: s.watchlist.find(x => x.symbol === item.symbol) ? s.watchlist : [...s.watchlist, item]
      })),
      removeFromWatchlist: (symbol) => set((s) => ({
        watchlist: s.watchlist.filter(x => x.symbol !== symbol)
      })),

      alerts: [],
      addAlert: (a) => set((s) => ({
        alerts: [...s.alerts, { ...a, id: Date.now().toString(), triggered: false }]
      })),
      removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter(x => x.id !== id) })),
      toggleAlert: (id) => set((s) => ({
        alerts: s.alerts.map(x => x.id === id ? { ...x, active: !x.active } : x)
      })),
      triggerAlert: (id) => set((s) => ({
        alerts: s.alerts.map(x => x.id === id ? { ...x, triggered: true, active: false } : x)
      })),

      activeSymbol: 'AAPL',
      setActiveSymbol: (s) => set({ activeSymbol: s }),

      marketTab: 'us',
      setMarketTab: (t) => set({ marketTab: t }),

      claudeApiKey: '',
      setClaudeApiKey: (k) => set({ claudeApiKey: k }),

      activeTab: 'dashboard',
      setActiveTab: (t) => set({ activeTab: t }),
    }),
    { name: 'stockpro-v3' }
  )
);

