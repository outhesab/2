import type { StatusFilter, TypeFilter, BankStatsData } from './types';

interface BankFiltersProps {
  filter: StatusFilter;
  setFilter: (f: StatusFilter) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (f: TypeFilter) => void;
  stats: BankStatsData;
  totalCount: number;
}

export function BankFilters({ filter, setFilter, typeFilter, setTypeFilter, stats, totalCount }: BankFiltersProps) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
      {(['all', 'unmatched', 'matched', 'confirmed'] as const).map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          style={{
            padding: '6px 14px',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.82rem',
            background: filter === f ? '#ff5722' : '#273548',
            color: filter === f ? '#fff' : '#94a3b8',
          }}
        >
          {f === 'all'
            ? `Tümü (${totalCount})`
            : f === 'unmatched'
              ? `⏳ Bekliyor (${stats.unmatched})`
              : f === 'matched'
                ? `🔄 Eşlendi (${stats.matched})`
                : `✓ Onaylı (${stats.confirmed})`}
        </button>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              background:
                typeFilter === f
                  ? f === 'income'
                    ? 'rgba(16,185,129,0.2)'
                    : f === 'expense'
                      ? 'rgba(239,68,68,0.2)'
                      : '#273548'
                  : 'var(--bg-card)',
              color:
                typeFilter === f ? (f === 'income' ? '#10b981' : f === 'expense' ? '#ef4444' : '#f1f5f9') : '#64748b',
            }}
          >
            {f === 'all' ? 'Tümü' : f === 'income' ? '📥 Gelen' : '📤 Giden'}
          </button>
        ))}
      </div>
    </div>
  );
}
