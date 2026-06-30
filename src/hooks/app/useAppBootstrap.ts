/**
 * App shell bootstrap hook
 * R3-7: Sorumlulukları alt hook'lara dağıtıldı:
 * - useShellOrchestration → agent bağlama, domain listeners, export JSON
 * - useShellStatusBroadcast → dbError, version toast, online/offline
 * - Kalan: resize, active tab expansion
 *
 * Plan: fix-plan-repo_2-round2-2026-06-29.md, PR-R3-7
 */

import { useEffect } from 'react';
import type { DB, DBError } from '@/types';
import { TABS, type TabId, type TabGroup } from '@/config/tabs';
import { useShellOrchestration } from './useShellOrchestration';
import { useShellStatusBroadcast } from './useShellStatusBroadcast';
import { useToast } from '@/components/Toast';

export interface AppBootstrapParams {
  db: DB;
  save: (updater: (prev: DB) => DB) => void;
  isDBReady: boolean;
  dbError: DBError | null;
  clearError: () => void;
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
 * Sorumluluklar alt hook'lara dağıtılmıştır (R3-7).
 */
export function useAppBootstrap(params: AppBootstrapParams): AppBootstrapResult {
  const {
    db,
    save,
    isDBReady,
    dbError,
    clearError,
    setIsMobile,
    exportJSON,
    activeTab,
    setExpandedGroups,
  } = params;
  const { showToast } = useToast();

  // Delegated sub-hooks
  useShellOrchestration({ db, save, isDBReady, exportJSON, showToast });
  const { isOnline } = useShellStatusBroadcast({ isDBReady, dbError, clearError, showToast });

  // Resize → isMobile
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setIsMobile]);

  // Active tab → expanded group auto-expand
  useEffect(() => {
    const activeGroup = TABS.find((tab) => tab.id === activeTab)?.group;
    if (!activeGroup) return;
    setExpandedGroups((prev) => (prev[activeGroup] ? prev : { ...prev, [activeGroup]: true }));
  }, [activeTab, setExpandedGroups]);

  return { isOnline, isDBReady, showToast };
}
