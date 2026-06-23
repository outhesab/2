import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loadConnConfig, saveConnConfig, DEFAULT_CONN, type ConnConfig } from './connConfig';

// Mock environment variables using Vitest's stubEnv
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));


vi.mock('@/lib/firebase', () => ({
  readDoc: vi.fn(),
  writeDoc: vi.fn(),
  isFirebaseReady: vi.fn(() => true),
}));

const STORAGE_KEY = 'sobaConnConfig';

function temizleLocalStorage() {
  try {
    localStorage.clear();
  } catch {
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

describe('connConfig', () => {
  beforeEach(() => {
    temizleLocalStorage();
    vi.clearAllMocks();
  });

  describe('DEFAULT_CONN', () => {
    it('should have firebase enabled when env vars are set', () => {
      expect(DEFAULT_CONN.firebase.enabled).toBe(true);
    });

    it('should have activeProvider firebase when env vars are set', () => {
      expect(DEFAULT_CONN.activeProvider).toBe('firebase');
    });

    it('should have supabase disabled', () => {
      expect(DEFAULT_CONN.supabase.enabled).toBe(false);
    });
  });

  describe('saveConnConfig', () => {
    it('should save config to localStorage', () => {
      const config: ConnConfig = {
        firebase: { enabled: true, projectId: 'test-proj', apiKey: 'test-key' },
        supabase: { enabled: false, url: '', anonKey: '', tableName: 'soba_sync' },
        activeProvider: 'firebase',
      };
      saveConnConfig(config);
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(saved.firebase.projectId).toBe('test-proj');
      expect(saved.activeProvider).toBe('firebase');
    });
  });

  describe('loadConnConfig', () => {
    it('should return DEFAULT_CONN when nothing saved', () => {
      const config = loadConnConfig();
      expect(config.activeProvider).toBe(DEFAULT_CONN.activeProvider);
    });

    it('should return saved config when available', () => {
      const saved = {
        firebase: { enabled: true, projectId: 'saved-proj', apiKey: 'saved-key' },
        supabase: { enabled: false, url: '', anonKey: '', tableName: 'soba_sync' },
        activeProvider: 'firebase' as const,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      const config = loadConnConfig();
      expect(config.firebase.projectId).toBe('saved-proj');
    });
  });
});
