import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Position {
  symbol: string; name: string; quantity: number;
  avgPrice: number; currentPrice: number;
}
export interface Alert {
  id: string; symbol: string;
  condition: 'above' | 'below'; price: number; active: boolean;
}
export interface WatchlistItem { symbol: string; name: string; }

interface StoreState {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Portfolio
  portfolio: Position[];
  balance: number;
  addPosition: (p: Position) => void;
  removePosition: (symbol: string) => void;
  updatePrice: (symbol: string, price: number) => void;

  // Watchlist
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (a: Omit<Alert, 'id'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;

  // Active symbol
  activeSymbol: string;
  setActiveSymbol: (s: string) => void;

  // Active market tab
  marketTab: 'us' | 'india' | 'crypto';
  setMarketTab: (t: 'us' | 'india' | 'crypto') => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      portfolio: [],
      balance: 100000,
      addPosition: (p) => set((s) => {
        const existing = s.portfolio.find(x => x.symbol === p.symbol);
        if (existing) {
          return {
            portfolio: s.portfolio.map(x => x.symbol === p.symbol
              ? { ...x, quantity: x.quantity + p.quantity, avgPrice: (x.avgPrice * x.quantity + p.avgPrice * p.quantity) / (x.quantity + p.quantity) }
              : x)
          };
        }
        return { portfolio: [...s.portfolio, p], balance: s.balance - p.quantity * p.avgPrice };
      }),
      removePosition: (symbol) => set((s) => ({ portfolio: s.portfolio.filter(x => x.symbol !== symbol) })),
      updatePrice: (symbol, price) => set((s) => ({
        portfolio: s.portfolio.map(x => x.symbol === symbol ? { ...x, currentPrice: price } : x)
      })),

      watchlist: [
        { symbol: 'AAPL', name: 'Apple' },
        { symbol: 'TSLA', name: 'Tesla' },
        { symbol: 'MSFT', name: 'Microsoft' },
        { symbol: 'NSE:RELIANCE', name: 'Reliance' },
        { symbol: 'BTC', name: 'Bitcoin' },
      ],
      addToWatchlist: (item) => set((s) => ({
        watchlist: s.watchlist.find(x => x.symbol === item.symbol)
          ? s.watchlist
          : [...s.watchlist, item]
      })),
      removeFromWatchlist: (symbol) => set((s) => ({
        watchlist: s.watchlist.filter(x => x.symbol !== symbol)
      })),

      alerts: [],
      addAlert: (a) => set((s) => ({
        alerts: [...s.alerts, { ...a, id: Date.now().toString() }]
      })),
      removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter(x => x.id !== id) })),
      toggleAlert: (id) => set((s) => ({
        alerts: s.alerts.map(x => x.id === id ? { ...x, active: !x.active } : x)
      })),

      activeSymbol: 'AAPL',
      setActiveSymbol: (s) => set({ activeSymbol: s }),

      marketTab: 'us',
      setMarketTab: (t) => set({ marketTab: t }),
    }),
    { name: 'stockpro-v2' }
  )
);
