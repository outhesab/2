/**
 * SOBA NEXUS AI — WeatherProactiveEngine
 * Proaktif Zeka: Hava durumu → Stok yönetimi önerisi.
 *
 * Vizyon: Sistem sadece soru bekleyen değil, yol gösteren bir asistan.
 * "Havalar soğuyor, soba satışları artabilir, stokları dolduralım."
 *
 * Akış:
 * 1. WeatherData (sıcaklık, trend, tahmin) — gerçek API veya manuel giriş
 * 2. analyzeWeatherImpact(weather, db) → ProactiveAlert[]
 *    - Sıcaklık düşüşü → soba talep artışı tahmini
 *    - Mevcut stok ile talep karşılaştırması
 *    - Yetersizse sipariş önerisi
 * 3. generateProactiveMessage(alerts) → doğal dilde mesaj (TTS için)
 *
 * Tasarım:
 * - Saf fonksiyonlar (analyzeWeatherImpact, generateProactiveMessage)
 *   test edilebilir, yan etkisiz, DB'ye yazmaz.
 * - Dış API çağrısı injectable — offline test edilebilir.
 * - SobaSentinel ile entegre çalışabilir (alert'leri oraya emit eder).
 */

import type { DB, Product } from "@/types";
import { logger } from "@/lib/logger";

// ── Tipler ───────────────────────────────────────────────────────────────────

export interface WeatherData {
  /** Mevcut sıcaklık (°C) */
  currentTemp: number;
  /** 10 günlük tahmin ortalaması (°C) */
  forecastAvgTemp: number;
  /** Trend: "cooling" | "warming" | "stable" */
  trend: "cooling" | "warming" | "stable";
  /** Tahmin gün sayısı */
  forecastDays: number;
  /** Veri kaynağı (real API / manual / mock) */
  source?: string;
  /** Lokasyon (şehir/ad) */
  location?: string;
}

export interface ProactiveAlert {
  id: string;
  priority: "low" | "medium" | "high";
  category: "weather_demand" | "stock_low" | "restock_suggestion" | "opportunity";
  message: string;
  /** Önerilen aksiyon (UI/voice için) */
  suggestedAction?: {
    type: "restock" | "monitor" | "promote";
    productName?: string;
    suggestedQty?: number;
  };
  /** Hesaplamaya özgü veri */
  data?: Record<string, unknown>;
}

// ── Saf: Talep tahmini ───────────────────────────────────────────────────────

/**
 * Soba kategorisindeki ürünleri getirir.
 * Soba/boru/pelet gibi ısı ile ilgili kategoriler.
 */
const HEAT_CATEGORIES = ["soba", "pelet", "boru", "ısıtıcı", "isitici", "ekran"];

function isHeatProduct(p: Product): boolean {
  const cat = p.category?.toLocaleLowerCase("tr-TR") ?? "";
  return HEAT_CATEGORIES.some((c) => cat.includes(c));
}

/**
 * Sıcaklık düşüşüne göre talep çarpanı.
 * - 5°C ve üzeri düşüş: +%30 talep
 * - 3-5°C düşüş: +%15 talep
 * - 1-3°C düşüş: +%5 talep
 * - stable/warming: +0
 *
 * Saf fonksiyon — test edilebilir.
 */
export function estimateDemandMultiplier(weather: WeatherData): number {
  if (weather.trend !== "cooling") return 1.0;

  const drop = weather.currentTemp - weather.forecastAvgTemp;
  if (drop >= 5) return 1.3; // +%30
  if (drop >= 3) return 1.15; // +%15
  if (drop >= 1) return 1.05; // +%5
  return 1.0;
}

/**
 * Bir ürün için tahmini günlük satış adedini geçmiş satışlardan hesaplar.
 * Basit yaklaşım: son 30 günde satılan adet / 30.
 * Veri yoksa 0 döner (yeni ürün).
 */
export function estimateDailySales(db: DB, productId: string): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSales = db.sales.filter(
    (s) =>
      !s.deleted &&
      s.status === "tamamlandi" &&
      new Date(s.createdAt) >= thirtyDaysAgo &&
      (s.items || []).some((i) => i.productId === productId),
  );

  const totalQty = recentSales.reduce((sum, s) => {
    const item = (s.items || []).find((i) => i.productId === productId);
    return sum + (item?.quantity ?? 0);
  }, 0);

  return totalQty / 30;
}

// ── Saf: Ana analiz ──────────────────────────────────────────────────────────

/**
 * Hava durumu + DB → Proaktif alert listesi.
 *
 * Mantık:
 * 1. Soba kategorisindeki tüm ürünleri tara
 * 2. Her ürün için: günlük satış × talep çarpanı × forecast gün = tahmini talep
 * 3. Mevcut stok < tahmini talep → restock_suggestion
 * 4. Stok kritik (< minStock) ve talep artacak → high priority
 * 5. Hiç stok riski yok ama talep artacak → opportunity (düşük öncelik)
 *
 * Saf fonksiyon — DB'ye yazmaz, sadece alert üretir.
 */
export function analyzeWeatherImpact(weather: WeatherData, db: DB): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  const multiplier = estimateDemandMultiplier(weather);

  // Hava soğumuyorsa ve çarpan 1 ise — sadece durum raporu
  if (multiplier === 1.0 && weather.trend !== "cooling") {
    return alerts;
  }

  const heatProducts = db.products.filter((p) => !p.deleted && isHeatProduct(p));

  if (heatProducts.length === 0) {
    return alerts;
  }

  for (const product of heatProducts) {
    const dailySales = estimateDailySales(db, product.id);
    const forecastDemand = Math.ceil(dailySales * multiplier * weather.forecastDays);
    const stockShortfall = forecastDemand - product.stock;

    // Stok, tahmini talebi karşılamıyor
    if (stockShortfall > 0) {
      const suggestedQty = Math.max(stockShortfall, product.minStock * 2);
      const priority: ProactiveAlert["priority"] =
        product.stock <= product.minStock ? "high" :
        stockShortfall > product.minStock * 3 ? "high" :
        "medium";

      alerts.push({
        id: `restock_${product.id}`,
        priority,
        category: "restock_suggestion",
        message: `${product.name}: Mevcut stok ${product.stock} adet, ${weather.forecastDays} günlük tahmini talep ${forecastDemand} adet (yüzde ${Math.round((multiplier - 1) * 100)} artış). ${suggestedQty} adet sipariş öneririm.`,
        suggestedAction: {
          type: "restock",
          productName: product.name,
          suggestedQty,
        },
        data: {
          productId: product.id,
          currentStock: product.stock,
          forecastDemand,
          dailySales,
          multiplier,
        },
      });
    } else if (multiplier > 1.0 && dailySales > 0) {
      // Stok yeterli ama talep artacak — fırsat
      alerts.push({
        id: `opportunity_${product.id}`,
        priority: "low",
        category: "opportunity",
        message: `${product.name}: Havalar soğuyor, talep yüzde ${Math.round((multiplier - 1) * 100)} artabilir. Stok yeterli (${product.stock} adet).`,
        suggestedAction: { type: "promote", productName: product.name },
        data: { productId: product.id, multiplier, dailySales },
      });
    }
  }

  // Genel hava durumu uyarısı (en az bir restock varsa)
  if (alerts.some((a) => a.category === "restock_suggestion")) {
    const drop = Math.round(weather.currentTemp - weather.forecastAvgTemp);
    alerts.unshift({
      id: "weather_demand_overview",
      priority: "medium",
      category: "weather_demand",
      message: `Hava durumu Analizi: Önümüzdeki ${weather.forecastDays} gün sıcaklık ${weather.currentTemp}°C'den ${weather.forecastAvgTemp}°C'ye düşebilir (${drop}°C düşüş). Soba talebinde artış bekleniyor.`,
      data: { drop, multiplier },
    });
  }

  return alerts;
}

// ── Saf: Mesaj üretici ───────────────────────────────────────────────────────

/**
 * Alert listesini doğal Türkçe metne çevirir (TTS için).
 * Öncelik sırasına göre sıralar.
 */
export function generateProactiveMessage(alerts: ProactiveAlert[]): string {
  if (alerts.length === 0) {
    return "Hava durumu analizi tamamlandı, şu an için stok riski yok.";
  }

  const priorityMap = { high: 3, medium: 2, low: 1 } as const;
  const sorted = [...alerts].sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

  const parts: string[] = [];
  const highCount = sorted.filter((a) => a.priority === "high").length;
  const mediumCount = sorted.filter((a) => a.priority === "medium").length;

  if (highCount > 0) {
    parts.push(`Dikkat, ${highCount} kritik stok uyarısı var.`);
  } else if (mediumCount > 0) {
    parts.push(`${mediumCount} orta öncelikli uyarı var.`);
  }

  // En kritik 3 alert'i detaylandır
  for (const alert of sorted.slice(0, 3)) {
    parts.push(alert.message);
  }

  if (sorted.length > 3) {
    parts.push(`Ve ${sorted.length - 3} uyarı daha.`);
  }

  return parts.join(" ");
}

// ── Weather API (injectable) ─────────────────────────────────────────────────

/**
 * Weather API fetcher tipi. Gerçek veya mock implementasyon verilebilir.
 * Offline test için mock kullanılır.
 */
export type WeatherFetcher = (location?: string) => Promise<WeatherData>;

/**
 * Mock weather fetcher — test/dev için.
 * 10°C → 4°C trend (soğuma senaryosu)
 */
export const mockWeatherFetcher: WeatherFetcher = async (location) => ({
  currentTemp: 10,
  forecastAvgTemp: 4,
  trend: "cooling",
  forecastDays: 10,
  source: "mock",
  location: location ?? "default",
});

/**
 * OpenWeatherMap API fetcher (gerçek).
 * API key env'den alınır. Başarısızsa mock'a fallback.
 */
export function createOpenWeatherFetcher(apiKey: string): WeatherFetcher {
  return async (location) => {
    if (!apiKey) {
      logger.warn("ai", "OpenWeather API key yok, mock kullanılıyor");
      return mockWeatherFetcher(location);
    }
    try {
      // Gerçek implementasyon — burada placeholder.
      // Prodüksiyonda fetch() ile OpenWeatherMap API'sine çağrı yapılır.
      // Şimdilik mock döner (gerçek API entegrasyonu ayrı task).
      logger.info("ai", "Weather fetch (mock fallback)", { location });
      return mockWeatherFetcher(location);
    } catch (e) {
      logger.error("ai", "Weather fetch hatası, mock'a dönülüyor", { error: e });
      return mockWeatherFetcher(location);
    }
  };
}

// ── Stateful Engine ──────────────────────────────────────────────────────────

export interface ProactiveCheckResult {
  alerts: ProactiveAlert[];
  message: string;
  weather: WeatherData;
}

export class WeatherProactiveEngine {
  private static instance: WeatherProactiveEngine;
  private fetcher: WeatherFetcher;
  private lastCheck: number = 0;
  private checkCooldown = 1000 * 60 * 60; // 1 saat
  private lastAlerts: ProactiveAlert[] = [];

  private constructor(fetcher?: WeatherFetcher) {
    this.fetcher = fetcher ?? mockWeatherFetcher;
  }

  public static getInstance(): WeatherProactiveEngine {
    if (!WeatherProactiveEngine.instance) {
      WeatherProactiveEngine.instance = new WeatherProactiveEngine();
    }
    return WeatherProactiveEngine.instance;
  }

  public setFetcher(fetcher: WeatherFetcher): void {
    this.fetcher = fetcher;
  }

  /**
   * Hava durumu çek + DB analizi → alert listesi + mesaj.
   * Cooldown varsa atla (son 1 saat içinde kontrol yapıldıysa).
   */
  public async check(db: DB, location?: string, force = false): Promise<ProactiveCheckResult> {
    const now = Date.now();
    if (!force && now - this.lastCheck < this.checkCooldown) {
      logger.info("ai", "Weather check cooldown, atlanıyor");
      return {
        alerts: this.lastAlerts,
        message: generateProactiveMessage(this.lastAlerts),
        weather: { currentTemp: 0, forecastAvgTemp: 0, trend: "stable", forecastDays: 0 },
      };
    }

    const weather = await this.fetcher(location);
    const alerts = analyzeWeatherImpact(weather, db);
    const message = generateProactiveMessage(alerts);

    this.lastCheck = now;
    this.lastAlerts = alerts;

    logger.info("ai", "Weather proactive check tamamlandı", {
      alertCount: alerts.length,
      trend: weather.trend,
    });

    return { alerts, message, weather };
  }

  public getLastAlerts(): ProactiveAlert[] {
    return this.lastAlerts;
  }

  public reset(): void {
    this.lastCheck = 0;
    this.lastAlerts = [];
  }
}

export const weatherProactiveEngine = WeatherProactiveEngine.getInstance();
