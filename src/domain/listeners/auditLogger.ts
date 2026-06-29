/**
 * AuditLogger — Domain event'leri activity log'a kaydeder.
 *
 * Her domain event için _activityLog'a bir giriş ekler.
 * save fonksiyonu dışarıdan enjekte edilir (context).
 */
import { domainEventBus } from '@/domain/eventBus';
import type { DomainEvent } from '@/types';
import type { DomainBusSaveFn } from '@/domain/eventBus';

/** Event type → okunabilir etiket */
const EVENT_LABELS: Record<string, string> = {
  'sale.completed': 'Satış tamamlandı',
  'sale.cancelled': 'Satış iptal edildi',
  'sale.returned': 'Satış iade edildi',
  'sale.price_corrected': 'Satış fiyatı düzeltildi',
  'stock.deducted': 'Stok düşüldü',
  'stock.returned': 'Stok iade alındı',
  'stock.adjusted': 'Stok ayarlandı',
  'stock.product_added': 'Ürün eklendi',
  'cash.recorded': 'Kasa işlemi kaydedildi',
  'cari.updated': 'Cari bakiye güncellendi',
  'cari.added': 'Cari eklendi',
};

function eventLabel(type: string): string {
  return EVENT_LABELS[type] || `Domain event: ${type}`;
}

/** Subscribe to domain events and log them via save() */
export function enableAuditLogging(save: DomainBusSaveFn): () => void {
  return domainEventBus.onAny((event: DomainEvent) => {
    // Activity log'a kaydet (hata sessizce yutulur)
    try {
      save((prev) => {
        const log = [
          {
            id: event.id,
            action: eventLabel(event.type),
            detail: `${event.aggregateType}:${event.aggregateId}`,
            time: event.timestamp,
          },
          ...(prev._activityLog || []),
        ].slice(0, 200);
        return { ...prev, _activityLog: log };
      });
    } catch {
      // Save hatası sessizce yutulur — log kaydı kritik değil
    }
  });
}
