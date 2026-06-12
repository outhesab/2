import { motion } from 'framer-motion';
import { } from 'react';
import type { StatCardData } from './types';

interface StatCardProps extends Omit<StatCardData, 'tab'> {
  onClick?: () => void;
}

export function StatCard({
  icon,
  label,
  value,
  color,
  gradient,
  sub,
  onClick,
  trend,
}: StatCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02, borderColor: `${color}44` }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`dash-statcard${onClick ? ' clickable' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${gradient})`,
        border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
        boxShadow: `0 2px 8px ${color}10, var(--shadow-lg, 0 8px 40px rgba(0,0,0,0.1))`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="dash-statcard-bg-icon">{icon}</div>
      <div
        className="dash-statcard-accent-line"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      />
      <div className="dash-statcard-icon">{icon}</div>
      <div className="dash-statcard-value" style={{ color }}>
        {value}
      </div>
      {trend !== undefined && (
        <div className={`dash-statcard-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% dün
        </div>
      )}
      <div className="dash-statcard-label">{label}</div>
      {sub && <div className="dash-statcard-sub">{sub}</div>}
      {onClick && (
        <motion.div
          className="dash-statcard-arrow"
          style={{ color: `${color}50` }}
          whileHover={{ x: 3, color }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          →
        </motion.div>
      )}
    </motion.div>
  );
}
