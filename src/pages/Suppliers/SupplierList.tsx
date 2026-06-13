import { formatMoney } from '@/lib/utils-tr';
import type { Order } from '@/types';
import { ActionButtons } from '@/pages/pageHelpers';
import EmptyState from '@/components/EmptyState';
import { Truck } from 'lucide-react';
import type { SupplierWithCat, CatFilter } from './types';
import { catColors, catLabels } from './types';

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
  { value: 'hepsi', label: '\uD83D\uDD0D Hepsi' },
  { value: 'genel', label: '\uD83C\uDFED Genel' },
  { value: 'pelet', label: '\uD83C\uDF3E Pelet' },
  { value: 'boru', label: '\uD83D\uDD27 Boru' },
];

function calcScore(supplier: SupplierWithCat, orders: Order[]) {
  const supplierOrders = orders.filter((o) => o.supplierId === supplier.id && o.status !== 'iptal');
  const completedOnTime = supplierOrders.filter((o) => {
    if (o.status !== 'tamamlandi') return false;
    if (!o.deliveryDate || !o.createdAt) return true;
    const diff = (new Date(o.deliveryDate).getTime() - new Date(o.createdAt).getTime()) / 86400000;
    return diff <= 7;
  });
  const onTimeRate = supplierOrders.length > 0 ? (completedOnTime.length / supplierOrders.length) * 100 : 0;
  const orderScore = Math.min(30, (supplier.totalOrders || 0) * 3);
  const amountScore = Math.min(30, ((supplier.totalAmount || 0) / 10000) * 10);
  const deliveryScore = onTimeRate * 0.4;
  return Math.min(100, Math.round(orderScore + amountScore + deliveryScore));
}

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
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={onNewSupplier}
          style={{
            background: '#ff5722',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            padding: '10px 20px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Yeni Tedarik\u00E7i
        </button>
        <button
          onClick={onNewOrder}
          style={{
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 10,
            color: '#60a5fa',
            padding: '10px 18px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          \uD83D\uDCE6 Sipari\u015F Ver
        </button>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="\uD83D\uDD0D Ara..."
          style={{
            flex: 1,
            padding: '9px 13px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 10,
            color: 'var(--text-primary)',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {CAT_BTNS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onCatFilterChange(value)}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              background: catFilter === value ? '#ff5722' : '#273548',
              color: catFilter === value ? '#fff' : '#94a3b8',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {filteredSuppliers.length === 0 ? (
          <div style={{ gridColumn: '1/-1' }}>
            <EmptyState
              icon={Truck}
              title="Tedarik\u00E7i bulunamad\u0131"
              description="Arama veya filtre kriterlerine uygun tedarik\u00E7i bulunamad\u0131."
              actionLabel="Filtreleri temizle"
              onAction={() => onSearchChange('')}
            />
          </div>
        ) : (
          filteredSuppliers.map((s) => {
            const totalScore = calcScore(s, orders);
            const scoreColor = totalScore >= 70 ? '#10b981' : totalScore >= 40 ? '#f59e0b' : '#ef4444';
            return (
              <div
                key={s.id}
                style={{
                  background: '#1e293b',
                  borderRadius: 12,
                  border: '1px solid #334155',
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 4,
                  }}
                >
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</h4>
                  <span
                    style={{
                      background: `${catColors[s._kat]}22`,
                      color: catColors[s._kat],
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {catLabels[s._kat]}
                  </span>
                </div>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    marginBottom: 10,
                  }}
                >
                  {s.category || 'Genel'}
                </p>
                {s.phone && (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: 4 }}>
                    \uD83D\uDCDE {s.phone}
                  </p>
                )}
                {s.email && (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: 4 }}>
                    \uD83D\uDCE7 {s.email}
                  </p>
                )}
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {s.totalOrders || 0} sipari\u015F
                  </span>
                  <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>
                    {formatMoney(s.totalAmount || 0)}
                  </span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: '#273548', borderRadius: 3 }}>
                    <div
                      style={{
                        width: `${totalScore}%`,
                        height: '100%',
                        background: scoreColor,
                        borderRadius: 3,
                        transition: 'width 0.4s',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: scoreColor,
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      minWidth: 32,
                      textAlign: 'right',
                    }}
                  >
                    {totalScore}
                  </span>
                </div>
                {s._kat === 'genel' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => onShowOrders(s.id)}
                      style={{
                        flex: 1,
                        background: 'rgba(59,130,246,0.1)',
                        border: 'none',
                        borderRadius: 8,
                        color: '#60a5fa',
                        padding: '7px 0',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      \uD83D\uDCE6 Sipari\u015Fler
                    </button>
                    <ActionButtons
                      onEdit={() => onEdit(s)}
                      onDelete={() => onDelete(s.id)}
                    />
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
