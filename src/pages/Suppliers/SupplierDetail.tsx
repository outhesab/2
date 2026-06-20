/**
 * @file SupplierDetail.tsx
 * @description Tedarikçi sipariş geçmişi ve detay görünümü.
 */

import { formatDate, formatMoney } from '@/lib/utils-tr';
import EmptyState from '@/components/EmptyState';
import { Truck } from 'lucide-react';
import type { DB, Order } from '@/types';
import { statusColors, statusLabels } from './types';

interface Props {
  db: DB;
  selectedSup: string;
  onSelectSup: (id: string) => void;
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onRevert: (id: string) => void;
  onNewOrder: () => void;
}

export default function SupplierDetail({
  db,
  selectedSup,
  onSelectSup,
  onUpdateStatus,
  onRevert,
  onNewOrder,
}: Props) {
  const orders = [...db.orders]
    .filter((o) => (selectedSup ? o.supplierId === selectedSup : true))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <button
          onClick={onNewOrder}
          className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#ff5722] hover:opacity-90 transition-opacity cursor-pointer"
        >
          + Sipariş Ver
        </button>
        <select
          value={selectedSup}
          onChange={(e) => onSelectSup(e.target.value)}
          className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[var(--text-primary)] cursor-pointer"
        >
          <option value="">Tüm Tedarikçiler</option>
          {db.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto">
        <table className="w-full border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-[rgba(15,23,42,0.6)]">
              {['Tarih', 'Tedarikçi', 'Ürünler', 'Tutar', 'Durum', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[var(--text-muted)] text-xs font-semibold uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">
                  <EmptyState
                    icon={Truck}
                    title="Sipariş bulunamadı"
                    description="Henüz kaydedilmiş sipariş bulunmamaktadır."
                  />
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-white/[0.04]">
                  <td className="px-4 py-3 text-[var(--text-muted)] text-sm">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)] font-semibold">
                    {db.suppliers.find((s) => s.id === o.supplierId)?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-dim)] text-sm max-w-[200px] overflow-hidden text-ellipsis">
                    {o.items.map((i) => `${i.productName}×${i.qty}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-emerald-500 font-bold">
                    {formatMoney(o.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-semibold"
                      style={{
                        backgroundColor: `${statusColors[o.status]}22`,
                        color: statusColors[o.status],
                      }}
                    >
                      {statusLabels[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.status === 'bekliyor' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onUpdateStatus(o.id, 'yolda')}
                          className="px-2 py-1 rounded-md text-xs cursor-pointer bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          🚚 Yolda
                        </button>
                        <button
                          onClick={() => onUpdateStatus(o.id, 'tamamlandi')}
                          className="px-2 py-1 rounded-md text-xs cursor-pointer bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          ✓ Tamamla
                        </button>
                      </div>
                    )}
                    {o.status === 'yolda' && (
                      <button
                        onClick={() => onUpdateStatus(o.id, 'tamamlandi')}
                        className="px-2 py-1 rounded-md text-xs cursor-pointer bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        ✓ Tamamla
                      </button>
                    )}
                    {o.status === 'tamamlandi' && (
                      <button
                        onClick={() => onRevert(o.id)}
                        className="px-2 py-1 rounded-md text-xs cursor-pointer bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                      >
                        ↩ Geri Al
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
