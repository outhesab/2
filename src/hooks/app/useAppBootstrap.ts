/**
 * App shell bootstrap hook
 * PR-D1c: App.tsx'in kalan 9 useEffect'i tek hook'ta toplar.
 * Plan: fix-plan-repo_2-2026-06-29.md, PR-D1c
 *
 * Sorumluluklar:
 * 1. DB hata izleme (dbError → toast)
 * 2. Logger → toast (critical/error db mesajları)
 * 3. Agent bağlama (getAllAgents().bagla)
 * 4. Domain event bus listener kurulumu
 * 5. Versiyon güncelleme toast'u (her versiyon 1 kez)
 * 6. Online/offline status değişim toast'u
 * 7. Resize → isMobile state
 * 8. Active tab → expanded group auto-expand
 * 9. Export JSON event listener (Dashboard widget tetikler)
 */

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { getAllAgents } from '@/agents';
import type { AgentContext } from '@/agents/types';
import { setupDomainListeners } from '@/domain';
import { getAppVersion, getVersionTitle } from '@/lib/version';
import { BRAND_NAME } from '@/config/brand';
import type { DB, DBError } from '@/types';
import { TABS, type TabId, type TabGroup } from '@/config/tabs';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/components/Toast';

export interface AppBootstrapParams {
  db: DB;
  save: (updater: (prev: DB) => DB) => void;
  isDBReady: boolean;
  dbError: DBError | null;
  clearError: () => void;
  isMobile: boolean;
  setIsMobile: (value: boolean) => void;
  exportJSON: () => void;
  activeTab: TabId;
  setExpandedGroups: (updater: (prev: Record<TabGroup, boolean>) => Record<TabGroup, boolean>) => void;
}

export interface AppBootstrapResult {
  isOnline: boolean;
  isDBReady: boolean;
  showToast: ReturnType<typeof useToast>['showToast'];
}

/**
 * Tüm app shell side-effect'lerini yöneten merkezi hook.
 * 9 ayrı useEffect'i tek yerde toplar, test edilebilirlik + bakım kazanır.
 */
export function useAppBootstrap(params: AppBootstrapParams): AppBootstrapResult {
  const {
    db,
    save,
    isDBReady,
    dbError,
    clearError,
    isMobile,
    setIsMobile,
    exportJSON,
    activeTab,
    setExpandedGroups,
  } = params;
  const { showToast } = useToast();
  const isOnline = useOnlineStatus();
  const prevOnline = useRef(isOnline);

  // 1. Global DB hata izleme
  useEffect(() => {
    if (!isDBReady) return;
    if (dbError) {
      showToast(dbError.message, 'error');
      clearError();
    }
  }, [isDBReady, dbError, showToast, clearError]);

  // 2. Logger üzerinden kritik hataları Toast'a yönlendir
  useEffect(() => {
    if (!isDBReady) return;
    return logger.subscribe((entry) => {
      if (entry.level === 'critical' || (entry.level === 'error' && entry.cat === 'db')) {
        showToast(`Sistem Hatası [${entry.cat}]: ${entry.msg}`, 'error');
      }
    });
  }, [isDBReady, showToast]);

  // 3. Agent'ları bağla
  useEffect(() => {
    if (!isDBReady) return;
    const ctx: AgentContext = { getDB: () => db, save };
    getAllAgents().forEach((agent) => agent.bagla(ctx));
  }, [isDBReady, db, save]);

  // 4. Domain Event Bus listener'larını kur
  useEffect(() => {
    if (!isDBReady) return;
    const cleanup = setupDomainListeners({
      save,
      showToast: (msg, type) => showToast(msg, type),
    });
    return cleanup;
  }, [isDBReady, save, showToast]);

  // 5. Versiyon güncelleme toast'u — her versiyon için bir kez
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

  // 6. Online/offline status değişimi toast'u
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

  // 7. Resize → isMobile
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setIsMobile]);

  // 8. Active tab → expanded group auto-expand
  useEffect(() => {
    const activeGroup = TABS.find((tab) => tab.id === activeTab)?.group;
    if (!activeGroup) return;
    setExpandedGroups((prev) => (prev[activeGroup] ? prev : { ...prev, [activeGroup]: true }));
  }, [activeTab, setExpandedGroups]);

  // 9. Export JSON event listener (Dashboard widget tetikler)
  useEffect(() => {
    const handler = () => {
      exportJSON();
      localStorage.setItem('sobaYonetim_lastBackup', new Date().toISOString());
    };
    window.addEventListener('soba:exportJSON', handler);
    return () => window.removeEventListener('soba:exportJSON', handler);
  }, [exportJSON]);

  // isMobile warning suppression (param olarak geliyor, hook içinde kullanılmıyor ama
  // App.tsx'in dış state'ine bağımlı, ref guard olarak)
  void isMobile;

  return { isOnline, isDBReady, showToast };
}
