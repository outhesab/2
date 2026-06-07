/**
 * PARSPEL — Sürüm Geçmişi (Changelog)
 * Her sürüm için değişiklikler, yeni özellikler ve düzeltmeler.
 */

export type ChangeType = 'yeni' | 'iyilestirme' | 'duzeltme' | 'kaldirildi';

export interface ChangeEntry {
  type: ChangeType;
  text: string;
}

export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: ChangeEntry[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: '3.18.3',
    date: '7 Haziran 2026',
    title: 'Spec Compliance Düzeltmeleri',
    summary:
      'SettingsSound useDB() hook geri yüklendi. Version 3.18.3 güncellendi. Tüm spec compliance testleri geçiyor.',
    changes: [
      { type: 'duzeltme', text: 'package.json version: 3.18.2 -> 3.18.3' },
      { type: 'duzeltme', text: 'SettingsSound.tsx: useDB() hook ile DB erişimi' },
      { type: 'duzeltme', text: 'Card import yolu: @/pages/SettingsCard' },
      {
        type: 'duzeltme',
        text: 'Relative import (../) -> @/ path alias: SettingsCompany, SettingsExcel, SettingsSecurity, SettingsSound',
      },
      { type: 'duzeltme', text: 'Settings.tsx: unused lbl değişkeni kaldırıldı' },
      { type: 'iyilestirme', text: 'CI pipeline: lint (0 warnings), tests (271 passed), build (success)' },
    ],
  },
  {
    version: '3.18.2',
    date: '7 Haziran 2026',
    title: 'Görünüm Encoding Temizliği ve Lint Uyarıları',
    summary:
      'Proje genelindeki UTF-8 encoding bozuklukları düzeltildi. Tüm lint uyarıları giderildi (11 -> 0). Utility fonksiyonları bileşenlerden ayrı dosyalara taşındı.',
    changes: [
      { type: 'duzeltme', text: 'Global UTF-8 encoding temizliği (Fatura.tsx, Settings.tsx)' },
      {
        type: 'duzeltme',
        text: 'Settings.tsx parçalandı: SettingsCompany, SettingsSound, SettingsArayuz, SettingsBaglanti',
      },
      { type: 'duzeltme', text: 'SettingsArayuz: Duplicate Premium Temalar bloğu kaldırıldı' },
      { type: 'duzeltme', text: 'Settings.tsx tab listesi mobil için scrollable hale getirildi' },
      { type: 'duzeltme', text: 'Debug CSS outline kaldırıldı' },
      { type: 'duzeltme', text: 'ThemeSection.tsx PREMIUM_THEMES import hatası düzeltildi' },
      { type: 'iyilestirme', text: 'Lint warnings: 11 -> 0 (tamamen temiz)' },
      { type: 'iyilestirme', text: 'pageHelpers.tsx: styles ve constants ayrı dosyalara taşındı (pageStyles.ts)' },
      { type: 'iyilestirme', text: 'SalesHelpers.tsx: utilities ayrı dosyaya taşındı (salesStyles.ts)' },
      { type: 'iyilestirme', text: 'useDebounce hook ayrı dosyaya taşındı (useDebounce.ts)' },
    ],
  },
  {
    version: '3.18.1',
    date: '7 Haziran 2026',
    title: 'Lint Uyarıları ve Kod Temizliği',
    summary:
      'Code review sonrası tespit edilen lint uyarıları düzeltildi. Kullanılmayan değişkenler ve importlar temizlendi.',
    changes: [
      { type: 'duzeltme', text: 'Settings.tsx: unused company state, setCompany, saveCompany kaldırıldı' },
      { type: 'duzeltme', text: 'Settings.tsx: unused SoundType import kaldırıldı' },
      { type: 'duzeltme', text: 'SettingsArayuz.tsx: unused Button import kaldırıldı' },
      { type: 'iyilestirme', text: 'Lint warnings: 15 -> 11 azaltıldı' },
    ],
  },
  {
    version: '3.18.0',
    date: '7 Haziran 2026',
    title: 'Settings Bileşen Refactoring ve CI İyileştirmeleri',
    summary:
      "Code review sonrası tespit edilen kritik sorunlar düzeltildi. SettingsArayuz 452 satırdan 31 satıra indirildi, 6 alt bileşene ayrıldı. CI pipeline'da quality gate geri eklendi.",
    changes: [
      {
        type: 'duzeltme',
        text: 'build-apk.yml: needs: quality geri eklendi — APK artık sadece lint/typecheck/test geçerse build ediliyor',
      },
      { type: 'duzeltme', text: 'SettingsArayuz.tsx: localStorage.removeItem() yerine saveUIPrefs() kullanılıyor' },
      { type: 'duzeltme', text: 'gradle-wrapper.properties: 8.13 -> 8.14.3 sürüm tutarlılığı sağlandı' },
      { type: 'iyilestirme', text: 'SettingsArayuz: 452 satır -> 31 satır (6 alt bileşene ayrıldı)' },
      {
        type: 'iyilestirme',
        text: 'Yeni bileşenler: ThemeSection, TypographySection, AnimationSection, DashboardSection, FloatingButtonsSection, SettingsActionButtons',
      },
      { type: 'iyilestirme', text: 'Inline style temizliği — Tailwind + CSS değişkenleri kullanılıyor' },
    ],
  },
  {
    version: '3.17.0',
    date: '7 Haziran 2026',
    title: 'Güvenlik, Performans ve Bakım İyileştirmeleri',
    summary:
      'Kapsamlı code review sonrası tespit edilen 25 güvenlik, 10 performans ve 14 bakım sorunu düzeltildi. AES anahtar yönetimi, brute-force koruması, memoization, lazy import ve kod konsolidasyonu uygulandı.',
    changes: [
      // Güvenlik
      { type: 'duzeltme', text: "crypto.ts: AES-256-GCM anahtarı artık non-exportable ve IndexedDB'de saklanıyor" },
      { type: 'duzeltme', text: 'crypto.ts: localStorage plaintext anahtar kaldırıldı — migration otomatik' },
      {
        type: 'duzeltme',
        text: 'logger.ts: Hassas alanlar (password, token, apikey) artık persist öncesi de maskeleniyor',
      },
      { type: 'duzeltme', text: "safeIO.ts: Güvenlik kritik key'ler (session, crypto, config) evict edilmiyor" },
      {
        type: 'duzeltme',
        text: 'core.ts: importJSON artık şema doğrulama, boyut kontrolü ve prototype pollution koruması yapıyor',
      },
      { type: 'duzeltme', text: 'connConfig.ts: Config kayıt öncesi tip ve injection doğrulaması eklendi' },
      { type: 'duzeltme', text: 'userManager.ts: Math.random() yerine crypto.randomUUID() kullanılıyor' },
      { type: 'duzeltme', text: 'userManager.ts: Brute-force koruması — 5 başarısız denemeden sonra 1 dakika kilit' },
      {
        type: 'duzeltme',
        text: 'userManager.ts: Misafir oturumu integrity hash artık crypto.randomUUID ile üretiliyor',
      },
      { type: 'duzeltme', text: 'core.ts: saveToStorage artık version artışını mutasyon olmadan yapıyor' },
      // Performans
      { type: 'iyilestirme', text: 'core.ts: save() ve saveGuarded() ortak processSave() fonksiyonuna birleştirildi' },
      {
        type: 'iyilestirme',
        text: 'core.ts: useDB() return değeri useMemo ile stabilize edildi — gereksiz re-render önlendi',
      },
      { type: 'iyilestirme', text: 'Dashboard.tsx: recentSales ve recentActivity useMemo ile memoize edildi' },
      {
        type: 'iyilestirme',
        text: 'Dashboard.tsx: exportToExcel lazy import ile sadece tıklanınca yükleniyor (~1MB chunk)',
      },
      {
        type: 'iyilestirme',
        text: 'index.css: background-attachment: fixed kaldırıldı — mobilde GPU performansı arttı',
      },
      { type: 'iyilestirme', text: "vite-manual-chunks.ts: dexie, exceljs, zustand, mitt için ayrı chunk'lar eklendi" },
      // Bakım
      {
        type: 'iyilestirme',
        text: 'anomalyEngine + dataIntegrityChecker: Sağlık skoru formülü tekilleştirildi (computeHealthScore)',
      },
      { type: 'iyilestirme', text: 'anomalyEngine + dataIntegrityChecker: console.warn yerine logger kullanılıyor' },
      { type: 'duzeltme', text: 'dataIntegrityChecker: Çelişkili boyut eşikleri olan mükerrer bölüm 9 kaldırıldı' },
      {
        type: 'iyilestirme',
        text: 'data-rules.ts: walkFiles artık birden fazla uzantı alıyor ve tam dosya adı eşleşmesi yapıyor',
      },
      { type: 'duzeltme', text: 'SetupWizard.tsx: value: any yerine T[keyof T] kullanıldı' },
      // CI Pipeline Recovery
      { type: 'duzeltme', text: 'LogCategory tipi 30+ kategori ile genişletildi (83 TS hatası çözüldü)' },
      { type: 'duzeltme', text: 'Kullanılmayan import/değişkenler temizlendi (19 TS6133 hatası)' },
      { type: 'duzeltme', text: 'SatisAgent.ts: this bağlamı hatası düzeltildi (yetkiKontrolu bağlam kaybı)' },
      { type: 'duzeltme', text: 'aiActions.ts/crypto.ts/aiApi.ts/deepseek.ts: ESLint no-explicit-any fix' },
      { type: 'duzeltme', text: 'aiOffline.ts: monthStart tanımlandı, undefined referans hatası düzeltildi' },
      { type: 'duzeltme', text: 'KontrolHalkasi.tsx: as unknown as Record double cast eklendi' },
      { type: 'iyilestirme', text: 'scripts/version-utils.ts: resolveVersionCode fonksiyonu eklendi' },
      { type: 'duzeltme', text: 'quality-gate.yml: push trigger sadece dev branch olacak şekilde düzeltildi' },
    ],
  },
  {
    version: '3.16.4',
    date: '7 Haziran 2026',
    title: 'data-rules.ts Syntax Hatası Düzeltmesi',
    summary:
      "src/lib/specs/data-rules.ts dosyasında fazladan süslü parantez '}' nedeniyle lint, typecheck ve spec-compliance testi kırılıyordu. Her iki kuraldaki brace hataları düzeltildi.",
    changes: [
      { type: 'duzeltme', text: 'NO_DIRECT_DB_WRITE kuralındaki fazladan } kaldırıldı' },
      { type: 'duzeltme', text: 'NO_DB_JSON_PARSE_IN_PAGES kuralındaki fazladan } kaldırıldı' },
    ],
  },
  {
    version: '3.16.3',
    date: '7 Haziran 2026',
    title: 'CI pnpm 11 Uyumsuzluğu Düzeltmesi',
    summary:
      "GitHub Actions'ta pnpm 11.5.2 kullanıldığı için package.json'daki pnpm.onlyBuiltDependencies okunmuyordu. pnpm 9.15.4'e sabitlendi ve --config.onlyBuiltDependencies flag'ı eklendi.",
    changes: [
      { type: 'duzeltme', text: "pnpm version 9'a sabitlendi (9.15.4)" },
      { type: 'duzeltme', text: 'CI install komutuna --config.onlyBuiltDependencies=fallow eklendi' },
    ],
  },
  {
    version: '3.16.2',
    date: '7 Haziran 2026',
    title: 'pnpm Build Script İznı',
    summary:
      "GitHub Actions CI'da fallow build script reddedilme hatası düzeltildi. pnpm.onlyBuiltDependencies eklendi.",
    changes: [{ type: 'duzeltme', text: 'package.json\'a pnpm.onlyBuiltDependencies:["fallow"] eklendi' }],
  },
  {
    version: '3.16.1',
    date: '7 Haziran 2026',
    title: 'GitHub Actions pnpm/corepack Düzeltmesi',
    summary: "GitHub Actions workflow'larında pnpm PATH hatası düzeltildi. corepack enable adımı eklendi.",
    changes: [
      { type: 'duzeltme', text: "build-apk, quality-gate, deploy workflow'larına corepack enable adımı eklendi" },
    ],
  },
  {
    version: '3.16.0',
    date: '7 Haziran 2026',
    title: 'OpenRouter Multi-Agent Yapılandırması',
    summary:
      "OpenRouter free tier ile 11 agent tanımlandı (7 free, 4 power). LMStudio ve Ollama provider'ları kaldırıldı. Compaction ayarları optimize edildi.",
    changes: [
      { type: 'yeni', text: 'OpenRouter provider eklendi (free tier modeller)' },
      {
        type: 'yeni',
        text: '11 agent tanımlandı: architect, coder, brainstorm, reviewer, orchestrator, visionary, agentic-coder (free) + power-coder, power-planner, power-reasoner, power-frontend (opencode-go)',
      },
      { type: 'kaldirildi', text: "LMStudio ve Ollama provider'ları kaldırıldı" },
      { type: 'iyilestirme', text: 'Compaction ayarları: tail_turns 20, reserved 15000' },
    ],
  },
  {
    version: '3.15.4',
    date: '8 Haziran 2026',
    title: 'CI/CD Workflow Güvenlik ve Güvenilirlik Düzeltmeleri',
    summary:
      "GitHub Actions workflow'larında 6 kritik sorun düzeltildi: block-new-branch tüm branch'leri siliyordu, quality-gate PR'lerde çalışmıyordu, deploy/build APK kalite kontrolünü beklemeden çalışıyordu, build-apk Gradle izin eksikliği vardı, pnpm PATH'de bulunamıyordu, Node.js 20 deprecation uyarısı vardı.",
    changes: [
      {
        type: 'duzeltme',
        text: "block-new-branch.yml: if koşulu düzeltildi — artık sadece dev/main dışındaki branch'leri engelliyor, main branch'ini silmiyor",
      },
      {
        type: 'duzeltme',
        text: 'quality-gate.yml: push + pull_request trigger eklendi — PR açıldığında da lint/test/build çalışıyor',
      },
      {
        type: 'duzeltme',
        text: 'deploy.yml + build-apk.yml: "needs: quality" bağımlılığı eklendi — deploy ve APK build önce kalite kontrolünden geçiyor',
      },
      { type: 'duzeltme', text: 'build-apk.yml: Gradle executable izni (chmod +x) ve android/ dizin kontrolü eklendi' },
      {
        type: 'duzeltme',
        text: "build-apk.yml: setup-android action kaldırıldı — Capacitor kendi Gradle wrapper'ını kullanıyor, ek Android SDK gerekmez",
      },
      {
        type: 'duzeltme',
        text: "Tüm workflow'lar: pnpm/action-setup -> setup-node sıralaması düzeltildi, run_install: false eklendi — pnpm PATH'te bulunamama hatası giderildi",
      },
      {
        type: 'duzeltme',
        text: "Tüm workflow'lar: FORCE_JAVASCRIPT_ACTIONS_TO_NODE24 env kaldırıldı — Node.js 20 deprecation uyarısı giderildi",
      },
    ],
  },
  {
    version: '3.15.3',
    date: '7 Haziran 2026',
    title: "Güvenlik — Firebase API Key URL Query'den Çıkarıldı",
    summary:
      "userManager.ts'teki Firebase REST API çağrıları Firebase SDK'ya taşındı. API key artık URL'de query parameter olarak gönderilmiyor, SDK üzerinden güvenli şekilde iletilir.",
    changes: [
      {
        type: 'iyilestirme',
        text: "userManager.ts: loadUsers/saveUsers REST API → Firebase SDK (readDoc/writeDoc) — API key URL query parameter'dan kaldırıldı",
      },
    ],
  },
  {
    version: '3.15.2',
    date: '7 Haziran 2026',
    title: 'StatCard SalesHelpers → pageHelpers taşıması',
    summary: "StatCard bileşeni SalesHelpers.tsx'ten pageHelpers.tsx'e taşındı, clone refactor batch 2 kapsamında.",
    changes: [
      { type: 'iyilestirme', text: 'StatCard: SalesHelpers → pageHelpers taşındı, re-export ile geriye uyum sağlandı' },
    ],
  },
  {
    version: '3.13.2',
    date: '5 Haziran 2026',
    title: 'CSS Variable Geçişi — QuantumLink, NotificationCenter tamamlama',
    summary:
      'QuantumLink bileşenindeki hardcoded renk/kenarlık değerleri CSS variable referanslarına dönüştürüldü. NotificationCenter ek CSS variable iyileştirmeleri yapıldı. package.json versiyon uyumu düzeltildi.',
    changes: [
      { type: 'iyilestirme', text: 'QuantumLink: inline stiller CSS variable kullanacak şekilde güncellendi' },
      {
        type: 'iyilestirme',
        text: 'NotificationCenter: ek CSS variable dönüşümleri (border, text, renk iyileştirmeleri)',
      },
      { type: 'duzeltme', text: 'package.json 3.13.0 → 3.13.2 (versiyon tutarlılığı)' },
    ],
  },
  {
    version: '3.13.1',
    date: '4 Haziran 2026',
    title: 'CSS Variable Geçişi — IconPicker, MobileSelect, NotificationCenter',
    summary:
      'IconPicker, MobileSelect ve NotificationCenter bileşenlerindeki hardcoded renk/kenarlık/yazı tipi değerleri CSS variable referanslarına dönüştürüldü. Tema uyumu ve bakım kolaylığı iyileştirildi.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'IconPicker: hardcoded rgba/hex renkler → CSS variable (--color-primary-soft, --text-muted, --radius-sm, --bg-elevated)',
      },
      {
        type: 'iyilestirme',
        text: 'MobileSelect: hardcoded renkler → CSS variable (--bg-elevated, --border-strong, --radius, --text-muted, --color-primary-soft)',
      },
      {
        type: 'iyilestirme',
        text: 'NotificationCenter: seviye stilleri → CSS variable (--color-danger-soft, --color-warning, --color-info, --glass-border, --surface-overlay)',
      },
    ],
  },
  {
    version: '3.13.0',
    date: '4 Haziran 2026',
    title: 'Kod Bölme & Güvenlik İyileştirmeleri',
    summary:
      'Settings.tsx (5425→4414 satır), Sales.tsx (1076→599 satır), Cari.tsx (1756→1286 satır) bölünerek kod tabanı modüler hale getirildi. (window as any) kullanımları temizlendi, structuredClone polyfill (safeClone) eklendi, IndexedDB guest session doğrulaması getirildi. CSS değişkenleri design-tokens.css dosyasına ayrıştırıldı. UTF-8 korunmuş Türkçe karakter düzeltmeleri yapıldı.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'Settings.tsx bölündü: ArayuzAyarlari (SettingsArayuz.tsx), BaglantiAyarlari (SettingsBaglanti.tsx), Card (SettingsCard.tsx) ayrı dosyalara çıkarıldı',
      },
      {
        type: 'iyilestirme',
        text: 'Sales.tsx bölündü: SaleFormModal (SaleFormModal.tsx) + SalesHelpers.tsx ayrıştırıldı',
      },
      { type: 'iyilestirme', text: 'Cari.tsx bölündü: CariDetail (CariDetail.tsx) ayrıştırıldı' },
      {
        type: 'iyilestirme',
        text: 'index.css ikiye bölündü: design-tokens.css (CSS değişkenleri) + index.css (bileşen stilleri)',
      },
      {
        type: 'iyilestirme',
        text: '(window as any) temizlendi: useSpeech.ts (5), useSoundFeedback.ts (2) → src/types/global.d.ts',
      },
      {
        type: 'iyilestirme',
        text: 'structuredClone polyfill: safeClone() ile JSON.stringify/parse fallback (iOS Safari uyumluluğu)',
      },
      {
        type: 'iyilestirme',
        text: 'Guest session IndexedDB doğrulaması eklendi (guestSessions tablosu, Dexie schema v2)',
      },
      {
        type: 'iyilestirme',
        text: 'UTF-8 bozuk Türkçe karakterler düzeltildi (App.tsx, Settings.tsx, SettingsBaglanti.tsx)',
      },
      { type: 'duzeltme', text: 'changelog.ts parse hatası düzeltildi (curl apostrophe)' },
      { type: 'duzeltme', text: 'saleCompletion.ts relative import düzeltildi (@/domain/types)' },
      { type: 'duzeltme', text: 'useSoundFeedback.ts useEffect cleanup (AudioContext kapatma) eklendi' },
      { type: 'duzeltme', text: 'Irregular whitespace (U+00A0) temizliği, WidgetId type fix, version consistency' },
    ],
  },
  {
    version: '3.12.1',
    date: '4 Haziran 2026',
    title: 'UI Düzeltmeleri — Widget, Tema & AI Görünürlük',
    summary:
      'WIDGET_OPTIONS ortak config/widgets.ts dosyasına taşındı; Settings sayfası açılırken oluşan "not defined" hatası giderildi. AI Asistan butonlarının inline stilleri CSS variable kullanacak şekilde güncellendi (karanlık temada görünmez olma sorunu çözüldü). Sekme gruplarına özel renk değişkenleri eklendi, finans grubu cyan rengine ayrıştırıldı.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'WIDGET_OPTIONS ve WidgetId tipi src/config/widgets.ts ortak dosyasına taşındı — Dashboard ve Settings aynı kaynaktan import eder',
      },
      { type: 'duzeltme', text: 'Settings sayfası açılırken oluşan "WIDGET_OPTIONS is not defined" hatası giderildi' },
      {
        type: 'duzeltme',
        text: 'AI Asistan sayfasındaki inline stillerdeki hardcoded renkler CSS variable ile değiştirildi — butonlar karanlık temada görünmez olmuyor',
      },
      {
        type: 'iyilestirme',
        text: 'Sekme gruplarına özel CSS değişkenleri eklendi (--tab-ana-*, --tab-finans-*, vs.) — finans grubu cyan (#06b6d4) rengine ayrıştırıldı, ışık/karanlık modda tutarlı renkler',
      },
      { type: 'iyilestirme', text: "Premium temalar ve dark mode için tab group renk override'ları eklendi" },
    ],
  },
  {
    version: '3.12.0',
    date: '2 Haziran 2026',
    title: 'Session 2 — Dumb Agent + Orchestrator Sadeleştirme',
    summary:
      'SatisAgent artık pure completeSale() kullanır, stok/kasa/cari yan etkilerini tek save()\'de uygular. Orchestrator sale pipeline\'ı sadece ["satis","fatura","rapor"] olarak kısaltıldı (çift kayıt önlendi). StokAgent/KasaAgent/CariAgent non-sale operasyonlar için sadeleştirildi.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'SatisAgent.yeniSatis(): completeSale() domain service kullanır — stok/kasa/cari yan etkileri tek save() çağrısında uygulanır',
      },
      { type: 'iyilestirme', text: 'SatisAgent: satış kaydına _domainEventLog eklenir (denetim izi)' },
      {
        type: 'iyilestirme',
        text: 'orchestrator.ts: sale pipeline ["satis","fatura","rapor"] — stok/kasa/cari çift kayıt hatası giderildi',
      },
      {
        type: 'iyilestirme',
        text: 'orchestrator.ts: @deprecated eklendi — gelecek sürümde processIntent lehine kaldırılacak',
      },
      { type: 'iyilestirme', text: 'StokAgent: sadece stok_guncelle/urun_ekle işlemleri (sale mantığı kaldırıldı)' },
      { type: 'iyilestirme', text: 'KasaAgent: sadece kasa_gelir/kasa_gider işlemleri (sale mantığı kaldırıldı)' },
      { type: 'iyilestirme', text: 'CariAgent: sadece cari_tahsilat/cari_ekle işlemleri (sale mantığı kaldırıldı)' },
      { type: 'iyilestirme', text: 'StokAgent/KasaAgent: crypto.randomUUID() → genId() ile değiştirildi' },
    ],
  },
  {
    version: '3.11.0',
    date: '2 Haziran 2026',
    title: 'Domain Katmanı (Session 1) — Saf İş Mantığı Ayrıştırması',
    summary:
      "Event-driven domain katmanı eklendi: types, eventBus, pure completeSale() fonksiyonu ve intentEngine. İş mantığı agent'lardan ayrıştırılarak test edilebilir saf fonksiyonlara taşındı.",
    changes: [
      {
        type: 'yeni',
        text: 'src/domain/types.ts: DomainEvent, SaleIntent, StockMovementV2, CashTransaction, CariUpdate, SaleResult, Intent tipleri',
      },
      { type: 'yeni', text: 'src/domain/eventBus.ts: DomainEventBus — typed pub/sub event bus (on/onAny/emit/clear)' },
      {
        type: 'yeni',
        text: 'src/domain/services/saleCompletion.ts: pure completeSale() — stok doğrulama, satış hesaplama, stok/kasa/cari yan etkilerini önceden hesaplar (mutasyon yok)',
      },
      {
        type: 'yeni',
        text: 'src/domain/intentEngine.ts: processIntent() — intent alır, domain service çağırır, event bus üzerinden yayınlar',
      },
      {
        type: 'iyilestirme',
        text: 'src/types/index.ts: DomainEvent arayüzü eklendi, Sale._domainEventLog alanı eklendi (geriye uyumlu)',
      },
    ],
  },
  {
    version: '3.10.7',
    date: '2 Haziran 2026',
    title: 'QuantumLink Agent Entegrasyonu',
    summary: 'Sesli/yazılı komutlar dispatchAgentFlow ile agent sistemine yönlendirildi.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'QuantumLink: processCommand() dispatchAgentFlow entegrasyonu — satış, kasa gelir/gider, cari tahsilat komutları artık agent sistemi üzerinden işlenir',
      },
    ],
  },
  {
    version: '3.10.6',
    date: '2 Haziran 2026',
    title: 'QuantumLink Aktif',
    summary: 'Sesli AI asistan paneli arayüze eklendi.',
    changes: [{ type: 'duzeltme', text: "QuantumLink bileşeni App.tsx'e eklendi, FAB ile çakışmadan çalışır" }],
  },
  {
    version: '3.10.5',
    date: '31 Mayıs 2026',
    title: 'UI Düzeltmeleri + Dashboard Widget Yönetimi',
    summary:
      "Dashboard stat card renkleri düzeltildi (eski !important hatası). Widget yönetimi ve parlaklık kontrolü Settings'e gerçek kontrollerle eklendi. Sidebar logosu iyileştirildi, yedek butonu eski görünür stiline döndü.",
    changes: [
      {
        type: 'duzeltme',
        text: 'Dashboard: .dash-statcard-value !important kaldırıldı — istatistik kart renkleri (gelir/kâr/stok) artık doğru gösterilir',
      },
      {
        type: 'iyilestirme',
        text: 'Settings > Dashboard Düzenleme: widget aç/kapa, sıralama ve parlaklık ayarı eklendi',
      },
      { type: 'iyilestirme', text: 'Sidebar: "P" logo yerine lucide-react Sparkles ikonu kullanıldı' },
      { type: 'iyilestirme', text: 'Header: yedek butonu tekrar info renginde görünür hale getirildi' },
    ],
  },
  {
    version: '3.10.4',
    date: '31 Mayıs 2026',
    title: 'Login Ekranı Modernizasyonu + exceljs → xlsx Geçişi',
    summary:
      'Login ekranı lucide-react ikonlara geçirildi, demo hesapla tek tıkla giriş butonu eklendi. exceljs kaldırıldı, yerine xlsx (SheetJS) kullanılıyor — güvenlik açıkları çözüldü, bundle küçüldü.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'LoginScreen: emoji ikonlar lucide-react bileşenlerle değiştirildi (User, Lock, Eye, LogIn, Sparkles vb.)',
      },
      {
        type: 'yeni',
        text: 'LoginScreen: "Demo Hesap ile Hızlı Giriş" butonu eklendi — tek tıkla demo29605 oturumu açar',
      },
      {
        type: 'iyilestirme',
        text: 'LoginScreen: mobil responsive düzen (küçük ekran padding/font-size iyileştirmesi)',
      },
      { type: 'iyilestirme', text: 'LoginScreen: Firebase bağlanırken skeleton loading gösterimi' },
      {
        type: 'iyilestirme',
        text: 'appConfig: APP_NAME/APP_SUBTITLE/APP_DEFAULT_VERSION → centralized brand config (src/config/brand.ts)',
      },
      {
        type: 'kaldirildi',
        text: 'exceljs bağımlılığı kaldırıldı (3.10.0) — güvenlik açıkları ve bakım sorunları nedeniyle',
      },
      {
        type: 'iyilestirme',
        text: 'safeXlsx.ts: exceljs API → xlsx (SheetJS) API dönüşümü — readSafeWorkbook, downloadObjectSheetsAsXlsx, downloadAoASheetsAsXlsx yeniden yazıldı',
      },
      { type: 'iyilestirme', text: 'xlsx@0.18.5 eklendi — daha hafif, bakımı aktif (exceljs 1MB → xlsx 424KB)' },
      {
        type: 'iyilestirme',
        text: 'vite.config.ts: exceljs referansları temizlendi (commonjsOptions.ignore, optimizeDeps.include)',
      },
      {
        type: 'duzeltme',
        text: 'pnpm audit güvenlik açıkları çözüldü (tmp path traversal) — exceljs kalktığı için otomatik kapandı',
      },
      { type: 'kaldirildi', text: 'package.json pnpm.overrides (tmp>=0.2.6) kaldırıldı — artık gerek yok' },
    ],
  },
  {
    version: '3.10.3',
    date: '30 Mayıs 2026',
    title: 'Marka Birliği + UI/UX Tutarlılık Geçişi',
    summary:
      'Brand adı, sürüm kaynağı, tarih/para lokalizasyonu ve temel dashboard/header/sidebar deneyimi tekilleştirildi. Production görünüm için toast ve düzenleme kontrolleri sadeleştirildi.',
    changes: [
      { type: 'duzeltme', text: 'Tek brand adı PARSPEL olarak login, sidebar ve toast yüzeylerinde birleştirildi' },
      { type: 'duzeltme', text: 'Sürüm bilgisi Vite define üzerinden package.json ile senkron hale getirildi' },
      { type: 'iyilestirme', text: 'Tarih ve para gösterimleri ortak formatter yardımcılarına taşındı' },
      {
        type: 'iyilestirme',
        text: 'Dashboard düzenleme kontrolleri görünümden ayrılarak production görünümü sadeleştirildi',
      },
    ],
  },
  {
    version: '3.10.2',
    date: '30 Mayıs 2026',
    title: 'Build Fix — Spec Modülü Node.js/Browser Ayrıştırması',
    summary:
      "Spec rule dosyaları (component-rules, data-rules, error-rules, navigation-rules, test-rules) browser build'de node:fs/node:path import hatası veriyordu. Browser-safe index.ts ve Node.js runner.ts olarak ikiye ayrıldı. CI quality-gate (lint → typecheck → test → build) artık başarıyla geçiyor.",
    changes: [
      {
        type: 'iyilestirme',
        text: "src/lib/specs/: browser-safe index.ts ve Node.js runner.ts olarak ayrıldı — build'de node:fs external hatası giderildi",
      },
      { type: 'duzeltme', text: 'SpecDashboard: SpecCard ruleCount → count prop adı düzeltildi (TS hatası)' },
    ],
  },
  {
    version: '3.10.1',
    date: '30 Mayıs 2026',
    title: "Tema/Contrast Düzeltmeleri — Hardcoded Renkler CSS Variable'a Dönüştürüldü",
    summary:
      '30+ sayfada hardcoded renkler CSS variable referanslarına dönüştürüldü. AI Asistan, Dashboard, Kasa, Stock, Products, Sales, Reports, Fatura ve 20+ sayfada kontrast sorunları giderildi. Light/dark tema geçişlerinde okunamayan yazı sorunu çözüldü.',
    changes: [
      { type: 'iyilestirme', text: 'AIAsistan: mesaj metin/sourceLabel/onay kartı renkleri hardcoded → CSS variable' },
      {
        type: 'iyilestirme',
        text: 'DashboardOperasyon/Ticaret: sabit dark/light renk sabitleri → var(--text-primary)/var(--bg-card)',
      },
      {
        type: 'iyilestirme',
        text: '18 sayfada #f1f5f9, #e2e8f0 text rengi → var(--text-primary) (Sales, Reports, Fatura, Bank, Stock, Products, Kasa, Cizelge, Suppliers, Pelet, Partners, Notlar, Monitor, ConsoleKayit, Cari, Butce, ExcelImport, BugHunter, Perf, Entegrasyonlar)',
      },
      {
        type: 'iyilestirme',
        text: 'Kasa/Stock/Products/Pelet: #1e293b arkaplan → var(--bg-card), #334155 border → var(--border)',
      },
      {
        type: 'iyilestirme',
        text: '#94a3b8 → var(--text-dim), #64748b → var(--text-muted), #475569 → var(--text-secondary) toplu dönüşüm',
      },
      { type: 'iyilestirme', text: 'Settings: #fff arkaplanlar → var(--bg-elevated) (dark mod uyumu)' },
      { type: 'iyilestirme', text: "Dashboard grafik: chart label/axis/dot renkleri CSS variable'a dönüştürüldü" },
      {
        type: 'iyilestirme',
        text: "AIAsistan: Markdown başlık/sourceLabel renkleri CSS variable'a dönüştürüldü (#ff7043→var(--accent))",
      },
      {
        type: 'kaldirildi',
        text: 'Settings/Arayüz: Özel Renk Seçimi (accent/bgBase renk seçici) kaldırıldı — sadece temalar kaldı',
      },
    ],
  },
  {
    version: '3.10.0',
    date: '30 Mayıs 2026',
    title: 'Konsol Kaydedici + Lint/TypeScript Temizliği',
    summary:
      'DevTools konsol çıktılarını otomatik kaydeden sistem, 13 lint hatası + 48 uyarı sıfırlandı, ESLint konfigürasyonu iyileştirildi.',
    changes: [
      {
        type: 'yeni',
        text: "Konsol Kaydedici (consoleRecorder) — tüm console.log/warn/error/info/debug çağrılarını localStorage'a kaydeder, canlı abonelik, dışa aktarım",
      },
      {
        type: 'yeni',
        text: 'ConsoleKayit sayfası — kayıtlı konsol çıktılarını canlı izleme, seviye/metin filtresi, detay paneli, JSON export',
      },
      {
        type: 'yeni',
        text: 'Unified Version Sistemi (src/lib/version.ts) — getAppVersion(), isVersionGte(), getVersionInfo() ile tüm sayfalarda tek versiyon kaynağı',
      },
      {
        type: 'duzeltme',
        text: 'QuantumLink.tsx: 6 adet any tip kaldırıldı, SpeechRecognition interface eklendi, processCommand useCallback ile sarıldı',
      },
      {
        type: 'duzeltme',
        text: "Fatura.tsx: 3 adet any type cast proper union type'a çevrildi (filter, payment, status)",
      },
      {
        type: 'duzeltme',
        text: 'Settings.tsx: @ts-ignore → @ts-expect-error, kullanılmayan import/değişkenler temizlendi',
      },
      {
        type: 'duzeltme',
        text: '20+ dosyada kullanılmayan değişken/import temizliği, eksik hook dependency düzeltmeleri',
      },
      { type: 'duzeltme', text: 'package.json, appConfig.ts, changelog.ts versiyonları senkronize edildi' },
      {
        type: 'yeni',
        text: 'Versiyon tutarlılık testi (version-consistency.test.ts) — 5 test: package.json ↔ changelog ↔ APP_DEFAULT_VERSION ↔ sıralama',
      },
      { type: 'iyilestirme', text: 'AGENTS.md dosyalarına versiyon sistemi kuralları eklendi' },
      {
        type: 'yeni',
        text: 'docs/TEST_STRATEJISI.md — test piramidi, patternler, CI entegrasyonu, coverage hedefleri',
      },
      {
        type: 'yeni',
        text: 'docs/VERI_KATMANI.md — depolama hiyerarşisi, save pipeline, Firebase sync, backup stratejisi',
      },
      {
        type: 'yeni',
        text: 'docs/HATA_DURUMLARI.md — loading/empty/error state standardı, toast/ErrorBoundary kuralları',
      },
      {
        type: 'yeni',
        text: 'docs/BILESEN_MIMARISI.md — bileşen türleri, stil/import kuralları, state kaldırma patterni',
      },
      { type: 'yeni', text: 'docs/NAVIGASYON.md — route yapısı, tab sistemi, lazy loading, route ekleme prosedürü' },
      { type: 'iyilestirme', text: 'docs/README.md — yeni spec listesi ve geliştirici başlangıç sırası eklendi' },
      {
        type: 'yeni',
        text: 'src/lib/specs/ — dinamik spec rule engine (types, component, error, nav, data, test rules)',
      },
      { type: 'yeni', text: 'src/__tests__/spec-compliance.test.ts — 13 spec kuralı için otomatik compliance testi' },
      { type: 'yeni', text: 'src/pages/SpecDashboard.tsx — canlı spec durumu sayfası (Sistem > Spec)' },
      {
        type: 'iyilestirme',
        text: 'package.json — test:specs scripti eklendi (vitest run .../spec-compliance.test.ts)',
      },
      { type: 'duzeltme', text: 'spec compliance — __tests__ relative importları @/ alias ile değiştirildi' },
      {
        type: 'duzeltme',
        text: "spec compliance — shadcn/ui büyük dosyaları allowlist'e eklendi (sidebar, chart, carousel vb.)",
      },
      {
        type: 'duzeltme',
        text: "spec compliance — localStorage kuralları daraltıldı (sadece sobaYonetim key'ini denetler)",
      },
      {
        type: 'duzeltme',
        text: 'spec compliance — inline-style, empty-import, toast-pattern info seviyesine düşürüldü',
      },
      { type: 'duzeltme', text: 'spec compliance — compliance testi info/warn/error katmanlı hale getirildi' },
      {
        type: 'iyilestirme',
        text: "eslint.config.js: varsIgnorePattern eklendi, react-refresh ui/* ve shared component'lerde kapatıldı",
      },
      { type: 'iyilestirme', text: 'tabs.ts: boş catch bloğuna void 0 eklendi (no-empty)' },
    ],
  },
  {
    version: '3.9.0',
    date: '29 Mayıs 2026',
    title: 'Güvenlik Düzeltmeleri + QuantumLink Yeniden Tasarımı',
    summary:
      'XSS koruması (DOMPurify), CSP meta tag, document.write kaldırma, QuantumLink teması seçilebilir hale getirildi.',
    changes: [
      {
        type: 'yeni',
        text: 'DOMPurify entegrasyonu — dangerouslySetInnerHTML önüne sanitization eklendi (AIAsistan, excelmerge/ai-asistan)',
      },
      {
        type: 'yeni',
        text: 'CSP (Content-Security-Policy) meta tag eklendi — script-src, style-src, connect-src tanımlı',
      },
      {
        type: 'yeni',
        text: "QuantumLink tema paletleri: 3 seçenek (Mavi, Amber, Yeşil) — localStorage'a kaydediliyor",
      },
      {
        type: 'iyilestirme',
        text: 'Fatura.tsx document.write() → DOMPurify.sanitize + esc() ile güvenli HTML oluşturma',
      },
      {
        type: 'iyilestirme',
        text: 'Kasa.tsx document.write() → DOMPurify.sanitize + esc() ile güvenli HTML oluşturma',
      },
      { type: 'iyilestirme', text: 'QuantumLink trigger butonu tema rengiyle uyumlu gradient kullanıyor' },
      { type: 'iyilestirme', text: 'QuantumLink mesaj balonları tema rengiyle uyumlu' },
      { type: 'duzeltme', text: "QuantumLink input butonu sabit beyaz yerine tema gradient'i kullanıyor" },
      {
        type: 'duzeltme',
        text: 'UTF-8 encoding: AIAsistan/Cari/BugHunter sayfalarında U+FFFD bozuk karakterler düzeltildi',
      },
      { type: 'duzeltme', text: 'UTF-8 BOM kaldırıldı (Fatura, Cari, BugHunter TSX + 2 CSS dosyası)' },
      { type: 'duzeltme', text: 'Tüm .ts/.tsx dosyaları CRLF → LF normalize edildi (172 dosya)' },
      { type: 'duzeltme', text: 'TypeScript derleme hataları giderildi (Stock/Kasa/DashboardFinans/types/index)' },
      { type: 'iyilestirme', text: '.gitattributes eklendi — LF + UTF-8 working-tree-encoding zorlaması' },
      { type: 'iyilestirme', text: 'PowerShell UTF-8 code page (65001) yapılandırması — Türkçe karakter görüntüleme' },
    ],
  },
  {
    version: '3.8.0',
    date: '29 Mayıs 2026',
    title: 'Doküman Temizliği + Geliştirici Deneyimi',
    summary:
      'Tüm MD dosyaları yeniden yapılandırıldı, 12 yeni geliştirici aracı eklendi, duplicate dosyalar temizlendi.',
    changes: [
      { type: 'yeni', text: '.editorconfig — editörler arası tutarlı kodlama standardı' },
      { type: 'yeni', text: '.prettierrc + .prettierignore — proje seviyesinde Prettier konfigürasyonu' },
      { type: 'yeni', text: '.nvmrc — Node 22 sürüm sabitleme' },
      { type: 'yeni', text: 'LICENSE (MIT) — resmi lisans dosyası' },
      { type: 'yeni', text: 'CONTRIBUTING.md — katkı rehberi, branş modeli, commit kuralları' },
      { type: 'yeni', text: "DEVELOPMENT.md — teknik geliştirme rehberi, mimari, pattern'ler" },
      { type: 'yeni', text: "CHANGELOG.md — root'da GitHub Releases için standart changelog" },
      { type: 'yeni', text: '.github/ISSUE_TEMPLATE — hata bildirimi ve özellik önerisi şablonları' },
      { type: 'yeni', text: '.github/PULL_REQUEST_TEMPLATE.md — PR checklist' },
      { type: 'yeni', text: 'docs/README.md — doküman indeksi' },
      { type: 'yeni', text: 'WEEKLY_PLAN.md — 6 haftalık iyileştirme planı' },
      { type: 'iyilestirme', text: "quality-gate.yml — CI pipeline'a lint adımını eklendi" },
      { type: 'iyilestirme', text: 'package.json — engines alanı, prettier devDep, format scriptleri' },
      {
        type: 'iyilestirme',
        text: 'SYSTEM_CONTEXT.md 5 parçaya bölündü (docs/VERI_MODELI, KULLANICI_SENARYOLARI, API_SERVIS, AGENT_SISTEMI, UI_UX)',
      },
      { type: 'iyilestirme', text: 'FIGMA-README + FIGMA-SETUP-GUIDE tek docs/FIGMA.md dosyasında birleştirildi' },
      { type: 'iyilestirme', text: 'AGENTS.md dosyaları güncellendi (doğru sayfa/bileşen/hook sayıları)' },
      { type: 'iyilestirme', text: 'README.md referans tablosu güncellendi' },
      { type: 'kaldirildi', text: 'Untitled-1.md silindi (4 kez tekrarlanmış duplicate rapor)' },
      { type: 'kaldirildi', text: 'Teknik Analiz ve İyileştir.md silindi (duplicate)' },
      {
        type: 'iyilestirme',
        text: 'Root temizliği: 5 çöp dosyası silindi (Yeni Metin Belgesi, PROJECT_ANALYSIS_SUMMARY, console-logs)',
      },
      { type: 'iyilestirme', text: 'scripts/ temizliği: 14 eski script ve 4 PNG silindi, kalan 7 script korundu' },
      { type: 'iyilestirme', text: '.gitignore genişletildi: console-logs.txt, *.png, .kiro/, .sixth/ eklendi' },
      { type: 'iyilestirme', text: "PARSPEL_MASTER_PROJE_DOKUMANI.txt ve figma.json → docs/'e taşındı" },
      { type: 'iyilestirme', text: "__audit_login.mjs → scripts/'e taşındı" },
      { type: 'kaldirildi', text: 'figma.config.ts silindi (ölü kod — @figma/code-connect kurulu değil)' },
      { type: 'duzeltme', text: '.npmrc içeriği eklendi (shamefully-hoist, strict-peer-dependencies)' },
      { type: 'duzeltme', text: 'opencode.json versiyonu 3.2.0 → 3.8.0 olarak güncellendi' },
    ],
  },
  {
    version: '3.7.0',
    date: '28 Mayıs 2026',
    title: 'Premium Tema Sistemi + CSS Tokenizasyonu',
    summary:
      '3 premium tema (Corporate Enterprise, Modern Dark, Elegant Light), CSS variable token sistemi, layout bileşen ayrıştırması, tüm dashboard ve settings sayfalarında hardcoded renkler CSS var ile değiştirildi.',
    changes: [
      {
        type: 'yeni',
        text: 'Premium tema sistemi: 3 tema (Corporate Enterprise, Modern Dark, Elegant Light), runtime switching, localStorage persistence',
      },
      {
        type: 'yeni',
        text: 'ThemeProvider + useTheme hook — React context ile tema yönetimi, geriye uyumlu sobaUI:updated event dinleme',
      },
      {
        type: 'yeni',
        text: 'CSS variable token sistemi (OKLCH): 40+ premium değişken (gölgeler, glassmorphism, gradient, easing, renk skalası 50-900)',
      },
      {
        type: 'iyilestirme',
        text: 'App.tsx 1613→600 satıra düşürüldü: 7 layout bileşeni ayrıldı (Sidebar, Header, GlobalSearch, UserMenu, ReportButton, FAB, AIDrawer)',
      },
      {
        type: 'iyilestirme',
        text: "Tab konfigürasyonu src/config/tabs.ts'e taşındı — tüm layout bileşenleri ortak kullanıyor",
      },
      {
        type: 'iyilestirme',
        text: 'Dashboard (5 sayfa): 200+ hardcoded hex/rgba renk CSS variable referanslarına dönüştürüldü',
      },
      { type: 'iyilestirme', text: "Settings.tsx: 150+ inline style rengi CSS variable'a dönüştürüldü" },
      { type: 'iyilestirme', text: 'SystemMap: tüm düğüm/kenar renkleri CSS variable tokenlarına dönüştürüldü' },
      { type: 'iyilestirme', text: 'Products.tsx: derleme hatası giderildi (çift state tanımı, eksik filter)' },
      { type: 'duzeltme', text: 'index.css: premium tema değişkenleri, spacing ve tipografi skalası eklendi' },
    ],
  },
  {
    version: '3.6.0',
    date: '26 Mayıs 2026',
    title: 'Faz 2 Öncelik 4 + Faz 3 Performans',
    summary: 'Tedarikçi performans skoru, rapor oluşturucu, arama debounce, suppliers performans metriği.',
    changes: [
      {
        type: 'yeni',
        text: 'Suppliers performans skoru: teslimat süresi, sipariş adedi ve toplam tutara göre ağırlıklı puan, renk kodlu gösterge',
      },
      {
        type: 'yeni',
        text: 'Raporlar özel rapor oluşturucu: stok/cari/kasa/satış modül seçimi, tablo/grafik görünümü, Excel çıktısı',
      },
      {
        type: 'iyilestirme',
        text: 'Arama inputları debounce: Products/Cari/Suppliers sayfalarında 200ms gecikmeli arama, anlık filtre yerine performanslı filtreleme',
      },
    ],
  },
  {
    version: '3.5.0',
    date: '26 Mayıs 2026',
    title: 'Faz 2 Öncelik 3 — İşlevsel İyileştirmeler',
    summary:
      'Toplu fiyat güncelleme, anlık kâr göstergesi, PDF fatura, müşteri segmentasyonu, CSV banka yükleme+AI eşleme, pelet tüketim sayacı, kural editörü iyileştirmeleri, bütçe kopyalama ve not bağlama.',
    changes: [
      { type: 'yeni', text: 'Products toplu fiyat güncelleme: % zam/indirim, kategori filtre, önizleme tablosu' },
      {
        type: 'yeni',
        text: 'Sales anlık kâr göstergesi: her ürün satırında (birimFiyat - maliyet) × miktar, toplam kâr/maliyet oranı',
      },
      {
        type: 'yeni',
        text: 'Fatura PDF yazdırma: şirket bilgileri, VKN, kalem detayları, KDV dökümü ile yeni pencere PDF çıktısı',
      },
      {
        type: 'yeni',
        text: 'Cari müşteri segmentasyonu: VIP (>50K bakiye), Normal, Riskli (<-10K) badge ve renk kodları',
      },
      {
        type: 'yeni',
        text: 'Banka CSV yükleme: otomatik sütun algılama (tarih/açıklama/tutar/tür), toplu işlem ekleme',
      },
      { type: 'yeni', text: 'Banka AI eşleme: cari adı ve kelime kesişimi ile otomatik eşleştirme motoru' },
      { type: 'yeni', text: 'Pelet tüketim sayacı: günlük/aylık kg tüketim, çuval stoğu, kalan gün tahmini' },
      {
        type: 'iyilestirme',
        text: 'Monitor kural editörü: stok_min/alacak/borç eşik değerleri, popup ve aktif toggle eklendi',
      },
      { type: 'yeni', text: 'Butce bütçe kopyalama: mevcut kategorileri yeni yıla kopyalama' },
      { type: 'yeni', text: 'Notlar not bağlama: cari/ürün/satış bağlantısı seçici, bağlı entity görüntüleme' },
    ],
  },
  {
    version: '3.4.0',
    date: '26 Mayıs 2026',
    title: 'Faz 2 Öncelik 1+2 — Kritik İşlevler & Dashboard İyileştirmeleri',
    summary:
      'Kasa gün sonu sayım, çizelge 7 gün paneli, stok ABC analizi+ölü stok, sağlık skoru gauge, alacak yaşlandırma, ısı haritası, kritiklik widget ve sezonsallık grafiği eklendi.',
    changes: [
      {
        type: 'yeni',
        text: 'Kasa gün sonu sayım formu: fiziki/sistem bakiye karşılaştırması, renk kodlu fark göstergesi, PDF yazdırma',
      },
      {
        type: 'yeni',
        text: 'Çizelge yaklaşan 7 gün paneli: fatura vade, sipariş teslim, alacak tahsilat takvimi renk kodlu',
      },
      { type: 'yeni', text: 'Stok ABC analizi: A=%80, B=%15, C=%5 segmentasyonu, kümülatif ciro grafiği' },
      { type: 'yeni', text: 'Stok ölü stok tespiti: 90+ gün hareketsiz ürünler, bağlı sermaye hesaplaması' },
      { type: 'yeni', text: 'Anomali sağlık skoru gauge: PieChart ile yarım çember gösterge, 30 günlük trend grafiği' },
      {
        type: 'yeni',
        text: 'DashboardFinans alacak yaşlandırma: 0-30/31-60/61-90/90+ gün renk kodlu kartlar ve müşteri detay tablosu',
      },
      { type: 'yeni', text: 'DashboardTicaret ısı haritası: saat×gün satış yoğunluğu grid görseli' },
      {
        type: 'yeni',
        text: 'DashboardOperasyon bugün sipariş listesi: aciliyet skoruna göre sıralı yeniden sipariş önerileri',
      },
      {
        type: 'yeni',
        text: 'DashboardStrateji sezonsallık analizi: 12 aylık ortalama+mevsim katsayısı, 3 aylık nakit akışı tahmini',
      },
    ],
  },
  {
    version: '3.3.0',
    date: '26 Mayıs 2026',
    title: 'Faz 1 Yeni Detay Sayfaları',
    summary: 'Ürün, satış, cari, ortak emanet ve AI aksiyon günlüğü için Faz 1 kapsamındaki yeni UI sayfaları eklendi.',
    changes: [
      {
        type: 'yeni',
        text: '/urunler/:id ürün detay sayfası eklendi: stok hareketleri, satış kâr analizi ve minimum stok eşiği yönetimi',
      },
      {
        type: 'yeni',
        text: '/satis/:id satış detay sayfası eklendi: bağlı ürünler, kasa, fatura, stok ve denetim izi görünümü',
      },
      {
        type: 'yeni',
        text: '/cari/:id cari ekstre sayfası eklendi: kronolojik işlem dökümü, bakiye trendi ve gecikmiş taksit uyarıları',
      },
      {
        type: 'yeni',
        text: '/ortak-emanet sayfası eklendi: emanet/iade kayıtları kasa ve ortak cari bakiyesiyle birlikte işlenir',
      },
      {
        type: 'yeni',
        text: '/ai/eylem-log sayfası ve aiActionLog kaydı eklendi: AI aksiyonları, risk etiketi ve geri alma akışı izlenir',
      },
    ],
  },
  {
    version: '3.2.0',
    date: '26 Mayıs 2026',
    title: 'Performans İyileştirmeleri & PWA Aktivasyonu',
    summary:
      "Ana JS bundle'ı %43 küçültüldü (433KB → 245KB). Firebase SDK ayrı chunk'a taşındı. PWA (Service Worker + manifest) aktifleştirildi. Build yapılandırması optimize edildi.",
    changes: [
      {
        type: 'iyilestirme',
        text: "manualChunks: Firebase SDK ayrı chunk'a taşındı (163KB) — ana bundle 433KB'den 245KB'ye düştü (%43 azalma)",
      },
      { type: 'iyilestirme', text: "manualChunks: sonner (toast) ayrı `ui` chunk'ına taşındı (34KB)" },
      {
        type: 'iyilestirme',
        text: 'PWA reactivasyon: Service Worker + manifest + workbox ile 53 asset precache, offline navigasyon desteği',
      },
      {
        type: 'iyilestirme',
        text: 'PWA runtime caching: Google Fonts (CacheFirst, 1 yıl) ve Firebase API (NetworkOnly) eklendi',
      },
      { type: 'iyilestirme', text: 'README.md: "Build & Performans" bölümü eklendi — chunk tablosu ve PWA durumu' },
    ],
  },
  {
    version: '3.1.0',
    date: '21 Mayıs 2026',
    title: 'Kararlı Sürüm Hazırlığı — Android Manifest & İzinler',
    summary:
      "Android manifest eksik izinler tamamlandı, launcher/bildirim ikonları oluşturuldu, Capacitor config production-safe yapıldı, tema renkleri app'e uyarlandı. Versiyon 3.1.0.",
    changes: [
      { type: 'yeni', text: "RECORD_AUDIO, WAKE_LOCK, RECEIVE_BOOT_COMPLETED izinleri AndroidManifest'e eklendi" },
      { type: 'yeni', text: 'Android launcher ikonları — adaptif XML + 5 boyut PNG (API 24+)' },
      { type: 'yeni', text: 'Bildirim ikonu — ic_stat_icon_config_sample.xml (zil silüeti)' },
      { type: 'iyilestirme', text: 'capacitor.config.ts — dev URL temizlendi, cleartext:false, production-safe' },
      { type: 'iyilestirme', text: 'colors.xml / themes.xml — app koyu temasına uyarlandı (#0f172a)' },
      { type: 'iyilestirme', text: 'READ/WRITE_EXTERNAL_STORAGE eklendi (maxSdkVersion=32)' },
      { type: 'iyilestirme', text: 'build.gradle — versionName 3.1.0 (package.json ile senkron)' },
    ],
  },
  {
    version: '3.0.0',
    date: '9 Mayıs 2026',
    title: 'Release v3.0.0',
    summary:
      'Multi-agent orkestrasyonu, IndexedDB snapshot dayanıklılığı ve AI aksiyon fallback akışı eklendi. Canlı sürüm görünürlüğü iyileştirildi.',
    changes: [
      { type: 'yeni', text: 'Multi-agent altyapısı: bus, base agent, registry ve orchestrator eklendi' },
      { type: 'yeni', text: 'Dexie tabanlı IndexedDB snapshot yazma/geri yükleme akışı eklendi' },
      { type: 'iyilestirme', text: 'AI asistan aksiyonlarında fail-soft fallback zinciri uygulandı' },
      { type: 'iyilestirme', text: 'Giriş ekranı sürüm etiketi v3.0.0 olarak görünür hale getirildi' },
      { type: 'duzeltme', text: 'Anomali motorunda strict TypeScript uyumu için tip güvenliği düzeltmeleri yapıldı' },
    ],
  },
  {
    version: '2.9.0',
    date: '4 Mayıs 2026',
    title: 'Quantum Link AI Panel & Kod Kalitesi',
    summary:
      'Quantum Link floating AI paneli eklendi. Android izinleri genişletildi. ESLint kuruldu, 14 kod hatası giderildi. TypeScript tip hataları düzeltildi. Açık temalar kaldırıldı.',
    changes: [
      { type: 'yeni', text: 'Quantum Link — her sayfadan erişilebilir floating AI panel (BrainCircuit ikonu)' },
      { type: 'yeni', text: 'Quantum Link — Türkçe sesli komut (mikrofon) + TTS yanıt' },
      { type: 'yeni', text: 'Quantum Link — kasa/stok/satış/alacak hızlı sorguları (offline)' },
      { type: 'yeni', text: 'useDB analytics useMemo — revenue, profit, margin, growth, topProducts vb.' },
      { type: 'yeni', text: 'ESLint kuruldu — @typescript-eslint + react-hooks kuralları' },
      { type: 'yeni', text: 'requestPushPermission() — Firebase Cloud Messaging izni' },
      { type: 'yeni', text: "CHANGELOG.md — GitHub'da okunabilir işlem geçmişi" },
      {
        type: 'iyilestirme',
        text: 'AndroidManifest.xml — POST_NOTIFICATIONS, RECORD_AUDIO, CAMERA, depolama izinleri eklendi',
      },
      { type: 'iyilestirme', text: 'README.md — tam uygulama haritası, izin tablosu, sürüm geçmişi' },
      {
        type: 'iyilestirme',
        text: 'SoundSettings fonksiyonu SoundSettingsPanel olarak yeniden adlandırıldı (çakışma giderildi)',
      },
      { type: 'iyilestirme', text: 'Toast.tsx emoji regex — misleading character class düzeltildi' },
      { type: 'duzeltme', text: 'useDB.ts — productId undefined olduğunda analytics çökmesi düzeltildi' },
      { type: 'duzeltme', text: 'useDB.ts — Firebase log template literal escape hatası düzeltildi' },
      { type: 'duzeltme', text: 'utils-tr.ts — regex gereksiz escape karakterleri temizlendi' },
      { type: 'duzeltme', text: '6 boş catch {} bloğu — açıklayıcı yorum eklendi (no-empty)' },
      { type: 'duzeltme', text: 'fetchCurrentHash, updateHashInFirebase — kullanılmayan dead code kaldırıldı' },
      {
        type: 'kaldirildi',
        text: 'Açık temalar kaldırıldı (Kartal, Siyah/Ak, Amber, Deniz, Çimen, Güneş, Beton, Kontrast)',
      },
      { type: 'kaldirildi', text: "Ayarlar'dan açık/koyu mod toggle kaldırıldı" },
    ],
  },
  {
    version: '2.0.0',
    date: '14 Nisan 2026',
    title: 'PARSPEL — Yeniden Doğuş',
    summary:
      'Uygulama adı PARSPEL olarak güncellendi. Yedekleme sistemi tamamen yeniden yazıldı. İkon kütüphanesi ve sistem haritası eklendi.',
    changes: [
      { type: 'yeni', text: 'Uygulama adı PARSPEL olarak değiştirildi' },
      { type: 'yeni', text: 'İkon seçici (IconPicker) — emoji, URL ve Lucide desteği' },
      { type: 'yeni', text: 'Sistem haritası — modüller arası ilişki diyagramı' },
      { type: 'yeni', text: 'Sürüm kitapçığı — tüm değişiklik geçmişi' },
      { type: 'yeni', text: 'Tam Geri Yükleme ve Birleştirme modları ayrıldı' },
      { type: 'yeni', text: 'Geri yükleme öncesi otomatik yedek alınıyor' },
      { type: 'yeni', text: 'Yedek limiti (max 20) — eski yedekler otomatik siliniyor' },
      { type: 'yeni', text: 'Referans bütünlüğü onarımı (repairReferentialIntegrity)' },
      { type: 'yeni', text: 'Ad kalite kontrolü — boş/tek haneli/sadece sayı adlar reddediliyor' },
      { type: 'iyilestirme', text: 'SelectiveRestore artık Firebase ile senkronize' },
      { type: 'iyilestirme', text: "Dashboard restore Firebase'e yazıyor" },
      { type: 'duzeltme', text: 'Kasa.tsx (db as any).partners tip güvensizliği giderildi' },
    ],
  },
  {
    version: '1.5.0',
    date: 'Mart 2026',
    title: 'Yedekleme & Veri Güvenliği',
    summary: 'Yedekleme altyapısı güçlendirildi. Veri bütünlüğü kontrolleri eklendi.',
    changes: [
      { type: 'yeni', text: 'Firebase Backup koleksiyonu — versiyonlu yedekler' },
      { type: 'yeni', text: 'Her 10 versiyonda otomatik yedek' },
      { type: 'yeni', text: 'dataIntegrityChecker — localStorage boyut izleme' },
      { type: 'yeni', text: 'stockMovements max 1000 kayıt limiti' },
      { type: 'duzeltme', text: 'Bütçe banka ekstresi tarih kaybı düzeltildi' },
      { type: 'duzeltme', text: 'Fatura taslak→onaylı→taslak cari çift güncelleme düzeltildi' },
    ],
  },
  {
    version: '1.4.0',
    date: 'Şubat 2026',
    title: 'Muhasebe Düzeltmeleri',
    summary: 'Kritik muhasebe hataları giderildi. Cari bakiye hesaplamaları düzeltildi.',
    changes: [
      { type: 'duzeltme', text: 'QuickSaleModal — cari bakiye güncellenmiyordu' },
      { type: 'duzeltme', text: 'QuickSaleModal — stockMovements kaydedilmiyordu' },
      { type: 'duzeltme', text: 'Bank.tsx — silme sırasında cari yanlış geri alınıyordu' },
      { type: 'duzeltme', text: 'Partners — ortak silinirken cari/emanet silinmiyordu' },
      { type: 'duzeltme', text: 'Dashboard — POS kasaları net sermayeye dahil değildi' },
      { type: 'iyilestirme', text: 'calcProfit/calcMarkup/calcMargin ayrı fonksiyonlar' },
    ],
  },
  {
    version: '1.3.0',
    date: 'Ocak 2026',
    title: 'Banka & Bütçe Modülleri',
    summary: 'Banka ekstresi içe aktarma ve bütçe kategorileri eklendi.',
    changes: [
      { type: 'yeni', text: 'Banka ekstresi içe aktarma (CSV/XLSX)' },
      { type: 'yeni', text: 'Bütçe kategorileri ve aylık limit takibi' },
      { type: 'yeni', text: 'Banka işlemi cari eşleştirme' },
      { type: 'yeni', text: 'Alacak yaşlandırma bandı (0-7, 8-30, 31-60, 60+ gün)' },
      { type: 'iyilestirme', text: 'Cari detay modalı — fatura geçmişi eklendi' },
    ],
  },
  {
    version: '1.2.0',
    date: 'Aralık 2025',
    title: 'Fatura & Taksit Sistemi',
    summary: 'Fatura yönetimi ve taksit planı eklendi.',
    changes: [
      { type: 'yeni', text: 'Fatura oluşturma (satış/alış), KDV hesaplama' },
      { type: 'yeni', text: 'Taksit planı — otomatik ödeme takvimi' },
      { type: 'yeni', text: 'Fatura durum geçişleri (taslak→onaylı→ödendi→iptal)' },
      { type: 'yeni', text: 'Fatura yazdırma önizlemesi' },
    ],
  },
  {
    version: '1.1.0',
    date: 'Kasım 2025',
    title: 'Android & PWA Desteği',
    summary: 'Capacitor ile Android APK desteği eklendi.',
    changes: [
      { type: 'yeni', text: 'Capacitor 8 — Android native desteği' },
      { type: 'yeni', text: 'PWA — offline çalışma, ana ekrana ekle' },
      { type: 'yeni', text: "Dosya sistemi — Android'de JSON yedek kaydetme" },
      { type: 'iyilestirme', text: 'Mobil uyumlu arayüz iyileştirmeleri' },
    ],
  },
  {
    version: '1.0.0',
    date: 'Ekim 2025',
    title: 'İlk Sürüm',
    summary: 'Soba Yönetim Sistemi olarak ilk yayın.',
    changes: [
      { type: 'yeni', text: 'Ürün & stok yönetimi' },
      { type: 'yeni', text: 'Satış kayıtları' },
      { type: 'yeni', text: 'Kasa hareketleri (nakit/banka)' },
      { type: 'yeni', text: 'Cari hesaplar (müşteri/tedarikçi)' },
      { type: 'yeni', text: 'Firebase Firestore senkronizasyonu' },
      { type: 'yeni', text: 'localStorage birincil depolama' },
      { type: 'yeni', text: 'Tedarikçi & sipariş yönetimi' },
      { type: 'yeni', text: 'Pelet & boru tedarik modülleri' },
    ],
  },
];

export const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; color: string; bg: string }> = {
  yeni: { label: '✨ Yeni', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  iyilestirme: { label: '⚡ İyileştirme', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  duzeltme: { label: '🔧 Düzeltme', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  kaldirildi: { label: '🗑️ Kaldırıldı', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};
