"use client";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { safeN } from '../../lib/api';
import { UP_COLOR, DOWN_COLOR } from './shared';

function Badge({ dp }: { dp: number | undefined }) {
  const v = safeN(dp);
  const up = v >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: up ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
      color: up ? UP_COLOR : DOWN_COLOR,
      border: `1px solid ${up ? 'rgba(16,185,129,0.22)' : 'rgba(244,63,94,0.22)'}`,
      fontFamily: 'DM Mono, monospace',
      letterSpacing: '0.02em',
    }}>
      {up ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      {up ? '+' : ''}{v.toFixed(2)}%
    </span>
  );
}

export { Badge };
