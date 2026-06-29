import { describe, it, expect } from 'vitest';
import { makeDefaultDB } from '@/lib/dbDefaults';
import { completeSale, cancelSale, returnSale, correctSalePrice } from '../saleCompletion';
import type { DB } from '@/types';
import type { SaleIntent } from '@/domain/types';

function makeSaleIntent(overrides: Partial<SaleIntent> = {}): SaleIntent {
  return {
    items: [{ productId: 'urun1', productName: 'Test Ürün', quantity: 2, unitPrice: 100, cost: 60 }],
    payment: 'nakit',
    ...overrides,
  };
}

function makeDBWithProduct(overrides: Partial<DB> = {}): DB {
  const db = makeDefaultDB();
  db.products = [
    {
      id: 'urun1',
      name: 'Test Ürün',
      category: 'soba',
      cost: 60,
      price: 100,
      stock: 10,
      minStock: 2,
      deleted: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];
  db.cari = [
    { id: 'cari1', name: 'Müşteri A', type: 'musteri', balance: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  ];
  return { ...db, ...overrides };
}

describe('completeSale', () => {
  it('başarılı nakit satış yapar', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(makeSaleIntent({ tahsilat: 200 }), prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale).toBeDefined();
    expect(result.data!.dbUpdates.sale!.status).toBe('tamamlandi');
    expect(result.data!.dbUpdates.cashTransaction).toHaveLength(1);
    expect(result.data!.events.some((e) => e.type === 'sale.completed')).toBe(true);
  });

  it('cari satış yapar', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(makeSaleIntent({ payment: 'cari', cariId: 'cari1', tahsilat: 0 }), prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale).toBeDefined();
  });

  it('geçersiz ürün ID için stok 0 kabul edilir ve satış tamamlanır', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(
      makeSaleIntent({
        items: [{ productId: 'olmayan', productName: 'Yok', quantity: 1, unitPrice: 50, cost: 30 }],
      }),
      prevDB,
    );
    expect(result.ok).toBe(true);
  });

  it('yetersiz stok için hata döndürür', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(
      makeSaleIntent({
        items: [{ productId: 'urun1', productName: 'Test Ürün', quantity: 20, unitPrice: 100, cost: 60 }],
      }),
      prevDB,
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Yetersiz stok');
  });

  it('boş ürün listesini reddeder', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(makeSaleIntent({ items: [] }), prevDB);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('En az bir ürün ekleyin');
  });

  it('sıfır tahsilatla nakit satış kasa kaydı oluşturmaz', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(makeSaleIntent({ tahsilat: 0 }), prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.cashTransaction).toBeUndefined();
  });

  it('indirimli satış hesaplaması doğru çalışır', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(makeSaleIntent({ discount: 10, tahsilat: 180 }), prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale!.total).toBe(180);
    expect(result.data!.dbUpdates.sale!.discountAmount).toBe(20);
  });

  it('cari satışta bakiye güncellemesi yapar', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(makeSaleIntent({ payment: 'cari', cariId: 'cari1', tahsilat: 0 }), prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.cari).toBeDefined();
    expect(result.data!.dbUpdates.cari).toHaveLength(1);
    expect(result.data!.dbUpdates.cari![0].cariId).toBe('cari1');
    expect(result.data!.dbUpdates.cari![0].balanceChange).toBe(200);
  });

  it('nakit satışta cari güncellemesi olmaz', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(makeSaleIntent({ payment: 'nakit', tahsilat: 200 }), prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.cari).toBeUndefined();
  });

  it('dueDate hesaplaması doğru çalışır', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(makeSaleIntent({ payment: 'cari', cariId: 'cari1', dueDays: 45, tahsilat: 0 }), prevDB);
    expect(result.ok).toBe(true);
    const sale = result.data!.dbUpdates.sale!;
    expect(sale.dueDate).toBeDefined();
    const dueDate = new Date(sale.dueDate as string);
    expect(dueDate.getTime()).toBeGreaterThan(new Date(sale.createdAt).getTime());
  });

  it('çoklu ürün satışı yapar', () => {
    const prevDB = makeDBWithProduct();
    prevDB.products.push({
      id: 'urun2',
      name: 'Test Ürün 2',
      category: 'aksesuar',
      cost: 30,
      price: 80,
      stock: 20,
      minStock: 5,
      deleted: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });
    const result = completeSale(
      makeSaleIntent({
        items: [
          { productId: 'urun1', productName: 'Test Ürün', quantity: 2, unitPrice: 100, cost: 60 },
          { productId: 'urun2', productName: 'Test Ürün 2', quantity: 3, unitPrice: 80, cost: 30 },
        ],
        tahsilat: 440,
      }),
      prevDB,
    );
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale!.total).toBe(440);
    expect(result.data!.dbUpdates.products).toHaveLength(2);
  });

  it('explicit discountAmount kullanır', () => {
    const prevDB = makeDBWithProduct();
    const result = completeSale(makeSaleIntent({ discountAmount: 50, tahsilat: 150 }), prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale!.discountAmount).toBe(50);
    expect(result.data!.dbUpdates.sale!.total).toBe(150);
  });
});

describe('cancelSale', () => {
  it('başarılı iptal yapar', () => {
    const prevDB = makeDBWithProduct();
    const sale = completeSale(makeSaleIntent(), prevDB);
    expect(sale.ok).toBe(true);
    const saleId = sale.data!.dbUpdates.sale!.id;
    prevDB.sales = [sale.data!.dbUpdates.sale!];

    const result = cancelSale(saleId, prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale!.status).toBe('iptal');
    expect(result.data!.events.some((e) => e.type === 'sale.cancelled')).toBe(true);
  });

  it('olmayan satış için hata döndürür', () => {
    const prevDB = makeDBWithProduct();
    const result = cancelSale('olmayan-id', prevDB);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Satış bulunamadı');
  });

  it('zaten iptal edilmiş satışı tekrar iptal etmez', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test',
        quantity: 1,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 100,
        total: 100,
        profit: 40,
        payment: 'nakit',
        status: 'iptal' as const,
        items: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = cancelSale('s1', prevDB);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('zaten iptal');
  });

  it('cari ödemeli satış iptalinde bakiye düşer', () => {
    const prevDB = makeDBWithProduct();
    const saleResult = completeSale(makeSaleIntent({ payment: 'cari', cariId: 'cari1', tahsilat: 0 }), prevDB);
    expect(saleResult.ok).toBe(true);
    const sale = saleResult.data!.dbUpdates.sale!;
    prevDB.sales = [sale];

    const result = cancelSale(sale.id, prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.cari).toBeDefined();
    expect(result.data!.dbUpdates.cari![0].balanceChange).toBe(-sale.total);
  });

  it('iade edilmiş satış iptal edilemez', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test',
        quantity: 1,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 100,
        total: 100,
        profit: 40,
        payment: 'nakit',
        status: 'iade' as const,
        items: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = cancelSale('s1', prevDB);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('zaten iptal');
  });

  it('iptal stok geri yükler', () => {
    const prevDB = makeDBWithProduct();
    const saleResult = completeSale(makeSaleIntent(), prevDB);
    const sale = saleResult.data!.dbUpdates.sale!;
    prevDB.sales = [sale];

    const result = cancelSale(sale.id, prevDB);
    expect(result.ok).toBe(true);
    const productUpdate = result.data!.dbUpdates.products![0];
    expect(productUpdate.newStock).toBe(prevDB.products[0].stock + 2);
  });
});

describe('returnSale', () => {
  it('başarılı iade yapar', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test Ürün',
        quantity: 2,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 200,
        total: 200,
        profit: 80,
        payment: 'nakit',
        status: 'tamamlandi' as const,
        items: [{ productId: 'urun1', productName: 'Test Ürün', quantity: 2, unitPrice: 100, cost: 60, total: 200 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = returnSale('s1', prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale!.status).toBe('iade');
    expect(result.data!.events.some((e) => e.type === 'sale.returned')).toBe(true);
  });

  it('iptal edilmiş satış iade edilemez', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test',
        quantity: 1,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 100,
        total: 100,
        profit: 40,
        payment: 'nakit',
        status: 'iptal' as const,
        items: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = returnSale('s1', prevDB);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('İptal edilmiş satış iade edilemez');
  });

  it('olmayan satış için hata döndürür', () => {
    const prevDB = makeDBWithProduct();
    const result = returnSale('olmayan-id', prevDB);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Satış bulunamadı');
  });

  it('kısmi iade sadece belirtilen miktar kadar stok döndürür', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test Ürün',
        quantity: 2,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 200,
        total: 200,
        profit: 80,
        payment: 'nakit',
        status: 'tamamlandi' as const,
        items: [{ productId: 'urun1', productName: 'Test Ürün', quantity: 2, unitPrice: 100, cost: 60, total: 200 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = returnSale('s1', prevDB, 1);
    expect(result.ok).toBe(true);
    const productUpdate = result.data!.dbUpdates.products![0];
    expect(productUpdate.newStock).toBe(11);
  });

  it('cari ödemeli satış iadesinde bakiye düşer', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test Ürün',
        quantity: 2,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 200,
        total: 200,
        profit: 80,
        payment: 'cari',
        status: 'tamamlandi' as const,
        items: [{ productId: 'urun1', productName: 'Test Ürün', quantity: 2, unitPrice: 100, cost: 60, total: 200 }],
        cariId: 'cari1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = returnSale('s1', prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.cari).toBeDefined();
    expect(result.data!.dbUpdates.cari![0].balanceChange).toBe(-200);
  });

  it('stok geri yükleme kontrolü', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test Ürün',
        quantity: 2,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 200,
        total: 200,
        profit: 80,
        payment: 'nakit',
        status: 'tamamlandi' as const,
        items: [{ productId: 'urun1', productName: 'Test Ürün', quantity: 2, unitPrice: 100, cost: 60, total: 200 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = returnSale('s1', prevDB);
    expect(result.ok).toBe(true);
    const productUpdate = result.data!.dbUpdates.products![0];
    expect(productUpdate.newStock).toBe(12);
  });
});

describe('correctSalePrice', () => {
  it('başarılı fiyat düzeltme yapar', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test Ürün',
        quantity: 2,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 200,
        total: 200,
        profit: 80,
        payment: 'nakit',
        status: 'tamamlandi' as const,
        items: [{ productId: 'urun1', productName: 'Test Ürün', quantity: 2, unitPrice: 100, cost: 60, total: 200 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = correctSalePrice('s1', 120, prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale!.total).toBe(240);
    expect(result.data!.events.some((e) => e.type === 'sale.price_corrected')).toBe(true);
  });

  it('olmayan satış için hata döndürür', () => {
    const prevDB = makeDBWithProduct();
    const result = correctSalePrice('olmayan-id', 100, prevDB);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Satış bulunamadı');
  });

  it('ürün bazında fiyat düzeltme yapar', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test Ürün',
        quantity: 2,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 200,
        total: 200,
        profit: 80,
        payment: 'nakit',
        status: 'tamamlandi' as const,
        items: [
          { productId: 'urun1', productName: 'Test Ürün', quantity: 1, unitPrice: 100, cost: 60, total: 100 },
          { productId: 'urun2', productName: 'Test Ürün 2', quantity: 1, unitPrice: 100, cost: 60, total: 100 },
        ],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = correctSalePrice('s1', { urun1: 150, urun2: 200 }, prevDB);
    expect(result.ok).toBe(true);
    const updatedItems = result.data!.dbUpdates.sale!.items;
    expect(updatedItems.find((i: { productId: string }) => i.productId === 'urun1')?.unitPrice).toBe(150);
    expect(updatedItems.find((i: { productId: string }) => i.productId === 'urun2')?.unitPrice).toBe(200);
  });

  it('fiyat düzeltme discount korur', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test Ürün',
        quantity: 2,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 20,
        subtotal: 200,
        total: 180,
        profit: 60,
        payment: 'nakit',
        status: 'tamamlandi' as const,
        items: [{ productId: 'urun1', productName: 'Test Ürün', quantity: 2, unitPrice: 100, cost: 60, total: 200 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = correctSalePrice('s1', 120, prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale!.total).toBe(220);
    expect(result.data!.dbUpdates.sale!.discountAmount).toBe(20);
  });

  it('sıfır fiyat düzeltme hatasız çalışır', () => {
    const prevDB = makeDBWithProduct();
    prevDB.sales = [
      {
        id: 's1',
        productName: 'Test Ürün',
        quantity: 2,
        unitPrice: 100,
        cost: 60,
        discount: 0,
        discountAmount: 0,
        subtotal: 200,
        total: 200,
        profit: 80,
        payment: 'nakit',
        status: 'tamamlandi' as const,
        items: [{ productId: 'urun1', productName: 'Test Ürün', quantity: 2, unitPrice: 100, cost: 60, total: 200 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const result = correctSalePrice('s1', 0, prevDB);
    expect(result.ok).toBe(true);
    expect(result.data!.dbUpdates.sale!.total).toBe(0);
  });
});
