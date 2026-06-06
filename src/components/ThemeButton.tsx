interface ThemeButtonProps {
  accent: string;
  bg: string;
  label: string;
  desc: string;
  isLight: boolean;
  isActive: boolean;
  onSelect: () => void;
}

export function ThemeButton({
  accent,
  bg,
  label,
  desc,
  isLight,
  isActive,
  onSelect,
}: ThemeButtonProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: "12px 10px",
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        background: isActive ? `${accent}18` : "rgba(0,0,0,0.3)",
        border: `2px solid ${isActive ? accent : "rgba(255,255,255,0.07)"}`,
        transition: "all 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 42,
          marginBottom: 8,
          borderRadius: 10,
          border: `1px solid ${isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.08)"}`,
          background: `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className={"settings-theme-blob-1"} />
        <div className={"settings-theme-blob-2"} />
        <div className={"settings-theme-overlay"}>
          <span className={"settings-theme-dot"} />
          <span className={"settings-theme-bar"} />
          <span className={"settings-theme-bar-sm"} />
        </div>
      </div>
      <div
        style={{
          fontWeight: 700,
          color: isActive ? accent : "var(--text-primary)",
          fontSize: "0.82rem",
        }}
      >
        {label}
      </div>
      <div className="text-[var(--text-dim)] text-[0.7rem] mt-0.5">
        {desc}
      </div>
      {isActive && (
        <div
          style={{
            position: "absolute",
            top: 7,
            right: 7,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.6rem",
            color: "var(--text-primary)",
            fontWeight: 900,
          }}
        >
          ✓
        </div>
      )}
    </button>
  );
}
