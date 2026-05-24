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
  it("bagla() sonrası db ve save erişilebilir olmalı", async () => {
    const agent = new SatisAgent();
    let savedDb: DB = MINIMAL_DB;
    const ctx: AgentContext = {
      getDB: () => MINIMAL_DB,
      save: (updater) => { savedDb = updater(savedDb); },
    };
    agent.bagla(ctx);

    expect(() => agent["db"]).not.toThrow();
    expect(agent["db"]).toBe(MINIMAL_DB);

    expect(() => agent["save"]).not.toThrow();
    agent["save"]((prev) => ({ ...prev, _version: 2 }));
    expect(savedDb._version).toBe(2);
  });

  it("bagla() çağrılmadan db getter hata fırlatmalı", () => {
    const agent = new SatisAgent();
    expect(() => agent["db"]).toThrow("bağlanmadı");
  });

  it("bagla() çağrılmadan save getter hata fırlatmalı", () => {
    const agent = new SatisAgent();
    expect(() => agent["save"]).toThrow("bağlanmadı");
  });
});
