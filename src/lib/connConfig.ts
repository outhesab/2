/**
 * Bağlantı Konfigürasyonu
 * Firebase ve Supabase ayarları — önce Firebase'den, fallback localStorage
 */

import { logger } from '@/lib/logger';
import { readDoc, writeDoc, isFirebaseReady } from '@/lib/firebase';

export interface FirebaseConfig {
  enabled: boolean;
  projectId: string;
  apiKey: string;
}

export interface SupabaseConfig {
  enabled: boolean;
  url: string;
  anonKey: string;
  tableName: string;
}

export interface ConnConfig {
  firebase: FirebaseConfig;
  supabase: SupabaseConfig;
  activeProvider: 'firebase' | 'supabase' | 'none';
}

function isPlaceholder(val: string): boolean {
  const v = val.trim().toLowerCase();
  return !v || v.startsWith('your_');
}

const CONN_KEY = 'sobaConnConfig';
const ENV_FB_PROJECT_ID = (import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '').trim();
const ENV_FB_API_KEY = (import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim();
const HAS_FIREBASE_ENV = !isPlaceholder(ENV_FB_PROJECT_ID) && !isPlaceholder(ENV_FB_API_KEY);

export const DEFAULT_CONN: ConnConfig = {
  firebase: {
    enabled: HAS_FIREBASE_ENV,
    projectId: ENV_FB_PROJECT_ID,
    apiKey: ENV_FB_API_KEY,
  },
  supabase: { enabled: false, url: '', anonKey: '', tableName: 'soba_sync' },
  activeProvider: HAS_FIREBASE_ENV ? 'firebase' : 'none',
};

function normalizeConnConfig(cfg: ConnConfig): ConnConfig {
  const hasCreds = Boolean(cfg.firebase?.projectId?.trim() && cfg.firebase?.apiKey?.trim());
  const safeCfg: ConnConfig = {
    ...DEFAULT_CONN,
    ...cfg,
    firebase: {
      ...DEFAULT_CONN.firebase,
      ...(cfg.firebase || {}),
      enabled: cfg.firebase?.enabled === true && hasCreds,
    },
    supabase: {
      ...DEFAULT_CONN.supabase,
      ...(cfg.supabase || {}),
    },
    activeProvider: cfg.activeProvider,
  };

  if (safeCfg.activeProvider === 'firebase' && !safeCfg.firebase.enabled) {
    safeCfg.activeProvider = 'none';
  }

  if (safeCfg.activeProvider !== 'firebase' && safeCfg.activeProvider !== 'supabase') {
    safeCfg.activeProvider = 'none';
  }

  return safeCfg;
}

// ── localStorage fallback (hızlı senkron okuma) ────────────────────────────
export function loadConnConfig(): ConnConfig {
  try {
    const raw = localStorage.getItem(CONN_KEY);
    if (raw) return normalizeConnConfig(JSON.parse(raw));
  } catch {
    logger.warn('connConfig', 'localStorage okuma hatası');
  }
  return normalizeConnConfig({ ...DEFAULT_CONN });
}

export function saveConnConfig(cfg: ConnConfig): void {
  const safeCfg = normalizeConnConfig(cfg);
  if (typeof safeCfg.firebase?.projectId !== 'string' || typeof safeCfg.firebase?.apiKey !== 'string') {
    logger.warn('connConfig', 'Geçersiz config formatı — projectId/apiKey string olmalı');
    return;
  }
  if (typeof safeCfg.supabase?.url !== 'string' || typeof safeCfg.supabase?.anonKey !== 'string') {
    logger.warn('connConfig', 'Geçersiz config formatı — url/anonKey string olmalı');
    return;
  }
  const dangerous = /[<>"]|javascript:|data:/i;
  if (dangerous.test(safeCfg.firebase.projectId) || dangerous.test(safeCfg.supabase.url)) {
    logger.warn('connConfig', 'Potansiyel injection tespit edildi — kayıt engellendi');
    return;
  }
  localStorage.setItem(CONN_KEY, JSON.stringify(safeCfg));
  if (safeCfg.activeProvider === 'firebase' && safeCfg.firebase.enabled) {
    saveConnConfigToFirebase(safeCfg).catch(() => logger.error('sync', 'Firebase config yazılamadı'));
  }
}

export async function loadConnConfigFromFirebase(): Promise<ConnConfig | null> {
  if (!isFirebaseReady()) return null;
  const data = await readDoc<{ data: string }>(['config', 'connConfig']);
  if (!data?.data) return null;
  try {
    return normalizeConnConfig(JSON.parse(data.data));
  } catch {
    logger.warn('connConfig', 'Firebase config parse hatası');
    return null;
  }
}

export async function saveConnConfigToFirebase(cfg: ConnConfig): Promise<boolean> {
  if (!isFirebaseReady()) return false;
  return writeDoc(['config', 'connConfig'], {
    data: JSON.stringify(cfg),
    updatedAt: new Date().toISOString(),
  });
}

/** Firebase Firestore koleksiyon referansı */
export function getFirebaseDocUrl(cfg: FirebaseConfig): string {
  return isFirebaseReady() ? `firebase://${cfg.projectId}/users/default/db` : '';
}

/** Firebase bağlantısını test et */
export async function testFirebase(_cfg: FirebaseConfig): Promise<{ ok: boolean; msg: string }> {
  if (!isFirebaseReady()) return { ok: false, msg: 'Firebase SDK başlatılamadı' };
  try {
    const data = await readDoc(['config', 'health']);
    return {
      ok: true,
      msg: `Bağlantı başarılı (Firestore ${data ? 'yanıt verdi' : 'boş'})`,
    };
  } catch (e) {
    return { ok: false, msg: `Bağlantı hatası: ${String(e).slice(0, 80)}` };
  }
}

/** Supabase bağlantısını test et */
export async function testSupabase(cfg: SupabaseConfig): Promise<{ ok: boolean; msg: string }> {
  if (!cfg.url || !cfg.anonKey) return { ok: false, msg: 'URL ve Anon Key gerekli' };
  try {
    const url = `${cfg.url.replace(/\/$/, '')}/rest/v1/${cfg.tableName}?select=id&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true, msg: 'Bağlantı başarılı' };
    if (res.status === 404) return { ok: false, msg: `"${cfg.tableName}" tablosu bulunamadı` };
    if (res.status === 401) return { ok: false, msg: 'Anon Key hatalı' };
    return { ok: false, msg: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, msg: `Bağlantı hatası: ${String(e).slice(0, 80)}` };
  }
}
