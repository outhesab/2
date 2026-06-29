/**
 * AgentBridge — DomainEvent → AgentBus köprüsü.
 *
 * Domain event'leri AgentBus event'lerine çevirir,
 * böylece agent'lar domain'de olan bitenden haberdar olur.
 *
 * Örnek: sale.completed → agentBus.emit('satis', 'DOMAIN_EVENT', { domainEvent })
 */
import { agentBus } from '@/agents/AgentBus';
import type { AgentId } from '@/agents/types';
import { domainEventBus } from '@/domain/eventBus';
import type { DomainEvent } from '@/types';

/** Event type → AgentId + agent event type mapping */
const EVENT_ROUTES: Record<string, { agent: AgentId; eventType: string }> = {
  'sale.completed': { agent: 'satis', eventType: 'DOMAIN_SALE_COMPLETED' },
  'sale.cancelled': { agent: 'satis', eventType: 'DOMAIN_SALE_CANCELLED' },
  'sale.returned': { agent: 'satis', eventType: 'DOMAIN_SALE_RETURNED' },
  'sale.price_corrected': { agent: 'satis', eventType: 'DOMAIN_SALE_PRICE_CORRECTED' },
  'stock.deducted': { agent: 'stok', eventType: 'DOMAIN_STOCK_DEDUCTED' },
  'stock.returned': { agent: 'stok', eventType: 'DOMAIN_STOCK_RETURNED' },
  'stock.adjusted': { agent: 'stok', eventType: 'DOMAIN_STOCK_ADJUSTED' },
  'stock.product_added': { agent: 'stok', eventType: 'DOMAIN_PRODUCT_ADDED' },
  'cash.recorded': { agent: 'kasa', eventType: 'DOMAIN_CASH_RECORDED' },
  'cari.updated': { agent: 'cari', eventType: 'DOMAIN_CARI_UPDATED' },
  'cari.added': { agent: 'cari', eventType: 'DOMAIN_CARI_ADDED' },
};

/** Subscribe to domain events and bridge them to AgentBus */
export function bridgeDomainEvents(): () => void {
  return domainEventBus.onAny((event: DomainEvent) => {
    const route = EVENT_ROUTES[event.type];
    if (route) {
      agentBus.emit(route.agent, route.eventType, {
        domainEvent: event,
        payload: event.payload,
        aggregateId: event.aggregateId,
      });
    }
  });
}
