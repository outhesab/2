/**
 * SatisAgent testleri
 * Pattern: prevDB → işlem → nextDB
 * Agent context mock ile test edilir, gerçek save() çağrılmaz.
 */

import { SatisAgent } from "@/agents/SatisAgent";
import type { AgentContext, YeniSatisParams } from "@/agents/types";
import type { DB } from "@/types";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { makeDB } from "@/__tests__/testUtils";


function now(): string {
  return new Date().toISOString();
}

// ─── Agent Context Fabrika ─────────────────────────────────────────────────
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

// ─── Örnek Ürün ────────────────────────────────────────────────────────────
const SOBA_PROD = {
  id: "p1",
  name: "Test Soba",
  category: "soba",
  cost: 5000,
  price: 10000,
  stock: 10,
  minStock: 2,
  createdAt: now(),
  updatedAt: now(),
};

const AKSESUAR_PROD = {
  id: "p2",
  name: "Test Aksesuar",
  category: "aksesuar",
  cost: 200,
  price: 500,
  stock: 50,
  minStock: 10,
  createdAt: now(),
  updatedAt: now(),
};

// ─── Örnek Cari ────────────────────────────────────────────────────────────
const MUSTERI = {
  id: "cari1",
  name: "Test Müşteri",
  type: "musteri" as const,
  balance: 0,
  createdAt: now(),
  updatedAt: now(),
};

// ─── Geçerli Satış Parametreleri ───────────────────────────────────────────
const validParams: YeniSatisParams = {
  items: [
    {
      productId: SOBA_PROD.id,
      productName: SOBA_PROD.name,
      quantity: 2,
      unitPrice: SOBA_PROD.price,
      cost: SOBA_PROD.cost,
      total: SOBA_PROD.price * 2,
    },
  ],
  cariId: MUSTERI.id,
  payment: "nakit",
  discount: 0,
  discountAmount: 0,
  tahsilat: SOBA_PROD.price * 2,
};

describe("SatisAgent", () => {
  let agent: SatisAgent;

  beforeEach(() => {
    agent = new SatisAgent();
  });

  function islemYapParams(action: string, payload: unknown) {
    return { action, payload: payload as Record<string, unknown> };
  }

  function getSaleData(result: { ok: boolean; data?: unknown }) {
    return (result.data as { intentResult: { data: { dbUpdates: { sale: { id: string; total: number; unitPrice?: number } } } } }).intentResult.data.dbUpdates.sale;
  }

  // ── yeniSatis (via islemYap) ─────────────────────────────────────────────

  it("yeniSatis: başarılı satış kaydı", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', validParams as unknown as Record<string, unknown>));

    expect(sonuc.ok).toBe(true);
    const saleData = getSaleData(sonuc);
    expect(saleData.id).toBeTruthy();
    expect(saleData.total).toBe(SOBA_PROD.price * 2);

    const nextDB = getDB();
    const urun = nextDB.products.find((p: { id: string }) => p.id === SOBA_PROD.id);
    expect(urun!.stock).toBe(SOBA_PROD.stock - 2);
    expect(nextDB.sales).toHaveLength(1);
    expect(nextDB.sales[0].status).toBe("tamamlandi");
    expect(nextDB.sales[0].total).toBe(SOBA_PROD.price * 2);
    const kasaKaydi = nextDB.kasa.find((k) => k.relatedId === saleData.id);
    expect(kasaKaydi).toBeDefined();
    expect(kasaKaydi!.type).toBe("gelir");
    expect(kasaKaydi!.amount).toBe(SOBA_PROD.price * 2);
    const hareket = nextDB.stockMovements.find(
      (m: { productId: string }) => m.productId === SOBA_PROD.id,
    );
    expect(hareket).toBeDefined();
    expect(hareket!.type).toBe("satis");
    expect(hareket!.amount).toBe(-2);
  });

  it("yeniSatis: cari ödemede bakiye güncellenmeli", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const params = { ...validParams, payment: "cari", tahsilat: 0 };
    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', params as unknown as Record<string, unknown>));
    expect(sonuc.ok).toBe(true);

    const nextDB = getDB();
    const cari = nextDB.cari.find((c: { id: string }) => c.id === MUSTERI.id);
    expect(cari!.balance).toBe(SOBA_PROD.price * 2);
  });

  it("yeniSatis: boş ürün listesi hata döndürmeli", async () => {
    const { ctx } = makeContext(makeDB());
    agent.bagla(ctx);

    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', { ...validParams, items: [] } as unknown as Record<string, unknown>));
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("ürün");
  });

  it("yeniSatis: yetersiz stok hata döndürmeli", async () => {
    const db = makeDB({ products: [{ ...SOBA_PROD, stock: 1 }], cari: [MUSTERI] });
    const { ctx } = makeContext(db);
    agent.bagla(ctx);

    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', validParams as unknown as Record<string, unknown>));
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("stok");
  });

  it("yeniSatis: bagla() çağrılmamışsa hata döndürmeli", async () => {
    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', validParams as unknown as Record<string, unknown>));
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("bağlanmadı");
  });

  it("yeniSatis: yetki yoksa hata döndürmeli", async () => {
    vi.spyOn(agent, "yetkiKontrolu").mockReturnValue(false);
    const { ctx } = makeContext(makeDB({ products: [SOBA_PROD] }));
    agent.bagla(ctx);

    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', validParams as unknown as Record<string, unknown>));
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("yetkisi");
  });

  // ── iptalEt (via islemYap) ────────────────────────────────────────────────

  it("iptalEt: satış iptal edilmeli ve stok geri yüklenmeli", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);
    const satis = await agent.islemYap(islemYapParams('yeniSatis', validParams as unknown as Record<string, unknown>));
    expect(satis.ok).toBe(true);
    const saleId = getSaleData(satis).id;

    const iptal = await agent.islemYap({ action: 'iptalEt', payload: { saleId } });
    expect(iptal.ok).toBe(true);

    const nextDB = getDB();
    const satisKaydi = nextDB.sales.find((s: { id: string }) => s.id === saleId);
    expect(satisKaydi!.status).toBe("iptal");

    const urun = nextDB.products.find((p: { id: string }) => p.id === SOBA_PROD.id);
    expect(urun!.stock).toBe(SOBA_PROD.stock);

    const iptalKasa = nextDB.kasa.filter(
      (k) => k.relatedId === saleId && k.type === "gider",
    );
    expect(iptalKasa.length).toBeGreaterThanOrEqual(1);
    const toplamIptal = iptalKasa.reduce((s: number, k: { amount: number }) => s + k.amount, 0);
    expect(toplamIptal).toBe(SOBA_PROD.price * 2);
  });

  it("iptalEt: cari ödemede bakiye düzeltilmeli", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [{ ...MUSTERI, balance: 0 }] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const params = { ...validParams, payment: "cari", tahsilat: 0 };
    const satis = await agent.islemYap(islemYapParams('yeniSatis', params));
    expect(satis.ok).toBe(true);
    const saleId = getSaleData(satis).id;

    let nextDB = getDB();
    let cariKaydi = nextDB.cari.find((c: { id: string }) => c.id === MUSTERI.id);
    const oncekiBakiye = cariKaydi!.balance;
    expect(oncekiBakiye).toBeGreaterThan(0);

    const iptal = await agent.islemYap({ action: 'iptalEt', payload: { saleId } });
    expect(iptal.ok).toBe(true);

    nextDB = getDB();
    cariKaydi = nextDB.cari.find((c: { id: string }) => c.id === MUSTERI.id);
    expect(cariKaydi!.balance).toBe(0);
  });

  it("iptalEt: bagla() çağrılmamışsa hata döndürmeli", async () => {
    const sonuc = await agent.islemYap({ action: 'iptalEt', payload: { saleId: "fake-id" } });
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("bağlanmadı");
  });

  // ── iadeYap (via islemYap) ────────────────────────────────────────────────

  it("iadeYap: tam iade stok geri yüklenmeli ve durum güncellenmeli", async () => {
    const db = makeDB({ products: [SOBA_PROD, AKSESUAR_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const params = {
      ...validParams,
      items: [
        {
          productId: SOBA_PROD.id,
          productName: SOBA_PROD.name,
          quantity: 2,
          unitPrice: SOBA_PROD.price,
          cost: SOBA_PROD.cost,
          total: SOBA_PROD.price * 2,
        },
        {
          productId: AKSESUAR_PROD.id,
          productName: AKSESUAR_PROD.name,
          quantity: 5,
          unitPrice: AKSESUAR_PROD.price,
          cost: AKSESUAR_PROD.cost,
          total: AKSESUAR_PROD.price * 5,
        },
      ],
    };
    const satis = await agent.islemYap(islemYapParams('yeniSatis', params as unknown as Record<string, unknown>));
    expect(satis.ok).toBe(true);
    const saleId = getSaleData(satis).id;

    const iade = await agent.islemYap({ action: 'iadeYap', payload: { saleId } });
    expect(iade.ok).toBe(true);

    const nextDB = getDB();
    const satisKaydi = nextDB.sales.find((s: { id: string }) => s.id === saleId);
    expect(satisKaydi!.status).toBe("iade");
    expect(satisKaydi!.returnedAt).toBeDefined();

    const soba = nextDB.products.find((p: { id: string }) => p.id === SOBA_PROD.id);
    expect(soba!.stock).toBe(SOBA_PROD.stock);
    const aksesuar = nextDB.products.find((p: { id: string }) => p.id === AKSESUAR_PROD.id);
    expect(aksesuar!.stock).toBe(AKSESUAR_PROD.stock);
  });

  it("iadeYap: kısmi iade sadece belirtilen miktar kadar stok döndürmeli", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const satis = await agent.islemYap(islemYapParams('yeniSatis', validParams as unknown as Record<string, unknown>));
    expect(satis.ok).toBe(true);
    const saleId = getSaleData(satis).id;

    const iade = await agent.islemYap({ action: 'iadeYap', payload: { saleId, quantity: 1 } });
    expect(iade.ok).toBe(true);

    const nextDB = getDB();
    const urun = nextDB.products.find((p: { id: string }) => p.id === SOBA_PROD.id);
    expect(urun!.stock).toBe(SOBA_PROD.stock - 1);
  });

  // ── fiyatDuzelt (via islemYap) ────────────────────────────────────────────

  it("fiyatDuzelt: fiyat güncellenmeli ve activity log'a yazılmalı", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const satis = await agent.islemYap(islemYapParams('yeniSatis', validParams as unknown as Record<string, unknown>));
    expect(satis.ok).toBe(true);
    const saleId = getSaleData(satis).id;

    const yeniFiyat = 12000;
    const duzelt = await agent.islemYap({ action: 'fiyatDuzelt', payload: { saleId, unitPrice: yeniFiyat } });
    expect(duzelt.ok).toBe(true);

    const nextDB = getDB();
    const satisKaydi = nextDB.sales.find((s: { id: string }) => s.id === saleId);
    expect(satisKaydi!.unitPrice).toBe(yeniFiyat);
    expect(duzelt.ok).toBe(true);
  });

  it("fiyatDuzelt: bagla() çağrılmamışsa hata döndürmeli", async () => {
    const sonuc = await agent.islemYap({ action: 'fiyatDuzelt', payload: { saleId: "fake-id", unitPrice: 9999 } });
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("bağlanmadı");
  });

  // ── islemYap (base) ──────────────────────────────────────────────────────

  it("islemYap: bilinmeyen aksiyon hata döndürmeli", async () => {
    const { ctx } = makeContext(makeDB());
    agent.bagla(ctx);

    const sonuc = await agent.islemYap({ action: "test" });
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("Desteklenmeyen");
  });

  // ── H9: Discount calculation ────────────────────────────────────────────

  it("yeniSatis: yüzde iskonto total ve profit hesaplarını etkilemeli", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const params = {
      ...validParams,
      discount: 10,
      discountAmount: 0,
    };
    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', params as unknown as Record<string, unknown>));
    expect(sonuc.ok).toBe(true);

    const nextDB = getDB();
    const satis = nextDB.sales[0];
    const expectedSubtotal = SOBA_PROD.price * 2;
    const expectedDiscount = Math.round(expectedSubtotal * 0.1);
    const expectedTotal = expectedSubtotal - expectedDiscount;
    expect(satis.subtotal).toBe(expectedSubtotal);
    expect(satis.discountAmount).toBe(expectedDiscount);
    expect(satis.total).toBe(expectedTotal);
  });

  it("yeniSatis: sabit iskonto tutarı total'den düşülmeli", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const sabitIskonto = 500;
    const params = {
      ...validParams,
      discount: 0,
      discountAmount: sabitIskonto,
    };
    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', params as unknown as Record<string, unknown>));
    expect(sonuc.ok).toBe(true);

    const nextDB = getDB();
    const satis = nextDB.sales[0];
    const expectedTotal = SOBA_PROD.price * 2 - sabitIskonto;
    expect(satis.discountAmount).toBe(sabitIskonto);
    expect(satis.total).toBe(expectedTotal);
  });

  // ── H9: Banka (havale) payment routing ──────────────────────────────────

  it("yeniSatis: havale ödemede kasa kaydı havale kasasına gider", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const params = { ...validParams, payment: "havale" as const };
    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', params as unknown as Record<string, unknown>));
    expect(sonuc.ok).toBe(true);

    const nextDB = getDB();
    const saleId = getSaleData(sonuc).id;
    const kasaKaydi = nextDB.kasa.find((k) => k.relatedId === saleId);
    expect(kasaKaydi).toBeDefined();
    expect(kasaKaydi!.kasa).toBe("havale");
    expect(kasaKaydi!.amount).toBe(SOBA_PROD.price * 2);
  });

  // ── H9: POS (kart) payment routing ──────────────────────────────────────

  it("yeniSatis: kart ödemede kasa kaydı kart kasasına gider", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const params = { ...validParams, payment: "kart" as const };
    const sonuc = await agent.islemYap(islemYapParams('yeniSatis', params as unknown as Record<string, unknown>));
    expect(sonuc.ok).toBe(true);

    const nextDB = getDB();
    const saleId = getSaleData(sonuc).id;
    const kasaKaydi = nextDB.kasa.find((k) => k.relatedId === saleId);
    expect(kasaKaydi).toBeDefined();
    expect(kasaKaydi!.kasa).toBe("kart");
    expect(kasaKaydi!.amount).toBe(SOBA_PROD.price * 2);
  });
});
