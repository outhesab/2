import { type ReactNode, type CSSProperties, useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function ModalActions({
  onSave,
  onCancel,
  saveLabel = "💾 Kaydet",
  saveColor = "#10b981",
  cancelLabel = "İptal",
}: {
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  saveColor?: string;
  cancelLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "flex-end",
        marginTop: 18,
      }}
    >
      <button
        onClick={onCancel}
        style={{
          background: "#273548",
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: "#94a3b8",
          padding: "10px 20px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.85rem",
        }}
      >
        {cancelLabel}
      </button>
      <button
        onClick={onSave}
        style={{
          background: saveColor,
          border: "none",
          borderRadius: 10,
          color: "#fff",
          padding: "10px 24px",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "0.85rem",
        }}
      >
        {saveLabel}
      </button>
    </div>
  );
}

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

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  style,
  autoFocus,
  gridColumn,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
  gridColumn?: string;
}) {
  return (
    <div style={gridColumn ? { gridColumn } : undefined}>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          color: "var(--text-dim)",
          fontSize: "0.85rem",
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          padding: "9px 13px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: "var(--text-primary)",
          fontSize: "0.9rem",
          ...style,
        }}
      />
    </div>
  );
}

export function FormTextArea({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 60,
  gridColumn,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  gridColumn?: string;
}) {
  return (
    <div style={gridColumn ? { gridColumn } : undefined}>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          color: "var(--text-dim)",
          fontSize: "0.85rem",
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: "9px 13px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: "var(--text-primary)",
          fontSize: "0.9rem",
          minHeight,
          resize: "vertical",
        }}
      />
    </div>
  );
}

export function CheckboxField({
  checked,
  onChange,
  label,
  accentColor = "#ff5722",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  accentColor?: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        color: "var(--text-dim)",
        fontSize: "0.85rem",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor }}
      />
      {label}
    </label>
  );
}

export function ActionButtons({
  onEdit,
  onDelete,
  size = "normal",
}: {
  onEdit: () => void;
  onDelete: () => void;
  size?: "normal" | "small";
}) {
  const btnBase: CSSProperties =
    size === "small"
      ? {
          background: "rgba(59,130,246,0.1)",
          border: "none",
          borderRadius: 6,
          color: "#60a5fa",
          padding: "5px 10px",
          cursor: "pointer",
          fontSize: "0.82rem",
        }
      : {
          background: "rgba(59,130,246,0.1)",
          border: "none",
          borderRadius: 8,
          color: "#60a5fa",
          padding: "7px 10px",
          cursor: "pointer",
          fontSize: "0.82rem",
        };
  const delBase: CSSProperties =
    size === "small"
      ? { ...btnBase, background: "rgba(239,68,68,0.1)", color: "#ef4444" }
      : { ...btnBase, background: "rgba(239,68,68,0.1)", color: "#ef4444" };

  return (
    <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
      <button onClick={onEdit} style={btnBase}>
        ✏️
      </button>
      <button onClick={onDelete} style={delBase}>
        🗑️
      </button>
    </div>
  );
}

export function MiniStatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          color,
          fontWeight: 700,
          fontSize: "0.85rem",
        }}
      >
        {value}
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.65rem" }}>
        {label}
      </div>
    </div>
  );
}

export function AdminModeButton({
  adminMode,
  onToggle,
  compact,
}: {
  adminMode: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: compact ? "6px 10px" : "7px 14px",
        borderRadius: 8,
        border: `1px solid ${adminMode ? "rgba(239,68,68,0.5)" : "var(--border)"}`,
        background: adminMode
          ? "rgba(239,68,68,0.12)"
          : "var(--bg-card)",
        color: adminMode ? "#ef4444" : "var(--text-secondary)",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: compact ? "0.72rem" : "0.82rem",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
      }}
    >
      {adminMode ? "🛡️ Admin" : "🔒 Admin"}
    </button>
  );
}

export function AutoApplyButton({
  autoApplyActions,
  onToggle,
  compact,
}: {
  autoApplyActions: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: compact ? "6px 10px" : "7px 14px",
        borderRadius: 8,
        border: `1px solid ${autoApplyActions ? "rgba(16,185,129,0.5)" : "var(--border)"}`,
        background: autoApplyActions
          ? "rgba(16,185,129,0.12)"
          : "var(--bg-card)",
        color: autoApplyActions ? "#10b981" : "var(--text-secondary)",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: compact ? "0.72rem" : "0.82rem",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
      }}
    >
      {autoApplyActions ? "⚡ Otomatik" : "🤖 Manuel"}
    </button>
  );
}

export function MaxActionsControl({
  value,
  onDecrement,
  onIncrement,
  compact,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  compact?: boolean;
}) {
  const btnStyle: CSSProperties = {
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 6,
    color: "#818cf8",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: compact ? "0.72rem" : "0.82rem",
    padding: compact ? "2px 8px" : "4px 10px",
    lineHeight: 1,
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <button
        onClick={onDecrement}
        style={btnStyle}
        disabled={value <= 1}
        title="Azalt"
      >
        −
      </button>
      <span
        style={{
          color: "var(--text-secondary)",
          fontWeight: 700,
          fontSize: compact ? "0.72rem" : "0.82rem",
          minWidth: compact ? 16 : 20,
          textAlign: "center",
        }}
      >
        {value}
      </span>
      <button onClick={onIncrement} style={btnStyle} title="Artır">
        +
      </button>
    </div>
  );
}

export function StopOnViolationButton({
  stopOnViolation,
  onToggle,
  compact,
}: {
  stopOnViolation: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      title={
        stopOnViolation
          ? "Kural ihlalinde dur"
          : "İhlallere rağmen devam et"
      }
      style={{
        padding: compact ? "6px 10px" : "7px 14px",
        borderRadius: 8,
        border: `1px solid ${stopOnViolation ? "rgba(245,158,11,0.5)" : "var(--border)"}`,
        background: stopOnViolation
          ? "rgba(245,158,11,0.12)"
          : "var(--bg-card)",
        color: stopOnViolation ? "#f59e0b" : "var(--text-secondary)",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: compact ? "0.65rem" : "0.72rem",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
      }}
    >
      {stopOnViolation ? "🛑 Durdur" : "▶ Devam"}
    </button>
  );
}

export function EmbeddedStatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: `${color}10`,
        border: `1px solid ${color}20`,
        borderRadius: 8,
        padding: "6px 10px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color,
          fontWeight: 700,
          fontSize: "0.82rem",
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.62rem",
          marginTop: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function TabButton<T extends string>({
  id,
  label,
  active,
  onSelect,
}: {
  id: T;
  label: string;
  active: boolean;
  onSelect: (id: T) => void;
}) {
  return (
    <button
      onClick={() => onSelect(id)}
      style={{
        padding: "8px 16px",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 700,
        fontSize: "0.83rem",
        background: active ? "#ff5722" : "#273548",
        color: active ? "#fff" : "#94a3b8",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

export function TableFilterBar({
  search,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearDates,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  onClearDates: () => void;
}) {
  const inputStyle: CSSProperties = {
    padding: "9px 13px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--text-primary)",
    fontSize: "0.9rem",
  };
  return (
    <>
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="🔍 Ara..."
        style={{ ...inputStyle, flex: 1 }}
      />
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        style={{ ...inputStyle, fontSize: "0.85rem", width: "auto" }}
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        style={{ ...inputStyle, fontSize: "0.85rem", width: "auto" }}
      />
      {(dateFrom || dateTo) && (
        <button
          onClick={onClearDates}
          style={{
            padding: "8px 10px",
            border: "none",
            borderRadius: 8,
            background: "#334155",
            color: "var(--text-dim)",
            cursor: "pointer",
            fontSize: "0.82rem",
          }}
        >
          ✕
        </button>
      )}
    </>
  );
}

export function TableWrapper({
  columns,
  children,
  noData,
  colSpan,
}: {
  columns: string[];
  children: ReactNode;
  noData?: ReactNode;
  colSpan: number;
}) {
  const thStyle: CSSProperties = {
    padding: "12px 16px",
    textAlign: "left",
    color: "var(--text-muted)",
    fontSize: "0.78rem",
    fontWeight: 600,
    textTransform: "uppercase",
  };
  return (
    <div
      className="responsive-table-wrap"
      style={{
        background: "var(--bg-card)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        overflowX: "auto",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
        <thead>
          <tr style={{ background: "rgba(15,23,42,0.6)" }}>
            {columns.map((h) => (
              <th key={h} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {noData ? (
            <tr>
              <td
                colSpan={colSpan}
                style={{ textAlign: "center", padding: 48, color: "#334155" }}
              >
                {noData}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Common Style Objects ──────────────────────────────────────────────

export const cardStyle: CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 16,
};

export const mutedText: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.86rem",
};

export const sectionTitleStyle: CSSProperties = {
  color: "#f8fafc",
  margin: "0 0 12px",
  fontSize: "1rem",
};

export const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 10,
  padding: "10px 12px",
};

// ── Order Status Helpers ──────────────────────────────────────────────

export const ORDER_STATUS_COLOR: Record<string, string> = {
  bekliyor: '#f59e0b',
  yolda: '#3b82f6',
  tamamlandi: '#10b981',
  iptal: '#ef4444',
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  bekliyor: '⏳ Bekliyor',
  yolda: '🚚 Yolda',
  tamamlandi: '✓ Tamamlandı',
  iptal: '✕ İptal',
};

// ── Metric Component ──────────────────────────────────────────────────

export function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", border: `1px solid ${color}33` }}>
      <div style={{ color, fontWeight: 800, fontSize: "1rem" }}>{value}</div>
      <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 3 }}>{label}</div>
    </div>
  );
}

// ── StatusBadge Component ────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      background: `${ORDER_STATUS_COLOR[status]}18`,
      color: ORDER_STATUS_COLOR[status],
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: "0.8rem",
      fontWeight: 600,
    }}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
