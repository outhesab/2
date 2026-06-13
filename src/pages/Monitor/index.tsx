import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Bug } from "lucide-react";
import { clearErrorLogs, getErrorLogs } from "@/components/ErrorBoundary";
import { useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import {
  getHealthScore,
  getIntegritySummary,
  runIntegrityCheck,
} from "@/lib/dataIntegrityChecker";
import { formatDate, formatMoney } from "@/lib/utils-tr";
import type { AuditEntry, DB } from "@/types";
import { TabButton } from "../pageHelpers";
import { getActionIcon, levelColors } from "./types";
import MonitorOverview from "./MonitorOverview";
import MonitorIssues from "./MonitorIssues";
import MonitorRules from "./MonitorRules";
import MonitorAuditLog from "./MonitorAuditLog";

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

export default function Monitor({ db, save }: Props) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<
    "health" | "alerts" | "rules" | "errors" | "activity" | "audit"
  >("health");

  const integrityIssues = useMemo(() => runIntegrityCheck(db), [db]);
  const summary = useMemo(
    () => getIntegritySummary(integrityIssues),
    [integrityIssues],
  );
  const healthScore = useMemo(() => getHealthScore(db), [db]);

  const alerts = useMemo(
    () =>
      db.monitorRules
        .filter((r) => r.active)
        .flatMap((r) => {
          const msgs: { level: string; msg: string }[] = [];
          if (r.type === "stok_sifir") {
            const count = db.products.filter(
              (p) => !p.deleted && p.stock === 0,
            ).length;
            if (count > 0)
              msgs.push({ level: r.level, msg: `${count} ürün stoğu bitti!` });
          } else if (r.type === "stok_min") {
            const count = db.products.filter(
              (p) => !p.deleted && p.stock > 0 && p.stock <= p.minStock,
            ).length;
            if (count > 0)
              msgs.push({
                level: r.level,
                msg: `${count} üründe düşük stok uyarısı!`,
              });
          } else if (r.type === "kasa_min" && r.threshold !== undefined) {
            const kasaId = r.kasa || "nakit";
            const bal = db.kasa
              .filter((k) => !k.deleted && k.kasa === kasaId)
              .reduce(
                (s, k) => s + (k.type === "gelir" ? k.amount : -k.amount),
                0,
              );
            if (bal < r.threshold)
              msgs.push({
                level: r.level,
                msg: `${kasaId} kasası düşük: ${formatMoney(bal)}`,
              });
          } else if (r.type === "alacak_vadeli") {
            const alacak = db.cari.filter(
              (c) => c.type === "musteri" && c.balance > 0,
            );
            if (alacak.length > 0) {
              const toplam = alacak.reduce((s, c) => s + c.balance, 0);
              msgs.push({
                level: r.level,
                msg: `${alacak.length} müşteride toplam ${formatMoney(toplam)} alacak var`,
              });
            }
          } else if (r.type === "borc_vadeli") {
            const borc = db.cari.filter(
              (c) => c.type === "tedarikci" && c.balance > 0,
            );
            if (borc.length > 0) {
              const toplam = borc.reduce((s, c) => s + c.balance, 0);
              msgs.push({
                level: r.level,
                msg: `${borc.length} tedarikçiye toplam ${formatMoney(toplam)} borç var`,
              });
            }
          } else if (r.type === "satis_hedef" && r.threshold !== undefined) {
            const todayStr = new Date().toLocaleDateString("sv-SE");
            const bugunCiro = db.sales
              .filter(
                (s) =>
                  !s.deleted &&
                  s.status === "tamamlandi" &&
                  s.createdAt.slice(0, 10) === todayStr,
              )
              .reduce((s, x) => s + x.total, 0);
            if (bugunCiro < r.threshold)
              msgs.push({
                level: r.level,
                msg: `Günlük hedef: ${formatMoney(bugunCiro)} / ${formatMoney(r.threshold)} (%${((bugunCiro / r.threshold) * 100).toFixed(0)})`,
              });
          }
          return msgs.map((m) => ({ ...m, ruleName: r.name }));
        }),
    [db],
  );

  const errorLogs = getErrorLogs();
  const activityLog = db._activityLog || [];
  const auditLog: AuditEntry[] = db._auditLog || [];

  return (
    <div>
      <MonitorOverview
        healthScore={healthScore}
        summary={summary}
        alertCount={alerts.length}
      />

      <div
        style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}
      >
        {(
          [
            ["health", `🩺 Veri Sağlığı (${summary.total})`],
            ["alerts", `🔔 Alarmlar (${alerts.length})`],
            ["rules", `⚙️ Kurallar (${db.monitorRules.length})`],
            ["errors", `🐛 Hata Logları (${errorLogs.length})`],
            ["activity", `📋 Aktivite (${activityLog.length})`],
            ["audit", `🔒 Denetim Logu (${auditLog.length})`],
          ] as const
        ).map(([id, label]) => (
          <TabButton
            key={id}
            id={id}
            label={label}
            active={tab === id}
            onSelect={(v) => setTab(v)}
          />
        ))}
      </div>

      {tab === "health" && <MonitorIssues issues={integrityIssues} />}

      {tab === "alerts" && (
        <>
          {alerts.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Aktif alarm yok"
              description="Tüm sistem göstergeleri normal sınırlar içinde."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.map((a, i) => (
                <div
                  key={i}
                  style={{
                    background: `${levelColors[a.level] || "#94a3b8"}15`,
                    border: `1px solid ${levelColors[a.level] || "#94a3b8"}40`,
                    borderRadius: 10,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: levelColors[a.level] || "#94a3b8",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.9rem",
                      flex: 1,
                    }}
                  >
                    {a.msg}
                  </span>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {a.ruleName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "rules" && (
        <MonitorRules rules={db.monitorRules} save={save} />
      )}

      {tab === "errors" && (
        <>
          {errorLogs.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => {
                  clearErrorLogs();
                  showToast("Hata logları temizlendi!", "success");
                }}
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10,
                  color: "#ef4444",
                  padding: "8px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                🗑️ Logları Temizle
              </button>
            </div>
          )}
          {errorLogs.length === 0 ? (
            <EmptyState
              icon={Bug}
              title="Hata kaydı yok!"
              description="Uygulama hatasız çalışıyor."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {errorLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: 12,
                    padding: "14px 18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        color: "#ef4444",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      {log.message}
                    </span>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.78rem",
                      }}
                    >
                      {formatDate(log.time || "")}
                    </span>
                  </div>
                  {log.stack && (
                    <pre
                      style={{
                        color: "var(--text-dim)",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        background: "#0f172a",
                        borderRadius: 8,
                        padding: "8px 12px",
                        overflow: "auto",
                        maxHeight: 120,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {log.stack}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "activity" && (
        <>
          {activityLog.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Aktivite kaydı yok"
              description="İşlemler otomatik olarak kaydedilecek."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {activityLog.slice(0, 100).map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: "#1e293b",
                    borderRadius: 10,
                    border: "1px solid #334155",
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>
                    {getActionIcon(log.action)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                      }}
                    >
                      {log.action}
                    </span>
                    {log.detail && (
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.82rem",
                          marginLeft: 8,
                        }}
                      >
                        — {log.detail}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      color: "#475569",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(log.time || "")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "audit" && <MonitorAuditLog auditLog={auditLog} />}
    </div>
  );
}
