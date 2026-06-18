# PARSPEL — Tam Uygulama Analiz Raporu

> **Kaynak:** AI Agent tarafından 18 Haziran 2026'da oluşturuldu.
> **Güncellenme:** 18 Haziran 2026 — v3.32.0 ile senkronize edildi.

---

## 1. PROJE KİMLİĞİ

| Özellik | Değer |
|---------|-------|
| **Uygulama Adı** | PARSPEL |
| **Versiyon** | 3.32.0 |
| **Tip** | React SPA (PWA + Android APK) |
| **Domain** | Türk işletme yönetimi (Soba/Pelet ticareti) |
| **Durum** | Production — aktif olarak kullanılıyor |
| **Teknoloji** | React 19, TypeScript strict, Vite 6, TailwindCSS 4 |
| **Changelog** | v1.0.0 (Ekim 2025) → v3.32.0 (Haziran 2026) — ~8 aylık geliştirme |
| **Hedef** | Masaüstü web + Mobil Android + Offline-first PWA |

---

## 2. TEKNOLOJİ YIĞINI (Stack)

### Frontend
- **React 19.2.6** — en güncel sürüm, StrictMode aktif
- **TypeScript 5.8 strict** — `any` yasak, `noUnusedLocals` aktif
- **Vite 6.3** — build, HMR, manual chunks (7 chunk)
- **TailwindCSS 4.1** — utility-first CSS (PostCSS değil, native Vite plugin)
- **wouter 3.6** — hafif router (history API tabanlı)
- **zustand 5** — state management (agentStore)
- **mitt 3** — event bus (AgentBus + DomainEventBus)
- **recharts** — grafikler
- **framer-motion** — animasyonlar
- **lucide-react** — ikon seti
- **sonner** — toast bildirimleri

### UI Framework
- **shadcn/ui** (55+ Radix primitif) — kesinlikle değiştirilmez
- **class-variance-authority + clsx + tailwind-merge** — bileşen varyantları
- **CSS Modules** — sayfaya özel stiller (~16 .module.css)
- **design-tokens.css** — CSS variable token sistemi (OKLCH)

### Backend / Depolama
- **Offline-first**: localStorage → IndexedDB (Dexie) → Firebase
- **Firebase Firestore** — bulut senkronizasyonu (last-write-wins)
- **3-katmanlı save pipeline**: RuleEngine → AuditEngine → Storage

### Mobil
- **Capacitor 8** — Android APK (Web görünümü wrapper)
- PWA Service Worker (VitePWA, 72 asset precache)

### AI / Voice
- **DeepSeek API** (chat + reasoner) — ana AI
- **Claude API** — alternatif
- **Gemini API** — alternatif
- **Web Speech API** — sesli komut (Türkçe)
- **Offline AI modu** — LM Studio / local model

### Test
- **Vitest** — 555+ unit test
- **Playwright** — 6 E2E spec (30+ test)
- **Storybook** — komponent geliştirme
- **axe-core/playwright** — accessibility test
- **Lighthouse** — performans metrikleri
- **Fallow** — dead-code audit (tüm dead code temizlendi, health score 89.2)

### CI/CD
- **GitHub Actions** — quality-gate (lint → typecheck → test → build)
- **Otomatik Vercel deploy** (dev branch → production)
- **Android APK build** (manual trigger)
- **Simple-git-hooks** — pre-commit drift check (changelog/version/registry sync)
- **pnpm 9.15.4**, Node ≥22

---

## 3. KLASÖR YAPISI (src/)

```
src/                        394 TypeScript dosyası (426 toplam)
├── App.tsx                 600+ satır — ana uygulama iskeleti
├── main.tsx                Giriş noktası (StrictMode + ErrorBoundary + ThemeProvider)
│
├── agents/                 11 dosya — 7 agent + bus + tipler
│   ├── AgentBus.ts         mitt singleton event bus
│   ├── BaseAgent.ts        abstract class
│   ├── DomainAgent.ts      shared islemYap pipeline
│   ├── SatisAgent.ts       satış
│   ├── StokAgent.ts        stok
│   ├── KasaAgent.ts        kasa
│   ├── CariAgent.ts        cari
│   ├── FaturaAgent.ts      fatura
│   ├── RaporAgent.ts       rapor
│   ├── DeepSeekAgent.ts    AI analiz
│   └── types.ts            tipler
│
├── domain/                 12 dosya — domain-driven katman
│   ├── types.ts            Intent, IntentResult, DBUpdates
│   ├── intentEngine.ts     merkezi router (processIntent)
│   ├── eventBus.ts         typed pub/sub (DomainEventBus)
│   ├── services/           pure domain servisler
│   │   ├── saleCompletion.ts   4 işlem (complete/cancel/return/correctPrice)
│   │   ├── cashService.ts      kasa gelir/gider
│   │   ├── stockService.ts     stok güncelleme + ürün ekleme
│   │   ├── cariService.ts      cari tahsilat + ekleme
│   │   └── receivableService.ts alacak takip
│   └── listeners/          event dinleyiciler
│       ├── agentBridge.ts       DomainEvent → AgentBus köprüsü
│       ├── auditLogger.ts       activity log kaydı
│       └── notification.ts      toast bildirimleri
│
├── hooks/db/               11 dosya — veri katmanı
│   ├── index.ts            ana useDB() hook
│   ├── useDBQueries.ts     sorgular (getKasaBakiye, getTotalKasa)
│   ├── useDBActions.ts     save, saveGuarded, undo, logActivity
│   ├── useDBBackup.ts      export, import, backup, restore
│   ├── useDBSync.ts        Firebase sync başlatma
│   ├── dbHelpers.ts        applyIntentResult, validateAndClassify, scheduleFirebaseSave
│   ├── backup.ts           Firebase backup/restore + mergeRestoreDB
│   ├── sync.ts             saveToFirebase, loadFromFirebase
│   └── [core/test files]
│
├── lib/                    65+ dosya — yardımcı kütüphaneler
│   ├── logger.ts           yapılandırılmış log (5 seviye, 40+ kategori)
│   ├── ruleEngine.ts       5 kural (negatif stok/kasa, mükerrer, sıfır, min_stock)
│   ├── auditEngine.ts      finance audit trail (500 kayıt)
│   ├── anomalyEngine.ts    8 dedektör (fiyat, tutar, stok, kasa, cari, vb.)
│   ├── healthCheck.ts      6 metrik (Firebase, localStorage, memory, network, DB, sync)
│   ├── notificationEngine.ts proaktif uyarı motoru
│   ├── userManager.ts      kullanıcı yönetimi (PBKDF2, brute-force koruması)
│   ├── firebase.ts         Firestore CRUD helpers
│   ├── aiApi.ts            Claude + Gemini API
│   ├── deepseek.ts         DeepSeek API (chat + reasoner)
│   ├── voiceEngine.ts      Web Speech API wrapper
│   ├── crypto.ts           AES-256-GCM şifreleme
│   ├── format.ts           Türkçe tarih/para formatlayıcı
│   ├── changelog.ts        sürüm geçmişi (80+ entry, 2012 satır)
│   ├── version.ts          versiyon bilgisi
│   ├── appConfig.ts        uygulama konfigürasyonu
│   ├── dbDefaults.ts       varsayılan DB şablonu
│   ├── dbUtils.ts          12 hesaplama yardımcısı
│   ├── safeIO.ts           güvenli localStorage I/O
│   ├── safeClone.ts        structuredClone polyfill
│   ├── permissions.ts      Android/grant izinleri
│   ├── excelExport.ts      Excel çıktısı (xlsx)
│   ├── db/storage.ts       localStorage + IndexedDB storage
│   ├── db/indexeddb.ts     Dexie veritabanı
│   └── db/syncQueue.ts     Firebase sıralı yazma kuyruğu
│
├── pages/                  50+ dosya — sayfalar (28 lazy route)
│   ├── Dashboard.tsx       (398 satır) + 4 dashboard varyantı
│   ├── Products.tsx        ürün yönetimi
│   ├── Sales.tsx           satış yönetimi
│   ├── kasa.tsx            kasa hareketleri
│   ├── Cari.tsx            cari hesaplar
│   ├── Fatura.tsx          fatura yönetimi
│   ├── Stock.tsx           stok yönetimi (ABC + ölü stok)
│   ├── Suppliers.tsx       tedarikçi yönetimi (modüler, 5 alt modül)
│   ├── Bank.tsx            banka işlemleri (modüler, 8 alt modül)
│   ├── BugHunter.tsx       test aracı (modüler, 7 alt modül)
│   ├── Monitor.tsx         sistem izleme (modüler, 6 alt modül)
│   ├── Settings.tsx        ayarlar (modüler, 13 alt modül)
│   ├── Receivables.tsx     alacak takip (v3.29)
│   └── ...                 toplam 28 sayfa
│
├── components/             25+ dosya — UI bileşenleri
│   ├── layout/             Sidebar, Header, FAB, AIDrawer, GlobalSearch
│   ├── ui/                 55 shadcn primitif
│   ├── settings/           Settings alt bileşenleri
│   └── *.tsx               ConfirmDialog, ErrorBoundary, LoginScreen, vb.
│
├── theme/                  5 dosya — premium tema sistemi
│   ├── ThemeProvider.tsx   context + setTheme
│   ├── themes.ts           3 premium tema (corporate, modern-dark, elegant-light)
│   ├── themes.ts           8 builtin tema
│   └── types.ts            tema tipleri
│
├── config/                 4 dosya
│   ├── tabs.ts             28 tab tanımı + path + favorite sistemi
│   ├── brand.ts            marka adı/versiyon
│   └── widgets.ts          dashboard widget yapılandırması
│
├── types/                  5 dosya
│   ├── index.ts            tam DB tipi (30+ interface)
│   └── global.d.ts         window SpeechRecognition augment
│
└── stores/                 — (boş, agentStore lib/specs altında)
```

---

## 4. VERİ KATMANI — Offline-First Mimarisi

```
save(updater)
  → processSave(prev, updater)
    → validateAndClassify(prev, next)
      → RuleEngine.validateTransaction()  [5 kural, 50ms timeout]
        → negativeStock, negativeKasa, duplicate, zeroAmount, minStock
    → createAuditEntry() → AuditEntry
    → saveBlockedState()  [severity: block]
    → saveAppliedState()  [applied/warned]
      → saveToStorage()          [localStorage → IndexedDB snapshot]
      → scheduleFirebaseSave()   [debounced 1.2s → syncQueue → Firestore]
```

**DB Tipi (src/types/index.ts) — 30 koleksiyon:**
- `products[]`, `sales[]`, `kasa[]`, `cari[]`, `suppliers[]`, `orders[]`
- `invoices[]`, `stockMovements[]`, `bankTransactions[]`
- `notes[]`, `partners[]`, `budgets[]`, `installments[]`
- `monitorRules[]`, `activityLog[]`, `auditLog[]`
- Özel tedarik: `peletSuppliers[]`, `boruSuppliers[]`, `ortakEmanetler[]`

**Veri akışı:** `Page → agent.islemYap() → mapRequestToIntent() → processIntent() → domain service (pure) → { dbUpdates, events } → applyIntentResult() → save() → pipeline`

---

## 5. AGENT SİSTEMİ — 7 Agent Architecture

| Agent | ID | Sorumluluk | Önemli Metotlar |
|-------|----|-----------|-----------------|
| **SatisAgent** | `satis` | Satış yaşam döngüsü | `yeniSatis()`, `iptalEt()`, `iadeYap()`, `fiyatDuzelt()` |
| **StokAgent** | `stok` | Stok güncelleme | `stokGuncelle()`, `urunEkle()` |
| **KasaAgent** | `kasa` | Kasa hareketleri | `kasaGelirGider()`, `bakiyeSorgula()` |
| **CariAgent** | `cari` | Cari hesap yönetimi | `cariGuncelle()`, `cariEkle()` |
| **FaturaAgent** | `fatura` | Fatura oluşturma | `faturaOlustur()` |
| **RaporAgent** | `rapor` | Aktivite kaydı | `raporKaydet()` |
| **DeepSeekAgent** | `deep_seek` | AI analiz | `analizYap()`, `oneriGetir()` |

**İletişim modeli:** `Page → agent.islemYap() → DomainAgent.mapRequestToIntent() → processIntent() → domain service → applyIntentResult() → save()`

**Orkestrasyon:** Satış → stok → kasa (nakit) / cari (vadeli) → fatura (ops) → rapor

---

## 6. SİSTEM MİMARİSİ ÖZETİ

### Veri Katmanı (3 katmanlı depolama)
```
localStorage (sobaYonetim) → IndexedDB (Dexie snapshot, 5s) → Firebase (1.2s debounced)
```

### Save Pipeline (5 adım)
```
save(updater) → prevDB → updater → RuleEngine → AuditEngine → localStorage → IndexedDB → Firebase
```

### İşlem Pipeline'ı
```
Page → agent.islemYap() → mapRequestToIntent() → Intent → processIntent() → domain service → { dbUpdates, events } → applyIntentResult() → save()
```

### Event Sistemleri
- **AgentBus** (mitt singleton) — Agent arası iletişim
- **DomainEventBus** (mitt singleton) — Domain event pub/sub
- **Bridge** — DomainEventBus → AgentBus köprüsü
- **Listeners** — auditLogger (activity log), notification (toast)

### Güvenlik Katmanları
- **RuleEngine** — 5 kural, 50ms timeout (negatif stok/kasa, mükerrer işlem, sıfır tutar, min stock)
- **AuditEngine** — 500 kayıt, bakiye drift hesaplama, TRANSACTION_LIMIT kontrolü
- **AnomalyEngine** — 8 dedektör (fiyat, tutar, stok, kasa, cari, sipariş, veri, şüpheli)
- **Kullanıcı** — PBKDF2+600k iterasyon, brute-force koruması (5 deneme/1 dk), AES-GCM şifreleme
- **logger** — 5 seviye, 40+ kategori, hassas alan maskesi

### 8 Premium Tema (corporate, modern-dark, elegant-light + 5 builtin)
- CSS variable token sistemi (OKLCH, 40+ değişken)
- Glassmorphism efektleri
- Runtime switching + localStorage persistence

### Performans
- **7 manual chunk** (ana app 245KB, vendor 280KB, firebase 163KB, charts 420KB, exceljs 1.1MB)
- **28 sayfa React.lazy()** — sadece ihtiyaç anında yüklenir
- **useMemo + useCallback** tüm sayfalarda
- **200ms debounce** arama inputları

---

## 7. SAYFA HARİTASI (28 Ana Route)

| Group | Tab ID | Sayfa | Route |
|-------|--------|-------|-------|
| **Ana** | dashboard | Özet Dashboard | `/dashboard` |
| | products | Ürünler | `/products` + `/urunler/:id` |
| | sales | Satış | `/sales` + `/satis/:id` |
| | fatura | Fatura | `/fatura` |
| **Tedarik** | suppliers | Tedarikçi | `/suppliers` |
| | pelet | Pelet tedarik | `/pelet` |
| | boruTed | Boru tedarik | `/boruTed` |
| | ortakEmanet | Ortak Emanet | `/ortak-emanet` |
| **Finans** | cari | Cari Hesaplar | `/cari` + `/cari/:id` |
| | receivables | Alacak Takip | `/receivables` |
| | kasa | Kasa | `/kasa` |
| | butce | Bütçe | `/butce` |
| | bank | Banka | `/bank` |
| **Analiz** | reports | Raporlar | `/reports` |
| | cizelge | Çizelge | `/cizelge` |
| | stock | Stok (ABC/dead) | `/stock` |
| | monitor | İzleme | `/monitor` |
| | kontrol | Kontrol | `/kontrol` |
| | anomali | Anomali | `/anomali` |
| **Sistem** | entegrasyon | Entegrasyon | `/entegrasyon` |
| | excelmerge | Veri Birleştirme | `/excelmerge` |
| | notlar | Not Defteri | `/notlar` |
| | partners | Ortaklar | `/partners` |
| | settings | Ayarlar | `/settings` |
| | bughunter | Bug Hunter | `/bughunter` |
| | excelimport | Excel İçe Aktar | `/excelimport` |
| | aiEylemLog | AI Eylem Log | `/ai/eylem-log` |
| | specdashboard | Spec | `/spec` |

---

## 8. TEST YAPISI

| Katman | Araç | Dosya Sayısı | Yaklaşık Test |
|--------|------|-------------|---------------|
| **Unit Test** | Vitest | 46 test dosyası | 555+ test |
| **E2E** | Playwright | 6 spec | 30+ test |
| **Accessibility** | axe-core/playwright | 1 spec | ~10 test |
| **Storybook** | Storybook | ~5 story | — |
| **Lighthouse** | MCP | — | Perf/SEO/Accessibility |
| **Spec Compliance** | custom rules | 1 test | 13 kural |
| **Version Consistency** | custom | 1 test | 5 test |
| **Full Audit** | Playwright | comprehensive spec | 10 kategori |

**Test Dağılımı:**
- agents/: 7 test dosyası (~100 test)
- domain/services/: 2 test dosyası (~45 test)
- lib/: 15+ test dosyası (~150 test)
- hooks/db/: 3 test dosyası (~30 test)
- `__tests__/`: 7 test dosyası (~40 test)

---

## 9. PROJE METRİKLERİ

| Metrik | Değer |
|--------|-------|
| **Toplam satır (LOC)** | ~70.841 |
| **src/ TypeScript dosyası** | ~394 (187 .ts + 207 .tsx) |
| **Toplam dosya (css/diğer dahil)** | ~426 |
| **Sayfa sayısı** | 28 lazy route |
| **shadcn/ui bileşen** | 55 primitif |
| **Agent sayısı** | 7 |
| **Domain servis** | 5 |
| **Rule engine kuralı** | 5 |
| **Anomaly dedektörü** | 8 |
| **Fallow dead-code** | 0 (tam temiz) |
| **Fallow duplicate clones** | 126 |
| **Fallow health issues** | 440 |
| **Fallow maintainability** | 89.2/100 |
| **CI pipeline** | lint → typecheck → test → build ✅ |
| **Changelog entry** | 80+ sürüm (1.0.0 → 3.32.0) |

---

## 10. KRİTİK GÖZLEMLER

### Güçlü Yanlar
1. **Çok sağlam bir offline-first mimari** — localStorage → IndexedDB → Firebase, save pipeline ile
2. **Domain-driven tasarım** — pure domain servisler, event-driven iletişim
3. **Çok katmanlı güvenlik** — RuleEngine, AuditEngine, AnomalyEngine, şifreleme, brute-force koruması
4. **Mükemmel test altyapısı** — 555+ test, E2E, Lighthouse, Storybook, spec compliance
5. **3 yedekleme sistemi** — Firebase backup, JSON export, IndexedDB snapshot
6. **Premium tema sistemi** — 3 premium + 8 builtin tema, CSS variable token sistemi
7. **Performans odaklı** — lazy loading, manual chunks, useMemo/useCallback, debounce
8. **Modüler sayfalar** — Suppliers, Monitor, BugHunter, Bank, Settings tamamen modüllere bölündü, en büyük alt modül 379 satır

### Potansiyel Riskler
1. **localStorage 5MB limiti** — büyük veri setlerinde dolma riski (dataIntegrityChecker ile izleniyor)
2. **Firebase last-write-wins** — çakışma çözümü yok (küçük ekip için kabul edilebilir)
3. **`any` tip kalıntıları** — hâlâ 2 dosyada 8 noktada `any` kullanımı var:
   - `pageHelpers.ts` (7 yer: `addOrder`, `removeById`, `updateStatusInDB` vb.)
   - `voiceEngine.ts` (1 yer: `private recognition: any`)
4. **Senkron RuleEngine** — 50ms timeout, ama save pipeline'ı bloklayabilir
5. **46 test dosyası** — iyi seviyede ama kapsama %100 değil, özellikle SatisAgent discount/banka/pos testleri eksik

### Yapılan Son Büyük Değişiklikler (v3.31.0 → v3.32.0)
- DomainEventBus + 3 listener (agentBridge, auditLogger, notification)
- 5 sayfada inline style → Tailwind dönüşümü (−970 satır)
- AGENTS.md 810→111 satır, docs/agents/ altında modular (12 dosya)
- Pre-commit drift check (changelog + version + registry sync)
- Symlink/shim stratejisi (CLAUDE.md, .cursor/rules)
- MASTER_PLAN kalan ~45 madde tarandı, 30'unun zaten çözüldüğü tespit edildi, 6'sı fix'lendi
- WEEKLY_PLAN 5.12 coverage exclude temizliği (57/57 task tamam 🏁)
- Aşama 3: State Registry otomasyonu + pre-commit drift tespiti
- J2: dangerouslySetInnerHTML → React-based rendering
- H1: P1 tautoloji test → real property-based test
- E8: 'utf8' as never → Encoding.UTF8 (Capacitor enum)
- Receivables (Alacak Takip) sayfası
- 4 sayfa modularizasyon (Suppliers, Monitor, BugHunter, Bank) −3421 satır monolit
- Unicode encoding düzeltmeleri (105 escape sequence)

### Geliştirme Hızı (Haziran 2026 — 3 hafta)

| Fallow Metriği | Başlangıç | Bitiş | Değişim |
|----------------|-----------|-------|---------|
| Dead-code | 249 | 0 | ▼ 249 |
| Duplicate clones | 140 | 126 | ▼ 14 |
| Health issues | 474 | 440 | ▼ 34 |
| Maintainability | 83.3 | 89.2 | ▲ 5.9 |

---

## 11. SONUÇ

PARSPEL, **production-ready, offline-first bir işletme yönetim uygulamasıdır.** 8 aylık aktif geliştirme sonucu:

- **Mimari olgunluk:** Domain-driven, event-driven, çok katmanlı güvenlik
- **Test güvencesi:** 555+ test, E2E, a11y, spec compliance
- **Geliştirme hızı:** 3 haftada maintainability 83.3 → 89.2
- **Bakım durumu:** Dead-code sıfır, modüler sayfalar, güçlü CI/CD

**Öncelikli yapılacaklar:**
1. `any` tip kalıntılarını temizleme (pageHelpers.ts + voiceEngine.ts)
2. localStorage limit izleme ve olası IndexedDB geçiş planı
3. SatisAgent eksik testlerinin tamamlanması

---

*Rapor, state-registry.json ve AGENTS.md proven facts kullanılarak güncellenmiştir.*
*Son güncelleme: 18 Haziran 2026 · v3.32.0*
