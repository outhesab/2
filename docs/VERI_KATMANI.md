# PARSPEL — Veri Katmanı

> Versiyon: 3.10.0 | Tarih: 30 Mayıs 2026

## 1. Depolama Hiyerarşisi

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

## 2. Save Pipeline

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
