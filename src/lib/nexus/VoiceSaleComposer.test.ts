import { describe, it, expect, beforeEach } from 'vitest';
import type { DB, Product, Cari } from '@/types';
import { makeDB } from '@/__tests__/testUtils';
import {
  findProductByName,
  parseComposerCommand,
  applyCommandToDraft,
  draftToSaleIntent,
  summarizeDraft,
  VoiceSaleComposer,
  type ComposerDraft,
} from './VoiceSaleComposer';

// ── Test DB ──────────────────────────────────────────────────────────────────

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

function makeCariEntry(c: Partial<Cari> & { id: string }): Cari {
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

function makeTestDB(overrides: { products?: Product[]; cari?: Cari[] } = {}): DB {
  return makeDB({
    products: overrides.products ?? [
      makeProduct({ id: 'p1', name: 'Soba 80lik', price: 5000, cost: 4000, stock: 20 }),
      makeProduct({ id: 'p2', name: 'Soba 60lık', price: 3000, cost: 2400, stock: 15 }),
      makeProduct({ id: 'p3', name: 'Boru 10cm', price: 250, cost: 150, stock: 100 }),
    ],
    cari: overrides.cari ?? [
      makeCariEntry({ id: 'c-ali', name: 'Ali Yılmaz' }),
      makeCariEntry({ id: 'c-ahmet', name: 'Ahmet Bey', balance: 500 }),
    ],
  });
}

const emptyDraft: ComposerDraft = { items: [] };

// ── findProductByName ────────────────────────────────────────────────────────

describe('VoiceSaleComposer / findProductByName', () => {
  it('tam isim eşleşir', () => {
    const db = makeTestDB();
    expect(findProductByName(db, 'Soba 80lik')?.id).toBe('p1');
  });

  it('küçük harf eşleşir', () => {
    const db = makeTestDB();
    expect(findProductByName(db, 'soba 80lik')?.id).toBe('p1');
  });

  it('kısmi isim eşleşir (80lik)', () => {
    const db = makeTestDB();
    expect(findProductByName(db, '80lik')?.id).toBe('p1');
  });

  it('ters yön eşleşir (soba 80lik kırmızı → Soba 80lik)', () => {
    const db = makeTestDB();
    expect(findProductByName(db, 'soba 80lik kırmızı')?.id).toBe('p1');
  });

  it('bulunamayınca null', () => {
    const db = makeTestDB();
    expect(findProductByName(db, 'Hayali Ürün')).toBeNull();
  });

  it('silinmiş ürün eşleşmez', () => {
    const db = makeTestDB({
      products: [makeProduct({ id: 'p9', name: 'Silinmiş', deleted: true })],
    });
    expect(findProductByName(db, 'Silinmiş')).toBeNull();
  });

  it('boş string null', () => {
    const db = makeTestDB();
    expect(findProductByName(db, '')).toBeNull();
  });
});

// ── parseComposerCommand ─────────────────────────────────────────────────────

describe('VoiceSaleComposer / parseComposerCommand', () => {
  const db = makeTestDB();

  it("add_item: '2 tane 80lik ekle'", () => {
    const cmd = parseComposerCommand('2 tane 80lik ekle', db);
    expect(cmd.kind).toBe('add_item');
    expect(cmd.data?.productId).toBe('p1');
    expect(cmd.data?.quantity).toBe(2);
    expect(cmd.data?.unitPrice).toBe(5000);
  });

  it("add_item: adet olmadan '80lik ekle' → 1 adet", () => {
    const cmd = parseComposerCommand('80lik ekle', db);
    expect(cmd.kind).toBe('add_item');
    expect(cmd.data?.quantity).toBe(1);
    expect(cmd.data?.productName).toBe('Soba 80lik');
  });

  it("add_item: '1 tane soba 60lık ekle'", () => {
    const cmd = parseComposerCommand('1 tane soba 60lık ekle', db);
    expect(cmd.kind).toBe('add_item');
    expect(cmd.data?.productId).toBe('p2');
  });

  it('add_item: ürün yoksa unknown', () => {
    const cmd = parseComposerCommand('2 tane hayali ürün ekle', db);
    expect(cmd.kind).toBe('unknown');
  });

  it("set_cari: 'ali'ye sat'", () => {
    const cmd = parseComposerCommand("ali'ye sat", db);
    expect(cmd.kind).toBe('set_cari');
    expect(cmd.data?.cariId).toBe('c-ali');
    expect(cmd.data?.cariName).toBe('Ali Yılmaz');
  });

  it("set_cari: 'ahmet beye'", () => {
    const cmd = parseComposerCommand('ahmet beye', db);
    expect(cmd.kind).toBe('set_cari');
    expect(cmd.data?.cariId).toBe('c-ahmet');
  });

  it("set_discount: 'yüzde 10 indirim'", () => {
    const cmd = parseComposerCommand('yüzde 10 indirim', db);
    expect(cmd.kind).toBe('set_discount');
    expect(cmd.data?.discount).toBe(10);
  });

  it("set_discount: '%15 iskonto'", () => {
    const cmd = parseComposerCommand('%15 iskonto', db);
    expect(cmd.kind).toBe('set_discount');
    expect(cmd.data?.discount).toBe(15);
  });

  it("set_discount_amount: '500 lira indirim'", () => {
    const cmd = parseComposerCommand('500 lira indirim', db);
    expect(cmd.kind).toBe('set_discount_amount');
    expect(cmd.data?.discountAmount).toBe(500);
  });

  it("set_payment: 'kartla'", () => {
    const cmd = parseComposerCommand('kartla', db);
    expect(cmd.kind).toBe('set_payment');
    expect(cmd.data?.payment).toBe('kart');
  });

  it("set_payment: 'veresiye'", () => {
    const cmd = parseComposerCommand('veresiye', db);
    expect(cmd.kind).toBe('set_payment');
    expect(cmd.data?.payment).toBe('cari');
  });

  it("finalize: 'sat'", () => {
    expect(parseComposerCommand('sat', db).kind).toBe('finalize');
    expect(parseComposerCommand('tamamla', db).kind).toBe('finalize');
    expect(parseComposerCommand('satışı tamamla', db).kind).toBe('finalize');
  });

  it("cancel: 'iptal' / 'vazgeç'", () => {
    expect(parseComposerCommand('iptal', db).kind).toBe('cancel');
    expect(parseComposerCommand('vazgeç', db).kind).toBe('cancel');
  });

  it("status: 'durum' / 'ne var'", () => {
    expect(parseComposerCommand('durum', db).kind).toBe('status');
    expect(parseComposerCommand('ne var', db).kind).toBe('status');
  });

  it("remove_item: '80liği çıkar'", () => {
    const cmd = parseComposerCommand('80liği çıkar', db);
    expect(cmd.kind).toBe('remove_item');
    // "80liği" → "80lik" (liği eki normalize edilir)
    expect(cmd.data?.productName).toBe('80lik');
  });

  it("set_qty: '80liği 3 tane yap'", () => {
    const cmd = parseComposerCommand('80liği 3 tane yap', db);
    expect(cmd.kind).toBe('set_qty');
    expect(cmd.data?.quantity).toBe(3);
  });

  it("set_unit_price: '80lik 4500 lira olsun'", () => {
    const cmd = parseComposerCommand('80lik 4500 lira olsun', db);
    expect(cmd.kind).toBe('set_unit_price');
    expect(cmd.data?.unitPrice).toBe(4500);
  });

  it('unknown: anlamsız metin', () => {
    const cmd = parseComposerCommand('hava bugün güzel', db);
    expect(cmd.kind).toBe('unknown');
  });

  it("cancel, 'cari ekle' ile karışmaz (ekle önce)", () => {
    // 'cari ekle' add_item değil unknown ama cancel da değil
    const cmd = parseComposerCommand('cari ekle', db);
    expect(cmd.kind).not.toBe('cancel');
  });
});

// ── applyCommandToDraft ──────────────────────────────────────────────────────

describe('VoiceSaleComposer / applyCommandToDraft', () => {
  const db = makeTestDB();

  it('add_item yeni ürün ekler', () => {
    const cmd = parseComposerCommand('2 tane 80lik ekle', db);
    const result = applyCommandToDraft(emptyDraft, cmd, db);
    expect(result.draft.items).toHaveLength(1);
    expect(result.draft.items[0].quantity).toBe(2);
    expect(result.draft.items[0].productId).toBe('p1');
  });

  it('add_item aynı ürün varsa miktarı artırır', () => {
    const draft: ComposerDraft = {
      items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 1, unitPrice: 5000, cost: 4000 }],
    };
    const cmd = parseComposerCommand('2 tane 80lik ekle', db);
    const result = applyCommandToDraft(draft, cmd, db);
    expect(result.draft.items).toHaveLength(1);
    expect(result.draft.items[0].quantity).toBe(3);
  });

  it("set_cari draft'ı günceller", () => {
    const cmd = parseComposerCommand("ali'ye sat", db);
    const result = applyCommandToDraft(emptyDraft, cmd, db);
    expect(result.draft.cariId).toBe('c-ali');
    expect(result.draft.cariName).toBe('Ali Yılmaz');
  });

  it('remove_item ürün çıkarır', () => {
    const draft: ComposerDraft = {
      items: [
        { productId: 'p1', productName: 'Soba 80lik', quantity: 2, unitPrice: 5000, cost: 4000 },
        { productId: 'p2', productName: 'Soba 60lık', quantity: 1, unitPrice: 3000, cost: 2400 },
      ],
    };
    const cmd = parseComposerCommand('80liği çıkar', db);
    const result = applyCommandToDraft(draft, cmd, db);
    expect(result.draft.items).toHaveLength(1);
    expect(result.draft.items[0].productName).toBe('Soba 60lık');
  });

  it('remove_item olmayan ürün hata döner', () => {
    const draft: ComposerDraft = {
      items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 1, unitPrice: 5000, cost: 4000 }],
    };
    const cmd = parseComposerCommand('boru çıkar', db);
    const result = applyCommandToDraft(draft, cmd, db);
    expect(result.error).toBeDefined();
    expect(result.draft.items).toHaveLength(1); // değişmedi
  });

  it('set_qty adet günceller', () => {
    const draft: ComposerDraft = {
      items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 2, unitPrice: 5000, cost: 4000 }],
    };
    const cmd = parseComposerCommand('80liği 5 tane yap', db);
    const result = applyCommandToDraft(draft, cmd, db);
    expect(result.draft.items[0].quantity).toBe(5);
  });

  it("set_discount yüzde atar, discountAmount'ı temizler", () => {
    const draft: ComposerDraft = { items: [], discountAmount: 500 };
    const cmd = parseComposerCommand('yüzde 10 indirim', db);
    const result = applyCommandToDraft(draft, cmd, db);
    expect(result.draft.discount).toBe(10);
    expect(result.draft.discountAmount).toBeUndefined();
  });
});

// ── draftToSaleIntent ────────────────────────────────────────────────────────

describe('VoiceSaleComposer / draftToSaleIntent', () => {
  it('geçerli draft → SaleIntent', () => {
    const draft: ComposerDraft = {
      items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 2, unitPrice: 5000, cost: 4000 }],
      cariId: 'c-ali',
      cariName: 'Ali Yılmaz',
      discount: 10,
      payment: 'nakit',
    };
    const result = draftToSaleIntent(draft);
    expect(result.ok).toBe(true);
    expect(result.intent?.items).toHaveLength(1);
    expect(result.intent?.cariId).toBe('c-ali');
    expect(result.intent?.discount).toBe(10);
    expect(result.intent?.payment).toBe('nakit');
  });

  it('boş draft hata döner', () => {
    const result = draftToSaleIntent(emptyDraft);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('ürün yok');
  });

  it('payment yoksa default nakit', () => {
    const draft: ComposerDraft = {
      items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 1, unitPrice: 5000, cost: 4000 }],
    };
    const result = draftToSaleIntent(draft);
    expect(result.intent?.payment).toBe('nakit');
  });

  it('geçersiz quantity hata döner', () => {
    const draft: ComposerDraft = {
      items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 0, unitPrice: 5000, cost: 4000 }],
    };
    const result = draftToSaleIntent(draft);
    expect(result.ok).toBe(false);
  });
});

// ── summarizeDraft ───────────────────────────────────────────────────────────

describe('VoiceSaleComposer / summarizeDraft', () => {
  it('boş draft mesajı', () => {
    const s = summarizeDraft(emptyDraft);
    expect(s).toContain('boş');
  });

  it('dolu draft özeti: ürün + cari + indirim + toplam', () => {
    const draft: ComposerDraft = {
      items: [
        { productId: 'p1', productName: 'Soba 80lik', quantity: 2, unitPrice: 5000, cost: 4000 },
        { productId: 'p2', productName: 'Soba 60lık', quantity: 1, unitPrice: 3000, cost: 2400 },
      ],
      cariName: 'Ali Yılmaz',
      discount: 10,
      payment: 'nakit',
    };
    const s = summarizeDraft(draft);
    expect(s).toContain('2 ürün');
    expect(s).toContain('Soba 80lik');
    expect(s).toContain('Ali Yılmaz');
    expect(s).toContain('Yüzde 10');
    // (10000 + 3000) * 0.9 = 11700
    expect(s).toContain('11.700 TL');
  });

  it('toplam hesabı doğru (yüzde indirim)', () => {
    const draft: ComposerDraft = {
      items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 1, unitPrice: 5000, cost: 4000 }],
      discount: 10,
    };
    const s = summarizeDraft(draft);
    // 5000 * 0.9 = 4500
    expect(s).toContain('4.500 TL');
  });

  it('toplam hesabı doğru (sabit tutar indirim)', () => {
    const draft: ComposerDraft = {
      items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 1, unitPrice: 5000, cost: 4000 }],
      discountAmount: 500,
    };
    const s = summarizeDraft(draft);
    // 5000 - 500 = 4500
    expect(s).toContain('4.500 TL');
  });
});

// ── VoiceSaleComposer state machine ──────────────────────────────────────────

describe('VoiceSaleComposer / state machine', () => {
  let composer: VoiceSaleComposer;

  beforeEach(() => {
    composer = VoiceSaleComposer.getInstance();
    composer.reset();
  });

  it('initial state boş draft', () => {
    expect(composer.isEmpty()).toBe(true);
    expect(composer.getDraft().items).toHaveLength(0);
  });

  it('çok adımlı satış akışı: ekle → cari → indirim → finalize', () => {
    const db = makeTestDB();

    const r1 = composer.process('2 tane 80lik ekle', db);
    expect(r1.ack).toContain('eklendi');
    expect(composer.getDraft().items).toHaveLength(1);

    const r2 = composer.process("ali'ye sat", db);
    expect(r2.ack).toContain('Ali Yılmaz');
    expect(composer.getDraft().cariId).toBe('c-ali');

    const r3 = composer.process('yüzde 10 indirim', db);
    expect(r3.ack).toContain('10');
    expect(composer.getDraft().discount).toBe(10);

    const r4 = composer.process('sat', db);
    expect(r4.finalizedIntent).toBeDefined();
    expect(r4.finalizedIntent?.items[0].quantity).toBe(2);
    expect(r4.finalizedIntent?.cariId).toBe('c-ali');
    expect(r4.finalizedIntent?.discount).toBe(10);
  });

  it("cancel draft'ı sıfırlar", () => {
    const db = makeTestDB();
    composer.process('2 tane 80lik ekle', db);
    expect(composer.isEmpty()).toBe(false);

    const r = composer.process('iptal', db);
    expect(r.cancelled).toBe(true);
    expect(composer.isEmpty()).toBe(true);
  });

  it('status özet döner, draft değişmez', () => {
    const db = makeTestDB();
    composer.process('1 tane 80lik ekle', db);
    const before = composer.getDraft();

    const r = composer.process('durum', db);
    expect(r.summary).toBeDefined();
    expect(r.summary).toContain('Soba 80lik');
    expect(composer.getDraft()).toEqual(before);
  });

  it('finalize boş sepette hata döner', () => {
    const db = makeTestDB();
    const r = composer.process('sat', db);
    expect(r.finalizedIntent).toBeUndefined();
    expect(r.error).toContain('ürün yok');
  });

  it('unknown komut ack döner, draft değişmez', () => {
    const db = makeTestDB();
    composer.process('1 tane 80lik ekle', db);
    const before = composer.getDraft();

    const r = composer.process('hava güzel', db);
    expect(r.ack).toContain('anlamadım');
    expect(composer.getDraft()).toEqual(before);
  });

  it('ikinci ürün ekleme sonrası iki item', () => {
    const db = makeTestDB();
    composer.process('2 tane 80lik ekle', db);
    composer.process('1 tane soba 60lık ekle', db);
    expect(composer.getDraft().items).toHaveLength(2);
  });

  it('aynı ürünü tekrar ekleme miktarı artırır', () => {
    const db = makeTestDB();
    composer.process('1 tane 80lik ekle', db);
    composer.process('2 tane 80lik ekle', db);
    expect(composer.getDraft().items).toHaveLength(1);
    expect(composer.getDraft().items[0].quantity).toBe(3);
  });

  it("remove_item composer'dan çıkarır", () => {
    const db = makeTestDB();
    composer.process('1 tane 80lik ekle', db);
    composer.process('1 tane soba 60lık ekle', db);
    composer.process('80liği çıkar', db);
    expect(composer.getDraft().items).toHaveLength(1);
    expect(composer.getDraft().items[0].productName).toBe('Soba 60lık');
  });

  it("reset draft'ı temizler", () => {
    const db = makeTestDB();
    composer.process('1 tane 80lik ekle', db);
    composer.reset();
    expect(composer.isEmpty()).toBe(true);
  });
});
