import type { CSSProperties } from "react";
export { StatCard } from "./pageHelpers";

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
