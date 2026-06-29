/**
 * App shell custom hooks
 * PR-D1: App.tsx (568 satır) parçalanıyor — 14 useEffect bu hook'lara taşınıyor.
 * Plan: fix-plan-repo_2-2026-06-29.md, PR-D1 (3 alt-PR'a bölünmüş)
 */

import { useEffect, Dispatch, SetStateAction } from 'react';
import { loadUIPrefs } from '@/hooks/useUIPrefs';
import type { UIPrefs } from '@/hooks/useUIPrefs';

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
