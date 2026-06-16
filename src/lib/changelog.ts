/**
 * PARSPEL â€” SÃ¼rÃ¼m GeÃ§miÅŸi (Changelog)
 * Her sÃ¼rÃ¼m iÃ§in deÄŸiÅŸiklikler, yeni Ã¶zellikler ve dÃ¼zeltmeler.
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
    version: '3.29.0',
    date: '16 Haziran 2026',
    title: 'Alacak Takip Sayfası + Pre-existing Bug Fix',
    summary: 'Yeni Receivables (Alacak Takip) sayfası eklendi — gecikmiş cari alacakları listeler, detaylı döküm sunar. saleCompletion.ts\'deki C1 refactor artıkları temizlendi (productUpdates, cariUpdate, kalan). CariAgent/KasaAgent AgentResponse tip hatası düzeltildi. ruleEngine.ts prevProductIds ve cariService.ts CariUpdate temizlendi.',
    changes: [
      { type: 'yeni', text: 'Receivables (Alacak Takip) sayfası — gecikmiş cari borçları listeler, arama/ filtreleme ve expandable satır detayı.' },
      { type: 'yeni', text: 'receivableService.getOverdueReceivables — domain servisi, vadesi geçmiş cari satışları hesaplar.' },
      { type: 'yeni', text: 'SaleIntent.dueDays desteği — satışa özel vade günü belirleme.' },
      { type: 'iyilestirme', text: 'Alacak Takip — 4 istatistik kartı (gecikmiş alacak, ortalama gün, müşteri sayısı, cari bakiye).' },
      { type: 'duzeltme', text: 'completeSale: yanlış "status: iade" + missing productUpdates fix\'lendi.' },
      { type: 'duzeltme', text: 'CariAgent / KasaAgent: AgentResponse tipi kaldırıldı (DomainAgent base\'den inherit).' },
      { type: 'duzeltme', text: 'ruleEngine: kullanılmayan prevProductIds temizlendi.' },
      { type: 'duzeltme', text: 'saleCompletion: dead code (cariUpdate, kalan) temizlendi.' },
      { type: 'duzeltme', text: 'cariService: kullanılmayan CariUpdate import\'ı temizlendi.' },
      { type: 'duzeltme', text: 'receivableService: any tip + @ts-ignore temizlendi, totalCariBalance eklendi.' },
      { type: 'duzeltme', text: 'changelog v3.28.0: duplicate summary property birleştirildi.' },
      { type: 'duzeltme', text: 'Login sayfası renkleri: @theme bloğu eklendi — Tailwind v4 utility class\'ları CSS değişkenlerine bağlandı.' },
    ],
  },
  {
    version: '3.28.0',
    date: '15 Haziran 2026',
    title: 'P2 SettingsBackup Modularizasyonu — Tüm Kalan Görevler Tamam',
    summary: 'P2 SettingsBackup Modularizasyonu — 1191→5 modüle bölündü. D1: save/saveGuarded ortak _save helper. E1: saleCompletion.ts cast temizliği. E2: SatisAgent validasyon. F1/F2: SettingsBackup useCallback + className.',
    changes: [
      { type: 'iyilestirme', text: 'D1: save/saveGuarded ortak _save helper\'ına çıkarıldı (useDBActions.ts).' },
      { type: 'duzeltme', text: 'E1: saleCompletion.ts\'deki as unknown as Record<string, unknown> cast\'leri temizlendi, sadece zorunlu olanlarda bırakıldı.' },
      { type: 'iyilestirme', text: 'E2: SatisAgent payload doğrulaması — asString/asNumber/asPaymentType/asSaleItem validasyon fonksiyonları eklendi.' },
      { type: 'iyilestirme', text: 'F1: SettingsBackup event handler\'ları (handleFile, doRestore, reset, toggleSection, selectAll/None) useCallback\'e sarıldı.' },
      { type: 'iyilestirme', text: 'F2: SettingsBackup statik inline style\'lar className\'e taşındı (section list, checkbox, label).' },
    ],
  },
  {
    version: '3.27.0',
    date: '15 Haziran 2026',
    title: 'C4 Agent sadeleştirme — DomainAgent base class',
    summary: '4 domain agent\'ı (Satis, Stok, Kasa, Cari) aynı islemYap pipeline\'ını paylaşan DomainAgent base class\'ı altında birleştirildi. KasaAgent ve CariAgent\'daki save bug\'ı (processIntent çağrılıp sonucun kaydedilmemesi) fix\'lendi.',
    changes: [
      { type: 'iyilestirme', text: 'DomainAgent.ts eklendi: 4 agent ortak islemYap pipeline\'ı tek base class\'ta toplandı.' },
      { type: 'iyilestirme', text: 'SatisAgent.ts: 68→33 satır, islemYap pipeline\'ı DomainAgent\'a taşındı, sadece yetki kontrolü kaldı.' },
      { type: 'iyilestirme', text: 'StokAgent.ts: 61→32 satır, islemYap tamamen kaldırıldı.' },
      { type: 'iyilestirme', text: 'KasaAgent.ts: 42→30 satır, islemYap kaldırıldı, save bug\'ı fix\'lendi.' },
      { type: 'iyilestirme', text: 'CariAgent.ts: 53→43 satır, islemYap kaldırıldı, save bug\'ı fix\'lendi.' },
      { type: 'iyilestirme', text: 'DomainAgent.ts: 40 satır — yeni abstract base class (Stok/Kasa/Cari hiç islemYap, Satis sadece yetki kontrolü).' },
      { type: 'iyilestirme', text: 'StokAgent.test.ts: 2 test güncellendi (DomainAgent null intent → error davranışına).' },
    ],
  },
  {
    version: '3.26.1',
    date: '15 Haziran 2026',
    title: 'Dashboard.tsx küçültme (863→398 satır)',
    summary: 'Dashboard.tsx 863 satırdan 398 satıra indirildi. renderWidget fonksiyonu (tüm widget kasları + chartData/categoryRevenue/recentSales/recentActivity memoları) WidgetRenderer.tsx\'e taşındı. statCards useMemo\'su useStatCards hook\'una çıkarıldı.',
    changes: [
      { type: 'iyilestirme', text: 'Dashboard.tsx: renderWidget (328 satır) + 4 veri memo\'su WidgetRenderer.tsx\'e taşındı.' },
      { type: 'iyilestirme', text: 'Dashboard.tsx: statCards useMemo (72 satır) useStatCards hook\'una çıkarıldı (useStatCards.tsx).' },
      { type: 'kaldirildi', text: 'Dashboard.tsx: recharts, lucide-react, formatDate, Avatar, getCategorySales, WidgetCard, Oneriler import\'ları temizlendi (WidgetRenderer\'a taşındı).' },
    ],
  },
  {
    version: '3.26.0',
    date: '15 Haziran 2026',
    title: 'Test coverage — H10 min_stock, domain service tests, DB coverage',
    summary: 'min_stock kuralı eklendi (severity: warn). completeSale/cancelSale/returnSale/correctSalePrice için 16 domain servis testi. DB katmanı core/backup/sync için coverage artırıldı. Toplam 27 yeni test.',
    changes: [
      { type: 'yeni', text: 'Rule Engine: min_stock kuralı eklendi — stok minStock altına düştüğünde warn ihlali üretir.' },
      { type: 'iyilestirme', text: 'Domain servis testleri: completeSale, cancelSale, returnSale, correctSalePrice için 16 test yazıldı (saleCompletion.test.ts).' },
      { type: 'iyilestirme', text: 'DB coverage: core.test.ts (4 yeni test: save loading, error callback, manualBackup shape, undo empty), backup.test.ts (2 yeni test: fullRestoreDB empty/version), sync.test.ts (3 yeni test: malformed JSON, retry exhaust, conflict).' },
    ],
  },
  {
    version: '3.25.2',
    date: '14 Haziran 2026',
    title: 'CI Cleanup — 10 lint warning, 17 test failure, typecheck fixes',
    summary: 'Tüm lint warningleri, typecheck hataları ve 17 adet test hatası temizlendi. Voice NLP parser\'da action detection word-boundary regex\'e geçirildi, discount detection normalize edildi. Product matcher quantity stripping yeniden yazıldı. Version consistency testleri düzeltildi. Domain servislerde unused parameter prefix\'i eklendi. ReportsCommon.tsx static property pattern\'ine taşındı.',
    changes: [
      { type: 'duzeltme', text: '10 adet lint warning temizlendi: domain servis unused `db` parameter prefix, Dashboard/Reports useMemo dep, ReportsCommon constant static property pattern.' },
      { type: 'duzeltme', text: 'Voice NLP parser action detection: `text.includes()` -> word-boundary regex (`\bkeyword\b`) ile değiştirildi. "satis" keyword kümesinden "yap" kaldırıldı (çok geneldi).' },
      { type: 'duzeltme', text: 'Voice NLP parser discount detection regex normalize edilmiş text\'e uygun hale getirildi (yüzde -> yuzde).' },
      { type: 'duzeltme', text: 'Product matcher `stripQuantityWords`: baştaki sayı+apostrof koruması eklendi ("2 tane 80\'lik soba" -> "80\'lik soba"), birim sözcük eşleştirmesi string başında da çalışıyor ("iki tane klima" -> "klima").' },
      { type: 'duzeltme', text: 'Voice sale executor `executeConfirmedSale` tek argümanlı imzaya geçirildi (test uyumu).' },
      { type: 'duzeltme', text: 'Version consistency testleri: package.json 3.25.1\'e güncellendi, APP_DEFAULT_VERSION eklendi.' },
      { type: 'duzeltme', text: 'Typecheck: cariService/stockService body içinde `db` -> `_db` referans düzeltmesi, ReportsCommon KpiCard CARD -> CARD_OBJ.' },
    ],
  },
  {
    version: '3.25.1',
    date: '14 Haziran 2026',
    title: 'E2E Audit & Kritik Hata Düzeltmeleri — Vite HMR, Dashboard Key, Sidebar Navigasyon',
    summary: '3 kritik hata bulundu ve düzeltildi: (1) Vite HMR WebSocket port çakışması (Bank.tsx lazy import + 20s DOM Complete + responsive crash aynı anda çözüldü), (2) Dashboard React key prop uyarısı (2 motion.div\'e key eklendi), (3) Sidebar navigasyon helper\'ı getByRole+getByText ikili yaklaşımına yükseltildi. E2E helper app.ts iyileştirildi — ensureGroupOpen accessible name tabanlı oldu, openModule 3 yöntemli fallback kazanıyor. 3005 modül build başarılı.',
    changes: [
      { type: 'duzeltme', text: 'Vite HMR WebSocket port çakışması — hmr.port:3001 kaldırıldı. Kök neden: hmr.server wss://127.0.0.1:3001 200 hatası. Bank.tsx lazy import + 20s DOM Complete + responsive crash aynı commit\'te çözüldü.' },
      { type: 'duzeltme', text: 'Dashboard React key prop uyarısı — 2 motion.div\'e key={...} eklendi. warning: Each child in a list should have a unique key prop.' },
      { type: 'iyilestirme', text: 'Sidebar navigasyon helper\'ı (e2e/helpers/app.ts): ensureGroupOpen textContent() yerine accessible name kullanıyor (getByRole + aria-label). openModule getByRole/getByText/etkileşimli element 3 yöntemli fallback.' },
      { type: 'iyilestirme', text: 'MODULE_GROUP eksik modüller eklendi: Pelet, OrtakEmanet, Stok, Notlar, AIEylemLog, Entegrasyon, Performans, Monitör, BugHunter, Anomali, Kontrol.' },
      { type: 'yeni', text: 'E2E comprehensive audit suite (e2e/comprehensive-audit.spec.ts) — 10 kategori, 30+ test. full-audit.cjs Node.js canlı test koşucusu.' },
      { type: 'yeni', text: 'Nihai audit raporu: e2e-report/PARSPEL-FULL-AUDIT-RAPORU.md (kök neden analizi + 15 screenshot).' },
    ],
  },
  {
    version: '3.25.0',
    date: '13 Haziran 2026',
    title: '4 Büyük Sayfa Modülerizasyonu — Parallel Agent ile Toplu Refactor',
    summary: '4 paralel agent ile aynı anda 4 büyük sayfa "Orchestrator + Modules" pattern\'ına taşındı: Suppliers.tsx (1265→5 modül), Monitor.tsx (1147→6 modül), BugHunter.tsx (1092→7 modül), Bank.tsx (1031→8 modül). Toplam 3421 satır monolitik kod temizlendi. Tüm eski dosyalar silindi, lazy import path\'leri bozulmadan çalışıyor.',
    changes: [
      { type: 'iyilestirme', text: 'Suppliers → Suppliers/: 5 modül (index.tsx orkestratör, SupplierList, SupplierForm, SupplierOrder, types). Kategori filtreleme, tedarikçi skoru, sipariş yönetimi.' },
      { type: 'iyilestirme', text: 'Monitor → Monitor/: 6 modül (index.tsx orkestratör, MonitorOverview, MonitorIssues, MonitorRules, MonitorAuditLog, types). Health score, kural yönetimi, denetim log.' },
      { type: 'iyilestirme', text: 'BugHunter → BugHunter/: 7 modül (index.tsx, types, TestRunner, BugStats, BugToolbar, BugResults, BugEmptyState/Result). 8 test kategorisi, 35+ test.' },
      { type: 'iyilestirme', text: 'Bank → Bank/: 8 modül (index.tsx, types, StatCard, BankStats, BankActions, BankFilters, BankTable, BankForm). Havale/EFT yönetimi, cari eşleme.' },
      { type: 'iyilestirme', text: 'Monitor relative import fix: ../pageHelpers → @/pages/pageHelpers (spec-compliance fix).' },
      { type: 'kaldirildi', text: 'Suppliers.tsx (1265 satır), Monitor.tsx (1147 satır), BugHunter.tsx (1092 satır), Bank.tsx (1031 satır) — 4 eski monolitik dosya silindi.' },
    ],
  },
  {
    version: '3.23.5',
    date: '13 Haziran 2026',
    title: 'UI Modernizasyonu Tamamlama — Cari & Products Inline Style Cleanup',
    summary: '3.23.4\'te yarım kalan inline style → Tailwind migrasyonu tamamlandı. Products.tsx modal formları (Ekle/Düzenle + Toplu Fiyat) tamamen Tailwind + shadcn/ui\'ye dönüştürüldü. Cari.tsx\'teki son inline style noktaları (debtColor, bucket renkleri, segment badge) class-based yapıldı.',
    changes: [
      { type: 'iyilestirme', text: 'Products.tsx: Ürün Ekleme/Düzenleme modalı — lbl/inp style sabitleri kaldırıldı, Label/Input/Button shadcn/ui bileşenlerine geçildi.' },
      { type: 'iyilestirme', text: 'Products.tsx: Toplu Fiyat Güncelleme modalı — inline style\'dan Tailwind class\'larına taşındı, Button bileşeni kullanıldı.' },
      { type: 'iyilestirme', text: 'Products.tsx: İstatistik kartları renkleri hex → Tailwind class (text-emerald-500 vb.).' },
      { type: 'iyilestirme', text: 'Products.tsx: Kullanılmayan Chip component kaldırıldı.' },
      { type: 'iyilestirme', text: 'Cari.tsx: debtColor() fonksiyonu hex renk yerine Tailwind class döndürüyor.' },
      { type: 'iyilestirme', text: 'Cari.tsx: Alacak yaşlandırma bucket renkleri ve segment badge (VIP/Normal/Riskli) class-based yapıldı.' },
    ],
  },
  {
    version: '3.23.4',
    date: '13 Haziran 2026',
    title: 'UI Modernizasyonu — Cari & Ürün Sayfaları',
    summary: 'Cari ve Ürün sayfaları Base-Nova standartlarına göre modernize edildi. Tüm inline stiller kaldırılıp Tailwind CSS ve shadcn/ui primitiflerine geçildi. Radius ve renk paleti güncellendi.',
    changes: [
      { type: 'iyilestirme', text: 'Cari.tsx: Base-Nova standartlarına geçiş, alacak yaşlandırma bandı ve cari tablosu modernize edildi.' },
      { type: 'iyilestirme', text: 'Products.tsx: Ürün kartları, kategori filtreleri ve stok uyarıları modernize edildi.' },
      { type: 'iyilestirme', text: 'Tüm inline style\'lar kaldırıldı, Tailwind CSS ve shadcn/ui (Card, Button, Input, Badge, Label) bileşenleri entegre edildi.' },
    ],
  },
  {
    version: '3.23.3',
    date: '13 Haziran 2026',
    title: 'Domain Service Entegrasyonu — Agent islemYap Fix',
    summary: 'Agent islemYap metotları domain service\'lere yönlendirildi. Testler 40/40 pass ediyor.',
    changes: [
      { type: 'duzeltme', text: 'SatisAgent/fiyatDuzelt: applyIntentResult üzerinden kaydediyor, direkt DB yazmıyor.' },
      { type: 'duzeltme', text: 'SatisAgent/iptalEt: cari bakiyesi düzeltiliyor, kasa gider kaydı ekleniyor.' },
      { type: 'duzeltme', text: 'StokAgent/stok_guncelle: processStockUpdate domain service\'ine yönlendirildi.' },
      { type: 'duzeltme', text: 'saleCompletion.ts: iptal ve iade işlemlerine returnedAt alanı eklendi.' },
      { type: 'duzeltme', text: 'applyIntentResult: CashTransaction → KasaEntry dönüşümü (id, createdAt, updatedAt).' },
      { type: 'duzeltme', text: 'domain/types.ts: DBUpdates.cashTransaction tipi CashTransaction[] olarak düzeltildi.' },
      { type: 'duzeltme', text: 'dbHelpers.ts: stock.updated event handler StockMovementV2.type\'yi koruyor.' },
      { type: 'iyilestirme', text: 'SatisAgent.test.ts ve StokAgent.test.ts yeni domain mimarisine güncellendi — 411 test pass.' },
      { type: 'duzeltme', text: 'DEVELOPMENT.md: orchestrator referansı kaldırıldı, PWA asset sayısı 74 olarak düzeltildi.' },
      { type: 'duzeltme', text: 'CHANGELOG.md: eksik sürümler (v3.8→v3.23) eklendi.' },
      { type: 'duzeltme', text: 'README.md: chunk boyutları ve test dizin bilgisi güncellendi.' },
      { type: 'duzeltme', text: 'MASTER_PLAN.md: versiyon v3.23.3 olarak güncellendi.' },
    ],
  },
  {
    version: '3.23.2',
    date: '13 Haziran 2026',
    title: 'Firebase Config — fairbaseweb.json\'dan .env\'e',
    summary: 'Parent dizindeki fairbaseweb.json ve env/.env dosyalarından Firebase config değerleri repo_2/.env\'ye taşındı. Firebase sync artık çalışır durumda.',
    changes: [
      { type: 'iyilestirme', text: 'Firebase API key, authDomain, projectId, storageBucket, messagingSenderId, appId .env\'ye eklendi.' },
      { type: 'iyilestirme', text: 'connConfig.test.ts güncellendi — Firebase env var\'ları dolu olduğunda enabled=true bekler.' },
    ],
  },
  {
    version: '3.23.1',
    date: '13 Haziran 2026',
    title: 'AIAsistan Modülerizasyonu ve Lint/Type Fix',
    summary: 'AIAsistan.tsx monolitik yapısı ChatPanel, MessageList, ActionHistory ve ana index.tsx olarak 4 modüle ayrıldı. `any` tipleri temizlendi, unused `hasDuplicate` kaldırıldı. Import path\'lerde `../` relative kullanımı `@/` alias ile değiştirildi. AgentBus + processIntent geçişi tamamlandı, eski orchestrator.ts kaldırıldı.',
    changes: [
      { type: 'iyilestirme', text: 'AIAsistan.tsx → 4 modüle ayrıldı: ChatPanel, MessageList, ActionHistory, index.tsx (6.2).' },
      { type: 'duzeltme', text: 'tryApiInternal `any` tipleri temizlendi (index.tsx:317,320).' },
      { type: 'duzeltme', text: 'aiActions.ts: unused `hasDuplicate` fonksiyonu kaldırıldı.' },
      { type: 'duzeltme', text: 'Import path fix: AIAsistan alt modüllerinde `../` → `@/` alias kullanıldı.' },
      { type: 'duzeltme', text: 'ChatPanel/MessageList/ActionHistory: gereksiz `import React` kaldırıldı.' },
      { type: 'kaldirildi', text: 'src/agents/orchestrator.ts ve orchestrator.test.ts kaldırıldı (C1).' },
      { type: 'iyilestirme', text: '`dispatchAgentFlow` kaldırıldı, `processIntent` + `applyIntentResult` kullanılıyor.' },
      { type: 'iyilestirme', text: 'Yanlış dosya path\'i düzeltildi: AIAHelpers importları `./ai/AIAHelpers` → `@/pages/ai/AIAHelpers`.' },
    ],
  },
  {
    version: '3.23.0',
    date: '13 Haziran 2026',
    title: 'Veri KatmanÄ± ModÃ¼lerizasyonu â€” useDB & useDBActions Refactor',
    summary: 'useDB monolitik yapÄ±sÄ± parçalanarak useDBQueries, useDBActions, useDBBackup ve useDBSync olarak modÃ¼ler hale getirildi. Veri katmanÄ± daha bakÄ±mlar ve test edilebilir bir yapÄ±ya kavuÅŸtu.',
    changes: [
      { type: 'iyilestirme', text: 'useDB hook\'u modÃ¼ler hale getirildi: useDBQueries, useDBActions, useDBBackup ve useDBSync olarak ayrÄ±lÄ± dÃ¼şÃ¼nÃ¼ldi.' },
      { type: 'iyilestirme', text: 'useDBActions: undo, save, saveGuarded, logActivity ve saveWithLog fonksiyonlarÄ± tek bir hook altÄ±nda toplandÄ±.' },
      { type: 'iyilestirme', text: 'useDBSync: Firebase senkronizasyonu ve IndexedDB snapshot mekanizmasÄ± ayrÄ± bir hook olarak dÃ¼zenlendi.' },
      { type: 'duzeltme', text: 'useDBSync.ts: useEffect cleanup fonksiyonunda syncTimer.current kullanımı dÃ¼zeltildi (ref value warning).' },
    ],
  },
  {
    version: '3.22.0',
    date: '12 Haziran 2026',
    title: 'CSS Module Migration — Dashboard, Fatura, Reports',
    summary: 'Dashboard, Fatura ve Reports modüllerindeki tüm statik inline CSS stilleri .module.css dosyalarına taşındı. Toplam ~162 inline style CSS module class\'larına dönüştürüldü, 69 dinamik style (prop/state bağımlı) olduğu gibi bırakıldı. 16 yeni CSS module dosyası oluşturuldu.',
    changes: [
      { type: 'iyilestirme', text: 'Dashboard: StatCard, Oneriler, WidgetCard modüllerindeki 7 statik inline style CSS module\'a taşındı (Oneriler.module.css, WidgetCard.module.css).' },
      { type: 'iyilestirme', text: 'Fatura: 6 component\'de ~75 statik inline style CSS module\'a taşındı (Fatura.module.css, FaturaPreview.module.css, FaturaForm.module.css, FaturaTable.module.css, FaturaToolbar.module.css, FaturaStats.module.css).' },
      { type: 'iyilestirme', text: 'Reports: 8 component\'de ~80 statik inline style CSS module\'a taşındı (Reports.module.css, ReportsGenerator.module.css, ReportsUrun.module.css, ReportsCari.module.css, ReportsOzet.module.css, ReportsSatis.module.css, ReportsCommon.module.css, ReportsKasa.module.css).' },
      { type: 'iyilestirme', text: 'Toplam 16 yeni .module.css dosyası oluşturuldu, ~162 inline style migrate edildi.' },
    ],
  },
  {
    version: '3.21.5',
    date: '12 Haziran 2026',
    title: 'Raporlar Modülerizasyonu ve Veri Bütünlüğü Fixleri',
    summary: 'Reports.tsx sayfası performans ve bakımlanabilirlik için 6 alt modüle ayrıldı. Firebase senkronizasyonundaki race condition (G4) ve AI satışlarında ödeme yönlendirme hatası (G5) giderildi.',
    changes: [
      { type: 'iyilestirme', text: 'Reports.tsx monolitik yapıdan çıkarılıp ReportsOzet, ReportsSatis, ReportsUrun, ReportsCari, ReportsKasa ve ReportsGenerator modüllerine bölündü.' },
      { type: 'duzeltme', text: 'src/hooks/db/dbHelpers.ts içinde scheduleFirebaseSave ile Firebase kayıtları ardışık hale getirildi (G4).' },
      { type: 'duzeltme', text: 'src/lib/aiActions.ts içinde satış ödemeleri nakit/banka ayrımı düzeltildi (G5).' },
    ],
  },
  {
    version: '3.21.4',
    date: '11 Haziran 2026',
    title: 'Quantum Link Sessiz Hata Düzeltmesi',
    summary: 'Quantum Link\'te dispatchAgentFlow üzerinden yapılan işlemlerde dönüş değerleri kontrol edilmiyor, hatalar sessizce yutuluyor ve cari tahsilat payload\'u yanlış gönderiliyordu. Agent çağrıları doğrudan getAgent() ile yapılacak şekilde yeniden yazıldı, dönüş değerleri kontrol ediliyor ve hatalar kullanıcıya gösteriliyor.',
    changes: [
      { type: 'duzeltme', text: 'Quantum Link: dispatchAgentFlow (deprecated) yerine doğrudan getAgent().islemYap() kullanıldı — agent yanıtları kontrol ediliyor.' },
      { type: 'duzeltme', text: 'Quantum Link: cari tahsilat işleminde cariName yerine cariId gönderiliyordu — db\'den isimle eşleşen cari bulunarak düzeltildi.' },
      { type: 'duzeltme', text: 'Quantum Link: satış komutu items dizisi olmadan gönderiliyor, sessizce başarısız oluyordu — kasa_gelir olarak kaydedilecek şekilde değiştirildi.' },
      { type: 'iyilestirme', text: 'Quantum Link: tüm işlem sonuçları kullanıcıya net başarı/başarısızlık mesajı olarak dönülüyor.' },
    ],
  },
  {
    version: '3.21.3',
    date: '11 Haziran 2026',
    title: 'Baseline Onarımı ve Veri Katmanı İyileştirmeleri',
    summary: 'Projenin baseline (lint, typecheck, test, build) hataları giderildi. useDB hook\'una saveGuarded fonksiyonu eklenerek kritik işlemler için uyarı mekanizması bypass edebilme imkanı sağlandı.',
    changes: [
      { type: 'duzeltme', text: 'Sistem genelindeki lint ve TypeScript hataları giderildi (Voice API tipleri, duplicate exportlar, unused vars).' },
      { type: 'yeni', text: 'useDB hook\'una saveGuarded eklendi — warn seviyesindeki kural ihlallerini atlayarak işlem yapılması sağlandı.' },
      { type: 'duzeltme', text: 'core.test.ts mock güncellendi — getUserSession export\'u eklendi, işlenmemiş hatalar giderildi.' },
    ],
  },
  {
    version: '3.21.2',
    date: '11 Haziran 2026',
    title: 'Proje Temizliği & Dosya Organizasyonu',
    summary:
      'Gereksiz generated dosyalar silindi ve .gitignore güncellendi. Proje dökümanı .txt formatından .md formatına taşındı. Çalışma dizini gereksiz audit/screenshot kalıntılarından arındırıldı.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'Temizlik: screenshots/report.json, audit-snapshot-1.md ve .fallow/ önbelleği silindi',
      },
      {
        type: 'iyilestirme',
        text: 'Dökümantasyon: PARSPEL_MASTER_PROJE_DOKUMANI.txt → .md formatına dönüştürüldü',
      },
      {
        type: 'iyilestirme',
        text: '.gitignore: generated dosyalar, screenshots/ ve .fallow/ klasörleri dışlandığı belirtildi',
      },
    ],
  },
  {
    version: '3.21.1',
    date: '11 Haziran 2026',
    title: 'Demo Login Fix & Deployment CSS Düzeltmesi',
    summary:
      'Demo kullanıcı girişi düzeltildi: "Hızlı Giriş" butonu veritabanı boş olsa bile demo29605/demo1234 ile giriş yapabiliyor. Vite base path "./" → "/" olarak değiştirildi, böylece Vercel deploy\'da CSS asset\'lerinin yüklenmeme sorunu giderildi.',
    changes: [
      {
        type: 'duzeltme',
        text: 'Demo Login: "Hızlı Giriş" butonu boş veritabanında kayıt sayfasına yönlendiriyordu — demo kullanıcı artık her durumda giriş yapabilir.',
      },
      {
        type: 'duzeltme',
        text: 'CSS/Deployment: Vite base path "./" → "/" değiştirildi, Vercel\'de CSS asset\'lerinin doğru yüklenmesi sağlandı.',
      },
    ],
  },
  {
    version: '3.21.0',
    date: '11 Haziran 2026',
    title: 'CSS Module Migration, Fatura/AIA Helpers Refactor, Storybook & Audit Altyapısı',
    summary:
      `Kapsamlı refactor ve altyapı oturumu: Inline CSS'ler CSS Module'lere taşındı (Bank, Butce, Monitor, Notlar, Products, Sales, Stock, Suppliers — 8 sayfa). FaturaHelpers ve AIAHelpers'deki utility fonksiyonlar ayrı utils dosyalarına çıkarıldı. Storybook kurulumu yapıldı (.storybook/main.ts, preview.ts ve örnek stories). parspel-audit skill v2.0.0'a güncellendi (deterministik execution, strict tool pipeline, loop-safe). Vite config Storybook/Playwright için genişletildi. Seed data (src/lib/seedData.ts) eklendi. Audit helper script'leri yazıldı (hash-audit, lighthouse-mcp, storybook-mcp). Git branch'leri temizlendi: dev fast-forward ile güncellendi, feat/my-feature ve feat/session-3 silindi.`,
    changes: [
      {
        type: 'iyilestirme',
        text: 'CSS Module migration: Bank, Butce, Monitor, Notlar, Products, Sales, Stock, Suppliers sayfaları inline CSS → CSS Module',
      },
      {
        type: 'iyilestirme',
        text: 'FaturaHelpers.tsx: utility fonksiyonlar (createInstallmentPlan, emptyItem, nextInvoiceNo, statusColors, vb.) FaturaHelpers.utils.ts dosyasına çıkarıldı',
      },
      {
        type: 'iyilestirme',
        text: 'AIAHelpers.tsx: utility fonksiyonlar AIAHelpers.utils.ts dosyasına çıkarıldı',
      },
      {
        type: 'yeni',
        text: 'Storybook kurulumu: .storybook/main.ts, .storybook/preview.ts, src/stories/Button.stories.tsx',
      },
      {
        type: 'yeni',
        text: 'parspel-audit skill v2.0.0: deterministik execution, strict tool pipeline, mandatory stop condition, loop-safe',
      },
      {
        type: 'yeni',
        text: 'Seed data: src/lib/seedData.ts — test ve demo verisi',
      },
      {
        type: 'yeni',
        text: 'Audit helper script\'leri: scripts/hash-audit.mjs, scripts/lighthouse-mcp.mjs, scripts/storybook-mcp.mjs',
      },
      {
        type: 'iyilestirme',
        text: 'Vite config: Storybook ve Playwright entegrasyonu için genişletildi',
      },
      {
        type: 'iyilestirme',
        text: 'opencode.json: audit-state tracking, memory paths, yeni skill referansları güncellendi',
      },
      {
        type: 'iyilestirme',
        text: 'Git branch cleanup: dev fast-forward (0eb729f → 242b1c6), feat/my-feature ve feat/session-3 silindi',
      },
    ],
  },
  {
    version: '3.20.1',
    date: '11 Haziran 2026',
    title: 'GitHub Pages deploy.yml Kaldırıldı',
    summary:
      'Kullanılmayan GitHub Pages deployment workflow\'u silindi. deploy.yml sadece main branch\'ini dinliyordu ancak proje sadece dev kullanıyor — hiç tetiklenmemişti. Deployment işlemleri zaten Vercel tarafından yapılıyor. GitHub Pages ortamı repo Settings > Environments > github-pages üzerinden manuel kaldırılmalı.',
    changes: [
      {
        type: 'kaldirildi',
        text: '.github/workflows/deploy.yml: GitHub Pages deploy workflow\'u silindi — main branch\'ini dinliyordu, hiç tetiklenmedi, Vercel tüm deployment\'ları yapıyor',
      },
    ],
  },
  {
    version: '3.20.0',
    date: '11 Haziran 2026',
    title: 'AGENTS.md Yeniden Yazımı — 26 Bölümlü Sıfır-Tolerans Kuralları',
    summary:
      'AGENTS.md tamamen yeniden yazıldı: İngilizce→Türkçe, 243 satırdan 500+ satıra, 26 bölüm. Sıfır-Tolerans kuralları (§0), Değişiklik Protokolü (§1), Rollback Protokolü (§16), Error Handling Pattern (§12), Import Path Kuralları (§13), Güvenlik Kuralları (§14), Sub-AGENTS.md Okuma Zorunluluğu (§15), Performance Budget (§17), Tek Branch Deploy Yapısı (§18), Test Coverage Eşiği (§19), OpenCode Agent Seçimi (§20), Fallow Audit Kuralları (§21), MCP Kullanımı (§22), MEMORY.md Kullanımı (§23), Pre-commit Hook Detayı (§24), GitHub Actions CI/CD (§25) eklendi. Açık Görevler (§9) güncellendi — MASTER_PLAN ve WEEKLY_PLAN\'dan kalan işler listelendi.',
    changes: [
      {
        type: 'yeni',
        text: '§0 Sıfır-Tolerans Kuralları: Korunan sistemler listesi (ruleEngine.ts, AgentBus.ts, shadcn/ui, vb.) + yasak davranışlar (any tip, console.log, localStorage direkt, 5+ dosya, vb.)',
      },
      {
        type: 'yeni',
        text: '§1 Değişiklik Protokolü: 6 adımlı zorunlu akış (Baseline → Kapsam → Değişiklik → Changelog → Doğrulama → Commit)',
      },
      {
        type: 'yeni',
        text: '§11 Semantic Versiyonlama: PATCH/MINOR/MAJOR kuralları netleştirildi',
      },
      {
        type: 'yeni',
        text: '§12 Error Handling Pattern: Zorunlu logger kullanımı, yasak catch kalıpları (boş catch, console, sessiz fail)',
      },
      {
        type: 'yeni',
        text: '§13 Import Path Kuralları: @/ alias zorunlu, import sırası ESLint uyumlu',
      },
      {
        type: 'yeni',
        text: '§14 Güvenlik Kuralları: API key yönetimi (.env, VITE_ prefix), XSS koruması (DOMPurify), kullanıcı verisi (userManager)',
      },
      {
        type: 'yeni',
        text: '§15 Sub-AGENTS.md Okuma Zorunluluğu: Her klasörün kendi AGENTS.md\'ini okuma protokolü',
      },
      {
        type: 'yeni',
        text: '§16 Rollback Protokolü: CI fail → zorunlu revert, reset vs revert tablosu, force push yasağı',
      },
      {
        type: 'yeni',
        text: '§17 Performance Budget: Chunk limitleri (index 300KB, vendor 280KB, vb.), kütüphane ekleme kuralları, useEffect cleanup zorunluluğu',
      },
      {
        type: 'yeni',
        text: '§18 Branch & Deploy Yapısı: Tek branch dev → direkt canlı, push = production deploy, force push yasak',
      },
      {
        type: 'yeni',
        text: '§19 Test Coverage Eşiği: Katman bazlı minimum coverage (%80 lib, %75 agents, %70 hooks, %40 pages), edge case zorunluluğu',
      },
      {
        type: 'yeni',
        text: '§20 OpenCode Agent Seçimi: 9 agent tanımı, disabled_providers, context compaction kuralları',
      },
      {
        type: 'yeni',
        text: '§21 Fallow Audit Kuralları: ignorePatterns, usedClassMembers, ignoreExports listeleri, hedef metrikler',
      },
      {
        type: 'yeni',
        text: '§22 MCP Kullanımı: filesystem/github/web-search öncelik sırası ve kullanım senaryoları',
      },
      {
        type: 'yeni',
        text: '§23 MEMORY.md Kullanımı: Ne zaman yazılır, nasıl yazılır, ne zaman okunur',
      },
      {
        type: 'yeni',
        text: '§24 Pre-commit Hook Detayı: Tetikleyen uzantılar, changelog zorunluluğu, bypass yasağı',
      },
      {
        type: 'yeni',
        text: '§25 GitHub Actions CI/CD: quality-gate adımları, frozen-lockfile, yerel vs CI farkı',
      },
      {
        type: 'yeni',
        text: '§26 Sub-AGENTS.md Durumu: Hangi klasörlerde henüz AGENTS.md yok, oluşturma kuralları',
      },
      {
        type: 'iyilestirme',
        text: '§9 Açık Görevler: MASTER_PLAN (G4, G5, C1-C3) ve Hafta 6 Refactor (6.1-6.8) + eksik testler (5.9-5.12) eklendi',
      },
      {
        type: 'iyilestirme',
        text: 'Tüm dosya İngilizce\'den Türkçe\'ye çevrildi, bölüm numaralandırması eklendi, daha yapısal ve deterministik hale getirildi',
      },
    ],
  },
  {
    version: '3.19.0',
    date: '10 Haziran 2026',
    title: 'MCP Fix, Storybook Kurulumu, Audit v2, Memory/Cache Optimizasyonu',
    summary:
      'Tüm MCP type\'ları düzeltildi (local→stdio, remote→sse). 4 LM Studio modeline tool_call: true eklendi. Storybook altyapısı kuruldu (.storybook/, MCP wrapper, ilk story). parspel-audit skill v2.0.0: deterministik execution, strict tool pipeline, stop condition, loop-safe. Memory/Cache optimizasyon katmanı (audit-state.json, hash tracking, incremental audit).',
    changes: [
      {
        type: 'duzeltme',
        text: 'opencode.json MCP type fix: tüm local→stdio, remote→sse düzeltildi — MCP\'ler artık doğru protokolle bağlanıyor',
      },
      {
        type: 'duzeltme',
        text: 'opencode.json: 4 LM Studio modeline tool_call: true eklendi (Qwen3 4B Thinking, Qwen3 VL 4B, Phi 3.5 Mini, Liquid 1.2B) — yerel modellerle MCP kullanılabilir',
      },
      {
        type: 'yeni',
        text: 'GITHUB_TOKEN env var tanımlandı — GitHub MCP\'si aktif',
      },
      {
        type: 'yeni',
        text: '.storybook/ dizini oluşturuldu: main.ts (React-Vite framework), preview.ts (controls expanded)',
      },
      {
        type: 'yeni',
        text: 'src/stories/Button.stories.tsx: ilk Storybook hikayesi (UI/Button)',
      },
      {
        type: 'yeni',
        text: 'scripts/storybook-mcp.mjs: Storybook MCP wrapper (JSON-RPC 2.0) — storybook_list_components, storybook_check, storybook_get_state, storybook_start_dev tool\'ları',
      },
      {
        type: 'yeni',
        text: 'scripts/lighthouse-mcp.mjs: Lighthouse MCP server (JSON-RPC 2.0) — lighthouse_audit, lighthouse_get_state tool\'ları',
      },
      {
        type: 'yeni',
        text: 'scripts/hash-audit.mjs: SHA-256 dosya hash hesaplama aracı — incremental audit için',
      },
      {
        type: 'yeni',
        text: '.opencode/memory/audit-state.json: MCP state tracking merkezi — filesAnalyzed, componentsChecked, pagesTested, lastHashes, mcpStates',
      },
      {
        type: 'iyilestirme',
        text: '.opencode/MEMORY.md: 10.06.2026 session, MCP fix notları, 7 optimizasyon kuralı (hash tracking, incremental audit, re-run kontrolü) eklendi',
      },
      {
        type: 'iyilestirme',
        text: 'parspel-audit skill v2.0.0: STOP CONDITION (zorunlu final state), TOOL EXECUTION PIPELINE (strict order: Static→Playwright→Lighthouse→Storybook), SAFE FIX tanımı (allowed/forbidden), STATE PERSISTENCE (her iterasyon sonu zorunlu update), TOOL USAGE RULES (max 1 test/tool/iterasyon, 2 failure→SKIP), FAIL-SAFE MODE, CHANGE SCOPE (max 3 file/iterasyon)',
      },
      {
        type: 'duzeltme',
        text: 'CSP meta tag güncellendi: connect-src\'ye ws://127.0.0.1:* ve https://*.react-grab.com eklendi — HMR WebSocket ve react-scan bağlantıları düzeltildi',
      },
      {
        type: 'duzeltme',
        text: 'package.json version 3.18.8 → 3.19.0 güncellendi — changelog ile tutarlılık sağlandı',
      },
      {
        type: 'duzeltme',
        text: 'src/stories/Button.stories.tsx: relative import → @/ path alias düzeltildi — spec compliance',
      },
      {
        type: 'duzeltme',
        text: 'P0: console.warn/info çağrıları logger ile değiştirildi (AIAsistan, AnomaliOneri, Dashboard, Notlar) — 4 dosya',
      },
      {
        type: 'duzeltme',
        text: 'P0: localStorage doğrudan erişimler save() pipeline\'ına taşındı (SettingsAgentPanel, SettingsBackup, SettingsData) — RuleEngine/AuditEngine bypass engellendi',
      },
      {
        type: 'iyilestirme',
        text: 'P1: Sales, Products, Kasa, Fatura, Stock sayfalarına SkeletonTable/SkeletonStatRow loading state eklendi — 4 UI state standardı',
      },
      {
        type: 'iyilestirme',
        text: 'P1: Stock sayfasına EmptyState eklendi (4 tab: ürünler, ABC, ölü stok, hareketler) + SkeletonTable loading',
      },
      {
        type: 'iyilestirme',
        text: 'P2: Suppliers, Bank, Butce, Notlar, Monitor sayfalarına EmptyState eklendi — inline empty textler EmptyState komponentiyle değiştirildi',
      },
      {
        type: 'iyilestirme',
        text: 'P2: CSP production mod conditional yapıldı — vite.config.ts\'e cspPlugin eklendi, production build\'de unsafe-eval ve ws:// kaldırılıyor',
      },
      {
        type: 'yeni',
        text: 'src/lib/seedData.ts: test ve geliştirme için demo veri üreteci — makeSeedDB() ile 9 ürün, 3 cari, 5 satış, 5 kasa kaydı',
      },
      {
        type: 'duzeltme',
        text: 'github-workflow-cleanup.test.ts: block-new-branch.yml testleri kaldırıldı (workflow silindi) — 8 test hatası giderildi',
      },
      {
        type: 'duzeltme',
        text: 'KRİTİK: index.css\'teki 4926 satır özel CSS (login, dashboard, settings sınıfları) geri yüklendi — 9fb26ac commit\'inde yanlışlıkla silinmişti. CSS kural sayısı 82→855, sayfa artık düz yazı olarak kalmıyor',
      },
      {
        type: 'duzeltme',
        text: 'main.tsx CSS import sıralaması düzeltildi: index.css (Tailwind) → design-tokens.css (override) — Tailwind varsayılan teması artık design token\'ları ezmiyor',
      },
    ],
  },
  {
    version: '3.18.8',
    date: '10 Haziran 2026',
    title: 'Settings & AIAsistan Split, Git Hooks Sistemi',
    summary:
      'Settings.tsx 3069→1056 satıra indirildi (6 modüle ayrıldı). AIAsistan.tsx 1645→1374 satıra indirildi (yardımcı fonksiyonlar + ApiSettings ayrıldı). Husky v9 tabanlı git hook sistemi kuruldu.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'Settings.tsx parçalandı: 3069→1056 satır — SettingsActivity, SettingsBackup, SettingsPelet, SettingsRepair, SettingsData, SettingsShortcuts ayrı dosyalara çıkarıldı',
      },
      {
        type: 'iyilestirme',
        text: 'AIAsistan.tsx parçalandı: 1645→1374 satır — AIAHelpers.tsx (MarkdownText, getActionAffectedIds, isDangerousAction, sourceLabel) ve AIASettings.tsx (ApiSettings) ayrı dosyalara çıkarıldı',
      },
      {
        type: 'yeni',
        text: 'Husky v9+ git hook sistemi: pre-commit (6 adim), pre-push (5 adim), commit-msg (conventional commits), post-merge, post-checkout',
      },
      {
        type: 'yeni',
        text: '5 helper script: colors.sh, staged-files.sh, git-context.sh, timer.sh, performance-log.sh',
      },
      { type: 'yeni', text: 'lint-staged.config.js: ESLint + Prettier + JSON validasyonu + test runner' },
      { type: 'yeni', text: 'docs/development/GIT_HOOKS.md: hook sistemi dokumantasyonu' },
      { type: 'yeni', text: 'docs/development/WORKFLOW.md: gelistirme is akisi ve branch stratejisi' },
      { type: 'yeni', text: 'scripts/setup-hooks.sh: manuel hook kurulum scripti' },
      {
        type: 'iyilestirme',
        text: 'Settings son parçalama: KategoriYonetim, AboutPanel, AgentSettingsPanel ayri dosyalara çikarildi (SettingsKategoriYonetim, SettingsAboutPanel, SettingsAgentPanel)',
      },
      {
        type: 'iyilestirme',
        text: 'Skin Transformation tamamlandi: corporate enterprise teması varsayilan, design-tokens.css light-first, ThemeProvider corporate default',
      },
      {
        type: 'yeni',
        text: 'Playwright MCP (@playwright/mcp) kuruldu, playwright.config.ts oluşturuldu, e2e/helpers/app.ts expect import fix',
      },
      {
        type: 'yeni',
        text: 'Lighthouse + axe-core Playwright entegrasyonu: accessibility.spec.ts, lighthouse helper, npm scriptleri eklendi',
      },
      {
        type: 'iyilestirme',
        text: 'pre-commit hook: lockfile senkronizasyonu, typecheck, ESLint+Prettier, JSON validasyonu (node ile, cross-platform), changelog kontrolu, korumali dosya uyarisi',
      },
      {
        type: 'iyilestirme',
        text: 'pre-push hook: korumali branch kontrolu, test suite, build, spec compliance, bundle size karsilastirmasi, commit sayisi uyarisi',
      },
      {
        type: 'iyilestirme',
        text: 'commit-msg hook: conventional commits format, subject uzunlugu, scope dogrulama, body yapisi, issue reference',
      },
      {
        type: 'iyilestirme',
        text: 'Tum hooklarda Windows (Git Bash) uyumlulugu: jq -> node, %N+bc -> date+%s+$(()), grep -oP -> sed',
      },
      { type: 'duzeltme', text: 'package.json prepare script: "husky install" -> "husky" (Husky v9+ uyumu)' },
      {
        type: 'kaldirildi',
        text: 'Husky v9 ve lint-staged kaldırıldı — simple-git-hooks tek başına yeterli, çakışma riski giderildi',
      },
      {
        type: 'iyilestirme',
        text: 'package.json cleanup: kullanılmayan husky, lint-staged, lint-staged.config.js kaldırıldı; prepare script "simple-git-hooks" olarak güncellendi',
      },
      {
        type: 'yeni',
        text: 'parspel-audit skill v1.0.0: PARSPEL mimarisini koruyan otonom frontend denetim ajanı — Playwright + Lighthouse + Storybook MCP entegrasyonlu, 3 iterasyon sınırlı, kırmızı çizgi kurallı',
      },
      {
        type: 'iyilestirme',
        text: 'parspel-audit skill v1.1.0: Git güvenliği (commit/push yasak), P0-P3 risk öncelik sistemi, changelog zorunluluğu eklendi — production-grade seviyesine yükseltildi',
      },
    ],
  },
  {
    version: '3.18.6',
    date: '9 Haziran 2026',
    title: 'Air-Gapped / Offline AI Ortami Kurulumu',
    summary: 'Local AI (LM Studio) + MCP server + offline mod konfigurasyonu.',
    changes: [
      { type: 'iyilestirme', text: 'opencode global+proje config: offline:true, autoupdate:false eklendi' },
      {
        type: 'iyilestirme',
        text: 'Air-gapped env degiskenleri PowerShell profiline eklendi (OPENCODE_OFFLINE, DISABLE_*)',
      },
      { type: 'yeni', text: 'AGENTS.md: Local AI ortami dokumantasyonu eklendi' },
    ],
  },
  {
    version: '3.18.5',
    date: '8 Haziran 2026',
    title: 'GÃ¼venlik ve Veri BÃ¼tÃ¼nlÃ¼ÄŸÃ¼ Kritik DÃ¼zeltmeleri',
    summary:
      'API key yÃ¶netimi, kullanÄ±cÄ± cache IndexedDB migration, stok hareketi limit uyarÄ±larÄ±, localStorage truncation sentinel ve last-write-wins kayÄ±p uyarÄ±larÄ± eklendi.',
    changes: [
      {
        type: 'duzeltme',
        text: 'aiKeys.ts: API keyâ€™ler zaten AES-GCM ile ÅŸifreleniyor, memory-only cache gÃ¼venlik notu eklendi',
      },
      {
        type: 'duzeltme',
        text: 'aiApi.ts: Gemini API key zaten X-Goog-Api-Key headerâ€™Ä±nda, URL query parameter kullanÄ±mÄ± yok',
      },
      {
        type: 'duzeltme',
        text: 'userManager.ts (B4): KullanÄ±cÄ± cache artÄ±k IndexedDBâ€™ye taÅŸÄ±ndÄ± (PBKDF2+salt hashâ€™ler), localStorage fallback korundu',
      },
      {
        type: 'duzeltme',
        text: 'userManager.ts (B5): Eski SHA-256 legacy hashâ€™ler login sÄ±rasÄ±nda otomatik PBKDF2+saltâ€™a upgrade ediliyor (zaten mevcut)',
      },
      { type: 'duzeltme', text: 'core.ts (G1): 1000 stok hareketi limit aÅŸÄ±mÄ±nda logger.warn uyarÄ±sÄ± eklendi' },
      {
        type: 'duzeltme',
        text: 'core.ts (G3): saveToStorage last-write-wins durumunda logger.warn kayÄ±p uyarÄ±sÄ± eklendi',
      },
      {
        type: 'duzeltme',
        text: 'safeIO.ts (G2): __truncated__ sentinel durumunda console.error (kritik data loss) eklendi; logger.ts dÃ¶ngÃ¼sel baÄŸÄ±mlÄ±lÄ±k nedeniyle console kullanÄ±ldÄ±',
      },
      {
        type: 'duzeltme',
        text: 'kapsamli-senaryo.test.ts (A7): P1 test tautolojisi dÃ¼zeltildi (computed !== beklenen aynÄ± hesapla) â€” artÄ±k farklÄ± hesaplama yollarÄ±nÄ± karÅŸÄ±laÅŸtÄ±rÄ±yor',
      },
      {
        type: 'duzeltme',
        text: 'anomalyEngine.ts (E3): IssueCategory â†’ AnomalyCategory cast kaldÄ±rÄ±ldÄ±, explicit CATEGORY_MAP eklendi',
      },
      {
        type: 'duzeltme',
        text: "backup.ts (E4): undefined as unknown as string cast'leri kaldÄ±rÄ±ldÄ±, orphan kayÄ±tlar deleted: true ile iÅŸaretleniyor",
      },
      { type: 'duzeltme', text: 'saleCompletion.ts: toPayload helper eklendi, 4 cast temizlendi' },
      { type: 'duzeltme', text: 'SatisAgent.ts: payload cast sonrasÄ± validation eklendi' },
      { type: 'duzeltme', text: 'deepseek.ts + aiApi.ts: res.body! â†’ null check, any â†’ unknown' },
      { type: 'duzeltme', text: 'streamUtils.ts: response.body! null check eklendi' },
      { type: 'duzeltme', text: 'pageHelpers.ts, aiActions.ts, e2e/helpers/app.ts: any â†’ proper type' },
      { type: 'duzeltme', text: 'TÃ¼m catch {} bloklarÄ±na logger.warn veya yorum eklendi' },
    ],
  },
  {
    version: '3.18.4',
    date: '8 Haziran 2026',
    title: 'UI/UX Modernizasyonu â€” Gauge, Glassmorphism ve Kritik DÃ¼zeltmeler',
    summary:
      'AnomaliOneri SVG gauge modernizasyonu, Dashboard glassmorphism efektleri, App.tsx beforeunload korumasÄ±, encoding/Settings dÃ¼zeltmeleri, SettingsSound spec compliance.',
    changes: [
      { type: 'iyilestirme', text: 'AnomaliOneri: PieChart â†’ SVG gauge, gradient glow, CSS variable geÃ§iÅŸi' },
      {
        type: 'iyilestirme',
        text: 'Dashboard (5 sayfa): glassmorphism kart efektleri (backdrop-filter, blur, transition)',
      },
      { type: 'yeni', text: 'App.tsx: TarayÄ±cÄ± sekmesi beforeunload korumasÄ± eklendi' },
      { type: 'duzeltme', text: 'Settings.tsx: overflow dÃ¼zeltildi (overflow-hidden + flex-nowrap)' },
      { type: 'duzeltme', text: 'SettingsSound.tsx: relative import â†’ @/ alias, localStorage â†’ useDB()' },
      { type: 'duzeltme', text: 'AnomaliOneri.tsx: JSX hatasÄ± dÃ¼zeltildi (<div> tag kapatÄ±ldÄ±)' },
      { type: 'duzeltme', text: '15 sayfa taramasÄ± temiz (0 encoding hatasÄ±, 0 JS hatasÄ±)' },
    ],
  },
  {
    version: '3.18.3',
    date: '7 Haziran 2026',
    title: 'Spec Compliance DÃ¼zeltmeleri',
    summary:
      'SettingsSound useDB() hook geri yÃ¼klendi. Version 3.18.3 gÃ¼ncellendi. TÃ¼m spec compliance testleri geÃ§iyor.',
    changes: [
      { type: 'duzeltme', text: 'package.json version: 3.18.2 -> 3.18.3' },
      { type: 'duzeltme', text: 'SettingsSound.tsx: useDB() hook ile DB eriÅŸimi' },
      { type: 'duzeltme', text: 'Card import yolu: @/pages/SettingsCard' },
      {
        type: 'duzeltme',
        text: 'Relative import (../) -> @/ path alias: SettingsCompany, SettingsExcel, SettingsSecurity, SettingsSound',
      },
      { type: 'duzeltme', text: 'Settings.tsx: unused lbl deÄŸiÅŸkeni kaldÄ±rÄ±ldÄ±' },
      { type: 'iyilestirme', text: 'CI pipeline: lint (0 warnings), tests (271 passed), build (success)' },
    ],
  },
  {
    version: '3.18.2',
    date: '7 Haziran 2026',
    title: 'GÃ¶rÃ¼nÃ¼m Encoding TemizliÄŸi ve Lint UyarÄ±larÄ±',
    summary:
      'Proje genelindeki UTF-8 encoding bozukluklarÄ± dÃ¼zeltildi. TÃ¼m lint uyarÄ±larÄ± giderildi (11 -> 0). Utility fonksiyonlarÄ± bileÅŸenlerden ayrÄ± dosyalara taÅŸÄ±ndÄ±.',
    changes: [
      { type: 'duzeltme', text: 'Global UTF-8 encoding temizliÄŸi (Fatura.tsx, Settings.tsx)' },
      {
        type: 'duzeltme',
        text: 'Settings.tsx parÃ§alandÄ±: SettingsCompany, SettingsSound, SettingsArayuz, SettingsBaglanti',
      },
      { type: 'duzeltme', text: 'SettingsArayuz: Duplicate Premium Temalar bloÄŸu kaldÄ±rÄ±ldÄ±' },
      { type: 'duzeltme', text: 'Settings.tsx tab listesi mobil iÃ§in scrollable hale getirildi' },
      { type: 'duzeltme', text: 'Debug CSS outline kaldÄ±rÄ±ldÄ±' },
      { type: 'duzeltme', text: 'ThemeSection.tsx PREMIUM_THEMES import hatasÄ± dÃ¼zeltildi' },
      { type: 'iyilestirme', text: 'Lint warnings: 11 -> 0 (tamamen temiz)' },
      { type: 'iyilestirme', text: 'pageHelpers.tsx: styles ve constants ayrÄ± dosyalara taÅŸÄ±ndÄ± (pageStyles.ts)' },
      { type: 'iyilestirme', text: 'SalesHelpers.tsx: utilities ayrÄ± dosyaya taÅŸÄ±ndÄ± (salesStyles.ts)' },
      { type: 'iyilestirme', text: 'useDebounce hook ayrÄ± dosyaya taÅŸÄ±ndÄ± (useDebounce.ts)' },
    ],
  },
  {
    version: '3.18.1',
    date: '7 Haziran 2026',
    title: 'Lint UyarÄ±larÄ± ve Kod TemizliÄŸi',
    summary:
      'Code review sonrasÄ± tespit edilen lint uyarÄ±larÄ± dÃ¼zeltildi. KullanÄ±lmayan deÄŸiÅŸkenler ve importlar temizlendi.',
    changes: [
      { type: 'duzeltme', text: 'Settings.tsx: unused company state, setCompany, saveCompany kaldÄ±rÄ±ldÄ±' },
      { type: 'duzeltme', text: 'Settings.tsx: unused SoundType import kaldÄ±rÄ±ldÄ±' },
      { type: 'duzeltme', text: 'SettingsArayuz.tsx: unused Button import kaldÄ±rÄ±ldÄ±' },
      { type: 'iyilestirme', text: 'Lint warnings: 15 -> 11 azaltÄ±ldÄ±' },
    ],
  },
  {
    version: '3.18.0',
    date: '7 Haziran 2026',
    title: 'Settings BileÅŸen Refactoring ve CI Ä°yileÅŸtirmeleri',
    summary:
      "Code review sonrasÄ± tespit edilen kritik sorunlar dÃ¼zeltildi. SettingsArayuz 452 satÄ±rdan 31 satÄ±ra indirildi, 6 alt bileÅŸene ayrÄ±ldÄ±. CI pipeline'da quality gate geri eklendi.",
    changes: [
      {
        type: 'duzeltme',
        text: 'build-apk.yml: needs: quality geri eklendi â€” APK artÄ±k sadece lint/typecheck/test geÃ§erse build ediliyor',
      },
      { type: 'duzeltme', text: 'SettingsArayuz.tsx: localStorage.removeItem() yerine saveUIPrefs() kullanÄ±lÄ±yor' },
      { type: 'duzeltme', text: 'gradle-wrapper.properties: 8.13 -> 8.14.3 sÃ¼rÃ¼m tutarlÄ±lÄ±ÄŸÄ± saÄŸlandÄ±' },
      { type: 'iyilestirme', text: 'SettingsArayuz: 452 satÄ±r -> 31 satÄ±r (6 alt bileÅŸene ayrÄ±ldÄ±)' },
      {
        type: 'iyilestirme',
        text: 'Yeni bileÅŸenler: ThemeSection, TypographySection, AnimationSection, DashboardSection, FloatingButtonsSection, SettingsActionButtons',
      },
      { type: 'iyilestirme', text: 'Inline style temizliÄŸi â€” Tailwind + CSS deÄŸiÅŸkenleri kullanÄ±lÄ±yor' },
    ],
  },
  {
    version: '3.17.0',
    date: '7 Haziran 2026',
    title: 'GÃ¼venlik, Performans ve BakÄ±m Ä°yileÅŸtirmeleri',
    summary:
      'KapsamlÄ± code review sonrasÄ± tespit edilen 25 gÃ¼venlik, 10 performans ve 14 bakÄ±m sorunu dÃ¼zeltildi. AES anahtar yÃ¶netimi, brute-force korumasÄ±, memoization, lazy import ve kod konsolidasyonu uygulandÄ±.',
    changes: [
      // GÃ¼venlik
      { type: 'duzeltme', text: "crypto.ts: AES-256-GCM anahtarÄ± artÄ±k non-exportable ve IndexedDB'de saklanÄ±yor" },
      { type: 'duzeltme', text: 'crypto.ts: localStorage plaintext anahtar kaldÄ±rÄ±ldÄ± â€” migration otomatik' },
      {
        type: 'duzeltme',
        text: 'logger.ts: Hassas alanlar (password, token, apikey) artÄ±k persist Ã¶ncesi de maskeleniyor',
      },
      { type: 'duzeltme', text: "safeIO.ts: GÃ¼venlik kritik key'ler (session, crypto, config) evict edilmiyor" },
      {
        type: 'duzeltme',
        text: 'core.ts: importJSON artÄ±k ÅŸema doÄŸrulama, boyut kontrolÃ¼ ve prototype pollution korumasÄ± yapÄ±yor',
      },
      { type: 'duzeltme', text: 'connConfig.ts: Config kayÄ±t Ã¶ncesi tip ve injection doÄŸrulamasÄ± eklendi' },
      { type: 'duzeltme', text: 'userManager.ts: Math.random() yerine crypto.randomUUID() kullanÄ±lÄ±yor' },
      {
        type: 'duzeltme',
        text: 'userManager.ts: Brute-force korumasÄ± â€” 5 baÅŸarÄ±sÄ±z denemeden sonra 1 dakika kilit',
      },
      {
        type: 'duzeltme',
        text: 'userManager.ts: Misafir oturumu integrity hash artÄ±k crypto.randomUUID ile Ã¼retiliyor',
      },
      { type: 'duzeltme', text: 'core.ts: saveToStorage artÄ±k version artÄ±ÅŸÄ±nÄ± mutasyon olmadan yapÄ±yor' },
      // Performans
      { type: 'iyilestirme', text: 'core.ts: save() ve saveGuarded() ortak processSave() fonksiyonuna birleÅŸtirildi' },
      {
        type: 'iyilestirme',
        text: 'core.ts: useDB() return deÄŸeri useMemo ile stabilize edildi â€” gereksiz re-render Ã¶nlendi',
      },
      { type: 'iyilestirme', text: 'Dashboard.tsx: recentSales ve recentActivity useMemo ile memoize edildi' },
      {
        type: 'iyilestirme',
        text: 'Dashboard.tsx: exportToExcel lazy import ile sadece tÄ±klanÄ±nca yÃ¼kleniyor (~1MB chunk)',
      },
      {
        type: 'iyilestirme',
        text: 'index.css: background-attachment: fixed kaldÄ±rÄ±ldÄ± â€” mobilde GPU performansÄ± arttÄ±',
      },
      {
        type: 'iyilestirme',
        text: "vite-manual-chunks.ts: dexie, exceljs, zustand, mitt iÃ§in ayrÄ± chunk'lar eklendi",
      },
      // BakÄ±m
      {
        type: 'iyilestirme',
        text: 'anomalyEngine + dataIntegrityChecker: SaÄŸlÄ±k skoru formÃ¼lÃ¼ tekilleÅŸtirildi (computeHealthScore)',
      },
      { type: 'iyilestirme', text: 'anomalyEngine + dataIntegrityChecker: console.warn yerine logger kullanÄ±lÄ±yor' },
      {
        type: 'duzeltme',
        text: 'dataIntegrityChecker: Ã‡eliÅŸkili boyut eÅŸikleri olan mÃ¼kerrer bÃ¶lÃ¼m 9 kaldÄ±rÄ±ldÄ±',
      },
      {
        type: 'iyilestirme',
        text: 'data-rules.ts: walkFiles artÄ±k birden fazla uzantÄ± alÄ±yor ve tam dosya adÄ± eÅŸleÅŸmesi yapÄ±yor',
      },
      { type: 'duzeltme', text: 'SetupWizard.tsx: value: any yerine T[keyof T] kullanÄ±ldÄ±' },
      // CI Pipeline Recovery
      { type: 'duzeltme', text: 'LogCategory tipi 30+ kategori ile geniÅŸletildi (83 TS hatasÄ± Ã§Ã¶zÃ¼ldÃ¼)' },
      { type: 'duzeltme', text: 'KullanÄ±lmayan import/deÄŸiÅŸkenler temizlendi (19 TS6133 hatasÄ±)' },
      { type: 'duzeltme', text: 'SatisAgent.ts: this baÄŸlamÄ± hatasÄ± dÃ¼zeltildi (yetkiKontrolu baÄŸlam kaybÄ±)' },
      { type: 'duzeltme', text: 'aiActions.ts/crypto.ts/aiApi.ts/deepseek.ts: ESLint no-explicit-any fix' },
      { type: 'duzeltme', text: 'aiOffline.ts: monthStart tanÄ±mlandÄ±, undefined referans hatasÄ± dÃ¼zeltildi' },
      { type: 'duzeltme', text: 'KontrolHalkasi.tsx: as unknown as Record double cast eklendi' },
      { type: 'iyilestirme', text: 'scripts/version-utils.ts: resolveVersionCode fonksiyonu eklendi' },
      { type: 'duzeltme', text: 'quality-gate.yml: push trigger sadece dev branch olacak ÅŸekilde dÃ¼zeltildi' },
    ],
  },
  {
    version: '3.16.4',
    date: '7 Haziran 2026',
    title: 'data-rules.ts Syntax HatasÄ± DÃ¼zeltmesi',
    summary:
      "src/lib/specs/data-rules.ts dosyasÄ±nda fazladan sÃ¼slÃ¼ parantez '}' nedeniyle lint, typecheck ve spec-compliance testi kÄ±rÄ±lÄ±yordu. Her iki kuraldaki brace hatalarÄ± dÃ¼zeltildi.",
    changes: [
      { type: 'duzeltme', text: 'NO_DIRECT_DB_WRITE kuralÄ±ndaki fazladan } kaldÄ±rÄ±ldÄ±' },
      { type: 'duzeltme', text: 'NO_DB_JSON_PARSE_IN_PAGES kuralÄ±ndaki fazladan } kaldÄ±rÄ±ldÄ±' },
    ],
  },
  {
    version: '3.16.3',
    date: '7 Haziran 2026',
    title: 'CI pnpm 11 UyumsuzluÄŸu DÃ¼zeltmesi',
    summary:
      "GitHub Actions'ta pnpm 11.5.2 kullanÄ±ldÄ±ÄŸÄ± iÃ§in package.json'daki pnpm.onlyBuiltDependencies okunmuyordu. pnpm 9.15.4'e sabitlendi ve --config.onlyBuiltDependencies flag'Ä± eklendi.",
    changes: [
      { type: 'duzeltme', text: "pnpm version 9'a sabitlendi (9.15.4)" },
      { type: 'duzeltme', text: 'CI install komutuna --config.onlyBuiltDependencies=fallow eklendi' },
    ],
  },
  {
    version: '3.16.2',
    date: '7 Haziran 2026',
    title: 'pnpm Build Script Ä°znÄ±',
    summary:
      "GitHub Actions CI'da fallow build script reddedilme hatasÄ± dÃ¼zeltildi. pnpm.onlyBuiltDependencies eklendi.",
    changes: [{ type: 'duzeltme', text: 'package.json\'a pnpm.onlyBuiltDependencies:["fallow"] eklendi' }],
  },
  {
    version: '3.16.1',
    date: '7 Haziran 2026',
    title: 'GitHub Actions pnpm/corepack DÃ¼zeltmesi',
    summary: "GitHub Actions workflow'larÄ±nda pnpm PATH hatasÄ± dÃ¼zeltildi. corepack enable adÄ±mÄ± eklendi.",
    changes: [
      { type: 'duzeltme', text: "build-apk, quality-gate, deploy workflow'larÄ±na corepack enable adÄ±mÄ± eklendi" },
    ],
  },
  {
    version: '3.16.0',
    date: '7 Haziran 2026',
    title: 'OpenRouter Multi-Agent YapÄ±landÄ±rmasÄ±',
    summary:
      "OpenRouter free tier ile 11 agent tanÄ±mlandÄ± (7 free, 4 power). LMStudio ve Ollama provider'larÄ± kaldÄ±rÄ±ldÄ±. Compaction ayarlarÄ± optimize edildi.",
    changes: [
      { type: 'yeni', text: 'OpenRouter provider eklendi (free tier modeller)' },
      {
        type: 'yeni',
        text: '11 agent tanÄ±mlandÄ±: architect, coder, brainstorm, reviewer, orchestrator, visionary, agentic-coder (free) + power-coder, power-planner, power-reasoner, power-frontend (opencode-go)',
      },
      { type: 'kaldirildi', text: "LMStudio ve Ollama provider'larÄ± kaldÄ±rÄ±ldÄ±" },
      { type: 'iyilestirme', text: 'Compaction ayarlarÄ±: tail_turns 20, reserved 15000' },
    ],
  },
  {
    version: '3.15.4',
    date: '8 Haziran 2026',
    title: 'CI/CD Workflow GÃ¼venlik ve GÃ¼venilirlik DÃ¼zeltmeleri',
    summary:
      "GitHub Actions workflow'larÄ±nda 6 kritik sorun dÃ¼zeltildi: block-new-branch tÃ¼m branch'leri siliyordu, quality-gate PR'lerde Ã§alÄ±ÅŸmÄ±yordu, deploy/build APK kalite kontrolÃ¼nÃ¼ beklemeden Ã§alÄ±ÅŸÄ±yordu, build-apk Gradle izin eksikliÄŸi vardÄ±, pnpm PATH'de bulunamÄ±yordu, Node.js 20 deprecation uyarÄ±sÄ± vardÄ±.",
    changes: [
      {
        type: 'duzeltme',
        text: "block-new-branch.yml: if koÅŸulu dÃ¼zeltildi â€” artÄ±k sadece dev/main dÄ±ÅŸÄ±ndaki branch'leri engelliyor, main branch'ini silmiyor",
      },
      {
        type: 'duzeltme',
        text: 'quality-gate.yml: push + pull_request trigger eklendi â€” PR aÃ§Ä±ldÄ±ÄŸÄ±nda da lint/test/build Ã§alÄ±ÅŸÄ±yor',
      },
      {
        type: 'duzeltme',
        text: 'deploy.yml + build-apk.yml: "needs: quality" baÄŸÄ±mlÄ±lÄ±ÄŸÄ± eklendi â€” deploy ve APK build Ã¶nce kalite kontrolÃ¼nden geÃ§iyor',
      },
      {
        type: 'duzeltme',
        text: 'build-apk.yml: Gradle executable izni (chmod +x) ve android/ dizin kontrolÃ¼ eklendi',
      },
      {
        type: 'duzeltme',
        text: "build-apk.yml: setup-android action kaldÄ±rÄ±ldÄ± â€” Capacitor kendi Gradle wrapper'Ä±nÄ± kullanÄ±yor, ek Android SDK gerekmez",
      },
      {
        type: 'duzeltme',
        text: "TÃ¼m workflow'lar: pnpm/action-setup -> setup-node sÄ±ralamasÄ± dÃ¼zeltildi, run_install: false eklendi â€” pnpm PATH'te bulunamama hatasÄ± giderildi",
      },
      {
        type: 'duzeltme',
        text: "TÃ¼m workflow'lar: FORCE_JAVASCRIPT_ACTIONS_TO_NODE24 env kaldÄ±rÄ±ldÄ± â€” Node.js 20 deprecation uyarÄ±sÄ± giderildi",
      },
    ],
  },
  {
    version: '3.15.3',
    date: '7 Haziran 2026',
    title: "GÃ¼venlik â€” Firebase API Key URL Query'den Ã‡Ä±karÄ±ldÄ±",
    summary:
      "userManager.ts'teki Firebase REST API Ã§aÄŸrÄ±larÄ± Firebase SDK'ya taÅŸÄ±ndÄ±. API key artÄ±k URL'de query parameter olarak gÃ¶nderilmiyor, SDK Ã¼zerinden gÃ¼venli ÅŸekilde iletilir.",
    changes: [
      {
        type: 'iyilestirme',
        text: "userManager.ts: loadUsers/saveUsers REST API â†’ Firebase SDK (readDoc/writeDoc) â€” API key URL query parameter'dan kaldÄ±rÄ±ldÄ±",
      },
    ],
  },
  {
    version: '3.15.2',
    date: '7 Haziran 2026',
    title: 'StatCard SalesHelpers â†’ pageHelpers taÅŸÄ±masÄ±',
    summary:
      "StatCard bileÅŸeni SalesHelpers.tsx'ten pageHelpers.tsx'e taÅŸÄ±ndÄ±, clone refactor batch 2 kapsamÄ±nda.",
    changes: [
      {
        type: 'iyilestirme',
        text: 'StatCard: SalesHelpers â†’ pageHelpers taÅŸÄ±ndÄ±, re-export ile geriye uyum saÄŸlandÄ±',
      },
    ],
  },
  {
    version: '3.13.2',
    date: '5 Haziran 2026',
    title: 'CSS Variable GeÃ§iÅŸi â€” QuantumLink, NotificationCenter tamamlama',
    summary:
      'QuantumLink bileÅŸenindeki hardcoded renk/kenarlÄ±k deÄŸerleri CSS variable referanslarÄ±na dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼. NotificationCenter ek CSS variable iyileÅŸtirmeleri yapÄ±ldÄ±. package.json versiyon uyumu dÃ¼zeltildi.',
    changes: [
      { type: 'iyilestirme', text: 'QuantumLink: inline stiller CSS variable kullanacak ÅŸekilde gÃ¼ncellendi' },
      {
        type: 'iyilestirme',
        text: 'NotificationCenter: ek CSS variable dÃ¶nÃ¼ÅŸÃ¼mleri (border, text, renk iyileÅŸtirmeleri)',
      },
      { type: 'duzeltme', text: 'package.json 3.13.0 â†’ 3.13.2 (versiyon tutarlÄ±lÄ±ÄŸÄ±)' },
    ],
  },
  {
    version: '3.13.1',
    date: '4 Haziran 2026',
    title: 'CSS Variable GeÃ§iÅŸi â€” IconPicker, MobileSelect, NotificationCenter',
    summary:
      'IconPicker, MobileSelect ve NotificationCenter bileÅŸenlerindeki hardcoded renk/kenarlÄ±k/yazÄ± tipi deÄŸerleri CSS variable referanslarÄ±na dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼. Tema uyumu ve bakÄ±m kolaylÄ±ÄŸÄ± iyileÅŸtirildi.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'IconPicker: hardcoded rgba/hex renkler â†’ CSS variable (--color-primary-soft, --text-muted, --radius-sm, --bg-elevated)',
      },
      {
        type: 'iyilestirme',
        text: 'MobileSelect: hardcoded renkler â†’ CSS variable (--bg-elevated, --border-strong, --radius, --text-muted, --color-primary-soft)',
      },
      {
        type: 'iyilestirme',
        text: 'NotificationCenter: seviye stilleri â†’ CSS variable (--color-danger-soft, --color-warning, --color-info, --glass-border, --surface-overlay)',
      },
    ],
  },
  {
    version: '3.13.0',
    date: '4 Haziran 2026',
    title: 'Kod BÃ¶lme & GÃ¼venlik Ä°yileÅŸtirmeleri',
    summary:
      'Settings.tsx (5425â†’4414 satÄ±r), Sales.tsx (1076â†’599 satÄ±r), Cari.tsx (1756â†’1286 satÄ±r) bÃ¶lÃ¼nerek kod tabanÄ± modÃ¼ler hale getirildi. (window as any) kullanÄ±mlarÄ± temizlendi, structuredClone polyfill (safeClone) eklendi, IndexedDB guest session doÄŸrulamasÄ± getirildi. CSS deÄŸiÅŸkenleri design-tokens.css dosyasÄ±na ayrÄ±ÅŸtÄ±rÄ±ldÄ±. UTF-8 korunmuÅŸ TÃ¼rkÃ§e karakter dÃ¼zeltmeleri yapÄ±ldÄ±.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'Settings.tsx bÃ¶lÃ¼ndÃ¼: ArayuzAyarlari (SettingsArayuz.tsx), BaglantiAyarlari (SettingsBaglanti.tsx), Card (SettingsCard.tsx) ayrÄ± dosyalara Ã§Ä±karÄ±ldÄ±',
      },
      {
        type: 'iyilestirme',
        text: 'Sales.tsx bÃ¶lÃ¼ndÃ¼: SaleFormModal (SaleFormModal.tsx) + SalesHelpers.tsx ayrÄ±ÅŸtÄ±rÄ±ldÄ±',
      },
      { type: 'iyilestirme', text: 'Cari.tsx bÃ¶lÃ¼ndÃ¼: CariDetail (CariDetail.tsx) ayrÄ±ÅŸtÄ±rÄ±ldÄ±' },
      {
        type: 'iyilestirme',
        text: 'index.css ikiye bÃ¶lÃ¼ndÃ¼: design-tokens.css (CSS deÄŸiÅŸkenleri) + index.css (bileÅŸen stilleri)',
      },
      {
        type: 'iyilestirme',
        text: '(window as any) temizlendi: useSpeech.ts (5), useSoundFeedback.ts (2) â†’ src/types/global.d.ts',
      },
      {
        type: 'iyilestirme',
        text: 'structuredClone polyfill: safeClone() ile JSON.stringify/parse fallback (iOS Safari uyumluluÄŸu)',
      },
      {
        type: 'iyilestirme',
        text: 'Guest session IndexedDB doÄŸrulamasÄ± eklendi (guestSessions tablosu, Dexie schema v2)',
      },
      {
        type: 'iyilestirme',
        text: 'UTF-8 bozuk TÃ¼rkÃ§e karakterler dÃ¼zeltildi (App.tsx, Settings.tsx, SettingsBaglanti.tsx)',
      },
      { type: 'duzeltme', text: 'changelog.ts parse hatasÄ± dÃ¼zeltildi (curl apostrophe)' },
      { type: 'duzeltme', text: 'saleCompletion.ts relative import dÃ¼zeltildi (@/domain/types)' },
      { type: 'duzeltme', text: 'useSoundFeedback.ts useEffect cleanup (AudioContext kapatma) eklendi' },
      { type: 'duzeltme', text: 'Irregular whitespace (U+00A0) temizliÄŸi, WidgetId type fix, version consistency' },
    ],
  },
  {
    version: '3.12.1',
    date: '4 Haziran 2026',
    title: 'UI DÃ¼zeltmeleri â€” Widget, Tema & AI GÃ¶rÃ¼nÃ¼rlÃ¼k',
    summary:
      'WIDGET_OPTIONS ortak config/widgets.ts dosyasÄ±na taÅŸÄ±ndÄ±; Settings sayfasÄ± aÃ§Ä±lÄ±rken oluÅŸan "not defined" hatasÄ± giderildi. AI Asistan butonlarÄ±nÄ±n inline stilleri CSS variable kullanacak ÅŸekilde gÃ¼ncellendi (karanlÄ±k temada gÃ¶rÃ¼nmez olma sorunu Ã§Ã¶zÃ¼ldÃ¼). Sekme gruplarÄ±na Ã¶zel renk deÄŸiÅŸkenleri eklendi, finans grubu cyan rengine ayrÄ±ÅŸtÄ±rÄ±ldÄ±.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'WIDGET_OPTIONS ve WidgetId tipi src/config/widgets.ts ortak dosyasÄ±na taÅŸÄ±ndÄ± â€” Dashboard ve Settings aynÄ± kaynaktan import eder',
      },
      {
        type: 'duzeltme',
        text: 'Settings sayfasÄ± aÃ§Ä±lÄ±rken oluÅŸan "WIDGET_OPTIONS is not defined" hatasÄ± giderildi',
      },
      {
        type: 'duzeltme',
        text: 'AI Asistan sayfasÄ±ndaki inline stillerdeki hardcoded renkler CSS variable ile deÄŸiÅŸtirildi â€” butonlar karanlÄ±k temada gÃ¶rÃ¼nmez olmuyor',
      },
      {
        type: 'iyilestirme',
        text: 'Sekme gruplarÄ±na Ã¶zel CSS deÄŸiÅŸkenleri eklendi (--tab-ana-*, --tab-finans-*, vs.) â€” finans grubu cyan (#06b6d4) rengine ayrÄ±ÅŸtÄ±rÄ±ldÄ±, Ä±ÅŸÄ±k/karanlÄ±k modda tutarlÄ± renkler',
      },
      { type: 'iyilestirme', text: "Premium temalar ve dark mode iÃ§in tab group renk override'larÄ± eklendi" },
    ],
  },
  {
    version: '3.12.0',
    date: '2 Haziran 2026',
    title: 'Session 2 â€” Dumb Agent + Orchestrator SadeleÅŸtirme',
    summary:
      'SatisAgent artÄ±k pure completeSale() kullanÄ±r, stok/kasa/cari yan etkilerini tek save()\'de uygular. Orchestrator sale pipeline\'Ä± sadece ["satis","fatura","rapor"] olarak kÄ±saltÄ±ldÄ± (Ã§ift kayÄ±t Ã¶nlendi). StokAgent/KasaAgent/CariAgent non-sale operasyonlar iÃ§in sadeleÅŸtirildi.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'SatisAgent.yeniSatis(): completeSale() domain service kullanÄ±r â€” stok/kasa/cari yan etkileri tek save() Ã§aÄŸrÄ±sÄ±nda uygulanÄ±r',
      },
      { type: 'iyilestirme', text: 'SatisAgent: satÄ±ÅŸ kaydÄ±na _domainEventLog eklenir (denetim izi)' },
      {
        type: 'iyilestirme',
        text: 'orchestrator.ts: sale pipeline ["satis","fatura","rapor"] â€” stok/kasa/cari Ã§ift kayÄ±t hatasÄ± giderildi',
      },
      {
        type: 'iyilestirme',
        text: 'orchestrator.ts: @deprecated eklendi â€” gelecek sÃ¼rÃ¼mde processIntent lehine kaldÄ±rÄ±lacak',
      },
      {
        type: 'iyilestirme',
        text: 'StokAgent: sadece stok_guncelle/urun_ekle iÅŸlemleri (sale mantÄ±ÄŸÄ± kaldÄ±rÄ±ldÄ±)',
      },
      {
        type: 'iyilestirme',
        text: 'KasaAgent: sadece kasa_gelir/kasa_gider iÅŸlemleri (sale mantÄ±ÄŸÄ± kaldÄ±rÄ±ldÄ±)',
      },
      {
        type: 'iyilestirme',
        text: 'CariAgent: sadece cari_tahsilat/cari_ekle iÅŸlemleri (sale mantÄ±ÄŸÄ± kaldÄ±rÄ±ldÄ±)',
      },
      { type: 'iyilestirme', text: 'StokAgent/KasaAgent: crypto.randomUUID() â†’ genId() ile deÄŸiÅŸtirildi' },
    ],
  },
  {
    version: '3.11.0',
    date: '2 Haziran 2026',
    title: 'Domain KatmanÄ± (Session 1) â€” Saf Ä°ÅŸ MantÄ±ÄŸÄ± AyrÄ±ÅŸtÄ±rmasÄ±',
    summary:
      "Event-driven domain katmanÄ± eklendi: types, eventBus, pure completeSale() fonksiyonu ve intentEngine. Ä°ÅŸ mantÄ±ÄŸÄ± agent'lardan ayrÄ±ÅŸtÄ±rÄ±larak test edilebilir saf fonksiyonlara taÅŸÄ±ndÄ±.",
    changes: [
      {
        type: 'yeni',
        text: 'src/domain/types.ts: DomainEvent, SaleIntent, StockMovementV2, CashTransaction, CariUpdate, SaleResult, Intent tipleri',
      },
      {
        type: 'yeni',
        text: 'src/domain/eventBus.ts: DomainEventBus â€” typed pub/sub event bus (on/onAny/emit/clear)',
      },
      {
        type: 'yeni',
        text: 'src/domain/services/saleCompletion.ts: pure completeSale() â€” stok doÄŸrulama, satÄ±ÅŸ hesaplama, stok/kasa/cari yan etkilerini Ã¶nceden hesaplar (mutasyon yok)',
      },
      {
        type: 'yeni',
        text: 'src/domain/intentEngine.ts: processIntent() â€” intent alÄ±r, domain service Ã§aÄŸÄ±rÄ±r, event bus Ã¼zerinden yayÄ±nlar',
      },
      {
        type: 'iyilestirme',
        text: 'src/types/index.ts: DomainEvent arayÃ¼zÃ¼ eklendi, Sale._domainEventLog alanÄ± eklendi (geriye uyumlu)',
      },
    ],
  },
  {
    version: '3.10.7',
    date: '2 Haziran 2026',
    title: 'QuantumLink Agent Entegrasyonu',
    summary: 'Sesli/yazÄ±lÄ± komutlar dispatchAgentFlow ile agent sistemine yÃ¶nlendirildi.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'QuantumLink: processCommand() dispatchAgentFlow entegrasyonu â€” satÄ±ÅŸ, kasa gelir/gider, cari tahsilat komutlarÄ± artÄ±k agent sistemi Ã¼zerinden iÅŸlenir',
      },
    ],
  },
  {
    version: '3.10.6',
    date: '2 Haziran 2026',
    title: 'QuantumLink Aktif',
    summary: 'Sesli AI asistan paneli arayÃ¼ze eklendi.',
    changes: [{ type: 'duzeltme', text: "QuantumLink bileÅŸeni App.tsx'e eklendi, FAB ile Ã§akÄ±ÅŸmadan Ã§alÄ±ÅŸÄ±r" }],
  },
  {
    version: '3.10.5',
    date: '31 MayÄ±s 2026',
    title: 'UI DÃ¼zeltmeleri + Dashboard Widget YÃ¶netimi',
    summary:
      "Dashboard stat card renkleri dÃ¼zeltildi (eski !important hatasÄ±). Widget yÃ¶netimi ve parlaklÄ±k kontrolÃ¼ Settings'e gerÃ§ek kontrollerle eklendi. Sidebar logosu iyileÅŸtirildi, yedek butonu eski gÃ¶rÃ¼nÃ¼r stiline dÃ¶ndÃ¼.",
    changes: [
      {
        type: 'duzeltme',
        text: 'Dashboard: .dash-statcard-value !important kaldÄ±rÄ±ldÄ± â€” istatistik kart renkleri (gelir/kÃ¢r/stok) artÄ±k doÄŸru gÃ¶sterilir',
      },
      {
        type: 'iyilestirme',
        text: 'Settings > Dashboard DÃ¼zenleme: widget aÃ§/kapa, sÄ±ralama ve parlaklÄ±k ayarÄ± eklendi',
      },
      { type: 'iyilestirme', text: 'Sidebar: "P" logo yerine lucide-react Sparkles ikonu kullanÄ±ldÄ±' },
      { type: 'iyilestirme', text: 'Header: yedek butonu tekrar info renginde gÃ¶rÃ¼nÃ¼r hale getirildi' },
    ],
  },
  {
    version: '3.10.4',
    date: '31 MayÄ±s 2026',
    title: 'Login EkranÄ± Modernizasyonu + exceljs â†’ xlsx GeÃ§iÅŸi',
    summary:
      'Login ekranÄ± lucide-react ikonlara geÃ§irildi, demo hesapla tek tÄ±kla giriÅŸ butonu eklendi. exceljs kaldÄ±rÄ±ldÄ±, yerine xlsx (SheetJS) kullanÄ±lÄ±yor â€” gÃ¼venlik aÃ§Ä±klarÄ± Ã§Ã¶zÃ¼ldÃ¼, bundle kÃ¼Ã§Ã¼ldÃ¼.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'LoginScreen: emoji ikonlar lucide-react bileÅŸenlerle deÄŸiÅŸtirildi (User, Lock, Eye, LogIn, Sparkles vb.)',
      },
      {
        type: 'yeni',
        text: 'LoginScreen: "Demo Hesap ile HÄ±zlÄ± GiriÅŸ" butonu eklendi â€” tek tÄ±kla demo29605 oturumu aÃ§ar',
      },
      {
        type: 'iyilestirme',
        text: 'LoginScreen: mobil responsive dÃ¼zen (kÃ¼Ã§Ã¼k ekran padding/font-size iyileÅŸtirmesi)',
      },
      { type: 'iyilestirme', text: 'LoginScreen: Firebase baÄŸlanÄ±rken skeleton loading gÃ¶sterimi' },
      {
        type: 'iyilestirme',
        text: 'appConfig: APP_NAME/APP_SUBTITLE/APP_DEFAULT_VERSION â†’ centralized brand config (src/config/brand.ts)',
      },
      {
        type: 'kaldirildi',
        text: 'exceljs baÄŸÄ±mlÄ±lÄ±ÄŸÄ± kaldÄ±rÄ±ldÄ± (3.10.0) â€” gÃ¼venlik aÃ§Ä±klarÄ± ve bakÄ±m sorunlarÄ± nedeniyle',
      },
      {
        type: 'iyilestirme',
        text: 'safeXlsx.ts: exceljs API â†’ xlsx (SheetJS) API dÃ¶nÃ¼ÅŸÃ¼mÃ¼ â€” readSafeWorkbook, downloadObjectSheetsAsXlsx, downloadAoASheetsAsXlsx yeniden yazÄ±ldÄ±',
      },
      { type: 'iyilestirme', text: 'xlsx@0.18.5 eklendi â€” daha hafif, bakÄ±mÄ± aktif (exceljs 1MB â†’ xlsx 424KB)' },
      {
        type: 'iyilestirme',
        text: 'vite.config.ts: exceljs referanslarÄ± temizlendi (commonjsOptions.ignore, optimizeDeps.include)',
      },
      {
        type: 'duzeltme',
        text: 'pnpm audit gÃ¼venlik aÃ§Ä±klarÄ± Ã§Ã¶zÃ¼ldÃ¼ (tmp path traversal) â€” exceljs kalktÄ±ÄŸÄ± iÃ§in otomatik kapandÄ±',
      },
      { type: 'kaldirildi', text: 'package.json pnpm.overrides (tmp>=0.2.6) kaldÄ±rÄ±ldÄ± â€” artÄ±k gerek yok' },
    ],
  },
  {
    version: '3.10.3',
    date: '30 MayÄ±s 2026',
    title: 'Marka BirliÄŸi + UI/UX TutarlÄ±lÄ±k GeÃ§iÅŸi',
    summary:
      'Brand adÄ±, sÃ¼rÃ¼m kaynaÄŸÄ±, tarih/para lokalizasyonu ve temel dashboard/header/sidebar deneyimi tekilleÅŸtirildi. Production gÃ¶rÃ¼nÃ¼m iÃ§in toast ve dÃ¼zenleme kontrolleri sadeleÅŸtirildi.',
    changes: [
      { type: 'duzeltme', text: 'Tek brand adÄ± PARSPEL olarak login, sidebar ve toast yÃ¼zeylerinde birleÅŸtirildi' },
      { type: 'duzeltme', text: 'SÃ¼rÃ¼m bilgisi Vite define Ã¼zerinden package.json ile senkron hale getirildi' },
      { type: 'iyilestirme', text: 'Tarih ve para gÃ¶sterimleri ortak formatter yardÄ±mcÄ±larÄ±na taÅŸÄ±ndÄ±' },
      {
        type: 'iyilestirme',
        text: 'Dashboard dÃ¼zenleme kontrolleri gÃ¶rÃ¼nÃ¼mden ayrÄ±larak production gÃ¶rÃ¼nÃ¼mÃ¼ sadeleÅŸtirildi',
      },
    ],
  },
  {
    version: '3.10.2',
    date: '30 MayÄ±s 2026',
    title: 'Build Fix â€” Spec ModÃ¼lÃ¼ Node.js/Browser AyrÄ±ÅŸtÄ±rmasÄ±',
    summary:
      "Spec rule dosyalarÄ± (component-rules, data-rules, error-rules, navigation-rules, test-rules) browser build'de node:fs/node:path import hatasÄ± veriyordu. Browser-safe index.ts ve Node.js runner.ts olarak ikiye ayrÄ±ldÄ±. CI quality-gate (lint â†’ typecheck â†’ test â†’ build) artÄ±k baÅŸarÄ±yla geÃ§iyor.",
    changes: [
      {
        type: 'iyilestirme',
        text: "src/lib/specs/: browser-safe index.ts ve Node.js runner.ts olarak ayrÄ±ldÄ± â€” build'de node:fs external hatasÄ± giderildi",
      },
      { type: 'duzeltme', text: 'SpecDashboard: SpecCard ruleCount â†’ count prop adÄ± dÃ¼zeltildi (TS hatasÄ±)' },
    ],
  },
  {
    version: '3.10.1',
    date: '30 MayÄ±s 2026',
    title: "Tema/Contrast DÃ¼zeltmeleri â€” Hardcoded Renkler CSS Variable'a DÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼",
    summary:
      '30+ sayfada hardcoded renkler CSS variable referanslarÄ±na dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼. AI Asistan, Dashboard, Kasa, Stock, Products, Sales, Reports, Fatura ve 20+ sayfada kontrast sorunlarÄ± giderildi. Light/dark tema geÃ§iÅŸlerinde okunamayan yazÄ± sorunu Ã§Ã¶zÃ¼ldÃ¼.',
    changes: [
      {
        type: 'iyilestirme',
        text: 'AIAsistan: mesaj metin/sourceLabel/onay kartÄ± renkleri hardcoded â†’ CSS variable',
      },
      {
        type: 'iyilestirme',
        text: 'DashboardOperasyon/Ticaret: sabit dark/light renk sabitleri â†’ var(--text-primary)/var(--bg-card)',
      },
      {
        type: 'iyilestirme',
        text: '18 sayfada #f1f5f9, #e2e8f0 text rengi â†’ var(--text-primary) (Sales, Reports, Fatura, Bank, Stock, Products, Kasa, Cizelge, Suppliers, Pelet, Partners, Notlar, Monitor, ConsoleKayit, Cari, Butce, ExcelImport, BugHunter, Perf, Entegrasyonlar)',
      },
      {
        type: 'iyilestirme',
        text: 'Kasa/Stock/Products/Pelet: #1e293b arkaplan â†’ var(--bg-card), #334155 border â†’ var(--border)',
      },
      {
        type: 'iyilestirme',
        text: '#94a3b8 â†’ var(--text-dim), #64748b â†’ var(--text-muted), #475569 â†’ var(--text-secondary) toplu dÃ¶nÃ¼ÅŸÃ¼m',
      },
      { type: 'iyilestirme', text: 'Settings: #fff arkaplanlar â†’ var(--bg-elevated) (dark mod uyumu)' },
      {
        type: 'iyilestirme',
        text: "Dashboard grafik: chart label/axis/dot renkleri CSS variable'a dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼",
      },
      {
        type: 'iyilestirme',
        text: "AIAsistan: Markdown baÅŸlÄ±k/sourceLabel renkleri CSS variable'a dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼ (#ff7043â†’var(--accent))",
      },
      {
        type: 'kaldirildi',
        text: 'Settings/ArayÃ¼z: Ã–zel Renk SeÃ§imi (accent/bgBase renk seÃ§ici) kaldÄ±rÄ±ldÄ± â€” sadece temalar kaldÄ±',
      },
    ],
  },
  {
    version: '3.10.0',
    date: '30 MayÄ±s 2026',
    title: 'Konsol Kaydedici + Lint/TypeScript TemizliÄŸi',
    summary:
      'DevTools konsol Ã§Ä±ktÄ±larÄ±nÄ± otomatik kaydeden sistem, 13 lint hatasÄ± + 48 uyarÄ± sÄ±fÄ±rlandÄ±, ESLint konfigÃ¼rasyonu iyileÅŸtirildi.',
    changes: [
      {
        type: 'yeni',
        text: "Konsol Kaydedici (consoleRecorder) â€” tÃ¼m console.log/warn/error/info/debug Ã§aÄŸrÄ±larÄ±nÄ± localStorage'a kaydeder, canlÄ± abonelik, dÄ±ÅŸa aktarÄ±m",
      },
      {
        type: 'yeni',
        text: 'ConsoleKayit sayfasÄ± â€” kayÄ±tlÄ± konsol Ã§Ä±ktÄ±larÄ±nÄ± canlÄ± izleme, seviye/metin filtresi, detay paneli, JSON export',
      },
      {
        type: 'yeni',
        text: 'Unified Version Sistemi (src/lib/version.ts) â€” getAppVersion(), isVersionGte(), getVersionInfo() ile tÃ¼m sayfalarda tek versiyon kaynaÄŸÄ±',
      },
      {
        type: 'duzeltme',
        text: 'QuantumLink.tsx: 6 adet any tip kaldÄ±rÄ±ldÄ±, SpeechRecognition interface eklendi, processCommand useCallback ile sarÄ±ldÄ±',
      },
      {
        type: 'duzeltme',
        text: "Fatura.tsx: 3 adet any type cast proper union type'a Ã§evrildi (filter, payment, status)",
      },
      {
        type: 'duzeltme',
        text: 'Settings.tsx: @ts-ignore â†’ @ts-expect-error, kullanÄ±lmayan import/deÄŸiÅŸkenler temizlendi',
      },
      {
        type: 'duzeltme',
        text: '20+ dosyada kullanÄ±lmayan deÄŸiÅŸken/import temizliÄŸi, eksik hook dependency dÃ¼zeltmeleri',
      },
      { type: 'duzeltme', text: 'package.json, appConfig.ts, changelog.ts versiyonlarÄ± senkronize edildi' },
      {
        type: 'yeni',
        text: 'Versiyon tutarlÄ±lÄ±k testi (version-consistency.test.ts) â€” 5 test: package.json â†” changelog â†” APP_DEFAULT_VERSION â†” sÄ±ralama',
      },
      { type: 'iyilestirme', text: 'AGENTS.md dosyalarÄ±na versiyon sistemi kurallarÄ± eklendi' },
      {
        type: 'yeni',
        text: 'docs/TEST_STRATEJISI.md â€” test piramidi, patternler, CI entegrasyonu, coverage hedefleri',
      },
      {
        type: 'yeni',
        text: 'docs/VERI_KATMANI.md â€” depolama hiyerarÅŸisi, save pipeline, Firebase sync, backup stratejisi',
      },
      {
        type: 'yeni',
        text: 'docs/HATA_DURUMLARI.md â€” loading/empty/error state standardÄ±, toast/ErrorBoundary kurallarÄ±',
      },
      {
        type: 'yeni',
        text: 'docs/BILESEN_MIMARISI.md â€” bileÅŸen tÃ¼rleri, stil/import kurallarÄ±, state kaldÄ±rma patterni',
      },
      {
        type: 'yeni',
        text: 'docs/NAVIGASYON.md â€” route yapÄ±sÄ±, tab sistemi, lazy loading, route ekleme prosedÃ¼rÃ¼',
      },
      {
        type: 'iyilestirme',
        text: 'docs/README.md â€” yeni spec listesi ve geliÅŸtirici baÅŸlangÄ±Ã§ sÄ±rasÄ± eklendi',
      },
      {
        type: 'yeni',
        text: 'src/lib/specs/ â€” dinamik spec rule engine (types, component, error, nav, data, test rules)',
      },
      {
        type: 'yeni',
        text: 'src/__tests__/spec-compliance.test.ts â€” 13 spec kuralÄ± iÃ§in otomatik compliance testi',
      },
      { type: 'yeni', text: 'src/pages/SpecDashboard.tsx â€” canlÄ± spec durumu sayfasÄ± (Sistem > Spec)' },
      {
        type: 'iyilestirme',
        text: 'package.json â€” test:specs scripti eklendi (vitest run .../spec-compliance.test.ts)',
      },
      { type: 'duzeltme', text: 'spec compliance â€” __tests__ relative importlarÄ± @/ alias ile deÄŸiÅŸtirildi' },
      {
        type: 'duzeltme',
        text: "spec compliance â€” shadcn/ui bÃ¼yÃ¼k dosyalarÄ± allowlist'e eklendi (sidebar, chart, carousel vb.)",
      },
      {
        type: 'duzeltme',
        text: "spec compliance â€” localStorage kurallarÄ± daraltÄ±ldÄ± (sadece sobaYonetim key'ini denetler)",
      },
      {
        type: 'duzeltme',
        text: 'spec compliance â€” inline-style, empty-import, toast-pattern info seviyesine dÃ¼ÅŸÃ¼rÃ¼ldÃ¼',
      },
      { type: 'duzeltme', text: 'spec compliance â€” compliance testi info/warn/error katmanlÄ± hale getirildi' },
      {
        type: 'iyilestirme',
        text: "eslint.config.js: varsIgnorePattern eklendi, react-refresh ui/* ve shared component'lerde kapatÄ±ldÄ±",
      },
      { type: 'iyilestirme', text: 'tabs.ts: boÅŸ catch bloÄŸuna void 0 eklendi (no-empty)' },
    ],
  },
  {
    version: '3.9.0',
    date: '29 MayÄ±s 2026',
    title: 'GÃ¼venlik DÃ¼zeltmeleri + QuantumLink Yeniden TasarÄ±mÄ±',
    summary:
      'XSS korumasÄ± (DOMPurify), CSP meta tag, document.write kaldÄ±rma, QuantumLink temasÄ± seÃ§ilebilir hale getirildi.',
    changes: [
      {
        type: 'yeni',
        text: 'DOMPurify entegrasyonu â€” dangerouslySetInnerHTML Ã¶nÃ¼ne sanitization eklendi (AIAsistan, excelmerge/ai-asistan)',
      },
      {
        type: 'yeni',
        text: 'CSP (Content-Security-Policy) meta tag eklendi â€” script-src, style-src, connect-src tanÄ±mlÄ±',
      },
      {
        type: 'yeni',
        text: "QuantumLink tema paletleri: 3 seÃ§enek (Mavi, Amber, YeÅŸil) â€” localStorage'a kaydediliyor",
      },
      {
        type: 'iyilestirme',
        text: 'Fatura.tsx document.write() â†’ DOMPurify.sanitize + esc() ile gÃ¼venli HTML oluÅŸturma',
      },
      {
        type: 'iyilestirme',
        text: 'Kasa.tsx document.write() â†’ DOMPurify.sanitize + esc() ile gÃ¼venli HTML oluÅŸturma',
      },
      { type: 'iyilestirme', text: 'QuantumLink trigger butonu tema rengiyle uyumlu gradient kullanÄ±yor' },
      { type: 'iyilestirme', text: 'QuantumLink mesaj balonlarÄ± tema rengiyle uyumlu' },
      { type: 'duzeltme', text: "QuantumLink input butonu sabit beyaz yerine tema gradient'i kullanÄ±yor" },
      {
        type: 'duzeltme',
        text: 'UTF-8 encoding: AIAsistan/Cari/BugHunter sayfalarÄ±nda U+FFFD bozuk karakterler dÃ¼zeltildi',
      },
      { type: 'duzeltme', text: 'UTF-8 BOM kaldÄ±rÄ±ldÄ± (Fatura, Cari, BugHunter TSX + 2 CSS dosyasÄ±)' },
      { type: 'duzeltme', text: 'TÃ¼m .ts/.tsx dosyalarÄ± CRLF â†’ LF normalize edildi (172 dosya)' },
      { type: 'duzeltme', text: 'TypeScript derleme hatalarÄ± giderildi (Stock/Kasa/DashboardFinans/types/index)' },
      { type: 'iyilestirme', text: '.gitattributes eklendi â€” LF + UTF-8 working-tree-encoding zorlamasÄ±' },
      {
        type: 'iyilestirme',
        text: 'PowerShell UTF-8 code page (65001) yapÄ±landÄ±rmasÄ± â€” TÃ¼rkÃ§e karakter gÃ¶rÃ¼ntÃ¼leme',
      },
    ],
  },
  {
    version: '3.8.0',
    date: '29 MayÄ±s 2026',
    title: 'DokÃ¼man TemizliÄŸi + GeliÅŸtirici Deneyimi',
    summary:
      'TÃ¼m MD dosyalarÄ± yeniden yapÄ±landÄ±rÄ±ldÄ±, 12 yeni geliÅŸtirici aracÄ± eklendi, duplicate dosyalar temizlendi.',
    changes: [
      { type: 'yeni', text: '.editorconfig â€” editÃ¶rler arasÄ± tutarlÄ± kodlama standardÄ±' },
      { type: 'yeni', text: '.prettierrc + .prettierignore â€” proje seviyesinde Prettier konfigÃ¼rasyonu' },
      { type: 'yeni', text: '.nvmrc â€” Node 22 sÃ¼rÃ¼m sabitleme' },
      { type: 'yeni', text: 'LICENSE (MIT) â€” resmi lisans dosyasÄ±' },
      { type: 'yeni', text: 'CONTRIBUTING.md â€” katkÄ± rehberi, branÅŸ modeli, commit kurallarÄ±' },
      { type: 'yeni', text: "DEVELOPMENT.md â€” teknik geliÅŸtirme rehberi, mimari, pattern'ler" },
      { type: 'yeni', text: "CHANGELOG.md â€” root'da GitHub Releases iÃ§in standart changelog" },
      { type: 'yeni', text: '.github/ISSUE_TEMPLATE â€” hata bildirimi ve Ã¶zellik Ã¶nerisi ÅŸablonlarÄ±' },
      { type: 'yeni', text: '.github/PULL_REQUEST_TEMPLATE.md â€” PR checklist' },
      { type: 'yeni', text: 'docs/README.md â€” dokÃ¼man indeksi' },
      { type: 'yeni', text: 'WEEKLY_PLAN.md â€” 6 haftalÄ±k iyileÅŸtirme planÄ±' },
      { type: 'iyilestirme', text: "quality-gate.yml â€” CI pipeline'a lint adÄ±mÄ±nÄ± eklendi" },
      { type: 'iyilestirme', text: 'package.json â€” engines alanÄ±, prettier devDep, format scriptleri' },
      {
        type: 'iyilestirme',
        text: 'SYSTEM_CONTEXT.md 5 parÃ§aya bÃ¶lÃ¼ndÃ¼ (docs/VERI_MODELI, KULLANICI_SENARYOLARI, API_SERVIS, AGENT_SISTEMI, UI_UX)',
      },
      { type: 'iyilestirme', text: 'FIGMA-README + FIGMA-SETUP-GUIDE tek docs/FIGMA.md dosyasÄ±nda birleÅŸtirildi' },
      { type: 'iyilestirme', text: 'AGENTS.md dosyalarÄ± gÃ¼ncellendi (doÄŸru sayfa/bileÅŸen/hook sayÄ±larÄ±)' },
      { type: 'iyilestirme', text: 'README.md referans tablosu gÃ¼ncellendi' },
      { type: 'kaldirildi', text: 'Untitled-1.md silindi (4 kez tekrarlanmÄ±ÅŸ duplicate rapor)' },
      { type: 'kaldirildi', text: 'Teknik Analiz ve Ä°yileÅŸtir.md silindi (duplicate)' },
      {
        type: 'iyilestirme',
        text: 'Root temizliÄŸi: 5 Ã§Ã¶p dosyasÄ± silindi (Yeni Metin Belgesi, PROJECT_ANALYSIS_SUMMARY, console-logs)',
      },
      { type: 'iyilestirme', text: 'scripts/ temizliÄŸi: 14 eski script ve 4 PNG silindi, kalan 7 script korundu' },
      { type: 'iyilestirme', text: '.gitignore geniÅŸletildi: console-logs.txt, *.png, .kiro/, .sixth/ eklendi' },
      { type: 'iyilestirme', text: "PARSPEL_MASTER_PROJE_DOKUMANI.txt ve figma.json â†’ docs/'e taÅŸÄ±ndÄ±" },
      { type: 'iyilestirme', text: "__audit_login.mjs â†’ scripts/'e taÅŸÄ±ndÄ±" },
      { type: 'kaldirildi', text: 'figma.config.ts silindi (Ã¶lÃ¼ kod â€” @figma/code-connect kurulu deÄŸil)' },
      { type: 'duzeltme', text: '.npmrc iÃ§eriÄŸi eklendi (shamefully-hoist, strict-peer-dependencies)' },
      { type: 'duzeltme', text: 'opencode.json versiyonu 3.2.0 â†’ 3.8.0 olarak gÃ¼ncellendi' },
    ],
  },
  {
    version: '3.7.0',
    date: '28 MayÄ±s 2026',
    title: 'Premium Tema Sistemi + CSS Tokenizasyonu',
    summary:
      '3 premium tema (Corporate Enterprise, Modern Dark, Elegant Light), CSS variable token sistemi, layout bileÅŸen ayrÄ±ÅŸtÄ±rmasÄ±, tÃ¼m dashboard ve settings sayfalarÄ±nda hardcoded renkler CSS var ile deÄŸiÅŸtirildi.',
    changes: [
      {
        type: 'yeni',
        text: 'Premium tema sistemi: 3 tema (Corporate Enterprise, Modern Dark, Elegant Light), runtime switching, localStorage persistence',
      },
      {
        type: 'yeni',
        text: 'ThemeProvider + useTheme hook â€” React context ile tema yÃ¶netimi, geriye uyumlu sobaUI:updated event dinleme',
      },
      {
        type: 'yeni',
        text: 'CSS variable token sistemi (OKLCH): 40+ premium deÄŸiÅŸken (gÃ¶lgeler, glassmorphism, gradient, easing, renk skalasÄ± 50-900)',
      },
      {
        type: 'iyilestirme',
        text: 'App.tsx 1613â†’600 satÄ±ra dÃ¼ÅŸÃ¼rÃ¼ldÃ¼: 7 layout bileÅŸeni ayrÄ±ldÄ± (Sidebar, Header, GlobalSearch, UserMenu, ReportButton, FAB, AIDrawer)',
      },
      {
        type: 'iyilestirme',
        text: "Tab konfigÃ¼rasyonu src/config/tabs.ts'e taÅŸÄ±ndÄ± â€” tÃ¼m layout bileÅŸenleri ortak kullanÄ±yor",
      },
      {
        type: 'iyilestirme',
        text: 'Dashboard (5 sayfa): 200+ hardcoded hex/rgba renk CSS variable referanslarÄ±na dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼',
      },
      { type: 'iyilestirme', text: "Settings.tsx: 150+ inline style rengi CSS variable'a dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼" },
      {
        type: 'iyilestirme',
        text: 'SystemMap: tÃ¼m dÃ¼ÄŸÃ¼m/kenar renkleri CSS variable tokenlarÄ±na dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼',
      },
      { type: 'iyilestirme', text: 'Products.tsx: derleme hatasÄ± giderildi (Ã§ift state tanÄ±mÄ±, eksik filter)' },
      { type: 'duzeltme', text: 'index.css: premium tema deÄŸiÅŸkenleri, spacing ve tipografi skalasÄ± eklendi' },
    ],
  },
  {
    version: '3.6.0',
    date: '26 MayÄ±s 2026',
    title: 'Faz 2 Ã–ncelik 4 + Faz 3 Performans',
    summary: 'TedarikÃ§i performans skoru, rapor oluÅŸturucu, arama debounce, suppliers performans metriÄŸi.',
    changes: [
      {
        type: 'yeni',
        text: 'Suppliers performans skoru: teslimat sÃ¼resi, sipariÅŸ adedi ve toplam tutara gÃ¶re aÄŸÄ±rlÄ±klÄ± puan, renk kodlu gÃ¶sterge',
      },
      {
        type: 'yeni',
        text: 'Raporlar Ã¶zel rapor oluÅŸturucu: stok/cari/kasa/satÄ±ÅŸ modÃ¼l seÃ§imi, tablo/grafik gÃ¶rÃ¼nÃ¼mÃ¼, Excel Ã§Ä±ktÄ±sÄ±',
      },
      {
        type: 'iyilestirme',
        text: 'Arama inputlarÄ± debounce: Products/Cari/Suppliers sayfalarÄ±nda 200ms gecikmeli arama, anlÄ±k filtre yerine performanslÄ± filtreleme',
      },
    ],
  },
  {
    version: '3.5.0',
    date: '26 MayÄ±s 2026',
    title: 'Faz 2 Ã–ncelik 3 â€” Ä°ÅŸlevsel Ä°yileÅŸtirmeler',
    summary:
      'Toplu fiyat gÃ¼ncelleme, anlÄ±k kÃ¢r gÃ¶stergesi, PDF fatura, mÃ¼ÅŸteri segmentasyonu, CSV banka yÃ¼kleme+AI eÅŸleme, pelet tÃ¼ketim sayacÄ±, kural editÃ¶rÃ¼ iyileÅŸtirmeleri, bÃ¼tÃ§e kopyalama ve not baÄŸlama.',
    changes: [
      { type: 'yeni', text: 'Products toplu fiyat gÃ¼ncelleme: % zam/indirim, kategori filtre, Ã¶nizleme tablosu' },
      {
        type: 'yeni',
        text: 'Sales anlÄ±k kÃ¢r gÃ¶stergesi: her Ã¼rÃ¼n satÄ±rÄ±nda (birimFiyat - maliyet) Ã— miktar, toplam kÃ¢r/maliyet oranÄ±',
      },
      {
        type: 'yeni',
        text: 'Fatura PDF yazdÄ±rma: ÅŸirket bilgileri, VKN, kalem detaylarÄ±, KDV dÃ¶kÃ¼mÃ¼ ile yeni pencere PDF Ã§Ä±ktÄ±sÄ±',
      },
      {
        type: 'yeni',
        text: 'Cari mÃ¼ÅŸteri segmentasyonu: VIP (>50K bakiye), Normal, Riskli (<-10K) badge ve renk kodlarÄ±',
      },
      {
        type: 'yeni',
        text: 'Banka CSV yÃ¼kleme: otomatik sÃ¼tun algÄ±lama (tarih/aÃ§Ä±klama/tutar/tÃ¼r), toplu iÅŸlem ekleme',
      },
      { type: 'yeni', text: 'Banka AI eÅŸleme: cari adÄ± ve kelime kesiÅŸimi ile otomatik eÅŸleÅŸtirme motoru' },
      { type: 'yeni', text: 'Pelet tÃ¼ketim sayacÄ±: gÃ¼nlÃ¼k/aylÄ±k kg tÃ¼ketim, Ã§uval stoÄŸu, kalan gÃ¼n tahmini' },
      {
        type: 'iyilestirme',
        text: 'Monitor kural editÃ¶rÃ¼: stok_min/alacak/borÃ§ eÅŸik deÄŸerleri, popup ve aktif toggle eklendi',
      },
      { type: 'yeni', text: 'Butce bÃ¼tÃ§e kopyalama: mevcut kategorileri yeni yÄ±la kopyalama' },
      {
        type: 'yeni',
        text: 'Notlar not baÄŸlama: cari/Ã¼rÃ¼n/satÄ±ÅŸ baÄŸlantÄ±sÄ± seÃ§ici, baÄŸlÄ± entity gÃ¶rÃ¼ntÃ¼leme',
      },
    ],
  },
  {
    version: '3.4.0',
    date: '26 MayÄ±s 2026',
    title: 'Faz 2 Ã–ncelik 1+2 â€” Kritik Ä°ÅŸlevler & Dashboard Ä°yileÅŸtirmeleri',
    summary:
      'Kasa gÃ¼n sonu sayÄ±m, Ã§izelge 7 gÃ¼n paneli, stok ABC analizi+Ã¶lÃ¼ stok, saÄŸlÄ±k skoru gauge, alacak yaÅŸlandÄ±rma, Ä±sÄ± haritasÄ±, kritiklik widget ve sezonsallÄ±k grafiÄŸi eklendi.',
    changes: [
      {
        type: 'yeni',
        text: 'Kasa gÃ¼n sonu sayÄ±m formu: fiziki/sistem bakiye karÅŸÄ±laÅŸtÄ±rmasÄ±, renk kodlu fark gÃ¶stergesi, PDF yazdÄ±rma',
      },
      {
        type: 'yeni',
        text: 'Ã‡izelge yaklaÅŸan 7 gÃ¼n paneli: fatura vade, sipariÅŸ teslim, alacak tahsilat takvimi renk kodlu',
      },
      { type: 'yeni', text: 'Stok ABC analizi: A=%80, B=%15, C=%5 segmentasyonu, kÃ¼mÃ¼latif ciro grafiÄŸi' },
      { type: 'yeni', text: 'Stok Ã¶lÃ¼ stok tespiti: 90+ gÃ¼n hareketsiz Ã¼rÃ¼nler, baÄŸlÄ± sermaye hesaplamasÄ±' },
      {
        type: 'yeni',
        text: 'Anomali saÄŸlÄ±k skoru gauge: PieChart ile yarÄ±m Ã§ember gÃ¶sterge, 30 gÃ¼nlÃ¼k trend grafiÄŸi',
      },
      {
        type: 'yeni',
        text: 'DashboardFinans alacak yaÅŸlandÄ±rma: 0-30/31-60/61-90/90+ gÃ¼n renk kodlu kartlar ve mÃ¼ÅŸteri detay tablosu',
      },
      { type: 'yeni', text: 'DashboardTicaret Ä±sÄ± haritasÄ±: saatÃ—gÃ¼n satÄ±ÅŸ yoÄŸunluÄŸu grid gÃ¶rseli' },
      {
        type: 'yeni',
        text: 'DashboardOperasyon bugÃ¼n sipariÅŸ listesi: aciliyet skoruna gÃ¶re sÄ±ralÄ± yeniden sipariÅŸ Ã¶nerileri',
      },
      {
        type: 'yeni',
        text: 'DashboardStrateji sezonsallÄ±k analizi: 12 aylÄ±k ortalama+mevsim katsayÄ±sÄ±, 3 aylÄ±k nakit akÄ±ÅŸÄ± tahmini',
      },
    ],
  },
  {
    version: '3.3.0',
    date: '26 MayÄ±s 2026',
    title: 'Faz 1 Yeni Detay SayfalarÄ±',
    summary:
      'ÃœrÃ¼n, satÄ±ÅŸ, cari, ortak emanet ve AI aksiyon gÃ¼nlÃ¼ÄŸÃ¼ iÃ§in Faz 1 kapsamÄ±ndaki yeni UI sayfalarÄ± eklendi.',
    changes: [
      {
        type: 'yeni',
        text: '/urunler/:id Ã¼rÃ¼n detay sayfasÄ± eklendi: stok hareketleri, satÄ±ÅŸ kÃ¢r analizi ve minimum stok eÅŸiÄŸi yÃ¶netimi',
      },
      {
        type: 'yeni',
        text: '/satis/:id satÄ±ÅŸ detay sayfasÄ± eklendi: baÄŸlÄ± Ã¼rÃ¼nler, kasa, fatura, stok ve denetim izi gÃ¶rÃ¼nÃ¼mÃ¼',
      },
      {
        type: 'yeni',
        text: '/cari/:id cari ekstre sayfasÄ± eklendi: kronolojik iÅŸlem dÃ¶kÃ¼mÃ¼, bakiye trendi ve gecikmiÅŸ taksit uyarÄ±larÄ±',
      },
      {
        type: 'yeni',
        text: '/ortak-emanet sayfasÄ± eklendi: emanet/iade kayÄ±tlarÄ± kasa ve ortak cari bakiyesiyle birlikte iÅŸlenir',
      },
      {
        type: 'yeni',
        text: '/ai/eylem-log sayfasÄ± ve aiActionLog kaydÄ± eklendi: AI aksiyonlarÄ±, risk etiketi ve geri alma akÄ±ÅŸÄ± izlenir',
      },
    ],
  },
  {
    version: '3.2.0',
    date: '26 MayÄ±s 2026',
    title: 'Performans Ä°yileÅŸtirmeleri & PWA Aktivasyonu',
    summary:
      "Ana JS bundle'Ä± %43 kÃ¼Ã§Ã¼ltÃ¼ldÃ¼ (433KB â†’ 245KB). Firebase SDK ayrÄ± chunk'a taÅŸÄ±ndÄ±. PWA (Service Worker + manifest) aktifleÅŸtirildi. Build yapÄ±landÄ±rmasÄ± optimize edildi.",
    changes: [
      {
        type: 'iyilestirme',
        text: "manualChunks: Firebase SDK ayrÄ± chunk'a taÅŸÄ±ndÄ± (163KB) â€” ana bundle 433KB'den 245KB'ye dÃ¼ÅŸtÃ¼ (%43 azalma)",
      },
      { type: 'iyilestirme', text: "manualChunks: sonner (toast) ayrÄ± `ui` chunk'Ä±na taÅŸÄ±ndÄ± (34KB)" },
      {
        type: 'iyilestirme',
        text: 'PWA reactivasyon: Service Worker + manifest + workbox ile 53 asset precache, offline navigasyon desteÄŸi',
      },
      {
        type: 'iyilestirme',
        text: 'PWA runtime caching: Google Fonts (CacheFirst, 1 yÄ±l) ve Firebase API (NetworkOnly) eklendi',
      },
      {
        type: 'iyilestirme',
        text: 'README.md: "Build & Performans" bÃ¶lÃ¼mÃ¼ eklendi â€” chunk tablosu ve PWA durumu',
      },
    ],
  },
  {
    version: '3.1.0',
    date: '21 MayÄ±s 2026',
    title: 'KararlÄ± SÃ¼rÃ¼m HazÄ±rlÄ±ÄŸÄ± â€” Android Manifest & Ä°zinler',
    summary:
      "Android manifest eksik izinler tamamlandÄ±, launcher/bildirim ikonlarÄ± oluÅŸturuldu, Capacitor config production-safe yapÄ±ldÄ±, tema renkleri app'e uyarlandÄ±. Versiyon 3.1.0.",
    changes: [
      { type: 'yeni', text: "RECORD_AUDIO, WAKE_LOCK, RECEIVE_BOOT_COMPLETED izinleri AndroidManifest'e eklendi" },
      { type: 'yeni', text: 'Android launcher ikonlarÄ± â€” adaptif XML + 5 boyut PNG (API 24+)' },
      { type: 'yeni', text: 'Bildirim ikonu â€” ic_stat_icon_config_sample.xml (zil silÃ¼eti)' },
      { type: 'iyilestirme', text: 'capacitor.config.ts â€” dev URL temizlendi, cleartext:false, production-safe' },
      { type: 'iyilestirme', text: 'colors.xml / themes.xml â€” app koyu temasÄ±na uyarlandÄ± (#0f172a)' },
      { type: 'iyilestirme', text: 'READ/WRITE_EXTERNAL_STORAGE eklendi (maxSdkVersion=32)' },
      { type: 'iyilestirme', text: 'build.gradle â€” versionName 3.1.0 (package.json ile senkron)' },
    ],
  },
  {
    version: '3.0.0',
    date: '9 MayÄ±s 2026',
    title: 'Release v3.0.0',
    summary:
      'Multi-agent orkestrasyonu, IndexedDB snapshot dayanÄ±klÄ±lÄ±ÄŸÄ± ve AI aksiyon fallback akÄ±ÅŸÄ± eklendi. CanlÄ± sÃ¼rÃ¼m gÃ¶rÃ¼nÃ¼rlÃ¼ÄŸÃ¼ iyileÅŸtirildi.',
    changes: [
      { type: 'yeni', text: 'Multi-agent altyapÄ±sÄ±: bus, base agent, registry ve orchestrator eklendi' },
      { type: 'yeni', text: 'Dexie tabanlÄ± IndexedDB snapshot yazma/geri yÃ¼kleme akÄ±ÅŸÄ± eklendi' },
      { type: 'iyilestirme', text: 'AI asistan aksiyonlarÄ±nda fail-soft fallback zinciri uygulandÄ±' },
      { type: 'iyilestirme', text: 'GiriÅŸ ekranÄ± sÃ¼rÃ¼m etiketi v3.0.0 olarak gÃ¶rÃ¼nÃ¼r hale getirildi' },
      {
        type: 'duzeltme',
        text: 'Anomali motorunda strict TypeScript uyumu iÃ§in tip gÃ¼venliÄŸi dÃ¼zeltmeleri yapÄ±ldÄ±',
      },
    ],
  },
  {
    version: '2.9.0',
    date: '4 MayÄ±s 2026',
    title: 'Quantum Link AI Panel & Kod Kalitesi',
    summary:
      'Quantum Link floating AI paneli eklendi. Android izinleri geniÅŸletildi. ESLint kuruldu, 14 kod hatasÄ± giderildi. TypeScript tip hatalarÄ± dÃ¼zeltildi. AÃ§Ä±k temalar kaldÄ±rÄ±ldÄ±.',
    changes: [
      { type: 'yeni', text: 'Quantum Link â€” her sayfadan eriÅŸilebilir floating AI panel (BrainCircuit ikonu)' },
      { type: 'yeni', text: 'Quantum Link â€” TÃ¼rkÃ§e sesli komut (mikrofon) + TTS yanÄ±t' },
      { type: 'yeni', text: 'Quantum Link â€” kasa/stok/satÄ±ÅŸ/alacak hÄ±zlÄ± sorgularÄ± (offline)' },
      { type: 'yeni', text: 'useDB analytics useMemo â€” revenue, profit, margin, growth, topProducts vb.' },
      { type: 'yeni', text: 'ESLint kuruldu â€” @typescript-eslint + react-hooks kurallarÄ±' },
      { type: 'yeni', text: 'requestPushPermission() â€” Firebase Cloud Messaging izni' },
      { type: 'yeni', text: "CHANGELOG.md â€” GitHub'da okunabilir iÅŸlem geÃ§miÅŸi" },
      {
        type: 'iyilestirme',
        text: 'AndroidManifest.xml â€” POST_NOTIFICATIONS, RECORD_AUDIO, CAMERA, depolama izinleri eklendi',
      },
      { type: 'iyilestirme', text: 'README.md â€” tam uygulama haritasÄ±, izin tablosu, sÃ¼rÃ¼m geÃ§miÅŸi' },
      {
        type: 'iyilestirme',
        text: 'SoundSettings fonksiyonu SoundSettingsPanel olarak yeniden adlandÄ±rÄ±ldÄ± (Ã§akÄ±ÅŸma giderildi)',
      },
      { type: 'iyilestirme', text: 'Toast.tsx emoji regex â€” misleading character class dÃ¼zeltildi' },
      { type: 'duzeltme', text: 'useDB.ts â€” productId undefined olduÄŸunda analytics Ã§Ã¶kmesi dÃ¼zeltildi' },
      { type: 'duzeltme', text: 'useDB.ts â€” Firebase log template literal escape hatasÄ± dÃ¼zeltildi' },
      { type: 'duzeltme', text: 'utils-tr.ts â€” regex gereksiz escape karakterleri temizlendi' },
      { type: 'duzeltme', text: '6 boÅŸ catch {} bloÄŸu â€” aÃ§Ä±klayÄ±cÄ± yorum eklendi (no-empty)' },
      { type: 'duzeltme', text: 'fetchCurrentHash, updateHashInFirebase â€” kullanÄ±lmayan dead code kaldÄ±rÄ±ldÄ±' },
      {
        type: 'kaldirildi',
        text: 'AÃ§Ä±k temalar kaldÄ±rÄ±ldÄ± (Kartal, Siyah/Ak, Amber, Deniz, Ã‡imen, GÃ¼neÅŸ, Beton, Kontrast)',
      },
      { type: 'kaldirildi', text: "Ayarlar'dan aÃ§Ä±k/koyu mod toggle kaldÄ±rÄ±ldÄ±" },
    ],
  },
  {
    version: '2.0.0',
    date: '14 Nisan 2026',
    title: 'PARSPEL â€” Yeniden DoÄŸuÅŸ',
    summary:
      'Uygulama adÄ± PARSPEL olarak gÃ¼ncellendi. Yedekleme sistemi tamamen yeniden yazÄ±ldÄ±. Ä°kon kÃ¼tÃ¼phanesi ve sistem haritasÄ± eklendi.',
    changes: [
      { type: 'yeni', text: 'Uygulama adÄ± PARSPEL olarak deÄŸiÅŸtirildi' },
      { type: 'yeni', text: 'Ä°kon seÃ§ici (IconPicker) â€” emoji, URL ve Lucide desteÄŸi' },
      { type: 'yeni', text: 'Sistem haritasÄ± â€” modÃ¼ller arasÄ± iliÅŸki diyagramÄ±' },
      { type: 'yeni', text: 'SÃ¼rÃ¼m kitapÃ§Ä±ÄŸÄ± â€” tÃ¼m deÄŸiÅŸiklik geÃ§miÅŸi' },
      { type: 'yeni', text: 'Tam Geri YÃ¼kleme ve BirleÅŸtirme modlarÄ± ayrÄ±ldÄ±' },
      { type: 'yeni', text: 'Geri yÃ¼kleme Ã¶ncesi otomatik yedek alÄ±nÄ±yor' },
      { type: 'yeni', text: 'Yedek limiti (max 20) â€” eski yedekler otomatik siliniyor' },
      { type: 'yeni', text: 'Referans bÃ¼tÃ¼nlÃ¼ÄŸÃ¼ onarÄ±mÄ± (repairReferentialIntegrity)' },
      { type: 'yeni', text: 'Ad kalite kontrolÃ¼ â€” boÅŸ/tek haneli/sadece sayÄ± adlar reddediliyor' },
      { type: 'iyilestirme', text: 'SelectiveRestore artÄ±k Firebase ile senkronize' },
      { type: 'iyilestirme', text: "Dashboard restore Firebase'e yazÄ±yor" },
      { type: 'duzeltme', text: 'Kasa.tsx (db as any).partners tip gÃ¼vensizliÄŸi giderildi' },
    ],
  },
  {
    version: '1.5.0',
    date: 'Mart 2026',
    title: 'Yedekleme & Veri GÃ¼venliÄŸi',
    summary: 'Yedekleme altyapÄ±sÄ± gÃ¼Ã§lendirildi. Veri bÃ¼tÃ¼nlÃ¼ÄŸÃ¼ kontrolleri eklendi.',
    changes: [
      { type: 'yeni', text: 'Firebase Backup koleksiyonu â€” versiyonlu yedekler' },
      { type: 'yeni', text: 'Her 10 versiyonda otomatik yedek' },
      { type: 'yeni', text: 'dataIntegrityChecker â€” localStorage boyut izleme' },
      { type: 'yeni', text: 'stockMovements max 1000 kayÄ±t limiti' },
      { type: 'duzeltme', text: 'BÃ¼tÃ§e banka ekstresi tarih kaybÄ± dÃ¼zeltildi' },
      { type: 'duzeltme', text: 'Fatura taslakâ†’onaylÄ±â†’taslak cari Ã§ift gÃ¼ncelleme dÃ¼zeltildi' },
    ],
  },
  {
    version: '1.4.0',
    date: 'Åžubat 2026',
    title: 'Muhasebe DÃ¼zeltmeleri',
    summary: 'Kritik muhasebe hatalarÄ± giderildi. Cari bakiye hesaplamalarÄ± dÃ¼zeltildi.',
    changes: [
      { type: 'duzeltme', text: 'QuickSaleModal â€” cari bakiye gÃ¼ncellenmiyordu' },
      { type: 'duzeltme', text: 'QuickSaleModal â€” stockMovements kaydedilmiyordu' },
      { type: 'duzeltme', text: 'Bank.tsx â€” silme sÄ±rasÄ±nda cari yanlÄ±ÅŸ geri alÄ±nÄ±yordu' },
      { type: 'duzeltme', text: 'Partners â€” ortak silinirken cari/emanet silinmiyordu' },
      { type: 'duzeltme', text: 'Dashboard â€” POS kasalarÄ± net sermayeye dahil deÄŸildi' },
      { type: 'iyilestirme', text: 'calcProfit/calcMarkup/calcMargin ayrÄ± fonksiyonlar' },
    ],
  },
  {
    version: '1.3.0',
    date: 'Ocak 2026',
    title: 'Banka & BÃ¼tÃ§e ModÃ¼lleri',
    summary: 'Banka ekstresi iÃ§e aktarma ve bÃ¼tÃ§e kategorileri eklendi.',
    changes: [
      { type: 'yeni', text: 'Banka ekstresi iÃ§e aktarma (CSV/XLSX)' },
      { type: 'yeni', text: 'BÃ¼tÃ§e kategorileri ve aylÄ±k limit takibi' },
      { type: 'yeni', text: 'Banka iÅŸlemi cari eÅŸleÅŸtirme' },
      { type: 'yeni', text: 'Alacak yaÅŸlandÄ±rma bandÄ± (0-7, 8-30, 31-60, 60+ gÃ¼n)' },
      { type: 'iyilestirme', text: 'Cari detay modalÄ± â€” fatura geÃ§miÅŸi eklendi' },
    ],
  },
  {
    version: '1.2.0',
    date: 'AralÄ±k 2025',
    title: 'Fatura & Taksit Sistemi',
    summary: 'Fatura yÃ¶netimi ve taksit planÄ± eklendi.',
    changes: [
      { type: 'yeni', text: 'Fatura oluÅŸturma (satÄ±ÅŸ/alÄ±ÅŸ), KDV hesaplama' },
      { type: 'yeni', text: 'Taksit planÄ± â€” otomatik Ã¶deme takvimi' },
      { type: 'yeni', text: 'Fatura durum geÃ§iÅŸleri (taslakâ†’onaylÄ±â†’Ã¶dendiâ†’iptal)' },
      { type: 'yeni', text: 'Fatura yazdÄ±rma Ã¶nizlemesi' },
    ],
  },
  {
    version: '1.1.0',
    date: 'KasÄ±m 2025',
    title: 'Android & PWA DesteÄŸi',
    summary: 'Capacitor ile Android APK desteÄŸi eklendi.',
    changes: [
      { type: 'yeni', text: 'Capacitor 8 â€” Android native desteÄŸi' },
      { type: 'yeni', text: 'PWA â€” offline Ã§alÄ±ÅŸma, ana ekrana ekle' },
      { type: 'yeni', text: "Dosya sistemi â€” Android'de JSON yedek kaydetme" },
      { type: 'iyilestirme', text: 'Mobil uyumlu arayÃ¼z iyileÅŸtirmeleri' },
    ],
  },
  {
    version: '1.0.0',
    date: 'Ekim 2025',
    title: 'Ä°lk SÃ¼rÃ¼m',
    summary: 'Soba YÃ¶netim Sistemi olarak ilk yayÄ±n.',
    changes: [
      { type: 'yeni', text: 'ÃœrÃ¼n & stok yÃ¶netimi' },
      { type: 'yeni', text: 'SatÄ±ÅŸ kayÄ±tlarÄ±' },
      { type: 'yeni', text: 'Kasa hareketleri (nakit/banka)' },
      { type: 'yeni', text: 'Cari hesaplar (mÃ¼ÅŸteri/tedarikÃ§i)' },
      { type: 'yeni', text: 'Firebase Firestore senkronizasyonu' },
      { type: 'yeni', text: 'localStorage birincil depolama' },
      { type: 'yeni', text: 'TedarikÃ§i & sipariÅŸ yÃ¶netimi' },
      { type: 'yeni', text: 'Pelet & boru tedarik modÃ¼lleri' },
    ],
  },
];

export const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; color: string; bg: string }> = {
  yeni: { label: 'âœ¨ Yeni', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  iyilestirme: { label: 'âš¡ Ä°yileÅŸtirme', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  duzeltme: { label: 'ðŸ”§ DÃ¼zeltme', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  kaldirildi: { label: 'ðŸ—‘ï¸ KaldÄ±rÄ±ldÄ±', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};
