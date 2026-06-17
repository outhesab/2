# PARSPEL — Veri Katmanı Dokümanı

> Versiyon: 3.31.0 | Tarih: 17 Haziran 2026
> İçerik: Depolama, Veri Modeli, Servis Katmanı

---

# Bölüm 1: Depolama Hiyerarşisi

## 1. Depolama Katmanları

```
┌─────────────────────────────────────────────────────┐
│                   localStorage                       │
│  (birincil depolama, "sobaYonetim" key)              │
│  tüm DB nesnesi JSON.stringify ile burada            │
├─────────────────────────────────────────────────────┤
│                   IndexedDB (Dexie)                  │
│  (snapshot yedek, otomatik periyodik)               │
├─────────────────────────────────────────────────────┤
│                   Firebase Firestore                 │
│  (bulut senkron, isteğe bağlı)                      │
└─────────────────────────────────────────────────────┘
```

| Katman | Rol | Gecikme | Güvenilirlik |
|--------|-----|---------|-------------|
| localStorage | Okuma/yazma | ~1ms | Uygulama açıkken kalıcı |
| IndexedDB | Yedek | ~10ms | Tarayıcı silinmezse kalıcı |
| Firebase | Bulut senkron | ~300ms | İnternet bağlantısına bağlı |

## 2. Save Pipeline (v3.23+)

```
save(updater)
  │
  ├─ 1. prevDB = mevcut localStorage
  ├─ 2. nextDB = updater(prevDB)     ← immutable updater
  ├─ 3. RuleEngine.validate(prevDB, nextDB)
  │     ├─ 'block' varsa → save DURDURULUR, toast gösterilir
  │     └─ 'warn' varsa → toast uyarı, yine de kaydedilir
  ├─ 4. AuditEngine.createEntry(prevDB, nextDB)
  ├─ 5. localStorage.setItem('sobaYonetim', JSON.stringify(nextDB))
  ├─ 6. IndexedDB'ye snapshot yedek (debounce: 5sn)
  └─ 7. Firebase sync (debounce: 1.2sn, 3 retry, sadece online ise)
```

### Domain Pipeline (Agent'lar için)

```
agent.islemYap({ action, payload })
  → mapRequestToIntent() → Intent
  → processIntent(intent, db) → IntentResult { dbUpdates, events }
  → applyIntentResult(prevDB, dbUpdates) → nextDB
  → save(nextDB) → persist
```

`applyIntentResult()` (`src/hooks/db/dbHelpers.ts`):
```typescript
function applyIntentResult(prev: DB, data: IntentResult["data"]): DB {
  // dbUpdates'teki products, sales, kasa, cari değişikliklerini prev DB'e uygular
  // events dizisindeki event'leri domainEventBus üzerinden yayınlar
}
```

### DBUpdates Tipi

```typescript
interface DBUpdates {
  products?: Array<{ id: string; newStock: number }>;
  stockMovements?: StockMovementV2[];
  kasa?: KasaEntry[];
  cashTransaction?: KasaEntry[];
  cari?: CariUpdate[];
  newProduct?: Product;
  newCari?: Cari;
  sale?: Sale;
}
```

**Kurallar:**
- `save()` dışında localStorage'a **doğrudan yazmak yasaktır** (RuleEngine bypass edilir)
- `saveGuarded()` — RuleEngine çalıştırır ama 'warn' durumunda bile bloğa takılmaz (admin işlemleri)
- `saveWithLog()` — RuleEngine + AuditEngine + activityLog kaydı
- Her save sonrası `_version++` artar

## 3. Okuma Pattern'i

```typescript
// useDB hook'u
const { db, save } = useDB();

// db her zaman güncel localStorage verisini yansıtır
// save bir fonksiyondur, referansı stabildir
```

- `useDB()` her render'da localStorage'dan okur (değişiklik varsa re-render)
- UI'da veriyi `db.products`, `db.sales` vb. ile okursun
- Asla `JSON.parse(localStorage.getItem('sobaYonetim'))` doğrudan kullanma

## 4. Firebase Senkronizasyonu

```
Online → save() sonrası 1.2sn bekle → Firestore'a push
       → Firestore'dan gelen değişiklikler localStorage'a merge edilir

Offline → save() sadece localStorage + IndexedDB'ye yazar
       → Online dönünce otomatik sync başlar
       → 3 kez dener, başaramazsa "Sync başarısız" uyarısı
```

**Conflict çözümü:** Son yazan kazanır (last-write-wins). `_version` değeri karşılaştırılır.

## 5. Yedekleme (Backup)

```typescript
// Manuel yedek
manualBackup() → IndexedDB'ye snapshot kaydeder

// Otomatik yedek
Her save'den 5sn sonra IndexedDB güncellenir

// Listeleme
listBackups() → kayıtlı snapshot'ları döndürür

// Geri yükleme
restoreBackup(id) → snapshot'ı localStorage'a yazar
```

## 6. Veri Tutarlılığı Garantileri

| Durum | Ne olur |
|-------|---------|
| localStorage boş/hatalı | IndexedDB'den kurtarılır |
| IndexedDB de boş | Varsayılan DB (dbDefaults) yüklenir |
| Firebase offline | Senkron atlanır, veri kaybı olmaz |
| RuleEngine block | save() hiç çalışmaz, prevDB korunur |
| RuleEngine 50ms timeout | Güvenli geç (bypass edilir, prevDB korunur) |

## 7. Önemli Kısıtlamalar

- **Boyut limiti:** localStorage ~5-10MB. JSON serialize edilmiş DB boyutu düzenli kontrol edilir.
- **Firebase Firestore limiti:** 1MB/döküman. Büyük DB'ler parçalanarak sync edilir.
- `_auditLog` max 500 kayıt, eski kayıtlar silinir.
- `_activityLog` max 200 kayıt.

---

# Bölüm 2: Veri Modeli / Şema

## 1. Kök Veritabanı Nesnesi (`DB`)

Tüm uygulama state'i tek bir `DB` nesnesinde toplanır.

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
  pelletSettings: { gramaj: number; kgFiyat: number; cuvalKg: number; critDays: number; };

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

---

# Bölüm 3: Servis Katmanı

PARSPEL **client-side bir uygulamadır**. REST/GraphQL sunucusu yoktur. Tüm iş mantığı doğrudan React hook'ları ve fonksiyonlar üzerinden çalışır.

## 1. Kural Motoru (Rule Engine)

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

## 2. Denetim Motoru (Audit Engine)

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

## 3. Anomali Motoru

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

## 4. Domain Servis Katmanı (v3.23+)

`src/domain/services/` altında saf fonksiyonlar. Bağımlılıkları yok, test edilebilir.

```typescript
// Sale — src/domain/services/saleCompletion.ts
completeSale(intent: SaleIntent, db: DB) → IntentResult
cancelSale(saleId: string, db: DB) → IntentResult
returnSale(saleId: string, db: DB, qty?) → IntentResult
correctSalePrice(saleId: string, yeniFiyat, db: DB) → IntentResult

// Cash — src/domain/services/cashService.ts
processCashTransaction(type: 'gelir'|'gider', payload, db: DB) → IntentResult

// Stock — src/domain/services/stockService.ts
processStockUpdate(payload, db: DB) → IntentResult
processProductAdd(payload, db: DB) → IntentResult

// Cari — src/domain/services/cariService.ts
processCariTahsilat(payload, db: DB) → IntentResult
processCariAdd(payload, db: DB) → IntentResult
```

Tümü `IntentResult` döndürür:
```typescript
interface IntentResult {
  ok: boolean;
  error?: string;
  data?: {
    dbUpdates: DBUpdates;  // Değişiklikler
    events: DomainEvent[]; // Yayınlanacak eventler
  };
}
```

### Domain Kullanımı

```typescript
// Doğrudan domain servis çağrısı (agent'sız)
import { completeSale } from '@/domain';
const result = completeSale(intent, db);

// Agent üzerinden (orchestration için)
const result = await getAgent('satis').islemYap({ action: 'yeniSatis', payload });
```

### Agent Akışı (Güncel)

Agent'lar **thin wrapper** haline geldi:
1. `mapRequestToIntent()` — isteği Intent'e çevir
2. `processIntent()` — domain servise yönlendir
3. `applyIntentResult()` — dbUpdates'i localStorage'a yaz
4. Event'leri yayınla

Eski `orchestrator.ts` ve `dispatchAgentFlow()` kaldırıldı.

## 5. AI Servis Katmanı

```
src/lib/deepseek.ts:
  askDeepSeek(systemPrompt, userMessage, mode?) → Response
  - 'deepseek-chat' ve 'deepseek-reasoner' modelleri
  - Streaming destekli

src/lib/aiApi.ts:
  askClaude(systemPrompt, userMessage) → Response
  askGemini(systemPrompt, userMessage) → Response

src/lib/aiActions.ts (338 satır):
  parseAIResponse(text) → AIAction[]
  validateAction(action) → boolean
  applyAction(action, db) → DB (artık applyIntentResult kullanır)
  fallbackChain(action, db) → revisedAction

src/lib/aiOffline.ts (341 satır):
  offlineReply(userMessage, db) → string
  buildContext(db) → string (DB özeti AI prompt'u için)
```

## 6. Raporlama Servisleri

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
