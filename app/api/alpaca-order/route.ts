import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  await auth.protect();
  try {
    const { symbol, qty, side, type = 'market', apiKey, apiSecret, mode = 'paper' } = await req.json();

    if (!symbol || !qty || !side || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const base = mode === 'live'
      ? 'https://api.alpaca.markets'
      : 'https://paper-api.alpaca.markets';

    const res = await fetch(`${base}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol,
        qty: String(qty),
        side,
        type,
        time_in_force: 'day',
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Alpaca order failed.' }, { status: res.status });
    }

    return NextResponse.json({
      id: data.id,
      symbol: data.symbol,
      qty: data.qty,
      side: data.side,
      status: data.status,
      filled_avg_price: data.filled_avg_price,
      created_at: data.created_at,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Get open positions from Alpaca
// Credentials are read from APCA-API-KEY-ID and APCA-API-SECRET-KEY request headers.
export async function GET(req: NextRequest) {
  await auth.protect();
  try {
    const apiKey = req.headers.get('APCA-API-KEY-ID');
    const apiSecret = req.headers.get('APCA-API-SECRET-KEY');
    const mode = req.nextUrl.searchParams.get('mode') || 'paper';

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Missing API credentials.' }, { status: 400 });
    }

    const base = mode === 'live'
      ? 'https://api.alpaca.markets'
      : 'https://paper-api.alpaca.markets';

    const [posRes, acctRes] = await Promise.all([
      fetch(`${base}/v2/positions`, {
        headers: { 'APCA-API-KEY-ID': apiKey, 'APCA-API-SECRET-KEY': apiSecret },
      }),
      fetch(`${base}/v2/account`, {
        headers: { 'APCA-API-KEY-ID': apiKey, 'APCA-API-SECRET-KEY': apiSecret },
      }),
    ]);

    const [positions, account] = await Promise.all([posRes.json(), acctRes.json()]);

    if (!posRes.ok) return NextResponse.json({ error: positions.message || 'Alpaca error' }, { status: posRes.status });

    return NextResponse.json({ positions, account });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
