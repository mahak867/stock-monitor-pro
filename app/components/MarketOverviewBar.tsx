"use client";
import { useState, useEffect } from 'react';
import {
  type Quote, getQuote, MARKET_INDICES, safeN,
  isUSMarketOpen, isIndiaMarketOpen,
} from '../../lib/api';
import { UP_COLOR, DOWN_COLOR, fmtPrice } from './shared';

function MarketOverviewBar({ onSelect }: { onSelect: (s: string) => void }) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [usOpen] = useState(isUSMarketOpen);
  const [inOpen] = useState(isIndiaMarketOpen);

  useEffect(() => {
    const load = () => MARKET_INDICES.forEach(({ symbol }) =>
      getQuote(symbol).then(q => setQuotes(p => ({ ...p, [symbol]: q })))
    );
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em',
        background: usOpen ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
        color: usOpen ? '#10b981' : '#64748b',
        border: `1px solid ${usOpen ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
      }}>
        {usOpen ? ' US OPEN' : '○ US CLOSED'}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em',
        background: inOpen ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
        color: inOpen ? '#10b981' : '#64748b',
        border: `1px solid ${inOpen ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
      }}>
        {inOpen ? ' IN OPEN' : '○ IN CLOSED'}
      </span>
      <span style={{ width: 1, height: 16, background: 'rgba(99,102,241,0.15)', flexShrink: 0 }} />
      {MARKET_INDICES.map(({ symbol, abbr }) => {
        const q = quotes[symbol];
        const up = safeN(q?.dp) >= 0;
        return (
          <div key={symbol} onClick={() => onSelect(symbol)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              background: 'rgba(11,13,28,0.8)', border: '1px solid rgba(99,102,241,0.10)',
              borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.10)')}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>{abbr}</span>
            {q ? (
              <>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>
                  ${fmtPrice(q.c)}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>
                  {up ? '+' : ''}{fmtPrice(q.dp)}%
                </span>
              </>
            ) : (
              <span className="skeleton" style={{ width: 64, height: 14, borderRadius: 4 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { MarketOverviewBar };
