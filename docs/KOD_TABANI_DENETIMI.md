# 🔍 PARSPEL Kod Tabanı Denetim Raporu

**Tarih:** 2026-06-20
**Proje:** `repo_2` — PARSPEL PWA (React/TS/Vite)
**Kapsam:** `src/` dizini (test dosyaları dahil)

---

## 📊 Genel İstatistikler

| Metrik | Değer |
|--------|-------|
| **Toplam TS/TSX dosyası** | 366 (test hariç) |
| **Test dosyası** | 50 |
| **CSS dosyası** | 31 |
| **Toplam kod satırı** | ~61.000+ |
| **Export sayısı** | 619+ |

---

## 🗺 Dizin Yapısı (src/)

```
src/
├── __tests__/           (9 dosya) — CI, spec, version testleri
├── agents/              (14 dosya) — 7 iş uzmanı agent
│   ├── BaseAgent.ts, DomainAgent.ts
│   ├── KasaAgent, CariAgent, SatisAgent, StokAgent, FaturaAgent, RaporAgent, DeepSeekAgent
│   ├── AgentBus.ts, satisHelpers.ts, types.ts
│   └── index.ts
├── components/
│   ├── layout/          (7 dosya) — AIDrawer, FAB, Header, Sidebar, vb.
│   ├── settings/        (7 dosya) — Theme, Animation, Dashboard, FloatingButtons
│   ├── ui/              (56 dosya) — shadcn/ui bileşenleri
│   ├── ai/              (1 dosya) — VoiceAgentUI
│   ├── nexus/           (2 dosya) — NexusBubble, NexusSpark
│   └── ...              (18 tek dosya) — QuantumLink, Modal, Toast, vb.
├── config/              (4 dosya) — tabs, widgets, brand, agentConfig
├── domain/              (12 dosya) — eventBus, intentEngine, services
├── features/
│   └── voice-sales/     (12 dosya) — sesli satış feature'ı
├── hooks/
│   ├── db/              (10 dosya) — DB hooks, backup, sync
│   └── ...              (8 dosya) — useDB, useSpeech, useVoiceAgent, vb.
├── lib/
│   ├── db/              (3 dosya) — indexeddb, storage, syncQueue
│   ├── nexus/           (2 dosya) — NexusRouter, VoiceNexusCore
│   ├── specs/           (10 dosya) — spec engine, rules, runner
│   └── ...              (50+ dosya) — ai, audio, crypto, excel, firebase, logger, vb.
├── pages/
│   ├── ai/              (3 dosya) — AIASettings, AIAHelpers
│   ├── Bank/            (7 dosya) — Bank CRUD
│   ├── BugHunter/       (8 dosya) — test aracı
│   ├── Cari/            (7 dosya) — Cari CRUD
│   ├── Dashboard/       (12 dosya) — widget'lar
│   ├── Fatura/          (10 dosya) — Fatura CRUD
│   ├── Monitor/         (6 dosya) — izleme paneli
│   ├── Reports/         (12 dosya) — raporlar
│   ├── Settings/        (6 dosya) — ayarlar alt sayfaları
│   ├── Suppliers/       (8 dosya) — tedarikçi CRUD
│   ├── excelmerge/      (7 dosya) — excel birleştirme
│   └── ...              (30+ tek dosya) — Dashboard, Stock, Sales, vb.
├── theme/               (5 dosya) — tema sistemi
├── types/               (5 dosya) — global tipler
├── App.tsx              (547 satır)
├── main.tsx
├── index.css
└── design-tokens.css
```

---

## 🚨 KRİTİK BULGULAR

### 🥇 Kullanılmayan shadcn/ui Bileşenleri (35 adet)

Bu bileşenler `src/components/ui/` altında duruyor ama **hiçbir yerde import edilmiyorlar**:

| Kategori | Bileşenler |
|----------|------------|
| **Hiç kullanılmayan** | `accordion`, `alert-dialog`, `aspect-ratio`, `breadcrumb`, `button-group`, `calendar`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `drawer`, `field`, `form`, `hover-card`, `input-group`, `input-otp`, `item`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `sidebar`, `slider`, `sonner`, `spinner`, `toggle-group` |
| **Sadece diğer UI'lar tarafından kullanılan** | `dialog` (sadece command.tsx içinde), `sheet` (sadece sidebar.tsx içinde) |
| **Toplam şişme** | ~35 dosya, tahmini ~5.000-7.000 satır gereksiz kod |

**Etki:** `pnpm run build` çıktısına dahil oluyorlarsa bundle boyutunu şişiriyorlar. Tree-shaking ile çoğu kesilse de import zinciri olanlar (dialog→command vb.) gelebilir.

### 🥈 Ölü/Kullanılmayış Dizinler ve Dosyalar

| Dizin | Boyut | Durum |
|-------|-------|-------|
| **`PAKET/`** | **1.2 MB** | Eski tasarım paketi, projeyle alakasız. İçinde `new-design-package/` (Next.js projesi), `files/` (icon pack). Muhtemelen test/deneysel. |
| **`docs/archive/`** | 97 KB | 13 adet eski doküman (AUDIT_PROMPT, CODER_TASK, PLAN_2_SESSION, vb.). Changelog'da referansları var mı bilinmez. |
| **`e2e-report/`** | 25 KB | Statik test raporları (HTML/JSON). Build çıktısı. |
| **`android/build/`** | **1.2 MB** | Android build artifacts, commit'te olmamalı. |
| **`docs/plans/v3.32.2-parallel-plan.md`** | Eski plan dokümanı |

### 🥉 Kullanılmayan package.json Dependency'leri

| Paket | Tür | Durum |
|-------|-----|-------|
| **`@hookform/resolvers`** | dependency | Hiç import edilmemiş |
| **`vite-plugin-inspect`** | devDependency | Hiç import edilmemiş |
| **`lightningcss`** | dependency | Sadece vite config'de referans, src/ içinde yok |
| **`autoprefixer`** | devDependency | PostCSS config için, src/ içinde kullanımı yok |
| **`postcss`** | devDependency | PostCSS config için |

---

## 💀 KARANLIK ODALAR (En Riskli Dosyalar)

### 1. `src/lib/changelog.ts` — 2.068 satır ⚠️

| Risk | Detay |
|------|-------|
| **Boyut** | Projenin en büyük dosyası (2.068 satır) |
| **İçerik** | Tüm proje değişiklik geçmişi, elle yazılmış devasa bir CHANGELOG |
| **5 adet `: any`** | Projedeki `: any` kullanımlarının tamamı bu dosyada |
| **Sorun** | Changelog'lar ayrı bir `.md` dosyasında olmalı, TS dosyasında 2K satır linter/derleyici yükü |

### 2. `src/pages/Cizelge.tsx` — 795 satır

- Büyük monolitik sayfa, muhtemelen alt bileşenlere ayrılabilir
- CSS module'leri var mı kontrol edilmeli (`Cizelge.module.css` mevcut değil)

### 3. `src/components/ui/sidebar.tsx` — 727 satır

- shadcn/ui sidebar bileşeni ama hiçbir yerde import edilmemiş!
- 727 satır saf ölü kod

### 4. `src/lib/anomalyEngine.ts` — 711 satır

- Büyük engine dosyası, muhtemelen domain logic ağırlıklı
- Test coverage kontrol edilmeli

### 5. `src/pages/BugHunter/TestRunner.ts` — 652 satır

- TestRunner — production dışı bir araç ama büyük
- `@ts-expect-error` içeriyor (bilinçli hatalı test)

---

## 🧪 TEKNİK BORÇ GÖSTERGELERİ

### eslint-disable / @ts-* Suppressions (14 adet)

| Dosya | Satır | Tür |
|-------|-------|-----|
| `src/App.tsx:275` | `eslint-disable react-hooks/exhaustive-deps` | useEffect dependency |
| `src/components/ui/calendar.tsx:1-2` | `@ts-nocheck` | **Tüm dosya tip kontrolü devre dışı!** |
| `src/components/ui/input-otp.tsx:1-2` | `@ts-nocheck` | **Tüm dosya tip kontrolü devre dışı!** |
| `src/lib/crypto.ts:85,117` | `@ts-expect-error` | TS 5.8 uyumsuzluğu |
| `src/pages/BugHunter/TestRunner.ts:73` | `@ts-expect-error` | Bilinçli hata testi |
| `src/pages/Entegrasyonlar.tsx:17` | `eslint-disable @typescript-eslint/no-unused-vars` | Kullanılmayan değişken |
| `src/pages/Butce.tsx:40` | `eslint-disable react-hooks/exhaustive-deps` | useEffect dependency |
| `src/pages/KontrolHalkasi.tsx:107` | `eslint-disable react-hooks/exhaustive-deps` | useEffect dependency |
| `src/hooks/db/useDBSync.ts:43` | `eslint-disable react-hooks/exhaustive-deps` | useEffect dependency |
| `src/pages/excelmerge/temizle.tsx:30` | `eslint-disable react-hooks/exhaustive-deps` | useEffect dependency |
| `src/types/vaul.d.ts:11,16,18` | `eslint-disable @typescript-eslint/no-empty-object-type` | Tip tanımı |

**Öne Çıkan:** `calendar.tsx` ve `input-otp.tsx` **tamamen `@ts-nocheck`** ile tip güvenliği dışına alınmış. Bu dosyalardaki hatalar hiçbir zaman yakalanmaz.

### `: any` Tip Kullanımı

Sadece **2 dosyada** 6 adet `: any`:
- `src/lib/changelog.ts` — 5 adet (changelog veri yapısında)
- `src/lib/nexus/NexusRouter.ts` — 1 adet

Bu **çok iyi** bir oran — proje genel olarak tip güvenli.

### TODO/FIXME/HACK Etiketi

**Hiç bulunamadı.** Proje temizliği açısından olumlu, ancak geliştiricilerin backlog'larını başka yerde (GitHub Issues, .opencode/ memory) tuttuklarını gösteriyor.

---

## 🧊 DERİN DALIŞ: EN BÜYÜK 10 DOSYA

| # | Dosya | Satır | Risk | Yorum |
|---|-------|-------|------|-------|
| 1 | `src/lib/changelog.ts` | 2.068 | 🔴 | 5x `any`, gereksiz TS yükü |
| 2 | `src/pages/Cizelge.tsx` | 795 | 🟡 | Monolitik sayfa |
| 3 | `src/pages/DashboardStrateji.tsx` | 784 | 🟡 | Büyük dashboard |
| 4 | `src/components/ui/sidebar.tsx` | 727 | 🔴 | **Ölü kod**, hiç import edilmemiş |
| 5 | `src/lib/anomalyEngine.ts` | 711 | 🟡 | Büyük engine |
| 6 | `src/pages/Partners.tsx` | 709 | 🟡 | Büyük sayfa |
| 7 | `src/pages/excelmerge/ai-asistan.tsx` | 696 | 🟡 | Büyük sayfa |
| 8 | `src/pages/DashboardFinans.tsx` | 677 | 🟡 | Büyük dashboard |
| 9 | `src/pages/DashboardOperasyon.tsx` | 676 | 🟡 | Büyük dashboard |
| 10 | `src/pages/BugHunter/TestRunner.ts` | 652 | 🟡 | Production dışı araç |

---

## 🔗 KIRIK BAĞLANTILAR / NEREYE ÇIKTIĞI BELLİ OLMAYAN YOLLAR

### Şüpheli Import'lar

- `src/types/vaul.d.ts` — vaul kütüphanesi için tip tanımı, vaul sadece bir dosyada referans ediliyor (shadcn-declarations.d.ts dışında)
- `src/types/shadcn-declarations.d.ts` — birçok kütüphane için tip deklarasyonu, gerçek kullanım kontrolü yapılmamış
- `src/stories/Button.stories.tsx` — Storybook dosyası, projede başka story var mı? (görünen o ki hayır, tek başına)

### Şişme Riski

- `src/components/ui/` altında 56 dosya var, sadece ~21'i aktif kullanımda
- Kalan **35 dosya (~60%)** potansiyel ölü kod

---

## 📋 ÖZET: TEMİZLİK ÖNCELİKLERİ

| Öncelik | Konu | Tasarruf |
|---------|------|----------|
| 🔴 **P1** | `PAKET/` dizinini sil | **1.2 MB** disk |
| 🔴 **P1** | `android/build/`'i `.gitignore'a ekle | **1.2 MB** commit şişmesi |
| 🔴 **P1** | Kullanılmayan 35 shadcn/ui bileşenini temizle | ~5.000-7.000 satır, bundle küçülmesi |
| 🟡 **P2** | `src/lib/changelog.ts`'i `.md` dosyasına taşı, TS'den kaldır | **2.068 satır** azalma |
| 🟡 **P2** | `@ts-nocheck`'li calendar.tsx ve input-otp.tsx'i düzelt veya kaldır | Tip güvenliği |
| 🟡 **P2** | `docs/archive/` temizliği | 13 eski dosya |
| 🟢 **P3** | `sidebar.tsx`'i kaldır (hiç kullanılmıyor) | **727 satır** |
| 🟢 **P3** | `@hookform/resolvers`, `vite-plugin-inspect` paketlerini kaldır | package.json temizliği |
| 🟢 **P3** | `e2e-report/` ve `playwright-report/` dizinlerini .gitignore'a ekle | |
| 🟢 **P3** | `eslint-disable react-hooks/exhaustive-deps`'leri düzelt | 4 useEffect sakatı |
| 🟢 **P3** | `lightningcss`'in gerçekten runtime gerekli mi kontrol et | |

### Tahmini Toplam Kazanç

| Kaynak | Miktar |
|--------|--------|
| **Disk** | ~2.5-3 MB (PAKET + android/build + e2e-report + archive) |
| **Kod satırı** | ~7.000-9.000 satır (ölü bileşenler + sidebar + changelog) |
| **Bundle** | Tree-shaking'e bağlı, teorik %5-15 küçülme |
| **Tip güvenliği** | 2 dosyada bird recovery |

---

## ✅ Olumlu Gözlemler

- `: any` kullanımı neredeyse yok (sadece 2 dosyada 6 adet) — **çok iyi tip güvenliği**
- TODO/FIXME/HACK etiketi **hiç yok** — temiz kod kültürü
- 50 adet test dosyası — iyi test coverage
- Agent sistemi temiz ayrıştırılmış (7 agent → ayrı dosyalar)
- `eslint-disable`'ların çoğu gerekçeli (useEffect dependency, TS 5.8 compat)
- `docs/` dizini iyi organize edilmiş (agents/, logs/, management/, plans/, technical/)

---

_Rapor oluşturma: 2026-06-20 — Hermes Agent (codebase-radar + manual audit)_
