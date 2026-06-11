---
name: parspel-audit
version: 2.0.0
description: PARSPEL projesine özel, mimariyi koruyan otonom frontend denetim ve onarım ajanı. Playwright + Lighthouse + Storybook MCP üçlüsünü kullanarak offline-first, RuleEngine korumalı, agent tabanlı iş uygulamasını denetler. v2: deterministik execution, strict tool pipeline, mandatory stop condition, loop-safe.
hooks:
  - name: audit
    type: command
    command: pnpm run lint:fallow:health
    auto: false
tools:
  - bash
  - read
  - write
  - edit
  - glob
  - grep
  - task
  - webfetch
requires:
  node: ">=22"
  pnpm: ">=9"
  mcp:
    - playwright
    - lighthouse
    - storybook
---

# PARSPEL — OTONOM DENETİM & SELF-HEALING MCP AGENT v2 (STABLE)

## ÇALIŞMA MODU

- **ONAY YOK** — tüm kararlar otonom
- **DURAKLAMA YOK** — kesintisiz çalışma
- **ARA RAPOR YOK** — sadece final rapor
- **SADECE EN SON RAPOR** — intermediate output üretme

## AMAÇ

PARSPEL frontend projesini:
1. Analiz et
2. Test et
3. Hata düzelt
4. Stabil hale getir

👉 UI, business logic ve mimari **korunur**
👉 Sadece **güvenli ve deterministik** fix yapılır

---

## STOP CONDITION (ZORUNLU)

Her iterasyonun sonunda:

```
1. Tüm tool execution DURDURULUR
2. Son state audit-state.json'a YAZILIR
3. Final rapor ÜRETİLİR
4. EXECUTION BİTER

→ restart YOK
→ continuation YOK
→ retry YOK
→ loop YOK
```

**3 iterasyon sonunda hata çözülmediyse:** "partial success" kabul edilir, raporla ve çık.

---

## FAIL-SAFE MODE

Eğer çözüm bulunamazsa:
- Issue loglanır
- SKIP edilir
- Sistem devam eder (donmaz)

---

## KIRMIZI ÇİZGİLER (ASLA)

### ❌ `src/components/ui/**`
- shadcn/ui kaynak kodlarıdır
- **Salt okunur.** İnceleyebilirsin, değiştiremezsin.
- Hata bulsan bile dokunma — upstream'den gelir.

### ❌ RuleEngine (`src/lib/ruleEngine.ts`)
- `severity: 'block'` kuralları değiştirilemez
- Bypass edilemez
- Disable edilemez
- RuleEngine 50ms timeout sonrası safe-pass yapar — bu normaldir, bug değildir.

### ❌ Offline-First Mimari
- **Network error = bug değildir.**
- Offline çalışma beklenen davranıştır.
- localStorage → IndexedDB → Firestore akışı normal çalışma modudur.
- `navigator.onLine === false` hata değil, durum bilgisidir.

### ❌ localStorage / IndexedDB Akışı
- `save()` pipeline'ı: `prevDB → updater → RuleEngine → AuditEngine → localStorage → IndexedDB → Firebase`
- Doğrudan localStorage'a yazma — her zaman `save()` / `saveGuarded()` / `saveWithLog()` kullan.

### ❌ Agent Sistemi
- 7 agent: `satis`, `stok`, `kasa`, `cari`, `fatura`, `rapor`, `deep_seek`
- Agent akış sırası: `satis → stok → kasa → cari → fatura → rapor`
- Bu sırayı değiştirme.

### ❌ Git İşlemleri (Tamamen Yasak)
- commit, push, branch, merge, rebase — **hiçbiri yapılamaz**
- Sadece öneri commit mesajı üretebilirsin

### ❌ Business Logic
- Business logic değiştirilemez
- UI redesign yapılamaz
- Flow order değiştirilemez

---

## SAFE FIX DEFINITION

### ✅ ALLOWED FIXES:
- TypeScript errors (type fixes, generics)
- null/undefined guards
- Runtime crash fixes (obvious bugs)
- Unused import cleanup
- State consistency bugs (minor)
- Missing loading/empty/error states
- Console error fixes

### ❌ FORBIDDEN:
- Business logic change
- RuleEngine modification
- UI redesign
- Flow order change
- Agent system modification
- Data pipeline change

---

## CHANGE SCOPE CONTROL

Her iterasyonda:
- Max **3 dosya** değiştirilebilir
- Aynı dosya **1 kez** değiştirilir
- Değişiklik sonrası build pipeline'ı geçilmeli

---

## TOOL EXECUTION PIPELINE (STRICT ORDER)

**SIRA DEĞİŞTİRİLEMEZ:**

```
1. STATIC ANALYSIS  → fs MCP + config okuma
2. PLAYWRIGHT MCP   → functional tests
3. LIGHTHOUSE MCP   → performance audit
4. STORYBOOK MCP    → UI validation
```

Her faz tamamlanmadan sonrakine geçilmez.

---

## TOOL USAGE RULES

- Aynı sayfa → max **1 test / tool / iterasyon**
- Aynı hata → max **2 attempt** (2. deneme sadece sonraki iterasyonda)
- 2 kez aynı hata → **SKIP + LOG**
- **Infinite retry YASAK**

---

## FAZ 0 — TARGETED INITIAL SCAN

📌 **SADECE ŞU DOSYALAR okunur:**

```
1. AGENTS.md
2. README.md
3. package.json
4. tsconfig.json
5. vite.config.ts
6. src/types/index.ts
7. src/lib/ruleEngine.ts        (READ ONLY)
8. src/lib/auditEngine.ts
9. src/config/tabs.ts
10. src/components/ui/**          (READ ONLY)
```

**KURALLAR:**
- Recursive full scan **YASAK**
- Sadece listed files okunur
- Ekstra dosya yalnızca **error varsa** açılır
- Recursive directory traversal **ihtiyaç halinde** kullanılabilir (yasak değil)
- İlk fazda full scan **yapılmaz**

---

## STATE SYSTEM (ZORUNLU)

`.opencode/memory/audit-state.json`

### Yapı:
```json
{
  "filesAnalyzed": [],
  "componentsChecked": [],
  "pagesTested": [],
  "lastHashes": {},
  "issuesFixed": [],
  "mcpStates": {
    "playwright": { "visitedPages": [], "testedFlows": [], "failedRoutes": [] },
    "lighthouse": { "pageScores": {}, "auditedPages": [] },
    "storybook": { "checkedComponents": [], "missingStories": [] }
  },
  "processedOperations": [],
  "incrementalMode": true
}
```

### KURALLAR:
- **Her iterasyon sonunda update ZORUNLU**
- Update başarısızsa iterasyon **INVALID** sayılır
- Retry yapılmaz → issue loglanır
- Aynı dosya 2. kez analiz edilmez (hash check)

### File Hash Tracking:
- `filePath → hash → compare → skip / analyze`
- Dosya `filesAnalyzed`'da varsa VE hash aynıysa → **SKIP**

---

## FAZ 1 — SEED DATA (ZORUNLU BLOK)

Seed data olmadan test **BAŞLAMAZ**.

```ts
const seed = {
  customers: 50,    // cari hesap
  products: 100,    // stok
  sales: 500,       // satış kaydı
  cashRegisters: 3, // kasa
  invoices: 200,    // fatura
};
```

Seed data mevcut değilse, `src/lib/seedData.ts` oluştur ve `localStorage`'a `save()` ile yaz.

---

## FAZ 2 — PLAYWRIGHT MCP (FUNCTIONAL TEST)

### TEST KAPSAMI:
- `src/config/tabs.ts`'deki tüm sayfalar
- CRUD akışları (satış / stok / kasa / fatura)
- Form validation
- Error / loading / empty / success state'leri
- Offline behavior
- Console error check

### A11y:
- axe-core ile tara
- WCAG AA minimum
- Eksik label, alt text, ARIA
- Klavye tuzağı, focus sorunları
- Kontrast hataları

### KURALLAR:
- Her page sadece **1 kez** test edilir
- Aynı page retry **YOK**
- Failure → next iteration
- Responsive: 375px, 768px, 1280px

---

## FAZ 3 — LIGHTHOUSE MCP (PERFORMANCE)

### HEDEFLER:
| Kategori | Minimum |
|----------|---------|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |

### KURALLAR:
- Sadece **CRITICAL** fix yapılır
- UI rewrite **YASAK**
- Performance tweak safe scope içinde

---

## FAZ 4 — STORYBOOK MCP

### KONTROLLER:
- A11y
- Responsive
- Dark/light mode
- Design token compliance
- Missing stories

### KURALLAR:
- `src/components/ui/**` sadece **READ ONLY**
- Fix sadece **wrapper** seviyesinde yapılır

---

## RİSK ÖNCELİK SİSTEMİ

```yaml
P0 – KRİTİK (Önce bunları çöz):
  - Build başarısızlığı
  - TypeScript hataları
  - RuleEngine block hataları
  - save() pipeline bozulması
  - Veri kaybı riski
  → P0 çözülmeden P1'e geçme.

P1 – YÜKSEK:
  - ESLint hataları (max 100 warnings)
  - A11y blocker'ları (WCAG AA ihlalleri)
  - Responsive kırılmalar
  - Runtime JavaScript hataları

P2 – ORTA:
  - Lighthouse skorları hedef altı
  - Performans sorunları
  - Eksik state'ler
  - Storybook eksikleri

P3 – DÜŞÜK (En son):
  - UI polish
  - Kod temizliği
```

---

## BUILD POLİTİKASI

Her değişiklikten sonra:

```
1. lint       → pnpm run lint
2. typecheck  → pnpm run typecheck
   ── geçerse ──
3. test       → pnpm run test:run
   ── geçerse ──
4. build      → pnpm run build
```

3 denemede geçmezse: raporla, geç.

---

## CHANGELOG ZORUNLULUĞU

- Her dosya değişikliğinden sonra `src/lib/changelog.ts` güncellenmeli
- Değişen dosyalar + sebep yazılmalı
- Format: `{ type: 'yeni'|'iyilestirme'|'duzeltme'|'kaldirildi', text: '...' }`
- Salt okunur denetim (sadece inceleme) → changelog gerekmez

---

## İTERASYON SİSTEMİ

**MAX 3 İTERASYON:**

| İterasyon | Kapsam |
|-----------|--------|
| 1 | Tam denetim (Playwright + Lighthouse + Storybook) |
| 2 | Kritik düzeltmeler + build doğrulama |
| 3 | Son denetim + final rapor |

**LOOP:**
```
ANALYZE → FIX → TEST → UPDATE STATE → (next iteration or STOP)
```

**STOP CONDITION aktif:** 3. iterasyon sonunda execution biter, restart yok.

---

## FİNAL RAPOR FORMATI

```markdown
# PARSPEL Frontend Denetim Raporu v2

## Özet
| Metrik | Değer |
|--------|-------|
| Dosya Değiştirilen | X |
| TypeScript Hatası Giderilen | X |
| ESLint Hatası Giderilen | X |
| A11y Sorunu Giderilen | X |
| Performans İyileştirmesi | X |
| İterasyon Sayısı | X / 3 |

## Lighthouse Skorları
| Sayfa | Perf | A11y | BestP | SEO |
|-------|------|------|-------|-----|

## Playwright Sonuçları
- Toplam test: X / Geçen: X / Kalan: X

## Storybook Durumu
- Checked components: X / Missing stories: X

## Kırmızı Çizgi İhlalleri
- (olmamalı)

## Kalan Bilinen Sorunlar (Skipped)
- ...

## Değiştirilen Dosyalar
- ...

Rapor Sonu.
```

---

## PARSPEL'E ÖZEL KONTROL LİSTESİ

- [ ] `src/lib/changelog.ts` güncel mi?
- [ ] `save()` pipeline'ı bozulmamış mı?
- [ ] Agent akış sırası korunmuş mu?
- [ ] `Empty` komponenti tüm boş state'lerde kullanılmış mı?
- [ ] `SkeletonLoader` tüm loading state'lerde kullanılmış mı?
- [ ] Toast'lar `sonner` ile mi gösteriliyor?
- [ ] Tailwind CSS dışında inline style var mı?
- [ ] `src/components/ui/` dosyalarına dokunulmamış mı?
- [ ] localStorage'a doğrudan yazma var mı?
- [ ] Route'lar `React.lazy()` ile sarılı mı?
- [ ] Tüm route'lar `<Suspense>` içinde mi?
- [ ] Firebase import'ları tree-shaking uyumlu mu?
