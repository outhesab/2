# useDB.ts Refactor Planı

**Dosya**: `src/hooks/useDB.ts` — 1.321 satır
**Risk**: YÜKSEK — veri katmanının kalbi, tüm sayfalar bağımlı
**Strateji**: Aşamalı ekstraksiyon, her adımda test + typecheck

---

## 1. Mevcut Yapı (Satır Bazında)

| Bölüm                        | Satırlar | İşlev                                                                                                     |
| ---------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| Firebase URL helper          | 11-16    | `getFirebaseUrl()` — localStorage'dan Firebase config oku                                                 |
| Sync status yayıncısı        | 18-44    | `SyncStatus` tipi, `emitSync()`, `onSyncStatus()`, `getSyncStatus()`                                      |
| IndexedDB snapshot           | 46-70    | `saveToIndexedSnapshot()`, `loadFromIndexedSnapshot()`                                                    |
| Default DB factory           | 72-159   | `makeDefaultDB()` — boş/ilk DB şablonu                                                                    |
| localStorage I/O             | 161-241  | `loadFromStorage()`, `saveToStorage()` — senkron, kilit mekanizmalı                                       |
| Firebase REST (save)         | 243-323  | `fetchWithRetry()`, `saveToFirebase()` — 3 retry, üstel backoff                                           |
| Firebase yedekleme           | 325-441  | `pruneOldBackups()`, `saveBackupToFirebase()`, `listBackupsFromFirebase()`, `restoreBackupFromFirebase()` |
| Referans onarımı             | 443-490  | `repairReferentialIntegrity()` — silinmiş entity referanslarını temizle                                   |
| Veri doğrulama + birleştirme | 492-810  | `validateName()`, `mergeCariler()`, `mergeProducts()`, `mergeArray()`, `mergeRestoreDB()`                 |
| Tam geri yükleme             | 812-905  | `fullRestoreDB()` — yedek kazanır, ad kalite kontrolü                                                     |
| Firebase load                | 907-937  | `loadFromFirebase()` — GET ile buluttan çek                                                               |
| **useDB hook**               | 939-1321 | Ana React hook: state, save, saveGuarded, export, import, backup                                          |

---

## 2. Pure Utility Fonksiyonları (React Bağımsız — Güvenle Çıkar)

Bu fonksiyonlar `useState`/`useEffect`/`useCallback` kullanmaz. `src/lib/` altına taşınabilir.

### 2a. `src/lib/dbDefaults.ts` (72-159 arası)

```typescript
export function makeDefaultDB(): DB;
```

- Tamamen saf fonksiyon
- Hiçbir dış bağımlılığı yok
- Test edilmesi en kolay parça

### 2b. `src/lib/dbStorage.ts` (46-70, 161-241 arası)

```typescript
export const STORAGE_KEY = "sobaYonetim";
export function loadFromStorage(): DB;
export function saveToStorage(db: DB): boolean;
export function saveToIndexedSnapshot(db: DB): Promise<void>;
export function loadFromIndexedSnapshot(): Promise<DB | null>;
```

- `saveToStorage` içinde `_isSaving`/`_pendingDb` kilit mekanizması var
- IndexedDB işlemleri async ama React bağımsız
- **Dikkat**: `loadFromStorage` `makeDefaultDB()` çağırır — bağımlılık yönetimi gerek

### 2c. `src/lib/dbFirebase.ts` (11-16, 243-441, 907-937 arası)

```typescript
export function getFirebaseUrl(): string
export async function saveToFirebase(db: DB): Promise<void>
export async function loadFromFirebase(): Promise<DB | null>
export async function saveBackupToFirebase(db: DB, label?: string): Promise<boolean>
export async function listBackupsFromFirebase(): Promise<...>
export async function restoreBackupFromFirebase(backupId: string): Promise<DB | null>
async function fetchWithRetry(url: string, options: RequestInit, retries?: number): Promise<Response>
async function pruneOldBackups(cfg: ...): Promise<void>
```

- `emitSync()` çağırır — bu bir modül-level fonksiyon, callback olarak enjekte edilebilir
- Firebase URL helper `loadConnConfig()` kullanır

### 2d. `src/lib/dbMerge.ts` (443-905 arası)

```typescript
export function repairReferentialIntegrity(db: DB): DB;
export function validateName(name: unknown): string | null;
export function mergeCariler(
  existing: DB["cari"],
  incoming: DB["cari"],
  report: RestoreReport,
): DB["cari"];
export function mergeProducts(
  existing: DB["products"],
  incoming: DB["products"],
  report: RestoreReport,
): DB["products"];
export function mergeArray<T>(
  existing: T[],
  incoming: T[],
  label: string,
  report: RestoreReport,
): T[];
export function mergeRestoreDB(
  current: DB,
  incoming: Partial<DB>,
  selectedKeys: Set<string>,
): { db: DB; report: RestoreReport };
export function fullRestoreDB(
  incoming: DB,
  def: DB,
): { db: DB; report: RestoreReport };
```

- **En güvenli çıkarılacak grup** — tamamen saf fonksiyonlar
- `RestoreReport` tipi de buraya taşınmalı
- `validateName` genel amaçlı, `src/lib/utils-tr.ts`'ye de gidebilir

---

## 3. Ayrı Hooks (React Bağımlı)

### 3a. `src/hooks/useSyncStatus.ts` (18-44 arası)

```typescript
export type SyncStatus = "idle" | "saving" | "saved" | "error" | "loading";
export function onSyncStatus(fn: SyncListener): () => void;
export function getSyncStatus(): SyncStatus;
```

- Modül-level event emitter pattern
- `emitSync()` içe aktarılıp kullanılabilir
- **useDB.ts'de kalabilir** — sadece 27 satır, ayrı dosya açmaya değmez

### 3b. `src/hooks/useFirebaseSync.ts`

```typescript
export function useFirebaseSync(db: DB, syncTimer: React.MutableRefObject<...>)
```

- `saveToFirebase` çağrısını debounce'lar (1.2sn)
- `useEffect` ile cleanup
- **Dikkat**: `save()` içinde `syncTimer` ref'i kullanılıyor — bu ref'in hook dışına çıkması lazım

---

## 4. useDB Hook İç Yapısı (939-1321)

### Mevcut return değerleri:

```typescript
return {
  db, // useState<DB>
  save, // useCallback — ana save fonksiyonu
  saveWithLog, // useCallback — save + activity log wrapper
  saveGuarded, // useCallback — kural korumalı save
  logActivity, // useCallback — sadece activity log ekler
  exportJSON, // useCallback — JSON dosyasına export
  importJSON, // useCallback — JSON dosyasından import
  getKasaBakiye, // useCallback — kasa bakiyesi hesapla
  getTotalKasa, // useCallback — toplam kasa hesapla
  emitSync, // modül-level fonksiyon (referans)
  manualBackup, // useCallback — Firebase yedekleme
  listBackups, // useCallback — Firebase yedek listele
  restoreBackup, // useCallback — Firebase yedek geri yükle
};
```

### Ayrıştırma Önerisi:

```typescript
// useDB.ts — sadece core state management
function useDB() {
  const [db, setDb] = useState<DB>(loadFromStorage);
  // save, saveWithLog, saveGuarded, logActivity
  // exportJSON, importJSON
  // getKasaBakiye, getTotalKasa
  return {
    db,
    save,
    saveWithLog,
    saveGuarded,
    logActivity,
    exportJSON,
    importJSON,
    getKasaBakiye,
    getTotalKasa,
  };
}

// useFirebaseBackup.ts — Firebase backup/restore
function useFirebaseBackup(db: DB) {
  // manualBackup, listBackups, restoreBackup
  return { manualBackup, listBackups, restoreBackup };
}
```

---

## 5. Firebase Sync vs Local DB Logic

| İşlev                        | Lokal                     | Firebase             | Paylaşılan        |
| ---------------------------- | ------------------------- | -------------------- | ----------------- |
| `loadFromStorage`            | ✅ localStorage           | —                    | —                 |
| `saveToStorage`              | ✅ localStorage (kilitli) | —                    | —                 |
| `saveToIndexedSnapshot`      | ✅ IndexedDB              | —                    | —                 |
| `loadFromIndexedSnapshot`    | ✅ IndexedDB              | —                    | —                 |
| `saveToFirebase`             | —                         | ✅ Firestore REST    | `emitSync()`      |
| `loadFromFirebase`           | —                         | ✅ Firestore REST    | `emitSync()`      |
| `saveBackupToFirebase`       | —                         | ✅ Firestore backups | —                 |
| `listBackupsFromFirebase`    | —                         | ✅ Firestore backups | —                 |
| `restoreBackupFromFirebase`  | —                         | ✅ Firestore backups | `fullRestoreDB()` |
| `mergeRestoreDB`             | ✅ saf fonksiyon          | —                    | —                 |
| `fullRestoreDB`              | ✅ saf fonksiyon          | —                    | —                 |
| `repairReferentialIntegrity` | ✅ saf fonksiyon          | —                    | —                 |

**Amaç**: Firebase kodunu tamamen ayır. Uygulama Firebase olmadan da çalışabiliyor — bu bağımsızlığı koru.

---

## 6. Önerilen Uygulama Sırası

### Faz 1 (Düşük Risk — 1 saat)

1. `src/lib/dbDefaults.ts` — `makeDefaultDB()` taşı
2. `src/lib/dbMerge.ts` — `validateName`, `mergeCariler`, `mergeProducts`, `mergeArray`, `mergeRestoreDB`, `fullRestoreDB`, `repairReferentialIntegrity` taşı
3. `RestoreReport` tipini `src/types/`'a taşı
4. useDB.ts'de import'ları güncelle
5. `npm run typecheck && npm run test:run && npm run build`

### Faz 2 (Orta Risk — 2 saat)

1. `src/lib/dbStorage.ts` — `STORAGE_KEY`, `loadFromStorage`, `saveToStorage`, `saveToIndexedSnapshot`, `loadFromIndexedSnapshot` taşı
2. `_isSaving`/`_pendingDb` kilit mekanizmasını modül-level olarak koru
3. useDB.ts'de import'ları güncelle
4. `npm run typecheck && npm run test:run && npm run build`

### Faz 3 (Yüksek Risk — 3 saat)

1. `src/lib/dbFirebase.ts` — tüm Firebase REST fonksiyonlarını taşı
2. **Real-time Listener**: `onSnapshot` ile Firestore değişimlerini dinle ve lokal `db` state'ini güncelle
3. `emitSync`'i callback olarak enjekte et (dependency injection)
4. `useFirebaseBackup.ts` — backup/restore hook'unu ayır
5. useDB.ts'de import'ları güncelle
6. `npm run typecheck && npm run test:run && npm run build`

### Faz 4 (Opsiyonel — 1 saat)

1. `useSyncStatus.ts` — sync status event emitter'ı ayır (27 satır, düşük öncelik)
2. `useFirebaseSync.ts` — debounce + Firebase sync hook'unu ayır

---

## 7. Riskler ve Önlemler

| Risk                                          | Olasılık | Etki   | Önlem                                                          |
| --------------------------------------------- | -------- | ------ | -------------------------------------------------------------- |
| `saveToStorage` kilit mekanizması bozulur     | Düşük    | Kritik | Aynı modül içinde tut, test yaz                                |
| `emitSync` referansı kopar                    | Düşük    | Orta   | Callback enjeksiyonu kullan                                    |
| `loadFromStorage` `makeDefaultDB` bağımlılığı | Düşük    | Düşük  | Import'u koru                                                  |
| `save()` içindeki `syncTimer` ref'i kaybolur  | Orta     | Orta   | Ref'i useDB'de tut, Firebase fonksiyonuna parametre olarak geç |
| Test coverage düşer                           | Orta     | Düşük  | Her faz sonrası `npm run test:run`                             |
| Import döngüsü (circular dependency)          | Düşük    | Kritik | `src/lib/` → `src/hooks/` import'u olmamalı                    |

---

## 8. Nihai Hedef

```
src/
├── hooks/
│   ├── useDB.ts              # ~300 satır (core state + save)
│   ├── useFirebaseBackup.ts   # ~100 satır (backup/restore hook)
│   └── useSyncStatus.ts       # ~30 satır (opsiyonel)
├── lib/
│   ├── dbDefaults.ts          # ~90 satır
│   ├── dbStorage.ts           # ~100 satır
│   ├── dbFirebase.ts          # ~300 satır
│   └── dbMerge.ts             # ~400 satır
└── types/
    └── index.ts               # RestoreReport ekle
```

**Toplam**: 1.321 → ~1.320 satır (aynı), 1 dosya → 6 dosya
**Kazanç**: Bakım kolaylığı, test edilebilirlik, her dosyada odak
