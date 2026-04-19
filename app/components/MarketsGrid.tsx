"use client";
import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useStore } from '../../lib/store';
import {
  type Quote, getQuote, getCryptoQuote,
  US_STOCKS, INDIA_STOCKS, CRYPTO_LIST, safeN,
} from '../../lib/api';
import { Spark } from './Spark';
import { UP_COLOR, DOWN_COLOR, fmtPrice } from './shared';

function MarketsGrid({ onSelect }: { onSelect: (s: string) => void }) {
  const { market, setMarket } = useStore();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setQuotes({});
    const stocks = market === 'india' ? INDIA_STOCKS : market === 'crypto' ? CRYPTO_LIST.map(c => ({ ...c, sector: 'Crypto' })) : US_STOCKS;
    const fn = market === 'crypto' ? getCryptoQuote : getQuote;
    Promise.all(stocks.map(({ symbol }) =>
      fn(symbol).then(q => [symbol, q] as const)
    )).then(results => {
      const map: Record<string, Quote> = {};
      results.forEach(([s, q]) => { map[s] = q; });
      setQuotes(map);
      setLoading(false);
    });
  }, [market]);

  const stocks = market === 'india' ? INDIA_STOCKS : market === 'crypto' ? CRYPTO_LIST.map(c => ({ ...c, sector: 'Crypto' })) : US_STOCKS;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={14} color="#64748b" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Markets</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['us', 'india', 'crypto'] as const).map(m => (
            <button key={m} onClick={() => setMarket(m)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: market === m ? 'rgba(99,102,241,0.18)' : 'transparent',
                color: market === m ? '#818cf8' : '#64748b',
                border: market === m ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(99,102,241,0.10)',
                textTransform: 'uppercase',
              }}>
              {m === 'us' ? 'US' : m === 'india' ? 'IN' : 'Crypto'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {loading
          ? Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)
          : stocks.map(({ symbol, name }) => {
            const q = quotes[symbol];
            const up = safeN(q?.dp) >= 0;
            const hist = [safeN(q?.pc) * 0.99, safeN(q?.pc), safeN(q?.o), safeN(q?.l), safeN(q?.c)];
            return (
              <div key={symbol} onClick={() => onSelect(symbol)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: '#06081a',
                  border: '1px solid transparent', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.28)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', marginBottom: 2 }}>
                    {symbol.replace('NSE:', '')}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Spark data={hist} up={up} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>${fmtPrice(q?.c)}</div>
                    <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: up ? UP_COLOR : DOWN_COLOR }}>
                      {up ? '+' : ''}{fmtPrice(q?.dp)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export { MarketsGrid };
