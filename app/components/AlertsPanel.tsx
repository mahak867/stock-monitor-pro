"use client";
import { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { UP_COLOR, DOWN_COLOR } from './shared';

function AlertsPanel() {
  const { alerts, addAlert, removeAlert, toggleAlert } = useStore();
  const [sym, setSym] = useState('');
  const [cond, setCond] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Bell size={14} color="#f59e0b" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Price Alerts</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <input value={sym} onChange={e => setSym(e.target.value.toUpperCase())} placeholder="Symbol"
          style={{ background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={cond} onChange={e => setCond(e.target.value as 'above' | 'below')}
            style={{ flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#f1f5f9', outline: 'none' }}>
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number"
            style={{ flex: 1, background: '#06081a', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', outline: 'none' }} />
        </div>
        <button onClick={() => { if (sym && price) { addAlert({ symbol: sym, condition: cond, price: parseFloat(price), active: true }); setSym(''); setPrice(''); } }}
          style={{ padding: '8px 0', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: 9, color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
          + Set Alert
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
        {alerts.length === 0 && <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '12px 0' }}>No alerts set</p>}
        {alerts.map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#06081a', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => toggleAlert(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {a.triggered ? <AlertTriangle size={14} color="#f59e0b" /> : a.active ? <CheckCircle size={14} color={UP_COLOR} /> : <CheckCircle size={14} color="#131628" />}
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'DM Mono, monospace' }}>{a.symbol}</span>
              <span style={{ fontSize: 11, color: '#475569', fontFamily: 'DM Mono, monospace' }}>{a.condition} ${a.price}</span>
            </div>
            <button onClick={() => removeAlert(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#131628' }}
              onMouseEnter={e => (e.currentTarget.style.color = DOWN_COLOR)}
              onMouseLeave={e => (e.currentTarget.style.color = '#131628')}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export { AlertsPanel };
