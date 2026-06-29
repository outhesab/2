import styles from './FaturaToolbar.module.css';

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
    <div className={styles.toolbar}>
      <button onClick={() => onOpenNew('satis')} className={styles.satisBtn}>
        + SatıÅŸ Faturası
      </button>
      <button onClick={() => onOpenNew('alis')} className={styles.alisBtn}>
        + AlıÅŸ Faturası
      </button>
      <div className={styles.rightSection}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className={styles.searchInput}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'satis' | 'alis')}
          className={styles.filterSelect}
        >
          <option value="all">Tümü</option>
          <option value="satis">SatıÅŸ</option>
          <option value="alis">AlıÅŸ</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filterSelect}>
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
