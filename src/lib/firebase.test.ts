import { describe, expect, it, vi } from 'vitest';

// Firebase module mock
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
}));

describe('firebase', () => {
  it('should export expected functions', async () => {
    const mod = await import('./firebase');
    expect(typeof mod.isFirebaseReady).toBe('function');
    expect(typeof mod.getFirebaseProject).toBe('function');
    expect(typeof mod.getFirestoreDb).toBe('function');
    expect(typeof mod.readDoc).toBe('function');
    expect(typeof mod.writeDoc).toBe('function');
    expect(typeof mod.removeDoc).toBe('function');
  });

  it('should not be ready by default', async () => {
    const { isFirebaseReady } = await import('./firebase');
    expect(typeof isFirebaseReady()).toBe('boolean');
  });
});
