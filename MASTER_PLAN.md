# PARSPEL — Master İyileştirme Planı

> Oluşturulma: 5 Haziran 2026
> Son güncelleme: 5 Haziran 2026
> Kapsam: ~136 madde (14 tamamlandı)

---

## A — KRİTİK HATALAR (7)  ✓ 5/7 tamam

| # | Hata | Dosya:Satır | Şiddet | Durum |
|---|------|-------------|--------|-------|
| A1 | SSE deadlock: `[DONE]` iç döngüyü kırar, dış `while(true)` sonsuz | `deepseek.ts:51`, `aiApi.ts:56,119` | CRITICAL | ✓ DÜZELTİLDİ |
| A2 | `iadeYap` çok-ürünlü: `qty` öğe bazlı dağıtım desteği eklendi | `SatisAgent.ts:186` | CRITICAL | ✓ DÜZELTİLDİ |
| A3 | `fiyatDuzelt` kar hesabı: tüm `items[]` güncellenir, total/profit items'dan hesaplanır | `SatisAgent.ts:266` | CRITICAL | ✓ DÜZELTİLDİ |
| A4 | useDB init race: Firebase → IndexedDB sıralı yükleme | `core.ts:221,240` | CRITICAL | ✓ DÜZELTİLDİ |
| A5 | `saveUsers` hep true döner: Firebase hatasında `false` döner | `userManager.ts:120-135` | CRITICAL | ✓ DÜZELTİLDİ |
| A6 | `saveUsers` salt regex: `match(/../g)!` non-null assertion | `userManager.ts:147` | HIGH | ✓ DÜZELTİLDİ |
| A7 | P1 property test tautoloji: `beklenen === computed` aynı hesapla | `kapsamli-senaryo.test.ts:2729` | HIGH | |
| A6 | `saveUsers` salt regex: `match(/../g)!` non-null assertion | `userManager.ts:147` | HIGH |
| A7 | P1 property test tautoloji: `beklenen === computed` aynı hesapla | `kapsamli-senaryo.test.ts:2729` | HIGH |

---

## B — GÜVENLİK (10)

| # | Sorun | Dosya | Durum |
|---|-------|-------|-------|
| B1 | `.env`'de 2 plaintext API key (DeepSeek, LM Studio, Gemini) | `.env` | ✓ TEMİZLENDİ |
| B2 | Firebase'de API key'ler şifresiz saklanıyor | `aiKeys.ts:50` | |
| B3 | Gemini API key URL'de query parameter | `aiApi.ts:90` | |
| B4 | Şifre hash'leri localStorage'da — XSS riski | `userManager.ts:43` | |
| B5 | Eski SHA-256 hash'ler salt'sız (rainbow table) | `userManager.ts:159` | |
| B6 | CSP `worker-src` eksik — worker'lar bloklanır | `index.html` | ✓ DÜZELTİLDİ |
| B7 | CSP `connect-src` react-grab.com yok | `index.html` | ✓ DÜZELTİLDİ |
| B8 | `dangerouslySetInnerHTML` kullanımı var (XSS) | Birkaç sayfada | ✅ (zaten DOMPurify ile korunuyor) |
| B9 | `apple-touch-icon.png` referansı var ama dosya yok | `public/` | ✓ OLUŞTURULDU |
| B10 | `.env.example` güncel değil — değişken eksik | `.env.example` | ✓ DÜZELTİLDİ |

---

## C — MİMARİ (8)

| # | Sorun | Dosya |
|---|-------|-------|
| C1 | `processIntent()` geçişi yarım: orchestrator deprecated ama hâlâ çalışıyor | `agents/` vs `domain/` |
| C2 | Çift event sistemi: AgentBus + domainEventBus, ikisi de mitt | `agents/AgentBus.ts`, `domain/eventBus.ts` |
| C3 | useDB monolit: 640 satırda 7 sorumluluk | `hooks/db/core.ts` |
| C4 | Agent sistemi over-engineering: 7 agent + permission + bus + orchestrator | `agents/` |
| C5 | localStorage 5MB limiti aşılabilir, Firebase 1MB/doc limiti aşılabilir | `sync.ts:82` |
| C6 | Settings.tsx hâlâ 4394 satır — bölme bitmemiş | `pages/Settings.tsx` |
| C7 | excel-merge.ts 769 satır — 4 parser + merge + diff + search + clean tek dosyada | `lib/excel-merge.ts` |
| C8 | PWA manifest.json yok, service worker yok | `public/` |

---

## D — KOD TEKRARI (7)

| # | Tekrar | Dosyalar |
|---|--------|----------|
| D1 | save vs saveGuarded ~%90 ortak | `core.ts:259-337` vs `432-516` |
| D2 | iptalEt vs iadeYap kasa/cari reversal ~%80 ortak | `SatisAgent.ts:140-177` vs `220-257` |
| D3 | fullRestoreDB vs makeDefaultDB şema tekrarı | `backup.ts` vs `core.ts` |
| D4 | localStorage size check 2 farklı eşikle 2 kez | `dataIntegrityChecker.ts:173-179` vs `217-225` |
| D5 | excel-merge right join merge mantığını 2 kez çalıştırır | `excel-merge.ts:700-729` vs `646-698` |
| D6 | Dashboard varyantları neredeyse aynı | 5 Dashboard dosyası |
| D7 | Test senaryo tekrarları (indirim, çok-ürün, TRANSACTION_LIMIT) | 4 test dosyası arasında |

---

## E — TİP GÜVENLİĞİ (8)

| # | Sorun | Dosya:Satır |
|---|-------|-------------|
| E1 | `as unknown as Record<string, unknown>` — tip yalanı | `saleCompletion.ts:152,161,172,183` |
| E2 | `as` ile payload cast — validation yok | `SatisAgent.ts:317-326` |
| E3 | `IssueCategory` → `AnomalyCategory` hatalı cast | `anomalyEngine.ts:536` |
| E4 | `undefined as unknown as string` | `backup.ts:99,115,131,139` |
| E5 | `res.body!.getReader()` — non-null assertion | `deepseek.ts:37`, `aiApi.ts:44,108` |
| E6 | `eslint-disable no-explicit-any` yaygın | Tüm büyük sayfalarda |
| E7 | `(window as any)` kalıntıları | `App.tsx:247` ve diğer |
| E8 | `encoding: "utf8" as never` | `core.ts:530` |

---

## F — PERFORMANS (7)

| # | Sorun | Dosya |
|---|-------|-------|
| F1 | useCallback/useMemo eksik: çoğu event handler her render'da yeniden oluşur | Tüm sayfalar |
| F2 | Inline style objeleri: her render'da yeni nesne | Tüm sayfalar |
| F3 | `JSON.stringify(db)` 2 kez redundant | `dataIntegrityChecker.ts:174,218` |
| F4 | localStorage.setItem senkron — büyük DB'de jank | `core.ts` |
| F5 | Anomali taraması senkron CPU-bloking — 500ms | `anomalyEngine.ts:600` |
| F6 | Levenshtein full DP tablosu — O(m*n) memory | `excel-merge.ts:289` |
| F7 | `calcSubtotal` 2 kez çağrılıyor | `saleCompletion.ts:100-103` |

---

## G — VERİ BÜTÜNLÜĞÜ (6)

| # | Sorun | Dosya:Satır |
|---|-------|-------------|
| G1 | 1000 stok hareketi sessizce kesilir — kullanıcı habersiz | `core.ts:272` |
| G2 | `__truncated__` sentinel ile sessiz data loss | `storageQuota.ts:112` |
| G3 | Last-write-wins save queue — ara durumlar kaybolur | `core.ts:186-211` |
| G4 | Firebase sync setTimeout uncached promise | `core.ts:332` |
| G5 | Kasa/POS ödemeleri hep "banka"ya gider — POS ayrımı kaybolur | `aiActions.ts:432` |
| G6 | Günlük ortalama /30 ile sabit — yeni şirkette false positive | `anomalyEngine.ts:338` |

---

## H — TEST KALİTESİ (10)

| # | Sorun | Dosya |
|---|-------|-------|
| H1 | P1 tautoloji — test kendini test ediyor | `kapsamli-senaryo.test.ts:2729` |
| H2 | GitHub workflow PBT tautoloji | `github-workflow-cleanup.test.ts:179` |
| H3 | `info` severite testleri — hiçbir assertion yok | `spec-compliance.test.ts:11` |
| H4 | TAB_ROUTE_MATCH hiç fail etmez — tautolojik | `navigation-rules.ts:44` |
| H5 | Private property erişimi (`agent["db"]`) — kırılgan | `baseAgent.test.ts:62`, `SatisAgent.test.ts:62` |
| H6 | Mutable shared state — test sırası bağımlı | `uygulama-gercek.test.ts:379` |
| H7 | Sabit tarih "2020-01-01" — zaman bombası | `kapsamli-senaryo.test.ts:1608` |
| H8 | Platform-bağımlı boyut testi — `chunkSize: 900` | `dataIntegrity.test.ts:298` |
| H9 | SatisAgent'de discount testi yok, banka/pos testi yok | `SatisAgent.test.ts` |
| H10 | min_stock kuralı hiç test edilmemiş | `ruleEngine.test.ts` |

---

## I — SPES KONTROLLER (6)

| # | Sorun | Dosya |
|---|-------|-------|
| I1 | NO_RELATIVE_IMPORT `../../` multi-level import'ları yakalamaz | `component-rules.ts:37` |
| I2 | SHADCN_UNTOUCHED 200 satır eşiği çok kolay atlatılır | `component-rules.ts:96` |
| I3 | NO_STATIC_INLINE_STYLE exclusion list yetersiz | `component-rules.ts:59` |
| I4 | Component test coverage spec'i yok | — |
| I5 | Accessibility spec'i yok | — |
| I6 | Performance budget spec'i yok | — |

---

## J — ARAYÜZ & ERİŞİLEBİLİRLİK (5)

| # | Sorun | Kapsam |
|---|-------|--------|
| J1 | İkon-butonlarda `aria-label` yok | Tüm sayfalar |
| J2 | `dangerouslySetInnerHTML` kullanımı | AIAsistan.tsx ve diğer |
| J3 | No StrictMode | `main.tsx` |
| J4 | No top-level ErrorBoundary | `main.tsx` |
| J5 | No loading spinner — `index.html`'de boş div | `index.html` |

---

## K — DOKÜMAN & YANLIŞ BİLGİ (5)

| # | Sorun | Dosya |
|---|-------|-------|
| K1 | "PWA 53 asset precache" yazıyor ama manifest/sw yok | `DEVELOPMENT.md:162` |
| K2 | "design-tokens.css ayrıldı" yazmıyor | `DEVELOPMENT.md:12` |
| K3 | Build boyutu ~3.25MB ama 3.0MB yazıyor | `DEVELOPMENT.md:158` |
| K4 | CSP meta tag var ama WEEKLY_PLAN'da `[ ]` (bitmemiş işaretli) | `WEEKLY_PLAN.md` |
| K5 | `.env.example`'da değişken eksik | `.env.example` |

---

## L — WEEKLY_PLAN'DAKİ YAPILMAMIŞ 57 İŞ

> WEEKLY_PLAN.md'de 57 task'ın tamamı `[ ]` (başlanmamış)

| Hafta | Konu | Task Sayısı |
|-------|------|:-----------:|
| Week 1 | Güvenlik — DOMPurify, XSS, API key rotation, CSP | 7 |
| Week 2 | Hata yönetimi — boş catch, logger, crash reporting | 5 |
| Week 3 | Tip güvenliği — any temizliği, noUnusedLocals | 5 |
| Week 4 | Test kapsamı — testing-library, lib testleri | 13 |
| Week 5 | Test kapsamı — agent testleri, DB testleri | 12 |
| Week 6 | Refactor — Settings/AIAsistan/Fatura bölme, dead code | 15 |

---

## FALLOW ÖLÇÜMLERİ (5 Haziran 2026)

| Metrik | Başlangıç | Şimdi | Değişim |
|--------|-----------|-------|---------|
| dead-code issue | 249 | 0 | ▼ 249 (✓)
| duplicate clone groups | 140 | 126 | ▼ 14 |
| health issues | 474 | 440 | ▼ 34 |
| maintainability | 83.3 | 89.2 | ▲ 5.9 |

## YAPILAN ANA DEĞİŞİKLİKLER

1. **Fallow entegrasyonu** — `.fallowrc.json` yapılandırması, npm script'leri, skill dosyası
2. **Dead-code temizliği** — 249 → 0;
   - `scripts/archive/` taşındı
   - Gereksiz bağımlılıklar temizlendi (`concat-map`)
   - `fast-check`, `lightningcss-win32` → devDependencies
   - Tüm yanlış pozitifler yapılandırmaya eklendi
   - `usedClassMembers` ile polimorfik metotlar susturuldu
3. **Kritik hatalar (A1-A5)** — SSE deadlock, multi-item iade/fiyat, init race, saveUsers hep-true
4. **CSP meta tag** — `index.html`'e eklendi

---

## UYGULAMA SIRASI ÖNERİSİ

```
Hafta 1-2: A (kritik hatalar) + B (güvenlik) + L/W1
Hafta 3-4: C (mimari) + E (tip güvenliği) + L/W2-3
Hafta 5-6: G (veri bütünlüğü) + L/W6 (refactor)
Hafta 7:   F (performans) + D (kod tekrarı)
Hafta 8:   H (test) + I (spes) + L/W4-5
```
