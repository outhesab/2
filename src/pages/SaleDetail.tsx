import { getAgent } from "@/agents";
import { useConfirm } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { formatDate, formatMoney } from "@/lib/utils-tr";
import { logger } from "@/lib/logger";
import type { AuditEntry, DB, Sale } from "@/types";
import { useLocation } from "wouter";

interface Props {
  db: DB;
}

function currentIdFromPath(location: string): string {
  return decodeURIComponent(location.split("/").filter(Boolean).pop() || "");
}

function auditMentionsSale(entry: AuditEntry, saleId: string): boolean {
  if (entry.entityId === saleId || entry.detail?.includes(saleId)) return true;
  try {
    return JSON.stringify([entry.prevValue, entry.nextValue]).includes(saleId);
  } catch {
    logger.warn('sale', 'auditMentionsSale JSON serileştirme hatası');
    return false;
  }
}

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 16,
};

const muted: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.86rem",
};

export default function SaleDetail({ db }: Props) {
  const [location, setLocation] = useLocation();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const saleId = currentIdFromPath(location);
  const sale = db.sales.find((item) => item.id === saleId);

  if (!sale || sale.deleted) {
    return (
      <div style={card}>
        <button onClick={() => setLocation("/sales")} style={backButton}>
          ← Satışlara dön
        </button>
        <h2 style={{ color: "#f8fafc", marginTop: 16 }}>Satış bulunamadı</h2>
        <p style={muted}>Bu satış silinmiş olabilir veya bağlantı eski olabilir.</p>
      </div>
    );
  }

  const cari = sale.cariId
    ? db.cari.find((item) => item.id === sale.cariId)
    : undefined;
  const invoices = db.invoices.filter(
    (invoice) => !invoice.deleted && invoice.saleId === sale.id,
  );
  const kasaEntries = db.kasa.filter(
    (entry) =>
      !entry.deleted &&
      (entry.relatedId === sale.id ||
        entry.description?.toLowerCase().includes(sale.productName.toLowerCase())),
  );
  const productIds = new Set(
    (sale.items || []).map((item) => item.productId).concat(sale.productId || []),
  );
  const stockMovements = db.stockMovements.filter(
    (movement) =>
      productIds.has(movement.productId) &&
      ["satis", "iade"].includes(movement.type) &&
      (movement.date || movement.createdAt || "").slice(0, 10) === sale.createdAt.slice(0, 10),
  );
  const auditLog = (db._auditLog || []).filter((entry) =>
    auditMentionsSale(entry, sale.id),
  );

  const handleReturn = () => {
    showConfirm(
      "Satış İade",
      "Bu satışı iade etmek istiyor musunuz? Stoklar geri yüklenecek.",
      async () => {
        const sonuc = await getAgent("satis").iadeYap(sale.id);
        showToast(
          sonuc.ok ? "İade işlemi tamamlandı." : sonuc.error || "İade başarısız",
          sonuc.ok ? "success" : "error",
        );
      },
    );
  };

  const handleCancel = () => {
    showConfirm(
      "Satış İptal",
      "Bu satışı iptal etmek istiyor musunuz? Stoklar geri yüklenecek.",
      async () => {
        const sonuc = await getAgent("satis").iptalEt(sale.id);
        showToast(
          sonuc.ok ? "Satış iptal edildi." : sonuc.error || "İptal başarısız",
          sonuc.ok ? "success" : "error",
        );
      },
    );
  };

  return (
    <div>
      <button onClick={() => setLocation("/sales")} style={backButton}>
        ← Satışlara dön
      </button>

      <section style={{ ...card, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ color: "#f8fafc", margin: 0 }}>Satış Detayı</h2>
            <div style={{ ...muted, marginTop: 4 }}>
              {formatDate(sale.createdAt)} · {cari?.name || sale.cariName || sale.customerName || "Cari yok"}
            </div>
          </div>
          <StatusBadge sale={sale} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginTop: 18 }}>
          <Metric label="Toplam" value={formatMoney(sale.total)} color="#10b981" />
          <Metric label="Kâr" value={formatMoney(sale.profit)} color={sale.profit >= 0 ? "#10b981" : "#ef4444"} />
          <Metric label="İskonto" value={formatMoney(sale.discountAmount || 0)} color="#f59e0b" />
          <Metric label="Ödeme" value={paymentLabel(sale.payment, db)} color="#60a5fa" />
        </div>

        {sale.status === "tamamlandi" && (
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={handleReturn} style={dangerSoftButton}>
              İade yap
            </button>
            <button onClick={handleCancel} style={warningSoftButton}>
              Satışı iptal et
            </button>
          </div>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginTop: 16 }}>
        <section style={card}>
          <h3 style={sectionTitle}>Ürünler</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {(sale.items || []).map((item) => (
              <div key={item.productId} style={row}>
                <div>
                  <button onClick={() => setLocation(`/urunler/${item.productId}`)} style={linkButton}>
                    {item.productName}
                  </button>
                  <div style={muted}>{item.quantity} adet · {formatMoney(item.unitPrice)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#f8fafc", fontWeight: 700 }}>{formatMoney(item.total)}</div>
                  <div style={{ color: item.unitPrice >= item.cost ? "#10b981" : "#ef4444", fontSize: "0.78rem" }}>
                    Kâr: {formatMoney((item.unitPrice - item.cost) * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={card}>
          <h3 style={sectionTitle}>Bağlı Kayıtlar</h3>
          <LinkedList
            title={`Fatura (${invoices.length})`}
            rows={invoices.map((invoice) => ({
              id: invoice.id,
              left: invoice.invoiceNo,
              right: formatMoney(invoice.total),
              sub: invoice.status,
            }))}
          />
          <LinkedList
            title={`Kasa (${kasaEntries.length})`}
            rows={kasaEntries.map((entry) => ({
              id: entry.id,
              left: entry.description || entry.category,
              right: formatMoney(entry.amount),
              sub: `${entry.type} · ${formatDate(entry.createdAt)}`,
            }))}
          />
          <LinkedList
            title={`Stok (${stockMovements.length})`}
            rows={stockMovements.map((movement) => ({
              id: movement.id,
              left: movement.productName,
              right: `${movement.before} → ${movement.after}`,
              sub: `${movement.type} · ${formatDate(movement.date)}`,
            }))}
          />
        </section>
      </div>

      <section style={{ ...card, marginTop: 16 }}>
        <h3 style={sectionTitle}>Denetim İzi</h3>
        {auditLog.length === 0 ? (
          <p style={muted}>Bu satış için denetim kaydı bulunamadı.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {auditLog.slice(0, 20).map((entry) => (
              <div key={entry.id} style={row}>
                <div>
                  <strong style={{ color: "#f8fafc" }}>{entry.action}</strong>
                  <div style={muted}>{entry.detail || entry.entity}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: statusColor(entry.status), fontWeight: 700 }}>{entry.status}</div>
                  <div style={muted}>{formatDate(entry.time)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function paymentLabel(payment: string, db: DB): string {
  return (
    db.kasalar.find((kasa) => kasa.id === payment)?.name ||
    ({ nakit: "Nakit", kart: "Kart", havale: "Havale", cari: "Cari" } as Record<string, string>)[payment] ||
    payment
  );
}

function statusColor(status: string): string {
  if (status === "applied" || status === "tamamlandi") return "#10b981";
  if (status === "warned" || status === "iade") return "#f59e0b";
  return "#ef4444";
}

function StatusBadge({ sale }: { sale: Sale }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        background: `${statusColor(sale.status)}22`,
        border: `1px solid ${statusColor(sale.status)}55`,
        borderRadius: 999,
        color: statusColor(sale.status),
        fontWeight: 800,
        padding: "6px 12px",
      }}
    >
      {sale.status === "tamamlandi"
        ? "Tamamlandı"
        : sale.status === "iade"
          ? "İade"
          : "İptal"}
    </span>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 10, border: `1px solid ${color}33`, padding: "12px 14px" }}>
      <div style={{ color, fontWeight: 800 }}>{value}</div>
      <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 3 }}>{label}</div>
    </div>
  );
}

function LinkedList({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; left: string; right: string; sub: string }[];
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: "#cbd5e1", fontWeight: 800, marginBottom: 8 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={muted}>Kayıt yok.</div>
      ) : (
        <div style={{ display: "grid", gap: 7 }}>
          {rows.map((rowItem) => (
            <div key={rowItem.id} style={row}>
              <div>
                <strong style={{ color: "#f8fafc" }}>{rowItem.left}</strong>
                <div style={muted}>{rowItem.sub}</div>
              </div>
              <div style={{ color: "#cbd5e1", fontWeight: 700 }}>{rowItem.right}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  color: "#f8fafc",
  margin: "0 0 12px",
  fontSize: "1rem",
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 10,
  padding: "10px 12px",
};

const backButton: React.CSSProperties = {
  background: "rgba(148,163,184,0.12)",
  border: "1px solid rgba(148,163,184,0.24)",
  borderRadius: 9,
  color: "#cbd5e1",
  cursor: "pointer",
  fontWeight: 700,
  padding: "8px 12px",
};

const dangerSoftButton: React.CSSProperties = {
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.28)",
  borderRadius: 9,
  color: "#f87171",
  cursor: "pointer",
  fontWeight: 800,
  padding: "8px 12px",
};

const warningSoftButton: React.CSSProperties = {
  background: "rgba(245,158,11,0.12)",
  border: "1px solid rgba(245,158,11,0.3)",
  borderRadius: 9,
  color: "#f59e0b",
  cursor: "pointer",
  fontWeight: 800,
  padding: "8px 12px",
};

const linkButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#60a5fa",
  cursor: "pointer",
  fontWeight: 800,
  padding: 0,
  textAlign: "left",
};
