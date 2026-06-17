/**
 * Notification — Domain event'ler için toast bildirimleri.
 * 
 * Önemli domain event'lerde kullanıcıya bildirim gösterir.
 * showToast fonksiyonu dışarıdan enjekte edilir.
 */
import { domainEventBus } from '@/domain/eventBus';
import type { DomainEvent } from '@/types';

type ToastFn = (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;

interface ToastRule {
  message: (event: DomainEvent) => string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const TOAST_RULES: Record<string, ToastRule> = {
  'sale.completed': {
    message: (e) => {
      const total = (e.payload as Record<string, unknown>)?.total;
      return `✅ Satış tamamlandı${total ? ` — ₺${Number(total).toFixed(2)}` : ''}`;
    },
    type: 'success',
  },
  'sale.cancelled': {
    message: () => '↩️ Satış iptal edildi',
    type: 'warning',
  },
  'sale.returned': {
    message: () => '🔁 Satış iade edildi',
    type: 'info',
  },
  'sale.price_corrected': {
    message: () => '💰 Satış fiyatı düzeltildi',
    type: 'info',
  },
  'stock.product_added': {
    message: (e) => {
      const name = (e.payload as Record<string, unknown>)?.productName || 'Ürün';
      return `📦 ${name} eklendi`;
    },
    type: 'success',
  },
  'cari.added': {
    message: (e) => {
      const name = (e.payload as Record<string, unknown>)?.name || 'Cari';
      return `👤 ${name} eklendi`;
    },
    type: 'success',
  },
};

/** Subscribe to domain events and show toasts */
export function enableNotifications(showToast: ToastFn): () => void {
  return domainEventBus.onAny((event: DomainEvent) => {
    const rule = TOAST_RULES[event.type];
    if (rule) {
      try {
        showToast(rule.message(event), rule.type);
      } catch {
        // Bildirim hatası sessizce yutulur
      }
    }
  });
}
