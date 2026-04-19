"use client";
import { useState } from 'react';
import { Brain, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';
import { getClaudeAnalysis, type Quote, type Metrics } from '../../lib/api';
import { BLUE } from './shared';

function ClaudePanel({ symbol, quote, metrics }: { symbol: string; quote: Quote | null; metrics: Metrics | null }) {
  const { claudeKey, setClaudeKey } = useStore();
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyInput, setKeyInput] = useState(claudeKey);
  const [editing, setEditing] = useState(false);

  const run = async () => {
    if (!claudeKey || !quote) return;
    setLoading(true); setAnalysis('');
    const r = await getClaudeAnalysis(claudeKey, symbol, quote, metrics);
    setAnalysis(r); setLoading(false);
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={15} color="#6366f1" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Claude AI Analysis</span>
        </div>
        <button onClick={() => setEditing(!editing)}
          style={{ fontSize: 11, color: BLUE, background: 'none', border: 'none', cursor: 'pointer' }}>
          {claudeKey ? 'Change key' : 'Add API key'}
        </button>
      </div>

      {editing && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
            Your Anthropic API key. Stored in your browser, never on our servers.
          </p>
          <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
            placeholder="sk-ant-..."
            style={{ width: '100%', background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => { setClaudeKey(keyInput); setEditing(false); }}
              style={{ flex: 1, padding: '7px 0', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}>
              Save
            </button>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: '7px 0', background: 'rgba(99,102,241,0.12)', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'block' }}>
              Get key 
            </a>
          </div>
        </div>
      )}

      {!claudeKey && !editing ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 13 }}>
          <Brain size={28} color="#131628" style={{ margin: '0 auto 8px' }} />
          <p>Add your Claude API key to get AI stock analysis</p>
        </div>
      ) : claudeKey && !editing && (
        <button onClick={run} disabled={loading || !quote}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: loading ? 'rgba(99,102,241,0.10)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, opacity: loading || !quote ? 0.7 : 1,
          }}>
          {loading ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Zap size={13} /> Analyze {symbol}</>}
        </button>
      )}

      {analysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginTop: 12, padding: '12px 14px', background: '#06081a', borderRadius: 8, border: '1px solid rgba(99,102,241,0.12)' }}>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>{analysis}</p>
        </motion.div>
      )}
    </div>
  );
}

export { ClaudePanel };
