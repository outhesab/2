import type { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useState, useMemo, useRef, useEffect, useDeferredValue } from 'react';
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
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    if (!deferredQuery.trim() || deferredQuery.length < 2) return [];
    const q = deferredQuery.toLowerCase();
    const res: { tab: TabId; label: string; icon: LucideIcon; match: string }[] = [];
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

    // Performans için limitli döngüler
    let pCount = 0;
    for (const p of db.products) {
      if (pCount >= 3) break;
      if (p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)) {
        const icon = TABS.find((tab) => tab.id === 'products')?.icon ?? TABS[0].icon;
        res.push({ tab: 'products', label: p.name, icon, match: `Stok: ${p.stock} · ${formatCurrency(p.price)}` });
        pCount++;
      }
    }

    let cCount = 0;
    for (const c of db.cari) {
      if (cCount >= 3) break;
      if (c.name.toLowerCase().includes(q)) {
        const icon = TABS.find((tab) => tab.id === 'cari')?.icon ?? TABS[0].icon;
        res.push({ tab: 'cari', label: c.name, icon, match: c.type === 'musteri' ? 'Müşteri' : 'Tedarikçi' });
        cCount++;
      }
    }

    let sCount = 0;
    for (const s of db.suppliers) {
      if (sCount >= 2) break;
      if (s.name.toLowerCase().includes(q)) {
        const icon = TABS.find((tab) => tab.id === 'suppliers')?.icon ?? TABS[0].icon;
        res.push({ tab: 'suppliers', label: s.name, icon, match: 'Tedarikçi' });
        sCount++;
      }
    }

    return res
      .sort((left, right) => Number(favoriteSet.has(right.tab)) - Number(favoriteSet.has(left.tab)))
      .slice(0, 8);
  }, [deferredQuery, db, favoriteTabs]);

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
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ürün, müşteri veya komut ara..."
          className="global-search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="global-search-clear"
            aria-label="Temizle"
          >
            ×
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="global-search-results">
          {results.map((r, i) => {
            const Icon = r.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  onNavigate(r.tab);
                  setQuery('');
                  setOpen(false);
                }}
                className="global-search-item"
              >
                <span className="global-search-item-icon">
                  <Icon className="size-4" />
                </span>
                <div className="global-search-item-main">
                  <div className="global-search-item-label">{r.label}</div>
                  <div className="global-search-item-match">{r.match}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
