# PARSPEL — Sistem Bağlam Dokümanı

> Bu doküman, PARSPEL (Soba Yönetim Sistemi) projesinin eksiksiz bağlamını
> başka bir yapay zekâya aktarmak için hazırlanmıştır.
> Tarih: 26 Mayıs 2026 | Versiyon: 3.2.0

---

## İçindekiler

1. [Veri Modeli / Şema](#1-veri-modeli--şema)
2. [Kullanıcı Senaryoları](#2-kullanıcı-senaryoları)
3. [API / Servis Katmanı](#3-api--servis-katmanı)
4. [Agent Rolleri ve Orchestration](#4-agent-rolleri-ve-orchestration)
5. [Performans Hedefleri ve Yapılandırma](#5-performans-hedefleri-ve-yapılandırma)
6. [UI/UX Akışları ve Wireframe Açıklamaları](#6-uiux-akışları-ve-wireframe-açıklamaları)

---

## 1. Veri Modeli / Şema

### 1.1 Kök Veritabanı Nesnesi (`DB`)

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

### 1.2 Tablo Şemaları ve İlişkiler

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

### 1.3 IndexedDB (Dexie) — Yedek / Snapshot Katmanı

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

### 1.4 Depolama Hiyerarşisi

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

---

## 2. Kullanıcı Senaryoları

### Senaryo 1: Müşteri Soba Satın Alır (Nakit)

```
1. Kullanıcı "Hızlı Satış" butonuna tıklar
2. Ürün: "Model X Soba" seçilir (stok: 5, fiyat: 15.000 ₺)
3. Miktar: 1, Ödeme: Nakit
4. Sistem:
   a. SatisAgent.yeniSatis() → Sale kaydı oluşturur
   b. StokAgent → stok 5→4 düşer, StockMovement kaydedilir
   c. KasaAgent → Nakit kasasına 15.000 ₺ gelir eklenir
   d. RaporAgent → Aktivite kaydı oluşturur
5. Rule Engine: stok ≥ 0 ✔, kasa ≥ 0 ✔, tutar > 0 ✔
6. Audit Engine: diff kaydedilir
7. localStorage güncellenir, IndexedDB snapshot alınır
8. 1.2sn sonra Firebase senkron
```

### Senaryo 2: Müşteri Cari Hesaba Soba Alır (Vadeli)

```
1. Kullanıcı Satış sayfasından "Ahmet Pel" müşterisi seçilir
2. Ürün: "P Remix Soba", Miktar: 2, Toplam: 30.000 ₺
3. Ödeme: Cari (vadeli)
4. Müşteri peşinat olarak 5.000 ₺ nakit verir
5. Sistem:
   a. SatisAgent → Sale (30.000 ₺, cariId bağlı)
   b. StokAgent → stok düşer
   c. KasaAgent → Nakit kasası +5.000 ₺ (tahsilat)
   d. CariAgent → Cari.balance 0→25.000 ₺ artar
   e. FaturaAgent → Fatura (taslak, 30.000 ₺) oluşturulur
   f. RaporAgent → log kaydı
6. Kullanıcı faturayı "onaylandı" yapar
```

### Senaryo 3: Gün Sonu Kasa Sayımı ve Anomali Tespiti

```
1. Kullanıcı Dashboard → "Kasa Sayım" butonuna tıklar
2. Kasa sayım penceresi açılır: her kasa için (Nakit, Banka, POS...)
3. Kullanıcı fiziki bakiyeleri girer
4. Sistem:
   a. Hesaplanan bakiye ile girilen bakiye karşılaştırılır
   b. Fark varsa düzeltme kaydı oluşturulur
   c. AnomalyEngine: olağandışı farklar tespit edilirse uyarı
5. Kullanıcı farkı kabul eder / reddeder
```

### Senaryo 4: Firebase Bağlantısı ve Bulut Senkron

```
1. Kullanıcı Entegrasyonlar sayfasına gider
2. Firebase API anahtarlarını girer (veya .env'den otomatik yüklenir)
3. Sistem:
   a. connConfig localStorage'a kaydedilir
   b. Firebase Firestore bağlantısı test edilir
   c. Start sync → her save()'den 1.2sn sonra debounce ile Firestore'a yazar
   d. Sync durumu header'da gösterilir (idle/saving/saved/error/loading)
4. İkinci cihazda oturum açılınca:
   a. loadFromFirebase() en yüksek _version'ı çeker
   b. Bulut verisi daha güncelse → localStorage ve IndexedDB güncellenir
```

### Senaryo 5: Tedarikçi Siparişi ve Stok Girişi

```
1. Tedarikçi sayfası → Yeni Sipariş
2. Tedarikçi: "Kömürcü A.Ş.", Ürün: "Model X Soba", Miktar: 10
3. Sipariş durumu: "bekliyor"
4. Sipariş gelince → "tamamlandı" yapılır
5. Sistem:
   a. StokAgent → 10 adet stok girişi
   b. StockMovement kaydedilir
   c. Sipariş "tamamlandı"
6. Ödeme: KasaAgent → Banka kasasından tedarikçi ödemesi düşer
7. CariAgent → Tedarikçi bakiyesi güncellenir
```

### Senaryo 6: Yedekten Geri Yükleme

```
1. Dashboard → Yedekler → Listeden bir yedek seçilir
2. Sistem:
   a. Otomatik olarak MEVCUT durumun yedeğini alır (önlem)
   b. Seçilen yedeği Firebase'den çeker
   c. fullRestoreDB() ile default DB şemasına merge eder
   d. localStorage, IndexedDB, Firebase üçüne de yazar
3. Kullanıcıya RestoreReport gösterilir (kaç kayıt geldi, referans hataları)
```

---

## 3. API / Servis Katmanı

PARSPEL **client-side bir uygulamadır**. REST/GraphQL sunucusu yoktur. Tüm iş mantığı doğrudan React hook'ları ve fonksiyonlar üzerinden çalışır. Aşağıdaki "endpoint" tanımları, `useDB().save()` çağrılarına karşılık gelen işlemlerdir.

### 3.1 Çekirdek Veri İşlemleri (useDB hook)

```
useDB() → { db, save, saveGuarded, saveWithLog, undo, exportJSON, importJSON,
            getKasaBakiye, getTotalKasa, manualBackup, listBackups, restoreBackup }

// Tüm mutasyonlar şu pattern ile çalışır:
save((prevDB: DB) => {
  // prevDB'yi mutasyona uğrat (immutable)

  return { ...prevDB, products: [...prevDB.products, newProduct] };
});
```

### 3.2 Kural Motoru (Rule Engine)

```
validateTransaction(prevDB, nextDB) → RuleViolation[]

Kurallar (src/lib/ruleEngine.ts):
┌─────────────────────┬───────────┬────────────────────────────────┐
│ Kural               │ Severity  │ Açıklama                       │
├─────────────────────┼───────────┼────────────────────────────────┤
│ negative_stock      │ block     │ Stok negatife düşemez          │
│ negative_kasa       │ block     │ Kasa bakiyesi negatif olamaz   │
│ duplicate_transaction│ warn     │ Son 60sn aynı işlem tekrarı   │
│ zero_amount         │ block     │ Tutar > 0 olmalı               │
└─────────────────────┴───────────┴────────────────────────────────┘

TRANSACTION_LIMIT = 100.000 ₺ (aşım → HIGH anomali)
DUPLICATE_WINDOW_MS = 60.000 (1 dk)
RULE_TIMEOUT_MS = 50 (tüm kurallar için maks 50ms)
```

### 3.3 Denetim Motoru (Audit Engine)

```
createAuditEntry({action, entity, prevDB, nextDB, status, violations}) → AuditEntry
  - computeDiff(prevDB, nextDB) → {prevValue, nextValue} (sadece değişen alanlar)
  - sessionStorage UUID ile session tracking
  - trimAuditLog() → max 500 kayıt

runFullAudit(db) → AuditReport
  - Kasa bakiyesi yeniden hesaplama (recomputeStateFromHistory)
  - Cari bakiye tutarsızlığı drift tespiti
  - Onaysız işlem tespiti (son 24 saat)
  - TRANSACTION_LIMIT aşımı tespiti
```

### 3.4 Anomali Motoru (Anomaly Engine)

```
runAnomalyDetection(db) → AnomalyReport { anomalies[], healthScore }

8 dedektör:
┌─────────────────────┬────────────────────────────────────────────────┐
│ Dedektör             │ Tespit Ettiği                                │
├─────────────────────┼────────────────────────────────────────────────┤
│ zeroPriceSales      │ Fiyatı 0 olan satışlar                       │
│ zeroQuantitySales   │ Miktarı 0 olan satışlar                      │
│ abnormalAmounts     │ Ortalamanın 3σ üzerinde tutarlar              │
│ stockConsistency    │ Stok vs satış tutarsızlığı                    │
│ suspiciousKasa      │ Olağandışı kasa işlemleri                     │
│ cariBalanceAnomalies│ Cari bakiyedeki sıçramalar                    │
│ negativeProfit      │ Negatif kâr detoksu                           │
│ orphanRecords       │ Sahipsiz kayıtlar (silinmiş ürüne referans)   │
└─────────────────────┴────────────────────────────────────────────────┘
```

### 3.5 Veri Bütünlüğü (Data Integrity Checker)

```
checkAll(db) → string[]
  - Stok tutarlılık: products.stock == hesaplanan stok
  - Kasa tutarlılık: her kasa için bakiye doğrulama
  - Cari bakiye: Sale + KasaEntry vs Cari.balance
  - Satış-kasa eşleme: Sale.total vs KasaEntry.amount
  - Sipariş-tedarikçi referans bütünlüğü
  - Fatura-taksit eşleme
  - Veri kalitesi: boş alan, negatif değer, sıfır fiyat kontrolü
  - localStorage boyut izleme (uyarı: 4MB+, kritik: 4.5MB+)
```

### 3.6 Firebase Servis Katmanı

```
src/lib/firebase.ts:
  readDoc(collection, id) → T | null
  writeDoc(collection, id, data) → void
  listDocs(collection) → T[]
  removeDoc(collection, id) → void
  (Tümü try/catch içinde, hata → fail-silent, uygulama çökmez)

src/hooks/db/sync.ts:
  saveToFirebase(db) → debounce 1.2sn, version kontrolü
  loadFromFirebase() → cloud DB, en yüksek _version seçilir
  onSyncStatus(listener) → subscribe idle/saving/saved/error/loading
```

### 3.7 AI Servis Katmanı

```
src/lib/deepseek.ts:
  askDeepSeek(systemPrompt, userMessage, mode?) → Response
  - 'deepseek-chat' ve 'deepseek-reasoner' modelleri
  - Streaming destekli

src/lib/aiApi.ts:
  askClaude(systemPrompt, userMessage) → Response
  askGemini(systemPrompt, userMessage) → Response

src/lib/aiActions.ts (603 satır):
  parseAIResponse(text) → AIAction[]
  validateAction(action) → boolean
  applyAction(action, db) → DB
  fallbackChain(action, db) → revisedAction
  // AI'nın ürettiği DB mutasyonlarını parse eder, doğrular, uygular

src/lib/aiOffline.ts (489 satır):
  offlineReply(userMessage, db) → string
  buildContext(db) → string (DB özeti AI prompt'u için)
  // İnternet yokken AI yanıtı üretir (pattern eşleştirme + template)
```

### 3.8 Raporlama Servisleri

```
src/lib/excelExport.ts:
  exportToExcel(type: 'stock'|'sales'|'cari'|'kasa', db, filters?) → void
  - ExcelJS ile .xlsx oluşturur
  - Tarih aralığı filtreleme

src/lib/safeXlsx.ts (242 satır):
  parseExcelSafe(file) → ParsedData
  - Limitler: 5MB, 8 sheet, 5000 satır, 120 kolon
  - CSV/XLSX/JSON/XML formatları

src/lib/notificationEngine.ts (135 satır):
  generateNotifications(db) → Notification[]
  - Stok tükendi/düşük, kasa düşük, cari yüksek bakiye,
    sipariş gecikmesi, fatura vade uyarısı
```

---

## 4. Agent Rolleri ve Orchestration

### 4.1 Mimarî

```
src/agents/
├── BaseAgent.ts      # Soyut sınıf — bagla(), yetkiKontrolu(), yayinla()
├── AgentBus.ts       # mitt event emitter singleton
├── index.ts          # Agent registry (lazy singleton factory)
├── orchestrator.ts   # planAgentFlow(), dispatchAgentFlow()
├── types.ts          # AgentId, AgentPermission, AgentRequest/Response
├── SatisAgent.ts     # Satış işlemleri (372 satır)
├── StokAgent.ts      # Stok güncelleme
├── KasaAgent.ts      # Kasa hareketleri
├── CariAgent.ts      # Cari hesap yönetimi
├── FaturaAgent.ts    # Fatura oluşturma
├── RaporAgent.ts     # Raporlama / aktivite kaydı
├── DeepSeekAgent.ts  # AI destekli analiz (146 satır)
├── baseAgent.test.ts # BaseAgent testi
└── AGENTS.md         # Dokümantasyon

stores/
└── agentStore.ts     # Zustand: activeAgent, busy, lastEvent
```

### 4.2 AgentId'ler ve İzinler

```
AgentId: "stok" | "kasa" | "cari" | "satis" | "fatura" | "rapor" | "deep_seek"

AgentPermission: "{agentId}.{read|write}"
  Örn: stok.read, stok.write, kasa.read, kasa.write
```

### 4.3 Agent Orchestration — Flow Şeması

```
┌─────────────────────────────────────────────────────────────────────┐
│  SATIŞ AKIŞI                                                        │
│                                                                     │
│  satis → stok → kasa (nakit/kart ise) → cari (vadeli ise)         │
│       → fatura (opsiyonel) → rapor                                  │
│                                                                     │
│  Adım 1: SatisAgent.yeniSatis()                                     │
│    - Sale kaydı oluşturur                                           │
│    - AgentBus.emit('satis', 'sale_created', {sale})                 │
│                                                                     │
│  Adım 2: StokAgent (dinler: sale_created)                           │
│    - Her SaleItem için stok düşer                                   │
│    - StockMovement kaydedilir                                       │
│    - AgentBus.emit('stok', 'stock_updated', {productId, qty})       │
│                                                                     │
│  Adım 3a: KasaAgent (nakit/kart ise)                                │
│    - KasaEntry ekler (gelir)                                        │
│    - AgentBus.emit('kasa', 'entry_created', {entry})                │
│                                                                     │
│  Adım 3b: CariAgent (vadeli ise)                                    │
│    - Cari.balance += total                                         │
│    - AgentBus.emit('cari', 'balance_updated', {cariId, amount})     │
│                                                                     │
│  Adım 4: FaturaAgent (opsiyonel)                                    │
│    - Invoice oluşturur (taslak)                                     │
│                                                                     │
│  Adım 5: RaporAgent                                                 │
│    - Aktivite kaydı, istatistik güncelleme                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  KASA GELİR/GİDER AKIŞI                                            │
│  kasa → rapor                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STOK GÜNCELLEME / ÜRÜN EKLEME AKIŞI                               │
│  stok → rapor                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CARİ TAHSİLAT / CARİ EKLEME AKIŞI                                  │
│  cari → rapor                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.4 Agent Sorumlulukları

| Agent | Görevi | Önemli Metotlar |
|-------|--------|-----------------|
| **SatisAgent** | Satış yaşam döngüsü (oluşturma, iptal, iade, fiyat düzeltme) | `yeniSatis(params)`, `iptalEt(saleId)`, `iadeYap(saleId)`, `fiyatDuzelt(saleId)` |
| **StokAgent** | Stok seviyesi güncelleme, hareket kaydı | `stokGuncelle(productId, miktar, tip)` |
| **KasaAgent** | Kasa giriş/çıkış, bakiye yönetimi | `kasaGelirGider(params)`, `bakiyeSorgula(kasaId)` |
| **CariAgent** | Cari bakiye güncelleme, yeni cari oluşturma | `cariGuncelle(cariId, tutar)`, `cariEkle(params)` |
| **FaturaAgent** | Fatura oluşturma (satış sonrası) | `faturaOlustur(sale)` |
| **RaporAgent** | Aktivite kaydı, istatistik toplama | `raporKaydet(action, detail)` |
| **DeepSeekAgent** | AI analiz, öneri üretme, DB bağlamı ile | `analizYap(soru, db)`, `oneriGetir(db)` |

### 4.5 İletişim Modeli

```
AgentBus (mitt singleton):
  - agentBus.emit(from: AgentId, type: string, payload?: object)
  - agentBus.on(type: string, handler: (event: AgentEvent) => void)
  - AgentEvent: { from, type, payload?, createdAt }

BaseAgent:
  - bagla(ctx: AgentContext) → { getDB, save } atar
  - yayinla(type, payload) → AgentBus.emit()
  - onEvent(handler) → AgentBus.on()

Orchestrator:
  - planAgentFlow(actionType) → AgentId[] (sıralı ajan listesi)
  - dispatchAgentFlow(actionType, payload) → void (sırayla dispatch)
```

---

## 5. Performans Hedefleri ve Yapılandırma

### 5.1 Bundle Yapılandırması (Vite + manualChunks)

```
src/lib/vite-manual-chunks.ts:
  vendor    → react, react-dom          (235 KB)
  capacitor → @capacitor/*              (27 KB)
  radix     → @radix-ui/*               (65 KB)
  charts    → recharts, d3-*            (385 KB)
  animations→ framer-motion             (129 KB)
  icons     → lucide-react               (13 KB)
  firebase  → firebase                  (163 KB)
  excel     → xlsx                       (—)
  ui        → sonner                     (34 KB)
  default   → inde                       (245 KB)
```

### 5.2 Build Hedefleri

| Metrik | Hedef | Güncel | Not |
|--------|-------|--------|-----|
| Ana JS bundle (index) | < 300 KB | 245 KB | ✅ |
| Toplam JS | < 3.5 MB | ~3.0 MB | ✅ |
| Lazy-load threshold | > 50 KB | exceljs 1 MB | ⚠️ eval CSP sorunu |
| Chunk sayısı | < 15 | ~10 | ✅ |
| İlk paint | < 2sn | - | PWA + precache |
| Firebase bağımlılık | Ayrı chunk | 163 KB | ✅ Parallel yüklenir |
| Lighthouse Puanı | > 85 | - | PWA yeni aktif |

### 5.3 PWA Yapılandırması

```
vite.config.ts (VitePWA plugin):
  registerType: "autoUpdate"
  workbox:
    globPatterns: **/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}
    navigateFallback: "/"
    runtimeCaching:
      - Google Fonts: CacheFirst, 1 yıl, max 10 entry
      - GStatic Fonts: CacheFirst, 1 yıl, max 10 entry
      - Firebase Firestore: NetworkOnly
  manifest:
    name: "PARSPEL — Soba Yönetim Sistemi"
    display: standalone
    theme_color: "#0a0e27"
```

### 5.4 Optimizasyon Stratejisi

```
1. Lazy Loading:
   - Tüm sayfalar React.lazy() ile import edilir
   - Suspense + PageFallback skeleton gösterimi
   - exceljs: dynamic import('exceljs') ile safeXlsx.ts'de

2. Caching:
   - localStorage → okuma hızlı, write debounce yok
   - IndexedDB → büyük snapshot yedek
   - PWA precache → 53 asset (3.1 MB) SW install'da cache'lenir
   - Google Fonts → CacheFirst (1 yıl)

3. Build:
   - minify: esbuild (hızlı)
   - chunkSizeWarningLimit: 500 KB
   - sourcemap: false (production)
   - commonjsOptions: ignore exceljs (eval sorunu)
```

---

## 6. UI/UX Akışları ve Wireframe Açıklamaları

### 6.1 Genel Mimarî

```
┌─────────────────────────────────────────────────────────────────────┐
│  APP SHELL                                                          │
│  ┌─────────┬─────────────────────────────────────────────────────┐ │
│  │SİDEBAR  │  HEADER                                              │ │
│  │         │  [☰] [Başlık] [Arama] [Bildirim] [Sync] [💾] [👤]  │ │
│  │ Hızlı   ├──────────────────────────────────────────────────────┤ │
│  │ Erişim  │                                                      │ │
│  │ [Özet]  │  MAIN CONTENT (lazy loaded page)                     │ │
│  │ [Ürün]  │                                                      │ │
│  │ [Satış] │                                                      │ │
│  │ [Kasa]  │                                                      │ │
│  │ [Cari]  │                                                      │ │
│  │         │                                                      │ │
│  │ Gruplar │                                                      │ │
│  │ ▶ Ana   │                                                      │ │
│  │ ▶ Ted.. │                                                      │ │
│  │ ▶ Fin.. │                                                      │ │
│  │ ▶ Ana.. │                                                      │ │
│  │ ▶ Sis.. │                                                      │ │
│  │         │                                                      │ │
│  │ KASA    │                                                      │ │
│  │ Toplam  │                                                      │ │
│  │ ₺ 1.234 │                                                      │ │
│  │ Nakit.. │                                                      │ │
│  │         │                                                      │ │
│  │ [🟢 Çev.]│                                                      │ │
│  │ [🔒Güv.]│                                                      │ │
│  └─────────┴──────────────────────────────────────────────────────┘ │
│                                                                     │
│  [FAB: +] [🤖 AI Asistan] [🐛 Hata Bildir]                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Navigasyon Yapısı

```
Gruplama:
┌──────┬──────────────────────────────────────────────────────┐
│ Grup │ Sayfalar                                              │
├──────┼──────────────────────────────────────────────────────┤
│ Ana  │ Özet, Finans, Ticaret, Operasyon, Strateji           │
│      │ (5 Dashboard varyantı) + Ürünler + Satış + Fatura    │
├──────┼──────────────────────────────────────────────────────┤
│ Ted. │ Tedarikçi, Pelet, Boru Tedarik                       │
├──────┼──────────────────────────────────────────────────────┤
│ Fin. │ Cari, Kasa, Bütçe, Banka                             │
├──────┼──────────────────────────────────────────────────────┤
│ Ana. │ Raporlar, Çizelge, Stok, İzleme, Kontrol, Anomali    │
├──────┼──────────────────────────────────────────────────────┤
│ Sis. │ Entegrasyon, Veri Birleştir, Not Defteri, Ortaklar   │
│      │ Ayarlar, Bug Hunter, Excel İçe Aktar                  │
└──────┴──────────────────────────────────────────────────────┘

Navigasyon özellikleri:
- Hızlı Erişim: Kullanıcının favorilediği (★) 6 modül
- Grup daraltma/genişletme
- Badge: stok sıfır, bekleyen sipariş, eşleşmemiş banka işlemi
- Klavye kısayolları: Ctrl+1..5 → Özet..Raporlar
- Global arama: ürün, müşteri, modül (en az 2 karakter)
```

### 6.3 Ekran Akışları

#### 6.3.1 Giriş / İlk Kurulum

```
[LoginScreen] ──login──→ [SetupWizard] ──done──→ [Dashboard]
     │                       │
     ├─ Login (isim + şifre, PBKDF2 doğrulama)
     ├─ Misafir Girişi (süreli, kayıt engelli)
     └─ Kayıt Ol (yeni kullanıcı oluştur)
     
SetupWizard:
  Adım 1: Şirket adı, şehir
  Adım 2: Varsayılan kategoriler (soba, aksesuar, vb.)
  Adım 3: Varsayılan kasalar (nakit, banka, POS'lar)
  Adım 4: Demo ürünler (opsiyonel)
  Adım 5: Ortak carileri (opsiyonel)
  → getSetupData() ile DB'ye yazılır, bir kez uygulanır
```

#### 6.3.2 Dashboard (5 Varyant)

```
Dashboard (Özet):
  ├─ İstatistik kartları: Bugünkü ciro, toplam kasa, toplam cari, stok değeri
  ├─ Satış grafiği (son 7 gün) — Recharts
  ├─ Kasa bakiye özeti
  ├─ Son işlemler listesi
  └─ Hızlı aksiyon: Yedek al, Kasa sayım, Sürüm kitapçığı

DashboardFinans:
  ├─ Kâr-zarar grafiği
  ├─ Alacak yaşlandırma
  ├─ Nakit akışı
  └─ Bütçe takibi

DashboardTicaret:
  ├─ Ürün satış dağılımı
  ├─ Tedarikçi performansı
  └─ Sipariş durumu

DashboardOperasyon:
  ├─ Stok seviyeleri
  ├─ Sipariş takvimi
  └─ İzleme kuralları durumu

DashboardStrateji:
  ├─ Büyüme metrikleri
  ├─ Kârlılık analizi
  └─ Anomali özeti
```

#### 6.3.3 Satış Akışı

```
[Sales.tsx] — 1034 satır
  ├─ Filtreler: Tarih aralığı, ödeme tipi, durum, ürün
  ├─ Liste: tablo + durum renk kodlaması
  ├─ Yeni Satış butonu → QuickSaleModal (sayfa üstü)
  │   ├─ Ürün seç (dropdown) + miktar + birim fiyat (öt)
  │   ├─ İskonto (TL veya %)
  │   ├─ Müşteri seç (cari) — opsiyonel
  │   ├─ Ödeme tipi: Nakit/Kart/Havale/Cari
  │   ├─ Peşinat (vadeli ise) — tahsilat
  │   └─ Kaydet → SatisAgent flow
  └─ Satış detayı: ürün listesi, kâr, taksit bilgisi

QuickSaleModal (mobil):
  ── Drawer (vaul) olarak açılır, mobilde tam ekran
  ── Ürün seç → kalan bilgiler aynı
```

#### 6.3.4 Offline-First Davranış

```
┌──────────────────────────────────────────────────────────────────┐
│  OFFLINE-FIRST STRATEJİ                                         │
│                                                                  │
│  Çevrimiçi:                                                     │
│    save() → localStorage + IndexedDB → debounce 1.2sn → Firebase│
│                                                                  │
│  Çevrimdışı:                                                    │
│    save() → localStorage + IndexedDB (tamamen çalışır)          │
│    Firebase senkron atlanır (no-op)                             │
│    Header'da "🔴 Çevrimdışı" gösterilir                          │
│                                                                  │
│  Yeniden çevrimiçi:                                             │
│    Toast: "İnternet bağlantısı yeniden kuruldu"                 │
│    Sonraki save() → Firebase yazar                              │
│                                                                  │
│  İlk yükleme:                                                   │
│    localStorage'dan yüklenir                                     │
│    Firebase'den güncel veri varsa (version kontrolü) → merge    │
│    IndexedDB'den snapshot varsa (localStorage boşsa) → restore  │
│                                                                  │
│  Misafir oturumu:                                               │
│    save() tamamen engellenir (guestBlocked)                     │
│    Süre dolunca otomatik logout                                 │
└──────────────────────────────────────────────────────────────────┘
```

#### 6.3.5 Mobil Uyum (Responsive)

```
Breakpoint: 768px

Desktop (>768px):
  ├─ Sidebar sabit, genişlik ~260px
  ├─ Header: arama, kısayollar, sync badge, tarih
  ├─ Ana içerik: sidebar yanında, scroll
  └─ Modal: ortalanmış, max 480px

Mobil (<768px):
  ├─ Sidebar: hamburger menü (☰) ile açılır, overlay + slide
  ├─ Header: hamburger + başlık + bildirim + kullanıcı
  ├─ Ana içerik: tam genişlik
  ├─ Modal: bottom sheet (Drawer, vaul kütüphanesi)
  └─ FAB: sağ alt köşe, hareketli
```

#### 6.3.6 Özel Bileşenler

```
FAB (Floating Action Button):
  ── Sağ alt köşe, hareketli (pointer drag, localStorage'ta pozisyon)
  ── Ana buton: + (açılır: Hızlı Satış, Ürün Ekle, Gelir, Gider)
  ── Açıkken siyah overlay

AI Asistan Butonu:
  ── Sol alt köşe, hareketli
  ── 🤖 ikonu → AI Drawer açılır (sağdan slide)
  ── AI Drawer: DeepSeek/Claude/Gemini/Offline modları
  ── Drawer içinde AIAsistan page embedded

Hata Bildirme Butonu:
  ── Sağ alt (konfigüre edilebilir pozisyon)
  ── 4 tip: Hata, Öneri, Not, Takip
  ── localStorage'a kaydedilir (max 50 kayıt)

Global Arama:
  ── Header'da, desktop görünür
  ── Ürün, cari, tedarikçi, modül adı arama
  ── 2+ karakter → sonuç listesi (max 8)

Kasa Widget (Sidebar alt):
  ── Toplam kasa bakiyesi
  ── Nakit / Banka ayrımı
  ── Pozitif → yeşil, negatif → kırmızı
  ── Tıklayınca Kasa sayfasına gider
```

### 6.7 Tema ve UI Konfigürasyonu

```
useUIPrefs() hook:
  localStorage'da "sobaUI" key'inde saklanır
  Firebase'den de yüklenebilir (birden çok cihaz)
  Özellikler:
    - accentColor, bgColor
    - font (system/modern/classic)
    - animation (full/reduced/none)
    - showAIButton (boolean)
    - showFABButton (boolean)
    - showReportButton (boolean)
    - soundTheme (classic/minimal/off)
    - speechEnabled (boolean)
    - sidebarCollapsed (boolean)

  applyUIPrefs(prefs): CSS değişkenlerine yazar
  saveUIPrefs(prefs): localStorage + Firebase
  loadUIPrefs(): localStorage'dan okur
```

### 6.8 Toast / Bildirim Sistemi

```
Toast (sonner):
  ── Position: bottom-right
  ── Rich colors: success (yeşil), error (kırmızı), info (mavi), warning (sarı)
  ── 5 visible, expand enabled, 4sn duration
  ── Ses + konuşma: useSoundFeedback + useSpeech ile
  ── Özel soba-toast CSS class'ları

NotificationCenter:
  ── Header'da 🔔 ikonu
  ── Slide-out panel (sağdan)
  ── notificationEngine() tarafından üretilir
  ── Severity'ye göre gruplandırma: critical → warning → info
  ── Tıklayınca ilgili sayfaya yönlendirir
```

---

## Ek: Proje Referansları

| Konu | Dosya |
|------|-------|
| Tip tanımları | `src/types/index.ts` |
| İş mantığı (DB state) | `src/hooks/db/core.ts` |
| Firebase senkron | `src/hooks/db/sync.ts` |
| Firebase yedekleme | `src/hooks/db/backup.ts` |
| Agent sistemi | `src/agents/` |
| Kural motoru | `src/lib/ruleEngine.ts` |
| Denetim motoru | `src/lib/auditEngine.ts` |
| Anomali tespiti | `src/lib/anomalyEngine.ts` |
| Veri bütünlüğü | `src/lib/dataIntegrityChecker.ts` |
| Bildirim motoru | `src/lib/notificationEngine.ts` |
| AI servisleri | `src/lib/deepseek.ts`, `src/lib/aiApi.ts` |
| AI aksiyon parser | `src/lib/aiActions.ts` |
| Changelog (zorunlu) | `src/lib/changelog.ts` |
| Build yapılandırması | `vite.config.ts`, `src/lib/vite-manual-chunks.ts` |
| Performans raporu | `PERFORMANCE_REPORT.md` |
| opencode kuralları | `opencode.json` |
| Routing + UI shell | `src/App.tsx` |
| Test (kapsamlı) | `src/lib/kapsamli-senaryo.test.ts` |
