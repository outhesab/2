import type { Supplier } from '@/types';

export const emptySupplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  category: '',
  taxNo: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  note: '',
  totalOrders: 0,
  totalAmount: 0,
};

export type CatFilter = 'hepsi' | 'genel' | 'pelet' | 'boru';
export const CAT_FILTERS: CatFilter[] = ['hepsi', 'genel', 'pelet', 'boru'];

export interface SupplierWithCat {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  category?: string;
  totalOrders: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  _kat: 'genel' | 'pelet' | 'boru';
}

export const catColors: Record<string, string> = {
  genel: '#ff5722',
  pelet: '#f59e0b',
  boru: '#3b82f6',
};

export const catLabels: Record<string, string> = {
  genel: '🏭 Genel',
  pelet: '🌾 Pelet',
  boru: '🔧 Boru',
};

export const statusColors: Record<string, string> = {
  bekliyor: '#f59e0b',
  yolda: '#3b82f6',
  tamamlandi: '#10b981',
  iptal: '#ef4444',
};

export const statusLabels: Record<string, string> = {
  bekliyor: '⏳ Bekliyor',
  yolda: '🚚 Yolda',
  tamamlandi: '✓ Tamamlandı',
  iptal: '✕ İptal',
};
