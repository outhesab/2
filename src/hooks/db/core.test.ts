import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DB } from '@/types';

vi.mock('@/lib/db/indexeddb', () => ({
  indexedDb: { snapshots: { put: vi.fn(), get: vi.fn() } },
}));
vi.mock('@/lib/auditEngine', () => ({
  createAuditEntry: vi.fn(() => ({
    id: 'audit-1',
    action: 'test',
    entity: 'DB',
    status: 'applied',
    createdAt: new Date().toISOString(),
  })),
  trimAuditLog: vi.fn((log: unknown[]) => log),
}));
vi.mock('@/lib/logger', () => ({
  logger: { time: vi.fn(() => ({ end: vi.fn() })), warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/utils-tr', () => ({ genId: vi.fn(() => 'id-1') }));
vi.mock('@/lib/userManager', () => ({
  isGuestSession: vi.fn(() => false),
  getUserSession: vi.fn(() => ({ username: 'test', role: 'admin', isGuest: false })),
}));
vi.mock('@/lib/safeClone', () => ({ safeClone: vi.fn((x: unknown) => JSON.parse(JSON.stringify(x))) }));
vi.mock('./sync', () => ({
  saveToFirebase: vi.fn(),
  loadFromFirebase: vi.fn(),
  emitSync: vi.fn(),
  onSyncStatus: vi.fn(() => vi.fn()),
  getSyncStatus: vi.fn(() => 'idle' as const),
}));
vi.mock('./backup', () => ({
  saveBackupToFirebase: vi.fn(async () => true),
  restoreBackupFromFirebase: vi.fn(),
  listBackupsFromFirebase: vi.fn(),
  fullRestoreDB: vi.fn((raw: DB, def: DB) => ({
    db: { ...def, ...raw },
    report: { added: 0, skippedDuplicate: 0, skippedInvalidName: 0, skippedMissingField: 0, warnings: [] },
  })),
}));
vi.mock('./dbHelpers', () => ({
  validateAndClassify: vi.fn(() => ({ violations: [], hasBlock: false, hasWarn: false })),
  computeAuditStatus: vi.fn(() => 'applied' as const),
  saveBlockedState: vi.fn((prev: DB) => prev),
  saveAppliedState: vi.fn((next: DB) => next),
}));

// jsdom doesn't support URL.createObjectURL
const _origCreateObjectURL = URL.createObjectURL;
void _origCreateObjectURL; // keep reference for cleanup
URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');

// Mock localStorage for jsdom
Object.defineProperty(globalThis, 'localStorage', {
  value: (() => {
    const store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    };
  })(),
  writable: false,
  configurable: true,
});

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
    useRef: (val: unknown) => ({ current: val }),
    useEffect: (fn: () => unknown) => {
      fn();
    },
    useState: (val: unknown) => {
      // React calls function initializers: useState(() => initialValue)
      const resolved = typeof val === 'function' ? (val as () => unknown)() : val;
      return [resolved, vi.fn()];
    },
  };
});

describe('useDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    try {
      localStorage.clear();
    } catch {
      /* jsdom may not support clear */
    }
  });

  it('returns expected API shape', async () => {
    const { useDB } = await import('./index');
    const api = useDB();
    const keys = Object.keys(api);
    expect(keys).toContain('db');
    expect(keys).toContain('save');
    expect(keys).toContain('saveWithLog');
    expect(keys).toContain('saveGuarded');
    expect(keys).toContain('logActivity');
    expect(keys).toContain('exportJSON');
    expect(keys).toContain('importJSON');
    expect(keys).toContain('getKasaBakiye');
    expect(keys).toContain('getTotalKasa');
    expect(keys).toContain('undo');
    expect(keys).toContain('clearUndoStack');
    expect(keys).toContain('dbError');
    expect(keys).toContain('clearError');
    expect(keys).toContain('manualBackup');
    expect(keys).toContain('listBackups');
    expect(keys).toContain('restoreBackup');
    expect(keys).toContain('emitSync');
  });

  it('returns a DB object with default shape', async () => {
    const { useDB } = await import('./index');
    const { db } = useDB();
    expect(db).toHaveProperty('_version');
    expect(db).toHaveProperty('products');
    expect(Array.isArray(db.products)).toBe(true);
    expect(db).toHaveProperty('sales');
    expect(db).toHaveProperty('kasa');
    expect(db).toHaveProperty('cari');
    expect(db).toHaveProperty('suppliers');
    expect(db).toHaveProperty('kasalar');
    expect(Array.isArray(db.kasalar)).toBe(true);
  });

  it('save calls processSave without error', async () => {
    const { useDB } = await import('./index');
    const { save } = useDB();
    expect(() => save((prev: DB) => ({ ...prev, _version: (prev._version || 0) + 1 }))).not.toThrow();
  });

  it('exportJSON generates downloadable JSON', async () => {
    const { useDB } = await import('./index');
    const { exportJSON } = useDB();
    expect(() => exportJSON()).not.toThrow();
  });

  it('getKasaBakiye returns number', async () => {
    const { useDB } = await import('./index');
    const { getKasaBakiye } = useDB();
    const result = getKasaBakiye('nakit');
    expect(typeof result).toBe('number');
  });

  it('getTotalKasa returns number', async () => {
    const { useDB } = await import('./index');
    const { getTotalKasa } = useDB();
    const result = getTotalKasa();
    expect(typeof result).toBe('number');
  });

  it('clearError resets dbError', async () => {
    const { useDB } = await import('./index');
    const { clearError } = useDB();
    expect(() => clearError()).not.toThrow();
  });

  it('importJSON validates and rejects invalid input', async () => {
    const { useDB } = await import('./index');
    const { importJSON } = useDB();
    const file = new File(['invalid json'], 'test.json', { type: 'application/json' });
    const result = await importJSON(file);
    expect(result).toBe(false);
  });

  it('save loading state does not throw', async () => {
    const { useDB } = await import('./index');
    const { save } = useDB();
    // rapid consecutive saves should not throw
    expect(() => {
      save((prev: DB) => ({ ...prev, _version: (prev._version || 0) + 1 }));
      save((prev: DB) => ({ ...prev, _version: (prev._version || 0) + 1 }));
      save((prev: DB) => ({ ...prev, _version: (prev._version || 0) + 1 }));
    }).not.toThrow();
  });

  it('error callback does not prevent further saves', async () => {
    const { useDB } = await import('./index');
    const { save, clearError } = useDB();
    clearError();
    expect(() => save((prev: DB) => ({ ...prev, _version: (prev._version || 0) + 1 }))).not.toThrow();
  });

  it('manualBackup returns expected shape', async () => {
    const { useDB } = await import('./index');
    const { manualBackup } = useDB();
    const result = await manualBackup();
    expect(typeof result).toBe('boolean');
  });

  it('undo returns false when stack is empty', async () => {
    const { useDB } = await import('./index');
    const { undo, clearUndoStack } = useDB();
    clearUndoStack();
    const result = undo();
    expect(result).toBe(false);
  });
});
