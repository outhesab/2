interface StatCardProps {
  label: string
  value: string
  color: string
  sub?: string
}

export function StatCard({ label, value, color, sub }: StatCardProps) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${color}12, ${color}04)`,
        borderRadius: 14,
        padding: "16px 18px",
        border: `1px solid ${color}22`,
      }}
    >
      <div
        style={{
          fontSize: "1.35rem",
          fontWeight: 900,
          color,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{ color, fontSize: "0.75rem", fontWeight: 600, marginTop: 2 }}
        >
          {sub}
        </div>
      )}
      <div
        style={{
          color: "#475569",
          fontSize: "0.72rem",
          marginTop: 5,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
    </div>
  )
}
