import type { FilterType } from './types';

interface BugToolbarProps {
  search: string;
  filter: FilterType;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: FilterType) => void;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tumu' },
  { key: 'critical', label: 'Kritik' },
  { key: 'fail', label: 'Basarisiz' },
  { key: 'warning', label: 'Uyari' },
  { key: 'pass', label: 'Basarili' },
];

export function BugToolbar({ search, filter, onSearchChange, onFilterChange }: BugToolbarProps) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="Test ara..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 200,
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          color: '#f1f5f9',
          fontSize: '0.85rem',
        }}
      />
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: filter === f.key ? 'rgba(255,87,34,0.2)' : 'rgba(255,255,255,0.05)',
            color: filter === f.key ? '#ff7043' : '#94a3b8',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.82rem',
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
