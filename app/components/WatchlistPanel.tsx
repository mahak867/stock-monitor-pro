"use client";
import { useState, useEffect, useCallback } from 'react';
import { Star, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { type Quote, getQuote, safeN } from '../../lib/api';
import { Spark } from './Spark';
import { UP_COLOR, DOWN_COLOR, fmtPrice, BLUE } from './shared';

function WatchlistPanel({ onSelect, selected }: { onSelect: (s: string) => void; selected: string }) {
  const { watchlist, addWatch, removeWatch } = useStore();
  const [input, setInput] = useState('');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [hist, setHist] = useState<Record<string, number[]>>({});

  const loadQ = useCallback((sym: string) => {
    getQuote(sym).then(q => {
      setQuotes(p => ({ ...p, [sym]: q }));
      setHist(p => { const h = [...(p[sym] || []), safeN(q.c)].slice(-20); return { ...p, [sym]: h }; });
    });
  }, []);

  useEffect(() => {
    watchlist.forEach(({ symbol }) => loadQ(symbol));
    const t = setInterval(() => watchlist.forEach(({ symbol }) => loadQ(symbol)), 20000);
    return () => clearInterval(t);
  }, [watchlist, loadQ]);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Star size={14} color="#f59e0b" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Watchlist</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => {
            if (e.key === 'Enter' && input.trim()) {
              addWatch({ symbol: input.trim(), name: input.trim() });
              setInput('');
            }
          }}
          placeholder="Add symbol..." maxLength={15}
          style={{ flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        <button onClick={() => { if (input.trim()) { addWatch({ symbol: input.trim(), name: input.trim() }); setInput(''); } }}
          style={{ padding: '7px 12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 0 12px rgba(99,102,241,0.25)' }}>
          <Plus size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
        {watchlist.map(({ symbol, name }) => {
          const q = quotes[symbol];
          const up = safeN(q?.dp) >= 0;
          const h = hist[symbol] || [safeN(q?.pc), safeN(q?.c)];
          return (
            <div key={symbol} onClick={() => onSelect(symbol)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.1s',
                background: selected === symbol ? 'rgba(59,130,246,0.08)' : 'transparent',
                border: '1px solid ' + (selected === symbol ? 'rgba(59,130,246,0.2)' : 'transparent'),
              }}
              onMouseEnter={e => { if (selected !== symbol) e.currentTarget.style.background = '#0b0d1c'; }}
              onMouseLeave={e => { if (selected !== symbol) e.currentTarget.style.background = 'transparent'; }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selected === symbol ? BLUE : '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>
                  {symbol.replace('NSE:', '')}
                </div>
                <div style={{ fontSize: 10, color: '#475569' }}>{name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spark data={h} up={up} />
                <div style={{ textAlign: 'right', minWidth: 64 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>
                    ${fmtPrice(q?.c)}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: up ? UP_COLOR : DOWN_COLOR }}>
                    {up ? '+' : ''}{fmtPrice(q?.dp)}%
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); removeWatch(symbol); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#131628', padding: 2 }}
                  onMouseEnter={e => (e.currentTarget.style.color = DOWN_COLOR)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#131628')}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { WatchlistPanel };
