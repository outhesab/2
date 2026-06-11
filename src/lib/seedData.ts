/**
 * Test ve geliştirme için örnek veri (seed data).
 * `makeDefaultDB()` üzerine demo içerik ekler.
 */
import { makeDefaultDB } from './dbDefaults';
import type { DB } from '@/types';

let _counter = 1;
function rid(): string {
  return `seed_${String(_counter++).padStart(6, '0')}`;
}

const now = new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

/**
 * Demo verilerle doldurulmuş bir DB örneği oluşturur.
 * Test senaryoları ve geliştirme ortamı için kullanılır.
 */
export function makeSeedDB(): DB {
  const db = makeDefaultDB();

  // ── Ürünler ──
  db.products = [
    { id: rid(), name: 'Döküm Soba', category: 'soba', supplierId: '', brand: 'Pars', cost: 2500, price: 4200, stock: 12, minStock: 3, createdAt: daysAgo(60), updatedAt: now },
    { id: rid(), name: 'Tuğlalı Soba', category: 'soba', supplierId: '', brand: 'Pars', cost: 1800, price: 3100, stock: 5, minStock: 2, createdAt: daysAgo(55), updatedAt: now },
    { id: rid(), name: 'Kuzine Soba', category: 'soba', supplierId: '', brand: 'Pars', cost: 3200, price: 5500, stock: 3, minStock: 2, createdAt: daysAgo(50), updatedAt: now },
    { id: rid(), name: 'Pelet Sobası', category: 'soba', supplierId: '', brand: 'Pars', cost: 4200, price: 7500, stock: 8, minStock: 3, createdAt: daysAgo(45), updatedAt: now },
    { id: rid(), name: 'Boru Dirsek 90°', category: 'boru', supplierId: '', brand: '', cost: 25, price: 50, stock: 200, minStock: 30, createdAt: daysAgo(40), updatedAt: now },
    { id: rid(), name: 'Boru 1m Düz', category: 'boru', supplierId: '', brand: '', cost: 40, price: 85, stock: 85, minStock: 15, createdAt: daysAgo(40), updatedAt: now },
    { id: rid(), name: 'Kül Tepsisi', category: 'yedek_parca', supplierId: '', brand: '', cost: 35, price: 75, stock: 30, minStock: 5, createdAt: daysAgo(35), updatedAt: now },
    { id: rid(), name: 'Cam Fitili', category: 'yedek_parca', supplierId: '', brand: '', cost: 8, price: 20, stock: 0, minStock: 10, createdAt: daysAgo(35), updatedAt: now },
    { id: rid(), name: 'Pelet Yakıt 15kg', category: 'pelet', supplierId: '', brand: '', cost: 75, price: 130, stock: 45, minStock: 10, createdAt: daysAgo(30), updatedAt: now },
  ];

  const products = db.products;

  // ── Cari ──
  db.cari = [
    { id: rid(), name: 'Ahmet Yılmaz', phone: '0532-111-1111', address: 'Ankara', taxNo: '', balance: -1500, lastTransaction: daysAgo(5), type: 'musteri', createdAt: daysAgo(60), updatedAt: now },
    { id: rid(), name: 'Mehmet Demir', phone: '0533-222-2222', address: 'İstanbul', taxNo: '', balance: 3200, lastTransaction: daysAgo(3), type: 'musteri', createdAt: daysAgo(55), updatedAt: now },
    { id: rid(), name: 'Ayşe Kaya', phone: '0535-333-3333', address: 'İzmir', taxNo: '', balance: 0, lastTransaction: daysAgo(10), type: 'musteri', createdAt: daysAgo(50), updatedAt: now },
  ];

  const cariList = db.cari;

  // ── Satışlar ──
  db.sales = [];
  for (let i = 0; i < 5; i++) {
    const product = products[i % products.length];
    const cari = cariList[i % cariList.length];
    const qty = 1 + (i % 3);
    const price = product.price;
    const total = qty * price;
    const profit = qty * (product.price - product.cost);
    db.sales.push({
      id: rid(),
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      cariId: cari.id,
      cariName: cari.name,
      quantity: qty,
      unitPrice: price,
      total,
      cost: product.cost,
      profit,
      discount: 0,
      discountAmount: 0,
      subtotal: total,
      items: [{ productId: product.id, productName: product.name, quantity: qty, unitPrice: price, cost: product.cost, total }],
      payment: i % 2 === 0 ? 'nakit' : 'kart',
      status: 'tamamlandi',
      createdAt: daysAgo(30 - i * 5),
      updatedAt: daysAgo(30 - i * 5),
    });
  }

  // ── Kasa ──
  db.kasa = [
    { id: rid(), type: 'gelir' as const, category: 'satis', amount: 4200, kasa: 'nakit', description: 'Döküm Soba satışı', createdAt: daysAgo(25), updatedAt: daysAgo(25) },
    { id: rid(), type: 'gelir' as const, category: 'satis', amount: 3100, kasa: 'nakit', description: 'Tuğlalı Soba satışı', createdAt: daysAgo(20), updatedAt: daysAgo(20) },
    { id: rid(), type: 'gider' as const, category: 'diger_gider', amount: 450, kasa: 'nakit', description: 'Kargo ücreti', createdAt: daysAgo(15), updatedAt: daysAgo(15) },
    { id: rid(), type: 'gelir' as const, category: 'tahsilat', amount: 1500, kasa: 'banka', description: 'Ahmet Yılmaz tahsilat', cariId: cariList[0].id, createdAt: daysAgo(10), updatedAt: daysAgo(10) },
    { id: rid(), type: 'gider' as const, category: 'diger_gider', amount: 1200, kasa: 'banka', description: 'Elektrik faturası', createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  ];

  // ── Kategoriler ──
  db.productCategories = [
    { id: 'soba', name: 'Sobalar', icon: '🔥', createdAt: now },
    { id: 'boru', name: 'Borular', icon: '🔩', createdAt: now },
    { id: 'yedek_parca', name: 'Yedek Parça', icon: '🔧', createdAt: now },
    { id: 'pelet', name: 'Pelet', icon: '🪵', createdAt: now },
  ];

  return db;
}
