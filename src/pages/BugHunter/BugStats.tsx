import type { BugReport } from './types';

interface BugStatsProps {
  report: BugReport;
}

export function BugStats({ report }: BugStatsProps) {
  const stats = [
    { label: 'Toplam Test', value: report.totalTests, color: 'var(--text-muted)' },
    { label: 'Basarili', value: report.passed, color: '#10b981' },
    { label: 'Basarisiz', value: report.failed, color: '#ef4444' },
    { label: 'Uyari', value: report.warnings, color: '#f59e0b' },
    { label: 'Kritik', value: report.critical, color: '#dc2626' },
    {
      label: 'Skor',
      value: `${report.score}% (${report.grade})`,
      color: report.score >= 80 ? '#10b981' : report.score >= 60 ? '#f59e0b' : '#ef4444',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
        marginTop: 16,
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
