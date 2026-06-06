---
name: parspel-test
description: >
  PARSPEL icin test yazma. Vitest + fast-check (property-based). prevDB → islem
  → nextDB pattern'i, RuleEngine/AuditEngine/Agent testleri, co-located test
  dosyalari, cross-file consistency testleri, E2E Playwright, CI entegrasyonu.
  Yeni bir fonksiyon/ajan/test yazarken veya mevcut testleri duzenlerken kullan.
version: 1.1.0
author: PARSPEL
hooks:
  onComplete: true
---

# PARSPEL — Test Yazma

## Overview

PARSPEL test stratejisi: unit (vitest + fast-check), integration (prevDB → işlem → nextDB), E2E (Playwright). Property-based testler ile edge case'leri yakala.

## Test Piramidi

| Seviye | Araç | Adet | Kapsam |
|--------|------|------|--------|
| Unit | vitest + fast-check | 100+ | Saf fonksiyonlar, utility'ler |
| Integration | vitest | 20-50 | prevDB → işlem → nextDB |
| E2E | Playwright | 5-10 | Kritik kullanıcı akışları |

## Instructions

### 1. Test Dosyası Konumu

- Test, test ettiği fonksiyonla **aynı dizinde** olur (co-located)
- `src/__tests__/` sadece global/proje-seviyesi testler için
- `src/test/setup.ts` → test yardımcıları

### 2. Pattern 1: Pure Function Test

```typescript
import { describe, expect, it } from "vitest";
import { validateTransaction } from "@/lib/ruleEngine";
import { createTestDB } from "@/test/setup";

describe("validateTransaction", () => {
  it("negatif kasa bakiyesini blocklar", () => {
    const prevDB = createTestDB();
    const nextDB = { ...prevDB, kasa: [...prevDB.kasa, { amount: -500 }] };
    const violations = validateTransaction(prevDB, nextDB);
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: "negative_kasa", severity: "block" })
    );
  });
});
```

### 3. Pattern 2: Agent Test (prevDB → işlem → nextDB)

```typescript
import { SatisAgent } from "@/agents/SatisAgent";
import type { AgentContext } from "@/agents/types";

// DB fabrika
function makeDB(overrides = {}): DB { /* mevcut test'teki gibi */ }

// Context fabrika
function makeContext(initialDB: DB) {
  let currentDB = structuredClone(initialDB);
  return {
    ctx: {
      getDB: () => currentDB,
      save: (updater) => { currentDB = updater(currentDB); },
    },
    getDB: () => currentDB,
  };
}

it("başarılı işlem", async () => {
  const db = makeDB({ products: [testProduct] });
  const { ctx, getDB } = makeContext(db);
  agent.bagla(ctx);
  const sonuc = await agent.yeniSatis(params);
  expect(sonuc.ok).toBe(true);
  const nextDB = getDB();
  expect(nextDB.products[0].stock).toBe(testProduct.stock - 2);
});
```

#### Zorunlu Test Senaryoları (P0):
- `bagla()` çağrılmamışsa hata
- Yetki yoksa hata (`yetkiKontrolu` mock)
- Başarılı işlem + DB state kontrolü
- Hata durumları (boş liste, yetersiz stok, vb.)

### 4. Pattern 3: Property-Based Test (fast-check)

```typescript
import * as fc from "fast-check";

it("geçerli pozitif integer string doğru parse edilir", () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 99999 }), (n) =>
      resolveVersionCode(String(n)) === n
    ),
    { numRuns: 100 }
  );
});
```

**İleri property-based: state machine testi**
```typescript
import * as fc from "fast-check";

// DB işlemleri için state machine
class DBModel {
  items: string[] = [];
  
  add(item: string) { this.items.push(item); }
  remove(item: string) {
    this.items = this.items.filter(i => i !== item);
  }
}

it("DB işlemleri model ile tutarlı", () => {
  fc.assert(
    fc.property(fc.array(fc.string()), (commands) => {
      const model = new DBModel();
      const real = new DBModel();
      // Her iki modelde aynı işlemleri yap
      // Son durumları karşılaştır
    })
  );
});
```

**Hata yakalama ipucu:** `fc.assert()` ikinci parametre olarak `{ seed: 42 }` ile reproduce edilebilir.

### 5. Pattern 4: Cross-File Consistency Test

```typescript
it("package.json version == changelog[0].version", () => {
  expect(pkg.version).toBe(CHANGELOG[0].version);
});
```

### 6. E2E Test (Playwright)

```typescript
// tests/e2e/satis-akisi.spec.ts
import { test, expect } from "@playwright/test";

test("tam satış akışı", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-testid="yeni-satis"]');
  await page.fill("#urun-ad", "Soba X");
  await page.click('[data-testid="kaydet"]');
  await expect(page.locator(".toast-success")).toBeVisible();
});
```

### 7. CI Entegrasyonu

`.github/workflows/test.yml`:

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: pnpm install
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run test:run
```

## Coverage Hedefleri

| Modül | Hedef |
|-------|-------|
| ruleEngine | %100 |
| auditEngine | %90+ |
| similarity | %90+ |
| utils-tr | %90+ |
| Agent sınıfları | %90+ kritik path'ler |
| Sayfalar | Smoke test (render) |

## Mock/Fixture Stratejisi

- **localStorage**: `vitest` `--environment=jsdom` ile otomatik mock
- **Firebase**: Testlerde Firebase çağrısı yapma, service katmanını mock'la
- **Agent context**: `makeContext()` fabrika fonksiyonu kullan
- **Test verisi**: `createTestDB()` ile temiz başlangıç

## Yazılmayan Testler

- UI render testleri (36 sayfa + 78 bileşen → bakım maliyeti yüksek)
- Snapshot testleri (kesinlikle yok)

## Hooks

### onComplete
- Testleri çalıştır: `pnpm run test:run`
- Coverage kontrol et
- CI config varsa kontrol et
