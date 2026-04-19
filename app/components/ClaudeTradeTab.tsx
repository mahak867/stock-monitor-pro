"use client";
import { useState, useEffect, useRef } from 'react';
import {
  Bot, RefreshCw, Send, AlertTriangle, CheckCircle, X,
} from 'lucide-react';
import { Bell } from 'lucide-react';
import { useStore } from '../../lib/store';
import { UP_COLOR, DOWN_COLOR, BLUE } from './shared';

interface TradeAction {
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  quantity: number;
  price: number;
  reason: string;
}
interface MonitorAction {
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  reason: string;
}
interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  trade?: TradeAction;
  monitor?: MonitorAction;
  actionStatus?: 'pending' | 'executed' | 'rejected';
}

// ─── Claude AI Trade Assistant tab ──────────────────────────────────────────
function ClaudeTradeTab({ onSelect }: { onSelect: (s: string) => void }) {
  const { claudeKey, portfolio, watchlist, balance, addPosition, sellPosition, addAlert } = useStore();
  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: 'assistant',
    content: "Hi! I'm your AI trade assistant. I can analyze stocks, review your portfolio, and execute paper trades.\n\nTry asking me:\n• \"Analyze NVDA and should I buy?\"\n• \"Review my portfolio risks\"\n• \"Buy 5 shares of AAPL\"\n• \"Set a price alert for TSLA above $280\"",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg: ChatMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Build message history (only role+content, no UI fields)
    const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/claude-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, portfolio, watchlist, balance, apiKey: claudeKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'An error occurred.' }]);
      } else {
        const hasAction = data.trade || data.monitor;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          trade: data.trade ?? undefined,
          monitor: data.monitor ?? undefined,
          actionStatus: hasAction ? 'pending' : undefined,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to reach Claude. Check your API key in Settings.' }]);
    }
    setLoading(false);
  };

  const executeAction = (idx: number, confirm: boolean) => {
    const msg = messages[idx];
    if (msg.actionStatus !== 'pending') return;

    if (confirm) {
      if (msg.trade && msg.trade.action !== 'HOLD') {
        const t = msg.trade;
        if (t.action === 'BUY') {
          addPosition({ symbol: t.symbol, name: t.symbol, quantity: t.quantity, avgPrice: t.price, currentPrice: t.price });
        } else if (t.action === 'SELL') {
          sellPosition(t.symbol, t.quantity, t.price);
        }
      }
      if (msg.monitor) {
        const m = msg.monitor;
        addAlert({ symbol: m.symbol, condition: m.condition, price: m.price, active: true });
      }
    }
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, actionStatus: confirm ? 'executed' : 'rejected' } : m));
  };

  const QUICK_PROMPTS = [
    "Review my portfolio and suggest improvements",
    "What are the top momentum stocks today?",
    "Analyze risk in my current positions",
    "Find undervalued tech stocks to buy",
    "What should I sell based on my portfolio?",
    "Explain today\'s market conditions",
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, height: 'calc(100vh - 176px)', minHeight: 0 }}>
      {/* Chat panel */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(99,102,241,0.10)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(99,102,241,0.30)' }}>
            <Bot size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Claude AI Trade Assistant</span>
          <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 'auto', padding: '3px 9px', borderRadius: 20, letterSpacing: '0.04em',
            background: claudeKey ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
            color: claudeKey ? '#10b981' : '#475569',
            border: `1px solid ${claudeKey ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
          }}>
            {claudeKey ? ' Live' : '○ No API Key'}
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {/* Bubble */}
              <div style={{
                maxWidth: '82%', padding: '10px 14px', fontSize: 13, color: '#f1f5f9', lineHeight: 1.65, whiteSpace: 'pre-wrap',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(11,13,28,0.90)',
                border: msg.role === 'assistant' ? '1px solid rgba(99,102,241,0.12)' : 'none',
              }}>{msg.content}</div>

              {/* Trade card */}
              {(msg.trade || msg.monitor) && (
                <div style={{
                  maxWidth: '82%', width: '100%',
                  background: 'rgba(6,8,26,0.97)',
                  border: `1px solid ${msg.trade?.action === 'BUY' ? 'rgba(16,185,129,0.25)' : msg.trade?.action === 'SELL' ? 'rgba(244,63,94,0.25)' : 'rgba(99,102,241,0.25)'}`,
                  borderRadius: 12, padding: '13px 15px',
                }}>
                  {msg.trade && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, letterSpacing: '0.07em',
                          background: msg.trade.action === 'BUY' ? 'rgba(16,185,129,0.15)' : msg.trade.action === 'SELL' ? 'rgba(244,63,94,0.15)' : 'rgba(99,102,241,0.15)',
                          color: msg.trade.action === 'BUY' ? UP_COLOR : msg.trade.action === 'SELL' ? DOWN_COLOR : BLUE,
                        }}>{msg.trade.action}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{msg.trade.symbol}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>
                          {msg.trade.quantity} shares @ ${msg.trade.price.toFixed(2)}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginLeft: 'auto', fontFamily: 'DM Mono, monospace' }}>
                          ≈${(msg.trade.quantity * msg.trade.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </>
                  )}
                  {msg.monitor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, letterSpacing: '0.07em', background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        ALERT
                      </span>
                      <Bell size={12} color="#f59e0b" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{msg.monitor.symbol}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>
                        {msg.monitor.condition} ${msg.monitor.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10, lineHeight: 1.5 }}>
                    {msg.trade?.reason || msg.monitor?.reason}
                  </p>
                  {msg.actionStatus === 'pending' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => executeAction(i, true)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          background: msg.trade ? (msg.trade.action === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)') : 'rgba(245,158,11,0.12)',
                          border: `1px solid ${msg.trade ? (msg.trade.action === 'BUY' ? 'rgba(16,185,129,0.30)' : 'rgba(244,63,94,0.30)') : 'rgba(245,158,11,0.25)'}`,
                          color: msg.trade ? (msg.trade.action === 'BUY' ? UP_COLOR : DOWN_COLOR) : '#f59e0b',
                        }}>
                        ✓ {msg.trade ? `Execute ${msg.trade.action}` : 'Set Alert'}
                      </button>
                      <button onClick={() => executeAction(i, false)}
                        style={{ padding: '8px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 8, color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: msg.actionStatus === 'executed' ? UP_COLOR : '#475569' }}>
                      {msg.actionStatus === 'executed' ? <CheckCircle size={12} /> : <X size={12} />}
                      {msg.actionStatus === 'executed' ? (msg.trade ? 'Trade executed (paper)' : 'Alert set') : 'Dismissed'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: 'rgba(11,13,28,0.9)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '14px 14px 14px 4px', alignSelf: 'flex-start' }}>
              <RefreshCw size={12} color={BLUE} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>Claude is thinking…</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(99,102,241,0.10)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={claudeKey ? 'Ask Claude to analyze, monitor, or trade…' : 'Add Claude API key in Settings to enable AI trading'}
              disabled={!claudeKey || loading}
              rows={2}
              style={{
                flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 10,
                padding: '9px 13px', fontSize: 13, color: '#f1f5f9', fontFamily: 'Inter, sans-serif',
                outline: 'none', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box',
                opacity: (claudeKey && !loading) ? 1 : 0.55, transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.40)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.14)')}
            />
            <button onClick={() => send()}
              disabled={!claudeKey || !input.trim() || loading}
              style={{
                padding: '9px 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
                borderRadius: 10, color: '#fff', cursor: 'pointer', flexShrink: 0,
                opacity: (claudeKey && input.trim() && !loading) ? 1 : 0.45,
                transition: 'opacity 0.15s', boxShadow: '0 0 14px rgba(99,102,241,0.28)',
              }}>
              <Send size={14} />
            </button>
          </div>
          <p style={{ fontSize: 10, color: '#2d3a52', marginTop: 5, fontFamily: 'DM Mono, monospace' }}>
            Enter to send · Shift+Enter for newline · Simulated paper trading only
          </p>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        {/* Quick prompts */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Quick Prompts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {QUICK_PROMPTS.map(q => (
              <button key={q} onClick={() => send(q)}
                style={{
                  padding: '8px 12px', background: '#06081a', border: '1px solid rgba(99,102,241,0.10)',
                  borderRadius: 8, color: '#64748b', fontSize: 11, cursor: 'pointer',
                  textAlign: 'left', lineHeight: 1.4, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.30)'; e.currentTarget.style.color = '#94a3b8'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.10)'; e.currentTarget.style.color = '#64748b'; }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio context Claude sees */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Claude&apos;s Context
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Cash Available', val: `$${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
              { label: 'Positions', val: String(portfolio.length) },
              { label: 'Watchlist Items', val: String(watchlist.length) },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
                <span style={{ color: '#475569' }}>{label}</span>
                <span style={{ color: '#f1f5f9', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
          {portfolio.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {portfolio.map(p => {
                const cur = p.currentPrice || p.avgPrice;
                const pnl = (cur - p.avgPrice) * p.quantity;
                const up = pnl >= 0;
                return (
                  <div key={p.symbol} onClick={() => onSelect(p.symbol)}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#06081a', borderRadius: 7, cursor: 'pointer', border: '1px solid transparent', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', fontFamily: 'DM Mono, monospace' }}>{p.symbol}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: up ? UP_COLOR : DOWN_COLOR, fontFamily: 'DM Mono, monospace' }}>
                        {up ? '+' : ''}${Math.abs(pnl).toFixed(0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <AlertTriangle size={11} color="#f59e0b" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>DISCLAIMER</span>
          </div>
          <p style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            All trades are simulated paper trading only. Claude AI analysis is not financial advice. Do not make real investment decisions based on this tool.
          </p>
        </div>
      </div>
    </div>
  );
}

export { ClaudeTradeTab };
