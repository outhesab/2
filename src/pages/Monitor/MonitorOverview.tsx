interface Props {
  healthScore: number;
  summary: { total: number; critical: number; warning: number; info: number };
  alertCount: number;
}

export default function MonitorOverview({ healthScore, summary, alertCount }: Props) {
  const scoreColor =
    healthScore >= 80 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${scoreColor}18, ${scoreColor}08)`,
          border: `1px solid ${scoreColor}33`,
          borderRadius: 14,
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", fontWeight: 900, color: scoreColor }}>
          {healthScore}
        </div>
        <div
          style={{ color: "var(--text-dim)", fontSize: "0.78rem", fontWeight: 600 }}
        >
          Sağlık Skoru
        </div>
      </div>
      <div
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 14,
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ef4444" }}>
          {summary.critical}
        </div>
        <div
          style={{ color: "var(--text-dim)", fontSize: "0.78rem", fontWeight: 600 }}
        >
          Kritik
        </div>
      </div>
      <div
        style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 14,
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#f59e0b" }}>
          {summary.warning}
        </div>
        <div
          style={{ color: "var(--text-dim)", fontSize: "0.78rem", fontWeight: 600 }}
        >
          Uyarı
        </div>
      </div>
      <div
        style={{
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 14,
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#3b82f6" }}>
          {summary.info}
        </div>
        <div
          style={{ color: "var(--text-dim)", fontSize: "0.78rem", fontWeight: 600 }}
        >
          Bilgi
        </div>
      </div>
      <div
        style={{
          background: "rgba(255,87,34,0.08)",
          border: "1px solid rgba(255,87,34,0.2)",
          borderRadius: 14,
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ff5722" }}>
          {alertCount}
        </div>
        <div
          style={{ color: "var(--text-dim)", fontSize: "0.78rem", fontWeight: 600 }}
        >
          Aktif Alarm
        </div>
      </div>
    </div>
  );
}
