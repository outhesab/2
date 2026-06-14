import type { DB } from '@/types';

export interface RestoreReport {
  added: number;
  skippedDuplicate: number;
  skippedInvalidName: number;
  skippedMissingField: number;
  warnings: string[];
}

export type ConflictResolution = 'overwrite' | 'skip' | 'merge';

export interface ConflictInfo {
  entity: string;
  label: string;
  byId: number;
  byName: number;
  total: number;
}

export interface CsvColumnMapping {
  csvColumn: string;
  targetEntity: string;
  targetField: string;
  autoDetected: boolean;
}

export const RESTORE_SECTIONS = [
  { key: 'products', label: 'Ürünler', icon: '📦' },
  { key: 'sales', label: 'Satışlar', icon: '🛒' },
  { key: 'suppliers', label: 'Tedarikçiler', icon: '🏭' },
  { key: 'cari', label: 'Cari Hesaplar', icon: '👤' },
  { key: 'kasa', label: 'Kasa İşlemleri', icon: '💰' },
  { key: 'bankTransactions', label: 'Banka İşlemleri', icon: '🏦' },
  { key: 'invoices', label: 'Faturalar', icon: '🧾' },
  { key: 'orders', label: 'Siparişler', icon: '📋' },
  { key: 'stockMovements', label: 'Stok Hareketleri', icon: '📊' },
  { key: 'peletSuppliers', label: 'Pelet Tedarikçi', icon: '🪵' },
  { key: 'peletOrders', label: 'Pelet Sipariş', icon: '🪵' },
  { key: 'boruSuppliers', label: 'Boru Tedarikçi', icon: '🔩' },
  { key: 'boruOrders', label: 'Boru Sipariş', icon: '🔩' },
  { key: 'budgets', label: 'Bütçe', icon: '📊' },
  { key: 'returns', label: 'İadeler', icon: '↩️' },
  { key: 'company', label: 'Şirket Bilgileri', icon: '🏢', isObject: true },
  { key: 'pelletSettings', label: 'Pelet Ayarları', icon: '⚙️', isObject: true },
] as const;

export const KNOWN_ARRAYS: Record<string, string> = {
  products: 'Ürünler',
  sales: 'Satışlar',
  suppliers: 'Tedarikçiler',
  cari: 'Cari Müşteriler',
  kasa: 'Kasa Hareketleri',
  bankTransactions: 'Banka İşlemleri',
  orders: 'Siparişler',
  invoices: 'Faturalar',
  stockMovements: 'Stok Hareketleri',
  peletSuppliers: 'Pelet Tedarikçi',
  peletOrders: 'Pelet Sipariş',
  boruSuppliers: 'Boru Tedarikçi',
  boruOrders: 'Boru Sipariş',
  budgets: 'Bütçe',
  returns: 'İadeler',
  ortakEmanetler: 'Ortak Emanet',
  installments: 'Taksitler',
};

export const LEGACY_FIELD_MAP: Record<string, string> = {
  urunler: 'products',
  satislar: 'sales',
  tedarikci: 'suppliers',
  musteriler: 'cari',
  kasaHareketleri: 'kasa',
  bankHareketleri: 'bankTransactions',
  siparisler: 'orders',
  faturalar: 'invoices',
  stokHareketleri: 'stockMovements',
  stoklar: 'products',
  musteri: 'cari',
  tedarikcilar: 'suppliers',
  kasaIslemleri: 'kasa',
};

export const CSV_COLUMN_MAP: Record<string, { target: string; field: string }> = {
  'müşteri': { target: 'cari', field: 'name' },
  'musteri': { target: 'cari', field: 'name' },
  'müşteri adı': { target: 'cari', field: 'name' },
  'ad': { target: 'cari', field: 'name' },
  'isim': { target: 'cari', field: 'name' },
  'ad soyad': { target: 'cari', field: 'name' },
  'telefon': { target: 'cari', field: 'phone' },
  'tel': { target: 'cari', field: 'phone' },
  'adres': { target: 'cari', field: 'address' },
  'bakiye': { target: 'cari', field: 'balance' },
  'borç': { target: 'cari', field: 'balance' },
  'borc': { target: 'cari', field: 'balance' },
  'tarih': { target: '_date', field: 'createdAt' },
  'date': { target: '_date', field: 'createdAt' },
  'tutar': { target: '_amount', field: 'amount' },
  'toplam': { target: '_amount', field: 'total' },
  'fiyat': { target: '_amount', field: 'price' },
  'ürün': { target: 'products', field: 'name' },
  'urun': { target: 'products', field: 'name' },
  'ürün adı': { target: 'products', field: 'name' },
  'stok': { target: 'products', field: 'stock' },
  'maliyet': { target: 'products', field: 'cost' },
  'satış fiyatı': { target: 'products', field: 'price' },
  'kategori': { target: '_category', field: 'category' },
  'açıklama': { target: '_desc', field: 'description' },
  'aciklama': { target: '_desc', field: 'description' },
  'not': { target: '_desc', field: 'note' },
  'e-posta': { target: 'cari', field: 'email' },
  'email': { target: 'cari', field: 'email' },
};

export const ARRAY_KEYS = [
  'products', 'sales', 'suppliers', 'orders', 'cari', 'kasa',
  'bankTransactions', 'matchRules', 'monitorRules', 'monitorLog',
  'stockMovements', 'peletSuppliers', 'peletOrders', 'boruSuppliers',
  'boruOrders', 'invoices', 'budgets', 'returns', '_activityLog',
  'ortakEmanetler', 'installments', 'partners', 'notes',
] as const;

export type { DB };
