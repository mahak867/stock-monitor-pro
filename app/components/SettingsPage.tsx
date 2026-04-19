"use client";
import { useState } from 'react';
import { Brain, Activity, Mail, CheckCircle, CreditCard, AlertTriangle } from 'lucide-react';
import { useStore } from '../../lib/store';
import { UP_COLOR, BLUE } from './shared';

function SettingsPage() {
  const { claudeKey, setClaudeKey, alpacaKey, setAlpacaKey, alpacaSecret, setAlpacaSecret, alpacaMode, setAlpacaMode, notifyEmail, setNotifyEmail } = useStore();
  const [k, setK] = useState(claudeKey);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [aKey, setAKey] = useState(alpacaKey);
  const [aSecret, setASecret] = useState(alpacaSecret);
  const [alpacaSaved, setAlpacaSaved] = useState(false);
  const [emailInput, setEmailInput] = useState(notifyEmail);
  const [emailSaved, setEmailSaved] = useState(false);

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const r = await fetch('/api/checkout', { method: 'POST' });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
    } catch { alert('Payment unavailable.'); }
    finally { setUpgrading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      {/* Claude AI */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Brain size={16} color="#6366f1" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Claude AI Integration</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
          Connect your Anthropic API key to get real-time AI analysis for any stock directly in the dashboard. Your key is stored only in your browser.
        </p>
        <input type="password" value={k} onChange={e => setK(e.target.value)}
          placeholder="sk-ant-api03-..."
          style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, marginBottom: 10,
          padding: '7px 10px', background: 'rgba(99,102,241,0.06)', borderRadius: 7,
          border: '1px solid rgba(99,102,241,0.12)' }}>
          🔒 Your API key is stored in your browser (localStorage). Never share it or use on an untrusted or shared device.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setClaudeKey(k); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            style={{ flex: 1, padding: '9px 0', background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: saved ? UP_COLOR : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saved ? '\u2713 Saved' : 'Save API Key'}
          </button>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 0', background: 'rgba(99,102,241,0.12)', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Get API Key \u2197
          </a>
        </div>
        {claudeKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: UP_COLOR }}>
            <CheckCircle size={13} /> Claude AI connected
          </div>
        )}
      </div>

      {/* Alpaca Brokerage */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Activity size={15} color="#10b981" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Alpaca Brokerage</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: alpacaKey ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
            color: alpacaKey ? '#10b981' : '#475569',
            border: `1px solid ${alpacaKey ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
          }}>{alpacaKey ? '\u25cf Connected' : '\u25cb Not connected'}</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
          Connect Alpaca to execute real trades. Paper trading is risk-free. Your keys are stored only in your browser.
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['paper', 'live'] as const).map(m => (
            <button key={m} onClick={() => setAlpacaMode(m)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: alpacaMode === m ? (m === 'live' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.12)') : '#06081a',
                color: alpacaMode === m ? (m === 'live' ? '#f43f5e' : '#f59e0b') : '#475569',
                border: `1px solid ${alpacaMode === m ? (m === 'live' ? 'rgba(244,63,94,0.30)' : 'rgba(245,158,11,0.25)') : 'rgba(99,102,241,0.10)'}`,
              }}>{m === 'live' ? '\u26a1 Live Trading' : '\ud83d\udccb Paper Trading'}</button>
          ))}
        </div>
        {alpacaMode === 'live' && (
          <div style={{ marginBottom: 12, padding: '12px 14px', background: 'rgba(244,63,94,0.10)', border: '2px solid rgba(244,63,94,0.40)', borderRadius: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={14} color='#f43f5e' />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#f43f5e', letterSpacing: '0.04em' }}>
                ⚠️ WARNING: Live Trading Mode
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.6, margin: 0 }}>
              <strong>Live mode uses REAL money.</strong> Orders placed will execute on your actual Alpaca brokerage account.
              Your Alpaca API keys are stored in browser localStorage — never use on a shared or public device.
              Paper trading is strongly recommended for most users.
            </p>
          </div>
        )}
        <input type="password" value={aKey} onChange={e => setAKey(e.target.value)}
          placeholder="Alpaca API Key ID"
          style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
        <input type="password" value={aSecret} onChange={e => setASecret(e.target.value)}
          placeholder="Alpaca Secret Key"
          style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setAlpacaKey(aKey); setAlpacaSecret(aSecret); setAlpacaSaved(true); setTimeout(() => setAlpacaSaved(false), 2000); }}
            style={{ flex: 1, padding: '9px 0', background: alpacaSaved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, color: alpacaSaved ? UP_COLOR : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {alpacaSaved ? '\u2713 Saved' : 'Save Alpaca Keys'}
          </button>
          <a href="https://alpaca.markets/docs/api-references/trading-api/" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 0', background: 'rgba(99,102,241,0.12)', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Get Alpaca Keys \u2197
          </a>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Mail size={15} color="#f59e0b" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Email Price Alerts</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: notifyEmail ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.08)',
            color: notifyEmail ? '#10b981' : '#475569',
            border: `1px solid ${notifyEmail ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)'}`,
          }}>{notifyEmail ? '\u25cf Active' : '\u25cb Off'}</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
          Get email notifications when your price alerts trigger. Requires <code style={{ background: '#06081a', padding: '1px 5px', borderRadius: 4, fontSize: 11, color: '#818cf8' }}>RESEND_API_KEY</code> to be set on the server.
        </p>
        <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
          placeholder="you@example.com"
          style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <button onClick={() => { setNotifyEmail(emailInput); setEmailSaved(true); setTimeout(() => setEmailSaved(false), 2000); }}
          style={{ width: '100%', padding: '9px 0', background: emailSaved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 8, color: emailSaved ? UP_COLOR : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {emailSaved ? '\u2713 Saved' : 'Save Email'}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>StockPro Premium</div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Upgrade for real-time streaming, unlimited alerts, and priority Claude analysis.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {['Real-time quotes', 'Unlimited alerts', 'Options chain', 'CSV export', 'Advanced screener', 'Priority AI'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
              <CheckCircle size={12} color={UP_COLOR} /> {f}
            </div>
          ))}
        </div>
        <button onClick={upgrade} disabled={upgrading} className="btn-primary" style={{ width: '100%', padding: '10px 0' }}>
          <CreditCard size={14} style={{ display: 'inline', marginRight: 6 }} />
          {upgrading ? 'Redirecting...' : 'Upgrade \u2014 $19/month'}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Data Sources</div>
        {[
          { name: 'Finnhub', desc: 'Real-time quotes, fundamentals, news', status: 'Active', link: 'https://finnhub.io' },
          { name: 'Anthropic Claude', desc: 'AI-powered stock analysis', status: claudeKey ? 'Connected' : 'Not connected', link: 'https://console.anthropic.com' },
          { name: 'Alpaca Markets', desc: 'Brokerage & order execution', status: alpacaKey ? `Connected (${alpacaMode})` : 'Not connected', link: 'https://alpaca.markets' },
        ].map(({ name, desc, status, link }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{name}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: status === 'Active' || status.startsWith('Connected') ? UP_COLOR : '#475569' }}>{status}</span>
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: BLUE }}>Manage \u2197</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { SettingsPage };
