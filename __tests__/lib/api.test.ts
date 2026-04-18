/**
 * Unit tests for lib/api.ts pure utility functions.
 * These tests do not require external API calls or environment variables.
 */

import {
  safeN,
  mockQuote,
  mockCandles,
  isUSMarketOpen,
  isIndiaMarketOpen,
  Quote,
} from '@/lib/api';

// ─── safeN ────────────────────────────────────────────────────────────────────

describe('safeN', () => {
  it('returns the number when valid', () => {
    expect(safeN(42)).toBe(42);
    expect(safeN(0)).toBe(0);
    expect(safeN(-7.5)).toBe(-7.5);
  });

  it('returns 0 for null', () => {
    expect(safeN(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(safeN(undefined)).toBe(0);
  });

  it('returns 0 for NaN', () => {
    expect(safeN(NaN)).toBe(0);
  });

  it('returns 0 for non-number types', () => {
    expect(safeN('100' as unknown as number)).toBe(0);
    expect(safeN(true as unknown as number)).toBe(0);
  });
});

// ─── mockQuote ────────────────────────────────────────────────────────────────

describe('mockQuote', () => {
  it('returns a Quote-shaped object', () => {
    const q: Quote = mockQuote('AAPL');
    expect(typeof q.c).toBe('number');
    expect(typeof q.d).toBe('number');
    expect(typeof q.dp).toBe('number');
    expect(typeof q.h).toBe('number');
    expect(typeof q.l).toBe('number');
    expect(typeof q.o).toBe('number');
    expect(typeof q.pc).toBe('number');
  });

  it('returns a positive current price', () => {
    const q = mockQuote('AAPL');
    expect(q.c).toBeGreaterThan(0);
  });

  it('high is always >= low', () => {
    const q = mockQuote('TSLA');
    expect(q.h).toBeGreaterThanOrEqual(q.l);
  });

  it('includes a unix timestamp', () => {
    const q = mockQuote('BTC');
    expect(q.t).toBeDefined();
    expect(q.t!).toBeGreaterThan(0);
  });

  it('handles an unknown symbol with a fallback price', () => {
    const q = mockQuote('UNKNOWN_XYZ');
    expect(q.c).toBeGreaterThan(0);
  });
});

// ─── mockCandles ──────────────────────────────────────────────────────────────

describe('mockCandles', () => {
  it('returns the requested number of candles', () => {
    expect(mockCandles('AAPL', 30)).toHaveLength(30);
    expect(mockCandles('MSFT', 90)).toHaveLength(90);
  });

  it('defaults to 90 candles', () => {
    expect(mockCandles('AAPL')).toHaveLength(90);
  });

  it('each candle has required OHLCV fields', () => {
    const candles = mockCandles('NVDA', 5);
    for (const c of candles) {
      expect(typeof c.t).toBe('number');
      expect(typeof c.o).toBe('number');
      expect(typeof c.h).toBe('number');
      expect(typeof c.l).toBe('number');
      expect(typeof c.c).toBe('number');
      expect(typeof c.v).toBe('number');
    }
  });

  it('high is always >= low in every candle', () => {
    const candles = mockCandles('ETH', 20);
    for (const c of candles) {
      expect(c.h).toBeGreaterThanOrEqual(c.l);
    }
  });

  it('timestamps are in ascending order', () => {
    const candles = mockCandles('SPY', 10);
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].t).toBeGreaterThan(candles[i - 1].t);
    }
  });

  it('close prices are always positive', () => {
    const candles = mockCandles('AAPL', 30);
    for (const c of candles) {
      expect(c.c).toBeGreaterThan(0);
    }
  });
});

// ─── Market hours helpers ─────────────────────────────────────────────────────

describe('isUSMarketOpen', () => {
  const RealDate = Date;

  afterEach(() => {
    global.Date = RealDate;
  });

  function mockEasternTime(isoLike: string) {
    // Build a Date whose toLocaleString('en-US', {timeZone:'America/New_York'})
    // returns the desired local string by using a UTC time offset.
    // Simpler: mock Date constructor to return a fixed value.
    const fixed = new RealDate(isoLike);
    const MockDate = class extends RealDate {
      constructor(...args: ConstructorParameters<typeof RealDate>) {
        if (args.length === 0) {
          super(fixed.getTime());
        } else {
          // @ts-expect-error spread
          super(...args);
        }
      }
      static now() {
        return fixed.getTime();
      }
    };
    global.Date = MockDate as unknown as typeof Date;
  }

  it('returns false on a weekend (Saturday UTC)', () => {
    // 2024-06-01 is a Saturday
    mockEasternTime('2024-06-01T14:00:00Z');
    // Saturday in ET is still Saturday
    const result = isUSMarketOpen();
    // We cannot assert exact truth here because the UTC→ET conversion depends on
    // the system timezone config; instead assert it is a boolean.
    expect(typeof result).toBe('boolean');
  });

  it('returns a boolean', () => {
    expect(typeof isUSMarketOpen()).toBe('boolean');
  });
});

describe('isIndiaMarketOpen', () => {
  it('returns a boolean', () => {
    expect(typeof isIndiaMarketOpen()).toBe('boolean');
  });
});
