"use client";
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { type Candle, type Quote, safeN } from '../../lib/api';
import { UP_COLOR, DOWN_COLOR, fmtPrice, fmtDate } from './shared';
import { Badge } from './Badge';

function PriceChart({ candles, symbol, quote }: { candles: Candle[]; symbol: string; quote: Quote | null }) {
  const [range, setRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('3M');
  const days = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[range];
  const data = candles.slice(-days).map(c => ({
    date: fmtDate(c.t), price: c.c, vol: Math.round(c.v / 1e6 * 10) / 10,
  }));
  const first = safeN(data[0]?.price), last = safeN(data[data.length - 1]?.price);
  const up = last >= first;
  const color = up ? UP_COLOR : DOWN_COLOR;
  const gradId = 'g' + symbol.replace(/[^a-z]/gi, '');
  const pct = first ? ((last - first) / first * 100) : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', letterSpacing: '-0.02em' }}>
              ${fmtPrice(quote?.c)}
            </span>
            {quote && <Badge dp={quote.dp} />}
            <span style={{ fontSize: 12, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>
              {up ? '+' : ''}{pct.toFixed(2)}% ({range})
            </span>
          </div>
          {quote && (
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              {[['O', quote.o], ['H', quote.h], ['L', quote.l], ['Prev', quote.pc]].map(([l, v]) => (
                <span key={l as string} style={{ fontSize: 11, color: '#64748b' }}>
                  <span style={{ color: '#475569', marginRight: 4 }}>{l}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>${fmtPrice(v)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['1W', '1M', '3M', '6M', '1Y'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{
                padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: range === r ? 'rgba(99,102,241,0.20)' : 'transparent',
                color: range === r ? '#818cf8' : '#475569',
                border: range === r ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(99,102,241,0.10)',
                cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.02em',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 220, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(99,102,241,0.08)" strokeDasharray="4 10" />
            <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace' }} />
            <YAxis stroke="transparent" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace' }} domain={['auto', 'auto']} width={60} />
            <Tooltip
              contentStyle={{ background: '#0b0d1c', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, fontSize: 12, fontFamily: 'DM Mono, monospace' }}
              labelStyle={{ color: '#64748b' }}
              formatter={(v: unknown) => ['$' + fmtPrice(v), 'Price']}
            />
            <Area type="monotone" dataKey="price" stroke={color} fill={'url(#' + gradId + ')'} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ height: 60, minWidth: 0, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Bar dataKey="vol" fill="rgba(99,102,241,0.18)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export { PriceChart };
