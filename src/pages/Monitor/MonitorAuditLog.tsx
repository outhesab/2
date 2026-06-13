import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/utils-tr";
import { inp } from "@/lib/formStyles";
import type { AuditEntry } from "@/types";

interface Props {
  auditLog: AuditEntry[];
}

export default function MonitorAuditLog({ auditLog }: Props) {
  const [auditStatusFilter, setAuditStatusFilter] = useState<
    "all" | "applied" | "blocked" | "warned"
  >("all");
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  const filteredAuditLog = auditLog.filter(
    (e) => auditStatusFilter === "all" || e.status === auditStatusFilter,
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <select
          value={auditStatusFilter}
          onChange={(e) =>
            setAuditStatusFilter(e.target.value as typeof auditStatusFilter)
          }
          style={inp}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="applied">✅ Uygulandı</option>
          <option value="warned">⚠️ Uyarıyla Uygulandı</option>
          <option value="blocked">🚫 Engellendi</option>
        </select>
      </div>

      {filteredAuditLog.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Denetim kaydı yok"
          description="İşlemler otomatik olarak denetim loguna kaydedilecek."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredAuditLog.slice(0, 200).map((entry) => {
            const statusColor =
              entry.status === "blocked"
                ? "#ef4444"
                : entry.status === "warned"
                  ? "#f59e0b"
                  : "#10b981";
            const statusLabel =
              entry.status === "blocked"
                ? "🚫 Engellendi"
                : entry.status === "warned"
                  ? "⚠️ Uyarı"
                  : "✅ Uygulandı";
            const isExpanded = expandedAuditId === entry.id;

            const prevKeys =
              entry.prevValue && typeof entry.prevValue === "object"
                ? Object.keys(entry.prevValue as object)
                : [];
            const nextKeys =
              entry.nextValue && typeof entry.nextValue === "object"
                ? Object.keys(entry.nextValue as object)
                : [];
            const changedFields = [
              ...new Set([...prevKeys, ...nextKeys]),
            ].filter((k) => !k.startsWith("_"));

            return (
              <div
                key={entry.id}
                style={{
                  background: `${statusColor}08`,
                  border: `1px solid ${statusColor}25`,
                  borderRadius: 12,
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background: `${statusColor}22`,
                      color: statusColor,
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {statusLabel}
                  </span>
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                    }}
                  >
                    {entry.action}
                  </span>
                  <span
                    style={{
                      color: "var(--text-dim)",
                      fontSize: "0.82rem",
                    }}
                  >
                    {entry.entity}
                    {entry.entityId ? ` #${entry.entityId.slice(0, 8)}` : ""}
                  </span>
                  {changedFields.length > 0 && (
                    <span
                      style={{
                        color: "#60a5fa",
                        fontSize: "0.78rem",
                        background: "rgba(96,165,250,0.1)",
                        borderRadius: 5,
                        padding: "1px 6px",
                      }}
                    >
                      {changedFields.slice(0, 3).join(", ")}
                      {changedFields.length > 3
                        ? ` +${changedFields.length - 3}`
                        : ""}
                    </span>
                  )}
                  <span
                    style={{
                      marginLeft: "auto",
                      color: "#475569",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(entry.time)}
                  </span>
                  {entry.status === "blocked" &&
                    entry.violations &&
                    entry.violations.length > 0 && (
                      <button
                        onClick={() =>
                          setExpandedAuditId(isExpanded ? null : entry.id)
                        }
                        style={{
                          background: "rgba(239,68,68,0.1)",
                          border: "none",
                          borderRadius: 6,
                          color: "#ef4444",
                          padding: "3px 8px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {isExpanded ? "▲ Gizle" : "▼ İhlaller"}
                      </button>
                    )}
                </div>

                {isExpanded && entry.violations && (
                  <div
                    style={{
                      marginTop: 10,
                      borderTop: "1px solid rgba(239,68,68,0.2)",
                      paddingTop: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {entry.violations.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            color:
                              v.severity === "block" ? "#ef4444" : "#f59e0b",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.severity === "block" ? "🚫" : "⚠️"} {v.ruleName}
                        </span>
                        <span
                          style={{
                            color: "var(--text-dim)",
                            fontSize: "0.82rem",
                          }}
                        >
                          {v.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
