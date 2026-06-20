/**
 * StokAgent testleri
 * Pattern: prevDB -> islem -> nextDB
 */
import { StokAgent } from '@/agents/StokAgent';
import type { AgentContext } from '@/agents/types';
import type { DB } from '@/types';
import { describe, expect, it, beforeEach } from 'vitest';
import { makeDB } from '@/__tests__/testUtils';

function now(): string {
  return new Date().toISOString();
}

function makeContext(initialDB: DB): { ctx: AgentContext; getDB: () => DB } {
  let currentDB = structuredClone(initialDB);
  return {
    ctx: {
      getDB: () => currentDB,
      save: (updater: (prev: DB) => DB) => {
        currentDB = updater(currentDB);
      },
    },
    getDB: () => currentDB,
  };
}

// ─── Örnek Ürün ────────────────────────────────────────────
const URUN = {
  id: 'p1',
  name: 'Test Soba',
  category: 'soba',
  cost: 5000,
  price: 10000,
  stock: 10,
  minStock: 2,
  createdAt: now(),
  updatedAt: now(),
};

describe('StokAgent', () => {
  let agent: StokAgent;

  beforeEach(() => {
    agent = new StokAgent();
  });

  // ── islemYap: stok_guncelle ──────────────────────────────

  it('stok_guncelle: stoğu düşürmeli ve hareket eklemeli', async () => {
    const db = makeDB({ products: [URUN] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const sonuc = await agent.islemYap({
      action: 'stok_guncelle',
      payload: { productId: 'p1', quantity: 3, productName: 'Test Soba' },
    });

    expect(sonuc.ok).toBe(true);
    expect((sonuc.data as Record<string, string>)?.agent).toBe('stok');
    expect((sonuc.data as Record<string, string>)?.status).toBe('completed');

    const nextDB = getDB();
    const urun = nextDB.products.find((p) => p.id === 'p1');
    expect(urun!.stock).toBe(7); // 10 - 3

    expect(nextDB.stockMovements).toHaveLength(1);
    expect(nextDB.stockMovements[0].type).toBe('satis');
    expect(nextDB.stockMovements[0].amount).toBe(-3);
    expect(nextDB.stockMovements[0].productId).toBe('p1');
  });

  it('stok_guncelle: sıfırdan aşağı stoka izin vermemeli', async () => {
    const db = makeDB({ products: [{ ...URUN, stock: 2 }] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const sonuc = await agent.islemYap({
      action: 'stok_guncelle',
      payload: { productId: 'p1', quantity: 5, productName: 'Test Soba' },
    });

    expect(sonuc.ok).toBe(true);
    const nextDB = getDB();
    const urun = nextDB.products.find((p) => p.id === 'p1');
    expect(urun!.stock).toBe(0); // Math.max(0, 2-5) = 0
  });

  it('stok_guncelle: ürün stoğu düşürülmeli', async () => {
    const db = makeDB({ products: [URUN] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const sonuc = await agent.islemYap({
      action: 'stok_guncelle',
      payload: { productId: 'p1', quantity: 1, productName: 'Test Soba', type: 'cikis' },
    });

    expect(sonuc.ok).toBe(true);
    const nextDB = getDB();
    const urun = nextDB.products.find((p) => p.id === 'p1');
    expect(urun!.stock).toBe(9);
  });

  it('stok_guncelle: productId yoksa hata döndürmeli', async () => {
    const db = makeDB({ products: [URUN] });
    const { ctx } = makeContext(db);
    agent.bagla(ctx);

    const sonuc = await agent.islemYap({
      action: 'stok_guncelle',
      payload: { quantity: 3 },
    });

    expect(sonuc.ok).toBe(false);
  });

  it('bagla() çağrılmamışsa hata döndürmeli', async () => {
    const sonuc = await agent.islemYap({
      action: 'stok_guncelle',
      payload: { productId: 'p1', quantity: 1 },
    });
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain('bağlanmadı');
  });

  it('bilinmeyen aksiyon hata döndürmeli', async () => {
    const db = makeDB({ products: [URUN] });
    const { ctx } = makeContext(db);
    agent.bagla(ctx);

    const sonuc = await agent.islemYap({ action: 'bilinmeyen' });
    expect(sonuc.ok).toBe(false);
  });
});
