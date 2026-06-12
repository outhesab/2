import { logger } from '@/lib/logger';
import { loadConnConfig } from '@/lib/connConfig';
import type { WidgetId } from '@/config/widgets';

export function loadDashboardPrefs(): { leftWidgets: WidgetId[]; brightness: number } {
  try {
    const raw = localStorage.getItem('dashboardPrefs');
    if (raw) return JSON.parse(raw);
  } catch {
    logger.warn('dashboard', "Dashboard tercihleri localStorage'dan okunamadı");
  }
  return { leftWidgets: ['chart', 'recentSales', 'tips', 'excelBar'], brightness: 100 };
}

export function getDashboardPrefsUrl(): string | null {
  const cfg = loadConnConfig();
  if (!cfg.firebase.enabled || !cfg.firebase.projectId || !cfg.firebase.apiKey) return null;
  return `https://firestore.googleapis.com/v1/projects/${cfg.firebase.projectId}/databases/(default)/documents/config/dashboardPrefs?key=${cfg.firebase.apiKey}`;
}

export async function loadDashboardPrefsFromFirebase(): Promise<{ leftWidgets: WidgetId[]; brightness: number } | null> {
  try {
    const url = getDashboardPrefsUrl();
    if (!url) return null;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json?.fields?.data?.stringValue;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    logger.warn('dashboard', "Firebase'den dashboard tercihleri alınamadı");
    return null;
  }
}

export const chartStyle = {
  contentStyle: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontSize: '0.82rem',
    boxShadow: '0 8px 24px var(--shadow-lg)',
  },
  labelStyle: { color: 'var(--text-muted)' },
  itemStyle: { color: 'var(--text-primary)' },
};

export const chartAxisStyle = { fontSize: 11, fill: 'var(--text-dim)', fontFamily: "'Plus Jakarta Sans', sans-serif" };
