import { loadConnConfig } from "@/lib/connConfig";
import { logger } from "@/lib/logger";
import { writeDoc, readDoc, isFirebaseReady } from "@/lib/firebase";
import type { DB } from "@/types";

export type SyncStatus = "idle" | "saving" | "saved" | "error" | "loading";
type SyncListener = (status: SyncStatus, detail?: string) => void;
const _syncListeners: SyncListener[] = [];
let _currentSyncStatus: SyncStatus = "idle";

export function emitSync(status: SyncStatus, detail?: string) {
  _currentSyncStatus = status;
  _syncListeners.forEach((fn) => {
    try {
      fn(status, detail);
    } catch {
      logger.warn('sync', 'Senkron dinleyici hatası');
    }
  });
}

export function onSyncStatus(fn: SyncListener): () => void {
  _syncListeners.push(fn);
  return () => {
    const i = _syncListeners.indexOf(fn);
    if (i >= 0) _syncListeners.splice(i, 1);
  };
}

export function getSyncStatus() {
  return _currentSyncStatus;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];

async function retryableWrite(path: string[], data: Record<string, unknown>): Promise<boolean> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await writeDoc(path, data, "set");
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] ?? 8000;
        logger.warn("firebase", `sync denemesi ${attempt + 1}/${MAX_RETRIES + 1} başarısız — ${delay}ms`, { error: String(e) });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

async function retryableRead<T>(path: string[]): Promise<T | null> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await readDoc<T>(path);
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt] ?? 8000));
      }
    }
  }
  logger.warn("firebase", "sync okuma tamamen başarısız", { error: String(lastErr) });
  return null;
}

export async function saveToFirebase(db: DB): Promise<void> {
  if (!isFirebaseReady()) {
    emitSync("idle");
    return;
  }
  const cfg = loadConnConfig();
  if (!cfg.firebase.enabled) {
    emitSync("idle");
    return;
  }
  const t = logger.time("firebase", `Firebase kayıt v${db._version}`);
  emitSync("saving");
  try {
    const ok = await retryableWrite([cfg.firebase.docPath], {
      data: JSON.stringify(db),
      version: String(db._version || 0),
      updatedAt: new Date().toISOString(),
    });
    const ms = t.end({ version: db._version, ok });
    if (ok) {
      emitSync("saved", `v${db._version} · ${ms}ms`);
      logger.info("sync", "Firebase'e kaydedildi", { version: db._version, ms });
    } else {
      emitSync("error", "Firestore yazma başarısız");
      logger.error("firebase", "Firestore yazma hatası");
    }
  } catch (e) {
    t.end({ error: String(e) });
    emitSync("error", "Bağlantı hatası");
    logger.error("firebase", "Firebase kayıt tamamen başarısız", { error: String(e) });
  }
}

interface SyncDoc {
  data?: string;
  version?: string;
  updatedAt?: string;
}

export async function loadFromFirebase(): Promise<DB | null> {
  if (!isFirebaseReady()) return null;
  const cfg = loadConnConfig();
  if (!cfg.firebase.enabled) return null;
  const t = logger.time("firebase", "Firebase yükle");
  try {
    const doc = await retryableRead<SyncDoc>([cfg.firebase.docPath]);
    if (!doc?.data) {
      t.end({ empty: true });
      return null;
    }
    const data = JSON.parse(doc.data) as DB;
    const ms = t.end({ version: data._version });
    logger.info("firebase", "Firebase'den yüklendi", { version: data._version, ms });
    return data;
  } catch (e) {
    t.end({ error: String(e) });
    logger.warn("firebase", "Firebase yükleme başarısız", { error: String(e) });
    return null;
  }
}
