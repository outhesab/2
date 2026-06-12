import { motion } from 'framer-motion';
import { } from 'react';
import type { StatCardData } from './types';
import styles from './StatCard.module.css';

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
      className={`${styles.statcard} ${onClick ? styles.clickable : ''}`}
      style={{
        background: `linear-gradient(135deg, ${gradient})`,
        border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
        boxShadow: `0 2px 8px ${color}10, var(--shadow-lg, 0 8px 40px rgba(0,0,0,0.1))`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className={styles.bgIcon}>{icon}</div>
      <div
        className={styles.accentLine}
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      />
      <div className={styles.icon}>{icon}</div>
      <div className={styles.value} style={{ color }}>
        {value}
      </div>
      {trend !== undefined && (
        <div className={`${styles.trend} ${trend >= 0 ? styles.up : styles.down}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% dün
        </div>
      )}
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
      {onClick && (
        <motion.div
          className={styles.arrow}
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
