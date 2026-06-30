/**
 * App shell orchestration hook
 * R3-7 A-1: useAppBootstrap'tan ayrılan sorumluluklar:
 * - Agent bağlama
 * - Domain event bus listener kurulumu
 * - Export JSON event listener
 *
 * Plan: fix-plan-repo_2-round2-2026-06-29.md, PR-R3-7
 */

import { useEffect } from 'react';
import { getAllAgents } from '@/agents';
import type { AgentContext } from '@/agents/types';
import { setupDomainListeners } from '@/domain';
import type { DB } from '@/types';

interface Props {
  db: DB;
  save: (updater: (prev: DB) => DB) => void;
  isDBReady: boolean;
  exportJSON: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info', opts?: { duration?: number }) => void;
}

export function useShellOrchestration({ db, save, isDBReady, exportJSON, showToast }: Props): void {
  // Agent bağlama
  useEffect(() => {
    if (!isDBReady) return;
    const ctx: AgentContext = { getDB: () => db, save };
    getAllAgents().forEach((agent) => agent.bagla(ctx));
  }, [isDBReady, db, save]);

  // Domain Event Bus listener'ları
  useEffect(() => {
    if (!isDBReady) return;
    return setupDomainListeners({ save, showToast });
  }, [isDBReady, save, showToast]);

  // Export JSON event listener (Dashboard widget tetikler)
  useEffect(() => {
    const handler = () => {
      exportJSON();
      localStorage.setItem('sobaYonetim_lastBackup', new Date().toISOString());
    };
    window.addEventListener('soba:exportJSON', handler);
    return () => window.removeEventListener('soba:exportJSON', handler);
  }, [exportJSON]);
}
