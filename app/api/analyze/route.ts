import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit } from '@/lib/rateLimit';

interface AnalyzeRequest {
  symbol: string;
  price: number;
  changePercent: number;
  pe?: number | null;
  eps?: number | null;
  beta?: number | null;
  roe?: number | null;
  weekLow52?: number | null;
  weekHigh52?: number | null;
  apiKey?: string;
}

/** Only allow symbols that look like real tickers: alphanumeric, colon, period, hyphen. */
const SYMBOL_RE = /^[A-Za-z0-9.:/-]{1,24}$/;

export async function POST(req: NextRequest) {
  const { userId } = await auth.protect();

  // 20 analysis calls per user per minute to prevent accidental/intentional abuse.
  const rl = checkRateLimit(`analyze:${userId}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before analysing again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { symbol, price, changePercent, pe, eps, beta, roe, weekLow52, weekHigh52, apiKey } = body;

  if (!symbol || typeof price !== 'number') {
    return NextResponse.json({ error: 'symbol and price are required' }, { status: 400 });
  }
  if (!SYMBOL_RE.test(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol format' }, { status: 400 });
  }

  // Use server-side key if configured, otherwise fall back to the user-supplied key.
  const anthropicKey = process.env.ANTHROPIC_API_KEY || apiKey;
  if (!anthropicKey) {
    return NextResponse.json({ error: 'No Anthropic API key configured' }, { status: 503 });
  }

  const prompt = `Analyze ${symbol}: Price $${price.toFixed(2)}, Change ${changePercent.toFixed(2)}%, P/E ${pe?.toFixed(1) ?? 'N/A'}, EPS $${eps?.toFixed(2) ?? 'N/A'}, Beta ${beta?.toFixed(2) ?? 'N/A'}, ROE ${roe?.toFixed(1) ?? 'N/A'}%, 52W Range $${(weekLow52 ?? 0).toFixed(2)}-$${(weekHigh52 ?? 0).toFixed(2)}.

Write a 3-paragraph analyst note: (1) technical momentum, (2) fundamental valuation, (3) key risks. Max 180 words. Plain text only, no headers or bullets.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 350,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Anthropic API error:', res.status, errorBody);
      return NextResponse.json(
        { error: `Anthropic API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? 'Analysis unavailable.';
    return NextResponse.json({ analysis: text });
  } catch (err) {
    console.error('Failed to reach Anthropic API:', err);
    return NextResponse.json({ error: 'Unable to connect to Claude.' }, { status: 502 });
  }
}
