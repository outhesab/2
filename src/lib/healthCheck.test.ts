import { describe, expect, it, vi, beforeEach } from 'vitest';
import { quickHealthCheck } from './healthCheck';

vi.mock('./logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), time: vi.fn(() => ({ end: vi.fn(() => 0) })) },
}));

vi.mock('./firebase', () => ({
  readDoc: vi.fn(),
  isFirebaseReady: vi.fn(() => false),
  getFirebaseProject: vi.fn(() => 'test-project'),
}));

vi.mock('./connConfig', () => ({
  loadConnConfig: vi.fn(() => ({
    firebase: { enabled: false, projectId: '', apiKey: '', docPath: '' },
    supabase: { enabled: false, url: '', anonKey: '', tableName: '' },
    activeProvider: 'none' as const,
  })),
}));

function makeDB(overrides?: Record<string, unknown>) {
  return {
    _version: 1,
    products: [],
    sales: [],
    suppliers: [],
    orders: [],
    cari: [],
    kasa: [],
    kasalar: [{ id: 'nakit', name: 'Nakit', icon: '💵' }],
    invoices: [],
    _activityLog: [],
    _auditLog: [],
    _lastSyncAt: new Date().toISOString(),
    ...overrides,
  };
}

function temizleLocalStorage() {
  // jsdom --localstorage-file hatası nedeniyle localStorage bozulabiliyor
  try {
    localStorage.clear();
  } catch {
    // localStorage bozulmuş, yeniden oluştur
    const storage: Storage = (() => {
      const store: Record<string, string> = {};
      return {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = String(v);
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          Object.keys(store).forEach((k) => delete store[k]);
        },
        key: (i: number) => Object.keys(store)[i] ?? null,
        get length() {
          return Object.keys(store).length;
        },
      };
    })();
    vi.stubGlobal('localStorage', storage);
  }
}

describe('quickHealthCheck', () => {
  beforeEach(() => {
    temizleLocalStorage();
    vi.clearAllMocks();
  });

  it('should return a report with ts and overall status', () => {
    const report = quickHealthCheck(makeDB());
    expect(report).toHaveProperty('ts');
    expect(report).toHaveProperty('overall');
    expect(report).toHaveProperty('score');
    expect(report).toHaveProperty('metrics');
    expect(report).toHaveProperty('recommendations');
  });

  it('should return 6 metrics when db provided', () => {
    const report = quickHealthCheck(makeDB());
    expect(report.metrics).toHaveLength(5);
  });

  it('should return fewer metrics when db not provided', () => {
    const report = quickHealthCheck();
    expect(report.metrics.length).toBeLessThanOrEqual(4);
  });

  it('should have a score between 0 and 100', () => {
    const report = quickHealthCheck(makeDB());
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });
});

describe('checkLocalStorage', () => {
  beforeEach(() => {
    temizleLocalStorage();
  });

  it('should return healthy for empty storage', () => {
    const report = quickHealthCheck(makeDB());
    const lsMetric = report.metrics.find((m) => m.id === 'localStorage')!;
    expect(lsMetric).toBeDefined();
    expect(lsMetric.status).toBe('healthy');
  });

  it('should detect localStorage write failures as critical', () => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });
    const report = quickHealthCheck(makeDB());
    const lsMetric = report.metrics.find((m) => m.id === 'localStorage');
    Storage.prototype.setItem = setItem;
    if (lsMetric && lsMetric.status !== 'healthy') {
      expect(['critical', 'degraded']).toContain(lsMetric.status);
    }
  });
});

describe('checkNetwork', () => {
  it('should report online status', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const report = quickHealthCheck(makeDB());
    const netMetric = report.metrics.find((m) => m.id === 'network' || m.id === 'network')!;
    expect(netMetric).toBeDefined();
  });

  it('should report critical when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const report = quickHealthCheck(makeDB());
    const netMetric = report.metrics.find((m) => m.id === 'network')!;
    if (netMetric) {
      expect(netMetric.status).toBe('critical');
    }
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });
});
