import type { SaleItem, DomainEvent } from "@/types";

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
  productId: string;
  productName: string;
  type: "satis" | "iade";
  amount: number;
  before: number;
  after: number;
}

export interface CashTransaction {
  amount: number;
  type: "gelir";
  category: "satis";
  kasa: string;
  description: string;
  relatedId: string;
}

export interface CariUpdate {
  cariId: string;
  balanceChange: number;
}

export interface SaleResult {
  sale: {
    id: string;
    cariId?: string;
    cariName?: string;
    customerName?: string;
    productId?: string;
    productName: string;
    productCategory?: string;
    quantity: number;
    unitPrice: number;
    cost: number;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    discountAmount: number;
    total: number;
    profit: number;
    payment: string;
    status: "tamamlandi" | "completed";
    createdAt: string;
    updatedAt: string;
  };
  stockMovements: StockMovementV2[];
  cashTransaction: CashTransaction | null;
  cariUpdate: CariUpdate | null;
  events: DomainEvent[];
}

export type Intent =
  | { type: "sale"; payload: SaleIntent }
  | { type: "kasa_gelir"; payload: { amount: number; kasa: string; description: string; category?: string } }
  | { type: "kasa_gider"; payload: { amount: number; kasa: string; description: string; category?: string } }
  | { type: "cari_tahsilat"; payload: { cariId: string; amount: number; kasa: string } };

export interface IntentResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
