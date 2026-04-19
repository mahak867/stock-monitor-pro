"use client";
import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useStore } from '../../lib/store';

function AlpacaTradePanel({ symbol }: { symbol: string }) {
  const { alpacaKey, alpacaSecret, alpacaMode } = useStore();
  const [qty, setQty] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!alpacaKey || !alpacaSecret) return null;

  const place = async () => {
    if (!qty || parseFloat(qty) <= 0) return;
    setLoading(true); setStatus(null);
    try {
      const r = await fetch('/api/alpaca-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, qty: parseFloat(qty), side, apiKey: alpacaKey, apiSecret: alpacaSecret, mode: alpacaMode }),
      });
      const d = await r.json();
      if (!r.ok) setStatus({ ok: false, msg: d.error || 'Order failed' });
      else setStatus({ ok: true, msg: `Order #${d.id?.slice(0, 8)} submitted — ${d.status}` });
    } catch { setStatus({ ok: false, msg: 'Network error' }); }
    setLoading(false);
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Activity size={13} color="#10b981" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Live Trade — Alpaca</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em',
          background: alpacaMode === 'live' ? 'rgba(244,63,94,0.10)' : 'rgba(245,158,11,0.10)',
          color: alpacaMode === 'live' ? '#f43f5e' : '#f59e0b',
          border: `1px solid ${alpacaMode === 'live' ? 'rgba(244,63,94,0.22)' : 'rgba(245,158,11,0.22)'}`,
        }}>{alpacaMode === 'live' ? '⚡ LIVE' : '📋 PAPER'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['buy', 'sell'] as const).map(s => (
          <button key={s} onClick={() => setSide(s)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              background: side === s ? (s === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)') : '#06081a',
              color: side === s ? (s === 'buy' ? '#10b981' : '#f43f5e') : '#475569',
              border: `1px solid ${side === s ? (s === 'buy' ? 'rgba(16,185,129,0.30)' : 'rgba(244,63,94,0.30)') : 'rgba(99,102,241,0.10)'}`,
            }}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1" placeholder="Qty"
          style={{ flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        <button onClick={place} disabled={loading || !qty}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
            background: side === 'buy' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f43f5e,#e11d48)',
            color: '#fff', opacity: loading || !qty ? 0.5 : 1,
          }}>{loading ? '...' : `${side.toUpperCase()} ${symbol.replace('NSE:', '')}`}</button>
      </div>
      {status && (
        <div style={{ fontSize: 11, padding: '6px 10px', borderRadius: 7, fontFamily: 'DM Mono, monospace',
          background: status.ok ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
          color: status.ok ? '#10b981' : '#f43f5e',
          border: `1px solid ${status.ok ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}`,
        }}>{status.msg}</div>
      )}
    </div>
  );
}

export { AlpacaTradePanel };
