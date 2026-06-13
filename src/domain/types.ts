import type { Product, Sale, KasaEntry, Cari, DomainEvent } from "@/types";

export interface SaleIntent {
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    cost: number;
  }>;
  payment: "nakit" | "kart" | "havale" | "cari";
  cariId?: string;
  cariName?: string;
  customerName?: string;
  discount?: number;
  discountAmount?: number;
  tahsilat?: number;
  saleDate?: string;
}

export interface StockMovementV2 {
  id?: string;
  productId: string;
  productName: string;
  type: "satis" | "iade";
  amount: number;
  before: number;
  after: number;
}

export interface CashTransaction {
  amount: number;
  type: "gelir" | "gider";
  category: string;
  kasa: string;
  description: string;
  relatedId: string;
}

export interface CariUpdate {
  cariId: string;
  balanceChange: number;
}

export type Intent =
  | { type: "sale"; payload: SaleIntent }
  | { type: "sale_iptal"; payload: { saleId: string } }
  | { type: "sale_iade"; payload: { saleId: string; qty?: number | Record<string, number> } }
  | { type: "sale_fiyat_duzelt"; payload: { saleId: string; yeniFiyat: number | Record<string, number> } }
  | { type: "kasa_gelir"; payload: { amount: number; kasa: string; description: string; category?: string } }
  | { type: "kasa_gider"; payload: { amount: number; kasa: string; description: string; category?: string } }
  | { type: "stok_guncelle"; payload: { productId: string; amount: number; type: "giris" | "cikis"; description?: string } }
  | { type: "urun_ekle"; payload: { productName: string; category?: string; initialStock?: number; unitPrice?: number } }
  | { type: "cari_tahsilat"; payload: { cariId: string; amount: number; kasa: string } }
  | { type: "cari_ekle"; payload: { name: string; taxNumber?: string; email?: string; phone?: string; address?: string } };

export interface DBUpdates {
  products?: Array<{ id: string; newStock: number }>;
  kasa?: KasaEntry[];
  cari?: CariUpdate[];
  newProduct?: Product;
  newCari?: Cari;
  sale?: Sale;
}

export interface IntentResult {
  ok: boolean;
  error?: string;
  data?: {
    dbUpdates: DBUpdates;
    events: DomainEvent[];
  };
}
