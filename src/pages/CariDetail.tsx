import { formatDate, formatMoney } from "@/lib/utils-tr";
import type { DB } from "@/types";
import { useMemo } from "react";
import { useLocation } from "wouter";

interface Props {
  db: DB;
}

type StatementRow = {
  id: string;
  date: string;
  type: "satis" | "kasa" | "fatura" | "taksit";
  title: string;
  detail: string;
  amount: number;
  balance: number;
};

function currentIdFromPath(location: string): string {
  return decodeURIComponent(location.split("/").filter(Boolean).pop() || "");
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

export default function CariDetail({ db }: Props) {
  const [location, setLocation] = useLocation();
  const cariId = currentIdFromPath(location);
  const cari = db.cari.find((item) => !item.deleted && item.id === cariId);

  const statement = useMemo(() => {
    if (!cari) return [] as StatementRow[];

    const rows: Omit<StatementRow, "balance">[] = [];
    db.sales
      .filter(
        (sale) =>
          !sale.deleted &&
          sale.status === "tamamlandi" &&
          (sale.cariId === cari.id || sale.cariName === cari.name),
      )
      .forEach((sale) => {
        rows.push({
          id: sale.id,
          date: sale.createdAt,
          type: "satis",
          title: sale.productName,
          detail: `${sale.quantity} adet · ${sale.payment}`,
          amount: sale.total,
        });
      });

    db.kasa
      .filter((entry) => !entry.deleted && entry.cariId === cari.id)
      .forEach((entry) => {
        rows.push({
          id: entry.id,
          date: entry.createdAt,
          type: "kasa",
          title: entry.description || entry.category,
          detail: `${entry.type} · ${entry.kasa}`,
          amount: -entry.amount,
        });
      });

    db.invoices
      .filter(
        (invoice) =>
          !invoice.deleted &&
          (invoice.cariId === cari.id || invoice.cariName === cari.name),
      )
      .forEach((invoice) => {
        rows.push({
          id: invoice.id,
          date: invoice.createdAt,
          type: "fatura",
          title: invoice.invoiceNo,
          detail: `${invoice.type} · ${invoice.status}`,
          amount: invoice.saleId ? 0 : invoice.total,
        });
      });

    let balance = 0;
    return rows
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((row) => {
        balance += row.amount;
        return { ...row, balance };
      })
      .reverse();
  }, [cari, db.invoices, db.kasa, db.sales]);

  if (!cari) {
    return (
      <div style={card}>
        <button onClick={() => setLocation("/cari")} style={backButton}>
          ← Carilere dön
        </button>
        <h2 style={{ color: "#f8fafc", marginTop: 16 }}>Cari bulunamadı</h2>
        <p style={muted}>Bu cari silinmiş olabilir veya bağlantı eski olabilir.</p>
      </div>
    );
  }

  const invoices = db.invoices.filter(
    (invoice) =>
      !invoice.deleted &&
      (invoice.cariId === cari.id || invoice.cariName === cari.name),
  );
  const overdueInstallments = db.installments.filter((installment) => {
    if (installment.paid) return false;
    if (installment.dueDate >= new Date().toISOString().slice(0, 10)) return false;
    return invoices.some((invoice) => invoice.id === installment.invoiceId);
  });
  const totalSales = db.sales
    .filter((sale) => !sale.deleted && sale.cariId === cari.id)
    .reduce((sum, sale) => sum + sale.total, 0);
  const totalPayments = db.kasa
    .filter((entry) => !entry.deleted && entry.cariId === cari.id)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const mailTemplate = `mailto:${cari.email || ""}?subject=PARSPEL teklif&body=Merhaba ${encodeURIComponent(cari.name)},%0A%0ASizin için hazırladığımız teklif detaylarını paylaşmak isteriz.%0A%0ASaygılarımızla.`;

  return (
    <div>
      <button onClick={() => setLocation("/cari")} style={backButton}>
        ← Carilere dön
      </button>

      <section style={{ ...card, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ color: "#f8fafc", margin: 0 }}>{cari.name}</h2>
            <div style={{ ...muted, marginTop: 4 }}>
              {cari.type === "musteri" ? "Müşteri" : "Tedarikçi"}
              {cari.ortak ? " · Ortak cari" : ""}
              {cari.phone ? ` · ${cari.phone}` : ""}
            </div>
          </div>
          <a href={mailTemplate} style={mailButton}>
            Teklif e-postası
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginTop: 18 }}>
          <Metric label="Güncel Bakiye" value={formatMoney(Math.abs(cari.balance || 0))} color={cari.balance > 0 ? "#10b981" : cari.balance < 0 ? "#ef4444" : "#64748b"} />
          <Metric label="Satış Toplamı" value={formatMoney(totalSales)} color="#60a5fa" />
          <Metric label="Tahsilat/Ödeme" value={formatMoney(totalPayments)} color="#f59e0b" />
          <Metric label="Gecikmiş Taksit" value={`${overdueInstallments.length}`} color={overdueInstallments.length > 0 ? "#ef4444" : "#10b981"} />
        </div>
      </section>

      {overdueInstallments.length > 0 && (
        <section style={{ ...card, marginTop: 16, borderColor: "rgba(239,68,68,0.4)" }}>
          <h3 style={sectionTitle}>Vadesi Geçmiş Taksitler</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {overdueInstallments.map((installment) => (
              <div key={installment.id} style={row}>
                <div>
                  <strong style={{ color: "#f8fafc" }}>{formatDate(installment.dueDate)}</strong>
                  <div style={muted}>Fatura: {invoices.find((invoice) => invoice.id === installment.invoiceId)?.invoiceNo || installment.invoiceId}</div>
                </div>
                <div style={{ color: "#ef4444", fontWeight: 800 }}>
                  {formatMoney(installment.amount)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(260px,0.8fr)", gap: 16, marginTop: 16 }}>
        <section style={card}>
          <h3 style={sectionTitle}>Hesap Ekstresi</h3>
          {statement.length === 0 ? (
            <p style={muted}>Bu cari için işlem bulunmuyor.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {statement.map((item) => (
                <div key={`${item.type}-${item.id}`} style={row}>
                  <div>
                    <strong style={{ color: "#f8fafc" }}>{item.title}</strong>
                    <div style={muted}>{formatDate(item.date)} · {item.detail}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: item.amount >= 0 ? "#10b981" : "#ef4444", fontWeight: 800 }}>
                      {item.amount === 0 ? "Bilgi" : formatMoney(item.amount)}
                    </div>
                    <div style={muted}>Bakiye: {formatMoney(item.balance)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <h3 style={sectionTitle}>Bakiye Trendi</h3>
          {statement.length === 0 ? (
            <p style={muted}>Trend için işlem yok.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {[...statement].reverse().slice(-8).map((item) => {
                const max = Math.max(
                  1,
                  ...statement.map((rowItem) => Math.abs(rowItem.balance)),
                );
                const width = Math.max(4, (Math.abs(item.balance) / max) * 100);
                return (
                  <div key={`trend-${item.type}-${item.id}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "0.78rem", marginBottom: 4 }}>
                      <span>{formatDate(item.date)}</span>
                      <span>{formatMoney(item.balance)}</span>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 999, height: 9, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${width}%`,
                          height: "100%",
                          background: item.balance >= 0 ? "#10b981" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
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

const mailButton: React.CSSProperties = {
  alignSelf: "flex-start",
  background: "rgba(59,130,246,0.14)",
  border: "1px solid rgba(59,130,246,0.32)",
  borderRadius: 9,
  color: "#60a5fa",
  fontWeight: 800,
  padding: "8px 12px",
  textDecoration: "none",
};
