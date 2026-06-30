/**
 * shellLifecycle hook testleri
 * Round2 review C-4: useBeforeUnloadGuard, useStorageSync, useSyncStatusListener,
 * useKeyboardShortcuts için temel regression test'ler.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useBeforeUnloadGuard,
  useStorageSync,
  useSyncStatusListener,
  useKeyboardShortcuts,
} from '@/hooks/app/shellLifecycle';
import { onSyncStatus } from '@/hooks/useDB';
import { loadUIPrefs } from '@/hooks/useUIPrefs';
import type { UIPrefs } from '@/hooks/useUIPrefs';
import type { TabId } from '@/config/tabs';

// onSyncStatus mock
vi.mock('@/hooks/useDB', () => ({
  onSyncStatus: vi.fn(),
  type: { SyncStatus: 'sync' },
}));

// loadUIPrefs mock
vi.mock('@/hooks/useUIPrefs', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useUIPrefs')>('@/hooks/useUIPrefs');
  return {
    ...actual,
    loadUIPrefs: vi.fn(() => ({ themeId: 'default' } as UIPrefs)),
  };
});

describe('useBeforeUnloadGuard', () => {
  it('beforeunload event listener kuruyor', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useBeforeUnloadGuard());
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('beforeunload tetiklendiğinde preventDefault + returnValue set ediyor', () => {
    renderHook(() => useBeforeUnloadGuard());
    const event = new Event('beforeunload') as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    // returnValue setter'ı spy'la
    let capturedValue: string | undefined;
    Object.defineProperty(event, 'returnValue', {
      get: () => capturedValue,
      set: (v) => {
        capturedValue = v;
      },
    });

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(capturedValue).toContain('PARSPEL');
  });
});

describe('useStorageSync', () => {
  it('storage ve sobaUI:updated event listener kuruyor', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const setUiPrefs = vi.fn();

    const { unmount } = renderHook(() => useStorageSync(setUiPrefs));
    expect(addSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('sobaUI:updated', expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('sobaUI:updated', expect.any(Function));
  });

  it('storage event tetiklendiğinde setUiPrefs + loadUIPrefs çağrılıyor', () => {
    const setUiPrefs = vi.fn();
    renderHook(() => useStorageSync(setUiPrefs));

    window.dispatchEvent(new Event('storage'));
    expect(loadUIPrefs).toHaveBeenCalled();
    expect(setUiPrefs).toHaveBeenCalledWith({ themeId: 'default' });
  });

  it('sobaUI:updated event tetiklendiğinde de aynı davranış', () => {
    const setUiPrefs = vi.fn();
    renderHook(() => useStorageSync(setUiPrefs));

    window.dispatchEvent(new Event('sobaUI:updated'));
    expect(setUiPrefs).toHaveBeenCalled();
  });
});

describe('useSyncStatusListener', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;
  let mockCallback: ((status: string, detail?: string) => void) | undefined;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    mockCallback = undefined;
    vi.mocked(onSyncStatus).mockImplementation((cb) => {
      mockCallback = cb;
      return mockUnsubscribe;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('onSyncStatus ile subscribe oluyor ve unsubscribe cleanup yapıyor', () => {
    const setSyncStatus = vi.fn();
    const setLastSyncTime = vi.fn();

    const { unmount } = renderHook(() => useSyncStatusListener(setSyncStatus, setLastSyncTime));
    expect(onSyncStatus).toHaveBeenCalled();

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('status saved olduğunda setLastSyncTime set ediliyor', () => {
    const setSyncStatus = vi.fn();
    const setLastSyncTime = vi.fn();
    renderHook(() => useSyncStatusListener(setSyncStatus, setLastSyncTime));

    mockCallback?.('saved');
    expect(setSyncStatus).toHaveBeenCalledWith('saved');
    expect(setLastSyncTime).toHaveBeenCalledWith(expect.stringMatching(/\d{2}:\d{2}/));
  });

  it('status error + detail olduğunda sadece setSyncStatus tetikleniyor (logger.warn)', () => {
    const setSyncStatus = vi.fn();
    const setLastSyncTime = vi.fn();
    renderHook(() => useSyncStatusListener(setSyncStatus, setLastSyncTime));

    mockCallback?.('error', 'sync failed');
    expect(setSyncStatus).toHaveBeenCalledWith('error');
    expect(setLastSyncTime).not.toHaveBeenCalled();
  });
});

describe('useKeyboardShortcuts', () => {
  it('keydown event listener kuruyor ve cleanup yapıyor', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const navigate = vi.fn();

    const { unmount } = renderHook(() => useKeyboardShortcuts(navigate));
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('Ctrl+1 navigate("dashboard") çağrılıyor', () => {
    const navigate = vi.fn();
    renderHook(() => useKeyboardShortcuts(navigate));

    const event = new KeyboardEvent('keydown', { key: '1', ctrlKey: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('dashboard' as TabId);
  });

  it('Ctrl+5 navigate("reports") çağrılıyor', () => {
    const navigate = vi.fn();
    renderHook(() => useKeyboardShortcuts(navigate));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '5', ctrlKey: true }));
    expect(navigate).toHaveBeenCalledWith('reports' as TabId);
  });

  it('Ctrl olmadan basıldığında navigate çağrılmıyor', () => {
    const navigate = vi.fn();
    renderHook(() => useKeyboardShortcuts(navigate));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('Ctrl+6 (tanımsız) navigate çağrılmıyor', () => {
    const navigate = vi.fn();
    renderHook(() => useKeyboardShortcuts(navigate));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '6', ctrlKey: true }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('Meta+1 (macOS) navigate("dashboard") çağrılıyor', () => {
    const navigate = vi.fn();
    renderHook(() => useKeyboardShortcuts(navigate));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', metaKey: true }));
    expect(navigate).toHaveBeenCalledWith('dashboard' as TabId);
  });
});
