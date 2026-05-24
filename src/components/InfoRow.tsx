interface Props {
  label: string;
  value: string;
  color?: string;
  big?: boolean;
}

export function InfoRow({ label, value, color, big }: Props) {
  const rowColorClass =
    color === "#10b981"
      ? "success"
      : color === "#ef4444"
        ? "danger"
        : "default";
  const rowSizeClass = big ? "big" : "regular";

  return (
    <div className="app-row">
      <span className="app-row-label">{label}</span>
      <span className={`app-row-value ${rowColorClass} ${rowSizeClass}`}>
        {value}
      </span>
    </div>
  );
}
