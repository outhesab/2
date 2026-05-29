# PARSPEL — Veri Modeli / Şema

> Versiyon: 3.7.0 | Tarih: 29 Mayıs 2026

## 1. Kök Veritabanı Nesnesi (`DB`)

Tüm uygulama state'i tek bir `DB` nesnesinde toplanır. Bu nesne `localStorage` (birincil), IndexedDB (snapshot yedek) ve Firebase Firestore (bulut senkron) arasında dolaşır.

```
DB {
  _version: number;           // Her kayıtta artan versiyon, çakışma çözümü için
  _lastSyncAt?: string;       // Son senkron zamanı (ISO)
  _auditLog: AuditEntry[];    // Denetim kaydı (max 500)
  _activityLog: ActivityLog[]; // Aktivite kaydı (max 200)

  // ─── Çekirdek İşletme Verileri ───
  products: Product[];
  productCategories: ProductCategory[];
  sales: Sale[];
  suppliers: Supplier[];
  orders: Order[];
  cari: Cari[];
  kasa: KasaEntry[];
  kasalar: Kasa[];
  stockMovements: StockMovement[];

  // ─── Finans ───
  invoices: Invoice[];
  installments: Installment[];
  budgets: BudgetCategory[];
  bankTransactions: BankTransaction[];

  // ─── Özel Tedarik ───
  peletSuppliers: PeletSupplier[];
  peletOrders: PeletOrder[];
  boruSuppliers: BoruSupplier[];
  boruOrders: BoruOrder[];
  pelletSettings: {
    gramaj: number; kgFiyat: number;
    cuvalKg: number; critDays: number;
  };

  // ─── İş Ortaklığı ───
  partners: Partner[];
  ortakEmanetler: OrtakEmanet[];

  // ─── Sistem ───
  monitorRules: MonitorRule[];
  monitorLog: MonitorLog[];
  matchRules: unknown[];
  returns: unknown[];
  company: Company;
  settings: Record<string, unknown>;
  notes: Note[];
}
```

## 2. Tablo Şemaları ve İlişkiler

```
┌─────────────────────────────────────────────────────────────────┐
│  ÜRÜN (Product)                                                 │
├─────────────────────────────────────────────────────────────────┤
│  id*: string         — PK, genId() ile oluşturulur              │
│  name: string        — Ürün adı                                 │
│  category: string    — FK → productCategories.id                │
│  supplierId?: string — FK → suppliers.id (opsiyonel)           │
│  brand?: string      │
│  cost: number        — Alış fiyatı                              │
│  price: number       — Satış fiyatı                             │
│  stock: number       — Güncel stok miktarı                      │
│  minStock: number    — Minimum stok uyarı eşiği                  │
│  barcode?: string    │
│  deleted?: boolean   — Soft delete                               │
│  createdAt/updatedAt: string (ISO)                               │
└──────────────┬──────────────────────────────────────────────────┘
               │ 1
               │
    ┌──────────┴──────────┐
    │                     │ *
    │           ┌─────────┴────────────────────────────────────────┐
    │           │  STOK HAREKETİ (StockMovement)                    │
    │           ├──────────────────────────────────────────────────┤
    │           │  id*: string       — PK                          │
    │           │  productId: string — FK → Product.id             │
    │           │  type: 'satis'|'iade'|'giris'|'cikis'|'duzeltme'│
    │           │  amount: number    — Miktar                      │
    │           │  before/after: number — Önceki/sonraki stok      │
    │           │  date: string      │
    └─ 1        └──────────────────────────────────────────────────┘
       │
       │ *
  ┌────┴──────────────────────────────────────────────────────────┐
  │  SATIŞ (Sale)                                                  │
  ├────────────────────────────────────────────────────────────────┤
  │  id*: string            — PK                                  │
  │  cariId?: string        — FK → Cari.id (opsiyonel)            │
  │  cariName?: string      — Cari adı (denormalize)              │
  │  items: SaleItem[]      — Ürün listesi                         │
  │  │  productId: string   — FK → Product.id                     │
  │  │  productName, qty, unitPrice, cost, total                  │
  │  total: number          — Toplam                              │
  │  discount/discountAmount: number                              │
  │  profit: number         — Kâr (hesaplanmış)                   │
  │  payment: 'nakit'|'kart'|'havale'|'cari'                     │
  │  status: 'tamamlandi'|'iade'|'iptal'|'completed'              │
  │  createdAt/updatedAt: string (ISO)                             │
  └────┬──────────────────────────────────────────────────────────┘
       │
       │ 1 (isteğe bağlı)
  ┌────┴──────────────────────────────────────────────────────────┐
  │  CARİ (Cari) — Müşteri/Tedarikçi                              │
  ├────────────────────────────────────────────────────────────────┤
  │  id*: string             — PK                                 │
  │  name: string                                                 │
  │  type: 'musteri'|'tedarikci'                                   │
  │  ortak?: boolean         — İş ortağı mı?                      │
  │  partnerId?: string      — FK → Partner.id (opsiyonel)       │
  │  balance: number         — Güncel bakiye                      │
  │  taxNo, phone, email, address?: string                        │
  │  deleted?: boolean       — Soft delete                         │
  └───────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────┐
  │  KASA HAREKETİ (KasaEntry)                                    │
  ├───────────────────────────────────────────────────────────────┤
  │  id*: string           — PK                                   │
  │  type: 'gelir'|'gider'                                        │
  │  category: string      — Kategori                             │
  │  amount: number        — Tutar                                │
  │  kasa: string          — FK → Kasalar.id                      │
  │  cariId?: string       — FK → Cari.id (opsiyonel)             │
  │  relatedId?: string    — İlişkili işlem ID'si                 │
  │  deleted?: boolean     — Soft delete                           │
  │  createdAt/updatedAt: string (ISO)                             │
  └───────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────┐
  │  KASALAR (Kasa) — Sabit kasa tanımları                       │
  ├───────────────────────────────────────────────────────────────┤
  │  Varsayılan: nakit, banka, pos_ziraat, pos_is, pos_yk        │
  │  id: string | name: string | icon: string                     │
  └───────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────┐
  │  FATURA (Invoice)                                             │
  ├───────────────────────────────────────────────────────────────┤
  │  id*: string                                                  │
  │  invoiceNo: string       — Otomatik sıra numarası             │
  │  type: 'satis'|'alis'                                         │
  │  cariId?: string          — FK → Cari.id                      │
  │  items: InvoiceItem[]    — description, qty, unitPrice,      │
  │  │                          vatRate, total                    │
  │  subtotal, vatTotal, discount, total: number                 │
  │  payment: string                                              │
  │  status: 'taslak'|'onaylandi'|'odendi'|'iptal'                │
  │  dueDate?: string        — Vade tarihi                        │
  │  saleId?: string         — FK → Sale.id (opsiyonel)          │
  └───────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────┐
  │  TEDARİKÇİ (Supplier)                                         │
  ├───────────────────────────────────────────────────────────────┤
  │  id*, name, category, taxNo, contact, phone, email,          │
  │  totalOrders, totalAmount, deleted?, createdAt, updatedAt    │
  └───────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────┐
  │  SİPARİŞ (Order)                                              │
  ├───────────────────────────────────────────────────────────────┤
  │  id*, supplierId (FK), items[], amount, nakliye,             │
  │  paidAmount, remainingAmount, payments[],                     │
  │  status: 'bekliyor'|'yolda'|'tamamlandi'|'iptal'             │
  └───────────────────────────────────────────────────────────────┘
```

## 3. IndexedDB (Dexie) — Yedek / Snapshot Katmanı

| Tablo | Anahtar | İçerik |
|-------|---------|--------|
| `urunler` | id, name, category, stock | Ürünler |
| `satislar` | id, createdAt, total, payment, cariId | Satışlar |
| `stokHareketleri` | id, productId, type, date | Stok hareketleri |
| `kasaHareketleri` | id, kasa, type, amount | Kasa giriş/çıkış |
| `cariler` | id, name, type, balance | Cari hesaplar |
| `faturalar` | id, invoiceNo, cariId, total, status | Faturalar |
| `activityLog` | id, action, time | Aktivite kaydı |
| `auditLog` | id, agent, islem, timestamp | Agent denetim kaydı |
| `snapshots` | id, updatedAt | DB snapshot (yedek) |

## 4. Depolama Hiyerarşisi

```
localStorage (birincil, hızlı)
  └─ "sobaYonetim" key → tüm DB JSON
  └─ "sobaYonetim_*" prefix → UI tercihleri, favoriler, setup durumu

IndexedDB (yedek, büyük veri)
  └─ ParspelDB.snapshots → otomatik snapshot (her save()'de)
  └─ ParspelDB.urunler/satislar/... → agent audit kayıtları

Firebase Firestore (bulut senkron, opsiyonel)
  └─ Veriler koleksiyonu → { db: DB, updatedAt, _version }
  └─ Yedekler koleksiyonu → versiyonlu yedekler (max 20)
  └─ Kullanıcılar koleksiyonu → PBKDF2 hash'li kullanıcılar
  └─ baglantiAyarları dokümanı → Firebase/Supabase config
  └─ uiPrefs dokümanı → Tema tercihleri
```
