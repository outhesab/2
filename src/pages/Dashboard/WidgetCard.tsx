import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import styles from './WidgetCard.module.css';

interface WidgetCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  extra?: ReactNode;
}

export function WidgetCard({
  title,
  subtitle,
  children,
  extra,
}: WidgetCardProps) {
  return (
    <motion.div
      whileHover={{
        scale: 1.01,
        borderColor: 'var(--border-strong)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`dash-widget-card ${styles.widgetCard}`}
    >
      <div className={`dash-widget-card-header${subtitle ? '' : ' no-sub'}`}>
        <div>
          <h3 className="dash-widget-card-title">{title}</h3>
          {subtitle && <p className="dash-widget-card-subtitle">{subtitle}</p>}
        </div>
        {extra}
      </div>
      {children}
    </motion.div>
  );
}
