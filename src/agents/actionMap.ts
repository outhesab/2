/**
 * Action-Payload type map.
 * PR-D2: AgentRequest generic'i dekoratif kalmaktan kurtarılıyor.
 * Her aksiyon adı için beklenen payload tipi burada tanımlanır.
 * Cast (\`as any\`, \`as Record<string, unknown>\`) ihtiyacı azalır.
 *
 * Kullanım:
 *   import { actionPayload } from '@/agents/types';
 *   const p = actionPayload<'sale_iptal'>(request);
 *   // p artık SaleIptalParams | undefined
 */

import type { YeniSatisParams } from './types';

// ── Satış aksiyonları ────────────────────────────────────────────────────────
export interface SaleIptalParams {
  saleId: string;
}

export interface SaleIadeParams {
  saleId: string;
  quantity?: number | Record<string, number>;
}

export interface SaleFiyatDuzeltParams {
  saleId: string;
  yeniFiyat?: number | Record<string, number>;
  unitPrice?: number | Record<string, number>;
}

// ── Kasa aksiyonları ─────────────────────────────────────────────────────────
export interface KasaIslemParams {
  amount: number;
  kasa: string;
  description?: string;
  category?: string;
}

// ── Cari aksiyonları ────────────────────────────────────────────────────────
export interface CariTahsilatParams {
  cariId: string;
  amount: number;
  kasa: string;
}

export interface CariEkleParams {
  name: string;
  taxNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  type?: 'musteri' | 'tedarikci';
}

// ── Stok aksiyonları ────────────────────────────────────────────────────────
export interface StokGuncelleParams {
  productId: string;
  quantity: number;
  type: 'giris' | 'cikis';
  label?: string;
}

export interface UrunEkleParams {
  name: string;
  category: string;
  cost: number;
  costCurrency: 'TRY' | 'USD' | 'EUR';
  price: number;
  stock: number;
  minStock: number;
  supplierId?: string;
}

// ── DeepSeek aksiyonları ────────────────────────────────────────────────────
export interface DeepSeekAnalizParams {
  soru: string;
  apiKey?: string;
}

export interface DeepSeekOnerParams {
  veri: Record<string, unknown>;
  apiKey?: string;
}

// ── Master map: action → payload type ───────────────────────────────────────
export interface AgentActionMap {
  // satis agent
  yeniSatis: YeniSatisParams;
  satis: YeniSatisParams;
  sale_iptal: SaleIptalParams;
  iptalEt: SaleIptalParams;
  iadeYap: SaleIadeParams;
  sale_iade: SaleIadeParams;
  fiyatDuzelt: SaleFiyatDuzeltParams;
  sale_fiyat_duzelt: SaleFiyatDuzeltParams;

  // kasa agent
  kasa_gelir: KasaIslemParams;
  kasa_gider: KasaIslemParams;

  // cari agent
  cari_tahsilat: CariTahsilatParams;
  cari_ekle: CariEkleParams;

  // stok agent
  stok_guncelle: StokGuncelleParams;
  urun_ekle: UrunEkleParams;

  // deep_seek agent
  analiz: DeepSeekAnalizParams;
  analyze_intent: DeepSeekAnalizParams;
  oner: DeepSeekOnerParams;
}

export type AgentAction = keyof AgentActionMap;

// ── Type-safe payload extractor ─────────────────────────────────────────────
/**
 * Bir AgentRequest'ten action adına göre tip-güvenli payload çıkarır.
 * Action uyuşmazsa undefined döner (cast hatası yerine kontrol).
 *
 * @example
 *   const p = actionPayload(request, 'sale_iptal');
 *   if (p) { // p: SaleIptalParams
 *     console.log(p.saleId);
 *   }
 */
export function actionPayload<K extends AgentAction>(
  request: { action: string; payload?: unknown },
  expectedAction: K,
): AgentActionMap[K] | undefined {
  if (request.action !== expectedAction) return undefined;
  return request.payload as AgentActionMap[K];
}

// ── Helper: any-compatible wrapper for legacy callers ───────────────────────
/**
 * Legacy API uyumluluğu — payload'ı typed olarak çıkartırken
 * agent'lar tarafında kalan \`as any\` kullanımını azaltmak için.
 */
export function payloadOf<K extends AgentAction>(request: { action: string; payload?: unknown }, action: K): AgentActionMap[K] | undefined {
  return actionPayload(request, action);
}
