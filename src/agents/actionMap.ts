/**
 * Action-Payload type map.
 * PR-D2 + R3-4: AgentActionMap tüm action'lar ve payload tipleri için
 * merkezi tür haritası. BaseAgent.handle<K>() buradan tiplenir.
 *
 * Not: Bazı action'ların hem Türkçe hem İngilizce alias'ı vardır
 * (ör. iptalEt/sale_iptal). Kanonik isim Türkçe'dir; her iki form da
 * kod tabanında kullanıldığı için interface'te tutulur.
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
