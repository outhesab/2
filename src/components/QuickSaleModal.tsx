import { useState } from "react";
import { useToast } from "@/components/Toast";
import { useDB } from "@/hooks/useDB";
import { formatMoney, genId } from "@/lib/utils-tr";
import { InfoRow } from "@/components/InfoRow";

interface Props {
  db: ReturnType<typeof useDB>["db"];
  save: ReturnType<typeof useDB>["save"];
  onClose: () => void;
}

export function QuickSaleModal({ db, save, onClose }: Props) {
  const { showToast } = useToast();
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState<"nakit" | "kart" | "havale" | "cari">(
    "nakit",
  );
  const [discount, setDiscount] = useState(0);
  const [cariId, setCariId] = useState("");

  const product = db.products.find((p) => p.id === productId);
  const subtotal = product ? product.price * qty : 0;
  const total = Math.max(0, subtotal - discount);
  const profit = product ? (product.price - product.cost) * qty - discount : 0;

  const handleSave = () => {
    if (!product) {
      showToast("Ürün seçin!", "error");
      return;
    }
    if (product.stock < qty) {
      showToast(`Stok yetersiz! Mevcut: ${product.stock}`, "error");
      return;
    }
    if (payment === "cari" && !cariId) {
      showToast("Cari hesap seçimi zorunludur!", "error");
      return;
    }
    const nowIso = new Date().toISOString();
    const selectedCari = cariId
      ? db.cari.find((c) => c.id === cariId)
      : undefined;
    const sale = {
      id: genId(),
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      cariId: cariId || undefined,
      cariName: selectedCari?.name,
      quantity: qty,
      unitPrice: product.price,
      cost: product.cost,
      discount,
      discountAmount: discount,
      subtotal,
      total,
      profit,
      payment,
      status: "tamamlandi" as const,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice: product.price,
          cost: product.cost,
          total,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    save((prev) => {
      const kasaEntry =
        payment !== "cari"
          ? {
              id: genId(),
              type: "gelir" as const,
              category: "satis",
              amount: total,
              kasa:
                payment === "nakit" ? ("nakit" as const) : ("banka" as const),
              description: `Hızlı Satış: ${product.name}`,
              relatedId: sale.id,
              createdAt: nowIso,
              updatedAt: nowIso,
            }
          : null;
      const stockMovement = {
        id: genId(),
        productId: product.id,
        productName: product.name,
        type: "satis" as const,
        amount: -qty,
        before: product.stock,
        after: product.stock - qty,
        note: "Hızlı Satış",
        date: nowIso,
      };
      let cari = prev.cari;
      if (payment === "cari" && cariId) {
        cari = cari.map((c) =>
          c.id === cariId
            ? {
                ...c,
                balance: (c.balance || 0) + total,
                lastTransaction: nowIso,
                updatedAt: nowIso,
              }
            : c,
        );
      }
      return {
        ...prev,
        sales: [...prev.sales, sale],
        products: prev.products.map((p) =>
          p.id === productId ? { ...p, stock: p.stock - qty } : p,
        ),
        kasa: kasaEntry ? [...prev.kasa, kasaEntry] : prev.kasa,
        stockMovements: [...(prev.stockMovements || []), stockMovement],
        cari,
      };
    });
    showToast(`✅ Satış kaydedildi! ${formatMoney(total)}`, "success");
    onClose();
  };

  return (
    <div className="quick-form-grid">
      <div>
        <label className="quick-form-label">Ürün *</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="quick-form-input"
          aria-label="Ürün seçimi"
        >
          <option value="">-- Ürün Seç --</option>
          {db.products
            .filter((p) => !p.deleted && p.stock > 0)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Stok: {p.stock}, ₺{p.price})
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="quick-form-label">
          {payment === "cari"
            ? "Müşteri (Cari ödeme için zorunlu) *"
            : "Müşteri (opsiyonel)"}
        </label>
        <select
          value={cariId}
          onChange={(e) => setCariId(e.target.value)}
          className="quick-form-input"
          aria-label="Müşteri seçimi"
        >
          <option value="">-- Müşteri Seç --</option>
          {db.cari
            .filter((c) => !c.deleted && c.type === "musteri")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>
      <div className="quick-form-grid-two">
        <div>
          <label className="quick-form-label">Adet</label>
          <input
            type="number"
            value={qty}
            min={1}
            max={product?.stock || 999}
            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
            className="quick-form-input"
            title="Satış adedi"
            placeholder="1"
          />
        </div>
        <div>
          <label className="quick-form-label">İskonto (₺)</label>
          <input
            type="number"
            value={discount}
            min={0}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            className="quick-form-input"
            title="İskonto tutarı"
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <label className="quick-form-label">Ödeme</label>
        <div className="quick-payment-row">
          {(["nakit", "kart", "havale", "cari"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPayment(p)}
              className={`quick-payment-btn ${payment === p ? "active" : ""}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {product && (
        <div className="quick-summary-box">
          <InfoRow label="Ara Toplam" value={formatMoney(subtotal)} />
          {discount > 0 && (
            <InfoRow
              label="İskonto"
              value={`-${formatMoney(discount)}`}
              color="#ef4444"
            />
          )}
          <InfoRow label="TOPLAM" value={formatMoney(total)} color="#10b981" big />
          <InfoRow
            label="Kâr"
            value={formatMoney(profit)}
            color={profit >= 0 ? "#10b981" : "#ef4444"}
          />
        </div>
      )}
      <button
        onClick={handleSave}
        className="quick-submit-btn quick-submit-sale"
      >
        🛒 Hızlı Satış — {formatMoney(total)}
      </button>
    </div>
  );
}
