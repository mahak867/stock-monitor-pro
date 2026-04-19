"use client";
import { safeN } from '../../lib/api';
import { UP_COLOR, DOWN_COLOR } from './shared';

function Spark({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return <div style={{ width: 72, height: 24 }} />;
  const vals = data.map(safeN);
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const pts = vals.map((v, i) =>
    `${(i / (vals.length - 1)) * 70},${22 - ((v - min) / range) * 20}`
  ).join(' ');
  const color = up ? UP_COLOR : DOWN_COLOR;
  return (
    <svg width={72} height={24} viewBox="0 0 72 24">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { Spark };
