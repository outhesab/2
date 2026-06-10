import type { AgentEvent, AgentId } from '@/agents/types';
import mitt, { type Emitter } from 'mitt';

type BusEvents = {
  event: AgentEvent;
};

class AgentBus {
  private emitter: Emitter<BusEvents>;
  /** wrapper fonksiyonları saklar (on() ile eklenen, handler wrapper eşlemesi) */
  private wrappers = new WeakMap<(event: AgentEvent) => void, (event: AgentEvent) => void>();

  constructor() {
    this.emitter = mitt<BusEvents>();
  }

  emit(from: AgentId, type: string, payload?: Record<string, unknown>) {
    this.emitter.emit('event', {
      from,
      type,
      payload,
      createdAt: new Date().toISOString(),
    });
  }

  /** Belirli bir event tipini dinler */
  on(type: string, handler: (event: AgentEvent) => void): () => void {
    const wrapper = (event: AgentEvent) => {
      if (event.type === type) {
        handler(event);
      }
    };
    this.wrappers.set(handler, wrapper);
    this.emitter.on('event', wrapper);
    return () => {
      this.emitter.off('event', wrapper);
      this.wrappers.delete(handler);
    };
  }

  /** Belirli bir event tipini dinlemeyi bırakır */
  off(_type: string, handler: (event: AgentEvent) => void): void {
    const wrapper = this.wrappers.get(handler);
    if (wrapper) {
      this.emitter.off('event', wrapper);
      this.wrappers.delete(handler);
    }
  }

  /** Tüm event'leri dinler */
  onEvent(handler: (event: AgentEvent) => void): () => void {
    this.emitter.on('event', handler);
    return () => this.emitter.off('event', handler);
  }
}

export const agentBus = new AgentBus();
