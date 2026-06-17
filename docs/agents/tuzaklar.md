# Yaygın Tuzaklar — Detaylı Liste

> Kısa versiyon: `AGENTS.md` §6.

## Pre-Commit Blokları

### Tuzak: Changelog yok
**Sorun:** `src/lib/changelog.ts` güncellenmeden commit atılamaz.  
**Çözüm:** Her değişiklikte changelog güncelle.

### Tuzak: Version inconsistency
**Sorun:** changelog güncellenir ama `package.json` güncellenmez → CI kırılır.  
**Çözüm:** **Her zaman ikisini birlikte güncelle** (3-dosya kuralı, `versiyonlama.md`).

## Rule Engine

### Tuzak: 50ms timeout (safe-pass)
**Sorun:** Kural değerlendirmesi 50ms sınırını aşarsa kalan kurallar atlanır.  
**Çözüm:** Bu **normal davranış**, bug değil. Eğer çok sık oluyorsa:
- Kural sayısını azalt
- Kural karmaşıklığını düşür
- Veya `severity: 'info'` yap

### Tuzak: Block vs Warn
- `block` — engelle, kullanıcıya hata göster
- `warn` — uyar, kullanıcı onaylayabilir (kayıt için `saveGuarded` gerekli)

## Save Pipeline

### Tuzak: saveGuarded warn kurallarını atlar
**Sorun:** `saveGuarded()` warn severity kurallarını bypass eder.  
**Çözüm:** Sadece admin işlemleri için kullan. Normal işlemler `save()` kullansın.

### Tuzak: saveWithLog aktivite + audit log
**Sorun:** `saveWithLog()` hem activity hem audit log'a ekler.  
**Çözüm:** Kullanıcı aksiyonları için (CRUD), sistem aksiyonları için `save()` yeterli.

## localStorage

### Tuzak: 5-10MB limit
**Sorun:** localStorage ~5-10MB. Büyük DB'de `QuotaExceededError`.  
**Çözüm:** DB boyutunu monitör et, eski log'ları temizle, IndexedDB'ye geçiş yap.

## Firebase

### Tuzak: 1MB/doc limit
**Sorun:** Firestore docs 1MB max. Büyük DB chunk'lanır.  
**Çözüm:** `sync.ts` chunk'ları yönetir, dikkat et.

### Tuzak: Race condition
**Sorun:** Çoklu ardışık save'de son yazan kazanır.  
**Çözüm:** `SyncQueue` (sequential writes) — `dbHelpers.ts` üzerinden.

## React/Performance

### Tuzak: useDB her render
**Sorun:** `useDB` her render'da yeniden fetch yapabilir.  
**Çözüm:** Selector pattern: `useDB(state => state.customers)`.

### Tuzak: Inline object/array prop
**Sorun:** `<Component prop={{a: 1}} />` her render'da yeni referans.  
**Çözüm:** `useMemo` veya sabit değer kullan.

## Test

### Tuzak: Hardcoded tarih
**Sorun:** `Date("2020-01-01")` test'i kırılgan yapar.  
**Çözüm:** Dinamik hesapla: `Date.now() - 1000`.

### Tuzak: Platform bağımlı
**Sorun:** `process.platform === 'win32'` test'i.  
**Çözüm:** `mock-fs` veya abstraction katmanı.

### Tuzak: Shared mutable state
**Sorun:** Testler arası paylaşılan `let db = ...`.  
**Çözüm:** Her test için fresh fixture (`beforeEach`).

## Git/Deploy

### Tuzak: --no-verify
**Sorun:** Pre-commit hook bypass eder, kalite kontrolü atlanır.  
**Çözüm:** `--no-verify` yasak. Hook başarısızsa düzelt, bypass etme.

### Tuzak: --force push
**Sorun:** History bozar, geri alınamaz.  
**Çözüm:** `--force` yasak. Normal push kullan.
