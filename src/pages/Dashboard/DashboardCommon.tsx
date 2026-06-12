import { } from 'react';
import { motion } from 'framer-motion';

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="dash-chart-legend-item">
      <div className="dash-chart-legend-dot" style={{ background: color }} />
      <span className="dash-chart-legend-label">{label}</span>
    </div>
  );
}

export function QuickStat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, background: `${color}10` }}
      className="dash-quick-stat"
    >
      <span className="dash-quick-stat-icon" style={{ color }}>{icon}</span>
      <div className="dash-quick-stat-content">
        <div className="dash-quick-stat-label">{label}</div>
        <div className="dash-quick-stat-value" style={{ color }}>{value}</div>
      </div>
    </motion.div>
  );
}

export function FormulaItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="dash-formula-item">
      <div className="dash-formula-label">{label}</div>
      <div className="dash-formula-value" style={{ color }}>
        {value.toLocaleString('tr-TR', {
          style: 'currency',
          currency: 'TRY',
          minimumFractionDigits: 0,
        })}
      </div>
    </div>
  );
}
