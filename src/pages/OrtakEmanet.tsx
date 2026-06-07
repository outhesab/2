import { useToast } from "@/components/Toast";
import { formatDate, formatMoney, genId } from "@/lib/utils-tr";
import type { DB, OrtakEmanet as OrtakEmanetType } from "@/types";
import { useMemo, useState } from "react";
import { cardStyle, mutedText, sectionTitleStyle, rowStyle, Metric } from "@/pages/pageHelpers.tsx";

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

export default function OrtakEmanet({ db, save }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    partnerId: "",
    amount: "",
    type: "emanet" as "emanet" | "iade",
    kasa: "nakit",
    note: "",
  });

  const activePartners = useMemo(() => db.partners || [], [db.partners]);
  const activeEntries = useMemo(
    () =>
      (db.ortakEmanetler || []).filter(
        (entry) => !(entry as { deleted?: boolean }).deleted,
      ),
    [db.ortakEmanetler],
  );

  const partnerRows = useMemo(() => {
    return activePartners.map((partner) => {
      const entries = activeEntries.filter((entry) => entry.partnerId === partner.id);
      const emanet = entries
        .filter((entry) => entry.type === "emanet")
        .reduce((sum, entry) => sum + entry.amount, 0);
      const iade = entries
        .filter((entry) => entry.type === "iade")
        .reduce((sum, entry) => sum + entry.amount, 0);
      const cari = db.cari.find((item) => item.ortak && item.partnerId === partner.id && !item.deleted);
      const net = emanet - iade;
      return {
        partner,
        entries,
        emanet,
        iade,
        net,
        cari,
        mismatch: Math.abs(net - (cari?.balance || 0)) > 0.01,
      };
    });
  }, [activeEntries, activePartners, db.cari]);

  const totalEmanet = partnerRows.reduce((sum, row) => sum + row.emanet, 0);
  const totalIade = partnerRows.reduce((sum, row) => sum + row.iade, 0);
  const totalNet = totalEmanet - totalIade;

  const saveEntry = () => {
    const amount = Number(form.amount);
    if (!form.partnerId) {
      showToast("Ortak seçin.", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Geçerli tutar girin.", "error");
      return;
    }
    const partnerRow = partnerRows.find((row) => row.partner.id === form.partnerId);
    if (form.type === "iade" && partnerRow && amount > partnerRow.net) {
      showToast("İade tutarı açık emanet bakiyesini aşamaz.", "error");
      return;
    }

    const partner = activePartners.find((item) => item.id === form.partnerId);
    const nowIso = new Date().toISOString();
    const description =
      form.note ||
      (form.type === "emanet"
        ? `Ortak emanet: ${partner?.name || ""}`
        : `Ortak iade: ${partner?.name || ""}`);

    save((prev) => {
      const emanetEntry: OrtakEmanetType = {
        id: genId(),
        partnerId: form.partnerId,
        amount,
        note: form.note,
        description,
        type: form.type,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const kasaEntry = {
        id: genId(),
        type: form.type === "emanet" ? ("gider" as const) : ("gelir" as const),
        category: form.type === "emanet" ? "ortak_emanet" : "ortak_tahsilat",
        amount,
        kasa: form.kasa,
        description,
        relatedId: form.partnerId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const cari = prev.cari.map((item) =>
        item.ortak && item.partnerId === form.partnerId
          ? {
              ...item,
              balance:
                (item.balance || 0) + (form.type === "emanet" ? amount : -amount),
              lastTransaction: nowIso,
              updatedAt: nowIso,
            }
          : item,
      );
      return {
        ...prev,
        ortakEmanetler: [emanetEntry, ...(prev.ortakEmanetler || [])],
        kasa: [...prev.kasa, kasaEntry],
        cari,
      };
    });

    showToast(form.type === "emanet" ? "Emanet kaydedildi." : "İade kaydedildi.", "success");
    setForm({ partnerId: "", amount: "", type: "emanet", kasa: "nakit", note: "" });
  };

  return (
    <div>
      <section style={cardStyle}>
        <h2 style={{ color: "#f8fafc", margin: 0 }}>İş Ortağı Emanet Takibi</h2>
        <p style={{ ...mutedText, marginTop: 6 }}>
          Ortaklara verilen emanet ve iade kayıtları kasa ve cari bakiyeyle birlikte izlenir.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 16 }}>
          <Metric label="Toplam Emanet" value={formatMoney(totalEmanet)} color="#f59e0b" />
          <Metric label="Toplam İade" value={formatMoney(totalIade)} color="#10b981" />
          <Metric label="Açık Bakiye" value={formatMoney(totalNet)} color={totalNet > 0 ? "#ef4444" : "#10b981"} />
          <Metric label="Ortak" value={`${activePartners.length}`} color="#60a5fa" />
        </div>
      </section>

      <section style={{ ...cardStyle, marginTop: 16 }}>
        <h3 style={sectionTitleStyle}>Yeni Kayıt</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
          <Field label="Ortak">
            <select value={form.partnerId} onChange={(event) => setForm((prev) => ({ ...prev, partnerId: event.target.value }))} style={input}>
              <option value="">Ortak seç</option>
              {activePartners.map((partner) => (
                <option key={partner.id} value={partner.id}>{partner.name}</option>
              ))}
            </select>
          </Field>
          <Field label="İşlem">
            <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as "emanet" | "iade" }))} style={input}>
              <option value="emanet">Emanet verildi</option>
              <option value="iade">İade alındı</option>
            </select>
          </Field>
          <Field label="Kasa">
            <select value={form.kasa} onChange={(event) => setForm((prev) => ({ ...prev, kasa: event.target.value }))} style={input}>
              {(db.kasalar || []).map((kasa) => (
                <option key={kasa.id} value={kasa.id}>{kasa.icon} {kasa.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Tutar">
            <input type="number" min={0} step={0.01} value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} style={input} />
          </Field>
          <div style={{ gridColumn: "1/-1" }}>
            <Field label="Not">
              <input value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} style={input} placeholder="Açıklama" />
            </Field>
          </div>
        </div>
        <button onClick={saveEntry} style={{ ...primaryButton, marginTop: 12 }}>
          Kaydet
        </button>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginTop: 16 }}>
        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>Ortak Bakiyeleri</h3>
          {partnerRows.length === 0 ? (
            <p style={mutedText}>Ortak kaydı yok. Önce Ortaklar sayfasından ortak ekleyin.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {partnerRows.map((rowItem) => (
                <div key={rowItem.partner.id} style={rowStyle}>
                  <div>
                    <strong style={{ color: "#f8fafc" }}>{rowItem.partner.name}</strong>
                    <div style={mutedText}>
                      Emanet {formatMoney(rowItem.emanet)} · İade {formatMoney(rowItem.iade)}
                    </div>
                    {rowItem.mismatch && (
                      <div style={{ color: "#f59e0b", fontSize: "0.78rem", marginTop: 3 }}>
                        Cari bakiye ile fark: {formatMoney((rowItem.cari?.balance || 0) - rowItem.net)}
                      </div>
                    )}
                  </div>
                  <div style={{ color: rowItem.net > 0 ? "#ef4444" : "#10b981", fontWeight: 800 }}>
                    {formatMoney(rowItem.net)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>Son Hareketler</h3>
          {activeEntries.length === 0 ? (
            <p style={mutedText}>Emanet hareketi yok.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {[...activeEntries]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 30)
                .map((entry) => {
                  const partner = activePartners.find((item) => item.id === entry.partnerId);
                  return (
                    <div key={entry.id} style={rowStyle}>
                      <div>
                        <strong style={{ color: "#f8fafc" }}>{partner?.name || "Ortak yok"}</strong>
                        <div style={mutedText}>{entry.description || entry.note || "Açıklama yok"}</div>
                        <div style={mutedText}>{formatDate(entry.createdAt)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: entry.type === "emanet" ? "#f59e0b" : "#10b981", fontWeight: 800 }}>
                          {formatMoney(entry.amount)}
                        </div>
                        <div style={{ color: entry.type === "emanet" ? "#f59e0b" : "#10b981", fontSize: "0.78rem" }}>
                          {entry.type === "emanet" ? "Emanet" : "İade"}
                        </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span style={{ display: "block", color: "#94a3b8", fontSize: "0.82rem", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}



const input: React.CSSProperties = {
  width: "100%",
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 9,
  boxSizing: "border-box",
  color: "#f8fafc",
  padding: "9px 10px",
};

const primaryButton: React.CSSProperties = {
  background: "#10b981",
  border: "none",
  borderRadius: 9,
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
  padding: "10px 16px",
};
