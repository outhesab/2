import { Modal } from '@/components/Modal';
import { ModalActions } from '@/pages/pageHelpers';
import { lbl, inp } from '@/lib/formStyles';
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
  const categories = [...new Set(db.products.filter((p) => !p.deleted).map((p) => p.category).filter(Boolean))];
  const filteredProducts = db.products.filter(
    (p) => !p.deleted && (!orderProductCat || p.category === orderProductCat),
  );

  return (
    <Modal open={open} onClose={onClose} title="\uD83D\uDCE6 Sipari\u015F Ver" maxWidth={620}>
      <div>
        <label style={lbl}>Tedarik\u00E7i *</label>
        <select
          value={orderSupplierId}
          onChange={(e) => setOrderSupplierId(e.target.value)}
          style={{ ...inp, marginBottom: 12 }}
        >
          <option value="">-- Tedarik\u00E7i Se\u00E7 --</option>
          {db.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <label style={lbl}>Ürün Ekle</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select
            value={orderProductCat}
            onChange={(e) => setOrderProductCat(e.target.value)}
            style={{ ...inp, flex: '0 0 120px' }}
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
            style={{ ...inp, flex: 1 }}
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
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 8,
              background: '#0f172a',
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
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
                    i.productId === item.productId ? { ...i, qty, lineTotal: qty * i.unitCost } : i,
                  ),
                );
              }}
              style={{
                width: 55,
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: 'var(--text-primary)',
                padding: '4px 6px',
                textAlign: 'center',
              }}
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
              style={{
                width: 80,
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: 'var(--text-primary)',
                padding: '4px 6px',
              }}
            />
            <button
              onClick={() => setOrderItems((prev) => prev.filter((i) => i.productId !== item.productId))}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={lbl}>Teslim Tarihi</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Nakliye Maliyeti (₺)</label>
            <input
              type="number"
              inputMode="decimal"
              value={nakliye || ''}
              min={0}
              step={0.01}
              placeholder="0,00"
              onChange={(e) => setNakliye(parseFloat(e.target.value) || 0)}
              style={inp}
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={lbl}>Not</label>
          <textarea
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            style={{ ...inp, minHeight: 50 }}
          />
        </div>
        {orderItems.length > 0 && (
          <div
            style={{
              background: '#0f172a',
              borderRadius: 8,
              padding: '12px 14px',
              marginTop: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-dim)' }}>Ürün Toplamı</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {formatMoney(itemTotal)}
              </span>
            </div>
            {nakliye > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>+ Nakliye</span>
                <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
                  {formatMoney(nakliye)}
                </span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid #1e3a5f',
                paddingTop: 8,
              }}
            >
              <span style={{ color: 'var(--text-dim)' }}>Genel Toplam</span>
              <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>
                {formatMoney(itemTotal + nakliye)}
              </span>
            </div>
          </div>
        )}
      </div>
      <ModalActions
        onSave={onSave}
        onCancel={onClose}
        saveLabel="\uD83D\uDCE6 Sipari\u015F Ver"
        saveColor="#ff5722"
      />
    </Modal>
  );
}
