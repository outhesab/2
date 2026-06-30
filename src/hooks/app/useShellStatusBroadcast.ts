/**
 * App shell status broadcast hook
 * R3-7 A-1: useAppBootstrap'tan ayrılan sorumluluklar:
 * - DB hata izleme → toast
 * - Versiyon güncelleme toast'u (her versiyon 1 kez)
 * - Online/offline status değişimi → toast
 *
 * Plan: fix-plan-repo_2-round2-2026-06-29.md, PR-R3-7
 */

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { getAppVersion, getVersionTitle } from '@/lib/version';
import { BRAND_NAME } from '@/config/brand';
import type { DBError } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface Props {
  isDBReady: boolean;
  dbError: DBError | null;
  clearError: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info', opts?: { duration?: number }) => void;
}

export function useShellStatusBroadcast({ isDBReady, dbError, clearError, showToast }: Props): { isOnline: boolean } {
  const isOnline = useOnlineStatus();
  const prevOnline = useRef(isOnline);

  // DB hata izleme
  useEffect(() => {
    if (!isDBReady) return;
    if (dbError) {
      showToast(dbError.message, 'error');
      clearError();
    }
  }, [isDBReady, dbError, showToast, clearError]);

  // Versiyon güncelleme toast'u — her versiyon için bir kez
  useEffect(() => {
    const appVersion = getAppVersion();
    const seenVersion = localStorage.getItem('lastSeenVersion');
    try {
      if (seenVersion !== appVersion) {
        setTimeout(() => {
          showToast(`${BRAND_NAME} v${appVersion} — ${getVersionTitle()}`, 'info', { duration: 7000 });
          localStorage.setItem('lastSeenVersion', appVersion);
        }, 1500);
      }
    } catch {
      logger.warn('app', 'localStorage okuma/yazma hatası');
    }
  }, [showToast]);

  // Online/offline status değişimi toast'u
  useEffect(() => {
    if (prevOnline.current !== isOnline) {
      if (isOnline) {
        showToast('İnternet bağlantısı yeniden kuruldu', 'success');
      } else {
        showToast('Çevrimdışı çalışıyorsunuz — veriler korunuyor', 'info');
      }
      prevOnline.current = isOnline;
    }
  }, [isOnline, showToast]);

  return { isOnline };
}
