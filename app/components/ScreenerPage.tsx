"use client";
import { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { useStore } from '../../lib/store';
import { type Quote, type SearchResult, getQuote, searchSymbol, safeN } from '../../lib/api';
import { UP_COLOR, DOWN_COLOR, fmtPrice, BLUE } from './shared';

function ScreenerPage({ onSelect }: { onSelect: (s: string) => void }) {
  const { recentSymbols, addRecent } = useStore();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(-1);
  const [previewQuotes, setPreviewQuotes] = useState<Record<string, Quote>>({});
  const [recentQuotes, setRecentQuotes] = useState<Record<string, Quote>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Search with debounce
  useEffect(() => {
    if (q.length < 2) { setResults([]); setFocused(-1); return; }
    setLoading(true);
    const t = setTimeout(() => {
      searchSymbol(q).then(r => { setResults(r); setLoading(false); setFocused(-1); });
    }, 380);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch live quotes for top search results
  useEffect(() => {
    if (results.length === 0) return;
    const top = results.slice(0, 5);
    top.forEach(r => getQuote(r.symbol).then(qr => setPreviewQuotes(p => ({ ...p, [r.symbol]: qr }))));
  }, [results]);

  // Fetch quotes for recently viewed
  useEffect(() => {
    recentSymbols.forEach(sym => getQuote(sym).then(qr => setRecentQuotes(p => ({ ...p, [sym]: qr }))));
  }, [recentSymbols]);

  const pick = (sym: string) => { addRecent(sym); onSelect(sym); };

  // Keyboard navigation
  const handleKey = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter' && focused >= 0) { e.preventDefault(); pick(results[focused].symbol); }
    if (e.key === 'Escape')    { setQ(''); setResults([]); setFocused(-1); }
  };

  const presets = [
    { label: 'Magnificent 7',    syms: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'] },
    { label: 'Indian Blue Chips', syms: ['NSE:RELIANCE', 'NSE:TCS', 'NSE:HDFCBANK', 'NSE:INFY'] },
    { label: 'Crypto Top 5',     syms: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'] },
    { label: 'Finance Leaders',  syms: ['JPM', 'BAC', 'GS', 'MS', 'WFC'] },
    { label: 'AI Plays',         syms: ['NVDA', 'MSFT', 'GOOGL', 'AMD', 'PLTR', 'C3.AI'] },
    { label: 'EV & Clean Energy',syms: ['TSLA', 'RIVN', 'NIO', 'ENPH', 'FSLR'] },
    { label: 'Indian IT',        syms: ['NSE:TCS', 'NSE:INFY', 'NSE:WIPRO', 'NSE:HCLTECH'] },
    { label: 'Dividend Kings',   syms: ['JNJ', 'PG', 'KO', 'MMM', 'CL'] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      {/* Search */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 14, letterSpacing: '-0.01em' }}>
          Deep Symbol Search
        </div>
        <div style={{ position: 'relative', marginBottom: results.length > 0 ? 0 : 0 }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value.toUpperCase())}
            onKeyDown={handleKey}
            placeholder="Search any stock, ETF, crypto, index…"
            autoComplete="off"
            style={{
              width: '100%', background: '#06081a',
              border: '1px solid rgba(99,102,241,0.16)', borderRadius: 10,
              padding: '11px 14px 11px 40px', fontSize: 13,
              color: '#f1f5f9', fontFamily: 'DM Mono, monospace',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.40)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.16)')}
          />
          {loading && (
            <RefreshCw size={13} color="#6366f1"
              style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', animation: 'spin 0.8s linear infinite' }} />
          )}
        </div>

        {/* Search results with live quote preview */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 10 }}>
            {results.map((r, i) => {
              const pq = previewQuotes[r.symbol];
              const up = safeN(pq?.dp) >= 0;
              return (
                <div key={r.symbol} onClick={() => pick(r.symbol)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 13px', borderRadius: 9, cursor: 'pointer',
                    background: focused === i ? 'rgba(99,102,241,0.10)' : '#06081a',
                    border: `1px solid ${focused === i ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.10)'}`,
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (focused !== i) { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)'; } }}
                  onMouseLeave={e => { if (focused !== i) { e.currentTarget.style.background = '#06081a'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.10)'; } }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', fontFamily: 'DM Mono, monospace' }}>{r.symbol}</span>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 10 }}>{r.description}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {pq ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>${fmtPrice(pq.c)}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>{up ? '+' : ''}{fmtPrice(pq.dp)}%</span>
                      </div>
                    ) : (
                      <span className="skeleton" style={{ width: 80, height: 14, borderRadius: 4 }} />
                    )}
                    <span style={{ fontSize: 10, color: '#475569', background: 'rgba(99,102,241,0.10)', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>{r.type}</span>
                  </div>
                </div>
              );
            })}
            <p style={{ fontSize: 10, color: '#2d3a52', textAlign: 'center', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
              ↑↓ navigate · Enter select · Esc clear
            </p>
          </div>
        )}
      </div>

      {/* Recently Viewed */}
      {recentSymbols.length > 0 && q.length === 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Recently Viewed
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recentSymbols.map(sym => {
              const rq = recentQuotes[sym];
              const up = safeN(rq?.dp) >= 0;
              return (
                <div key={sym} onClick={() => pick(sym)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                    background: '#06081a', border: '1px solid rgba(99,102,241,0.12)',
                    borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)'; }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', fontFamily: 'DM Mono, monospace' }}>
                    {sym.replace('NSE:', '')}
                  </span>
                  {rq ? (
                    <>
                      <span style={{ fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>${fmtPrice(rq.c)}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>
                        {up ? '+' : ''}{fmtPrice(rq.dp)}%
                      </span>
                    </>
                  ) : (
                    <span className="skeleton" style={{ width: 64, height: 12, borderRadius: 4 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Screens */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 14 }}>Preset Screens</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {presets.map(p => (
            <div key={p.label} style={{ background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>{p.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.syms.map(s => (
                  <button key={s} onClick={() => pick(s)}
                    style={{ padding: '4px 10px', background: '#090b1c', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 20, fontSize: 11, color: '#64748b', cursor: 'pointer', fontFamily: 'DM Mono, monospace', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#64748b'; }}>
                    {s.replace('NSE:', '')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { ScreenerPage };
