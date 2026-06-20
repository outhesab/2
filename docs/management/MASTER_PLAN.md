# PARSPEL — Master İyileştirme Planı

> Oluşturulma: 5 Haziran 2026
> Son güncelleme: 13 Haziran 2026
> Kapsam: ~70 madde (çoğu tamamlandı, v3.23.3 itibarıyla güncel)
> 
> ⚠️ Bu doküman v3.7.x referansıyla yazılmıştı. Kod şu an v3.23.3'te.
> Çoğu madde tamamlandı. Güncel durum için AGENTS.md (Bölüm 9) bakın.

---

## A — KRİTİK HATALAR (7)  ✓ 7/7 tamam

| # | Hata | Dosya:Satır | Şiddet | Durum |
|---|------|-------------|--------|-------|
| A1 | SSE deadlock: `[DONE]` iç döngüyü kırar, dış `while(true)` sonsuz | `deepseek.ts:51`, `aiApi.ts:56,119` | CRITICAL | ✓ DÜZELTİLDİ |
| A2 | `iadeYap` çok-ürünlü: `qty` öğe bazlı dağıtım desteği eklendi | `SatisAgent.ts:186` | CRITICAL | ✓ DÜZELTİLDİ |
| A3 | `fiyatDuzelt` kar hesabı: tüm `items[]` güncellenir, total/profit items'dan hesaplanır | `SatisAgent.ts:266` | CRITICAL | ✓ DÜZELTİLDİ |
| A4 | useDB init race: Firebase → IndexedDB sıralı yükleme | `core.ts:221,240` | CRITICAL | ✓ DÜZELTİLDİ |
|| A6 | `saveUsers` salt regex: `match(/../g)!` non-null assertion | `userManager.ts:147` | HIGH | ✓ DÜZELTİLDİ |
|| A7 | P1 property test tautoloji: `beklenen === computed` aynı hesapla | `kapsamli-senaryo.test.ts:2729` | HIGH | ✅ v3.7.x'te düzeltildi / test dosyası kaldırıldı |

---

## B — GÜVENLİK (10)

| # | Sorun | Dosya | Durum |
|---|-------|-------|-------|
|| B1 | `.env`'de 2 plaintext API key (DeepSeek, LM Studio, Gemini) | `.env` | ✓ TEMİZLENDİ |
|| B2 | Firebase'de API key'ler şifresiz saklanıyor | `aiKeys.ts:50` | ✅ AES-GCM ile şifreli (v3.7.1) |
|| B3 | Gemini API key URL'de query parameter | `aiApi.ts:90` | ✅ `X-Goog-Api-Key` header'ında (v3.7.1) |
|| B4 | Şifre hash'leri localStorage'da — XSS riski | `userManager.ts:43` | ✅ IndexedDB + AES-GCM (v3.7.1) |
|| B5 | Eski SHA-256 hash'ler salt'sız (rainbow table) | `userManager.ts:159` | ✅ PBKDF2 + 600k iterasyon + salt (v3.7.1) |
|| B6 | CSP `worker-src` eksik — worker'lar bloklanır | `index.html` | ✓ DÜZELTİLDİ |
|| B7 | CSP `connect-src` react-grab.com yok | `index.html` | ✓ DÜZELTİLDİ |
|| B8 | `dangerouslySetInnerHTML` kullanımı var (XSS) | Birkaç sayfada | ✅ (zaten DOMPurify ile korunuyor) |
|| B9 | `apple-touch-icon.png` referansı var ama dosya yok | `public/` | ✓ OLUŞTURULDU |
|| B10 | `.env.example` güncel değil — değişken eksik | `.env.example` | ✓ DÜZELTİLDİ |

---

## C — MİMARİ (8) — 5/8 tamam

| # | Sorun | Dosya | Durum |
|---|-------|-------|-------|
| C1 | `processIntent()` geçişi: orchestrator silindi, domain servisler tamam | `agents/` vs `domain/` | ✅ TAMAMLANDI |
| C2 | Çift event sistemi: AgentBus + domainEventBus | `agents/AgentBus.ts`, `domain/eventBus.ts` | ⬜ Ertelendi |
| C3 | useDB monolit | `hooks/db/` | ✅ 7 dosyaya bölündü |
| C4 | Agent sadeleştirme | `agents/` | ⬜ |
| C5 | localStorage 5MB limiti aşılabilir | `sync.ts:82` | ⬜ |
| C6 | Settings.tsx | `pages/Settings.tsx` | ✅ 322 satır + 13 modül |
| C7 | excel-merge.ts 742 satır | `lib/excel-merge.ts` | ⬜ |
| C8 | PWA manifest + SW | `public/` | ✅ VitePWA ile aktif |

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

## G — VERİ BÜTÜNLÜĞÜ (6) — ✅ 6/6 tamam

| # | Sorun | Dosya:Sati | Durum |
|---|-------|------------|-------|
| G1 | 1000 stok hareketi sessizce kesilir | core.ts:272 | ✅ UI bildirimi eklendi (setDbError) |
| G2 | __truncated__ sentinel ile sessiz data loss | storageQuota.ts:112 | ✅ storageQuota.ts olud kod, kaldirildi (v3.7.1) |
| G3 | Last-write-wins save queue ara durumlar kaybolur | core.ts:186-211 | ✅ Queue sistemi eklendi (_saveQueue, max 10) |
| G4 | Firebase sync setTimeout uncached promise | core.ts:332 | ✅ SyncQueue entegre edildi |
| G5 | Kasa/POS odemeleri hep bankaya gider | aiActions.ts:432 | ✅ processIntent ile düzeltildi |
| G6 | Gunluk ortalama /30 ile sabit | anomalyEngine.ts:338 | ✅ Gercek gun sayisi kullaniliyor (v3.7.x) |

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
| K4 | CSP meta tag var ve WEEKLY_PLAN'da [x] isaretli (cozulmus) | [x] |
| K5 | `.env.example`'da değişken eksik | `.env.example` |

---

## L — WEEKLY_PLAN DURUMU

> WEEKLY_PLAN.md'de 57 task'tan 52'si tamamlandı, 5'i kaldı (v3.23.2)

| Hafta | Konu | Task Sayısı |
|-------|------|:-----------:|
| Week 1 | Güvenlik — DOMPurify, XSS, API key rotation, CSP | 7 ✅ |
| Week 2 | Hata yönetimi — boş catch, logger, crash reporting | 5 ✅ |
| Week 3 | Tip güvenliği — any temizliği, noUnusedLocals | 5 ✅ |
| Week 4 | Test kapsamı — testing-library, lib testleri | 13 ✅ |
| Week 5 | Test kapsamı — agent testleri, DB testleri | 12 (11✅) |
| Week 6 | Refactor — Settings/AIAsistan/Fatura bölme, dead code | 15 ✅ |
| **TOPLAM** | | **57 (52✅ 5⬜)** |

---

## P — SAYFA BOYUT İHLALLERİ (9)

> **Kural:** Page component max 800 satır (AGENTS.md)  
> **Gerçek Durum (v3.23.2):** 9 sayfa kuralı ihlal ediyor

| # | Dosya | Satır | Aşım | Öncelik |
|---|-------|------|------|---------|
| P1 | `pages/Suppliers.tsx` | 1298 | +498 | 🔴 KRİTİK |
| P2 | `pages/settings/SettingsBackup.tsx` | 1206 | +406 | 🔴 YÜKSEK |
| P3 | `pages/Monitor.tsx` | 1178 | +378 | 🔴 YÜKSEK |
| P4 | `pages/BugHunter.tsx` | 1092 | +292 | 🟡 ORTA |
| P5 | `pages/Bank.tsx` | 1031 | +231 | 🟡 ORTA |
| P6 | `pages/Cari.tsx` | 1006 | +206 | 🟡 ORTA |
| P7 | `pages/Dashboard.tsx` | 851 | +51 | 🟢 DÜŞÜK |
| P8 | `pages/Products.tsx` | 833 | +33 | 🟢 DÜŞÜK |
| P9 | `pages/AnomaliOneri.tsx` | 819 | +19 | 🟢 DÜŞÜK |

### ✅ Bölünen Sayfalar
| Dosya | Eski | Şimdi | |
|-------|------|-------|--|
| Reports.tsx | 1755 satır | 124 satır + 7 modül | ✅ |
| AIAsistan.tsx | 1354 satır | 562 satır + 3 modül | ✅ |
| Fatura.tsx | Devasa | 360 satır + 5 modül | ✅ |
| Settings.tsx | 4394 satır | 322 satır + 13 modül | ✅ |

**Tavsiye:** P1-P6 acil refactor gerektirir (toplam ~20 saat)

---

## FALLOW ÖLÇÜMLERİ (5 Haziran 2026)

| Metrik | Başlangıç | Şimdi | Değişim |
|--------|-----------|-------|---------|
| dead-code issue | 249 | 0 | ▼ 249 (✓)
| duplicate clone groups | 140 | 126 | ▼ 14 |
| health issues | 474 | 440 | ▼ 34 |
| maintainability | 83.3 | 89.2 | ▲ 5.9 |

> Ölçüm tarihi: 5 Haziran 2026

## YAPILAN ANA DEĞİŞİKLİKLER

1. **Fallow entegrasyonu** — `.fallowrc.json` yapılandırması, npm script'leri, skill dosyası
2. **Dead-code temizliği** — 249 → 0;
   - `scripts/archive/` taşındı
   - Gereksiz bağımlılıklar temizlendi (`concat-map`)
   - `fast-check`, `lightningcss-win32` → devDependencies
   - Tüm yanlış pozitifler yapılandırmaya eklendi
   - `usedClassMembers` ile polimorfik metotlar susturuldu
3. **Kritik hatalar (A1-A7)** — SSE deadlock, multi-item iade/fiyat, init race, saveUsers
4. **CSP meta tag** — `index.html`'e eklendi
5. **useDB refactor** — 640 satır → 7 dosyaya bölündü (index.ts 192, backup.ts 451, sync.ts 123, vs.)
6. **Settings refactor** — 4394 satır → 292 satıra düştü, 19 alt modül oluşturuldu

---

## KALAN İŞLER (Güncel — v3.23.3)

```text
Hafta 1:   Suppliers.tsx böl (~4 saat)
Hafta 2:   SettingsBackup.tsx + Monitor.tsx böl (~7 saat)
Hafta 3:   BugHunter.tsx + Bank.tsx + Cari.tsx böl (~9 saat)
Opsiyonel: C7 (excel-merge bölme), Domain testleri, Doküman güncelleme
```

**Toplam tahmini iş:** ~20 saat (önceki tahmin: 100 saat ❌ → 40 saat ❌ → 20 saat ✅)
