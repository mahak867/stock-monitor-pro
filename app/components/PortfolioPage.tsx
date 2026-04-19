"use client";
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { safeN } from '../../lib/api';
import { UP_COLOR, DOWN_COLOR, fmtPrice } from './shared';
import { PortfolioAnalyticsPanel } from './PortfolioAnalyticsPanel';
import { AlpacaTradePanel } from './AlpacaTradePanel';

function PortfolioPage({ onSelect }: { onSelect: (s: string) => void }) {
  const { portfolio, balance, removePosition } = useStore();
  const totalVal = portfolio.reduce((s, p) => s + safeN(p.currentPrice || p.avgPrice) * safeN(p.quantity), 0);
  const totalCost = portfolio.reduce((s, p) => s + safeN(p.avgPrice) * safeN(p.quantity), 0);
  const pnl = totalVal - totalCost;
  const pnlPct = totalCost ? (pnl / totalCost * 100) : 0;
  const [selectedSym, setSelectedSym] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Value', value: '$' + (totalVal + balance).toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: 'Portfolio + Cash' },
          { label: 'Invested', value: '$' + totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: portfolio.length + ' positions' },
          { label: 'P&L', value: (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(0), color: pnl >= 0 ? UP_COLOR : DOWN_COLOR, sub: fmtPrice(pnlPct) + '%' },
          { label: 'Cash', value: '$' + balance.toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: 'Available' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: color || '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 14 }}>Positions</div>
        {portfolio.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
            <p style={{ fontSize: 14 }}>No positions yet</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Search a symbol to start tracking</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 24px', gap: 8, padding: '0 10px', marginBottom: 4 }}>
              {['Symbol', 'Shares', 'Avg Price', 'Value', 'P&L', ''].map(h => (
                <span key={h} style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
              ))}
            </div>
            {portfolio.map(p => {
              const cur = safeN(p.currentPrice || p.avgPrice);
              const cost = safeN(p.avgPrice);
              const qty = safeN(p.quantity);
              const val = cur * qty;
              const pl = (cur - cost) * qty;
              const plPct = cost ? ((cur - cost) / cost * 100) : 0;
              return (
                <div key={p.symbol} onClick={() => { onSelect(p.symbol); setSelectedSym(p.symbol); }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 24px',
                    gap: 8, padding: '10px', borderRadius: 8, cursor: 'pointer', background: '#06081a',
                    alignItems: 'center', border: '1px solid transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{p.symbol}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{p.name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>{qty}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>${cost.toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>${val.toFixed(2)}</div>
                  <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: pl >= 0 ? UP_COLOR : DOWN_COLOR, fontWeight: 600 }}>
                    {pl >= 0 ? '+' : ''}{pl.toFixed(2)}<br />
                    <span style={{ fontSize: 10 }}>({fmtPrice(plPct)}%)</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removePosition(p.symbol); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#131628', padding: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.color = DOWN_COLOR)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#131628')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <PortfolioAnalyticsPanel />
      {selectedSym && <AlpacaTradePanel symbol={selectedSym} />}
      {portfolio.length > 0 && !selectedSym && (
        <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: '4px 0', fontFamily: 'DM Mono, monospace' }}>
          Click a position to enable Alpaca live trade for that symbol
        </div>
      )}
    </div>
  );
}

export { PortfolioPage };
