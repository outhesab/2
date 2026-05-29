# PARSPEL — API / Servis Katmanı

> Versiyon: 3.7.0 | Tarih: 29 Mayıs 2026

PARSPEL **client-side bir uygulamadır**. REST/GraphQL sunucusu yoktur. Tüm iş mantığı doğrudan React hook'ları ve fonksiyonlar üzerinden çalışır.

## 1. Çekirdek Veri İşlemleri (useDB hook)

```
useDB() → { db, save, saveGuarded, saveWithLog, undo, exportJSON, importJSON,
            getKasaBakiye, getTotalKasa, manualBackup, listBackups, restoreBackup }

// Tüm mutasyonlar şu pattern ile çalışır:
save((prevDB: DB) => {
  // prevDB'yi mutasyona uğrat (immutable)
  return { ...prevDB, products: [...prevDB.products, newProduct] };
});
```

## 2. Kural Motoru (Rule Engine)

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

## 3. Denetim Motoru (Audit Engine)

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

## 4. Anomali Motoru (Anomaly Engine)

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

## 5. Veri Bütünlüğü (Data Integrity Checker)

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

## 6. Firebase Servis Katmanı

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

## 7. AI Servis Katmanı

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

## 8. Raporlama Servisleri

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
