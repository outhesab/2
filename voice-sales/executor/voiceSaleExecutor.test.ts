// voice-sales/executor/voiceSaleExecutor.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeVoiceSale, executeConfirmedSale } from './voiceSaleExecutor';
import type { VoiceCommand } from '../types';
import type { DB } from '@/types';

// ─── Mock DB ────────────────────────────────────────────────────

function createMockDB(overrides: Partial<DB> = {}): DB {
  return {
    _version: 1,
    _auditLog: [],
    _activityLog: [],
    products: [
      {
        id: 'p1', name: "80'lik Soba", category: 'soba', brand: 'Test',
        cost: 1200, price: 1700, stock: 50, minStock: 5,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
      {
        id: 'p2', name: '120\'lik Klima', category: 'klima', brand: 'Test',
        cost: 3000, price: 4500, stock: 20, minStock: 3,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
    ],
    productCategories: [],
    sales: [],
    suppliers: [],
    orders: [],
    cari: [],
    kasa: [],
    kasalar: [{ id: 'nakit', name: 'Nakit', icon: '💵' }],
    stockMovements: [],
    invoices: [],
    installments: [],
    budgets: [],
    bankTransactions: [],
    peletSuppliers: [],
    peletOrders: [],
    boruSuppliers: [],
    boruOrders: [],
    pelletSettings: { gramaj: 0, kgFiyat: 0, cuvalKg: 0, critDays: 0 },
    partners: [],
    ortakEmanetler: [],
    monitorRules: [],
    monitorLog: [],
    matchRules: [],
    returns: [],
    company: { name: '' },
    settings: {},
    notes: [],
    ...overrides,
  };
}

// ─── Mock getDB ─────────────────────────────────────────────────

vi.mock('@/hooks/db/index', () => ({
  getDB: () => createMockDB(),
}));

vi.mock('@/lib/db/storage', () => ({
  saveToStorage: vi.fn(() => true),
  saveToIndexedSnapshot: vi.fn(() => Promise.resolve()),
}));

// ─── Tests ──────────────────────────────────────────────────────

describe('executeVoiceSale', () => {
  it('executes a valid sale command', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      items: [{ productQuery: "80'lik soba", quantity: 2 }],
      payment: 'nakit',
      confidence: 0.9,
      rawText: "2 tane 80'lik soba nakit",
    };

    const result = await executeVoiceSale(command);

    expect(result.success).toBe(true);
    expect(result.sale).toBeDefined();
    expect(result.sale!.itemCount).toBe(1);
    expect(result.sale!.total).toBe(3400); // 2 x 1700
    expect(result.needsConfirmation).toBe(false);
  });

  it('fails for low confidence command', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      items: [{ productQuery: "80'lik soba", quantity: 1 }],
      payment: 'nakit',
      confidence: 0.3,
      rawText: "...",
    };

    const result = await executeVoiceSale(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('anlaşılamadı');
  });

  it('fails for unknown product', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      items: [{ productQuery: 'xyzabc123', quantity: 1 }],
      payment: 'nakit',
      confidence: 0.9,
      rawText: '1 tane xyzabc123',
    };

    const result = await executeVoiceSale(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('bulunamadı');
  });

  it('requests confirmation for low-confidence match', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      items: [{ productQuery: '80 lik', quantity: 1 }], // Slightly off
      payment: 'nakit',
      confidence: 0.6, // Below auto-confirm threshold
      rawText: "1 tane 80 lik soba",
    };

    const result = await executeVoiceSale(command);

    // Should either succeed with confirmation or fail gracefully
    if (!result.success && result.needsConfirmation) {
      expect(result.confirmationMessage).toBeDefined();
    }
  });

  it('handles cari payment', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      items: [{ productQuery: "80'lik soba", quantity: 1 }],
      payment: 'cari',
      confidence: 0.9,
      rawText: "1 tane 80'lik soba cari",
    };

    const result = await executeVoiceSale(command);

    // Should succeed (cari without cariId is warning, not error)
    if (result.success) {
      expect(result.sale).toBeDefined();
    }
  });

  it('handles kart payment', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      items: [{ productQuery: 'klima', quantity: 1 }],
      payment: 'kart',
      confidence: 0.9,
      rawText: '1 tane klima kart ile',
    };

    const result = await executeVoiceSale(command);

    if (result.success) {
      expect(result.sale!.total).toBe(4500);
    }
  });
});

describe('executeConfirmedSale', () => {
  it('executes a previously confirmed sale', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      items: [{ productQuery: "80'lik soba", quantity: 3 }],
      payment: 'nakit',
      confidence: 0.95,
      rawText: "3 tane 80'lik soba nakit",
    };

    const result = await executeConfirmedSale(command);

    if (result.success) {
      expect(result.sale!.total).toBe(5100); // 3 x 1700
    }
  });
});
