# PARSPEL — Test Stratejisi

> Versiyon: 3.23.2 | Tarih: 13 Haziran 2026

## Genel Durum

- **Test dosyası:** 41 adet
- **Total test:** 412 (411 ✅ / 1 ⬜)
- **Süre:** ~49 saniye
- **Framework:** Vitest + fast-check (property-based)

## 1. Test Piramidi

```
         ╱╲
        ╱ E2E ╲
       ╱ (PW)  ╲
      ╱──────────╲
     ╱ Integration ╲
    ╱  (vitest)    ╲
   ╱────────────────╲
  ╱   Unit (vitest)  ╲
 ╱  fast-check ile    ╲
╱──────────────────────╲
```

| Seviye | Araç | Hız | Adet | Kapsam |
|--------|------|-----|------|--------|
| Unit | vitest + fast-check | ~1ms/test | Çok (100+) | Saf fonksiyonlar: ruleEngine, auditEngine, similarity, utils |
| Integration | vitest | ~10ms/test | Orta (20-50) | prevDB → işlem → nextDB senaryoları, multi-agent flow |
| E2E | Playwright | ~1s/test | Az (5-10) | Firebase sync, export/import, login akışı |

## 2. Test Dosyası Konumlandırma

```
src/
├── __tests__/           # Global/proje-seviyesi testler
│   ├── version-consistency.test.ts   # Cross-file tutarlılık
│   ├── vite-chunks.test.ts           # Build yapılandırması
│   ├── ci-config.test.ts             # CI pipeline
│   └── security-config.test.ts       # CSP, güvenlik
├── lib/
│   ├── ruleEngine.test.ts   # Fonksiyon yanında (co-located)
│   ├── auditEngine.test.ts
│   ├── similarity.test.ts
│   ├── dataIntegrityChecker.test.ts
│   └── utils-tr.test.ts
├── agents/
│   ├── baseAgent.test.ts
│   └── SatisAgent.test.ts
└── test/                 # Test yardımcıları
    └── setup.ts
```

**Kural:** Test, test ettiği fonksiyonla aynı dizinde olur (`co-located`). Sadece global/proje-seviyesi testler `__tests__/` içine konur.

## 3. Test Pattern'leri

### 3.1. Pure Function Test (En yaygın)

```typescript
describe('validateTransaction', () => {
  const prevDB = createTestDB();
  const nextDB = { ...prevDB, kasa: [...prevDB.kasa, { amount: -500 }] };

  it('negatif kasa bakiyesini blocklar', () => {
    const violations = validateTransaction(prevDB, nextDB);
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: 'negative_kasa', severity: 'block' })
    );
  });
});
```

### 3.2. Property-Based Test (fast-check)

```typescript
import * as fc from 'fast-check';

describe('resolveVersionCode', () => {
  it('geçerli pozitif integer string doğru parse edilir', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99999 }), (n) =>
        resolveVersionCode(String(n)) === n
      ),
      { numRuns: 100 }
    );
  });
});
```

### 3.3. Cross-File Consistency Test

```typescript
describe('version consistency', () => {
  it('package.json version == changelog[0].version', () => {
    expect(pkg.version).toBe(CHANGELOG[0].version);
  });
  it('APP_DEFAULT_VERSION == changelog[0].version', () => {
    expect(APP_DEFAULT_VERSION).toBe(CHANGELOG[0].version);
  });
});
```

**Kapsam:** Her cross-cutting concern (versiyon, tema, config) için bir consistency testi yazılır.

## 4. Test Edilmesi Gerekenler

| Öncelik | Ne test edilmeli | Örnek |
|---------|-----------------|-------|
| P0 (block) | RuleEngine kuralları | negatif stok, negatif kasa, duplicate transaction |
| P0 (block) | DB save/get döngüsü | save → get → aynı veri |
| P0 (block) | Versiyon tutarlılığı | package.json ↔ changelog ↔ appConfig |
| P1 (önemli) | AuditEngine diff | prev/next doğru farkı çıkarıyor mu |
| P1 (önemli) | AnomalyEngine dedektörleri | 8 dedektörün her biri |
| P1 (önemli) | Utils-tr | formatMoney, formatDate, genId |
| P2 (orta) | Similarity algoritması | Benzerlik skoru doğru mu |
| P2 (orta) | Dışa aktarım (excelExport) | JSON → Excel dönüşümü |

## 5. CI Entegrasyonu

```
CI pipeline:
  ├── lint          (eslint src --max-warnings 100)
  ├── typecheck     (tsc --noEmit)
  ├── test:run      (vitest run)          ← P0 testleri burada
  ├── coverage      (vitest run --coverage)
  └── build         (vite build)
```

## 6. Coverage Hedefleri

| Modül | Hedef | Durum |
|-------|-------|-------|
| ruleEngine | %100 | coverage var |
| auditEngine | %90+ | coverage var |
| similarity | %90+ | coverage var |
| utils-tr | %90+ | coverage var |
| version | %100 | coverage var |
| UI bileşenleri | Yok | coverage yok |

## 7. Yazılmayan Testler

- **UI render testleri:** 36 sayfa + 78 bileşen var. Render testi yazılmaz (bakım maliyeti > fayda).
- **E2E:** Sadece kritik akışlar (login, sync, backup) — Playwright ile 5-10 test.
- **Snapshot testleri:** Kesinlikle yok. Snapshot'lar anlamsız değişikliklerle bozulur.

## 8. Test Verisi Üretimi

```typescript
function createTestDB(): DB {
  return {
    _version: 1,
    products: [],
    sales: [],
    kasa: [],
    // ... minimal geçerli DB
  };
}
```

Her test kendi verisini üretir. Paylaşılan fixture yok. Testler izole ve paralel çalışır.
