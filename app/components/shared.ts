import { safeN } from '../../lib/api';

export const fmtPrice = (v: unknown, decimals = 2): string => {
  const n = safeN(v);
  return n.toFixed(decimals);
};
export const fmtBig = (v: unknown, prefix = ''): string => {
  const n = safeN(v);
  if (n >= 1e12) return prefix + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return prefix + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return prefix + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return prefix + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return prefix + n.toFixed(2);
};
export const timeAgo = (ts: number): string => {
  const d = Math.floor((Date.now() - (ts < 1e12 ? ts * 1000 : ts)) / 60000);
  if (d < 60) return d + 'm ago';
  if (d < 1440) return Math.floor(d / 60) + 'h ago';
  return Math.floor(d / 1440) + 'd ago';
};
export const fmtDate = (ts: number): string =>
  new Date(ts * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

export const UP_COLOR = '#10b981';
export const DOWN_COLOR = '#f43f5e';
export const BLUE = '#6366f1';
