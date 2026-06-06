export const lbl: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "var(--text-dim)",
  fontSize: "0.85rem",
  fontWeight: 500,
};

export const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(15,23,42,0.6)",
  border: "1px solid #334155",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  boxSizing: "border-box",
};

export const inpCard: React.CSSProperties = {
  ...inp,
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
};

export const lblMuted: React.CSSProperties = {
  ...lbl,
  color: "var(--text-muted)",
};
