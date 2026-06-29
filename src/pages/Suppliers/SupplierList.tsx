/**
 * @file SupplierList.tsx
 * @description Tedarikçi kart listesi, filtreleme ve arama.
 */

import { formatMoney } from '@/lib/utils-tr';
import type { Order } from '@/types';
import { ActionButtons } from '@/pages/pageHelpers';
import EmptyState from '@/components/EmptyState';
import { Truck } from 'lucide-react';
import type { SupplierWithCat, CatFilter } from './types';
import { catColors, catLabels } from './types';
import { calcScore } from './SupplierHelpers';

interface Props {
  filteredSuppliers: SupplierWithCat[];
  orders: Order[];
  search: string;
  onSearchChange: (val: string) => void;
  catFilter: CatFilter;
  onCatFilterChange: (val: CatFilter) => void;
  onNewSupplier: () => void;
  onNewOrder: () => void;
  onShowOrders: (id: string) => void;
  onEdit: (s: SupplierWithCat) => void;
  onDelete: (id: string) => void;
}

const CAT_BTNS: { value: CatFilter; label: string }[] = [
  { value: 'hepsi', label: '🔍 Hepsi' },
  { value: 'genel', label: '🏭 Genel' },
  { value: 'pelet', label: '🌾 Pelet' },
  { value: 'boru', label: '🔧 Boru' },
];

export default function SupplierList({
  filteredSuppliers,
  orders,
  search,
  onSearchChange,
  catFilter,
  onCatFilterChange,
  onNewSupplier,
  onNewOrder,
  onShowOrders,
  onEdit,
  onDelete,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap gap-2.5 mb-4">
        <button
          onClick={onNewSupplier}
          className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#ff5722] hover:opacity-90 transition-opacity cursor-pointer"
        >
          + Yeni Tedarikçi
        </button>
        <button
          onClick={onNewOrder}
          className="px-4.5 py-2.5 rounded-xl font-bold cursor-pointer bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
        >
          📦 Sipariş Ver
        </button>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="🔍 Ara..."
          className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>
      <div className="flex gap-2 mb-4">
        {CAT_BTNS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onCatFilterChange(value)}
            className={`px-3.5 py-1.5 rounded-lg border-none font-semibold text-sm cursor-pointer transition-colors ${
              catFilter === value ? 'bg-[#ff5722] text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Truck}
              title="Tedarikçi bulunamadı"
              description="Arama veya filtre kriterlerine uygun tedarikçi bulunamadı."
              actionLabel="Filtreleri temizle"
              onAction={() => onSearchChange('')}
            />
          </div>
        ) : (
          filteredSuppliers.map((s) => {
            const totalScore = calcScore(s, orders);
            const scoreColor = totalScore >= 70 ? '#10b981' : totalScore >= 40 ? '#f59e0b' : '#ef4444';
            return (
              <div key={s.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4.5">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-[var(--text-primary)]">{s.name}</h4>
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{
                      backgroundColor: `${catColors[s._kat]}22`,
                      color: catColors[s._kat],
                    }}
                  >
                    {catLabels[s._kat]}
                  </span>
                </div>
                <p className="text-[var(--text-muted)] text-sm mb-2.5">{s.category || 'Genel'}</p>
                {s.phone && <p className="text-[var(--text-dim)] text-sm mb-1">📞 {s.phone}</p>}
                {s.email && <p className="text-[var(--text-dim)] text-xs mb-1">✉️ {s.email}</p>}
                <div className="mt-2.5 pt-2.5 border-t border-slate-700 flex justify-between">
                  <span className="text-[var(--text-muted)] text-xs">{s.totalOrders || 0} sipariş</span>
                  <span className="text-emerald-500 text-sm font-bold">{formatMoney(s.totalAmount || 0)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-400"
                      style={{ width: `${totalScore}%`, backgroundColor: scoreColor }}
                    />
                  </div>
                  <span className="text-xs font-extrabold min-w-[32px] text-right" style={{ color: scoreColor }}>
                    {totalScore}
                  </span>
                </div>
                {s._kat === 'genel' && (
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={() => onShowOrders(s.id)}
                      className="flex-1 py-1.5 rounded-lg border-none text-sm font-semibold cursor-pointer bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      📦 Siparişler
                    </button>
                    <ActionButtons onEdit={() => onEdit(s)} onDelete={() => onDelete(s.id)} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
