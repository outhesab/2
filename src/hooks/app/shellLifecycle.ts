/**
 * App shell custom hooks
 * PR-D1: App.tsx (568 satır) parçalanıyor — 14 useEffect bu hook'lara taşınıyor.
 * Plan: fix-plan-repo_2-2026-06-29.md, PR-D1 (3 alt-PR'a bölünmüş)
 */

import { useEffect, Dispatch, SetStateAction } from 'react';
import { loadUIPrefs } from '@/hooks/useUIPrefs';
import type { UIPrefs } from '@/hooks/useUIPrefs';
import { onSyncStatus, type SyncStatus } from '@/hooks/useDB';
import { logger } from '@/lib/logger';
import type { TabId } from '@/config/tabs';

/**
 * Tarayıcı sekmesinin yanlışlıkla kapatılmasını önler.
 * Veri kaybı + log takibi korunur.
 */
export function useBeforeUnloadGuard(): void {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        'PARSPEL: Devam eden işlemleriniz veya takip edilen loglarınız olabilir. Ayrılmak istediğinize emin misiniz?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}

/**
 * UIPrefs değişikliklerini dinler (Settings'ten güncelleme gelince yansıtır).
 * İki event source: 'storage' (cross-tab) + 'sobaUI:updated' (same-tab).
 */
export function useStorageSync(setUiPrefs: Dispatch<SetStateAction<UIPrefs>>): void {
  useEffect(() => {
    const handler = () => setUiPrefs(loadUIPrefs());
    window.addEventListener('storage', handler);
    window.addEventListener('sobaUI:updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('sobaUI:updated', handler);
    };
  }, [setUiPrefs]);
}

/**
 * Sync durumunu izler (idle/loading/saved/error) + son sync zamanını kaydeder.
 * Hata durumunda logger.warn ile log'a düşer.
 */
export function useSyncStatusListener(
  setSyncStatus: Dispatch<SetStateAction<SyncStatus>>,
  setLastSyncTime: Dispatch<SetStateAction<string>>,
): void {
  useEffect(() => {
    const unsub = onSyncStatus((status, detail) => {
      setSyncStatus(status);
      if (status === 'saved') {
        setLastSyncTime(
          new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        );
      }
      if (status === 'error' && detail) logger.warn('sync', 'sync hatası', { detail });
    });
    return unsub;
  }, [setSyncStatus, setLastSyncTime]);
}

/**
 * Ctrl+1-5 klavye kısayolları ile sayfa navigasyonu sağlar.
 * 'dashboard', 'products', 'sales', 'kasa', 'reports' için.
 */
export function useKeyboardShortcuts(navigate: (tab: TabId) => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const map: Record<string, TabId> = {
          '1': 'dashboard',
          '2': 'products',
          '3': 'sales',
          '4': 'kasa',
          '5': 'reports',
        };
        if (map[e.key]) {
          e.preventDefault();
          navigate(map[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
