import { SatisAgent } from "@/agents/SatisAgent";
import { StokAgent } from "@/agents/StokAgent";
import type { AgentContext } from "@/agents/types";
import type { DB } from "@/types";
import { describe, expect, it } from "vitest";

function now(): string {
  return new Date().toISOString();
}

const MINIMAL_DB: DB = {
  _version: 1,
  products: [],
  sales: [],
  suppliers: [],
  orders: [],
  cari: [],
  kasa: [],
  kasalar: [{ id: "nakit", name: "Nakit", icon: "💵" }],
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
};

describe("BaseAgent permissions", () => {
  it("stok agent write iznine sahip olmalı", () => {
    const agent = new StokAgent();
    expect(agent.yetkiKontrolu("stok.write")).toBe(true);
    expect(agent.yetkiKontrolu("kasa.write")).toBe(false);
  });
});

describe("BaseAgent bagla", () => {
  it("bagla() sonrası islemYap çalışmalı", async () => {
    const agent = new SatisAgent();
    const ctx: AgentContext = {
      getDB: () => MINIMAL_DB,
      save: (updater) => { updater(MINIMAL_DB); },
    };
    agent.bagla(ctx);

    const sonuc = await agent.islemYap({ action: "yeniSatis", payload: { items: [] } });
    expect(sonuc.ok).toBe(false);
  });

  it("bagla() çağrılmadan islemYap hata fırlatmalı", async () => {
    const agent = new SatisAgent();
    const sonuc = await agent.islemYap({ action: "test" });
    expect(sonuc.ok).toBe(false);
    expect(sonuc.error).toContain("bağlanmadı");
  });
});
