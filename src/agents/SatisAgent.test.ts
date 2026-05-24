/**
 * SatisAgent testleri
 * Pattern: prevDB → işlem → nextDB
 * Agent context mock ile test edilir, gerçek save() çağrılmaz.
 */

import { SatisAgent } from "@/agents/SatisAgent";
import type { AgentContext, YeniSatisParams } from "@/agents/types";
import type { DB } from "@/types";
import { describe, expect, it, beforeEach, vi } from "vitest";


function now(): string {
  return new Date().toISOString();
}

// ─── DB Fabrika ────────────────────────────────────────────────────────────
function makeDB(overrides: Partial<DB> = {}): DB {
  return {
    _version: 1,
    products: [],
    sales: [],
    suppliers: [],
    orders: [],
    cari: [],
    kasa: [],
    kasalar: [
      { id: "nakit", name: "Nakit", icon: "💵" },
      { id: "banka", name: "Banka", icon: "🏦" },
    ],
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
    company: { id: "c1", createdAt: now() },
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

  // ── yeniSatis ────────────────────────────────────────────────────────────

  it("yeniSatis: başarılı satış kaydı", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const sonuc = await agent.yeniSatis(validParams);

    expect(sonuc.ok).toBe(true);
    expect(sonuc.data).toBeDefined();
    expect(sonuc.data!.saleId).toBeTruthy();
    expect(sonuc.data!.total).toBe(SOBA_PROD.price * 2);

    const nextDB = getDB();
    // Stok düştü mü?
    const urun = nextDB.products.find((p: { id: string }) => p.id === SOBA_PROD.id);
    expect(urun!.stock).toBe(SOBA_PROD.stock - 2);
    // Satış eklendi mi?
    expect(nextDB.sales).toHaveLength(1);
    expect(nextDB.sales[0].status).toBe("tamamlandi");
    expect(nextDB.sales[0].total).toBe(SOBA_PROD.price * 2);
    const kasaKaydi = nextDB.kasa.find((k) => k.relatedId === sonuc.data!.saleId);
    expect(kasaKaydi).toBeDefined();
    expect(kasaKaydi!.type).toBe("gelir");
    expect(kasaKaydi!.amount).toBe(SOBA_PROD.price * 2);
    // Stok hareketi eklendi mi?
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

    // Cari ödeme, tahsilat yok — tümü cariye borç yazılır
    const params: YeniSatisParams = {
      ...validParams,
      payment: "cari",
      tahsilat: 0,
    };

    const sonuc = await agent.yeniSatis(params);
    expect(sonuc.ok).toBe(true);

    const nextDB = getDB();
    const cari = nextDB.cari.find((c: { id: string }) => c.id === MUSTERI.id);
    expect(cari!.balance).toBe(SOBA_PROD.price * 2);
  });

  it("yeniSatis: boş ürün listesi hata döndürmeli", async () => {
    const { ctx } = makeContext(makeDB());
    agent.bagla(ctx);

    const sonuc = await agent.yeniSatis({ ...validParams, items: [] });
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("ürün");
  });

  it("yeniSatis: yetersiz stok hata döndürmeli", async () => {
    const db = makeDB({ products: [{ ...SOBA_PROD, stock: 1 }], cari: [MUSTERI] });
    const { ctx } = makeContext(db);
    agent.bagla(ctx);

    const sonuc = await agent.yeniSatis(validParams); // 2 adet talep
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("stok");
  });

  it("yeniSatis: bagla() çağrılmamışsa hata döndürmeli", async () => {
    const sonuc = await agent.yeniSatis(validParams);
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("bağlanmadı");
  });

  it("yeniSatis: yetki yoksa hata döndürmeli", async () => {
    vi.spyOn(agent, "yetkiKontrolu").mockReturnValue(false);
    const { ctx } = makeContext(makeDB({ products: [SOBA_PROD] }));
    agent.bagla(ctx);

    const sonuc = await agent.yeniSatis(validParams);
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("yetkisi");
  });

  // ── iptalEt ──────────────────────────────────────────────────────────────

  it("iptalEt: satış iptal edilmeli ve stok geri yüklenmeli", async () => {
    // Önce bir satış yap
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);
    const satis = await agent.yeniSatis(validParams);
    expect(satis.ok).toBe(true);

    // Şimdi iptal et
    const iptal = await agent.iptalEt(satis.data!.saleId);
    expect(iptal.ok).toBe(true);

    const nextDB = getDB();
    const satisKaydi = nextDB.sales.find((s: { id: string }) => s.id === satis.data!.saleId);
    expect(satisKaydi!.status).toBe("iptal");

    // Stok geri geldi mi?
    const urun = nextDB.products.find((p: { id: string }) => p.id === SOBA_PROD.id);
    expect(urun!.stock).toBe(SOBA_PROD.stock);

    // İptal kasa kaydı (gider) eklendi mi?
    const iptalKasa = nextDB.kasa.filter(
      (k) => k.relatedId === satis.data!.saleId && k.type === "gider",
    );
    expect(iptalKasa.length).toBeGreaterThanOrEqual(1);
    const toplamIptal = iptalKasa.reduce((s: number, k: { amount: number }) => s + k.amount, 0);
    expect(toplamIptal).toBe(SOBA_PROD.price * 2);
  });

  it("iptalEt: cari ödemede bakiye düzeltilmeli", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [{ ...MUSTERI, balance: 0 }] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const params: YeniSatisParams = {
      ...validParams,
      payment: "cari",
      tahsilat: 0,
    };
    const satis = await agent.yeniSatis(params);
    expect(satis.ok).toBe(true);

    let nextDB = getDB();
      let cariKaydi = nextDB.cari.find((c: { id: string }) => c.id === MUSTERI.id);
      const oncekiBakiye = cariKaydi!.balance;
      expect(oncekiBakiye).toBeGreaterThan(0);


    const iptal = await agent.iptalEt(satis.data!.saleId);
    expect(iptal.ok).toBe(true);

    nextDB = getDB();
    cariKaydi = nextDB.cari.find((c: { id: string }) => c.id === MUSTERI.id);
    expect(cariKaydi!.balance).toBe(0);
  });

  it("iptalEt: bagla() çağrılmamışsa hata döndürmeli", async () => {
    const sonuc = await agent.iptalEt("fake-id");
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("bağlanmadı");
  });

  // ── iadeYap ──────────────────────────────────────────────────────────────

  it("iadeYap: tam iade stok geri yüklenmeli ve durum güncellenmeli", async () => {
    const db = makeDB({ products: [SOBA_PROD, AKSESUAR_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    // İki ürünlü satış
    const params: YeniSatisParams = {
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
    const satis = await agent.yeniSatis(params);
    expect(satis.ok).toBe(true);

    // Tam iade
    const iade = await agent.iadeYap(satis.data!.saleId);
    expect(iade.ok).toBe(true);

    const nextDB = getDB();
    const satisKaydi = nextDB.sales.find((s: { id: string }) => s.id === satis.data!.saleId);
    expect(satisKaydi!.status).toBe("iade");
    expect(satisKaydi!.returnedAt).toBeDefined();

    // Her iki ürünün stoğu geri geldi mi?
    const soba = nextDB.products.find((p: { id: string }) => p.id === SOBA_PROD.id);
    expect(soba!.stock).toBe(SOBA_PROD.stock);
    const aksesuar = nextDB.products.find((p: { id: string }) => p.id === AKSESUAR_PROD.id);
    expect(aksesuar!.stock).toBe(AKSESUAR_PROD.stock);
  });

  it("iadeYap: kısmi iade sadece belirtilen miktar kadar stok döndürmeli", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const satis = await agent.yeniSatis(validParams);
    expect(satis.ok).toBe(true);

    // 1 adet iade (2 adet satılmıştı)
    const iade = await agent.iadeYap(satis.data!.saleId, 1);
    expect(iade.ok).toBe(true);

    const nextDB = getDB();
    const urun = nextDB.products.find((p: { id: string }) => p.id === SOBA_PROD.id);
    // Başlangıç: 10, satış: -2, iade: +1 = 9
    expect(urun!.stock).toBe(SOBA_PROD.stock - 1);
  });

  // ── fiyatDuzelt ──────────────────────────────────────────────────────────

  it("fiyatDuzelt: fiyat güncellenmeli ve activity log'a yazılmalı", async () => {
    const db = makeDB({ products: [SOBA_PROD], cari: [MUSTERI] });
    const { ctx, getDB } = makeContext(db);
    agent.bagla(ctx);

    const satis = await agent.yeniSatis(validParams);
    expect(satis.ok).toBe(true);

    const yeniFiyat = 12000;
    const duzelt = await agent.fiyatDuzelt(satis.data!.saleId, yeniFiyat);
    expect(duzelt.ok).toBe(true);

    const nextDB = getDB();
    const satisKaydi = nextDB.sales.find((s: { id: string }) => s.id === satis.data!.saleId);
    expect(satisKaydi!.unitPrice).toBe(yeniFiyat);

    const log = nextDB._activityLog?.find(
      (l: { action: string }) => l.action === "fiyat_duzeltme",
    );
    expect(log).toBeDefined();
    expect(log!.detail).toContain("₺10.000");
    expect(log!.detail).toContain("₺12.000");
  });

  it("fiyatDuzelt: bagla() çağrılmamışsa hata döndürmeli", async () => {
    const sonuc = await agent.fiyatDuzelt("fake-id", 9999);
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("bağlanmadı");
  });

  // ── islemYap (base) ──────────────────────────────────────────────────────

  it("islemYap: geçerli aksiyon kuyruğa alınmalı", async () => {
    const { ctx } = makeContext(makeDB());
    agent.bagla(ctx);

    const sonuc = await agent.islemYap({ action: "test" });
    expect(sonuc.ok).toBe(true);
    expect(sonuc.data).toBeDefined();
  });
});
