/**
 * Unit tests for lib/rateLimit.ts
 * Verifies sliding-window counting and retry-after calculation.
 */

import { checkRateLimit } from '@/lib/rateLimit';

// Freeze time so tests are deterministic.
const RealDate = Date;
let fakeNow = 1_700_000_000_000;

beforeEach(() => {
  fakeNow = 1_700_000_000_000;
  jest.spyOn(Date, 'now').mockImplementation(() => fakeNow);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Use a unique key per test to avoid cross-test state leakage.
let idx = 0;
const key = () => `test-key-${idx++}`;

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    const { allowed, retryAfter } = checkRateLimit(key(), 5, 60_000);
    expect(allowed).toBe(true);
    expect(retryAfter).toBe(0);
  });

  it('allows requests up to the limit', () => {
    const k = key();
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(k, 5, 60_000).allowed).toBe(true);
    }
  });

  it('blocks the request that exceeds the limit', () => {
    const k = key();
    for (let i = 0; i < 5; i++) checkRateLimit(k, 5, 60_000);
    const { allowed, retryAfter } = checkRateLimit(k, 5, 60_000);
    expect(allowed).toBe(false);
    expect(retryAfter).toBeGreaterThan(0);
  });

  it('returns correct retryAfter seconds', () => {
    const k = key();
    for (let i = 0; i < 3; i++) checkRateLimit(k, 3, 30_000);
    const { allowed, retryAfter } = checkRateLimit(k, 3, 30_000);
    expect(allowed).toBe(false);
    // Window resets 30 s after fakeNow → retryAfter should be ~30 s.
    expect(retryAfter).toBeLessThanOrEqual(30);
    expect(retryAfter).toBeGreaterThanOrEqual(29);
  });

  it('resets the window after windowMs elapses', () => {
    const k = key();
    for (let i = 0; i < 3; i++) checkRateLimit(k, 3, 60_000);
    // Advance time beyond the window.
    fakeNow += 61_000;
    const { allowed } = checkRateLimit(k, 3, 60_000);
    expect(allowed).toBe(true);
  });

  it('treats different keys independently', () => {
    const k1 = key();
    const k2 = key();
    // Exhaust k1.
    for (let i = 0; i < 3; i++) checkRateLimit(k1, 3, 60_000);
    expect(checkRateLimit(k1, 3, 60_000).allowed).toBe(false);
    // k2 should still be allowed.
    expect(checkRateLimit(k2, 3, 60_000).allowed).toBe(true);
  });

  it('allows limit=1 exactly once', () => {
    const k = key();
    expect(checkRateLimit(k, 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit(k, 1, 60_000).allowed).toBe(false);
  });
});
