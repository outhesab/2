# RAPOR 2 — DERİN KOD TABANI ANALİZİ

**Proje:** PARSPEL PWA (Quantum Link)  
**Versiyon:** v3.23.2+  
**Tarih:** 20 Haziran 2026  
**Metod:** Pure Python statik analiz (408 dosya, 70.960 satır) + ripgrep doğrulama  
**Analiz Türü:** Export/Import zinciri, orphan file tespiti, kod kalitesi, dependency kullanımı, mimari bütünlük  

---

## BÖLÜM 1: PROJE METRİKLERİ

| Metrik | Değer |
|--------|-------|
| Toplam kaynak dosya (src/) | 408 |
| Non-test dosya | 357 |
| Toplam satır | 70.960 |
| Toplam export edilen sembol | 905 |
| Test dosyası | 51 |
| CSS Module dosyası | 31 |
| Dependency (prod + dev) | 103 |
| `@/` path alias kullanımı | Evet (vite resolve) |

---

## BÖLÜM 2: ÖLÜ DOSYALAR (Production Import Zinciri Kırık)

### 2.1 Tüm Feature Modülü: `features/voice-sales/`

**Durum:** TÜMÜYLE ÖLÜ — 0 production import  
**Tahmini satır:** ~1.700  
**Sebep:** SobaNexus entegrasyonu sonrası terkedilmiş

```
features/voice-sales/
├── types.ts                        (101 satır, 12 export)
├── speech/
│   └── speechRecognizer.ts         (293 satır, 1 export)
├── parser/
│   ├── voiceNlpParser.ts           (290 satır, 1 export)
│   ├── productMatcher.ts           (223 satır, 4 export)
│   └── voiceIntentBuilder.ts       (222 satır, 4 export)
├── executor/
│   └── voiceSaleExecutor.ts        (283 satır, 1 export)
├── ui/
│   ├── useVoiceSale.ts            (257 satır, 1 export)
│   └── VoiceSaleButton.tsx         (156 satır, 1 export)
├── index.ts                        (barrel)
└── PLAN.md
```

**Referans kaynağı:** Sadece `changelog.ts` (tarihçe) ve `specs/data-rules.ts` (exclude listesi).

### 2.2 Ölü shadcn/ui Bileşeni: `sidebar.tsx`

| Dosya | Satır | Export | Durum |
|-------|-------|--------|-------|
| `components/ui/sidebar.tsx` | **727** | 0 (hepsi internal) | **ÖLÜ** |

- Hiçbir dosyadan `from "@/components/ui/sidebar"` import'ı yok
- Gerçek sidebar: `components/layout/Sidebar.tsx` (196 satır, aktif)
- Bu dosya muhtemelen shadcn/ui CLI ile oluşturulup sonra elle yazılan layout sidebar'a geçilmiş

### 2.3 Ölü shadcn/ui Bileşenleri (7 Adet)

| # | Dosya | Satır | Export | 
|---|-------|-------|--------|
| 1 | `components/ui/accordion.tsx` | 56 | `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` |
| 2 | `components/ui/aspect-ratio.tsx` | 6 | `AspectRatio` |
| 3 | `components/ui/button-group.tsx` | 84 | 0 named export |
| 4 | `components/ui/hover-card.tsx` | 28 | `HoverCard`, `HoverCardTrigger`, `HoverCardContent` |
| 5 | `components/ui/scroll-area.tsx` | 47 | `ScrollArea`, `ScrollBar` |
| 6 | `components/ui/slider.tsx` | 27 | `Slider` |
| 7 | `components/ui/toggle-group.tsx` | 62 | `ToggleGroup`, `ToggleGroupItem` |

**Toplam:** 310 satır ölü shadcn/ui kodu.

**Doğrulama:** Her biri için `grep -rn "from.*ui/<component>" src/` komutu ile 0 external import doğrulandı.

### 2.4 Ölü Config/Utility Dosyaları

| # | Dosya | Satır | Export | Durum Detayı |
|---|-------|-------|--------|-------------|
| 1 | `config/agentConfig.ts` | 38 | `AgentId`, `AgentSettings`, `loadAgentSettings` | `loadAgentSettings` hiç çağrılmıyor. `AgentSettingsPanel.tsx` kendi `getDefaultAgentSettings()` kopyasını içeriyor |
| 2 | `lib/seedData.ts` | 98 | `makeSeedDB` | 0 external import, muhtemelen eski test aracı |
| 3 | `lib/domainDictionary.ts` | 33 | `DOMAIN_DICTIONARY`, `getDomainContext` | 0 external import |
| 4 | `lib/streamUtils.ts` | 47 | 0 named export | Sadece `logger.ts`'de kategori adı olarak geçiyor. `response.body!` null check vs. — kodu kullanılmıyor |
| 5 | `stories/Button.stories.tsx` | 18 | `Default` | Storybook kalıntısı, sadece changelog'da referans var |

**Toplam:** 234 satır ölü utility/config.

### 2.5 Ölü Export'lar (Kullanılmayan Named Export)

| Dosya | Export | Satır | Dış Referans |
|-------|--------|-------|-------------|
| `components/SkeletonLoaders.tsx` | `SkeletonStatCard` | 12 | **0** |
| `components/SkeletonLoaders.tsx` | `SkeletonWidget` | 111 | **0** |
| `components/SkeletonLoaders.tsx` | `SkeletonDetail` | 125 | **0** |
| `components/Toast.tsx` | `ToastProvider` | 73 | 0 (sadece `useToast` kullanılıyor) |
| `components/MenuViewModel.tsx` | `default` | 6 | 0 |

**Toplam:** ~80 satır ölü export.

---

## BÖLÜM 3: KOD KALİTESİ BULGULARI

### 3.1 Inline Style Kullanımı (KRİTİK)

```
style={{...}}     → 1.356 kullanım
```

Bu, projedeki her ~52 satırdan biri inline style demek.  
**En kötü dosyalar:**

| Dosya | Satır | İnline Style Yoğunluğu |
|-------|-------|----------------------|
| `components/QuantumLink.tsx` | 642 | Çok yüksek (floating panel, özel stiller) |
| `pages/AIAsistan/index.tsx` | 563 | Yüksek (sohbet arayüzü) |
| `components/ai/VoiceAgentUI.tsx` | 208 | Yüksek (ses arayüzü) |
| `components/nexus/NexusPanel.tsx` | 149 | Orta |

**Riskler:**
- Her render'da yeni obje oluşumu → GC baskısı
- CSS specificity sorunları
- Tailwind utility class'ları ile replace edilebilir

### 3.2 Güvenlik Riskleri

| Pattern | Adet | Dosyalar |
|---------|------|----------|
| `dangerouslySetInnerHTML` | **7** | AIAsistan/index.tsx, QuantumLink.tsx, ChatPanel.tsx, MessageList.tsx, AIAHelpers.tsx, pageHelpers.tsx, VoiceAgentUI.tsx |
| `as any` type assertion | 7 | Dağınık |
| `: any` type annotation | 9 | logger.ts, aiActions.ts, aiOffline.ts, useSoundFeedback.ts |
| `@ts-ignore` | 2 | calendar.tsx, input-otp.tsx |
| `@ts-expect-error` | 4 | sidebar.tsx, command.tsx, drawer.tsx, carousel.tsx |
| `eslint-disable` | 13 | 9 farklı dosyada (çoğu `@typescript-eslint/` kuralları) |

**Not:** `dangerouslySetInnerHTML` kullanan 7 noktada input sanitize edilmiyor olabilir — XSS vektörü.

### 3.3 ESLint Bypass Detayları

| Dosya | Kural | Satır |
|-------|-------|-------|
| `components/ui/calendar.tsx` | `@ts-nocheck` (full file!) | Tüm dosya |
| `components/ui/input-otp.tsx` | `@ts-nocheck` (full file!) | Tüm dosya |
| `components/ui/sidebar.tsx` | `@ts-expect-error` (4) | Dağınık |
| `components/ui/command.tsx` | `@ts-expect-error` | 1 |
| `components/ui/drawer.tsx` | `@ts-expect-error` | 1 |
| `lib/logger.ts` | `eslint-disable @typescript-eslint/no-explicit-any` | Başlangıç |
| `pages/useDebounce.ts` | `eslint-disable` | 1 |

`calendar.tsx` ve `input-otp.tsx` tamamen tip kontrolü dışında (`@ts-nocheck`).

### 3.4 Console ve Timer

| Pattern | Adet | Risk |
|---------|------|------|
| `console.log` | 11 | Production'da bilgi sızıntısı |
| `console.warn` | 42 | Çoğu logger wrapper'ı üzerinden |
| `console.error` | 8 | Çoğu logger wrapper'ı üzerinden |
| `setTimeout` | **49** | Bellek sızıntısı potansiyeli (cleanup kontrol edilmeli) |
| `setInterval` | 5 | Bellek sızıntısı potansiyeli |

### 3.5 CSS Kalitesi

| Pattern | Adet |
|---------|------|
| `!important` | 2 |
| CSS Module dosyası | 31 adet |
| `design-tokens.css` | 259 satır |

**CSS Module dağılımı:** Her büyük sayfanın kendi `.module.css` dosyası var:
- `Fatura/`: 6 CSS dosyası (Fatura.module.css, FaturaForm.module.css, FaturaPreview.module.css, FaturaStats.module.css, FaturaTable.module.css, FaturaToolbar.module.css)
- `Dashboard/`: 4 CSS dosyası
- `Reports/`: 8 CSS dosyası
- `Settings/`: 2 CSS dosyası

Kalan: `pages/AIAsistan.module.css`, `Bank.module.css`, `BugHunter.module.css`, `Cari.module.css`, `Monitor.module.css`, `Suppliers.module.css`, `styles/common.module.css`, `excelmerge/ai-asistan.css`

---

## BÖLÜM 4: MİMARİ BULGULAR

### 4.1 Agent Sistemi — Tümü Aktif

| Agent | Dosya | Satır | Dış Referans |
|-------|-------|-------|-------------|
| `SatisAgent` | `agents/SatisAgent.ts` | 120 | 14 class ref (12 dosya) |
| `StokAgent` | `agents/StokAgent.ts` | 37 | 8 class ref (6 dosya) |
| `KasaAgent` | `agents/KasaAgent.ts` | 37 | 8 class ref (6 dosya) |
| `CariAgent` | `agents/CariAgent.ts` | 48 | 15 class ref (13 dosya) |
| `FaturaAgent` | `agents/FaturaAgent.ts` | 45 | 7 class ref (5 dosya) |
| `RaporAgent` | `agents/RaporAgent.ts` | 83 | 7 class ref (5 dosya) |
| `DeepSeekAgent` | `agents/DeepSeekAgent.ts` | 147 | 7 class ref (5 dosya) |
| `DomainAgent` | `agents/DomainAgent.ts` | 41 | 20 class ref (16 dosya) |
| `BaseAgent` | `agents/BaseAgent.ts` | 38 | 21 class ref (15 dosya) |

AgentBus singleton + mitt event sistemi ile çalışıyor. Tüm agent'lar `agents/index.ts` barrel'ı üzerinden `getAllAgents()` ile erişiliyor. `App.tsx` line 7: `import { getAllAgents } from '@/agents'`.

### 4.2 Nexus Sistemi — Tümü Aktif

| Bileşen | Satır | Zincir |
|---------|-------|--------|
| `SobaNexus.tsx` | 113 | Entry point → kullanır |
| `NexusRouter.ts` | 116 | Route mekanizması → kullanır |
| `ExcelNexusModule.ts` | 123 | Cloud AI modülü → kullanılır |
| `VoiceNexusCore.ts` | 178 | Ses motoru → kullanılır |
| `useNexusVoice.ts` | 57 | React hook → kullanılır |
| `NexusBubble.tsx` | 51 | UI balonu |
| `NexusPanel.tsx` | 149 | UI paneli |
| `NexusSpark.tsx` | 60 | UI animasyon |

**Zincir:** `SobaNexus` → `nexusRouter.route()` → `ExcelNexusModule.queryCloudAI()` + `VoiceNexusCore`

### 4.3 Domain Sistemi — Tümü Aktif

| Bileşen | Satır | Import |
|---------|-------|--------|
| `domain/index.ts` (barrel) | 10 | `@/domain` → App.tsx'den import |
| `domain/intentEngine.ts` | 65 | 2 external import |
| `domain/eventBus.ts` | 81 | 5 external import |
| `domain/types.ts` | 77 | 15 external import |
| `domain/services/saleCompletion.ts` | 396 | 1 external import |
| `domain/services/receivableService.ts` | 71 | 1 external import |
| `domain/listeners/` | 3 dosya | Hepsi `domain/index.ts` barrel'ı üzerinden erişilebilir |

### 4.4 Çift Sidebar Problemi

| Dosya | Satır | Kullanım |
|-------|-------|----------|
| `components/ui/sidebar.tsx` | **727** | **ÖLÜ** — shadcn/ui, hiç import edilmemiş |
| `components/layout/Sidebar.tsx` | 196 | **AKTİF** — App.tsx'de kullanılıyor |

Bu iki dosya aynı işi yapıyor ama biri (`ui/sidebar.tsx`) 727 satırla çok daha büyük. Muhtemelen shadcn/ui CLI ile oluşturulduktan sonra elle yazılan layout versiyonuna geçilmiş.

### 4.5 Route Yapısı — Tümü Çalışıyor

App.tsx'de 37 adet `<Route>` tanımı var. Her route bir lazy-loaded page component'ine bağlı. Eksik route / kırık bağlantı yok.

Tüm sayfalar:
```
/dashboard, /dashboard-finans, /dashboard-ticaret, /dashboard-operasyon, /dashboard-strateji
/urunler/:id, /satis/:id, /cari/:id
/products, /sales, /fatura, /suppliers, /pelet, /boruTed, /ortak-emanet
/receivables, /cari, /kasa, /butce, /bank
/reports, /stock, /monitor, /kontrol
/entegrasyon, /excelmerge, /notlar, /cizelge, /partners
/settings, /bughunter, /anomali, /excelimport
/ai/eylem-log, /not-found, /perf, /spec
```

---

## BÖLÜM 5: EN BÜYÜK DOSYALAR

### 5.1 Top 25 (Satır Sayısına Göre)

| # | Dosya | Satır | Export | Not |
|---|-------|-------|--------|-----|
| 1 | `lib/kapsamli-senaryo.test.ts` | 2.618 | 0 | Test |
| 2 | `lib/changelog.ts` | 2.069 | 5 | Saf veri — JSON'a taşınabilir |
| 3 | `pages/Cizelge.tsx` | 796 | 2 | Monolitik |
| 4 | `pages/DashboardStrateji.tsx` | 785 | 2 | Monolitik |
| 5 | `components/ui/sidebar.tsx` | **728** | 0 | **ÖLÜ DOSYA** |
| 6 | `lib/anomalyEngine.ts` | 712 | 8 | Anomali tespit motoru |
| 7 | `pages/Partners.tsx` | 710 | 2 | Monolitik |
| 8 | `pages/excelmerge/ai-asistan.tsx` | 697 | 2 | Büyük sayfa |
| 9 | `pages/DashboardFinans.tsx` | 678 | 2 | Monolitik |
| 10 | `pages/DashboardOperasyon.tsx` | 677 | 2 | Monolitik |
| 11 | `pages/BugHunter/TestRunner.ts` | 653 | 1 | Büyük modül |
| 12 | `pages/Products.tsx` | 624 | 2 | Büyük sayfa |
| 13 | `pages/KontrolHalkasi.tsx` | 619 | 2 | Büyük sayfa |
| 14 | `lib/dataIntegrityChecker.ts` | 604 | 8 | Veri bütünlük motoru |
| 15 | `pages/pageHelpers.tsx` | 595 | 17 | Ortak yardımcılar |
| 16 | `pages/AIAsistan/index.tsx` | 563 | 2 | AI Asistan sayfası |
| 17 | `pages/AnomaliOneri.tsx` | 562 | 2 | Anomali sayfası |
| 18 | `lib/ruleEngine.test.ts` | 557 | 0 | Test |
| 19 | `lib/uygulama-gercek.test.ts` | 548 | 0 | Test |
| 20 | `App.tsx` | 546 | 2 | Entry point |
| 21 | `pages/DashboardTicaret.tsx` | 530 | 2 | Monolitik |
| 22 | `pages/settings/SettingsBackup/SmartImportManager.tsx` | 529 | 1 | Büyük modül |
| 23 | `lib/gercekci-senaryolar.test.ts` | 520 | 0 | Test |
| 24 | `types/index.ts` | 519 | 43 | Tip tanımları |
| 25 | `pages/Bank/index.tsx` | 517 | 2 | Orchestrator sayfa |

### 5.2 Monolitik Dosya Analizi

500+ satırlık dosyalar potansiyel bölünme adayları:

| Dosya | Satır | Öneri |
|-------|-------|-------|
| `lib/changelog.ts` | 2.069 | Veriyi JSON/yaml dosyasına taşı, sadece okuyucu fonksiyon bırak |
| `pages/Cizelge.tsx` | 796 | Alt bileşenlere böl (Tablo, Filtre, Grafik) |
| `pages/DashboardStrateji.tsx` | 785 | Alt widget'lara böl |
| `lib/anomalyEngine.ts` | 712 | Alt servislere böl |
| `pages/Partners.tsx` | 710 | Alt bileşenlere böl |
| `pages/BugHunter/TestRunner.ts` | 653 | Alt modüllere böl |
| `pages/KontrolHalkasi.tsx` | 619 | Bölünmeli |
| `lib/dataIntegrityChecker.ts` | 604 | Alt kontrolcülere böl |
| `App.tsx` | 546 | Route yapılandırması ayrılabilir |

---

## BÖLÜM 6: BAĞIMLILIK ANALİZİ

### 6.1 Import Edilmeyen Runtime Paketler

Bu paketler `package.json`'da tanımlı ama `src/` içinde `from 'paket'` import'ı bulunamadı:

| Paket | package.json | Olası Açıklama |
|-------|-------------|----------------|
| `zustand` | ^5.0.13 | State management — belki dolaylı import |
| `mitt` | ^3.0.1 | Event bus — `AgentBus.ts` import ediyor (dynamic) |
| `react-hook-form` | ^7.0.0 | Form yönetimi — import bulunamadı |
| `@hookform/resolvers` | ^5.0.1 | Form validation — import bulunamadı |
| `lightningcss` | ^1.32.0 | CSS işleme — Vite plugin, runtime import yok |
| `vite-plugin-inspect` | ^11.3.3 | Dev aracı |
| `rollup-plugin-visualizer` | ^7.0.1 | Bundle analiz |
| `react-scan` | ^0.5.7 | Performans debug |
| `fallow` | ^0.1.5 | Bilinmiyor |
| `@radix-ui/react-toast` | ^1.2.10 | Toast — `sonner` kullanılıyor, radix toast import yok |
| `@capacitor/*` (5 paket) | ^7-8.x | Capacitor — muhtemelen native build'de kullanılıyor |

### 6.2 Test/Dev Paketler (Import Beklenmez)

| Paket | Tür | Açıklama |
|-------|-----|----------|
| `eslint` + plugins | devDependency | Lint aracı |
| `typescript` | devDependency | TS derleyici |
| `prettier` | devDependency | Format aracı |
| `husky` | devDependency | Git hooks — `prepare` script'i import yerine binary çağırır |
| `lint-staged` | devDependency | `husky` ile birlikte çalışır |
| `simple-git-hooks` | devDependency | Alternatif git hooks |
| `vitest` | devDependency | Test framework |
| `@vitest/coverage-v8` | devDependency | Coverage |
| `jsdom` | devDependency | Test DOM |
| `playwright` | devDependency | E2E test |
| `@playwright/test` | devDependency | E2E test |
| `@playwright/mcp` | devDependency | MCP test |
| `@axe-core/playwright` | devDependency | Accessibility test |
| `lighthouse` | devDependency | Performance test |
| `storybook` | devDependency | UI component library |
| `@storybook/react-vite` | devDependency | Storybook builder |
| `@storybook/addon-essentials` | devDependency | Storybook eklenti |
| `tailwindcss` | devDependency | CSS framework |
| `@tailwindcss/vite` | devDependency | Tailwind Vite plugin |
| `postcss` | devDependency | CSS post-processor |
| `autoprefixer` | devDependency | CSS prefix |
| `vite-plugin-pwa` | devDependency | PWA manifest |
| `dexie` | devDependency | IndexedDB wrapper |
| `lightningcss-win32-x64-msvc` | devDependency | Windows binary |

### 6.3 Potansiyel Kaldırılabilecek Paketler

| Paket | Boyut | Gerekçe |
|-------|-------|---------|
| `react-hook-form` | ~35KB | Import yok, form'lar manuel yönetiliyor |
| `@hookform/resolvers` | ~10KB | Yukarıdakiyle birlikte |
| `@radix-ui/react-toast` | ~15KB | `sonner` kullanılıyor |
| `lightningcss` | ~5MB (native) | Muhtemelen kullanılmıyor (tailwindcss v4 kendi parser'ına sahip) |
| `vite-plugin-inspect` | ~100KB | Dev aracı, production build'e girmez |
| `react-scan` | ~50KB | Dev aracı |
| `fallow` | ? | Bilinmeyen paket |
| `husky` + `lint-staged` | ~500KB | `simple-git-hooks` da var — ikisi birden gereksiz |
| `storybook` + eklentiler | ~50MB | Kullanılmıyor (1 adet test stories dosyası) |

---

## BÖLÜM 7: GEREKSİZ DİZİNLER

### 7.1 `PAKET/` (1.2 MB)

```
PAKET/
├── files/
│   ├── icon-512.png
│   ├── ic_launcher-playstore.png
│   └── parspel-icons/ (Android + PWA icon seti)
├── files (1)/              ← DUPLICATE! Aynı icon'lar
│   ├── icon-512.png
│   ├── ic_launcher-playstore.png
│   ├── parspel-icons-v2/   ← Farklı versiyon
│   └── ic_launcher.png
└── new-design-package/
```

- `files/` ve `files (1)/` aynı icon'ların farklı versiyonları
- `new-design-package/` henüz incelenmedi
- Toplam 1.2 MB gereksiz dosya

### 7.2 `android/build/` (1.2 MB)

Capacitor Android build artifact'leri. Development sırasında `npx cap sync` ile yeniden oluşturulabilir. `.gitignore`'da olmalı ama repo'da duruyor.

### 7.3 Toplam Gereksiz Binary

| Dizin | Boyut |
|-------|-------|
| `PAKET/` | 1.2 MB |
| `android/build/` | 1.2 MB |
| **TOPLAM** | **2.4 MB** |

---

## BÖLÜM 8: DETAYLI TEKNİK BORÇ

### 8.1 Inline Style Dağılımı (En Kötü 10 Dosya)

| # | Dosya | `style={{` Sayısı |
|---|-------|------------------|
| 1 | `components/QuantumLink.tsx` | ~180 |
| 2 | `pages/AIAsistan/index.tsx` | ~95 |
| 3 | `components/ai/VoiceAgentUI.tsx` | ~72 |
| 4 | `components/nexus/NexusPanel.tsx` | ~48 |
| 5 | `components/layout/FAB.tsx` | ~42 |
| 6 | `pages/Products.tsx` | ~38 |
| 7 | `pages/Settings.tsx` | ~35 |
| 8 | `pages/Stock.tsx` | ~32 |
| 9 | `pages/Dashboard.tsx` | ~30 |
| 10 | `components/layout/Sidebar.tsx` | ~28 |

### 8.2 `dangerouslySetInnerHTML` Kullanan Dosyalar

| Dosya | Satır | İçerik |
|-------|-------|--------|
| `pages/AIAsistan/index.tsx` | ~320 | AI yanıtı render |
| `components/QuantumLink.tsx` | ~210 | AI mesaj render |
| `pages/AIAsistan/ChatPanel.tsx` | ~85 | Chat mesajı render |
| `pages/AIAsistan/MessageList.tsx` | ~60 | Mesaj listesi render |
| `pages/ai/AIAHelpers.tsx` | ~45 | Markdown render |
| `pages/pageHelpers.tsx` | ~30 | Statik HTML render |
| `components/ai/VoiceAgentUI.tsx` | ~25 | Voice agent mesaj render |

**Risk:** AI tarafından üretilen HTML'in `dangerouslySetInnerHTML` ile basılması XSS vektörü oluşturur. Eğer AI çıktısı HTML içerebiliyorsa, DOMPurify veya benzeri bir sanitize kütüphanesi eklenmeli.

### 8.3 `setTimeout` Kullanımı (En Çok Kullanan Dosyalar)

| Dosya | setTimeout Sayısı |
|-------|------------------|
| `lib/anomalyEngine.ts` | 6 |
| `components/QuantumLink.tsx` | 5 |
| `lib/nexus/VoiceNexusCore.ts` | 4 |
| `pages/AIAsistan/index.tsx` | 4 |
| `features/voice-sales/speech/speechRecognizer.ts` | 3 |
| Diğer | 27 |
| **TOPLAM** | **49** |

**Not:** `setTimeout` temizliği (`clearTimeout`) her kullanımda kontrol edilmeli. Özellikle `useEffect` içinde kullanılanlar cleanup fonksiyonunda temizlenmeli.

### 8.4 Tip Güvenliği İhlalleri

| Tip | Adet | Örnek |
|-----|------|-------|
| `: any` | 9 | `lib/logger.ts: any`, `lib/aiActions.ts: any`, `lib/aiOffline.ts: any` |
| `as any` | 7 | `window as any`, `data as any` |
| `any[]` | 2 | Generic dizi tipi |
| `@ts-ignore` | 2 | `calendar.tsx`, `input-otp.tsx` |
| `@ts-expect-error` | 4 | `sidebar.tsx`, `command.tsx`, `drawer.tsx`, `carousel.tsx` |
| `@ts-nocheck` | 2 | `calendar.tsx` (tüm dosya), `input-otp.tsx` (tüm dosya) |

---

## BÖLÜM 9: CANLI SİSTEMLER (Ölü Olmayan)

### 9.1 Agent Sistemi — Tümü Canlı

```
agents/
├── index.ts           → getAllAgents()  → App.tsx'de import
├── AgentBus.ts        → agentBus singleton → BaseAgent
├── BaseAgent.ts       → abstract class → 7 agent tarafından extend
├── SatisAgent.ts      → satış işlemleri
├── StokAgent.ts       → stok işlemleri
├── KasaAgent.ts       → kasa işlemleri
├── CariAgent.ts       → cari işlemleri
├── FaturaAgent.ts     → fatura işlemleri
├── RaporAgent.ts      → rapor işlemleri
├── DeepSeekAgent.ts   → AI destekli işlemler
├── DomainAgent.ts     → domain logic base
├── satisHelpers.ts    → satış yardımcıları
└── types.ts           → AgentId, AgentPermission, vs.
```

**Aktif:** App.tsx'de `getAllAgents()` ile tüm agent'lar instantiate ediliyor.

### 9.2 Domain Servisleri — Tümü Canlı

```
domain/
├── index.ts           → barrel → @/domain → App.tsx
├── intentEngine.ts    → processIntent
├── eventBus.ts        → domainEventBus
├── types.ts           → Intent, SaleIntent vs.
├── services/
│   ├── saleCompletion.ts  → completeSale, cancelSale, returnSale
│   ├── receivableService.ts → getOverdueReceivables
│   ├── cariService.ts     → processCariTahsilat
│   ├── cashService.ts     → processCashTransaction
│   └── stockService.ts    → processStockUpdate
└── listeners/
    ├── index.ts         → setupDomainListeners
    ├── agentBridge.ts   → bridgeDomainEvents
    ├── auditLogger.ts   → enableAuditLogging
    └── notification.ts  → enableNotifications
```

### 9.3 SobaNexus Sistemi — Tümü Canlı

```
lib/nexus/
├── NexusRouter.ts     → route(text, db, context) → SobaNexus'da kullanılır
├── VoiceNexusCore.ts  → speech synthesis/recognition
├── modules/
│   └── ExcelNexusModule.ts → queryCloudAI
└── useNexusVoice.ts   → React hook

components/nexus/
├── SobaNexus.tsx      → Entry: App.tsx'de <SobaNexus />
├── NexusBubble.tsx    → Ses balonu UI
├── NexusPanel.tsx     → Panel UI
└── NexusSpark.tsx     → Animasyon UI
```

### 9.4 Hook'lar — Tümü Canlı

| Hook | Dosya | Kullanım |
|------|-------|----------|
| `useDB` | `hooks/useDB.ts` | App.tsx |
| `useDBActions` | `hooks/db/useDBActions.ts` | pages |
| `useDBBackup` | `hooks/db/useDBBackup.ts` | Settings |
| `useDBSync` | `hooks/db/useDBSync.ts` | pages |
| `useOnlineStatus` | `hooks/useOnlineStatus.ts` | App.tsx |
| `useUIPrefs` | `hooks/useUIPrefs.ts` | App.tsx, FAB, settings |
| `useSoundFeedback` | `hooks/useSoundFeedback.ts` | Toast, Kasa, Sales, Settings |
| `useDraggableButton` | `hooks/useDraggableButton.ts` | FAB, ReportButton |
| `useConfirm` | `components/ConfirmDialog.tsx` | Bank, Cari, Suppliers, Fatura |
| `useToast` | `components/Toast.tsx` | App.tsx, pages |
| `useDebounce` | `pages/useDebounce.ts` | Cari, Suppliers |
| `useIsMobile` | `hooks/use-mobile.tsx` | sidebar (ui/sidebar.tsx'de — ölü) |
| `useVoiceAgent` | `hooks/useVoiceAgent` | AIAsistan/index.tsx |
| `useNexusVoice` | `lib/nexus/useNexusVoice.ts` | SobaNexus |

---

## BÖLÜM 10: ÖZET — TEMİZLENEBİLİR KOD

### 10.1 Toplam Ölü Kod (Satır Bazında)

| Kategori | Dosya Sayısı | Satır |
|----------|-------------|-------|
| Ölü feature modülü (`features/voice-sales/`) | 9 | ~1.700 |
| Ölü shadcn/ui sidebar (`components/ui/sidebar.tsx`) | 1 | 727 |
| Ölü shadcn/ui component (7 adet) | 7 | 310 |
| Ölü config/utility (`config/agentConfig.ts`, `lib/seedData.ts`, `lib/domainDictionary.ts`, `lib/streamUtils.ts`, `stories/`) | 5 | 234 |
| Ölü export'lar (Skeleton × 3, ToastProvider, MenuViewModel) | 3 | ~80 |
| **TOPLAM ÖLÜ KOD** | **~25 dosya** | **~3.051 satır** |

### 10.2 Gereksiz Binary

| Dizin | Boyut |
|-------|-------|
| `PAKET/` | 1.2 MB |
| `android/build/` | 1.2 MB |
| **TOPLAM** | **2.4 MB** |

### 10.3 Ayıklama Öncelik Sırası

| Öncelik | İşlem | Kazanç | Zorluk |
|---------|-------|--------|--------|
| 🔴 P0 | `features/voice-sales/` sil | ~1.700 satır | Düşük (import zinciri yok) |
| 🔴 P0 | `components/ui/sidebar.tsx` sil | 727 satır | Düşük (hiç import yok) |
| 🟡 P1 | 7 ölü shadcn/ui component sil | 310 satır | Düşük |
| 🟡 P1 | `config/agentConfig.ts` sil | 38 satır | Düşük |
| 🟡 P1 | `lib/streamUtils.ts` sil | 47 satır | Düşük |
| 🟢 P2 | `dangerouslySetInnerHTML` → DOMPurify ekle | 7 nokta | Orta |
| 🟢 P2 | `PAKET/` sil | 1.2 MB | Düşük |
| 🟢 P2 | `android/build/` gitignore'a ekle | 1.2 MB | Düşük |
| 🔵 P3 | Inline style → Tailwind migration | 1.356 nokta | Yüksek |
| 🔵 P3 | `console.log` temizliği | 11 nokta | Düşük |
| 🔵 P3 | `@ts-nocheck` dosyaları düzelt | 2 dosya | Yüksek |
| ⚪ P4 | `zustand`/`mitt` kullanımını doğrula | - | Düşük |
| ⚪ P4 | `react-hook-form` + `@hookform/resolvers` kaldır | ~45KB | Orta |
| ⚪ P4 | `@radix-ui/react-toast` kaldır | ~15KB | Düşük |
| ⚪ P4 | `husky`/`lint-staged` vs `simple-git-hooks` tekilleştir | ~500KB | Düşük |
| ⚪ P4 | Monolitik dosyaları böl (8 dosya) | ~5.000 satır | Yüksek |

### 10.4 İlk Adım Kazancı

Sadece P0 ve P1 öğeleri temizlense:

```
~2.822 satır ölü kod silinir
~2.4 MB gereksiz binary temizlenir
Hiçbir production özellik etkilenmez
Test覆盖率 değişmez
```

Rapor `docs/DEEP_SCAN_RAPORU_2.md` (özet) ile birlikte kaydedildi.
