import { useState } from "react";
import { FileCheck } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { inp } from "@/lib/formStyles";
import type { IntegrityIssue, IssueSeverity } from "@/lib/dataIntegrityChecker";
import { categoryLabels, levelColors, severityLabels } from "./types";

interface Props {
  issues: IntegrityIssue[];
}

export default function MonitorIssues({ issues }: Props) {
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredIssues = issues
    .filter((i) => severityFilter === "all" || i.severity === severityFilter)
    .filter((i) => categoryFilter === "all" || i.category === categoryFilter);

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
          value={severityFilter}
          onChange={(e) =>
            setSeverityFilter(e.target.value as typeof severityFilter)
          }
          style={inp}
        >
          <option value="all">Tüm Seviyeler</option>
          <option value="critical">🔴 Kritik</option>
          <option value="warning">🟡 Uyarı</option>
          <option value="info">🔵 Bilgi</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={inp}
        >
          <option value="all">Tüm Kategoriler</option>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {filteredIssues.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="Tüm veriler tutarlı!"
          description="Hiçbir veri bütünlüğü sorunu bulunamadı."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              style={{
                background: `${levelColors[issue.severity]}0a`,
                border: `1px solid ${levelColors[issue.severity]}25`,
                borderRadius: 12,
                padding: "14px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    background: `${levelColors[issue.severity]}22`,
                    color: levelColors[issue.severity],
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {severityLabels[issue.severity]}
                </span>
                <span
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: "0.72rem",
                    color: "var(--text-dim)",
                    fontWeight: 600,
                  }}
                >
                  {categoryLabels[issue.category] || issue.category}
                </span>
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  {issue.title}
                </span>
              </div>
              <p
                style={{
                  color: "var(--text-dim)",
                  fontSize: "0.85rem",
                  marginBottom: issue.suggestion ? 6 : 0,
                }}
              >
                {issue.detail}
              </p>
              {issue.suggestion && (
                <p
                  style={{
                    color: "#60a5fa",
                    fontSize: "0.82rem",
                    fontStyle: "italic",
                  }}
                >
                  💡 {issue.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
