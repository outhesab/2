import { Modal } from '@/components/Modal';
import { MobileSelect } from '@/components/MobileSelect';
import { formatMoney } from '@/lib/utils-tr';
import type { DB, SaleItem } from '@/types';
import { lbl, sinpStyle } from './salesStyles';
import { Row } from './SalesHelpers';

interface SaleFormModalProps {
  open: boolean;
  onClose: () => void;
  items: SaleItem[];
  cariId: string;
  setCariId: (v: string) => void;
  payment: string;
  setPayment: (v: string) => void;
  discount: string;
  setDiscount: (v: string | ((prev: string) => string)) => void;
  discountType: 'percent' | 'amount';
  setDiscountType: (v: 'percent' | 'amount') => void;
  tahsilat: string;
  setTahsilat: (v: string) => void;
  saleDate: string;
  setSaleDate: (v: string) => void;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  updatePrice: (productId: string, price: number) => void;
  saveSale: () => void;
  cariList: DB['cari'];
  urunler: DB['products'];
  kasalar: DB['kasalar'];
  subtotal: number;
  discountAmount: number;
  total: number;
  profit: number;
  tahsilatNum: number;
  kalan: number;
  paraUstu: number;
}

export default function SaleFormModal({
  open,
  onClose,
  items,
  cariId,
  setCariId,
  payment,
  setPayment,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  tahsilat,
  setTahsilat,
  saleDate,
  setSaleDate,
  addItem,
  removeItem,
  updateQty,
  updatePrice,
  saveSale,
  cariList,
  urunler,
  kasalar,
  subtotal,
  discountAmount,
  total,
  profit,
  tahsilatNum,
  kalan,
}: SaleFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="🛒 Yeni Satış" maxWidth={680}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Sol: Ürünler */}
        <div style={{ flex: '1 1 300px' }}>
          <label style={lbl}>Ürün Ekle</label>
          <select
            tabIndex={1}
            onChange={(e) => {
              if (e.target.value) {
                addItem(e.target.value);
                e.target.value = '';
              }
            }}
            style={sinpStyle}
          >
            <option value="">-- Ürün Seç --</option>
            {urunler
              .filter((p) => p.stock > 0)
              .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock})
                </option>
              ))}
          </select>
          {items.map((item, idx) => (
            <div
              key={item.productId}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginTop: 8,
                background: '#0f172a',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{item.productName}</span>
              <input
                type="number"
                inputMode="decimal"
                value={item.quantity}
                min={1}
                tabIndex={10 + idx * 2}
                onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    updateQty(item.productId, item.quantity + 1);
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    updateQty(item.productId, item.quantity - 1);
                  }
                }}
                style={{
                  width: 55,
                  background: 'var(--bg-card)',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  padding: '4px 6px',
                  textAlign: 'center',
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>×</span>
              <input
                type="number"
                inputMode="decimal"
                value={item.unitPrice}
                step={0.01}
                tabIndex={11 + idx * 2}
                onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    updatePrice(item.productId, item.unitPrice + 1);
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    updatePrice(item.productId, Math.max(0, item.unitPrice - 1));
                  }
                }}
                style={{
                  width: 80,
                  background: 'var(--bg-card)',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  padding: '4px 6px',
                }}
              />
              <span
                style={{
                  color: item.unitPrice - item.cost >= 0 ? '#10b981' : '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  whiteSpace: 'nowrap',
                  minWidth: 60,
                  textAlign: 'right',
                }}
              >
                ₺{((item.unitPrice - item.cost) * item.quantity).toFixed(0)}
              </span>
              <button
                tabIndex={-1}
                onClick={() => removeItem(item.productId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Sağ: Ödeme & Özet */}
        <div style={{ flex: '1 1 220px' }}>
          <label style={lbl}>
            Müşteri <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <MobileSelect
            value={cariId}
            onChange={setCariId}
            label="Müşteri Seç"
            placeholder="-- Müşteri Seç (zorunlu) --"
            options={cariList
              .filter((c) => c.type === 'musteri' && !c.ortak && !c.deleted)
              .map((c) => ({
                value: c.id,
                label: c.name,
                sub: c.phone || undefined,
              }))}
            style={{
              borderColor: !cariId ? 'rgba(239,68,68,0.4)' : undefined,
            }}
          />

          <label style={{ ...lbl, marginTop: 12 }}>Satış Tarihi</label>
          <input
            type="datetime-local"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            max={new Date().toISOString().slice(0, 16)}
            style={{ ...sinpStyle, marginBottom: 4 }}
          />
          {saleDate.slice(0, 10) !== new Date().toISOString().slice(0, 10) && (
            <div
              style={{
                fontSize: '0.72rem',
                color: '#f59e0b',
                marginBottom: 8,
              }}
            >
              ⚠️ Geçmiş tarihli kayıt
            </div>
          )}

          <label style={{ ...lbl, marginTop: 12 }}>Ödeme Şekli</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              ...(kasalar || [
                { id: 'nakit', name: 'Nakit', icon: '💵' },
                { id: 'banka', name: 'Banka', icon: '🏦' },
              ]),
              { id: 'cari', name: 'Cari', icon: '👤' },
            ].map((k, i) => (
              <button
                key={k.id}
                tabIndex={3 + i}
                onClick={() => setPayment(k.id)}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  background: payment === k.id ? '#ff5722' : '#273548',
                  color: payment === k.id ? '#fff' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {k.icon} {k.name}
              </button>
            ))}
          </div>

          <label style={{ ...lbl, marginTop: 12 }}>İskonto</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              tabIndex={7}
              type="number"
              inputMode="decimal"
              value={discount}
              min={0}
              onChange={(e) => setDiscount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setDiscount((d) => String((parseFloat(d) || 0) + 1));
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setDiscount((d) => String(Math.max(0, (parseFloat(d) || 0) - 1)));
                }
              }}
              style={{
                flex: 1,
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: 'var(--text-primary)',
                padding: '8px 10px',
              }}
            />
            <select
              tabIndex={8}
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: 'var(--text-primary)',
                padding: '8px 10px',
              }}
            >
              <option value="percent">%</option>
              <option value="amount">₺</option>
            </select>
          </div>

          {/* TAHSİLAT */}
          <label style={{ ...lbl, marginTop: 12 }}>
            Tahsil Edilen Tutar
            {kalan > 0 && tahsilat !== '' && (
              <span
                style={{
                  color: '#f59e0b',
                  marginLeft: 8,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                Kalan: {formatMoney(kalan)} → Cariye
              </span>
            )}
            {kalan < 0 && tahsilat !== '' && (
              <span
                style={{
                  color: '#10b981',
                  marginLeft: 8,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                Para üstü: {formatMoney(-kalan)}
              </span>
            )}
          </label>
          <input
            tabIndex={9}
            type="number"
            inputMode="decimal"
            value={tahsilat}
            placeholder={formatMoney(total) + ' (tam tutar)'}
            min={0}
            step={0.01}
            onChange={(e) => setTahsilat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setTahsilat(String((tahsilatNum || total) + 1));
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setTahsilat(String(Math.max(0, (tahsilatNum || total) - 1)));
              }
            }}
            style={{
              width: '100%',
              background:
                kalan > 0 && tahsilat !== ''
                  ? 'rgba(245,158,11,0.08)'
                  : kalan < 0 && tahsilat !== ''
                    ? 'rgba(16,185,129,0.08)'
                    : '#0f172a',
              border: `1px solid ${kalan > 0 && tahsilat !== '' ? '#f59e0b' : kalan < 0 && tahsilat !== '' ? '#10b981' : '#334155'}`,
              borderRadius: 8,
              color: 'var(--text-primary)',
              padding: '10px 14px',
              boxSizing: 'border-box',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          />

          <div
            style={{
              background: '#0f172a',
              borderRadius: 8,
              padding: 14,
              marginTop: 14,
            }}
          >
            <Row label="Ara Toplam" value={formatMoney(subtotal)} />
            {discountAmount > 0 && <Row label="İskonto" value={`-${formatMoney(discountAmount)}`} color="#ef4444" />}
            <Row label="TOPLAM" value={formatMoney(total)} big color="#10b981" />
            {tahsilat !== '' && <Row label="Tahsilat" value={formatMoney(tahsilatNum)} color="#3b82f6" />}
            {tahsilat !== '' && kalan > 0 && <Row label="Kalan (Cari)" value={formatMoney(kalan)} color="#f59e0b" />}
            {tahsilat !== '' && kalan < 0 && <Row label="Para Üstü" value={formatMoney(-kalan)} color="#10b981" />}
            <Row label="Kâr" value={formatMoney(profit)} color={profit >= 0 ? '#10b981' : '#ef4444'} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button
          tabIndex={50}
          onClick={saveSale}
          style={{
            flex: 1,
            background: '#ff5722',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            padding: '12px 0',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          💾 Satışı Kaydet — {formatMoney(tahsilatNum)} tahsilat
        </button>
        <button
          tabIndex={51}
          onClick={onClose}
          style={{
            background: '#273548',
            border: '1px solid #334155',
            borderRadius: 10,
            color: 'var(--text-dim)',
            padding: '12px 20px',
            cursor: 'pointer',
          }}
        >
          İptal
        </button>
      </div>
    </Modal>
  );
}
