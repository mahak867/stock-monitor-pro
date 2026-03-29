import Stripe from 'stripe';
import { NextResponse } from 'next/server';

export async function POST() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }
  try {
    const stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: 'StockPro Premium' }, unit_amount: 1900 }, quantity: 1 }],
      mode: 'payment',
      success_url: baseUrl + '?success=true',
      cancel_url: baseUrl + '?canceled=true',
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
