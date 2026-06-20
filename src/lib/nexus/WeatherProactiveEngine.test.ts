import { describe, it, expect, beforeEach } from "vitest";
import type { DB, Product, Sale } from "@/types";
import { makeDB } from "@/__tests__/testUtils";
import {
  estimateDemandMultiplier,
  estimateDailySales,
  analyzeWeatherImpact,
  generateProactiveMessage,
  mockWeatherFetcher,
  WeatherProactiveEngine,
  type WeatherData,
} from "./WeatherProactiveEngine";

// ── Test yardımcıları ────────────────────────────────────────────────────────

function makeProduct(p: Partial<Product> & { id: string }): Product {
  return {
    name: "Soba 80lik",
    category: "soba",
    cost: 4000,
    price: 5000,
    stock: 20,
    minStock: 2,
    deleted: false,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...p,
  };
}

function makeSale(partial: Partial<Sale> & { id: string; createdAt: string }): Sale {
  return {
    productName: "Soba 80lik",
    productCategory: "soba",
    quantity: 1,
    unitPrice: 5000,
    cost: 4000,
    discount: 0,
    discountAmount: 0,
    subtotal: 5000,
    total: 5000,
    profit: 1000,
    payment: "nakit",
    status: "tamamlandi",
    items: [{ productId: "p1", productName: "Soba 80lik", quantity: 1, unitPrice: 5000, cost: 4000, total: 5000 }],
    updatedAt: partial.createdAt,
    ...partial,
  } as Sale;
}

function makeTestDB(overrides: { products?: Product[]; sales?: Sale[] } = {}): DB {
  return makeDB({
    products: overrides.products ?? [
      makeProduct({ id: "p1", name: "Soba 80lik", stock: 20, minStock: 2, category: "soba" }),
      makeProduct({ id: "p2", name: "Boru 10cm", stock: 100, minStock: 10, category: "boru" }),
      makeProduct({ id: "p3", name: "Aksesuar", stock: 50, minStock: 5, category: "aksesuar" }),
    ],
    sales: overrides.sales ?? [],
  });
}

const coolingWeather: WeatherData = {
  currentTemp: 10,
  forecastAvgTemp: 4,
  trend: "cooling",
  forecastDays: 10,
  source: "test",
};

const stableWeather: WeatherData = {
  currentTemp: 15,
  forecastAvgTemp: 15,
  trend: "stable",
  forecastDays: 10,
  source: "test",
};

// ── estimateDemandMultiplier ─────────────────────────────────────────────────

describe("WeatherProactiveEngine / estimateDemandMultiplier", () => {
  it("cooling 6°C düşüş → +%30 (1.3)", () => {
    const w: WeatherData = { currentTemp: 10, forecastAvgTemp: 4, trend: "cooling", forecastDays: 10 };
    expect(estimateDemandMultiplier(w)).toBe(1.3);
  });

  it("cooling 4°C düşüş → +%15 (1.15)", () => {
    const w: WeatherData = { currentTemp: 10, forecastAvgTemp: 6, trend: "cooling", forecastDays: 10 };
    expect(estimateDemandMultiplier(w)).toBe(1.15);
  });

  it("cooling 2°C düşüş → +%5 (1.05)", () => {
    const w: WeatherData = { currentTemp: 10, forecastAvgTemp: 8, trend: "cooling", forecastDays: 10 };
    expect(estimateDemandMultiplier(w)).toBe(1.05);
  });

  it("cooling <1°C düşüş → 1.0", () => {
    const w: WeatherData = { currentTemp: 10, forecastAvgTemp: 9.5, trend: "cooling", forecastDays: 10 };
    expect(estimateDemandMultiplier(w)).toBe(1.0);
  });

  it("stable → 1.0", () => {
    expect(estimateDemandMultiplier(stableWeather)).toBe(1.0);
  });

  it("warming → 1.0", () => {
    const w: WeatherData = { currentTemp: 5, forecastAvgTemp: 12, trend: "warming", forecastDays: 10 };
    expect(estimateDemandMultiplier(w)).toBe(1.0);
  });
});

// ── estimateDailySales ───────────────────────────────────────────────────────

describe("WeatherProactiveEngine / estimateDailySales", () => {
  it("son 30 günde satış yoksa 0", () => {
    const db = makeTestDB();
    expect(estimateDailySales(db, "p1")).toBe(0);
  });

  it("son 30 günde 30 adet satış → günde 1", () => {
    const today = new Date();
    const sales: Sale[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      sales.push(makeSale({
        id: `s${i}`,
        createdAt: d.toISOString(),
        items: [{ productId: "p1", productName: "Soba 80lik", quantity: 1, unitPrice: 5000, cost: 4000, total: 5000 }],
      }));
    }
    const db = makeTestDB({ sales });
    expect(estimateDailySales(db, "p1")).toBeCloseTo(1, 1);
  });

  it("30 günden eski satışlar sayılmaz", () => {
    const old = new Date();
    old.setDate(old.getDate() - 60);
    const db = makeTestDB({
      sales: [makeSale({
        id: "s1",
        createdAt: old.toISOString(),
        items: [{ productId: "p1", productName: "Soba 80lik", quantity: 10, unitPrice: 5000, cost: 4000, total: 5000 }],
      })],
    });
    expect(estimateDailySales(db, "p1")).toBe(0);
  });

  it("silinmiş satışlar sayılmaz", () => {
    const today = new Date();
    const db = makeTestDB({
      sales: [makeSale({
        id: "s1",
        createdAt: today.toISOString(),
        deleted: true,
        items: [{ productId: "p1", productName: "Soba 80lik", quantity: 5, unitPrice: 5000, cost: 4000, total: 5000 }],
      })],
    });
    expect(estimateDailySales(db, "p1")).toBe(0);
  });

  it("geçersiz productId → 0", () => {
    const db = makeTestDB();
    expect(estimateDailySales(db, "yok")).toBe(0);
  });
});

// ── analyzeWeatherImpact ─────────────────────────────────────────────────────

describe("WeatherProactiveEngine / analyzeWeatherImpact", () => {
  it("stable weather + satış yok → alerts boş", () => {
    const db = makeTestDB();
    const alerts = analyzeWeatherImpact(stableWeather, db);
    expect(alerts).toHaveLength(0);
  });

  it("cooling weather + soba stoğu düşük → restock_suggestion", () => {
    const today = new Date();
    const sales: Sale[] = [];
    // Günde 2 adet satılan ürün (30 günde 60 adet)
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      sales.push(makeSale({
        id: `s${i}`,
        createdAt: d.toISOString(),
        items: [{ productId: "p1", productName: "Soba 80lik", quantity: 2, unitPrice: 5000, cost: 4000, total: 5000 }],
      }));
    }
    const db = makeTestDB({
      products: [makeProduct({ id: "p1", name: "Soba 80lik", stock: 10, minStock: 2, category: "soba" })],
      sales,
    });
    const alerts = analyzeWeatherImpact(coolingWeather, db);
    // Talep: 2 * 1.3 * 10 = 26, stok 10 → shortfall 16
    const restock = alerts.find((a) => a.category === "restock_suggestion");
    expect(restock).toBeDefined();
    expect(restock?.suggestedAction?.type).toBe("restock");
    expect(restock?.suggestedAction?.suggestedQty).toBeGreaterThan(10);
  });

  it("cooling weather + stok yeterli → opportunity (low)", () => {
    const today = new Date();
    const sales: Sale[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      sales.push(makeSale({
        id: `s${i}`,
        createdAt: d.toISOString(),
        items: [{ productId: "p1", productName: "Soba 80lik", quantity: 1, unitPrice: 5000, cost: 4000, total: 5000 }],
      }));
    }
    // Talep: 1 * 1.3 * 10 = 13, stok 100 → yeterli
    const db = makeTestDB({
      products: [makeProduct({ id: "p1", name: "Soba 80lik", stock: 100, minStock: 2, category: "soba" })],
      sales,
    });
    const alerts = analyzeWeatherImpact(coolingWeather, db);
    const opportunity = alerts.find((a) => a.category === "opportunity");
    expect(opportunity).toBeDefined();
    expect(opportunity?.priority).toBe("low");
  });

  it("stok minStock altında + talep artacak → high priority", () => {
    const today = new Date();
    const sales: Sale[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      sales.push(makeSale({
        id: `s${i}`,
        createdAt: d.toISOString(),
        items: [{ productId: "p1", productName: "Soba 80lik", quantity: 3, unitPrice: 5000, cost: 4000, total: 5000 }],
      }));
    }
    // Talep: 3 * 1.3 * 10 = 39, stok 2, minStock 2 → high
    const db = makeTestDB({
      products: [makeProduct({ id: "p1", name: "Soba 80lik", stock: 2, minStock: 2, category: "soba" })],
      sales,
    });
    const alerts = analyzeWeatherImpact(coolingWeather, db);
    const restock = alerts.find((a) => a.category === "restock_suggestion");
    expect(restock?.priority).toBe("high");
  });

  it("soba kategorisi dışı ürünler analize dahil edilmez", () => {
    const db = makeTestDB({
      products: [makeProduct({ id: "p3", name: "Aksesuar", stock: 1, minStock: 10, category: "aksesuar" })],
    });
    const alerts = analyzeWeatherImpact(coolingWeather, db);
    // Aksesuar heat kategorisinde değil → alert yok (satış da yok)
    expect(alerts.find((a) => a.data?.productId === "p3")).toBeUndefined();
  });

  it("soba ürünleri yoksa alerts boş", () => {
    const db = makeTestDB({
      products: [makeProduct({ id: "p3", name: "Aksesuar", stock: 10, category: "aksesuar" })],
    });
    const alerts = analyzeWeatherImpact(coolingWeather, db);
    expect(alerts).toHaveLength(0);
  });

  it("restock varsa genel weather_demand overview eklenir", () => {
    const today = new Date();
    const sales: Sale[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      sales.push(makeSale({
        id: `s${i}`,
        createdAt: d.toISOString(),
        items: [{ productId: "p1", productName: "Soba 80lik", quantity: 5, unitPrice: 5000, cost: 4000, total: 5000 }],
      }));
    }
    const db = makeTestDB({
      products: [makeProduct({ id: "p1", name: "Soba 80lik", stock: 5, minStock: 2, category: "soba" })],
      sales,
    });
    const alerts = analyzeWeatherImpact(coolingWeather, db);
    const overview = alerts.find((a) => a.category === "weather_demand");
    expect(overview).toBeDefined();
    expect(overview?.message).toContain("sıcaklık");
  });
});

// ── generateProactiveMessage ─────────────────────────────────────────────────

describe("WeatherProactiveEngine / generateProactiveMessage", () => {
  it("boş alerts → 'şu an için stok riski yok'", () => {
    const msg = generateProactiveMessage([]);
    expect(msg).toContain("stok riski yok");
  });

  it("high priority alerts → 'Dikkat, X kritik uyarı'", () => {
    const alerts = [
      { id: "1", priority: "high" as const, category: "restock_suggestion" as const, message: "Soba 80lik kritik" },
      { id: "2", priority: "high" as const, category: "restock_suggestion" as const, message: "Boru kritik" },
    ];
    const msg = generateProactiveMessage(alerts);
    expect(msg).toContain("2 kritik");
    expect(msg).toContain("Soba 80lik kritik");
  });

  it("en fazla 3 alert detaylandırılır, gerisi 've X uyarı daha'", () => {
    const alerts = Array.from({ length: 5 }, (_, i) => ({
      id: `a${i}`,
      priority: "medium" as const,
      category: "restock_suggestion" as const,
      message: `Uyarı ${i}`,
    }));
    const msg = generateProactiveMessage(alerts);
    expect(msg).toContain("Ve 2 uyarı daha");
  });

  it("öncelik sırasına göre sıralar (high önce)", () => {
    const alerts = [
      { id: "1", priority: "low" as const, category: "opportunity" as const, message: "düşük öncelikli" },
      { id: "2", priority: "high" as const, category: "restock_suggestion" as const, message: "yüksek öncelikli" },
    ];
    const msg = generateProactiveMessage(alerts);
    expect(msg.indexOf("yüksek öncelikli")).toBeLessThan(msg.indexOf("düşük öncelikli"));
  });
});

// ── mockWeatherFetcher ───────────────────────────────────────────────────────

describe("WeatherProactiveEngine / mockWeatherFetcher", () => {
  it("cooling senaryosu döndürür", async () => {
    const w = await mockWeatherFetcher("İstanbul");
    expect(w.trend).toBe("cooling");
    expect(w.currentTemp).toBe(10);
    expect(w.forecastAvgTemp).toBe(4);
    expect(w.location).toBe("İstanbul");
    expect(w.source).toBe("mock");
  });
});

// ── WeatherProactiveEngine state machine ─────────────────────────────────────

describe("WeatherProactiveEngine / state machine", () => {
  let engine: WeatherProactiveEngine;

  beforeEach(() => {
    engine = WeatherProactiveEngine.getInstance();
    engine.reset();
    engine.setFetcher(mockWeatherFetcher);
  });

  it("check → alerts + message + weather döner", async () => {
    const db = makeTestDB();
    const result = await engine.check(db, "test", true);
    expect(result.weather).toBeDefined();
    expect(result.weather.trend).toBe("cooling");
    expect(Array.isArray(result.alerts)).toBe(true);
    expect(typeof result.message).toBe("string");
  });

  it("getLastAlerts son check sonuçlarını döner", async () => {
    const db = makeTestDB();
    await engine.check(db, "test", true);
    const alerts = engine.getLastAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("cooldown varsa force=false atlar", async () => {
    const db = makeTestDB();
    await engine.check(db, "test", true);
    // İkinci check force=false → cooldown, aynı alerts döner
    const result = await engine.check(db, "test", false);
    expect(result.alerts).toEqual(engine.getLastAlerts());
  });

  it("reset cooldown sıfırlar", async () => {
    const db = makeTestDB();
    await engine.check(db, "test", true);
    engine.reset();
    expect(engine.getLastAlerts()).toHaveLength(0);
  });
});
