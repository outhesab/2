import { cn } from "@/lib/utils";

interface SkeletonBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

function SkeletonBlock({ className, style }: SkeletonBlockProps) {
  return <div className={cn("skeleton", className)} style={style} />;
}

export function SkeletonStatCard() {
  return (
    <div
      className="skeleton-stat skeleton"
      style={{ minWidth: 170, flex: "0 0 auto" }}
    >
      <div style={{ padding: "20px 22px" }}>
        <div
          className="skeleton"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            marginBottom: 14,
          }}
        />
        <div
          className="skeleton"
          style={{
            width: "70%",
            height: 28,
            borderRadius: 6,
            marginBottom: 8,
          }}
        />
        <div
          className="skeleton"
          style={{ width: "45%", height: 12, borderRadius: 4 }}
        />
      </div>
    </div>
  );
}

export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          gap: 16,
          padding: "11px 16px",
          marginBottom: 4,
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock
            key={i}
            style={{
              flex: 1,
              height: 14,
              borderRadius: 4,
            }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-table-row skeleton"
          style={{
            display: "flex",
            gap: 16,
            padding: "12px 16px",
            alignItems: "center",
            marginBottom: 4,
            borderRadius: 8,
          }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="skeleton"
              style={{
                flex: 1,
                height: 12,
                borderRadius: 4,
                width: j === cols - 1 ? "40%" : undefined,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonWidget() {
  return (
    <div
      className="skeleton"
      style={{
        width: "100%",
        height: 260,
        borderRadius: 16,
        marginBottom: 16,
      }}
    />
  );
}

export function SkeletonDetail() {
  return (
    <div style={{ padding: 24 }}>
      <SkeletonBlock
        className="skeleton-heading"
        style={{ height: 24, width: "35%", marginBottom: 24 }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SkeletonBlock style={{ width: "30%", height: 10, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: "60%", height: 16, borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <SkeletonBlock style={{ width: "100%", height: 200, borderRadius: 12 }} />
    </div>
  );
}
