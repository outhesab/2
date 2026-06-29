/**
 * SOBA NEXUS AI — WhatsAppBridge
 * Müşteri WhatsApp mesajları → Intent → otomatik cevap.
 *
 * Vizyon: Müşteri WhatsApp'tan "Soba 80lik fiyatı ne?" diye sorar,
 * sistem cariyi telefonla tanır, stok/fiyat/bakiye bilgisini otomatik döner.
 *
 * Mimari:
 * - Saf fonksiyonlar (parseWhatsAppIntent, formatWhatsAppReply, identifyCustomerByPhone)
 *   test edilebilir, yan etkisiz.
 * - Stateful WhatsAppBridge singleton: incoming(message) → reply
 *
 * Önemli Sınırlama:
 * PARSPEL frontend-only (offline-first). Gerçek WhatsApp Business API
 * entegrasyonu bir backend (webhook alıcı) gerektirir. Bu modül:
 *   1. Müşteri mesaj parsing core (platform-bağımsız)
 *   2. Cevap üretim core
 *   3. Mock/test için incoming → reply akışı
 * Üretimde backend webhook'u bu fonksiyonları çağırır.
 */

import type { DB, Cari, Product } from '@/types';
import { logger } from '@/lib/logger';

// ── Tipler ───────────────────────────────────────────────────────────────────

export type WhatsAppIntentType =
  | 'greeting'
  | 'price_inquiry'
  | 'stock_inquiry'
  | 'order_status'
  | 'balance_inquiry'
  | 'business_hours'
  | 'human_request'
  | 'unknown';

export interface WhatsAppIntent {
  type: WhatsAppIntentType;
  /** Eşleşen ürün (price/stock sorgusu için) */
  productName?: string;
  /** Orijinal metin (temizlenmiş) */
  rawText: string;
  /** Parsing güven skoru (0-1) */
  confidence: number;
}

export interface WhatsAppIntentResult {
  intent: WhatsAppIntent;
  customer: Cari | null;
  /** Cevap metni (WhatsApp'a gönderilecek) */
  reply: string;
  /** İçeride aksiyon gerekiyor mu (ör. yetkili tahsilat) */
  requiresAction?: boolean;
}

// ── Saf: Müşteri tanımla ─────────────────────────────────────────────────────

/**
 * Telefon numarasından cari tanır.
 * Eşleşme: tam phone veya son 10 hane.
 */
export function identifyCustomerByPhone(db: DB, phone: string): Cari | null {
  const normalized = phone.replace(/\D/g, '');
  if (normalized.length < 10) return null;

  const last10 = normalized.slice(-10);

  return db.cari.find((c) => !c.deleted && c.phone && c.phone.replace(/\D/g, '').slice(-10) === last10) ?? null;
}

// ── Saf: Intent parse ────────────────────────────────────────────────────────

function normalizeText(s: string): string {
  return s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

/**
 * Müşteri WhatsApp mesajını intent'e çevirir.
 * Türkçe müşteri sorguları için optimize.
 */
export function parseWhatsAppIntent(text: string): WhatsAppIntent {
  const q = normalizeText(text);

  // greeting
  if (/\b(merhaba|selam|günaydın|iyi günler|iyi akşamlar|alo)\b/.test(q)) {
    return { type: 'greeting', rawText: text, confidence: 0.95 };
  }

  // human request
  if (/\b(insan|yetkili|satıcı|satici|müşteri hizmetleri|görüşebilirmiyim|görüşebilir miyim)\b/.test(q)) {
    return { type: 'human_request', rawText: text, confidence: 0.9 };
  }

  // business hours
  if (/\b(saat kaç|açık mı|açık mıdır|ne zaman açılıyor|çalışma saatleri|mesai)\b/.test(q)) {
    return { type: 'business_hours', rawText: text, confidence: 0.85 };
  }

  // balance inquiry
  if (/\b(bakiyem|borcum|alacağım|ne kadar borçlanmışım|hesabım|kalan)\b/.test(q)) {
    return { type: 'balance_inquiry', rawText: text, confidence: 0.85 };
  }

  // order status
  if (/\b(sipariş|siparis|nerede|ne zaman gelir|durumu|takip|kargo|yolda mı)\b/.test(q)) {
    return { type: 'order_status', rawText: text, confidence: 0.7 };
  }

  // price inquiry: "X fiyatı", "X ne kadar", "X fiyatı ne"
  const priceMatch = q.match(/(.+?)\s*(?:fiyatı|fiyat|ne kadar|kaç para|kaç lira|ücreti)/);
  if (priceMatch && (q.includes('fiyat') || q.includes('ne kadar') || q.includes('kaç'))) {
    let productName = (priceMatch[1] || '').trim();
    // "soba 80lik" → "soba 80lik", ön ekleri temizle
    productName = productName.replace(/\b(bir|tane|adet|var mı)\b/g, '').trim();
    if (productName.length >= 2) {
      return { type: 'price_inquiry', productName, rawText: text, confidence: 0.8 };
    }
  }

  // stock inquiry: "X var mı", "X stoğunuzda var mı", "X bulunuyor mu"
  if (q.includes('var mı') || q.includes('stok') || q.includes('bulunuyor') || q.includes('mevcut')) {
    const stockMatch = q.match(/(.+?)\s*(?:var mı|stoğunuzda|stokta|bulunuyor|mevcut)/);
    let productName = stockMatch ? (stockMatch[1] || '').trim() : '';
    productName = productName.replace(/\b(sizde|bende|bir|tane|adet)\b/g, '').trim();
    if (productName.length >= 2) {
      return { type: 'stock_inquiry', productName, rawText: text, confidence: 0.75 };
    }
    return { type: 'stock_inquiry', rawText: text, confidence: 0.5 };
  }

  return { type: 'unknown', rawText: text, confidence: 0.2 };
}

// ── Saf: Ürün arama (toleranslı) ─────────────────────────────────────────────

function findProduct(db: DB, name: string): Product | null {
  const target = normalizeText(name);
  if (target.length === 0) return null;
  const candidates = db.products.filter((p) => !p.deleted);
  return (
    candidates.find((p) => normalizeText(p.name) === target) ??
    candidates.find((p) => normalizeText(p.name).includes(target)) ??
    candidates.find((p) => {
      const pn = normalizeText(p.name);
      return pn.length >= 3 && target.includes(pn);
    }) ??
    null
  );
}

// ── Saf: Cevap üret ──────────────────────────────────────────────────────────

function money(n: number): string {
  return `${Math.round(n).toLocaleString('tr-TR')} TL`;
}

/**
 * Intent + DB → WhatsApp cevap metni.
 * Müşteriye nazik, kısa, net Türkçe.
 */
export function formatWhatsAppReply(
  intent: WhatsAppIntent,
  db: DB,
  customer: Cari | null,
): { reply: string; requiresAction?: boolean } {
  const customerName = customer?.name ?? 'Değerli müşterimiz';

  switch (intent.type) {
    case 'greeting': {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
      return {
        reply: `${greeting} ${customerName}! Soba bayiinize hoş geldiniz. Fiyat, stok, sipariş durumu veya bakiyeniz hakkında soru sorabilirsiniz.`,
      };
    }

    case 'price_inquiry': {
      if (!intent.productName) {
        return { reply: 'Hangi ürünün fiyatını öğrenmek istersiniz?' };
      }
      const product = findProduct(db, intent.productName);
      if (!product) {
        return { reply: `"${intent.productName}" adlı ürünümüzü bulamadım. Ürün adını tam yazabilir misiniz?` };
      }
      return {
        reply: `${product.name}: ${money(product.price)}. ${
          product.stock > 0 ? 'Stokta mevcut.' : 'Şu an stokta yok, sipariş verebilirsiniz.'
        }`,
      };
    }

    case 'stock_inquiry': {
      if (!intent.productName) {
        return { reply: 'Hangi ürünün stok durumunu öğrenmek istersiniz?' };
      }
      const product = findProduct(db, intent.productName);
      if (!product) {
        return { reply: `"${intent.productName}" adlı ürünümüzü bulamadım.` };
      }
      const stockStatus =
        product.stock === 0 ? 'Stokta yok' : product.stock <= product.minStock ? 'Az stoklu' : 'Stokta mevcut';
      return {
        reply: `${product.name}: ${stockStatus} (${product.stock} adet). ${
          product.stock === 0 ? 'Sipariş verebilirsiniz, ortalama 3-5 günde gelir.' : ''
        }`,
      };
    }

    case 'balance_inquiry': {
      if (!customer) {
        return {
          reply: 'Bakiye bilgisi için kayıtlı telefonunuzdan yazmanız gerekiyor. Yetkili ile görüşmek ister misiniz?',
        };
      }
      const balance = customer.balance ?? 0;
      if (balance > 0) {
        return {
          reply: `${customerName}, mevcut borcunuz: ${money(balance)}. Ödeme yapmak için bayiye uğrayabilir veya havale yapabilirsiniz.`,
        };
      }
      if (balance < 0) {
        return {
          reply: `${customerName}, hesabınızda ${money(Math.abs(balance))} alacağınız var.`,
        };
      }
      return { reply: `${customerName}, hesabınızda borç/alacak bulunmuyor.` };
    }

    case 'order_status': {
      if (!customer) {
        return { reply: 'Sipariş durumu için kayıtlı telefonunuzdan yazmanız gerekiyor.' };
      }
      // Müşteri siparişleri = sales kayıtları (Order tedarikçi siparişleri için)
      const customerSales = db.sales.filter((s) => !s.deleted && s.cariId === customer.id && s.status === 'tamamlandi');
      const recentSales = customerSales
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      if (recentSales.length === 0) {
        return { reply: `${customerName}, geçmiş sipariş kaydınız bulunmuyor.` };
      }
      const lastSale = recentSales[0];
      const lastDate = new Date(lastSale.createdAt).toLocaleDateString('tr-TR');
      return {
        reply: `${customerName}, son siparişiniz: ${lastSale.productName}, ${lastDate} tarihinde tamamlandı. Toplam ${money(lastSale.total)}.`,
      };
    }

    case 'business_hours': {
      return {
        reply: 'Bayimiz hafta içi 08:00-18:00, cumartesi 08:00-16:00 arası açıktır. Pazar günü kapalıyız.',
      };
    }

    case 'human_request': {
      return {
        reply: 'Sizi bir yetkiliye bağlıyorum. Lütfen kısa bir süre bekleyin, size dönülecek.',
        requiresAction: true,
      };
    }

    case 'unknown':
    default: {
      return {
        reply:
          "Mesajınızı anlayamadım. Fiyat, stok, sipariş durumu, bakiye veya çalışma saatleri hakkında soru sorabilirsiniz. Yetkili ile görüşmek için 'yetkili' yazabilirsiniz.",
      };
    }
  }
}

// ── Tam pipeline ─────────────────────────────────────────────────────────────

/**
 * Gelen WhatsApp mesajı → intent + customer + reply.
 * Backend webhook bu fonksiyonu çağırır, reply'ı geri gönderir.
 */
export function processIncomingWhatsApp(text: string, fromPhone: string, db: DB): WhatsAppIntentResult {
  const intent = parseWhatsAppIntent(text);
  const customer = identifyCustomerByPhone(db, fromPhone);
  const { reply, requiresAction } = formatWhatsAppReply(intent, db, customer);

  logger.info('ai', 'WhatsApp processed', {
    intentType: intent.type,
    customerFound: !!customer,
    confidence: intent.confidence,
  });

  return { intent, customer, reply, requiresAction };
}

// ── Stateful Bridge ──────────────────────────────────────────────────────────

export class WhatsAppBridge {
  private static instance: WhatsAppBridge;

  private constructor() {}

  public static getInstance(): WhatsAppBridge {
    if (!WhatsAppBridge.instance) {
      WhatsAppBridge.instance = new WhatsAppBridge();
    }
    return WhatsAppBridge.instance;
  }

  /**
   * Gelen mesajı işle, cevap döner.
   * Üretimde backend webhook bu metodu çağırır, reply'ı WhatsApp API'ye gönderir.
   */
  public incoming(text: string, fromPhone: string, db: DB): WhatsAppIntentResult {
    return processIncomingWhatsApp(text, fromPhone, db);
  }
}

export const whatsAppBridge = WhatsAppBridge.getInstance();
