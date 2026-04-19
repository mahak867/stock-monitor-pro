"use client";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { safeN } from '../../lib/api';
import { UP_COLOR, DOWN_COLOR } from './shared';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899', '#22d3ee'];

function PortfolioAnalyticsPanel() {
  const { portfolio, balance } = useStore();

  if (portfolio.length === 0) return null;

  const totalCost = portfolio.reduce((s, p) => s + safeN(p.avgPrice) * safeN(p.quantity), 0);
  const totalVal  = portfolio.reduce((s, p) => s + safeN(p.currentPrice || p.avgPrice) * safeN(p.quantity), 0);
  const pnl = totalVal - totalCost;
  const pnlPct = totalCost ? (pnl / totalCost) * 100 : 0;

  // Simulated returns for Sharpe (based on position P&L as a proxy)
  const returns = portfolio.map(p => {
    const cur = safeN(p.currentPrice || p.avgPrice);
    const cost = safeN(p.avgPrice);
    return cost ? (cur - cost) / cost : 0;
  });
  const avgReturn = returns.reduce((s, r) => s + r, 0) / (returns.length || 1);
  const variance = returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length || 1);
  const stdDev = Math.sqrt(variance);
  const riskFreeDaily = 0.045 / 252;
  const sharpeNum = stdDev > 0 ? (avgReturn - riskFreeDaily) / stdDev : null;
  const sharpeStr = sharpeNum !== null ? sharpeNum.toFixed(2) : 'N/A';

  // Max drawdown: worst single position P&L %
  const drawdowns = returns.map(r => r < 0 ? r * 100 : 0);
  const maxDrawdown = Math.min(0, ...drawdowns).toFixed(1);

  // Best / worst position
  const sorted = [...portfolio].sort((a, b) => {
    const ra = safeN(a.avgPrice) ? (safeN(a.currentPrice || a.avgPrice) - safeN(a.avgPrice)) / safeN(a.avgPrice) : 0;
    const rb = safeN(b.avgPrice) ? (safeN(b.currentPrice || b.avgPrice) - safeN(b.avgPrice)) / safeN(b.avgPrice) : 0;
    return rb - ra;
  });
  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Allocation data for pie
  const alloc = portfolio.map(p => ({
    name: p.symbol.replace('NSE:', ''),
    value: Math.round(safeN(p.currentPrice || p.avgPrice) * safeN(p.quantity)),
  }));
  if (balance > 0) alloc.push({ name: 'Cash', value: Math.round(balance) });

  const bestPct  = best  && safeN(best.avgPrice)  ? (safeN(best.currentPrice  || best.avgPrice)  - safeN(best.avgPrice))  / safeN(best.avgPrice)  * 100 : 0;
  const worstPct = worst && safeN(worst.avgPrice) ? (safeN(worst.currentPrice || worst.avgPrice) - safeN(worst.avgPrice)) / safeN(worst.avgPrice) * 100 : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BarChart2 size={14} color="#6366f1" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Portfolio Analytics</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Total Return', val: (pnlPct >= 0 ? '+' : '') + pnlPct.toFixed(2) + '%', color: pnlPct >= 0 ? '#10b981' : '#f43f5e' },
          { label: 'Sharpe Ratio', val: sharpeStr, color: sharpeNum !== null && sharpeNum > 1 ? '#10b981' : '#f59e0b' },
          { label: 'Max Drawdown', val: maxDrawdown + '%', color: parseFloat(maxDrawdown) < -10 ? '#f43f5e' : '#f59e0b' },
          { label: 'Positions', val: String(portfolio.length), color: '#f1f5f9' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#06081a', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'DM Mono, monospace' }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Top Performer</div>
          {best && (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{best.symbol.replace('NSE:', '')}</div>
              <div style={{ fontSize: 12, color: '#10b981', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{bestPct >= 0 ? '+' : ''}{bestPct.toFixed(2)}%</div>
            </div>
          )}
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Worst Performer</div>
          {worst && (
            <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{worst.symbol.replace('NSE:', '')}</div>
              <div style={{ fontSize: 12, color: '#f43f5e', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{worstPct.toFixed(2)}%</div>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Allocation</div>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={alloc} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                  dataKey="value" nameKey="name" paddingAngle={2} stroke="none">
                  {alloc.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0b0d1c', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, fontSize: 11, fontFamily: 'DM Mono, monospace' }}
                  formatter={(v: unknown) => ['$' + safeN(v).toLocaleString(), 'Value']}
                />
                <Legend iconType="circle" iconSize={7}
                  formatter={(v) => <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PortfolioAnalyticsPanel };
