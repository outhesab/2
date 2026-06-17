/**
 * Listeners — Domain event listener'ları.
 * 
 * Kullanım:
 *   import { setupDomainListeners } from '@/domain/listeners';
 *   const cleanup = setupDomainListeners({ save, showToast });
 *   // cleanup() // abonelikleri iptal etmek için
 */
export { bridgeDomainEvents } from './agentBridge';
export { enableAuditLogging } from './auditLogger';
export { enableNotifications } from './notification';

import type { DomainBusSaveFn } from '@/domain/eventBus';
import { bridgeDomainEvents } from './agentBridge';
import { enableAuditLogging } from './auditLogger';
import { enableNotifications } from './notification';

export interface DomainListenerContext {
  save: DomainBusSaveFn;
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

/**
 * Tüm domain listener'ları kurar.
 * App başlangıcında bir kere çağrılır.
 * Dönen fonksiyon temizlik içindir.
 */
export function setupDomainListeners(ctx: DomainListenerContext): () => void {
  const cleanups: Array<() => void> = [];

  // AgentBridge — her zaman aktif
  cleanups.push(bridgeDomainEvents());

  // AuditLogger — save varsa aktif
  cleanups.push(enableAuditLogging(ctx.save));

  // Notification — showToast varsa aktif
  if (ctx.showToast) {
    cleanups.push(enableNotifications(ctx.showToast));
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
