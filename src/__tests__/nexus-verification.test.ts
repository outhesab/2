import { describe, it, expect } from 'vitest';
import { nexusRouter } from '@/lib/nexus/NexusRouter';
import { voiceNexusCore } from '@/lib/nexus/VoiceNexusCore';
import type { DB } from '@/types';

// Mock DB for testing
const mockDB: DB = {
  _version: 1,
  products: [{ id: 'p1', name: 'Soba 80lik', stock: 10, price: 5000, deleted: false, minStock: 2 }],
  sales: [],
  suppliers: [],
  orders: [],
  cari: [{ id: 'c1', name: 'Ahmet Yılmaz', balance: 1000, deleted: false, type: 'musteri' }],
  kasa: [{ id: 'k1', amount: 5000, kasa: 'nakit', type: 'gelir', createdAt: new Date().toISOString(), deleted: false, cariId: 'c1' }],
  kasalar: [{ id: 'nakit', name: 'Nakit' }],
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
  company: { id: 'comp1', createdAt: new Date().toISOString() },
  settings: {},
  pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
  ortakEmanetler: [],
  installments: [],
  partners: [],
  productCategories: [],
  notes: [],
  _auditLog: [],
  aiActionLog: [],
};

describe('Soba Nexus AI Verification', () => {
  
  it('should route to FAST path for kasa queries', async () => {
    const result = await nexusRouter.route('kasa ne kadar', mockDB, {});
    expect(result.type).toBe('fast');
    expect(result.response).toContain('Kasa');
  });

  it('should route to ACTION path for specific commands', async () => {
    // "100 TL gider" should be caught by parseVoiceIntent
    const result = await nexusRouter.route('100 TL gider yaz', mockDB, {});
    expect(result.type).toBe('action');
    expect(result.action).toBeDefined();
    expect(result.action?.action).toBe('kasa_gider');
  });

  it('should route to SMART path for complex reasoning', async () => {
    // A complex question that shouldn't match regex or intents
    const result = await nexusRouter.route('Sence önümüzdeki ay satışlar nasıl etkilenir?', mockDB, {});
    expect(result.type).toBe('smart');
  });

  it('should handle DATA path when file context is provided', async () => {
    const result = await nexusRouter.route('Bu dosyadaki hataları bul', mockDB, {
      isFileContext: true,
      currentFiles: [{ name: 'test.xlsx', sheets: [] }]
    });
    expect(result.type).toBe('data');
  });

  it('should maintain VoiceNexusCore as a singleton', () => {
    const instance1 = voiceNexusCore;
    // Since it's exported as a singleton instance, we just check it's defined
    expect(instance1).toBeDefined();
    expect(typeof instance1.speak).toBe('function');
  });

  it('should route to MEMORY path for cross-entity discount transfer', async () => {
    // Ali'ye indirimli satış ekleyelim (mevcut mockDB'deki Ahmet Yılmaz hedef)
    const dbWithMemory: DB = {
      ...mockDB,
      cari: [
        ...mockDB.cari,
        { id: 'c-ali', name: 'Ali Yılmaz', balance: 0, deleted: false, type: 'musteri' },
      ],
      sales: [{
        id: 's1',
        cariId: 'c-ali',
        cariName: 'Ali Yılmaz',
        productName: 'Soba 80lik',
        productCategory: 'soba',
        quantity: 1,
        unitPrice: 5000,
        cost: 4000,
        discount: 10,
        discountAmount: 500,
        subtotal: 5000,
        total: 4500,
        profit: 500,
        payment: 'nakit',
        status: 'tamamlandi',
        items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 1, unitPrice: 5000, cost: 4000, total: 5000 }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as import('@/types').Sale],
    };
    const result = await nexusRouter.route("Ali'nin indirimini Ahmet'e de uygula", dbWithMemory, {});
    expect(result.type).toBe('memory');
    expect(result.memoryProposal).toBeDefined();
    expect(result.memoryProposal?.applicable).toBe(true);
    expect(result.memoryProposal?.toCari?.name).toBe('Ahmet Yılmaz');
  });
});
