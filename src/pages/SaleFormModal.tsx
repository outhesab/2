import { Modal } from '@/components/Modal';
import { MobileSelect } from '@/components/MobileSelect';
import { formatMoney } from '@/lib/utils-tr';
import type { DB, SaleItem } from '@/types';

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
    <Modal open={open} onClose={onClose} title="🛒 Yeni Satış" maxWidth={720}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sol: Ürünler */}
        <div className="flex-1 min-w-[300px]">
          <label className="block mb-1.5 text-slate-400 text-xs font-medium uppercase">Ürün Ekle</label>
          <select
            tabIndex={1}
            onChange={(e) => {
              if (e.target.value) {
                addItem(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all mb-4"
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

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {items.map((item, idx) => (
              <div
                key={item.productId}
                className="flex gap-3 items-center p-3 bg-slate-900/60 border border-white/5 rounded-xl transition-all hover:border-white/10"
              >
                <span className="flex-1 text-foreground text-sm font-medium truncate">{item.productName}</span>
                <div className="flex items-center gap-2">
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
                    className="w-14 bg-slate-950 border border-border rounded-lg py-1 text-center text-sm font-bold text-foreground outline-none focus:ring-1 ring-blue-500/50"
                  />
                  <span className="text-slate-600 text-xs">×</span>
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
                    className="w-20 bg-slate-950 border border-border rounded-lg py-1 px-2 text-right text-sm font-bold text-foreground outline-none focus:ring-1 ring-blue-500/50"
                  />
                  <span
                    className={`text-xs font-black w-16 text-right ${item.unitPrice - item.cost >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                  >
                    ₺{((item.unitPrice - item.cost) * item.quantity).toFixed(0)}
                  </span>
                  <button
                    tabIndex={-1}
                    onClick={() => removeItem(item.productId)}
                    className="text-red-500 hover:text-red-400 p-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ: Ödeme & Özet */}
        <div className="flex-1 min-w-[260px] space-y-4">
          <div>
            <label className="block mb-1.5 text-slate-400 text-xs font-medium uppercase">
              Müşteri <span className="text-red-500">*</span>
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
          </div>

          <div>
            <label className="block mb-1.5 text-slate-400 text-xs font-medium uppercase">Satış Tarihi</label>
            <input
              type="datetime-local"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
              className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
            />
            {saleDate.slice(0, 10) !== new Date().toISOString().slice(0, 10) && (
              <div className="text-[0.65rem] text-amber-500 mt-1">⚠️ Geçmiş tarihli kayıt</div>
            )}
          </div>

          <div>
            <label className="block mb-1.5 text-slate-400 text-xs font-medium uppercase">Ödeme Şekli</label>
            <div className="flex gap-2 flex-wrap">
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
                  className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                    payment === k.id
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {k.icon} {k.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-slate-400 text-xs font-medium uppercase">İskonto</label>
            <div className="flex gap-2">
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
                className="flex-1 p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
              />
              <select
                tabIndex={8}
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
                className="p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
              >
                <option value="percent">%</option>
                <option value="amount">₺</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-slate-400 text-xs font-medium uppercase flex justify-between items-center">
              Tahsil Edilen
              {kalan > 0 && tahsilat !== '' && (
                <span className="text-amber-500 text-[0.65rem] font-bold">Kalan: {formatMoney(kalan)} → Cariye</span>
              )}
              {kalan < 0 && tahsilat !== '' && (
                <span className="text-emerald-500 text-[0.65rem] font-bold">Para üstü: {formatMoney(-kalan)}</span>
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
              className={`w-full p-3 rounded-xl text-foreground text-lg font-black outline-none transition-all border-2 ${
                kalan > 0 && tahsilat !== ''
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                  : kalan < 0 && tahsilat !== ''
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-950 border-border text-foreground'
              }`}
            />
          </div>

          <div className="bg-slate-950 border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ara Toplam</span>
              <span className="text-foreground font-medium">{formatMoney(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">İskonto</span>
                <span className="text-red-500 font-medium">-{formatMoney(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base pt-2 border-t border-white/10">
              <span className="text-foreground font-bold">TOPLAM</span>
              <span className="text-emerald-500 font-black">{formatMoney(total)}</span>
            </div>
            {tahsilat !== '' && (
              <div className="flex justify-between text-xs pt-1 text-slate-400">
                <span>Tahsilat</span>
                <span>{formatMoney(tahsilatNum)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs pt-1 text-slate-500">
              <span>Tahmini Kâr</span>
              <span className={profit >= 0 ? 'text-emerald-500' : 'text-red-500'}>{formatMoney(profit)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          tabIndex={50}
          onClick={saveSale}
          className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-orange-600/20"
        >
          💾 Satışı Kaydet — {formatMoney(tahsilatNum)} tahsilat
        </button>
        <button
          tabIndex={51}
          onClick={onClose}
          className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl text-sm transition-all"
        >
          İptal
        </button>
      </div>
    </Modal>
  );
}
