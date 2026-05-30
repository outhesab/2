# PARSPEL — Core Library

İş mantığı, kural motoru, denetim, utility fonksiyonlar.

## Yapı

```
src/lib/
├── ruleEngine.ts         # 8 senkron kural, save() öncesi blok/uyarı
├── auditEngine.ts        # prev/next farkı → _auditLog kaydı
├── utils-tr.ts           # genId(), formatMoney(), tarih formatlama
├── utils.ts              # Jenerik yardımcılar
├── anomalyEngine.ts      # Anomali tespit motoru
├── appConfig.ts          # Uygulama yapılandırması
├── changelog.ts          # Değişiklik günlüğü
├── connConfig.ts         # Firebase bağlantı yapılandırması
├── excelExport.ts        # Excel dışa aktarım
├── excel-merge.ts        # Excel birleştirme
├── healthCheck.ts        # Sistem sağlık kontrolü
├── logger.ts             # Loglama
├── notificationEngine.ts # Bildirim motoru
├── offline-ai.ts         # Offline AI işlemleri
├── permissions.ts        # İzin yönetimi
├── safeXlsx.ts           # Güvenli XLSX işlemleri
├── similarity.ts         # Benzerlik algoritmaları
├── userManager.ts        # Kullanıcı yönetimi
├── version.ts            # Unified versiyon sistemi (getAppVersion, getVersionInfo)
├── *.test.ts             # 10 test dosyası (pure fonksiyon)
```

## RuleEngine

- `validateTransaction(prevDB, nextDB)` → `RuleViolation[]`
- `severity: 'block'` → save() engellenir, `'warn'` → uyarı
- 8 kural: negatif stok, negatif kasa, sıfır tutar, mükerrer işlem, limit aşımı vb.
- Timeout: 50ms, aşarsa güvenli geç

## AuditEngine

- `createAuditEntry(prev, next, metadata)` → audit log kaydı
- prev/next diff'i otomatik çıkarır
- Trim: 2000 kayıt üstü eski kayıtları temizler

## Versiyon Sistemi

- **Tek kaynak:** `src/lib/version.ts` — `getAppVersion()`, `getVersionInfo()`, `isVersionGte()`
- **Tüm sayfalar** versiyonu `getAppVersion()` ile okur, asla hardcode veya `db._version` kullanmaz
- `package.json`, `APP_DEFAULT_VERSION`, changelog son entry'si her zaman aynı olmalı
- Tutarlılık testi: `src/__tests__/version-consistency.test.ts`

## Test Pattern

- `prevDB → işlem → nextDB` — saf fonksiyon, UI yok
- `fast-check` ile property-based senaryolar
- `kapsamli-senaryo.test.ts` ana entegrasyon testi
