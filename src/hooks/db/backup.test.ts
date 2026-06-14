import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DB } from '@/types';

const mockWriteDoc = vi.fn();
const mockReadDoc = vi.fn();
const mockRemoveDoc = vi.fn();
const mockListDocs = vi.fn();
const mockIsFirebaseReady = vi.fn();

vi.mock('@/lib/firebase', () => ({
  isFirebaseReady: mockIsFirebaseReady,
  writeDoc: mockWriteDoc,
  readDoc: mockReadDoc,
  removeDoc: mockRemoveDoc,
  listDocs: mockListDocs,
}));

vi.mock('@/lib/logger', () => ({
  logger: { time: vi.fn(() => ({ end: vi.fn() })), warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

function makeMinimalDB(version = 1): DB {
  return {
    _version: version,
    products: [],
    sales: [],
    suppliers: [],
    orders: [],
    cari: [],
    kasa: [],
    kasalar: [],
    bankTransactions: [],
    matchRules: [],
    monitorRules: [],
    invoices: [],
    stockMovements: [],
    partners: [],
    ortakEmanetler: [],
    boruSuppliers: [],
    boruOrders: [],
    peletSuppliers: [],
    peletOrders: [],
    budgets: [],
    returns: [],
    _activityLog: [],
    _auditLog: [],
    monitorLog: [],
    settings: {} as Record<string, unknown>,
    installments: [],
    productCategories: [],
    notes: [],
    company: { id: '', name: '', phone: '', address: '', taxNo: '', createdAt: '' },
    pelletSettings: { gramaj: 0, kgFiyat: 0, cuvalKg: 0, critDays: 0 },
  };
}

describe('saveBackupToFirebase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false if Firebase not ready', async () => {
    mockIsFirebaseReady.mockReturnValue(false);
    const { saveBackupToFirebase } = await import('./backup');
    const result = await saveBackupToFirebase(makeMinimalDB());
    expect(result).toBe(false);
    expect(mockWriteDoc).not.toHaveBeenCalled();
  });

  it('calls writeDoc with correct args', async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockWriteDoc.mockResolvedValue(true);
    mockListDocs.mockResolvedValue([]);
    const { saveBackupToFirebase } = await import('./backup');
    const db = makeMinimalDB(5);
    const result = await saveBackupToFirebase(db, 'test-label');
    expect(result).toBe(true);
    expect(mockWriteDoc).toHaveBeenCalled();
    const [path, data] = mockWriteDoc.mock.calls[0];
    expect(path[0]).toBe('backups');
    expect(data.version).toBe(5);
    expect(data.label).toBe('test-label');
  });
});

describe('listBackupsFromFirebase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array if Firebase not ready', async () => {
    mockIsFirebaseReady.mockReturnValue(false);
    const { listBackupsFromFirebase } = await import('./backup');
    const result = await listBackupsFromFirebase();
    expect(result).toEqual([]);
  });

  it('returns sorted list by version desc', async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockListDocs.mockResolvedValue([
      { id: 'b1', data: { version: 1, label: 'v1', createdAt: '2026-01-01' } },
      { id: 'b3', data: { version: 3, label: 'v3', createdAt: '2026-01-03' } },
      { id: 'b2', data: { version: 2, label: 'v2', createdAt: '2026-01-02' } },
    ]);
    const { listBackupsFromFirebase } = await import('./backup');
    const result = await listBackupsFromFirebase();
    expect(result).toHaveLength(3);
    expect(result[0].version).toBe(3);
    expect(result[1].version).toBe(2);
    expect(result[2].version).toBe(1);
  });
});

describe('restoreBackupFromFirebase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null if Firebase not ready', async () => {
    mockIsFirebaseReady.mockReturnValue(false);
    const { restoreBackupFromFirebase } = await import('./backup');
    const result = await restoreBackupFromFirebase('b1');
    expect(result).toBeNull();
  });

  it('returns parsed DB', async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    const testDB = makeMinimalDB(3);
    mockReadDoc.mockResolvedValue({ data: JSON.stringify(testDB) });
    const { restoreBackupFromFirebase } = await import('./backup');
    const result = await restoreBackupFromFirebase('b1');
    expect(result).not.toBeNull();
    expect(result!._version).toBe(3);
  });

  it('returns null when doc has no data', async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockReadDoc.mockResolvedValue(null);
    const { restoreBackupFromFirebase } = await import('./backup');
    const result = await restoreBackupFromFirebase('b1');
    expect(result).toBeNull();
  });
});

describe('fullRestoreDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default DB when raw is empty', async () => {
    const { fullRestoreDB } = await import('./backup');
    const raw = {} as DB;
    const def = makeMinimalDB(0);
    def.company = { id: 'default', name: '', phone: '', address: '', taxNo: '', createdAt: '' };
    const { db, report } = fullRestoreDB(raw, def);
    expect(db._version).toBe(0);
    expect(Array.isArray(report.warnings)).toBe(true);
  });

  it('preserves version from raw DB', async () => {
    const { fullRestoreDB } = await import('./backup');
    const raw = makeMinimalDB(42);
    const def = makeMinimalDB(0);
    const { db } = fullRestoreDB(raw, def);
    expect(db._version).toBe(42);
  });
});

describe('mergeRestoreDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges cari entities with validation', async () => {
    const { mergeRestoreDB } = await import('./backup');
    const current = makeMinimalDB();
    const incoming = {
      cari: [{ id: 'c1', name: 'Müşteri A', type: 'musteri' as const, createdAt: '2026-01-01', balance: 0 }],
    };
    const { db, report } = mergeRestoreDB(current, incoming as Partial<DB>, new Set(['cari']));
    expect(db.cari).toHaveLength(1);
    expect(report.added).toBe(1);
  });

  it('skips duplicate cari entries', async () => {
    const { mergeRestoreDB } = await import('./backup');
    const current = makeMinimalDB();
    current.cari = [
      {
        id: 'c1',
        name: 'Müşteri A',
        type: 'musteri' as const,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        balance: 0,
      },
    ];
    const incoming = {
      cari: [
        {
          id: 'c1',
          name: 'Müşteri A',
          type: 'musteri' as const,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          balance: 0,
        },
      ],
    };
    const { db, report } = mergeRestoreDB(current, incoming as Partial<DB>, new Set(['cari']));
    expect(db.cari).toHaveLength(1);
    expect(report.skippedDuplicate).toBe(1);
  });

  it('merges products with price/cost/stock validation', async () => {
    const { mergeRestoreDB } = await import('./backup');
    const current = makeMinimalDB();
    const incoming = {
      products: [{ id: 'p1', name: 'Ürün A', price: 100, cost: 50, stock: 10, createdAt: '2026-01-01' }],
    };
    const { db, report } = mergeRestoreDB(current, incoming as unknown as Partial<DB>, new Set(['products']));
    expect(db.products).toHaveLength(1);
    expect(report.added).toBe(1);
  });

  it('skips products with missing price', async () => {
    const { mergeRestoreDB } = await import('./backup');
    const current = makeMinimalDB();
    const incoming = {
      products: [
        // testing invalid data — missing required fields
        { id: 'p1', name: 'Ürün A', createdAt: '2026-01-01' },
      ],
    };
    const { db, report } = mergeRestoreDB(current, incoming as unknown as Partial<DB>, new Set(['products']));
    expect(db.products).toHaveLength(0);
    expect(report.skippedMissingField).toBeGreaterThanOrEqual(1);
  });

  it('only processes selected keys', async () => {
    const { mergeRestoreDB } = await import('./backup');
    const current = makeMinimalDB();
    const incoming = {
      products: [{ id: 'p1', name: 'P1', price: 10, cost: 5, stock: 1, createdAt: '2026-01-01' }],
      sales: [{ id: 's1', total: 100, createdAt: '2026-01-01' }],
    };
    const { db, report } = mergeRestoreDB(current, incoming as unknown as Partial<DB>, new Set(['products']));
    expect(db.products).toHaveLength(1);
    expect(report.added).toBe(1);
  });

  it('returns RestoreReport correct shape', async () => {
    const { mergeRestoreDB } = await import('./backup');
    const current = makeMinimalDB();
    const { report } = mergeRestoreDB(current, {}, new Set());
    expect(report).toHaveProperty('added');
    expect(report).toHaveProperty('skippedDuplicate');
    expect(report).toHaveProperty('skippedInvalidName');
    expect(report).toHaveProperty('skippedMissingField');
    expect(report).toHaveProperty('warnings');
    expect(Array.isArray(report.warnings)).toBe(true);
  });
});
