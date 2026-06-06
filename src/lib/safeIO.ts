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

export function safeReadJSON<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    console.warn('[safeIO] JSON okuma hatası:', key);
    return null;
  }
}

export function safeWriteJSON(key: string, value: unknown, opts?: { maxAttempts?: number; minItems?: number }): boolean {
  const attempts = opts?.maxAttempts ?? 5;
  const minItems = opts?.minItems ?? 10;

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
          sizes.push({ key: k, size: 0 });
        }
      }
      sizes.sort((a, b) => b.size - a.size);
      const candidates = sizes.filter(s => /log|cache|temp|big_fill/i.test(s.key) && s.key !== key);
      let cleaned = 0;
      for (const c of candidates) {
        try { localStorage.removeItem(c.key); cleaned++; } catch { /* ignore */ }
      }
      if (cleaned === 0) {
        for (const s of sizes.slice(0, 20)) {
          if (s.key === key) continue;
          try { localStorage.removeItem(s.key); cleaned++; } catch { /* ignore */ }
          if (cleaned >= 10) break;
        }
      }
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        try {
          const sentinel = { __truncated__: true, ts: new Date().toISOString(), originalLength: Array.isArray(value) ? (value as unknown[]).length : undefined };
          localStorage.setItem(key, JSON.stringify(sentinel));
          return true;
        } catch {
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
