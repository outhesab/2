import { describe, it, expect } from 'vitest';
import type { DB, Cari, Product, Sale } from '@/types';
import { makeDB } from '@/__tests__/testUtils';
import {
  identifyCustomerByPhone,
  parseWhatsAppIntent,
  formatWhatsAppReply,
  processIncomingWhatsApp,
  WhatsAppBridge,
} from './WhatsAppBridge';

// ── Test yardımcıları ────────────────────────────────────────────────────────

function makeCari(c: Partial<Cari> & { id: string }): Cari {
  return {
    name: 'Ali Yılmaz',
    balance: 0,
    deleted: false,
    type: 'musteri',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...c,
  };
}

function makeProduct(p: Partial<Product> & { id: string }): Product {
  return {
    name: 'Soba 80lik',
    category: 'soba',
    cost: 4000,
    price: 5000,
    stock: 20,
    minStock: 2,
    deleted: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...p,
  };
}

function makeSale(p: Partial<Sale> & { id: string }): Sale {
  return {
    cariId: 'c-ali',
    productName: 'Soba 80lik',
    productCategory: 'soba',
    quantity: 1,
    unitPrice: 5000,
    cost: 4000,
    discount: 0,
    discountAmount: 0,
    subtotal: 5000,
    total: 5000,
    profit: 1000,
    payment: 'nakit',
    status: 'tamamlandi',
    items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 1, unitPrice: 5000, cost: 4000, total: 5000 }],
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
    ...p,
  } as Sale;
}

function makeTestDB(overrides: { products?: Product[]; cari?: Cari[]; sales?: Sale[] } = {}): DB {
  return makeDB({
    products: overrides.products ?? [
      makeProduct({ id: 'p1', name: 'Soba 80lik', price: 5000, stock: 20 }),
      makeProduct({ id: 'p2', name: 'Soba 60lık', price: 3000, stock: 0, minStock: 2 }),
    ],
    cari: overrides.cari ?? [
      makeCari({ id: 'c-ali', name: 'Ali Yılmaz', phone: '+905551234567', balance: 1500 }),
      makeCari({ id: 'c-ahmet', name: 'Ahmet Bey', phone: '05321234567', balance: -500 }),
    ],
    sales: overrides.sales ?? [],
  });
}

// ── identifyCustomerByPhone ──────────────────────────────────────────────────

describe('WhatsAppBridge / identifyCustomerByPhone', () => {
  it('tam telefon eşleşir', () => {
    const db = makeTestDB();
    expect(identifyCustomerByPhone(db, '+905551234567')?.id).toBe('c-ali');
  });

  it('son 10 hane eşleşir', () => {
    const db = makeTestDB();
    expect(identifyCustomerByPhone(db, '05551234567')?.id).toBe('c-ali');
  });

  it('format farklı (boşluk/parantez) normalize', () => {
    const db = makeTestDB();
    expect(identifyCustomerByPhone(db, '+90 555 123 45 67')?.id).toBe('c-ali');
    expect(identifyCustomerByPhone(db, '(0532) 123 45 67')?.id).toBe('c-ahmet');
  });

  it('kayıt dışı numara → null', () => {
    const db = makeTestDB();
    expect(identifyCustomerByPhone(db, '05999999999')).toBeNull();
  });

  it('kısa numara (<10 hane) → null', () => {
    const db = makeTestDB();
    expect(identifyCustomerByPhone(db, '12345')).toBeNull();
  });

  it('silinmiş cari eşleşmez', () => {
    const db = makeTestDB({
      cari: [makeCari({ id: 'c-sil', phone: '05551112233', deleted: true })],
    });
    expect(identifyCustomerByPhone(db, '05551112233')).toBeNull();
  });
});

// ── parseWhatsAppIntent ──────────────────────────────────────────────────────

describe('WhatsAppBridge / parseWhatsAppIntent', () => {
  it('greeting: merhaba/selam/günaydın', () => {
    expect(parseWhatsAppIntent('Merhaba').type).toBe('greeting');
    expect(parseWhatsAppIntent('selam').type).toBe('greeting');
    expect(parseWhatsAppIntent('Günaydın').type).toBe('greeting');
  });

  it("price_inquiry: 'soba 80lik fiyatı'", () => {
    const intent = parseWhatsAppIntent('soba 80lik fiyatı ne kadar?');
    expect(intent.type).toBe('price_inquiry');
    expect(intent.productName).toContain('soba');
  });

  it("price_inquiry: '80lik kaç para'", () => {
    const intent = parseWhatsAppIntent('80lik kaç para');
    expect(intent.type).toBe('price_inquiry');
  });

  it("stock_inquiry: 'soba var mı'", () => {
    const intent = parseWhatsAppIntent('soba 80lik var mı?');
    expect(intent.type).toBe('stock_inquiry');
    expect(intent.productName).toContain('soba');
  });

  it("stock_inquiry: 'stoğunuzda var mı'", () => {
    const intent = parseWhatsAppIntent('60lık stoğunuzda var mı');
    expect(intent.type).toBe('stock_inquiry');
  });

  it("balance_inquiry: 'bakiyem ne'", () => {
    expect(parseWhatsAppIntent('bakiyem ne kadar?').type).toBe('balance_inquiry');
    expect(parseWhatsAppIntent('borcum var mı').type).toBe('balance_inquiry');
  });

  it("order_status: 'siparişim nerede'", () => {
    expect(parseWhatsAppIntent('siparişim nerede').type).toBe('order_status');
    expect(parseWhatsAppIntent('kargom ne zaman gelir').type).toBe('order_status');
  });

  it("business_hours: 'saat kaç açık'", () => {
    expect(parseWhatsAppIntent('saat kaçta açıyorsunuz').type).toBe('business_hours');
    expect(parseWhatsAppIntent('açık mısınız').type).toBe('business_hours');
  });

  it("human_request: 'yetkili'", () => {
    expect(parseWhatsAppIntent('yetkili ile görüşmek istiyorum').type).toBe('human_request');
  });

  it('unknown: anlamsız metin', () => {
    const intent = parseWhatsAppIntent('hava bugün çok güzel');
    expect(intent.type).toBe('unknown');
    expect(intent.confidence).toBeLessThan(0.5);
  });

  it('küçük/büyük harf duyarsız', () => {
    expect(parseWhatsAppIntent('MERHABA').type).toBe('greeting');
    expect(parseWhatsAppIntent('SOBA 80LİK FİYATI').type).toBe('price_inquiry');
  });
});

// ── formatWhatsAppReply ──────────────────────────────────────────────────────

describe('WhatsAppBridge / formatWhatsAppReply', () => {
  const db = makeTestDB();
  const customer = makeCari({ id: 'c-ali', name: 'Ali Yılmaz', balance: 1500 });

  it('greeting → nazik karşılama', () => {
    const intent = parseWhatsAppIntent('Merhaba');
    const { reply } = formatWhatsAppReply(intent, db, customer);
    expect(reply).toContain('Ali Yılmaz');
    expect(reply).toMatch(/Günaydın|İyi günler|İyi akşamlar/);
  });

  it('price_inquiry → ürün + fiyat + stok durumu', () => {
    const intent = parseWhatsAppIntent('soba 80lik fiyatı');
    const { reply } = formatWhatsAppReply(intent, db, customer);
    expect(reply).toContain('Soba 80lik');
    expect(reply).toContain('5.000 TL');
  });

  it('price_inquiry → ürün yoksa nazik düzeltme', () => {
    const intent = { type: 'price_inquiry' as const, productName: 'hayali ürün', rawText: '', confidence: 0.8 };
    const { reply } = formatWhatsAppReply(intent, db, customer);
    expect(reply).toContain('bulamadım');
  });

  it('stock_inquiry → stok var', () => {
    const intent = parseWhatsAppIntent('soba 80lik var mı');
    const { reply } = formatWhatsAppReply(intent, db, customer);
    expect(reply).toContain('mevcut');
    expect(reply).toContain('20');
  });

  it('stock_inquiry → stok yok (0 adet)', () => {
    const intent = parseWhatsAppIntent('soba 60lık var mı');
    const { reply } = formatWhatsAppReply(intent, db, customer);
    expect(reply).toContain('yok');
    expect(reply).toMatch(/[Ss]ipariş/);
  });

  it('balance_inquiry → borç var', () => {
    const intent = parseWhatsAppIntent('bakiyem ne kadar');
    const { reply } = formatWhatsAppReply(intent, db, customer);
    expect(reply).toContain('1.500 TL');
    expect(reply).toContain('borcunuz');
  });

  it('balance_inquiry → müşteri yoksa kayıt öner', () => {
    const intent = parseWhatsAppIntent('bakiyem ne');
    const { reply } = formatWhatsAppReply(intent, db, null);
    expect(reply).toContain('kayıtlı telefon');
  });

  it('business_hours → çalışma saatleri', () => {
    const intent = parseWhatsAppIntent('saat kaçta açıksınız');
    const { reply } = formatWhatsAppReply(intent, db, customer);
    expect(reply).toContain('08:00');
    expect(reply).toContain('18:00');
  });

  it('human_request → requiresAction=true', () => {
    const intent = parseWhatsAppIntent('yetkili ile görüşeceğim');
    const { reply, requiresAction } = formatWhatsAppReply(intent, db, customer);
    expect(reply).toContain('yetkiliye');
    expect(requiresAction).toBe(true);
  });

  it('unknown → yardım öner', () => {
    const intent = parseWhatsAppIntent('xyz anlamsız');
    const { reply } = formatWhatsAppReply(intent, db, customer);
    expect(reply).toContain('anlayamadım');
  });
});

// ── processIncomingWhatsApp (tam pipeline) ───────────────────────────────────

describe('WhatsAppBridge / processIncomingWhatsApp', () => {
  it('tam akış: phone → customer → intent → reply', () => {
    const db = makeTestDB();
    const result = processIncomingWhatsApp('soba 80lik fiyatı', '+905551234567', db);
    expect(result.customer?.id).toBe('c-ali');
    expect(result.intent.type).toBe('price_inquiry');
    expect(result.reply).toContain('5.000 TL');
  });

  it('kayıt dışı numara → customer null, yine de cevap', () => {
    const db = makeTestDB();
    const result = processIncomingWhatsApp('merhaba', '05999999999', db);
    expect(result.customer).toBeNull();
    expect(result.reply).toContain('Değerli müşterimiz');
  });

  it('balance sorgu → kayıtlı müşteri borcu', () => {
    const db = makeTestDB();
    const result = processIncomingWhatsApp('borcum ne kadar', '+905551234567', db);
    expect(result.reply).toContain('1.500 TL');
  });

  it('order_status → son sipariş bilgisi', () => {
    const db = makeTestDB({
      sales: [
        makeSale({
          id: 's1',
          cariId: 'c-ali',
          productName: 'Soba 80lik',
          total: 4500,
          createdAt: '2026-06-19T10:00:00.000Z',
        }),
      ],
    });
    const result = processIncomingWhatsApp('siparişim nerede', '+905551234567', db);
    expect(result.reply).toContain('Soba 80lik');
    expect(result.reply).toContain('tamamlandı');
  });

  it('order_status → sipariş yoksa', () => {
    const db = makeTestDB();
    const result = processIncomingWhatsApp('siparişim nerede', '+905551234567', db);
    expect(result.reply).toContain('bulunmuyor');
  });
});

// ── WhatsAppBridge singleton ─────────────────────────────────────────────────

describe('WhatsAppBridge / singleton', () => {
  it('getInstance aynı instance döner', () => {
    expect(WhatsAppBridge.getInstance()).toBe(WhatsAppBridge.getInstance());
  });

  it('incoming → processIncomingWhatsApp ile aynı', () => {
    const db = makeTestDB();
    const bridge = WhatsAppBridge.getInstance();
    const r1 = bridge.incoming('merhaba', '+905551234567', db);
    const r2 = processIncomingWhatsApp('merhaba', '+905551234567', db);
    expect(r1.reply).toBe(r2.reply);
    expect(r1.customer?.id).toBe(r2.customer?.id);
  });
});
