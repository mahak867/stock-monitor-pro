import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Stock { symbol: string; quantity: number; price: number; }
interface StoreState {
  portfolio: Stock[];
  watchlist: string[];
  balance: number;
  addToPortfolio: (stock: Stock) => void;
  removeFromPortfolio: (symbol: string) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      portfolio: [],
      watchlist: ['AAPL', 'TSLA', 'MSFT'],
      balance: 100000,
      addToPortfolio: (stock) => set((state) => ({ portfolio: [...state.portfolio, stock] })),
      removeFromPortfolio: (symbol) => set((state) => ({ portfolio: state.portfolio.filter(s => s.symbol !== symbol) })),
      addToWatchlist: (symbol) => set((state) => ({ watchlist: [...new Set([...state.watchlist, symbol])] })),
      removeFromWatchlist: (symbol) => set((state) => ({ watchlist: state.watchlist.filter(s => s !== symbol) })),
    }),
    { name: 'stock-pro-storage' }
  )
);