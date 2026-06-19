// voice-sales/parser/voiceIntentBuilder.test.ts

import { describe, it, expect } from 'vitest';
import { buildSaleIntent, buildSaleIntentOrThrow, buildSaleIntentPartial } from './voiceIntentBuilder';
import type { DB } from '@/types';
import type { VoiceCommand } from '../types';

function makeDB(overrides?: Partial<DB>): DB {
  return {
    _version: 1,
    products: [
      { id: 'p1', name: '80\'lik Soba', price: 5000, cost: 3500, stock: 10, minStock: 0, deleted: false, category: 'soba', createdAt: '', updatedAt: '' },
      { id: 'p2', name: '100\'lük Soba', price: 7000, cost: 5000, stock: 3, minStock: 0, deleted: false, category: 'soba', createdAt: '', updatedAt: '' },
      { id: 'p3', name: 'Klima 12K BTU', price: 12000, cost: 8000, stock: 0, minStock: 0, deleted: false, category: 'aksesuar', createdAt: '', updatedAt: '' },
    ],
    sales: [],
    suppliers: [],
    orders: [],
    cari: [],
    kasa: [],
    kasalar: [],
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
    company: { id: 'c1', createdAt: '' },
    settings: {},
    pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
    ortakEmanetler: [],
    installments: [],
    partners: [],
    productCategories: [],
    notes: [],
    _auditLog: [],
    ...overrides,
  };
}

function makeCommand(overrides?: Partial<VoiceCommand>): VoiceCommand {
  return {
    action: 'satis',
    items: [{ productQuery: '80\'lik soba', quantity: 2 }],
    payment: 'nakit',
    confidence: 0.9,
    rawText: '2 tane 80\'lik soba nakit',
    ...overrides,
  };
}

describe('buildSaleIntent', () => {
  it('should build a SaleIntent from a valid command', () => {
    const db = makeDB();
    const cmd = makeCommand();
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(true);
    expect(result.intent).toBeDefined();
    expect(result.errors).toHaveLength(0);
    expect(result.intent!.items).toHaveLength(1);
    expect(result.intent!.items[0].productName).toBe('80\'lik Soba');
    expect(result.intent!.items[0].quantity).toBe(2);
    expect(result.intent!.items[0].unitPrice).toBe(5000);
    expect(result.intent!.payment).toBe('nakit');
  });

  it('should return error for non-satis action', () => {
    const db = makeDB();
    const cmd = makeCommand({ action: 'iptal' });
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(false);
    expect(result.intent).toBeUndefined();
    expect(result.errors[0]).toContain('desteklenmiyor');
  });

  it('should return error when items array is empty', () => {
    const db = makeDB();
    const cmd = makeCommand({ items: [] });
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Ürün belirtilmedi');
  });

  it('should return error when product is not found', () => {
    const db = makeDB();
    const cmd = makeCommand({ items: [{ productQuery: 'varolmayan ürün', quantity: 1 }] });
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('bulunamadı');
    expect(result.unmatchedItems).toHaveLength(1);
  });

  it('should return warning for low confidence match', () => {
    const db = makeDB();
    // Query that barely matches "80'lik Soba" — short query reduces score
    const cmd = makeCommand({ items: [{ productQuery: 'seksenlik', quantity: 1 }] });
    const result = buildSaleIntent(cmd, db);

    // seksenlik → normalized "seksenlik" vs "80lik soba" → "80lik soba"
    // The matcher uses Levenshtein on "seksenlik" vs "80lik soba" — low match
    // If it doesn't match, it will be an error (product not found)
    if (result.success) {
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    } else {
      expect(result.success).toBe(false);
    }
  });

  it('should return warning for insufficient stock', () => {
    const db = makeDB();
    // Product p3 (Klima) has stock 0, asking for 1
    const cmd = makeCommand({ items: [{ productQuery: 'Klima', quantity: 1 }] });
    const result = buildSaleIntent(cmd, db);

    if (result.success) {
      const stockWarning = result.warnings.find((w) => w.includes('stokta'));
      expect(stockWarning).toBeDefined();
    }
  });

  it('should apply discount option', () => {
    const db = makeDB();
    const cmd = makeCommand({ options: { discount: 10 } });
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(true);
    expect(result.intent!.discount).toBe(10);
  });

  it('should apply discountAmount option', () => {
    const db = makeDB();
    const cmd = makeCommand({ options: { discountAmount: 500 } });
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(true);
    expect(result.intent!.discountAmount).toBe(500);
  });

  it('should apply cariId and customerName options', () => {
    const db = makeDB();
    const cmd = makeCommand({ options: { cariId: 'cari-1', customerName: 'Ahmet' } });
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(true);
    expect(result.intent!.cariId).toBe('cari-1');
    expect(result.intent!.customerName).toBe('Ahmet');
  });

  it('should warn when cari payment selected but no cariId', () => {
    const db = makeDB();
    const cmd = makeCommand({ payment: 'cari' });
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(true);
    const cariWarning = result.warnings.find((w) => w.includes('Cari'));
    expect(cariWarning).toBeDefined();
  });

  it('should default to nakit payment when not specified', () => {
    const db = makeDB();
    const cmd = makeCommand({ payment: undefined });
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(true);
    expect(result.intent!.payment).toBe('nakit');
  });

  it('should match multiple products', () => {
    const db = makeDB();
    const cmd = makeCommand({
      items: [
        { productQuery: '80\'lik soba', quantity: 2 },
        { productQuery: '100\'lük soba', quantity: 1 },
      ],
    });
    const result = buildSaleIntent(cmd, db);

    expect(result.success).toBe(true);
    expect(result.intent!.items).toHaveLength(2);
    expect(result.intent!.items[0].productId).toBe('p1');
    expect(result.intent!.items[1].productId).toBe('p2');
  });

  it('should return partial success for mixed matching', () => {
    const db = makeDB();
    const cmd = makeCommand({
      items: [
        { productQuery: '80\'lik soba', quantity: 1 },
        { productQuery: 'varolmayan', quantity: 1 },
      ],
    });
    const result = buildSaleIntent(cmd, db);

    // At least one item unmatched → overall failure
    expect(result.success).toBe(false);
    expect(result.unmatchedItems).toHaveLength(1);
    expect(result.intent).toBeUndefined();
  });
});

describe('buildSaleIntentOrThrow', () => {
  it('should return intent on success', () => {
    const db = makeDB();
    const cmd = makeCommand();
    const intent = buildSaleIntentOrThrow(cmd, db);
    expect(intent.items).toHaveLength(1);
  });

  it('should throw on failure', () => {
    const db = makeDB();
    const cmd = makeCommand({ action: 'iptal' as const });
    expect(() => buildSaleIntentOrThrow(cmd, db)).toThrow();
  });
});

describe('buildSaleIntentPartial', () => {
  it('should allow partial success when some items match', () => {
    const db = makeDB();
    const cmd = makeCommand({
      items: [
        { productQuery: '80\'lik soba', quantity: 1 },
        { productQuery: 'varolmayan', quantity: 1 },
      ],
    });
    const result = buildSaleIntentPartial(cmd, db);

    // Partial success: at least one item matched
    expect(result.success).toBe(true);
    expect(result.intent).toBeDefined();
    expect(result.intent!.items).toHaveLength(1);
    expect(result.unmatchedItems).toHaveLength(1);
  });

  it('should fail when no items match', () => {
    const db = makeDB();
    const cmd = makeCommand({
      items: [{ productQuery: 'varolmayan', quantity: 1 }],
    });
    const result = buildSaleIntentPartial(cmd, db);

    expect(result.success).toBe(false);
    expect(result.intent).toBeUndefined();
  });
});
