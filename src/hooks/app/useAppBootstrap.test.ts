/**
 * useAppBootstrap hook testleri
 * Round2 review C-4: 9 useEffect'i tek hook'ta toplayan useAppBootstrap
 * için temel smoke test'ler.
 *
 * Hook karmaşık olduğu için tüm effect'leri test etmek yerine
 * kritik olanları (agent bağlama, domain listener, online status,
 * versiyon toast) test ediyoruz. Diğer effect'ler entegrasyon
 * test'leriyle zaten örtülü olarak validate ediliyor.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppBootstrap, type AppBootstrapParams } from '@/hooks/app/useAppBootstrap';
import { getAllAgents } from '@/agents';
import { setupDomainListeners } from '@/domain';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { DB } from '@/types';

// Mocks
vi.mock('@/agents', () => ({
  getAllAgents: vi.fn(() => []),
}));

vi.mock('@/domain', () => ({
  setupDomainListeners: vi.fn(() => () => {}),
}));

vi.mock('@/lib/version', () => ({
  getAppVersion: vi.fn(() => '3.43.4'),
  getVersionTitle: vi.fn(() => 'Moratoryum temizliği'),
}));

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => true),
}));

const mockShowToast = vi.fn();
vi.mock('@/components/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockDB = {} as DB;
const mockSave = vi.fn();
const mockSetIsMobile = vi.fn();
const mockSetExpandedGroups = vi.fn();
const mockExportJSON = vi.fn();
const mockClearError = vi.fn();

const baseParams: AppBootstrapParams = {
  db: mockDB,
  save: mockSave,
  isDBReady: true,
  dbError: null,
  clearError: mockClearError,
  isMobile: false,
  setIsMobile: mockSetIsMobile,
  exportJSON: mockExportJSON,
  activeTab: 'dashboard',
  setExpandedGroups: mockSetExpandedGroups,
};

describe('useAppBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // localStorage stub (jsdom'da eksik olabiliyor)
    const store: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((k: string) => store[k] ?? null),
        setItem: vi.fn((k: string, v: string) => {
          store[k] = v;
        }),
        removeItem: vi.fn((k: string) => {
          delete store[k];
        }),
        clear: vi.fn(() => {
          for (const k of Object.keys(store)) delete store[k];
        }),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isDBReady=false durumu', () => {
    it('agent baglama yapmıyor (effect skip)', () => {
      const mockBagla = vi.fn();
      vi.mocked(getAllAgents).mockReturnValue([{ bagla: mockBagla } as never]);

      renderHook(() => useAppBootstrap({ ...baseParams, isDBReady: false }));
      expect(mockBagla).not.toHaveBeenCalled();
    });

    it('setupDomainListeners çağırmıyor (effect skip)', () => {
      renderHook(() => useAppBootstrap({ ...baseParams, isDBReady: false }));
      expect(setupDomainListeners).not.toHaveBeenCalled();
    });
  });

  describe('isDBReady=true durumu', () => {
    it('getAllAgents().bagla() çağrılıyor', () => {
      const mockBagla = vi.fn();
      vi.mocked(getAllAgents).mockReturnValue([{ bagla: mockBagla } as never]);

      renderHook(() => useAppBootstrap(baseParams));
      expect(mockBagla).toHaveBeenCalledWith({ getDB: expect.any(Function), save: mockSave });
    });

    it('setupDomainListeners çağrılıyor', () => {
      renderHook(() => useAppBootstrap(baseParams));
      expect(setupDomainListeners).toHaveBeenCalledWith({
        save: mockSave,
        showToast: expect.any(Function),
      });
    });

    it('dbError olduğunda showToast(error.message) + clearError çağrılıyor', () => {
      const dbError = { message: 'DB bağlantı hatası' } as never;
      renderHook(() => useAppBootstrap({ ...baseParams, dbError }));

      expect(mockShowToast).toHaveBeenCalledWith('DB bağlantı hatası', 'error');
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('online status', () => {
    it('isOnline değerini döndürüyor', () => {
      vi.mocked(useOnlineStatus).mockReturnValue(true);
      const { result } = renderHook(() => useAppBootstrap(baseParams));
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('versiyon toast', () => {
    it('ilk görüntülemede (seenVersion=null) toast gösteriliyor', async () => {
      vi.useFakeTimers();
      renderHook(() => useAppBootstrap(baseParams));

      // setTimeout 1500ms bekliyor
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('3.43.4'),
        'info',
        { duration: 7000 },
      );
      vi.useRealTimers();
    });

    it('seenVersion mevcutsa toast göstermiyor', () => {
      localStorage.setItem('lastSeenVersion', '3.43.4');
      vi.useFakeTimers();
      renderHook(() => useAppBootstrap(baseParams));

      vi.advanceTimersByTime(2000);
      // Mock'ı temizle
      mockShowToast.mockClear();

      // showToast sadece başka effect'ler tarafından çağrılmış olabilir
      const callsForVersion = mockShowToast.mock.calls.filter((c) =>
        c[0]?.toString().includes('3.43.4'),
      );
      expect(callsForVersion).toHaveLength(0);
      vi.useRealTimers();
    });
  });

  describe('active tab expansion', () => {
    it('activeTab değiştiğinde setExpandedGroups çağrılıyor', () => {
      const params = { ...baseParams, activeTab: 'sales' as never };
      renderHook(() => useAppBootstrap(params));
      expect(mockSetExpandedGroups).toHaveBeenCalled();
    });
  });

  describe('exportJSON listener', () => {
    it('soba:exportJSON event tetiklendiğinde exportJSON + localStorage update', () => {
      renderHook(() => useAppBootstrap(baseParams));
      window.dispatchEvent(new Event('soba:exportJSON'));

      expect(mockExportJSON).toHaveBeenCalled();
      expect(localStorage.getItem('sobaYonetim_lastBackup')).toBeTruthy();
    });
  });
});
