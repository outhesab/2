import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DB } from '@/types';

const mockWriteDoc = vi.fn();
const mockReadDoc = vi.fn();
const mockIsFirebaseReady = vi.fn();
const mockLoadConnConfig = vi.fn();

vi.mock('@/lib/connConfig', () => ({
  loadConnConfig: mockLoadConnConfig,
}));
vi.mock('@/lib/logger', () => ({
  logger: { time: vi.fn(() => ({ end: vi.fn() })), warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/firebase', () => ({
  writeDoc: mockWriteDoc,
  readDoc: mockReadDoc,
  isFirebaseReady: mockIsFirebaseReady,
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

describe('emitSync / onSyncStatus / getSyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('emitSync updates status and notifies listeners', async () => {
    const { emitSync, onSyncStatus, getSyncStatus } = await import('./sync');
    const listener = vi.fn();
    onSyncStatus(listener);
    emitSync('saving');
    expect(getSyncStatus()).toBe('saving');
    expect(listener).toHaveBeenCalledWith('saving', undefined);
  });

  it('onSyncStatus returns unsubscribe function', async () => {
    const { emitSync, onSyncStatus } = await import('./sync');
    const listener = vi.fn();
    const unsubscribe = onSyncStatus(listener);
    unsubscribe();
    emitSync('saved', 'test');
    expect(listener).not.toHaveBeenCalled();
  });

  it('listener errors do not crash', async () => {
    const { emitSync, onSyncStatus } = await import('./sync');
    const badListener = vi.fn(() => {
      throw new Error('listener error');
    });
    const goodListener = vi.fn();
    onSyncStatus(badListener);
    onSyncStatus(goodListener);
    expect(() => emitSync('idle')).not.toThrow();
    expect(goodListener).toHaveBeenCalled();
  });
});

describe('saveToFirebase', () => {
  const USER_ID = 'test-user-id';
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns early if Firebase not ready', async () => {
    mockIsFirebaseReady.mockReturnValue(false);
    const { saveToFirebase } = await import('./sync');
    await saveToFirebase(makeMinimalDB(), USER_ID);
    expect(mockWriteDoc).not.toHaveBeenCalled();
  });

  it('returns early if firebase not enabled in config', async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockLoadConnConfig.mockReturnValue({ firebase: { enabled: false } });
    const { saveToFirebase } = await import('./sync');
    await saveToFirebase(makeMinimalDB(), USER_ID);
    expect(mockWriteDoc).not.toHaveBeenCalled();
  });

  it('calls writeDoc with correct data on success', async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockLoadConnConfig.mockReturnValue({ firebase: { enabled: true } });
    mockWriteDoc.mockResolvedValue(true);
    const { saveToFirebase } = await import('./sync');
    const db = makeMinimalDB(7);
    await saveToFirebase(db, USER_ID);
    expect(mockWriteDoc).toHaveBeenCalledWith(
      ['users', USER_ID, 'db'],
      expect.objectContaining({
        version: '7',
        data: expect.any(String),
        updatedAt: expect.any(String),
      }),
      'set',
    );
  });

  it('retries on write failure', { timeout: 30000 }, async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockLoadConnConfig.mockReturnValue({ firebase: { enabled: true } });
    mockWriteDoc.mockRejectedValueOnce(new Error('net'));
    mockWriteDoc.mockRejectedValueOnce(new Error('net'));
    mockWriteDoc.mockResolvedValueOnce(true);
    const { saveToFirebase } = await import('./sync');
    await saveToFirebase(makeMinimalDB(), USER_ID);
    expect(mockWriteDoc).toHaveBeenCalledTimes(3);
  });
});

describe('loadFromFirebase', () => {
  const USER_ID = 'test-user-id';
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns null if Firebase not ready', async () => {
    mockIsFirebaseReady.mockReturnValue(false);
    const { loadFromFirebase } = await import('./sync');
    const result = await loadFromFirebase(USER_ID);
    expect(result).toBeNull();
  });

  it('returns null if firebase not enabled', async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockLoadConnConfig.mockReturnValue({ firebase: { enabled: false } });
    const { loadFromFirebase } = await import('./sync');
    const result = await loadFromFirebase(USER_ID);
    expect(result).toBeNull();
  });

  it('returns parsed DB on success', async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockLoadConnConfig.mockReturnValue({ firebase: { enabled: true } });
    const testDB = makeMinimalDB(5);
    mockReadDoc.mockResolvedValue({ data: JSON.stringify(testDB), version: '5', updatedAt: '2026-01-01' });
    const { loadFromFirebase } = await import('./sync');
    const result = await loadFromFirebase(USER_ID);
    expect(result).not.toBeNull();
    expect(result!._version).toBe(5);
  });

  it('returns null when doc has no data', async () => {
    mockIsFirebaseReady.mockReturnValue(true);
    mockLoadConnConfig.mockReturnValue({ firebase: { enabled: true } });
    mockReadDoc.mockResolvedValue(null);
    const { loadFromFirebase } = await import('./sync');
    const result = await loadFromFirebase(USER_ID);
    expect(result).toBeNull();
  });
});
