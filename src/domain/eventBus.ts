import { genId } from "@/lib/utils-tr";
import type { DomainEvent } from "@/types";

type EventHandler = (event: DomainEvent) => void;

class DomainEventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private allHandlers = new Set<EventHandler>();

  on(type: string, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  onAny(handler: EventHandler): () => void {
    this.allHandlers.add(handler);
    return () => this.allHandlers.delete(handler);
  }

  emit(event: Omit<DomainEvent, "id" | "timestamp">): DomainEvent {
    const full: DomainEvent = {
      ...event,
      id: genId(),
      timestamp: new Date().toISOString(),
    };
    this.handlers.get(event.type)?.forEach((h) => h(full));
    this.allHandlers.forEach((h) => h(full));
    return full;
  }

  clear(): void {
    this.handlers.clear();
    this.allHandlers.clear();
  }
}

export const domainEventBus = new DomainEventBus();
