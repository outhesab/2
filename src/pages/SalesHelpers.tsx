import type { CSSProperties } from "react";

export const paymentLabels: Record<string, string> = {
  nakit: "Nakit",
  kart: "Kart",
  havale: "Havale",
  cari: "Cari",
};

export const lbl: CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "var(--text-dim)",
  fontSize: "0.85rem",
  fontWeight: 500,
};

export const sinp: CSSProperties = {
  padding: "9px 13px",
  background: "var(--bg-card)",
  border: "1px solid #334155",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: "0.9rem",
};

export const sinpStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(15,23,42,0.6)",
  border: "1px solid #334155",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  boxSizing: "border-box",
};

export function StatCard({
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

export function Row({
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
