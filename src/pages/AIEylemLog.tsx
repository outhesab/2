import { useConfirm } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { formatDate } from "@/lib/utils-tr";
import type { AIActionLogEntry, DB } from "@/types";
import { useMemo, useState } from "react";

interface Props {
  db: DB;
  undo: () => boolean;
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

export default function AIEylemLog({ db, undo }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [statusFilter, setStatusFilter] = useState<"all" | AIActionLogEntry["status"]>("all");
  const [modelFilter, setModelFilter] = useState<"all" | AIActionLogEntry["model"]>("all");
  const [showDangerOnly, setShowDangerOnly] = useState(false);

  const logs = useMemo(() => {
    return [...(db.aiActionLog || [])]
      .filter((entry) => statusFilter === "all" || entry.status === statusFilter)
      .filter((entry) => modelFilter === "all" || entry.model === modelFilter)
      .filter((entry) => !showDangerOnly || entry.dangerous)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [db.aiActionLog, modelFilter, showDangerOnly, statusFilter]);

  const totals = {
    all: db.aiActionLog?.length || 0,
    applied: (db.aiActionLog || []).filter((entry) => entry.status === "applied").length,
    failed: (db.aiActionLog || []).filter((entry) => entry.status === "failed").length,
    dangerous: (db.aiActionLog || []).filter((entry) => entry.dangerous).length,
  };

  const handleUndo = (entry: AIActionLogEntry) => {
    showConfirm(
      "AI İşlemini Geri Al",
      `"${entry.label}" kaydı için uygulamadaki en son değişiklik geri alınacak. Devam etmek istiyor musunuz?`,
      () => {
        const ok = undo();
        showToast(
          ok ? "Son değişiklik geri alındı." : "Geri alınacak işlem bulunamadı.",
          ok ? "success" : "error",
        );
      },
    );
  };

  return (
    <div>
      <section style={card}>
        <h2 style={{ color: "#f8fafc", margin: 0 }}>AI Aksiyon Günlüğü</h2>
        <p style={{ ...muted, marginTop: 6 }}>
          AI Asistan tarafından uygulanan DB aksiyonları ve engellenen denemeler.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginTop: 16 }}>
          <Metric label="Toplam" value={`${totals.all}`} color="#60a5fa" />
          <Metric label="Uygulanan" value={`${totals.applied}`} color="#10b981" />
          <Metric label="Başarısız" value={`${totals.failed}`} color="#ef4444" />
          <Metric label="Riskli" value={`${totals.dangerous}`} color="#f59e0b" />
        </div>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} style={input}>
            <option value="all">Tüm durumlar</option>
            <option value="applied">Uygulanan</option>
            <option value="blocked">Engellenen</option>
            <option value="failed">Başarısız</option>
          </select>
          <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value as typeof modelFilter)} style={input}>
            <option value="all">Tüm modeller</option>
            <option value="claude">Claude</option>
            <option value="deepseek">DeepSeek</option>
            <option value="gemini">Gemini</option>
            <option value="offline">Offline</option>
          </select>
          <button
            onClick={() => setShowDangerOnly((value) => !value)}
            style={{
              ...toggleButton,
              background: showDangerOnly ? "rgba(245,158,11,0.18)" : "rgba(148,163,184,0.1)",
              borderColor: showDangerOnly ? "rgba(245,158,11,0.35)" : "rgba(148,163,184,0.22)",
              color: showDangerOnly ? "#f59e0b" : "#cbd5e1",
            }}
          >
            Riskli aksiyonlar
          </button>
        </div>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        {logs.length === 0 ? (
          <p style={muted}>Filtreye uygun AI aksiyon kaydı yok.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {logs.map((entry) => (
              <article key={entry.id} style={row}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ color: "#f8fafc" }}>{entry.label}</strong>
                    <Badge label={entry.status} color={statusColor(entry.status)} />
                    <Badge label={entry.model} color="#60a5fa" />
                    <Badge label={entry.mode === "auto" ? "Otomatik" : "Manuel"} color="#a78bfa" />
                    {entry.dangerous && <Badge label="Riskli" color="#f59e0b" />}
                  </div>
                  <div style={{ ...muted, marginTop: 6 }}>
                    {entry.actionType} · {formatDate(entry.createdAt)}
                  </div>
                  {entry.affectedIds && entry.affectedIds.length > 0 && (
                    <div style={{ ...muted, marginTop: 4 }}>
                      Etkilenen kayıtlar: {entry.affectedIds.join(", ")}
                    </div>
                  )}
                  {entry.error && (
                    <div style={{ color: "#f87171", fontSize: "0.82rem", marginTop: 6 }}>
                      {entry.error}
                    </div>
                  )}
                  {entry.notes && entry.notes.length > 0 && (
                    <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: 6 }}>
                      {entry.notes.slice(0, 3).join(" · ")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleUndo(entry)}
                  disabled={entry.status !== "applied"}
                  style={{
                    ...undoButton,
                    opacity: entry.status === "applied" ? 1 : 0.45,
                    cursor: entry.status === "applied" ? "pointer" : "not-allowed",
                  }}
                >
                  Geri Al
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function statusColor(status: AIActionLogEntry["status"]): string {
  if (status === "applied") return "#10b981";
  if (status === "blocked") return "#f59e0b";
  return "#ef4444";
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        background: `${color}22`,
        border: `1px solid ${color}55`,
        borderRadius: 999,
        color,
        fontSize: "0.72rem",
        fontWeight: 800,
        padding: "3px 8px",
      }}
    >
      {label}
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

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 10,
  padding: "12px",
};

const input: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 9,
  color: "#f8fafc",
  padding: "9px 10px",
};

const toggleButton: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,0.22)",
  borderRadius: 9,
  cursor: "pointer",
  fontWeight: 800,
  padding: "9px 12px",
};

const undoButton: React.CSSProperties = {
  alignSelf: "center",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.32)",
  borderRadius: 9,
  color: "#f87171",
  flex: "0 0 auto",
  fontWeight: 800,
  padding: "8px 12px",
};
