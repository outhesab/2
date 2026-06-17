# PARSPEL — Değişiklik Günlüğü

Tüm önemli değişiklikler bu dosyada belgelenir.

Format: [Keep a Changelog](https://keepachangelog.com/)

---

## [3.31.0] - 17 Haziran 2026

### Yeni
- C2 - domainEventBus.ts: mitt-based typed pub/sub singleton (emit, on, onAny, off, clear, handlerCount)
- C2 - domain/listeners/agentBridge.ts: DomainEvent→AgentBus köprüsü (11 event route)
- C2 - domain/listeners/auditLogger.ts: Domain event'leri activity log'a kaydeder (save enjekte)
- C2 - domain/listeners/notification.ts: Domain event'ler için toast bildirimleri (showToast enjekte)
- C2 - domain/listeners/index.ts: setupDomainListeners() — tüm listener'ları tek çağrıda kurar
- C2 - domain/index.ts: domainEventBus, setupDomainListeners export edildi

### Bakım
- C2 - intentEngine.ts: processIntent sonrası emitEvents() ile domain event yayını eklendi
- C2 - App.tsx: setupDomainListeners useEffect ile entegre edildi
- AnomaliOneri.tsx: inline style→Tailwind dönüşümü (−474 satır)
- Kasa.tsx: inline style→Tailwind dönüşümü + Badge kullanımı
- SaleFormModal.tsx: inline style→Tailwind dönüşümü (−496 satır), salesStyles/SalesHelpers bağımlılığı kaldırıldı
- Sales.tsx: inline style→Tailwind dönüşümü, StatCard/sinp bağımlılığı kaldırıldı, Button/Input/Badge kullanımı
- Stock.tsx: inline style→Tailwind dönüşümü, Button/Badge/VoiceAssistantButton kullanımı

### Hata Düzeltmeleri
- CariAgent.test.ts: dynamic import → static import (test timeout fix)
- uygulama-gercek.test.ts: negative_kasa test timing issue düzeldi

## [3.30.0] - 16 Haziran 2026

### Yeni
- I4 - component-coverage-rules.ts (sayfa/component satır limiti, loading state kontrolü)
- I5 - accessibility-rules.ts (StrictMode, ErrorBoundary, aria-label kontrolleri)
- I6 - performance-budget-rules.ts (spinner, lazy count, console.log kontrolü)
- H9 - SatisAgent.test.ts: 4 yeni test (yüzde/sabit iskonto, havale/kart payment routing)
- H10 - ruleEngine.test.ts: 3 yeni min_stock testi

### İyileştirme
- J1 - Icon button'lara (upload, ai-asistan, VoiceAgentUI, VoiceAssistantButton, ScrollableCards, Dashboard, Cizelge) aria-label eklendi
- J3 - main.tsx: <App /> <StrictMode> ile sarıldı
- J4 - main.tsx: ErrorBoundary component'i eklendi (fallback UI + retry butonu)
- J5 - index.html: loading spinner eklendi (JS yüklenirken gösterilir)
- F7 - saleCompletion.ts: calcSubtotal tek çağrıya indirildi
- E1 - saleCompletion.ts: toPayload helper eklendi
- E7 - useVoiceAgent.ts: window as any → typed SpeechRecognitionCtor
- E6 - pageHelpers.ts: file-level eslint-disable → per-line disables

### Hata Düzeltmeleri
- C2 - domainEventBus.ts kaldırıldı (dead code, hiçbir dinleyicisi yoktu)
- C2 - intentEngine.ts: event emit loop kaldırıldı
- C2 - domain/index.ts: domainEventBus export kaldırıldı
- H2 - version-utils.test.ts: PBT tautoloji düzeltildi
- H3 - spec-compliance.test.ts: info severity test'lerine assertion eklendi
- H4 - navigation-rules.ts: TAB_ROUTE_MATCH gerçek route'ları test ediyor
- H5 - baseAgent.test.ts: private prop → public islemYap
- H6 - uygulama-gercek.test.ts: shared mutable state → fresh fixture
- H7 - kapsamli-senaryo.test.ts: sabit tarih → dinamik Date
- H8 - dataIntegrity.test.ts: platform-bağımlı chunkSize → dinamik
- I1 - component-rules.ts: relative import regex genişletildi
- I2 - SHADCN_UNTOUCHED eşiği 200→100 satır düşürüldü
- I3 - NO_STATIC_INLINE_STYLE exclusion listesi genişletildi
- K1-K3 - DEVELOPMENT.md güncellemeleri

## [3.29.1] - 16 Haziran 2026

### Hata Düzeltmeleri
- Sale.dueDate type eklendi (CI typecheck)
- auditEngine: sadece payment === "cari" satışları cari bakiyeye dahil et
- cari balance güncellemesi completeSale/cancelSale/returnSale'e eklendi
- 13 yeni domain test (29 test)
- C7: excel-merge.ts 3 modüle bölündü

## [3.29.0] - 16 Haziran 2026

### Yeni
- Receivables (Alacak Takip) sayfası — gecikmiş cari alacaklar
- SaleIntent.dueDays desteği

### Hata Düzeltmeleri
- completeSale: yanlış "status: iade" fix
- CariAgent/KasaAgent AgentResponse tip hatası düzeltildi
- Login sayfası renkleri @theme bloğu ile düzeltildi

## [3.28.0] - 15 Haziran 2026

### Bakım
- P2 SettingsBackup: 1191→5 modüle bölündü
- D1: save/saveGuarded ortak _save helper
- E2: SatisAgent validasyon fonksiyonları
- F1/F2: SettingsBackup useCallback + className

## [3.27.0] - 15 Haziran 2026

### Bakım
- C4 Agent sadeleştirme: 4 agent DomainAgent base class altında birleştirildi
- KasaAgent/CariAgent save bug fix (processIntent sonucu kaydedilmiyordu)

## [3.26.1] - 15 Haziran 2026

### Bakım
- Dashboard.tsx 863→398 satır (WidgetRenderer + useStatCards)
- 3005 modül build

## [3.26.0] - 15 Haziran 2026

### Yeni
- Rule Engine: min_stock kuralı eklendi (severity: warn)
- 16 domain servis testi (saleCompletion.test.ts)
- DB core/backup/sync coverage artırıldı

## [3.25.2] - 14 Haziran 2026

### Bakım
- 10 lint warning, 17 test hatası, typecheck fix'leri temizlendi
- Voice NLP parser action detection iyileştirildi

## [3.25.1] - 14 Haziran 2026

### Hata Düzeltmeleri
- Vite HMR WebSocket port çakışması giderildi
- Dashboard React key prop uyarısı düzeltildi
- Sidebar navigasyon helper E2E iyileştirmeleri

## [3.25.0] - 13 Haziran 2026

### Bakım
- 4 paralel agent ile Suppliers/Monitor/BugHunter/Bank sayfaları modülerize edildi (toplam 3421 satır monolit temizlendi)

## [3.23.5] - 13 Haziran 2026

### Bakım
- Products.tsx: Ekleme/Düzenleme modalı ve Toplu Fiyat modalı Tailwind + shadcn/ui'ye dönüştürüldü
- Cari.tsx: debtColor ve alacak yaşlandırma bucket renkleri class-based yapıldı

## [3.23.4] - 13 Haziran 2026

### Bakım
- Cari ve Ürün sayfaları Base-Nova standartlarına modernize edildi
- Tüm inline style'lar kaldırıldı, Tailwind CSS ve shadcn/ui bileşenleri entegre edildi

## [3.23.3] - 13 Haziran 2026

### Hata Düzeltmeleri
- Agent islemYap pipeline fix: SatisAgent/StokAgent domain servislere yönlendirildi
- cancelSale: cari bakiyesi düzeltiliyor, kasa gider kaydı ekleniyor
- returnSale: returnedAt alanı eklendi
- applyIntentResult: CashTransaction → KasaEntry dönüşümü (id, createdAt, updatedAt)
- 411 test pass, 40/40 test dosyası

## [3.23.2] - 13 Haziran 2026

### Firebase Config
- Firebase config değerleri .env'ye taşındı, Firebase sync çalışır durumda

## [3.23.1] - 13 Haziran 2026

### Bakım
- AIAsistan.tsx modülerizasyonu: ChatPanel, MessageList, ActionHistory, index.tsx
- any tipleri temizlendi
- orchestrator.ts silindi (C1), processIntent + applyIntentResult kullanılıyor
- dead code temizliği (6.8): not-found.tsx, utils-tr.ts, version.ts, appConfig.ts

## [3.22.1] - 12 Haziran 2026

### Bakım
- Reports.tsx bölündü (1755→124 satır + 7 modül)
- Dashboard.tsx bölündü (1425→851 satır + 7 modül)
- Fatura.tsx bölündü → 5 alt modül
- Inline CSS → CSS Module (16 dosya, ~162 inline style)
- G4: Firebase sync Queue ile düzeltildi
- G5: Kasa/POS routing payment alanından

---

Daha eski değişiklikler (v3.7.1 ve öncesi) için `src/lib/changelog.ts` dosyasına bakın.
