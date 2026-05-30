import { getAgent } from "@/agents";
import type { YeniSatisParams } from "@/agents/types";
import { useConfirm } from "@/components/ConfirmDialog";
import { MobileSelect } from "@/components/MobileSelect";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useSoundFeedback } from "@/hooks/useSoundFeedback";
import { exportToExcel } from "@/lib/excelExport";
import { formatDate, formatMoney } from "@/lib/utils-tr";
import type { DB, SaleItem } from "@/types";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

const paymentLabels: Record<string, string> = {
  nakit: "Nakit",
  kart: "Kart",
  havale: "Havale",
  cari: "Cari",
};

export default function Sales({ db, save: _save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const { playSound } = useSoundFeedback();
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [_receiptId, setReceiptId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "tamamlandi" | "iade" | "iptal">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Yeni satış formu
  const [items, setItems] = useState<SaleItem[]>([]);
  const [cariId, setCariId] = useState("");
  const [payment, setPayment] = useState("nakit");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">(
    "percent",
  );
  const [tahsilat, setTahsilat] = useState<string>("");
  const [saleDate, setSaleDate] = useState<string>(
    new Date().toISOString().slice(0, 16),
  );

  const addItem = (productId: string) => {
    const p = db.products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing)
        return prev.map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity: i.quantity + 1,
                total: (i.quantity + 1) * i.unitPrice,
              }
            : i,
        );
      return [
        ...prev,
        {
          productId,
          productName: p.name,
          quantity: 1,
          unitPrice: p.price,
          cost: p.cost,
          total: p.price,
        },
      ];
    });
  };

  const removeItem = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: qty, total: qty * i.unitPrice }
          : i,
      ),
    );
  };
  const updatePrice = (productId: string, price: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, unitPrice: price, total: i.quantity * price }
          : i,
      ),
    );
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discountNum = parseFloat(discount) || 0;
  const discountAmount =
    discountType === "percent" ? subtotal * (discountNum / 100) : discountNum;
  const total = Math.max(0, subtotal - discountAmount);
  const profit =
    items.reduce((s, i) => s + i.quantity * (i.unitPrice - i.cost), 0) -
    discountAmount;
  const tahsilatNum = tahsilat === "" ? total : parseFloat(tahsilat) || 0;
  const kalan = total - tahsilatNum;

  const saveSale = async () => {
    if (items.length === 0) {
      showToast("En az bir ürün ekleyin!", "error");
      return;
    }
    if (!cariId) {
      showToast(
        "Müşteri seçimi zorunludur! Yeni müşteri eklemek için Cari bölümünü kullanın.",
        "error",
      );
      return;
    }

    const params: YeniSatisParams = {
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        cost: i.cost,
        total: i.total,
      })),
      cariId,
      payment: payment as "nakit" | "kart" | "havale" | "cari",
      discount: discountNum,
      discountAmount,
      tahsilat: tahsilat === "" ? undefined : tahsilatNum,
      saleDate,
    };

    const sonuc = await getAgent("satis").yeniSatis(params);
    if (!sonuc.ok) {
      showToast(sonuc.error || "Satış kaydedilemedi", "error");
      return;
    }

    playSound("sale");
    toast.success(`Satış kaydedildi! ${formatMoney(sonuc.data!.total)}`);
    setReceiptId(sonuc.data!.saleId);
    setItems([]);
    setCariId("");
    setPayment("nakit");
    setDiscount("");
    setTahsilat("");
    setSaleDate(new Date().toISOString().slice(0, 16));
    setModalOpen(false);
  };

  const handleReturn = (id: string) => {
    showConfirm(
      "İade / İptal",
      "Bu satışı iade etmek istiyor musunuz? Stoklar geri yüklenecek.",
      async () => {
        const sonuc = await getAgent("satis").iadeYap(id);
        if (sonuc.ok) {
          showToast("İade işlemi tamamlandı!", "success");
        } else {
          showToast(sonuc.error || "İade başarısız", "error");
        }
      },
    );
  };

  const handleCancel = (id: string) => {
    showConfirm(
      "Satış İptal",
      "Bu satışı iptal etmek istiyor musunuz? Stoklar geri yüklenecek.",
      async () => {
        const sonuc = await getAgent("satis").iptalEt(id);
        if (sonuc.ok) {
          showToast("Satış iptal edildi!", "success");
        } else {
          showToast(sonuc.error || "İptal başarısız", "error");
        }
      },
    );
  };

  let sales = db.sales.filter((s) => !s.deleted);
  if (filter !== "all") sales = sales.filter((s) => s.status === filter);
  if (search)
    sales = sales.filter((s) =>
      s.productName.toLowerCase().includes(search.toLowerCase()),
    );
  if (dateFrom) sales = sales.filter((s) => s.createdAt >= dateFrom);
  if (dateTo) sales = sales.filter((s) => s.createdAt <= dateTo + "T23:59:59");
  const sorted = [...sales].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const todayStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("sv-SE");
    const t = db.sales.filter(
      (s) =>
        !s.deleted &&
        s.status === "tamamlandi" &&
        s.createdAt.slice(0, 10) === todayStr,
    );
    return {
      count: t.length,
      revenue: t.reduce((s, x) => s + x.total, 0),
      profit: t.reduce((s, x) => s + x.profit, 0),
    };
  }, [db.sales]);

  return (
    <div>
      <div
        className="stat-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Bugün Satış"
          value={String(todayStats.count)}
          sub={formatMoney(todayStats.revenue)}
          color="#10b981"
        />
        <StatCard
          label="Bugün Ciro"
          value={formatMoney(todayStats.revenue)}
          color="#3b82f6"
        />
        <StatCard
          label="Bugün Kâr"
          value={formatMoney(todayStats.profit)}
          color="#f59e0b"
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: "#ff5722",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            padding: "10px 20px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          + Yeni Satış
        </button>
        <button
          onClick={() => {
            exportToExcel(db, {
              sheets: ["satislar"],
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
            });
            showToast("Excel indirildi!", "success");
          }}
          style={{
            background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 10,
            color: "#10b981",
            padding: "10px 16px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          📊 Excel İndir
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Ürün ara..."
          style={sinp}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ ...sinp, width: 160 }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ ...sinp, width: 160 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "tamamlandi", "iade", "iptal"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 14px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.82rem",
                background: filter === f ? "#ff5722" : "#273548",
                color: filter === f ? "#fff" : "#94a3b8",
              }}
            >
              {f === "all"
                ? "Tümü"
                : f === "tamamlandi"
                  ? "✓ Tamamlandı"
                  : f === "iade"
                    ? "↩ İade"
                    : "✕ İptal"}
            </button>
          ))}
        </div>
      </div>

      <div
        className="responsive-table-wrap"
        style={{
          background: "var(--bg-card)",
          borderRadius: 14,
          border: "1px solid #334155",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            whiteSpace: "nowrap",
          }}
        >
          <thead>
            <tr style={{ background: "rgba(15,23,42,0.6)" }}>
              {[
                "Tarih",
                "Ürün",
                "Müşteri",
                "Miktar",
                "Tutar",
                "Kâr",
                "Ödeme",
                "Durum",
                "",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}
                >
                  Satış bulunamadı
                </td>
              </tr>
            ) : (
              sorted.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <td
                    data-label="Tarih"
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-muted)",
                      fontSize: "0.82rem",
                    }}
                  >
                    {formatDate(s.createdAt)}
                  </td>
                  <td
                    data-label="Ürün"
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                    }}
                  >
                    {s.productName}
                  </td>
                  <td
                    data-label="Müşteri"
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-dim)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {db.cari.find((c) => c.id === s.cariId)?.name || "-"}
                  </td>
                  <td data-label="Miktar" style={{ padding: "12px 16px", color: "var(--text-dim)" }}>
                    {s.quantity}
                  </td>
                  <td
                    data-label="Tutar"
                    style={{
                      padding: "12px 16px",
                      color: "#10b981",
                      fontWeight: 700,
                    }}
                  >
                    {formatMoney(s.total)}
                  </td>
                  <td
                    data-label="Kâr"
                    style={{
                      padding: "12px 16px",
                      color: s.profit >= 0 ? "#10b981" : "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    {formatMoney(s.profit)}
                  </td>
                  <td data-label="Ödeme" style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        background: "rgba(59,130,246,0.15)",
                        color: "#60a5fa",
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontSize: "0.8rem",
                      }}
                    >
                      {(db.kasalar || []).find((k) => k.id === s.payment)
                        ?.name ||
                        paymentLabels[s.payment] ||
                        s.payment}
                    </span>
                  </td>
                  <td data-label="Durum" style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        background:
                          s.status === "tamamlandi"
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color:
                          s.status === "tamamlandi" ? "#10b981" : "#ef4444",
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      {s.status === "tamamlandi"
                        ? "✓ Tamamlandı"
                        : s.status === "iade"
                          ? "↩ İade"
                          : "✕ İptal"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          onClick={() => setLocation(`/satis/${s.id}`)}
                          style={{
                            background: "rgba(59,130,246,0.1)",
                            border: "none",
                            borderRadius: 6,
                            color: "#60a5fa",
                            padding: "4px 10px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          Detay
                        </button>
                    {s.status === "tamamlandi" && (
                      <>
                        <button
                          onClick={() => handleReturn(s.id)}
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "none",
                            borderRadius: 6,
                            color: "#ef4444",
                            padding: "4px 10px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          ↩ İade
                        </button>
                        <button
                          onClick={() => handleCancel(s.id)}
                          style={{
                            background: "rgba(245,158,11,0.1)",
                            border: "none",
                            borderRadius: 6,
                            color: "#f59e0b",
                            padding: "4px 10px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          ✕ İptal
                        </button>
                      </>
                    )}
                      </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="🛒 Yeni Satış"
        maxWidth={680}
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {/* Sol: Ürünler */}
          <div style={{ flex: "1 1 300px" }}>
            <label style={lbl}>Ürün Ekle</label>
            <select
              tabIndex={1}
              onChange={(e) => {
                if (e.target.value) {
                  addItem(e.target.value);
                  e.target.value = "";
                }
              }}
              style={sinpStyle}
            >
              <option value="">-- Ürün Seç --</option>
              {db.products
                .filter((p) => p.stock > 0)
                .sort((a, b) => a.name.localeCompare(b.name, "tr"))
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
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 8,
                  background: "#0f172a",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <span
                  style={{ flex: 1, color: "var(--text-primary)", fontSize: "0.88rem" }}
                >
                  {item.productName}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={item.quantity}
                  min={1}
                  tabIndex={10 + idx * 2}
                  onChange={(e) =>
                    updateQty(item.productId, parseInt(e.target.value) || 0)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      updateQty(item.productId, item.quantity + 1);
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      updateQty(item.productId, item.quantity - 1);
                    }
                  }}
                  style={{
                    width: 55,
                    background: "var(--bg-card)",
                    border: "1px solid #334155",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    padding: "4px 6px",
                    textAlign: "center",
                  }}
                />
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>×</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={item.unitPrice}
                  step={0.01}
                  tabIndex={11 + idx * 2}
                  onChange={(e) =>
                    updatePrice(item.productId, parseFloat(e.target.value) || 0)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      updatePrice(item.productId, item.unitPrice + 1);
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      updatePrice(
                        item.productId,
                        Math.max(0, item.unitPrice - 1),
                      );
                    }
                  }}
                  style={{
                    width: 80,
                    background: "var(--bg-card)",
                    border: "1px solid #334155",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    padding: "4px 6px",
                  }}
                />
                <span style={{
                  color: (item.unitPrice - item.cost) >= 0 ? '#10b981' : '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  whiteSpace: 'nowrap',
                  minWidth: 60,
                  textAlign: 'right',
                }}>
                  ₺{((item.unitPrice - item.cost) * item.quantity).toFixed(0)}
                </span>
                <button
                  tabIndex={-1}
                  onClick={() => removeItem(item.productId)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Sağ: Ödeme & Özet */}
          <div style={{ flex: "1 1 220px" }}>
            <label style={lbl}>
              Müşteri <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <MobileSelect
              value={cariId}
              onChange={setCariId}
              label="Müşteri Seç"
              placeholder="-- Müşteri Seç (zorunlu) --"
              options={db.cari
                .filter((c) => c.type === "musteri" && !c.ortak && !c.deleted)
                .map((c) => ({
                  value: c.id,
                  label: c.name,
                  sub: c.phone || undefined,
                }))}
              style={{
                borderColor: !cariId ? "rgba(239,68,68,0.4)" : undefined,
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
            {saleDate.slice(0, 10) !==
              new Date().toISOString().slice(0, 10) && (
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#f59e0b",
                  marginBottom: 8,
                }}
              >
                ⚠️ Geçmiş tarihli kayıt
              </div>
            )}

            <label style={{ ...lbl, marginTop: 12 }}>Ödeme Şekli</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                ...(db.kasalar || [
                  { id: "nakit", name: "Nakit", icon: "💵" },
                  { id: "banka", name: "Banka", icon: "🏦" },
                ]),
                { id: "cari", name: "Cari", icon: "👤" },
              ].map((k, i) => (
                <button
                  key={k.id}
                  tabIndex={3 + i}
                  onClick={() => setPayment(k.id)}
                  style={{
                    flex: 1,
                    padding: "8px 6px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    background: payment === k.id ? "#ff5722" : "#273548",
                    color: payment === k.id ? "#fff" : "#94a3b8",
                    whiteSpace: "nowrap",
                  }}
                >
                  {k.icon} {k.name}
                </button>
              ))}
            </div>

            <label style={{ ...lbl, marginTop: 12 }}>İskonto</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                tabIndex={7}
                type="number"
                inputMode="decimal"
                value={discount}
                min={0}
                onChange={(e) => setDiscount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setDiscount((d) => String((parseFloat(d) || 0) + 1));
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setDiscount((d) =>
                      String(Math.max(0, (parseFloat(d) || 0) - 1)),
                    );
                  }
                }}
                style={{
                  flex: 1,
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  padding: "8px 10px",
                }}
              />
              <select
                tabIndex={8}
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as "percent" | "amount")
                }
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  padding: "8px 10px",
                }}
              >
                <option value="percent">%</option>
                <option value="amount">₺</option>
              </select>
            </div>

            {/* TAHSİLAT */}
            <label style={{ ...lbl, marginTop: 12 }}>
              Tahsil Edilen Tutar
              {kalan > 0 && tahsilat !== "" && (
                <span
                  style={{
                    color: "#f59e0b",
                    marginLeft: 8,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                  }}
                >
                  Kalan: {formatMoney(kalan)} → Cariye
                </span>
              )}
              {kalan < 0 && tahsilat !== "" && (
                <span
                  style={{
                    color: "#10b981",
                    marginLeft: 8,
                    fontSize: "0.78rem",
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
              placeholder={formatMoney(total) + " (tam tutar)"}
              min={0}
              step={0.01}
              onChange={(e) => setTahsilat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setTahsilat(String((tahsilatNum || total) + 1));
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setTahsilat(String(Math.max(0, (tahsilatNum || total) - 1)));
                }
              }}
              style={{
                width: "100%",
                background:
                  kalan > 0 && tahsilat !== ""
                    ? "rgba(245,158,11,0.08)"
                    : kalan < 0 && tahsilat !== ""
                      ? "rgba(16,185,129,0.08)"
                      : "#0f172a",
                border: `1px solid ${kalan > 0 && tahsilat !== "" ? "#f59e0b" : kalan < 0 && tahsilat !== "" ? "#10b981" : "#334155"}`,
                borderRadius: 8,
                color: "var(--text-primary)",
                padding: "10px 14px",
                boxSizing: "border-box",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            />

            <div
              style={{
                background: "#0f172a",
                borderRadius: 8,
                padding: 14,
                marginTop: 14,
              }}
            >
              <Row label="Ara Toplam" value={formatMoney(subtotal)} />
              {discountAmount > 0 && (
                <Row
                  label="İskonto"
                  value={`-${formatMoney(discountAmount)}`}
                  color="#ef4444"
                />
              )}
              <Row
                label="TOPLAM"
                value={formatMoney(total)}
                big
                color="#10b981"
              />
              {tahsilat !== "" && (
                <Row
                  label="Tahsilat"
                  value={formatMoney(tahsilatNum)}
                  color="#3b82f6"
                />
              )}
              {tahsilat !== "" && kalan > 0 && (
                <Row
                  label="Kalan (Cari)"
                  value={formatMoney(kalan)}
                  color="#f59e0b"
                />
              )}
              {tahsilat !== "" && kalan < 0 && (
                <Row
                  label="Para Üstü"
                  value={formatMoney(-kalan)}
                  color="#10b981"
                />
              )}
              <Row
                label="Kâr"
                value={formatMoney(profit)}
                color={profit >= 0 ? "#10b981" : "#ef4444"}
              />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            tabIndex={50}
            onClick={saveSale}
            style={{
              flex: 1,
              background: "#ff5722",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              padding: "12px 0",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            💾 Satışı Kaydet — {formatMoney(tahsilatNum)} tahsilat
          </button>
          <button
            tabIndex={51}
            onClick={() => setModalOpen(false)}
            style={{
              background: "#273548",
              border: "1px solid #334155",
              borderRadius: 10,
              color: "var(--text-dim)",
              padding: "12px 20px",
              cursor: "pointer",
            }}
          >
            İptal
          </button>
        </div>
      </Modal>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "var(--text-dim)",
  fontSize: "0.85rem",
  fontWeight: 500,
};
const sinp: React.CSSProperties = {
  padding: "9px 13px",
  background: "var(--bg-card)",
  border: "1px solid #334155",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: "0.9rem",
};
const sinpStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(15,23,42,0.6)",
  border: "1px solid #334155",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  boxSizing: "border-box",
};

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        padding: "16px 18px",
        border: `1px solid ${color}22`,
      }}
    >
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>
        {label}
      </div>
      {sub && (
        <div style={{ color: "var(--text-dim)", fontSize: "0.82rem", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  color,
  big,
}: {
  label: string;
  value: string;
  color?: string;
  big?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
      }}
    >
      <span style={{ color: "var(--text-muted)", fontSize: big ? "0.9rem" : "0.82rem" }}>
        {label}
      </span>
      <span
        style={{
          color: color || "#f1f5f9",
          fontWeight: big ? 800 : 600,
          fontSize: big ? "1.1rem" : "0.88rem",
        }}
      >
        {value}
      </span>
    </div>
  );
}
