---
name: parspel-veri-katmani
description: >
  PARSPEL'in offline-first veri katmanı ile calisir. localStorage birincil
  depolama, IndexedDB (Dexie) yedek, Firebase Firestore opsiyonel senkron.
  prevDB → islem → nextDB pattern'i, RuleEngine, AuditEngine, save pipeline,
  data migration, concurrency yönetimi. Veri modeli degisikligi, save/get
  islemleri, backup geri yukleme gerektiginde kullan.
version: 1.1.0
author: PARSPEL
hooks:
  onComplete: true
  onError: true
requires:
  - parspel-test
---

# PARSPEL — Veri Katmanı

## Overview

Offline-first veri katmanı: localStorage (birincil) → IndexedDB/Dexie (yedek) → Firebase Firestore (opsiyonel sync). Tüm yazma işlemleri `save()` pipeline'ından geçer.

## Depolama Hiyerarşisi

```
localStorage (birincil, ~5-10MB)
  → IndexedDB (otomatik snapshot yedek, 5sn debounce)
    → Firebase Firestore (opsiyonel, 1.2sn debounce, 3 retry)
```

## Instructions

### 1. Save Pipeline

`save(updater)` akışı:

1. `prevDB` = mevcut localStorage oku
2. `nextDB = updater(prevDB)` — immutable updater
3. `RuleEngine.validate(prevDB, nextDB)` — block/warn
4. `AuditEngine.createEntry(prevDB, nextDB)` — diff kaydı
5. `localStorage.setItem('sobaYonetim', JSON.stringify(nextDB))`
6. IndexedDB snapshot (5sn debounce)
7. Firebase sync (1.2sn debounce, online ise)

### 2. Save Varyantları

| Fonksiyon | RuleEngine | AuditEngine | Kullanım |
|-----------|-----------|-------------|----------|
| `save()` | Block/warn | - | Normal işlem |
| `saveGuarded()` | Warn (block yok) | - | Admin düzeltme |
| `saveWithLog()` | Block/warn | + activityLog | Denetim gereken işlem |

### 3. Önemli Kurallar

- `save()` dışında localStorage'a direkt yazmak **yasak**
- `useDB()` hook'u ile oku, asla `JSON.parse(localStorage.getItem(...))` kullanma
- Updater fonksiyonu **pure** olmalı (mutasyon yok)

### 4. Yeni Bir Alan/Entity Ekleme

**Adım 1 — Tip Tanımı:**
`src/types.ts`:
```typescript
export interface YeniEntity {
  id: string;
  ad: string;
  // ...
}

export interface DB {
  // ...
  yeniEntity: YeniEntity[];
}
```

**Adım 2 — Varsayılan Değer:**
`src/config/dbDefaults.ts`:
```typescript
export const DEFAULT_DB: DB = {
  // ...
  yeniEntity: [],
};
```

**Adım 3 — Audit Log Desteği (opsiyonel):**
- RuleEngine'de kural tanımla (block/warn)
- AuditEngine diff'te yeni alanı yoksay veya dahil et

**Adım 4 — Veri Migrasyonu:**
Eski kullanıcıların verisinde yeni alan yoksa:
```typescript
// src/db/migration.ts
const MIGRATIONS = [
  { version: 1, migrate: (db: any) => ({ ...db, yeniEntity: db.yeniEntity ?? [] }) },
  { version: 2, migrate: (db: any) => ({ ...db, yeniAlan: db.yeniAlan ?? "default" }) },
];
```

**Adım 5 — IndexedDB Şeması (Dexie):**
```typescript
// src/db/indexeddb.ts
import Dexie from "dexie";

const db = new Dexie("ParspelDB");
db.version(1).stores({
  snapshot: "++id, timestamp",
  yeniEntity: "id, ad", // yeni store
});
```

**Adım 6 — Test:**
```typescript
const prevDB = createTestDB();
const nextDB = { ...prevDB, yeniEntity: [testEntity] };
save(nextDB);
// RuleEngine'den geçiyor mu kontrol et
```

### 5. Firebase Config (Opsiyonel)

Firebase kullanılacaksa:
```typescript
// src/lib/firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
};
```

| Koleksiyon | İçerik |
|-----------|--------|
| `snapshots` | DB snapshot'ları |
| `auditLog` | Audit kayıtları |
| `config` | Uygulama konfigürasyonu |

### 6. Concurrency Yönetimi

```typescript
// Çoklu tab senkronizasyonu için lock
let saveLock = false;

async function save(updater: Updater): Promise<void> {
  if (saveLock) return; // İkinci çağrıyı bekle
  saveLock = true;
  try {
    // ...save pipeline
  } finally {
    saveLock = false;
  }
}
```

### 7. Yedekleme

- `manualBackup()` → IndexedDB'ye snapshot
- `listBackups()` → snapshot listele
- `restoreBackup(id)` → snapshot'ı localStorage'a geri yükle
- Fallback: localStorage bozulursa IndexedDB'den kurtar, o da yoksa dbDefaults

## Rules

| Kural | Açıklama |
|-------|----------|
| save pipeline | Tüm yazmalar `save()` üzerinden |
| Immutable | Updater pure fonksiyon, mutasyon yok |
| useDB hook | Doğrudan localStorage okuma yasak |
| Migrasyon | Yeni alan eklerken migration fonksiyonu yaz |
| Debounce | IndexedDB 5sn, Firebase 1.2sn |
| Lock | Çoklu tab çağrılarında lock mekanizması |
| Audit log | max 500 kayıt, eski silinir |
| Activity log | max 200 kayıt, eski silinir |

## Sorun Giderme

| Durum | Çözüm |
|-------|-------|
| localStorage boş | IndexedDB'den kurtar |
| RuleEngine block | prevDB korunur, toast göster |
| Firebase offline | Senkron atlanır, veri kaybı olmaz |
| Boyut limiti | `_auditLog` max 500, `_activityLog` max 200 kayıt |
| Çoklu tab çakışması | Lock mekanizması ile sıraya al |

## Hooks

### onComplete
- Save pipeline'ın düzgün çalıştığını doğrula
- Migration varsa test et
- Testler geçiyor mu kontrol et

### onError
- Hangi adımda (RuleEngine/AuditEngine/save/Firebase) hata olduğunu belirt
- prevDB hala localStorage'da korunuyor mu kontrol et
- Kurtarma önerisi sun
