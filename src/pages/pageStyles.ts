/**
 * Common style objects for pages
 * Separated from pageHelpers to fix react-refresh warnings
 */
import type { CSSProperties } from 'react';

export const cardStyle: CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 12,
  padding: 16,
};

export const mutedText: CSSProperties = {
  color: '#94a3b8',
  fontSize: '0.86rem',
};

export const sectionTitleStyle: CSSProperties = {
  color: '#f8fafc',
  margin: '0 0 12px',
  fontSize: '1rem',
};

export const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  background: '#0f172a',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: 10,
  padding: '10px 12px',
};

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
