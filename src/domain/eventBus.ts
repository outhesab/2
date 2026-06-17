/**
 * DomainEventBus — typed pub/sub for domain events.
 * Powered by mitt, consistent with AgentBus.
 * 
 * Usage:
 *   domainEventBus.emit(event)
 *   domainEventBus.on('sale.completed', handler)
 *   domainEventBus.onAny(handler)
 *   const unsub = domainEventBus.on('stock.low', handler)
 *   unsub() // unsubscribe
 *   domainEventBus.clear()
 */
import mitt, { type Emitter } from 'mitt';
import type { DomainEvent } from '@/types';

type DomainEventBusEvents = {
  [type: string]: DomainEvent;
};

class DomainEventBus {
  private emitter: Emitter<DomainEventBusEvents>;
  private anyHandlers: Set<(event: DomainEvent) => void> = new Set();

  constructor() {
    this.emitter = mitt<DomainEventBusEvents>();
  }

  /** Emit a domain event — fires both type-specific and onAny handlers */
  emit(event: DomainEvent): void {
    this.emitter.emit(event.type, event);
    this.anyHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('[domainEventBus] onAny handler hatası:', error);
      }
    });
  }

  /** Subscribe to a specific event type (e.g. 'sale.completed') */
  on(type: string, handler: (event: DomainEvent) => void): () => void {
    this.emitter.on(type, handler as (e: unknown) => void);
    return () => {
      this.emitter.off(type, handler as (e: unknown) => void);
    };
  }

  /** Subscribe to ALL domain events */
  onAny(handler: (event: DomainEvent) => void): () => void {
    this.anyHandlers.add(handler);
    return () => {
      this.anyHandlers.delete(handler);
    };
  }

  /** Unsubscribe a specific handler from a type */
  off(type: string, handler: (event: DomainEvent) => void): void {
    this.emitter.off(type, handler as (e: unknown) => void);
  }

  /** Remove all listeners */
  clear(): void {
    this.emitter.all.clear();
    this.anyHandlers.clear();
  }

  /** Number of registered handlers (for debugging) */
  get handlerCount(): { typed: number; any: number } {
    return {
      typed: this.emitter.all.size,
      any: this.anyHandlers.size,
    };
  }
}

/** Singleton instance */
export const domainEventBus = new DomainEventBus();

/** Shorthand type for save function used by listeners */
export type DomainBusSaveFn = (updater: (prev: import('@/types').DB) => import('@/types').DB) => void;
