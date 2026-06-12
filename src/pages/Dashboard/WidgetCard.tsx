import { motion } from 'framer-motion';
import { ReactNode } from 'react';

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
      className="dash-widget-card"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'var(--glass-bg, rgba(255,255,255,0.9))',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
        boxShadow: 'var(--shadow-lg, 0 8px 40px rgba(0,0,0,0.1))',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
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
