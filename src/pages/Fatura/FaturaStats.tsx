import { } from 'react';
import { FaturaStats } from './types';

export function FaturaStatsBar({ stats }: { stats: FaturaStats }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 18,
      }}
    >
      {[
        {
          icon: '📄',
          label: 'Toplam Fatura',
          value: String(stats.total),
          color: '#3b82f6',
        },
        {
          icon: '📤',
          label: 'Satış Faturaları',
          value: stats.satisTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
          color: '#10b981',
        },
        {
          icon: '📥',
          label: 'Alış Faturaları',
          value: stats.alisTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
          color: '#f59e0b',
        },
        {
          icon: '⏳',
          label: 'Ödenmemiş',
          value: stats.unpaid.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
          color: '#ef4444',
        },
        {
          icon: '📝',
          label: 'Taslak',
          value: String(stats.draft),
          color: '#8b5cf6',
        },
      ].map((s) => (
        <div
          key={s.label}
          style={{
            background: `linear-gradient(135deg, ${s.color}12, ${s.color}06)`,
            borderRadius: 14,
            padding: '16px 18px',
            border: `1px solid ${s.color}20`,
          }}
        >
          <div style={{ fontSize: '1rem', marginBottom: 4 }}>{s.icon}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
          <div
            style={{
              color: '#475569',
              fontSize: '0.72rem',
              marginTop: 3,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
