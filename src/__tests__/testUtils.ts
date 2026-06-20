/**
 * testUtils.ts — Paylaşılan Test Yardımcıları
 *
 * Aynı makeDB() fonksiyonunun 10+ test dosyasında tekrarlanmasını önlemek için
 * merkezi bir yardımcı. Tüm alanları Partial<DB> ile geçersiz kılmaya izin verir.
 *
 * Kullanım:
 *   import { makeDB } from '@/__tests__/testUtils';
 *   const db = makeDB({ products: [testProduct] });
 */

import type { DB } from '@/types';

/**
 * Varsayılan bir DB nesnesi oluşturur.
 * @param overrides - Geçersiz kılınacak alanlar (isteğe bağlı)
 * @returns Tam bir DB nesnesi
 */
export function makeDB(overrides: Partial<DB> = {}): DB {
  const now = new Date().toISOString();
  return {
    _version: 1,
    products: [],
    sales: [],
    suppliers: [],
    orders: [],
    cari: [],
    kasa: [],
    kasalar: [{ id: 'nakit', name: 'Nakit', icon: '💵' }],
    bankTransactions: [],
    matchRules: [],
    monitorRules: [],
    monitorLog: [],
    stockMovements: [],
    peletSuppliers: [],
    peletOrders: [],
    boruSuppliers: [],
    boruOrders: [],
    invoices: [],
    budgets: [],
    returns: [],
    _activityLog: [],
    _auditLog: [],
    company: { id: 'c1', createdAt: now },
    settings: {},
    pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
    ortakEmanetler: [],
    installments: [],
    partners: [],
    productCategories: [],
    notes: [],
    ...overrides,
  };
}
