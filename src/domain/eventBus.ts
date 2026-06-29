/**
 * DomainEventBus — typed pub/sub for domain events.
 * Powered by mitt, consistent with AgentBus.
 */
import mitt, { type Emitter } from 'mitt';
import type { DomainEvent } from '@/types';
import { logger } from '@/lib/logger';

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
        logger.error('system', 'onAny handler hatası:', error);
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

  /** Shorthand to emit an error event */
  emitError(message: string, code?: string, context?: Record<string, unknown>): void {
    this.emit({
      id: crypto.randomUUID(),
      type: 'system.error',
      aggregateId: 'system',
      aggregateType: 'error',
      payload: { message, code, ...context },
      timestamp: new Date().toISOString(),
      version: 1,
    });
  }

  /** Shorthand to emit a warning event */
  emitWarning(message: string, code?: string, context?: Record<string, unknown>): void {
    this.emit({
      id: crypto.randomUUID(),
      type: 'system.warning',
      aggregateId: 'system',
      aggregateType: 'warning',
      payload: { message, code, ...context },
      timestamp: new Date().toISOString(),
      version: 1,
    });
  }

  /** Shorthand to emit a success event */
  emitSuccess(message: string, context?: Record<string, unknown>): void {
    this.emit({
      id: crypto.randomUUID(),
      type: 'system.success',
      aggregateId: 'system',
      aggregateType: 'success',
      payload: { message, ...context },
      timestamp: new Date().toISOString(),
      version: 1,
    });
  }
}

/** Singleton instance */
export const domainEventBus = new DomainEventBus();

/** Shorthand type for save function used by listeners */
export type DomainBusSaveFn = (updater: (prev: import('@/types').DB) => import('@/types').DB) => void;
