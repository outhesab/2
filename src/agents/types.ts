import type { DB } from '@/types';

export type AgentId = 'stok' | 'kasa' | 'cari' | 'satis' | 'fatura' | 'rapor' | 'deep_seek';

export type AgentPermission =
  | 'stok.read'
  | 'stok.write'
  | 'kasa.read'
  | 'kasa.write'
  | 'cari.read'
  | 'cari.write'
  | 'satis.read'
  | 'satis.write'
  | 'fatura.read'
  | 'fatura.write'
  | 'rapor.read'
  | 'deep_seek.read'
  | 'deep_seek.write';

export interface AgentRequest<P = any> {
  action: string;
  payload?: P;
  meta?: Record<string, unknown>;
}

export interface AgentResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface AgentContext {
  getDB: () => DB;
  save: (updater: (prev: DB) => DB) => void;
}

export interface YeniSatisParams {
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    cost: number;
    total: number;
  }>;
  cariId: string;
  payment: 'nakit' | 'kart' | 'havale' | 'cari';
  discount?: number;
  discountAmount?: number;
  tahsilat?: number;
  saleDate?: string;
}

export interface SatisSonuc {
  saleId: string;
  total: number;
  profit: number;
}

export interface AgentEvent {
  from: AgentId;
  type: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}
