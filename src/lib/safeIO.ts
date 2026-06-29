/** localStorage limiti (5MB — çoğu tarayıcı) */
export const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB

/** Storage kullanım durumu */
export interface StorageStatus {
  used: number;
  limit: number;
  percent: number;
  warning: boolean;
  critical: boolean;
  entries: number;
}

/**
 * localStorage kullanımını ölçer.
 * Tüm key'lerin toplam boyutunu hesaplar.
 */
export function getStorageUsage(): StorageStatus {
  let used = 0;
  let entries = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        const v = localStorage.getItem(k);
        used += k.length + (v ? v.length : 0);
        entries++;
      }
    }
  } catch {
    /* silent fail — storage erişilemezse 0 döner */
  }
  const percent = STORAGE_LIMIT > 0 ? (used / STORAGE_LIMIT) * 100 : 0;
  return {
    used,
    limit: STORAGE_LIMIT,
    percent: Math.round(percent * 100) / 100,
    warning: percent > 80,
    critical: percent > 95,
    entries,
  };
}

function isQuotaError(e: unknown) {
  if (!e) return false;
  if (typeof DOMException !== 'undefined' && e instanceof DOMException) {
    return e.name === 'QuotaExceededError' || e.code === 22;
  }
  if (typeof e === 'object' && e !== null) {
    const m = (e as { message?: unknown }).message;
    return /quota/i.test(String(m || e));
  }
  return /quota/i.test(String(e));
}

/** Bu key'ler asla evict edilmemeli — güvenlik kritik veri */
const PROTECTED_KEYS = new Set([
  'sobaUser_session',
  'sobaUser_remember',
  'soba_users_cache',
  'parspel_crypto_key',
  'sobaConnConfig',
]);

export function safeReadJSON<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    console.warn('[safeIO] JSON okuma hatası:', key);
    return null;
  }
}

export function safeWriteJSON(
  key: string,
  value: unknown,
  opts?: { maxAttempts?: number; minItems?: number },
): boolean {
  const attempts = opts?.maxAttempts ?? 5;
  const minItems = opts?.minItems ?? 10;

  // Proaktif kontrol: limit %80+ ise uyar
  try {
    const usage = getStorageUsage();
    const valueSize = JSON.stringify(value).length;
    const projectedPercent = ((usage.used + valueSize) / STORAGE_LIMIT) * 100;
    if (projectedPercent > 80) {
      console.warn(
        `[safeIO] Storage uyarısı: %${projectedPercent.toFixed(0)} dolacak (${key})` +
          (usage.warning ? ' — limit aşımı yakın!' : ''),
      );
    }
  } catch {
    /* ignore — proactive check failure */
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    if (!isQuotaError(err)) return false;

    if (Array.isArray(value)) {
      let items: unknown[] = value as unknown[];
      for (let i = 0; i < attempts; i++) {
        const keep = Math.max(minItems, Math.floor(items.length / 2));
        items = items.slice(0, keep);
        try {
          localStorage.setItem(key, JSON.stringify(items));
          return true;
        } catch (e) {
          if (!isQuotaError(e)) return false;
          if (items.length <= minItems) break;
        }
      }
    }

    try {
      const sizes: Array<{ key: string; size: number }> = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || '';
        try {
          const v = localStorage.getItem(k) || '';
          sizes.push({ key: k, size: new Blob([v]).size });
        } catch {
          console.warn('[safeIO] localStorage boyut okuma hatası:', k);
          sizes.push({ key: k, size: 0 });
        }
      }
      sizes.sort((a, b) => b.size - a.size);
      const candidates = sizes.filter(
        (s) => /log|cache|temp|big_fill/i.test(s.key) && s.key !== key && !PROTECTED_KEYS.has(s.key),
      );
      let cleaned = 0;
      for (const c of candidates) {
        try {
          localStorage.removeItem(c.key);
          cleaned++;
        } catch {
          console.warn('[safeIO] Önbellek temizleme hatası:', c.key); /* ignore */
        }
      }
      if (cleaned === 0) {
        for (const s of sizes.slice(0, 20)) {
          if (s.key === key || PROTECTED_KEYS.has(s.key)) continue;
          try {
            localStorage.removeItem(s.key);
            cleaned++;
          } catch {
            console.warn('[safeIO] Genel temizleme hatası:', s.key); /* ignore */
          }
          if (cleaned >= 10) break;
        }
      }
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        console.warn('[safeIO] Temizleme sonrası yazma hatası, sentinel deneniyor:', key);
        try {
          const originalLength = Array.isArray(value) ? (value as unknown[]).length : undefined;
          console.error('[safeIO] DATA LOSS: localStorage kota aşıldı, veri kesildi', { key, originalLength });
          const sentinel = {
            __truncated__: true,
            ts: new Date().toISOString(),
            originalLength,
          };
          localStorage.setItem(key, JSON.stringify(sentinel));
          return true;
        } catch {
          console.error('[safeIO] Sentinel yazma hatası:', key);
          return false;
        }
      }
    } catch {
      console.warn('[safeIO] Temizleme sonrası yazma hatası:', key);
      return false;
    }
  }
}

export function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    console.warn('[safeIO] localStorage anahtar silme hatası:', key);
  }
}
