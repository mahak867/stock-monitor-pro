import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit } from '@/lib/rateLimit';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }
interface PortfolioItem { symbol: string; name: string; quantity: number; avgPrice: number; currentPrice: number; }
interface WatchItem { symbol: string; name: string; }

interface TradeRequest {
  messages: ChatMessage[];
  portfolio: PortfolioItem[];
  watchlist: WatchItem[];
  balance: number;
  apiKey?: string;
}

/** Maximum total character length across all messages to cap token cost. */
const MAX_MESSAGES = 40;
const MAX_MSG_CHARS = 20_000;

function buildSystemPrompt(portfolio: PortfolioItem[], watchlist: WatchItem[], balance: number): string {
  const portfolioStr =
    portfolio.length === 0
      ? 'Empty — no positions currently held.'
      : portfolio
          .map((p) => {
            const cur = p.currentPrice || p.avgPrice;
            const value = cur * p.quantity;
            const pnl = (cur - p.avgPrice) * p.quantity;
            const pnlPct = p.avgPrice ? ((cur - p.avgPrice) / p.avgPrice) * 100 : 0;
            return `  • ${p.symbol}: ${p.quantity} shares @ $${p.avgPrice.toFixed(2)} avg cost | Current: $${cur.toFixed(2)} | Value: $${value.toFixed(0)} | P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)`;
          })
          .join('\n');

  const watchlistStr =
    watchlist.length === 0 ? 'Empty.' : watchlist.map((w) => `  • ${w.symbol} (${w.name})`).join('\n');

  const totalValue = portfolio.reduce((s, p) => s + (p.currentPrice || p.avgPrice) * p.quantity, 0);

  return `You are an expert AI stock trading assistant embedded in StockPro, a professional investment platform. You have full visibility of the user's paper-trading portfolio.

PORTFOLIO (simulated paper trading):
${portfolioStr}

TOTAL PORTFOLIO VALUE: $${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
AVAILABLE CASH: $${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}

WATCHLIST:
${watchlistStr}

YOUR CAPABILITIES:
1. Analyze any stock — technicals, fundamentals, momentum, valuation
2. Review the portfolio and suggest rebalancing or risk management
3. Recommend and simulate BUY/SELL orders (paper trading only)
4. Set up price monitoring alerts via MONITOR actions
5. Compare stocks, sectors, or ETFs
6. Explain market events and their portfolio impact

STRUCTURED ACTION FORMAT:
When recommending or executing a trade, append ONE of these blocks at the very end of your message (after your explanation):

For a buy order:
<trade>{"action":"BUY","symbol":"AAPL","quantity":5,"price":171.00,"reason":"Short reason for the trade"}</trade>

For a sell order:
<trade>{"action":"SELL","symbol":"AAPL","quantity":3,"price":185.00,"reason":"Short reason"}</trade>

For a price alert (to monitor a stock):
<monitor>{"symbol":"TSLA","condition":"above","price":280.00,"reason":"Breakout above resistance"}</monitor>

RULES:
- Only include a <trade> or <monitor> block when the user explicitly asks to buy/sell/monitor, or when you identify a clear actionable opportunity
- For SELL: quantity must not exceed what the user currently holds
- For BUY: total cost must not exceed available cash
- For pure analysis questions, respond with text only (no blocks)
- This is PAPER/SIMULATED trading only — always make this clear when discussing trades
- Be concise but thorough. Lead with the most important insight.`;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth.protect();

  // 30 AI chat messages per user per minute.
  const rl = checkRateLimit(`claude-trade:${userId}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before sending another message.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: TradeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, portfolio, watchlist, balance, apiKey } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: `Message history too long (max ${MAX_MESSAGES})` }, { status: 400 });
  }
  const totalChars = messages.reduce((s, m) => s + (m.content?.length ?? 0), 0);
  if (totalChars > MAX_MSG_CHARS) {
    return NextResponse.json({ error: 'Message content exceeds maximum allowed length' }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY || apiKey;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: 'No Anthropic API key configured. Add your key in Settings → Claude AI Integration.' },
      { status: 503 }
    );
  }

  const systemPrompt = buildSystemPrompt(portfolio || [], watchlist || [], balance ?? 0);

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
        max_tokens: 900,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Anthropic API error:', res.status, errorBody);
      return NextResponse.json({ error: `Anthropic API returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const fullText: string = data.content?.[0]?.text ?? '';

    // Extract optional structured action blocks
    const tradeMatch = fullText.match(/<trade>([\s\S]*?)<\/trade>/);
    const monitorMatch = fullText.match(/<monitor>([\s\S]*?)<\/monitor>/);

    let trade: object | null = null;
    let monitor: object | null = null;
    let reply = fullText
      .replace(/<trade>[\s\S]*?<\/trade>/, '')
      .replace(/<monitor>[\s\S]*?<\/monitor>/, '')
      .trim();

    if (tradeMatch) {
      try { trade = JSON.parse(tradeMatch[1].trim()); } catch { /* malformed — skip */ }
    }
    if (monitorMatch) {
      try { monitor = JSON.parse(monitorMatch[1].trim()); } catch { /* malformed — skip */ }
    }

    return NextResponse.json({ reply, trade, monitor });
  } catch (err) {
    console.error('Failed to reach Anthropic API:', err);
    return NextResponse.json({ error: 'Unable to connect to Claude.' }, { status: 502 });
  }
}
