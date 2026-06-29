import { describe, it, expect } from 'vitest';
import type { DB, Sale } from '@/types';
import { makeDB } from '@/__tests__/testUtils';
import {
  findCariByName,
  recallDiscountHistory,
  extractDiscountPattern,
  proposeDiscountTransfer,
  applyDiscountProposalToPayload,
} from './DiscountMemoryModule';

// ── Test DB yardımcıları ─────────────────────────────────────────────────────

function makeSale(partial: Partial<Sale> & { id: string; cariId: string; createdAt: string }): Sale {
  return {
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
    ...partial,
  } as Sale;
}

function makeTestDB(sales: Sale[], cariExtra: DB['cari'] = []): DB {
  return makeDB({
    products: [
      {
        id: 'p1',
        name: 'Soba 80lik',
        stock: 100,
        price: 5000,
        cost: 4000,
        category: 'soba',
        minStock: 2,
        deleted: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    sales,
    cari: [
      {
        id: 'c-ali',
        name: 'Ali Yılmaz',
        balance: 0,
        deleted: false,
        type: 'musteri',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c-ahmet',
        name: 'Ahmet Bey',
        balance: 0,
        deleted: false,
        type: 'musteri',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c-mehmet',
        name: 'Mehmet Demir',
        balance: 0,
        deleted: false,
        type: 'musteri',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      ...cariExtra,
    ],
  });
}

// ── findCariByName ───────────────────────────────────────────────────────────

describe('DiscountMemoryModule / findCariByName', () => {
  it('tam isim eşleşir', () => {
    const db = makeTestDB([]);
    expect(findCariByName(db, 'Ali Yılmaz')?.id).toBe('c-ali');
  });

  it('küçük harf ve hitap normalize edilir (bey düşer)', () => {
    const db = makeTestDB([]);
    expect(findCariByName(db, 'ahmet bey')?.id).toBe('c-ahmet');
    expect(findCariByName(db, 'AHMET')?.id).toBe('c-ahmet');
  });

  it('kısmi isim eşleşir (sadece ad)', () => {
    const db = makeTestDB([]);
    expect(findCariByName(db, 'Ali')?.id).toBe('c-ali');
  });

  it('bulunamayınca null döner', () => {
    const db = makeTestDB([]);
    expect(findCariByName(db, 'Hayali Kisi')).toBeNull();
  });

  it('boş string null döner', () => {
    const db = makeTestDB([]);
    expect(findCariByName(db, '')).toBeNull();
    expect(findCariByName(db, '   ')).toBeNull();
  });

  it('silinmiş cari eşleşmez', () => {
    const db = makeTestDB(
      [],
      [
        {
          id: 'c-sil',
          name: 'Silinmiş Kişi',
          balance: 0,
          deleted: true,
          type: 'musteri',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    );
    expect(findCariByName(db, 'Silinmiş Kişi')).toBeNull();
  });
});

// ── recallDiscountHistory ────────────────────────────────────────────────────

describe('DiscountMemoryModule / recallDiscountHistory', () => {
  it('indirimli satışları son tarihten eskiye sıralar', () => {
    const db = makeTestDB([
      makeSale({ id: 's1', cariId: 'c-ali', createdAt: '2026-06-01', discount: 5, discountAmount: 250, total: 4750 }),
      makeSale({ id: 's2', cariId: 'c-ali', createdAt: '2026-06-19', discount: 10, discountAmount: 500, total: 4500 }),
    ]);
    const recall = recallDiscountHistory(db, 'c-ali');
    expect(recall).not.toBeNull();
    expect(recall?.frequency).toBe(2);
    expect(recall?.salesWithDiscount[0].saleId).toBe('s2');
    expect(recall?.latestDiscount?.percent).toBe(10);
  });

  it('isim ile sorgulanabilir', () => {
    const db = makeTestDB([
      makeSale({ id: 's1', cariId: 'c-ali', createdAt: '2026-06-19', discount: 10, discountAmount: 500, total: 4500 }),
    ]);
    const recall = recallDiscountHistory(db, 'Ali Yılmaz');
    expect(recall).not.toBeNull();
    expect(recall?.cariId).toBe('c-ali');
  });

  it('indirimsiz satışlar hariç tutulur', () => {
    const db = makeTestDB([
      makeSale({ id: 's1', cariId: 'c-ali', createdAt: '2026-06-19', discount: 0, discountAmount: 0 }),
      makeSale({ id: 's2', cariId: 'c-ali', createdAt: '2026-06-20', discount: 10, discountAmount: 500, total: 4500 }),
    ]);
    const recall = recallDiscountHistory(db, 'c-ali');
    expect(recall?.frequency).toBe(1);
    expect(recall?.salesWithDiscount[0].saleId).toBe('s2');
  });

  it('iptal/iade edilen satışlar dahil edilmez', () => {
    const db = makeTestDB([
      makeSale({
        id: 's1',
        cariId: 'c-ali',
        createdAt: '2026-06-19',
        discount: 10,
        discountAmount: 500,
        status: 'iptal',
      }),
    ]);
    const recall = recallDiscountHistory(db, 'c-ali');
    expect(recall?.hasMemory).toBe(false);
    expect(recall?.frequency).toBe(0);
  });

  it('ortalama yüzde doğru hesaplanır', () => {
    const db = makeTestDB([
      makeSale({ id: 's1', cariId: 'c-ali', createdAt: '2026-06-01', discount: 5, discountAmount: 250, total: 4750 }),
      makeSale({ id: 's2', cariId: 'c-ali', createdAt: '2026-06-19', discount: 15, discountAmount: 750, total: 4250 }),
    ]);
    const recall = recallDiscountHistory(db, 'c-ali');
    expect(recall?.averagePercent).toBe(10);
  });

  it('geçmişi olmayan cari için hasMemory=false', () => {
    const db = makeTestDB([]);
    const recall = recallDiscountHistory(db, 'c-mehmet');
    expect(recall?.hasMemory).toBe(false);
    expect(recall?.latestDiscount).toBeNull();
  });

  it('var olmayan cari için null döner', () => {
    const db = makeTestDB([]);
    expect(recallDiscountHistory(db, 'Hayali Kisi')).toBeNull();
  });
});

// ── extractDiscountPattern ───────────────────────────────────────────────────

describe('DiscountMemoryModule / extractDiscountPattern', () => {
  it('son indirim öncelikli (basis: latest)', () => {
    const db = makeTestDB([
      makeSale({ id: 's1', cariId: 'c-ali', createdAt: '2026-06-01', discount: 5, discountAmount: 250, total: 4750 }),
      makeSale({ id: 's2', cariId: 'c-ali', createdAt: '2026-06-19', discount: 10, discountAmount: 500, total: 4500 }),
    ]);
    const recall = recallDiscountHistory(db, 'c-ali');
    const pattern = extractDiscountPattern(recall!);
    expect(pattern?.percent).toBe(10);
    expect(pattern?.basis).toBe('latest');
  });

  it('son indirim %0 ise ortalama döner (basis: average)', () => {
    const db = makeTestDB([
      makeSale({ id: 's1', cariId: 'c-ali', createdAt: '2026-06-01', discount: 10, discountAmount: 500, total: 4500 }),
      makeSale({ id: 's2', cariId: 'c-ali', createdAt: '2026-06-19', discount: 0, discountAmount: 0, total: 5000 }),
    ]);
    // s2'nin discount'u 0 olduğu için recall'a girmez → sadece s1 kalır
    const recall = recallDiscountHistory(db, 'c-ali');
    const pattern = extractDiscountPattern(recall!);
    expect(pattern?.percent).toBe(10);
  });

  it('hafıza yoksa null döner', () => {
    const db = makeTestDB([]);
    const recall = recallDiscountHistory(db, 'c-ali');
    expect(extractDiscountPattern(recall!)).toBeNull();
  });
});

// ── proposeDiscountTransfer — ANA SENERARYO ──────────────────────────────────

describe('DiscountMemoryModule / proposeDiscountTransfer (Ali → Ahmet)', () => {
  function makeScenarioDB(): DB {
    return makeTestDB([
      // Ali'ye uygulanan indirimli satış (geçmiş)
      makeSale({
        id: 's-ali-1',
        cariId: 'c-ali',
        createdAt: '2026-06-18',
        productName: 'Soba 80lik',
        discount: 10,
        discountAmount: 500,
        subtotal: 5000,
        total: 4500,
      }),
    ]);
  }

  it("Ali'nin indirimini Ahmet'e transfer önerir", () => {
    const db = makeScenarioDB();
    const proposal = proposeDiscountTransfer(db, 'Ali', 'Ahmet');

    expect(proposal.ok).toBe(true);
    expect(proposal.applicable).toBe(true);
    expect(proposal.fromCari?.id).toBe('c-ali');
    expect(proposal.toCari?.id).toBe('c-ahmet');
    expect(proposal.recommendedDiscount?.percent).toBe(10);
    expect(proposal.sourceSale?.productName).toBe('Soba 80lik');
    expect(proposal.reasoning).toContain('Ali Yılmaz');
    expect(proposal.reasoning).toContain('Ahmet Bey');
  });

  it('kaynak cari yoksa ok=false', () => {
    const db = makeScenarioDB();
    const proposal = proposeDiscountTransfer(db, 'Hayali Kisi', 'Ahmet');
    expect(proposal.ok).toBe(false);
    expect(proposal.applicable).toBe(false);
    expect(proposal.error).toContain('Hayali Kisi');
  });

  it('hedef cari yoksa ok=false', () => {
    const db = makeScenarioDB();
    const proposal = proposeDiscountTransfer(db, 'Ali', 'Hayali Kisi');
    expect(proposal.ok).toBe(false);
    expect(proposal.toCari).toBeNull();
  });

  it('kaynak ve hedef aynıysa ok=false', () => {
    const db = makeScenarioDB();
    const proposal = proposeDiscountTransfer(db, 'Ali', 'Ali Yılmaz');
    expect(proposal.ok).toBe(false);
    expect(proposal.error).toContain('aynı');
  });

  it('kaynak carinin indirim geçmişi yoksa ok=false', () => {
    const db = makeTestDB([]); // hiç satış yok
    const proposal = proposeDiscountTransfer(db, 'Mehmet', 'Ahmet');
    expect(proposal.ok).toBe(false);
    expect(proposal.reasoning).toContain('indirim uygulanmamış');
  });

  it('reasoning açıklaması kullanıcıya okunabilir formatta', () => {
    const db = makeScenarioDB();
    const proposal = proposeDiscountTransfer(db, 'Ali', 'Ahmet');
    expect(proposal.reasoning).toMatch(/\d+ adet indirimli satış/);
    expect(proposal.reasoning).toContain('Kaynak satış');
    expect(proposal.reasoning).toContain('%10');
  });
});

// ── applyDiscountProposalToPayload ───────────────────────────────────────────

describe('DiscountMemoryModule / applyDiscountProposalToPayload', () => {
  it("geçerli öneriyi payload'a yazar (cariId + discount)", () => {
    const db = makeTestDB([
      makeSale({
        id: 's-ali-1',
        cariId: 'c-ali',
        createdAt: '2026-06-18',
        discount: 10,
        discountAmount: 500,
        total: 4500,
      }),
    ]);
    const proposal = proposeDiscountTransfer(db, 'Ali', 'Ahmet');
    const result = applyDiscountProposalToPayload(proposal, { items: [], payment: 'nakit' });

    expect(result.cariId).toBe('c-ahmet');
    expect(result.cariName).toBe('Ahmet Bey');
    expect(result.discount).toBe(10);
    // Yüzde transferinde discountAmount ayarlanmaz — completeSale yeni alt toplamdan hesaplar
    expect(result.discountAmount).toBeUndefined();
    expect(result.items).toEqual([]);
    expect(result.payment).toBe('nakit');
  });

  it('geçersiz öneride payload dokunulmamış döner', () => {
    const db = makeTestDB([]);
    const proposal = proposeDiscountTransfer(db, 'Ali', 'Ahmet'); // Ali'de geçmiş yok
    const original = { items: [], payment: 'nakit' as const, discount: 5 };
    const result = applyDiscountProposalToPayload(proposal, original);

    expect(result.discount).toBe(5); // orijinal korunur
    expect(result.cariId).toBeUndefined();
  });
});
