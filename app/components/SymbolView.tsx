"use client";
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  type Quote, type Candle, type Metrics,
  getQuote, getCandles, getMetrics, mockCandles,
} from '../../lib/api';
import { PriceChart } from './PriceChart';
import { AboutPanel } from './AboutPanel';
import { ClaudePanel } from './ClaudePanel';
import { Badge } from './Badge';

function SymbolView({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getQuote(symbol).then(setQuote),
      getCandles(symbol, 'D', 365).then(c => setCandles(c.length > 10 ? c : mockCandles(symbol, 365))),
      getMetrics(symbol).then(setMetrics),
    ]).finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    load();
    const t = setInterval(() => getQuote(symbol).then(setQuote), 15000);
    return () => clearInterval(t);
  }, [symbol, load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', margin: 0, letterSpacing: '-0.02em' }}>
            {symbol.replace('NSE:', '')}
          </h1>
        </div>
        {quote && <Badge dp={quote.dp} />}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.10)', padding: '4px 11px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.22)', letterSpacing: '0.05em' }}>
          <span className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          LIVE
        </span>
        <button onClick={load} disabled={loading}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 9, color: '#818cf8', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
          <RefreshCw size={12} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>
      <PriceChart candles={candles} symbol={symbol} quote={quote} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <AboutPanel symbol={symbol} />
        <ClaudePanel symbol={symbol} quote={quote} metrics={metrics} />
      </div>
    </div>
  );
}

export { SymbolView };
