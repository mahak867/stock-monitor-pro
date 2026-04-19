"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  type Profile, type Metrics, type EarningsItem, type RecommendationItem,
  getProfile, getMetrics, getEarnings, getRecommendations, safeN,
} from '../../lib/api';
import { UP_COLOR, DOWN_COLOR, BLUE, fmtBig } from './shared';

function AboutPanel({ symbol }: { symbol: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [recs, setRecs] = useState<RecommendationItem[]>([]);

  useEffect(() => {
    setProfile(null); setMetrics(null); setEarnings([]); setRecs([]);
    getProfile(symbol).then(setProfile);
    getMetrics(symbol).then(setMetrics);
    getEarnings(symbol).then(setEarnings);
    getRecommendations(symbol).then(setRecs);
  }, [symbol]);

  const stats = [
    { label: 'P/E Ratio', value: metrics?.peNormalizedAnnual?.toFixed(1) ?? '—' },
    { label: 'EPS (TTM)', value: metrics?.epsNormalizedAnnual ? '$' + metrics.epsNormalizedAnnual.toFixed(2) : '—' },
    { label: 'Market Cap', value: metrics?.marketCapitalization ? fmtBig(metrics.marketCapitalization * 1e6, '$') : '—' },
    { label: '52W High', value: metrics?.weekHigh52 ? '$' + safeN(metrics.weekHigh52).toFixed(2) : '—' },
    { label: '52W Low', value: metrics?.weekLow52 ? '$' + safeN(metrics.weekLow52).toFixed(2) : '—' },
    { label: 'Beta', value: metrics?.beta?.toFixed(2) ?? '—' },
    { label: 'ROE', value: metrics?.roeRfy ? safeN(metrics.roeRfy).toFixed(1) + '%' : '—' },
    { label: 'Div Yield', value: metrics?.dividendYieldIndicatedAnnual ? safeN(metrics.dividendYieldIndicatedAnnual).toFixed(2) + '%' : '—' },
    { label: 'P/B', value: metrics?.pbAnnual?.toFixed(2) ?? '—' },
    { label: 'D/E', value: metrics?.debtEquityAnnual?.toFixed(2) ?? '—' },
  ];

  const latest = recs[0];
  const total = latest ? (latest.buy + latest.hold + latest.sell + latest.strongBuy + latest.strongSell) || 1 : 1;
  const buyPct = latest ? Math.round((latest.buy + latest.strongBuy) / total * 100) : 0;
  const holdPct = latest ? Math.round(latest.hold / total * 100) : 0;
  const sellPct = latest ? Math.round((latest.sell + latest.strongSell) / total * 100) : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      {profile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          {profile.logo && (
            <Image src={profile.logo} alt={profile.name} width={36} height={36}
              style={{ borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 3 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{profile.finnhubIndustry} · {profile.exchange}</div>
          </div>
          {profile.weburl && (
            <a href={profile.weburl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: BLUE, textDecoration: 'none' }}>Website </a>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: '#06081a', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {latest && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analyst Ratings ({latest.period})</div>
          <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 6, marginBottom: 6 }}>
            <div style={{ width: buyPct + '%', background: UP_COLOR }} />
            <div style={{ width: holdPct + '%', background: '#f59e0b' }} />
            <div style={{ width: sellPct + '%', background: DOWN_COLOR }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: UP_COLOR }}>Buy {buyPct}%</span>
            <span style={{ color: '#f59e0b' }}>Hold {holdPct}%</span>
            <span style={{ color: DOWN_COLOR }}>Sell {sellPct}%</span>
          </div>
        </div>
      )}

      {earnings.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>EPS History</div>
          <div style={{ height: 90, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earnings.slice(0, 6).reverse().map(e => ({
                q: `Q${e.quarter} ${e.year}`, actual: e.epsActual, estimate: e.epsEstimate,
              }))}>
                <XAxis dataKey="q" tick={{ fill: '#475569', fontSize: 9 }} stroke="transparent" />
                <Tooltip contentStyle={{ background: '#0b0d1c', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="actual" fill={BLUE} radius={[3, 3, 0, 0]} name="Actual" />
                <Bar dataKey="estimate" fill="#131628" radius={[3, 3, 0, 0]} name="Estimate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export { AboutPanel };
