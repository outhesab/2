import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {} from 'react';
import type { StatCardData } from './types';
import styles from './StatCard.module.css';

interface StatCardProps extends Omit<StatCardData, 'tab'> {
  onClick?: () => void;
}

export function StatCard({ icon, label, value, color, sub, onClick, trend }: StatCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${styles.statcard} ${onClick ? styles.clickable : ''}`}
    >
      <div className={styles.cardContent}>
        <div className={styles.headerRow}>
          <div className={styles.iconWrapper} style={{ color }}>
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`${styles.trend} ${trend >= 0 ? styles.up : styles.down}`}>
              {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
        {sub && <div className={styles.sub}>{sub}</div>}
      </div>
      {onClick && <div className={styles.arrow}>→</div>}
    </motion.div>
  );
}
