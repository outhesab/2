/**
 * Sales utility constants and styles
 * Re-exported from SalesHelpers for backward compatibility
 */
import type { CSSProperties } from 'react';

export const paymentLabels: Record<string, string> = {
  nakit: 'Nakit',
  kart: 'Kart',
  havale: 'Havale',
  cari: 'Cari',
};

export const lbl: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: 'var(--text-dim)',
  fontSize: '0.85rem',
  fontWeight: 500,
};

export const sinp: CSSProperties = {
  padding: '9px 13px',
  background: 'var(--bg-card)',
  border: '1px solid #334155',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
};

export const sinpStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid #334155',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};
