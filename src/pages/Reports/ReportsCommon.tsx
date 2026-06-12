import React from 'react';

export const COLORS = ['#ff5722', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
export const TT_STYLE = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
};
export const CARD = {
  background: 'linear-gradient(135deg,#1a2740,#0f1e35)',
  borderRadius: 14,
  padding: '16px 18px',
  border: '1px solid rgba(255,255,255,0.07)',
};

export function EmptyChart() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 160,
        color: '#334155',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span style={{ fontSize: '2rem', opacity: 0.3 }}>📊</span>
      <span style={{ fontSize: '0.82rem' }}>Veri yok</span>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: string;
}) {
  return (
    <div style={{ ...CARD, borderColor: `${color}25` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
        <span
          style={{
            fontSize: '0.68rem',
            color: color,
            background: `${color}18`,
            padding: '2px 8px',
            borderRadius: 20,
            fontWeight: 700,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          color,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function SectionBox({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#111e33',
        borderRadius: 14,
        padding: 20,
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            margin: 0,
          }}
        >
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}
