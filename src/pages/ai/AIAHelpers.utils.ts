/**
 * AIAHelpers — non-component utilities.
 * Bileşen olmayan export'lar burada toplanır (react-refresh uyumluluğu).
 */
import type { DBAction } from '@/lib/aiActions';

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getActionAffectedIds(action: DBAction): string[] {
  const ids = new Set<string>();
  const payload = action.payload || {};
  ['id', 'productId', 'cariId', 'saleId', 'invoiceId', 'kasaEntryId'].forEach((key) => {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) ids.add(value.trim());
  });
  return [...ids];
}

export function isDangerousAction(action: DBAction): boolean {
  return ['sale', 'kasa_gider', 'stok_guncelle', 'cari_tahsilat'].includes(action.type);
}

export const sourceLabel: Record<string, { label: string; color: string; bg: string }> = {
  deepseek: {
    label: '🧠 DeepSeek',
    color: 'var(--color-success)',
    bg: 'var(--color-success-soft)',
  },
  claude: {
    label: '🤖 Claude',
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-soft)',
  },
  gemini: {
    label: '✨ Gemini',
    color: 'var(--color-primary-light)',
    bg: 'var(--color-primary-ultra)',
  },
  offline: {
    label: '🔌 Çevrimdışı',
    color: 'var(--text-muted)',
    bg: 'var(--bg-card)',
  },
};
