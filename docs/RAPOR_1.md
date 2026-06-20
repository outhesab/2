# RAPOR 1 — PARSPEL Kod Tabanı Kapsamlı Denetim

**Tarih:** 2026-06-20
**Proje:** PARSPEL PWA (React 19 / TypeScript 5.8 / Vite 6)
**Dizin:** `C:\Users\PARS PELET\Desktop\2\repo_2`
**Kapsam:** Tüm `src/` dizini + proje kökü + konfigürasyon dosyaları
**Denetim Türü:** Statik kod analizi (ripgrep + manuel inceleme)

---

## BÖLÜM 1 — PROJE KİMLİK KARTI

### 1.1 Genel İstatistikler

| Metrik | Değer |
|--------|-------|
| **Toplam TS/TSX dosyası (src/)** | 366 adet (test dosyaları hariç) |
| **Test dosyası (src/)** | 50 adet |
| **CSS dosyası (src/)** | 31 adet |
| **Toplam kod satırı** | ~61.164 satır |
| **Export sayısı** | 619+ adet |
| **Ana framework** | React 19.2.6 |
| **State management** | Zustand 5 + Dexie (IndexedDB) |
| **Routing** | Wouter 3 |
| **Styling** | Tailwind CSS 4 + CSS Modules + shadcn/ui |
| **Animation** | Framer Motion 12 |
| **Backend** | Firebase 12 |
| **Test** | Vitest 3 + Playwright 1.60 |
| **Build** | Vite 6 + PWA plugin |
| **Mobil** | Capacitor 8 (Android) |

### 1.2 Dizin Yapısı (src/)

```
src/
├── __tests__/              (9 dosya)
│   ├── ci-config.test.ts
│   ├── github-workflow-cleanup.test.ts
│   ├── security-config.test.ts
│   ├── setup.ts
│   ├── spec-compliance.test.ts
│   ├── testUtils.ts
│   ├── version-consistency.test.ts
│   ├── version-utils.test.ts
│   └── vite-chunks.test.ts
│
├── agents/                 (14 dosya) — İş uzmanı agent sistemi
│   ├── AgentBus.test.ts
│   ├── AgentBus.ts
│   ├── BaseAgent.ts + test
│   ├── CariAgent.ts + test
│   ├── DeepSeekAgent.ts + test
│   ├── DomainAgent.ts
│   ├── FaturaAgent.ts + test
│   ├── KasaAgent.ts + test
│   ├── RaporAgent.ts + test
│   ├── SatisAgent.ts + test
│   ├── StokAgent.ts + test
│   ├── index.ts
│   ├── satisHelpers.ts
│   └── types.ts
│
├── components/
│   ├── ai/
│   │   └── VoiceAgentUI.tsx
│   ├── layout/             (7 dosya)
│   │   ├── AIDrawer.tsx
│   │   ├── FAB.tsx
│   │   ├── GlobalSearch.tsx
│   │   ├── Header.tsx
│   │   ├── PageFallback.tsx
│   │   ├── ReportButton.tsx
│   │   ├── Sidebar.tsx
│   │   └── UserMenu.tsx
│   ├── logo/
│   │   └── ParspelLogo.tsx
│   ├── nexus/
│   │   ├── NexusBubble.tsx
│   │   └── NexusSpark.tsx
│   ├── settings/           (7 dosya)
│   │   ├── AnimationSection.tsx
│   │   ├── DashboardSection.tsx
│   │   ├── FloatingButtonsSection.tsx
│   │   ├── index.ts
│   │   ├── SettingsActionButtons.tsx
│   │   ├── ThemeSection.tsx
│   │   └── TypographySection.tsx
│   ├── ui/                 (56 dosya) — shadcn/ui bileşen kataloğu
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── button-group.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── chart.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── empty.tsx
│   │   ├── field.tsx
│   │   ├── form.tsx
│   │   ├── hover-card.tsx
│   │   ├── input.tsx
│   │   ├── input-group.tsx
│   │   ├── input-otp.tsx
│   │   ├── item.tsx
│   │   ├── kbd.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── resizable.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── spinner.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toggle.tsx
│   │   ├── toggle-group.tsx
│   │   └── tooltip.tsx
│   ├── ConfirmDialog.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   ├── IconPicker.tsx
│   ├── InfoRow.tsx
│   ├── LoginScreen.tsx
│   ├── MenuViewModel.tsx
│   ├── MobileSelect.tsx
│   ├── Modal.tsx
│   ├── NotificationCenter.tsx
│   ├── QuantumLink.tsx         ← 642 satır (AI sesli asistan)
│   ├── QuickIncomeModal.tsx
│   ├── QuickProductModal.tsx
│   ├── SkeletonLoaders.tsx
│   ├── SystemMap.tsx
│   ├── ThemeButton.tsx
│   ├── Toast.tsx
│   └── VoiceAssistantButton.tsx
│
├── config/                 (4 dosya)
│   ├── agentConfig.ts
│   ├── brand.ts
│   ├── tabs.ts
│   └── widgets.ts
│
├── domain/                 (12 dosya) — Domain katmanı
│   ├── eventBus.ts
│   ├── index.ts
│   ├── intentEngine.ts
│   ├── types.ts
│   ├── listeners/
│   │   ├── agentBridge.ts
│   │   ├── auditLogger.ts
│   │   ├── index.ts
│   │   └── notification.ts
│   └── services/
│       ├── cariService.ts
│       ├── cashService.ts
│       ├── receivableService.ts
│       ├── saleCompletion.ts + test
│       └── stockService.ts
│
├── features/
│   └── voice-sales/        (12 dosya) — Sesli satış feature modülü
│       ├── index.ts
│       ├── types.ts
│       ├── PLAN.md
│       ├── executor/
│       │   ├── voiceSaleExecutor.ts + test
│       ├── parser/
│       │   ├── productMatcher.ts + test
│       │   ├── voiceIntentBuilder.ts + test
│       │   └── voiceNlpParser.ts + test
│       ├── speech/
│       │   └── speechRecognizer.ts + test
│       └── ui/
│           ├── useVoiceSale.ts
│           └── VoiceSaleButton.tsx
│
├── hooks/                  (18 dosya)
│   ├── db/
│   │   ├── backup.ts + test
│   │   ├── core.test.ts
│   │   ├── dbHelpers.ts
│   │   ├── index.ts
│   │   ├── sync.ts + test
│   │   ├── useDBActions.ts
│   │   ├── useDBBackup.ts
│   │   ├── useDBQueries.ts
│   │   └── useDBSync.ts
│   ├── useDB.ts
│   ├── useDraggableButton.ts
│   ├── use-mobile.tsx
│   ├── useOnlineStatus.ts
│   ├── useSoundFeedback.ts
│   ├── useSpeech.ts
│   ├── useStorageMonitor.ts
│   ├── useUIPrefs.ts
│   ├── useVoiceAgent.ts
│   └── useVoiceAssistant.ts
│
├── lib/                    (50+ dosya) — Utility kütüphanesi
│   ├── db/
│   │   ├── indexeddb.ts
│   │   ├── storage.ts
│   │   └── syncQueue.ts
│   ├── nexus/
│   │   ├── NexusRouter.ts
│   │   └── VoiceNexusCore.ts
│   ├── specs/
│   │   ├── accessibility-rules.ts
│   │   ├── component-coverage-rules.ts
│   │   ├── component-rules.ts
│   │   ├── data-rules.ts
│   │   ├── error-rules.ts
│   │   ├── index.ts
│   │   ├── navigation-rules.ts
│   │   ├── performance-budget-rules.ts
│   │   ├── runner.ts
│   │   ├── test-rules.ts
│   │   └── types.ts
│   ├── aiActions.ts + test
│   ├── aiApi.ts
│   ├── aiKeys.ts
│   ├── aiOffline.ts
│   ├── anomalyEngine.ts + test
│   ├── appConfig.ts
│   ├── audio.ts
│   ├── auditEngine.ts + test
│   ├── batchQueue.ts + test
│   ├── changelog.ts           ← 2.068 satır
│   ├── connConfig.ts + test
│   ├── consoleRecorder.ts
│   ├── crypto.ts
│   ├── dataIntegrityChecker.ts + test
│   ├── dbDefaults.ts + test
│   ├── dbUtils.ts
│   ├── deepseek.ts + test
│   ├── domainDictionary.ts
│   ├── excelExport.ts + test
│   ├── excel-merge/
│   │   ├── index.ts
│   │   ├── mergeEngine.ts
│   │   └── parser.ts
│   ├── excel-merge-types.ts
│   ├── excel-merge-utils.ts
│   ├── firebase.ts + test
│   ├── format.ts
│   ├── formStyles.ts
│   ├── healthCheck.ts + test
│   ├── logger.ts + test
│   ├── notificationEngine.ts + test
│   ├── offline-ai.ts
│   ├── pageHelpers.ts
│   ├── permissions.ts + test
│   ├── ruleEngine.ts + test
│   ├── safeClone.ts
│   ├── safeIO.ts
│   ├── safeXlsx.ts + test
│   ├── seedData.ts
│   ├── similarity.ts + test
│   ├── streamUtils.ts
│   ├── userManager.ts
│   ├── utils.ts
│   ├── utils-tr.ts + test
│   ├── version.ts
│   ├── vite-manual-chunks.ts
│   ├── voiceEngine.ts
│   ├── voiceIntent.ts
│   └── (test dosyaları)
│
├── pages/                  (80+ dosya) — Sayfalar
│   ├── ai/
│   │   ├── AIAHelpers.tsx
│   │   ├── AIAHelpers.utils.ts
│   │   └── AIASettings.tsx
│   ├── AIAsistan/
│   │   ├── ActionHistory.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── index.tsx
│   │   └── MessageList.tsx
│   ├── Bank/
│   │   ├── BankActions.tsx
│   │   ├── BankFilters.tsx
│   │   ├── BankForm.tsx
│   │   ├── BankStats.tsx
│   │   ├── BankTable.tsx
│   │   ├── index.tsx
│   │   ├── StatCard.tsx
│   │   └── types.ts
│   ├── BugHunter/
│   │   ├── BugEmptyResult.tsx
│   │   ├── BugEmptyState.tsx
│   │   ├── BugResults.tsx
│   │   ├── BugStats.tsx
│   │   ├── BugToolbar.tsx
│   │   ├── index.tsx
│   │   ├── TestRunner.ts
│   │   └── types.ts
│   ├── Cari/
│   │   ├── CariDetail.tsx
│   │   ├── CariForm.tsx
│   │   ├── CariHelpers.ts
│   │   ├── CariIslemModal.tsx
│   │   ├── CariList.tsx
│   │   └── index.tsx
│   ├── Dashboard/
│   │   ├── DashboardCommon.tsx
│   │   ├── DashboardUtils.ts
│   │   ├── KasaSayimWidget.tsx
│   │   ├── Oneriler.tsx
│   │   ├── ScrollableCards.tsx
│   │   ├── StatCard.tsx
│   │   ├── types.ts
│   │   ├── useStatCards.tsx
│   │   ├── WidgetCard.tsx
│   │   ├── WidgetRenderer.tsx
│   │   └── YedekHatirlatmaWidget.tsx
│   ├── Fatura/
│   │   ├── FaturaForm.tsx
│   │   ├── FaturaPreview.tsx
│   │   ├── FaturaStats.tsx
│   │   ├── FaturaTable.tsx
│   │   ├── FaturaToolbar.tsx
│   │   ├── FaturaUtils.ts
│   │   └── types.ts
│   ├── Monitor/
│   │   ├── index.tsx
│   │   ├── MonitorAuditLog.tsx
│   │   ├── MonitorIssues.tsx
│   │   ├── MonitorOverview.tsx
│   │   ├── MonitorRules.tsx
│   │   └── types.ts
│   ├── Reports/
│   │   ├── ReportsCari.tsx
│   │   ├── ReportsCommon.tsx
│   │   ├── ReportsGenerator.tsx
│   │   ├── ReportsKasa.tsx
│   │   ├── ReportsOzet.tsx
│   │   ├── ReportsSatis.tsx
│   │   ├── ReportsUrun.tsx
│   │   ├── ReportsUtils.ts
│   │   └── types.ts
│   ├── settings/
│   │   ├── content/
│   │   │   ├── About.tsx
│   │   │   ├── Changelog.tsx
│   │   │   ├── Roadmap.tsx
│   │   │   └── Support.tsx
│   │   ├── SettingsAboutPanel.tsx
│   │   ├── SettingsActivity.tsx
│   │   ├── SettingsAgentPanel.tsx
│   │   ├── SettingsBackup/
│   │   │   ├── FullRestorePanel.tsx
│   │   │   ├── index.tsx
│   │   │   ├── parseCsv.ts
│   │   │   ├── SelectiveRestore.tsx
│   │   │   ├── SmartImportManager.tsx
│   │   │   └── types.ts
│   │   ├── SettingsCompany.tsx
│   │   ├── SettingsData.tsx
│   │   ├── SettingsExcel.tsx
│   │   ├── SettingsKategoriYonetim.tsx
│   │   ├── SettingsPelet.tsx
│   │   ├── SettingsRepair.tsx
│   │   ├── SettingsSecurity.tsx
│   │   ├── SettingsShortcuts.tsx
│   │   └── SettingsSound.tsx
│   ├── Suppliers/
│   │   ├── index.tsx
│   │   ├── SupplierDetail.tsx
│   │   ├── SupplierForm.tsx
│   │   ├── SupplierHelpers.ts
│   │   ├── SupplierList.tsx
│   │   ├── SupplierOrder.tsx
│   │   ├── Suppliers.test.tsx
│   │   └── types.ts
│   ├── excelmerge/
│   │   ├── ai-asistan.tsx
│   │   ├── diff.tsx
│   │   ├── merge.tsx
│   │   ├── preview.tsx
│   │   ├── search.tsx
│   │   ├── temizle.tsx
│   │   └── upload.tsx
│   ├── AIEylemLog.tsx
│   ├── AIAsistan.module.css
│   ├── AnomaliOneri.tsx
│   ├── Bank.module.css
│   ├── BoruTed.tsx
│   ├── BugHunter.module.css
│   ├── Butce.tsx
│   ├── Cari.module.css
│   ├── Cizelge.tsx
│   ├── ConsoleKayit.tsx
│   ├── Dashboard.module.css (2x)
│   ├── Dashboard.tsx
│   ├── DashboardFinans.tsx
│   ├── DashboardOperasyon.tsx
│   ├── DashboardStrateji.tsx
│   ├── DashboardTicaret.tsx
│   ├── Entegrasyonlar.tsx
│   ├── ExcelImport.tsx
│   ├── ExcelMerge.tsx
│   ├── Fatura.tsx
│   ├── FaturaHelpers.tsx
│   ├── FaturaHelpers.utils.ts
│   ├── Kasa.tsx
│   ├── KontrolHalkasi.tsx
│   ├── Monitor.module.css
│   ├── not-found.tsx
│   ├── Notlar.tsx
│   ├── Oneriler.module.css
│   ├── OrtakEmanet.tsx
│   ├── pageHelpers.tsx
│   ├── pageStyles.ts
│   ├── Partners.tsx
│   ├── Pelet.tsx
│   ├── Perf.tsx
│   ├── ProductDetail.tsx
│   ├── Products.tsx
│   ├── Receivables.tsx
│   ├── Reports.tsx
│   ├── SaleDetail.tsx
│   ├── SaleFormModal.tsx
│   ├── Sales.tsx
│   ├── SalesHelpers.tsx
│   ├── salesStyles.ts
│   ├── Settings.module.css
│   ├── Settings.tsx
│   ├── SettingsArayuz.tsx
│   ├── SettingsBaglanti.tsx
│   ├── SettingsCard.tsx
│   ├── SpecDashboard.tsx
│   ├── StatCard.module.css (2x)
│   ├── Stock.tsx
│   ├── Suppliers.module.css
│   └── useDebounce.ts
│
├── styles/
│   └── common.module.css
│
├── theme/                  (5 dosya)
│   ├── index.ts
│   ├── ThemeProvider.tsx
│   ├── themes.ts
│   ├── types.ts
│   └── useTheme.ts
│
├── types/                  (5 dosya)
│   ├── global.d.ts
│   ├── index.ts
│   ├── shadcn-declarations.d.ts
│   ├── vaul.d.ts
│   └── vite-env.d.ts
│
├── App.tsx
├── design-tokens.css
├── index.css
├── main.tsx
└── vite-env.d.ts
```

---

## BÖLÜM 2 — ÖLÜ KOD / KULLANILMAYAN BİLEŞENLER

### 2.1 Kullanılmayan shadcn/ui Bileşenleri (35 adet)

Aşağıdaki bileşenler `src/components/ui/` altında fiziksel olarak duruyor ancak projede **hiçbir yerden import edilmiyorlar**. Kod tabanında var olmalarının tek sebebi shadcn/ui CLI'nin katalog olarak eklemiş olması.

#### Grup A: Hiçbir Dosyada Import Edilmeyenler (33 adet)

| # | Bileşen | Dosya | Tahmini Satır |
|---|---------|-------|--------------|
| 1 | `accordion.tsx` | `src/components/ui/accordion.tsx` | ~80 |
| 2 | `alert-dialog.tsx` | `src/components/ui/alert-dialog.tsx` | ~200 |
| 3 | `aspect-ratio.tsx` | `src/components/ui/aspect-ratio.tsx` | ~30 |
| 4 | `breadcrumb.tsx` | `src/components/ui/breadcrumb.tsx` | ~150 |
| 5 | `button-group.tsx` | `src/components/ui/button-group.tsx` | ~80 |
| 6 | `calendar.tsx` | `src/components/ui/calendar.tsx` | ~250 |
| 7 | `carousel.tsx` | `src/components/ui/carousel.tsx` | ~200 |
| 8 | `chart.tsx` | `src/components/ui/chart.tsx` | ~300 |
| 9 | `checkbox.tsx` | `src/components/ui/checkbox.tsx` | ~50 |
| 10 | `collapsible.tsx` | `src/components/ui/collapsible.tsx` | ~50 |
| 11 | `command.tsx` | `src/components/ui/command.tsx` | ~200 |
| 12 | `context-menu.tsx` | `src/components/ui/context-menu.tsx` | ~250 |
| 13 | `drawer.tsx` | `src/components/ui/drawer.tsx` | ~100 |
| 14 | `field.tsx` | `src/components/ui/field.tsx` | ~80 |
| 15 | `form.tsx` | `src/components/ui/form.tsx` | ~150 |
| 16 | `hover-card.tsx` | `src/components/ui/hover-card.tsx` | ~60 |
| 17 | `input-group.tsx` | `src/components/ui/input-group.tsx` | ~80 |
| 18 | `input-otp.tsx` | `src/components/ui/input-otp.tsx` | ~150 |
| 19 | `item.tsx` | `src/components/ui/item.tsx` | ~40 |
| 20 | `menubar.tsx` | `src/components/ui/menubar.tsx` | ~250 |
| 21 | `navigation-menu.tsx` | `src/components/ui/navigation-menu.tsx` | ~200 |
| 22 | `pagination.tsx` | `src/components/ui/pagination.tsx` | ~120 |
| 23 | `popover.tsx` | `src/components/ui/popover.tsx` | ~80 |
| 24 | `progress.tsx` | `src/components/ui/progress.tsx` | ~40 |
| 25 | `radio-group.tsx` | `src/components/ui/radio-group.tsx` | ~80 |
| 26 | `resizable.tsx` | `src/components/ui/resizable.tsx` | ~200 |
| 27 | `scroll-area.tsx` | `src/components/ui/scroll-area.tsx` | ~50 |
| 28 | `sidebar.tsx` | `src/components/ui/sidebar.tsx` | **727** |
| 29 | `slider.tsx` | `src/components/ui/slider.tsx` | ~80 |
| 30 | `sonner.tsx` | `src/components/ui/sonner.tsx` | ~30 |
| 31 | `spinner.tsx` | `src/components/ui/spinner.tsx` | ~30 |
| 32 | `toggle-group.tsx` | `src/components/ui/toggle-group.tsx` | ~60 |
| 33 | `select.tsx` | `src/components/ui/select.tsx` | ~200 |

#### Grup B: Sadece Diğer UI Bileşenleri Tarafından Kullanılanlar (2 adet)

| # | Bileşen | Kullanan | Risk |
|---|---------|----------|------|
| 34 | `dialog.tsx` | Sadece `command.tsx` içinde | Dolaylı ölü (command de ölüyse) |
| 35 | `sheet.tsx` | Sadece `sidebar.tsx` içinde | Dolaylı ölü (sidebar da ölüyse) |

#### Grup C: Proje Genelinde Kullanılanlar (Güvenli — 21 adet)

`alert`, `avatar`, `badge`, `button`, `card`, `dropdown-menu`, `empty`, `input`, `kbd`, `label`, `separator`, `skeleton`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `tooltip`

#### Etki Analizi

| Faktör | Değer |
|--------|-------|
| **Ölü UI dosyası sayısı** | 35 adet |
| **Tahmini ölü satır** | ~5.000 - 7.000 satır |
| **Bakım yükü** | Her dependency güncellemesinde bu dosyalar da taranır |
| **Bundle etkisi** | Tree-shaking çoğunu keser; ancak `sidebar → sheet → dialog → command` import zinciri bundle'a sızabilir |
| **Öneri** | Kullanılmayanları sil veya bir `_unused/` klasörüne taşı |

### 2.2 Kullanılmayan Dependency Paketleri

#### Runtime Dependencies (node_modules şişirmesi)

| Paket | package.json'daki Yeri | src/ İçinde Kullanım Durumu |
|-------|----------------------|---------------------------|
| **`@hookform/resolvers`** | `dependencies` | ❌ Hiç import edilmemiş |
| **`lightningcss`** | `dependencies` | ⚠️ Sadece vite.config'de referans, runtime'da gerekli olabilir |
| **`autoprefixer`** | `devDependencies` | ⚠️ PostCSS config'de, src/ içinde kullanımı yok |
| **`postcss`** | `devDependencies` | ⚠️ PostCSS config'de, src/ içinde kullanımı yok |
| **`vite-plugin-inspect`** | `devDependencies` | ❌ Hiç import edilmemiş (opsiyonel debug aracı) |

**Not:** `input-otp`, `cmdk`, `vaul`, `zustand`, `wouter`, `sonner`, `recharts`, `react-day-picker`, `react-resizable-panels`, `mitt`, `firebase`, `dexie`, `dompurify`, `clsx`, `class-variance-authority`, `xlsx`, `framer-motion`, `lucide-react`, `react-hook-form`, `tailwind-merge` paketleri src/ içinde import ediliyor — güvenli.

### 2.3 Ölü Dizinler ve Dosyalar

#### `PAKET/` (1.2 MB)

Proje kökünde duran, ana projeyle **hiçbir bağlantısı olmayan** eski bir tasarım paketi.

| Alt Dizin | İçerik | Durum |
|-----------|--------|-------|
| `PAKET/files/` | `parspel-icons/` — ikon paketi | Projede kullanılan ikonlar `lucide-react` ile geliyor |
| `PAKET/files (1)/` | `parspel-icons-v2/` — ikon paketi v2 | Aynı şeyin tekrarı |
| `PAKET/new-design-package/` | Next.js projesi (shadcn/ui + tailwind) | Deneme/prototip, `package.json`'ı bile ayrı |

**Toplam:** ~1.2 MB disk alanı, ~50+ dosya.

#### `android/build/` (1.2 MB)

Capacitor Android build artifacts. `android/app/build/` altında **derlenmiş çıktılar** (mergeDebugResources, compiled classes, APK metadata). Bunlar `.gitignore`'da olmalı, commit'e dahil edilmemeli.

#### `docs/archive/` (97 KB — 13 dosya)

Eski dokümanlar. Çoğu eski audit/plan/analiz raporları:

| Dosya | Oluşturma | Güncellik |
|-------|-----------|-----------|
| `anasayfa-initial-snapshot.md` | Eski | ❌ |
| `AUDIT_EVALUATION.md` | Eski | ❌ |
| `AUDIT_PROMPT.md` | Eski | ❌ |
| `CODE_ANALYSIS.csv` | Eski | ❌ |
| `CODER_QUICK_TASK.md` | Eski | ❌ |
| `CODER_TASK_SESSION_1.md` | Eski | ❌ |
| `CODER_TASK_SESSION_2.md` | Eski | ❌ |
| `CRITICAL_FIXES.md` | Eski | ❌ |
| `HATA_DURUMLARI.md` | Eski | ❌ |
| `KULLANICI_SENARYOLARI.md` | Eski | ❌ |
| `MODERNIZATION_BLUEPRINT.md` | Eski | ❌ |
| `PERFORMANS.md` | Eski | ❌ |
| `PLAN_2_SESSION.md` | Eski | ❌ |
| `UI_REVIEW_RAPORU.md` | Eski | ❌ |

#### `e2e-report/` (25 KB)

Playwright test koşularından kalan JSON/HTML raporlar. Statik çıktı, commit'te olmamalı.

#### `docs/plans/v3.32.2-parallel-plan.md`

Eski plan dokümanı. Mevcut sürümden (v3.23.x) daha yüksek bir sürüm numarası taşıyor — ya ileriye dönük plan ya da versiyon atlaması yapılmış.

#### `src/stories/Button.stories.tsx`

Tek başına duran bir Storybook story dosyası. Projede başka story yok. Storybook kurulu (`devDependencies`'de), ama aktif kullanımda değil gibi görünüyor.

---

## BÖLÜM 3 — KARANLIK ODALAR (En Riskli Dosyalar)

### 3.1 `src/lib/changelog.ts` — 2.068 satır 🔴

| Metrik | Değer |
|--------|-------|
| **Satır** | 2.068 (projenin en büyük dosyası) |
| **`any` tip** | 5 adet (projedeki tüm `:any` kullanımlarının %83'ü) |
| **İçerik** | Elle yazılmış, binlerce satırlık değişiklik geçmişi |
| **Format** | `ChangelogEntry[]` — her biri `{title, summary, changes}` objesi |
| **İlk entry** | Proje başlangıcı |
| **Son entry** | Güncel |
| **Güncelleme sıklığı** | Her commit'te yeni entry ekleniyor |

**Riskler:**
1. **TS dosyası olarak 2K satır** — Derleyici her build'de bunu parse eder, type-check yapar
2. **`any` kullanımı** — Veri yapısındaki esnek alanlar `any` ile geçiştirilmiş
3. **Bakım zorluğu** — Elle entry eklemek hata/format bozulması riski taşır
4. **Bundle'a girme riski** — Tree-shaking kesmezse build'e dahil olur

**Önerilen çözüm:** Changelog verisini `docs/logs/CHANGELOG.md` (markdown) dosyasına taşı, TS dosyasını kaldır. Gerekirse okuma için bir `parseChangelog.ts` yardımcısı yaz.

### 3.2 `src/pages/Cizelge.tsx` — 795 satır 🟡

Monolitik sayfa. Alt bileşenlere ayrılmamış, tüm logic + JSX tek dosyada. CSS module'ü de yok (`Cizelge.module.css` mevcut değil — `src/pages/` altında böyle bir dosya da yok).

### 3.3 `src/pages/DashboardStrateji.tsx` — 784 satır 🟡

Dashboard'un strateji görünümü. Büyük olması anlaşılabilir (dashboard'lar doğası gereği karmaşık), ama alt bileşenlere ayrılma potansiyeli var.

### 3.4 `src/components/ui/sidebar.tsx` — 727 satır 🔴

**Ölü kod.** Hiçbir yerde import edilmemiş. 727 satırın tamamı derleyici yükü + bakım maliyeti.

### 3.5 `src/lib/anomalyEngine.ts` — 711 satır 🟡

Büyük engine dosyası. Domain logic yoğunluğu yüksek. Test coverage'ı kontrol edilmeli (`anomalyEngine.test.ts` mevcut ama kapsamı bilinmiyor).

### 3.6 `src/pages/Partners.tsx` — 709 satır 🟡

İş ortakları sayfası. Tek dosyada 709 satır.

### 3.7 `src/pages/BugHunter/TestRunner.ts` — 652 satır 🟡

Production dışı bir test aracı olmasına rağmen büyük boyutuyla dikkat çekiyor. `@ts-expect-error` içeriyor (bilinçli hata testi). CSS module'ü var (`BugHunter.module.css`).

### 3.8 `src/components/QuantumLink.tsx` — 642 satır 🟡

Daha önce detaylı analizi yapıldı. Tüm stiller inline, 8 adet teknik borç tespit edilmişti.

---

## BÖLÜM 4 — TEKNİK BORÇ GÖSTERGELERİ

### 4.1 eslint-disable / @ts-* Suppressions (14 adet)

#### @ts-nocheck — Tüm Dosya Tip Kontrolü Devre Dışı 🔴

| Dosya | Satır | Kod |
|-------|-------|-----|
| `src/components/ui/calendar.tsx:1-2` | 2 | `// eslint-disable-next-line @typescript-eslint/ban-ts-comment` + `// @ts-nocheck` |
| `src/components/ui/input-otp.tsx:1-2` | 2 | `// eslint-disable-next-line @typescript-eslint/ban-ts-comment` + `// @ts-nocheck` |

**Risk:** Bu iki dosyadaki **tüm** tip hataları sessizce yutulur. `@ts-nocheck` bir dosyaya konduğunda, o dosyada `string → number` ataması, `null` reference, yanlış parametre — hiçbiri yakalanmaz. Dahası, bu dosyalar `calendar → react-day-picker`, `input-otp → input-otp` kütüphanelerine bağımlı. Kütüphane güncellemesinde ortaya çıkacak uyumsuzluklar fark edilmez.

#### @ts-expect-error — Belirli Satırlar (3 adet) 🟡

| Dosya | Satır | Sebep |
|-------|-------|-------|
| `src/lib/crypto.ts:85` | 1 | TS 5.8'de `Uint8Array<ArrayBufferLike>` vs `BufferSource` uyumsuzluğu |
| `src/lib/crypto.ts:117` | 1 | Aynı uyumsuzluk |
| `src/pages/BugHunter/TestRunner.ts:73` | 1 | Bilinçli hatalı karşılaştırma (test aracı) |

**Değerlendirme:** Kriptografi dosyasındaki ikisi teknik olarak haklı (TS versiyon farkı). TestRunner'daki bilinçli. Düşük risk.

#### eslint-disable react-hooks/exhaustive-deps — useEffect Dependency Eksikliği 🟡

| Dosya | Satır | Eksik Dependency |
|-------|-------|------------------|
| `src/App.tsx:275` | 1 | useEffect içinde kullanılan değişken(ler) dependency array'de yok |
| `src/pages/Butce.tsx:40` | 1 | Aynı |
| `src/pages/KontrolHalkasi.tsx:107` | 1 | Aynı |
| `src/hooks/db/useDBSync.ts:43` | 1 | Aynı |
| `src/pages/excelmerge/temizle.tsx:30` | 1 | Aynı |

**Risk:** Stale closure — useEffect içinde eski değişken değerleriyle çalışma. Özellikle `useDBSync` ve `App.tsx`'teki suppressions projenin ana akışını etkileyebilir.

#### Diğer eslint-disable'lar 🟢

| Dosya | Satır | Tür |
|-------|-------|-----|
| `src/types/vaul.d.ts:11,16,18` | 3 | `@typescript-eslint/no-empty-object-type` — tip tanımı |
| `src/pages/Entegrasyonlar.tsx:17` | 1 | `@typescript-eslint/no-unused-vars` — kullanılmayan parametre |
| `src/lib/connConfig.test.ts:7` | 1 | `@typescript-eslint/no-explicit-any` — test dosyası |

**Değerlendirme:** Düşük risk. vaul tip tanımları zorunlu, test dosyası kabul edilebilir, unused-vars muhtemelen temizlenmeyi bekliyor.

### 4.2 `any` Tip Kullanımı

| Dosya | Adet | Bağlam |
|-------|------|--------|
| `src/lib/changelog.ts` | 5 | Changelog entry'lerindeki esnek alanlar |
| `src/lib/nexus/NexusRouter.ts` | 1 | Router tipi |

**Genel Değerlendirme:** 366 dosyada sadece 6 adet `: any` — proje tip güvenliği açısından **çok iyi** durumda. `changelog.ts`'deki 5 adet, dosyanın doğasından kaynaklanıyor (dinamik changelog verisi).

### 4.3 TODO / FIXME / HACK / XXX Etiketleri

**Sayı: 0 (sıfır)**

Projede hiç TODO/FIXME/HACK/XXX/WORKAROUND/TEMPORARY etiketi bulunamadı. Bu iki anlama gelir:
1. **Olumlu:** Geliştiriciler bitmemiş işleri kod içinde bırakmıyor, ya hemen bitiriyorlar ya da ayrı bir backlog'da (GitHub Issues, .opencode/MEMORY.md) takip ediyorlar
2. **Not:** `.opencode/memory/` altında `deepseek-tasks.md`, `audit-findings-*.md` gibi dosyalar var — burası muhtemelen "görünmez backlog"

### 4.4 Kırık Bağlantılar / Şüpheli Import'lar

#### `src/types/vaul.d.ts`
Vaul (drawer kütüphanesi) için tip tanımı. `vaul` sadece `shadcn-declarations.d.ts`'de referans ediliyor, gerçek bir `import from 'vaul'` src/ içinde yok. `drawer.tsx` bileşeni de hiç import edilmemiş.

#### `src/types/shadcn-declarations.d.ts`
Birçok shadcn/ui kütüphanesi için module declaration. Bunların çoğu (`input-otp`, `cmdk`, `react-day-picker`, `firebase`) gerçekten kullanılıyor mu bilinmiyor.

#### `src/stories/Button.stories.tsx`
Storybook kurulumu var ama aktif hikaye sayısı: **1**. Tek bir `Button` story'si. Storybook altyapısı (`@storybook/react`, `@storybook/react-vite`, `@storybook/addon-essentials`) devDependencies'de duruyor. Kullanılmıyor olabilir.

---

## BÖLÜM 5 — AĞIR DOSYALAR (SATIR SAYISINA GÖRE)

### Top 40 En Büyük Dosya

| # | Dosya | Satır | Kategori | Risk |
|---|-------|-------|----------|------|
| 1 | `src/lib/changelog.ts` | 2.068 | Lib | 🔴 |
| 2 | `src/pages/Cizelge.tsx` | 795 | Sayfa | 🟡 |
| 3 | `src/pages/DashboardStrateji.tsx` | 784 | Sayfa | 🟡 |
| 4 | `src/components/ui/sidebar.tsx` | 727 | UI | 🔴 |
| 5 | `src/lib/anomalyEngine.ts` | 711 | Lib | 🟡 |
| 6 | `src/pages/Partners.tsx` | 709 | Sayfa | 🟡 |
| 7 | `src/pages/excelmerge/ai-asistan.tsx` | 696 | Sayfa | 🟡 |
| 8 | `src/pages/DashboardFinans.tsx` | 677 | Sayfa | 🟡 |
| 9 | `src/pages/DashboardOperasyon.tsx` | 676 | Sayfa | 🟡 |
| 10 | `src/pages/BugHunter/TestRunner.ts` | 652 | Araç | 🟡 |
| 11 | `src/components/QuantumLink.tsx` | 642 | Bileşen | 🟡 |
| 12 | `src/pages/Products.tsx` | 623 | Sayfa | 🟢 |
| 13 | `src/pages/KontrolHalkasi.tsx` | 618 | Sayfa | 🟢 |
| 14 | `src/lib/dataIntegrityChecker.ts` | 603 | Lib | 🟢 |
| 15 | `src/pages/pageHelpers.tsx` | 594 | Sayfa | 🟢 |
| 16 | `src/pages/AIAsistan/index.tsx` | 562 | Sayfa | 🟢 |
| 17 | `src/pages/AnomaliOneri.tsx` | 561 | Sayfa | 🟢 |
| 18 | `src/App.tsx` | 547 | Kök | 🟢 |
| 19 | `src/pages/DashboardTicaret.tsx` | 529 | Sayfa | 🟢 |
| 20 | `src/pages/settings/SettingsBackup/SmartImportManager.tsx` | 528 | Ayarlar | 🟢 |
| 21 | `src/types/index.ts` | 518 | Tip | 🟢 |
| 22 | `src/pages/Bank/index.tsx` | 516 | Sayfa | 🟢 |
| 23 | `src/pages/ConsoleKayit.tsx` | 500 | Sayfa | 🟢 |
| 24 | `src/pages/Suppliers/index.tsx` | 498 | Sayfa | 🟢 |
| 25 | `src/pages/Stock.tsx` | 496 | Sayfa | 🟢 |
| 26 | `src/hooks/db/backup.ts` | 487 | Hook | 🟢 |
| 27 | `src/pages/Kasa.tsx` | 480 | Sayfa | 🟢 |
| 28 | `src/pages/excelmerge/merge.tsx` | 470 | Sayfa | 🟢 |
| 29 | `src/pages/Sales.tsx` | 445 | Sayfa | 🟢 |
| 30 | `src/pages/settings/SettingsAgentPanel.tsx` | 434 | Ayarlar | 🟢 |
| 31 | `src/pages/Fatura/FaturaForm.tsx` | 430 | Sayfa | 🟢 |
| 32 | `src/pages/Settings.tsx` | 428 | Sayfa | 🟢 |
| 33 | `src/lib/deepseek.ts` | 427 | Lib | 🟢 |
| 34 | `src/pages/Dashboard/Oneriler.tsx` | 422 | Dashboard | 🟢 |
| 35 | `src/theme/themes.ts` | 421 | Tema | 🟢 |
| 36 | `src/pages/Dashboard.tsx` | 417 | Sayfa | 🟢 |
| 37 | `src/pages/SaleDetail.tsx` | 415 | Sayfa | 🟢 |
| 38 | `src/pages/Receivables.tsx` | 410 | Sayfa | 🟢 |
| 39 | `src/pages/Bank/BankForm.tsx` | 406 | Sayfa | 🟢 |
| 40 | `src/pages/Notlar.tsx` | 406 | Sayfa | 🟢 |

**Risk dağılımı:**
- 🔴 **Kritik** (3 dosya): `changelog.ts` (ölü veri + any), `sidebar.tsx` (ölü kod), `calendar.tsx`+`input-otp.tsx` (ts-nocheck)
- 🟡 **Orta** (7 dosya): Büyük monolitik sayfalar, engine'ler
- 🟢 **Düşük** (30 dosya): Normal büyük dosyalar

---

## BÖLÜM 6 — GİZEMLİ YOLLAR / NEREYE ÇIKTIĞI BELLİ OLMAYAN REFERANSLAR

### 6.1 AgentBus → Event Sistemi

`src/agents/AgentBus.ts` — `mitt` kütüphanesi üzerinden event bus. Agent'lar arası haberleşme. Peki bu event bus'a kimler abone? Kimler olay gönderiyor?

```
AgentBus ──emit──> ? (dinleyiciler)
    ^
    │
  mitt (event emitter)
```

**Tespit:** `AgentBus`'ın hangi event'leri yayınladığı ve kimlerin dinlediği doğrudan görünmüyor. `domain/listeners/` altındaki dosyalar (`agentBridge`, `auditLogger`, `notification`) event sistemine bağlanıyor olabilir. Event tipi (`AgentEvent`) agents/types.ts'de tanımlı.

### 6.2 Nexus Sistemi

`src/lib/nexus/` altında iki dosya:
- `NexusRouter.ts` — `: any` tip kullanımı
- `VoiceNexusCore.ts` — sesli asistan çekirdeği

Ve `src/components/nexus/` altında iki bileşen:
- `NexusBubble.tsx`
- `NexusSpark.tsx`

**Soru:** Bu Nexus sistemi aktif olarak kullanılıyor mu? Yoksa deneysel bir feature mı? `VoiceNexusCore`, `QuantumLink` ve `VoiceAssistantButton` ile ilişkisi nedir?

### 6.3 Kullanılmayan Spec Engine

`src/lib/specs/` altında 10 dosya — bir spec doğrulama motoru:
- `runner.ts` — spec'leri çalıştırır
- 7 adet rule dosyası (accessibility, component-coverage, component, data, error, navigation, performance-budget, test-rules)
- `index.ts`, `types.ts`

**Durum:** `SpecDashboard.tsx` sayfası var ve spec sonuçlarını gösterebilir. Ama bu spec sistemi CI'da çalışıyor mu, yoksa sadece manuel mi? `runner`'ı kim tetikliyor?

### 6.4 BugHunter Modülü — Production'da Ne İşi Var?

`src/pages/BugHunter/` — 8 dosyalık kapsamlı bir hata avcılık aracı:
- `TestRunner.ts` (652 satır) — bilinçli hata testleri
- `BugResults.tsx`, `BugStats.tsx`, `BugToolbar.tsx` — sonuç gösterimi
- `types.ts` — test sonuç tipleri

**Soru:** Bu araç sadece geliştirme için mi? Production build'de devre dışı mı? `react-scan` benzeri bir dev aracı olabilir. `TestRunner.ts:73`'teki `@ts-expect-error` "bilinçli hatalı karşılaştırma" yapıyor — bu production'da çalışırsa kullanıcıya hata gösterir.

---

## BÖLÜM 7 — PROJE YAPISAL NOTLAR

### 7.1 Dosya İsimlendirme Standartları

Projede **iki farklı isimlendirme standardı** var:

| Standart | Örnekler |
|----------|----------|
| **PascalCase** | `QuantumLink.tsx`, `FaturaForm.tsx`, `CariList.tsx` |
| **kebab-case** | `not-found.tsx`, `use-mobile.tsx` |
| **camelCase** | `pageHelpers.tsx`, `salesStyles.ts` |
| **karma** | `AIAHelpers.tsx`, `AIAHelpers.utils.ts`, `AIEylemLog.tsx` |

Bu tutarsızlık dosya aramayı ve import path'lerini tahmin etmeyi zorlaştırıyor.

### 7.2 CSS Organizasyonu

| Tür | Adet | Kullanım |
|-----|------|----------|
| `*.module.css` (sayfa bazlı) | 12+ | Sayfa stilleri |
| `*.module.css` (bileşen bazlı) | 4 | Dashboard alt bileşenleri |
| `src/index.css` | 1 | Global stiller |
| `src/design-tokens.css` | 1 | Tasarım tokenları |

CSS Modules iyi organize edilmiş, ancak `QuantumLink.tsx` gibi bazı bileşenler **tamamen inline style** kullanıyor (642 satırda 40+ inline style objesi).

### 7.3 Test Coverage

| Dizin | Test Dosyası Sayısı |
|-------|-------------------|
| `src/__tests__/` | 9 |
| `src/agents/` | 7 (her agent için 1) |
| `src/lib/` | 20+ |
| `src/domain/services/` | 1 |
| `src/features/voice-sales/` | 4 |
| `src/hooks/db/` | 3 |
| `src/pages/Suppliers/` | 1 |

Toplam **50 test dosyası** — orta-iyi seviye coverage. Agent'ların her biri için ayrı test dosyası olması olumlu.

---

## BÖLÜM 8 — ÖNCELİKLİ TEMİZLİK LİSTESİ

### 🔴 P1 — Hemen Yapılması Gerekenler

| # | İşlem | Gerekçe | Kazanç |
|---|-------|---------|--------|
| 1 | **`PAKET/` dizinini sil** | Projeyle alakasız, 1.2 MB disk israfı | 1.2 MB |
| 2 | **`android/build/`'i .gitignore'a ekle** | Build artifacts commit'e dahil olmamalı | 1.2 MB + commit hijyeni |
| 3 | **Kullanılmayan 33 shadcn/ui bileşenini temizle** | 5K-7K satır ölü kod, bakım yükü | ~6.000 satır |
| 4 | **`src/components/ui/sidebar.tsx` sil** | 727 satır, hiç import edilmemiş | 727 satır |
| 5 | **`calendar.tsx` ve `input-otp.tsx` düzelt** | `@ts-nocheck` kaldır, tipleri düzelt | Tip güvenliği |

### 🟡 P2 — Kısa Vadede Yapılması Gerekenler

| # | İşlem | Gerekçe |
|---|-------|---------|
| 6 | **`src/lib/changelog.ts`'i `docs/logs/CHANGELOG.md`'ye taşı** | 2.068 satırlık TS dosyası gereksiz, MD olarak tutulmalı |
| 7 | **`docs/archive/` temizliği** | 13 eski dosya, karar ver (sakla/sil/taşı) |
| 8 | **`e2e-report/` + `playwright-report/` .gitignore'a ekle** | Statik test raporları commit'de olmamalı |
| 9 | **`@hookform/resolvers` paketini kaldır** | Hiç kullanılmıyor |
| 10 | **`vite-plugin-inspect` paketini kaldır** | Hiç kullanılmıyor (opsiyonel debug) |
| 11 | **5 adet `eslint-disable react-hooks/exhaustive-deps` düzelt** | Stale closure riski |
| 12 | **`autoprefixer` + `postcss` ihtiyacını doğrula** | Tailwind 4 ile PostCSS hala gerekli mi? |

### 🟢 P3 — İyileştirme Önerileri

| # | İşlem | Gerekçe |
|---|-------|---------|
| 13 | **`src/stories/` karar ver (sil veya genişlet)** | Tek story'lik Storybook kurulumu |
| 14 | **`QuantumLink.tsx` inline style → CSS module** | 40+ inline style objesi |
| 15 | **Dosya isimlendirme standardizasyonu** | PascalCase/kebab-case/camelCase karmaşası |
| 16 | **BugHunter modülünü production build'den çıkar** | Geliştirme aracı production'da olmamalı |
| 17 | **`scripts/archive/version-utils.ts` temizliği** | Eski script arşivi |
| 18 | **Nexus sistemi durum değerlendirmesi** | Deneysel mi aktif mi? |

---

## BÖLÜM 9 — OLUMLU GÖZLEMLER

Tüm bu kritik bulguların yanında, projenin **güçlü yönlerini** de not etmek gerek:

### ✅ Tip Güvenliği
- 366 dosyada sadece **6 adet `: any`** — sektör ortalamasının çok altında
- `@ts-nocheck` sadece 2 dosyada (kütüphane uyum sorunu)
- Agent sistemi, domain katmanı, servisler — hepsi arayüz odaklı tasarlanmış

### ✅ Kod Temizliği
- **Sıfır TODO/FIXME/HACK** etiketi
- `eslint-disable`'ların çoğu gerekçeli (sadece 5 tanesi gerçek borç)
- Logger, try/catch, error handling yaygın kullanılmış

### ✅ Test Kültürü
- 50 test dosyası (Vitest + Playwright)
- Her agent için ayrı test
- E2E testleri (Playwright + Lighthouse)
- Fast-check (property-based testing) kurulu

### ✅ Mimari
- **Domain-Driven Design** etkileri: domain/ katmanı, services/, listeners/
- **Feature-based** organizasyon: `features/voice-sales/` modüler
- **Agent sistemi** temiz ayrıştırılmış: her agent kendi dosyasında
- **Spec engine** ile otomatik kalite doğrulama altyapısı

### ✅ Dokümantasyon
- `docs/` dizini iyi organize: agents/, logs/, management/, plans/, technical/
- CLAUDE.md, opencode.json, state-registry.json gibi AI çağı dostu dosyalar
- Changelog titizlikle tutuluyor

### ✅ Modern Teknolojiler
- React 19, TypeScript 5.8, Vite 6
- shadcn/ui + Tailwind 4
- Dexie (IndexedDB), Firebase, Capacitor 8
- Vitest 3, Playwright 1.60

---

## BÖLÜM 10 — EK: TARAMA METODOLOJİSİ

### Kullanılan Araçlar

| Araç | Amaç |
|------|------|
| **ripgrep (rg) 15.1** | Metin arama, export/import tespiti, pattern taraması |
| **find + wc -l** | Dosya listeleme ve satır sayma |
| **Python 3.14** | Veri işleme, analiz |
| **codebase-radar skill** | Sembol bazlı tarama (QuantumLink özelinde) |
| **Manuel inceleme** | Şüpheli dosyaların içerik doğrulaması |

### Tarama Pattern'leri

| Arama | Pattern |
|-------|---------|
| Export'lar | `^export (function|const|class|interface|type|default)` |
| Import chain | `from.*['"]@/components/ui/[\w-]+['"]` |
| any tipleri | `: any` |
| Suppressions | `eslint-disable\|@ts-ignore\|@ts-expect-error\|@ts-nocheck` |
| TODO'lar | `TODO\|FIXME\|HACK\|XXX\|WORKAROUND\|TEMPORARY` |
| Dependency kullanımı | `from.*['"]<package>['"]` |

### Kısıtlamalar

1. **Statik analiz** — runtime'da ölü kod tespit edilemez (ör: dynamic import, conditional render)
2. **Tree-shaking** etkisi hesaplanmamıştır — Vite/Rollup'un ölü kodları budama kabiliyeti ayrı bir analiz gerektirir
3. **Test coverage** yüzdesi ölçülmemiştir — sadece test dosyası varlığı kontrol edilmiştir
4. **Bundle analizi** yapılmamıştır — `rollup-plugin-visualizer` kurulu ama çalıştırılmamış

---

*Rapor 1 — 2026-06-20 — Hermes Agent (codebase-radar + ripgrep + manuel analiz)*
*Kapsam: repo_2 PARSPEL PWA — 366 TS/TSX dosyası, ~61K satır, 50 test*
