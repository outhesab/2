import { } from 'react';

interface FaturaToolbarProps {
  search: string;
  setSearch: (val: string) => void;
  filter: 'all' | 'satis' | 'alis';
  setFilter: (val: 'all' | 'satis' | 'alis') => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onOpenNew: (type: 'satis' | 'alis') => void;
}

export function FaturaToolbar({
  search,
  setSearch,
  filter,
  setFilter,
  statusFilter,
  setStatusFilter,
  onOpenNew,
}: FaturaToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <button
        onClick={() => onOpenNew('satis')}
        style={{
          background: 'linear-gradient(135deg, #ff5722, #ff7043)',
          border: 'none',
          borderRadius: 10,
          color: '#fff',
          padding: '10px 18px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.88rem',
          boxShadow: '0 4px 16px rgba(255,87,34,0.3)',
        }}
      >
        + SatıÅŸ Faturası
      </button>
      <button
        onClick={() => onOpenNew('alis')}
        style={{
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 10,
          color: '#60a5fa',
          padding: '10px 18px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.88rem',
        }}
      >
        + AlıÅŸ Faturası
      </button>
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            width: 160,
          }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'satis' | 'alis')}
          style={{
            padding: '8px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            color: 'var(--text-dim)',
            fontSize: '0.82rem',
          }}
        >
          <option value="all">Tümü</option>
          <option value="satis">SatıÅŸ</option>
          <option value="alis">AlıÅŸ</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            color: 'var(--text-dim)',
            fontSize: '0.82rem',
          }}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="taslak">Taslak</option>
          <option value="onaylandi">Onaylandı</option>
          <option value="odendi">Ã–dendi</option>
          <option value="iptal">İptal</option>
        </select>
      </div>
    </div>
  );
}
