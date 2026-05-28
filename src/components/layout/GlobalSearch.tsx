import { useState, useMemo, useRef, useEffect } from 'react';
import { TABS, type TabId } from '@/config/tabs';
import type { DB } from '@/types';

interface GlobalSearchProps {
  onNavigate: (tab: TabId) => void;
  db: DB;
  favoriteTabs: readonly TabId[];
}

export default function GlobalSearch({ onNavigate, db, favoriteTabs }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const res: { tab: TabId; label: string; icon: string; match: string }[] = [];
    const favoriteSet = new Set(favoriteTabs);
    TABS.forEach((t) => {
      if (t.label.toLowerCase().includes(q))
        res.push({
          tab: t.id,
          label: t.label,
          icon: t.icon,
          match: favoriteSet.has(t.id) ? 'Favori modül' : 'Modül',
        });
    });
    db.products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((p) =>
        res.push({ tab: 'products', label: p.name, icon: '📦', match: `Stok: ${p.stock} · ₺${p.price}` }),
      );
    db.cari
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((c) =>
        res.push({ tab: 'cari', label: c.name, icon: '👤', match: c.type === 'musteri' ? 'Müşteri' : 'Tedarikçi' }),
      );
    db.suppliers
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((s) => res.push({ tab: 'suppliers', label: s.name, icon: '🏭', match: 'Tedarikçi' }));
    return res
      .sort((left, right) => Number(favoriteSet.has(right.tab)) - Number(favoriteSet.has(left.tab)))
      .slice(0, 8);
  }, [query, db, favoriteTabs]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="global-search-wrap">
      <div className="global-search-inner">
        <span className="global-search-icon">🔍</span>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Ürün, müşteri, modül ara..."
          className="global-search-input"
        />
        {query && <button onClick={() => { setQuery(''); setOpen(false); }} className="global-search-clear">×</button>}
      </div>
      {open && results.length > 0 && (
        <div className="global-search-results">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { onNavigate(r.tab); setQuery(''); setOpen(false); }}
              className="global-search-item"
            >
              <span className="global-search-item-icon">{r.icon}</span>
              <div className="global-search-item-main">
                <div className="global-search-item-label">{r.label}</div>
                <div className="global-search-item-match">{r.match}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
