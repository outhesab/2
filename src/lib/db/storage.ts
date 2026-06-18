import { indexedDb } from '@/lib/db/indexeddb';
import { logger } from '@/lib/logger';
import { genId } from '@/lib/utils-tr';
import type { DB, Kasa, ProductCategory } from '@/types';

export const STORAGE_KEY = 'sobaYonetim';
export const INDEXED_SNAPSHOT_KEY = 'primary';

export async function saveToIndexedSnapshot(db: DB): Promise<void> {
  const t = logger.time('db', 'IndexedSnapshot yaz');
  try {
    const data = JSON.stringify(db);
    await indexedDb.snapshots.put({
      id: INDEXED_SNAPSHOT_KEY,
      data,
      updatedAt: new Date().toISOString(),
    });
    t.end({ size: data.length });
  } catch (e) {
    t.end({ error: String(e) });
    logger.warn('db', 'IndexedDB snapshot yazılamadı', { error: String(e) });
  }
}

export async function loadFromIndexedSnapshot(): Promise<DB | null> {
  const t = logger.time('db', 'IndexedSnapshot oku');
  try {
    const snap = await indexedDb.snapshots.get(INDEXED_SNAPSHOT_KEY);
    if (!snap?.data) {
      t.end({ empty: true });
      return null;
    }
    const result = JSON.parse(snap.data) as DB;
    t.end({ version: result._version });
    return result;
  } catch (e) {
    t.end({ error: String(e) });
    logger.warn('db', 'IndexedDB snapshot okunamadı', { error: String(e) });
    return null;
  }
}

export function makeDefaultDB(): DB {
  const nowIso = new Date().toISOString();
  return {
    _version: 0,
    products: [],
    sales: [],
    suppliers: [],
    orders: [],
    cari: [],
    kasa: [],
    kasalar: [
      { id: 'nakit', name: 'Nakit', icon: '💵' },
      { id: 'banka', name: 'Banka', icon: '🏦' },
      { id: 'pos_ziraat', name: 'POS Ziraat', icon: '🏧' },
      { id: 'pos_is', name: 'POS İş', icon: '🏧' },
      { id: 'pos_yk', name: 'POS YapıKredi', icon: '🏧' },
    ] as Kasa[],
    bankTransactions: [],
    matchRules: [],
    monitorRules: [
      {
        id: genId(),
        isDefault: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        name: 'Stok Tükendi Uyarısı',
        type: 'stok_sifir',
        level: 'critical',
        interval: 30,
        popup: true,
        active: true,
        threshold: 0,
      },
      {
        id: genId(),
        isDefault: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        name: 'Düşük Stok Uyarısı',
        type: 'stok_min',
        level: 'warning',
        interval: 60,
        popup: true,
        active: true,
        threshold: undefined,
      },
      {
        id: genId(),
        isDefault: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        name: 'Düşük Kasa Bakiyesi',
        type: 'kasa_min',
        level: 'warning',
        interval: 300,
        popup: true,
        active: true,
        threshold: 1000,
        kasa: 'nakit',
      },
    ],
    monitorLog: [],
    stockMovements: [],
    peletSuppliers: [],
    peletOrders: [],
    boruSuppliers: [],
    boruOrders: [],
    invoices: [],
    budgets: [],
    returns: [],
    _activityLog: [],
    company: { id: genId(), createdAt: nowIso },
    settings: {},
    pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
    ortakEmanetler: [],
    installments: [],
    partners: [],
    productCategories: [
      { id: 'soba', name: 'Soba', icon: '🔥', createdAt: nowIso },
      { id: 'aksesuar', name: 'Aksesuar', icon: '🔧', createdAt: nowIso },
      { id: 'yedek', name: 'Yedek Parça', icon: '⚙️', createdAt: nowIso },
      { id: 'boru', name: 'Boru', icon: '🔩', createdAt: nowIso },
      { id: 'pelet', name: 'Pelet', icon: '🪵', createdAt: nowIso },
    ] as ProductCategory[],
    notes: [
      {
        id: genId(),
        title: '🔑 Yerel API Anahtarları',
        content: [
          'LM Studio: http://127.0.0.1:1234',
          '',
          'cURL:',
          'curl http://127.0.0.1:1234/v1/chat/completions',
          '  -H "Content-Type: application/json"',
          '  -H "Authorization: Bearer <key>"',
        ].join('\n'),
        color: 'blue',
        pinned: false,
        tags: ['api', 'yerel', 'llm'],
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    _auditLog: [],
    aiActionLog: [],
  };
}

export function loadFromStorage(): DB {
  const loadT = logger.time('db', 'localStorage yükle');
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultDB();
    const parsed = JSON.parse(raw);
    const def = makeDefaultDB();
    const merged = { ...def, ...parsed };
    if (!merged.kasalar || merged.kasalar.length === 0) merged.kasalar = def.kasalar;
    const posIds = ['pos_ziraat', 'pos_is', 'pos_yk'];
    posIds.forEach((pid) => {
      if (!merged.kasalar.find((k: Kasa) => k.id === pid)) {
        const defKasa = def.kasalar.find((k) => k.id === pid);
        if (defKasa) merged.kasalar.push(defKasa);
      }
    });
    if (!merged.monitorRules || merged.monitorRules.length === 0) merged.monitorRules = def.monitorRules;
    if (!merged.pelletSettings) merged.pelletSettings = def.pelletSettings;
    if (!merged.company || typeof merged.company !== 'object') merged.company = def.company;

    const arrayKeys: (keyof DB)[] = [
      'products',
      'sales',
      'suppliers',
      'orders',
      'cari',
      'kasa',
      'bankTransactions',
      'matchRules',
      'monitorLog',
      'stockMovements',
      'peletSuppliers',
      'peletOrders',
      'boruSuppliers',
      'boruOrders',
      'invoices',
      'budgets',
      'returns',
      '_activityLog',
      'ortakEmanetler',
      'installments',
      'partners',
      'notes',
      '_auditLog',
      'aiActionLog',
    ];
    arrayKeys.forEach((key) => {
      if (!Array.isArray(merged[key])) (merged as Record<string, unknown>)[key] = [];
    });

    if (!Array.isArray(merged.productCategories) || merged.productCategories.length === 0)
      merged.productCategories = def.productCategories;

    if (!(merged.notes || []).some((n: { title: string }) => n.title === '🔑 Yerel API Anahtarları')) {
      merged.notes = merged.notes || [];
      merged.notes.unshift({
        id: genId(),
        title: '🔑 Yerel API Anahtarları',
        content: [
          'LM Studio: http://127.0.0.1:1234',
          '',
          'cURL:',
          'curl http://127.0.0.1:1234/v1/chat/completions',
          '  -H "Content-Type: application/json"',
          '  -H "Authorization: Bearer <key>"',
        ].join('\n'),
        color: 'blue',
        pinned: false,
        tags: ['api', 'yerel', 'llm'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    loadT.end({ version: merged._version });
    return merged;
  } catch {
    logger.warn('db', 'localStorage verisi ayrıştırılamadı, varsayılan DB kullanılıyor');
    loadT.end({ error: 'parse' });
    return makeDefaultDB();
  }
}

let _isSaving = false;
const _saveQueue: DB[] = [];

/* ── Async localStorage write (UI jank önleme) ──────────────────── */

let _pendingWrite: { key: string; versioned: DB } | null = null;
let _writeScheduled = false;

function _flushPendingWrite(): void {
  _writeScheduled = false;
  if (!_pendingWrite) return;
  const { key, versioned } = _pendingWrite;
  _pendingWrite = null;
  try {
    localStorage.setItem(key, JSON.stringify(versioned));
  } catch (e) {
    logger.warn('db', 'localStorage async yazma hatası', { error: String(e) });
  }
}

function _scheduleFlush(key: string, versioned: DB): void {
  _pendingWrite = { key, versioned };
  if (_writeScheduled) return;
  _writeScheduled = true;
  // requestAnimationFrame: yazma işlemini sonraki frame'e erteler
  // Böylece mevcut frame UI render'ını bloke etmez
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => _flushPendingWrite());
  } else {
    setTimeout(() => _flushPendingWrite(), 0);
  }
}

/* ── beforeunload: sayfa kapanırken bekleyen yazmayı boşalt ───── */

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (_pendingWrite) {
      try {
        localStorage.setItem(_pendingWrite.key, JSON.stringify(_pendingWrite.versioned));
      } catch { /* ignore — sayfa kapanıyor */ }
    }
  });
}

/* ── saveToStorage ──────────────────────────────────────────────── */

export function saveToStorage(db: DB): boolean {
  const t = logger.time('db', 'localStorage yaz');
  if (_isSaving) {
    _saveQueue.push(db);
    if (_saveQueue.length > 10) {
      const dropped = _saveQueue.splice(0, _saveQueue.length - 10);
      logger.warn('db', 'Save queue taştı, eski kayıtlar atıldı', { dropped: dropped.length });
    }
    return false;
  }
  _isSaving = true;
  try {
    let toSave = db;
    while (_saveQueue.length > 0) {
      toSave = _saveQueue.shift()!;
    }
    const versioned = { ...toSave, _version: (toSave._version || 0) + 1 };
    // Async yaz — senkron bloklama yok, UI akıcı kalır
    _scheduleFlush(STORAGE_KEY, versioned);
    toSave._version = versioned._version;
    t.end({ version: versioned._version });
    return true;
  } catch (e) {
    t.end({ error: String(e) });
    return false;
  } finally {
    _isSaving = false;
    if (_saveQueue.length > 0) {
      const next = _saveQueue.shift()!;
      saveToStorage(next);
    }
  }
}
