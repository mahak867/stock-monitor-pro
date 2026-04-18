import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const { email, symbol, condition, triggerPrice, currentPrice } = await req.json();

    if (!email || !symbol) {
      return NextResponse.json({ error: 'Missing email or symbol.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Silently succeed when Resend is not configured (dev mode)
      return NextResponse.json({ ok: true, sent: false, reason: 'RESEND_API_KEY not set' });
    }

    const resend = new Resend(apiKey);

    const direction = condition === 'above' ? '▲ above' : '▼ below';
    const { error } = await resend.emails.send({
      from: 'StockPro Alerts <alerts@stockpro.app>',
      to: [email],
      subject: `🔔 Price Alert: ${symbol} is ${condition} $${triggerPrice}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0b0d1c;color:#f1f5f9;border-radius:12px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#818cf8;">StockPro Price Alert</h2>
          <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;">Your alert has been triggered.</p>
          <div style="background:#06081a;border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:16px;margin-bottom:16px;">
            <div style="font-size:24px;font-weight:700;margin-bottom:4px;">${symbol}</div>
            <div style="font-size:14px;color:#94a3b8;">
              Current price: <strong style="color:#f1f5f9;">$${Number(currentPrice).toFixed(2)}</strong>
              has gone ${direction} your alert price of
              <strong style="color:#818cf8;">$${Number(triggerPrice).toFixed(2)}</strong>
            </div>
          </div>
          <p style="font-size:11px;color:#475569;">This is an automated alert from StockPro. Not financial advice.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
