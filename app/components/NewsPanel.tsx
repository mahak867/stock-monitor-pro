"use client";
import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { type NewsItem, getNews, safeN } from '../../lib/api';
import { UP_COLOR, DOWN_COLOR, timeAgo } from './shared';

function NewsPanel({ symbol }: { symbol?: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  useEffect(() => {
    setLoading(true);
    getNews(symbol).then(d => { setNews(d); setLoading(false); });
  }, [symbol]);

  const shown = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
          {symbol ? symbol.replace('NSE:', '') + ' News' : 'Market News'}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'positive', 'negative'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: 'none', textTransform: 'capitalize',
                background: filter === f ? (f === 'positive' ? 'rgba(34,197,94,0.15)' : f === 'negative' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.12)') : 'transparent',
                color: filter === f ? (f === 'positive' ? UP_COLOR : f === 'negative' ? DOWN_COLOR : '#94a3b8') : '#475569',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 360, overflowY: 'auto' }}>
          {shown.map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 8px', borderRadius: 8, textDecoration: 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0b0d1c')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {item.sentiment === 'positive' ? <ArrowUpRight size={13} color={UP_COLOR} /> :
                  item.sentiment === 'negative' ? <ArrowDownRight size={13} color={DOWN_COLOR} /> :
                    <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#131628' }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.headline}
                </p>
                <p style={{ fontSize: 10, color: '#475569', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>
                  {item.source} · {timeAgo(item.datetime)}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export { NewsPanel };
