"use client";
import { type Quote, safeN } from '../../lib/api';
import { UP_COLOR, DOWN_COLOR, fmtPrice } from './shared';

function Ticker({ quotes }: { quotes: Record<string, Quote> }) {
  const items = Object.entries(quotes);
  if (!items.length) return null;
  const tape = [...items, ...items];
  return (
    <div className="ticker-wrap" style={{ borderBottom: '1px solid rgba(99,102,241,0.10)', background: '#03030a', padding: '7px 0', flexShrink: 0 }}>
      <div className="ticker" style={{ display: 'flex', gap: 0, width: 'max-content', paddingLeft: 16 }}>
        {tape.map(([sym, q], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingRight: 40 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em' }}>
              {sym.replace('NSE:', '')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', fontFamily: 'DM Mono, monospace' }}>
              ${fmtPrice(q?.c)}
            </span>
            <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: safeN(q?.dp) >= 0 ? UP_COLOR : DOWN_COLOR }}>
              {safeN(q?.dp) >= 0 ? '+' : ''}{fmtPrice(q?.dp)}%
            </span>
            <span style={{ color: 'rgba(99,102,241,0.25)', fontSize: 8, flexShrink: 0 }}>◆</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Ticker };
