# PARSPEL — Test Stratejisi

> Versiyon: 3.31.0 | Tarih: 17 Haziran 2026
> Test: 555+ test, Vitest + fast-check (property-based)

## Genel Durum

- **Framework:** Vitest + fast-check (property-based)
- **Test dosyası:** 40+ adet
- **Total test:** 555+ (tamamı ✅)
- **Süre:** ~49 saniye

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

| Seviye | Araç | Hız | Kapsam |
|--------|------|-----|--------|
| Unit | vitest + fast-check | ~1ms/test | Saf fonksiyonlar: ruleEngine, auditEngine, similarity, utils |
| Integration | vitest | ~10ms/test | prevDB → işlem → nextDB senaryoları, multi-agent flow |
| E2E | Playwright | ~1s/test | Firebase sync, export/import, login akışı |

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

**Kural:** Test, test ettiği fonksiyonla aynı dizinde olur (`co-located`).

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

## 4. CI Pipeline

```
CI pipeline:
  ├── lint          (eslint src --max-warnings 100)
  ├── typecheck     (tsc --noEmit)
  ├── test:run      (vitest run)
  ├── coverage      (vitest run --coverage)
  └── build         (vite build)
```

## 5. Coverage Hedefleri

| Modül | Hedef |
|-------|-------|
| ruleEngine | %100 |
| auditEngine | %90+ |
| similarity | %90+ |
| utils-tr | %90+ |
| version | %100 |
| UI bileşenleri | Yok (bakım maliyeti > fayda) |

## 6. Test Verisi Üretimi

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
