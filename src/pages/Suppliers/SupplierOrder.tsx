/**
 * @file SupplierOrder.tsx
 * @description Sipariş oluşturma formu.
 */

import { Modal } from '@/components/Modal';
import { ModalActions } from '@/pages/pageHelpers';
import { formatMoney } from '@/lib/utils-tr';
import type { DB, OrderItem } from '@/types';

interface Props {
  open: boolean;
  db: DB;
  orderSupplierId: string;
  setOrderSupplierId: (val: string) => void;
  orderItems: OrderItem[];
  setOrderItems: (fn: (prev: OrderItem[]) => OrderItem[]) => void;
  deliveryDate: string;
  setDeliveryDate: (val: string) => void;
  orderNote: string;
  setOrderNote: (val: string) => void;
  nakliye: number;
  setNakliye: (val: number) => void;
  orderProductCat: string;
  setOrderProductCat: (val: string) => void;
  addOrderItem: (productId: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-[rgba(15,23,42,0.6)] border border-slate-700 rounded-xl text-[var(--text-primary)] text-sm box-border focus:outline-none focus:border-blue-500';
const labelClass = 'block mb-1.5 text-[var(--text-dim)] text-sm font-medium';

export default function SupplierOrder({
  open,
  db,
  orderSupplierId,
  setOrderSupplierId,
  orderItems,
  setOrderItems,
  deliveryDate,
  setDeliveryDate,
  orderNote,
  setOrderNote,
  nakliye,
  setNakliye,
  orderProductCat,
  setOrderProductCat,
  addOrderItem,
  onSave,
  onClose,
}: Props) {
  const itemTotal = orderItems.reduce((s, i) => s + i.lineTotal, 0);
  const categories = [
    ...new Set(
      db.products
        .filter((p) => !p.deleted)
        .map((p) => p.category)
        .filter(Boolean),
    ),
  ];
  const filteredProducts = db.products.filter(
    (p) => !p.deleted && (!orderProductCat || p.category === orderProductCat),
  );

  return (
    <Modal open={open} onClose={onClose} title="📦 Sipariş Ver" maxWidth={620}>
      <div>
        <label className={labelClass}>Tedarikçi *</label>
        <select
          value={orderSupplierId}
          onChange={(e) => setOrderSupplierId(e.target.value)}
          className={`${inputClass} mb-3 cursor-pointer`}
        >
          <option value="">-- Tedarikçi Seç --</option>
          {db.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <label className={labelClass}>Ürün Ekle</label>
        <div className="flex gap-2 mb-3">
          <select
            value={orderProductCat}
            onChange={(e) => setOrderProductCat(e.target.value)}
            className={`${inputClass} shrink-0 w-[120px] cursor-pointer`}
          >
            <option value="">Tüm Kat.</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addOrderItem(e.target.value);
                e.target.value = '';
              }
            }}
            className={`${inputClass} flex-1 cursor-pointer`}
          >
            <option value="">-- Ürün Seç --</option>
            {filteredProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {orderItems.map((item) => (
          <div
            key={item.productId}
            className="flex gap-2 items-center mb-2 bg-slate-900 rounded-lg px-2.5 py-2"
          >
            <span className="flex-1 text-[var(--text-primary)] text-sm">
              {item.productName}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={item.qty}
              min={1}
              onChange={(e) => {
                const qty = parseInt(e.target.value) || 1;
                setOrderItems((prev) =>
                  prev.map((i) =>
                    i.productId === item.productId
                      ? { ...i, qty, lineTotal: qty * i.unitCost }
                      : i,
                  ),
                );
              }}
              className="w-14 bg-slate-800 border border-slate-700 rounded-md text-[var(--text-primary)] px-1.5 py-1 text-center text-sm"
            />
            <input
              type="number"
              inputMode="decimal"
              value={item.unitCost}
              step={0.01}
              onChange={(e) => {
                const cost = parseFloat(e.target.value) || 0;
                setOrderItems((prev) =>
                  prev.map((i) =>
                    i.productId === item.productId
                      ? { ...i, unitCost: cost, lineTotal: i.qty * cost }
                      : i,
                  ),
                );
              }}
              className="w-20 bg-slate-800 border border-slate-700 rounded-md text-[var(--text-primary)] px-1.5 py-1 text-sm"
            />
            <button
              onClick={() =>
                setOrderItems((prev) =>
                  prev.filter((i) => i.productId !== item.productId),
                )
              }
              className="bg-transparent border-none text-red-500 cursor-pointer hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className={labelClass}>Teslim Tarihi</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nakliye Maliyeti (₺)</label>
            <input
              type="number"
              inputMode="decimal"
              value={nakliye || ''}
              min={0}
              step={0.01}
              placeholder="0,00"
              onChange={(e) => setNakliye(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className={labelClass}>Not</label>
          <textarea
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            className={`${inputClass} min-h-[50px]`}
          />
        </div>

        {orderItems.length > 0 && (
          <div className="bg-slate-900 rounded-lg px-3.5 py-3 mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-[var(--text-dim)]">Ürün Toplamı</span>
              <span className="text-[var(--text-primary)] font-bold">
                {formatMoney(itemTotal)}
              </span>
            </div>
            {nakliye > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-[var(--text-dim)] text-sm">+ Nakliye</span>
                <span className="text-amber-500 font-semibold text-sm">
                  {formatMoney(nakliye)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-800 pt-2">
              <span className="text-[var(--text-dim)]">Genel Toplam</span>
              <span className="text-emerald-500 font-extrabold text-lg">
                {formatMoney(itemTotal + nakliye)}
              </span>
            </div>
          </div>
        )}
      </div>
      <ModalActions
        onSave={onSave}
        onCancel={onClose}
        saveLabel="📦 Sipariş Ver"
        saveColor="#ff5722"
      />
    </Modal>
  );
}
