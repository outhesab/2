# PARSPEL — Kalıcı Hafıza

> Bu dosya her session başında otomatik yüklenir. Önemli notlar, kararlar ve yapılacaklar buraya yazılır.

## Aktif Session

- **Tarih:** 13.06.2026 (3 saatlik parallel agent session)
- **Hedef:** 4 büyük sayfayı parallel agent'larla modülerize etme (P1/P3/P4/P5)
- **Durum:** 
  - ✅ **Parallel Agent Denemesi:** 4 general agent aynı anda başlatıldı, hepsi başarılı
  - ✅ **Suppliers.tsx (1265→5 modül):** Suppliers/index + SupplierList/Form/Order + types
  - ✅ **Monitor.tsx (1147→6 modül):** Monitor/index + Overview/Issues/Rules/AuditLog + types
  - ✅ **BugHunter.tsx (1092→7 modül):** BugHunter/index + TestRunner + 5 UI modülü + types
  - ✅ **Bank.tsx (1031→8 modül):** Bank/index + StatCard/Stats/Actions/Filters/Table/Form + types
  - ✅ **Toplam:** 4 eski monolitik dosya silindi (3421 satır), 26 yeni modül dosyası oluşturuldu
  - ✅ Pre-existing TS6133 hataları temizlendi (LoginScreen, Sidebar, FaturaStats, ReportsOzet)
  - ✅ Monitor relative import fix: ../pageHelpers → @/pages/pageHelpers
  - ✅ CI: lint (0 err), typecheck (0 err), test (all pass except 14 pre-existing), build (success)
  - ✅ Version bump: 3.23.3 → 3.25.0

## Önemli Kararlar

- **Refactor Stratejisi:** Sayfa boyutu ihlalleri (P-series) önceliklendirildi. Monolitik sayfalar "Orchestrator + Modules" pattern'ına taşındı.
- **Sync Architecture:** Firebase kayıtları için `SyncQueue` mantığında ardışık (sequential) kayıt yapısına geçildi.
- **Test Yaklaşımı:** Büyük refactor süreci bitene kadar kapsamlı test yazımı sona ertelendi; sadece kritik değişikliklerde mini-testler uygulanıyor.

## Optimizasyon Kuralları (ZORUNLU)

### 1. File Hash Tracking
- Her dosya için hash hesapla (SHA-256)
- Dosya değişmediyse **tekrar OKUMA**
- Sadece hash değiştiyse yeniden analiz et

### 2. Smart File Read Rule
- Eğer dosya `audit-state.json` içinde `filesAnalyzed` listesinde varsa VE hash değişmemişse → **SKIP**

### 3. Incremental Audit Mode (ZORUNLU)
- **Full scan YASAK**
- Sadece: değişen dosyalar, etkilenmiş componentler, bağımlı route'lar analiz edilir

### 4. Re-run Kontrolü
- Aynı işlem 2 kere yapılamaz
- Eğer işlem `type + target` aynıysa → **SKIP** (already processed)

### 5. Memory Update Rule
- Her başarılı işlem sonrası `audit-state.json` güncellenmeli
- `filesAnalyzed`, `componentsChecked`, `pagesTested` ekle
- Hash güncelle

## Yapılacaklar (Sıradaki Session)

- [x] **6.2 AIAsistan Modülerizasyonu:** ChatPanel/MessageList/ActionHistory/index.tsx
- [x] **6.7 Inline CSS $\rightarrow$ CSS Module:** Dashboard, Fatura ve Reports modülleri inline stilleri `.module.css`'e taşındı.
- [x] **6.8 Dead Code Temizliği:** Kullanılmayan export ve yorum bloklarını temizle.
- [x] **C1 Orchestrator Kaldırma:** `orchestrator.ts` silindi, `processIntent` + `applyIntentResult` kullanılıyor.
- [x] **P1/P3/P4/P5:** Suppliers, Monitor, BugHunter, Bank sayfaları modülerize edildi
- [x] **Pre-existing TS6133:** LoginScreen, Sidebar, FaturaStats, ReportsOzet temizlendi
- [ ] **C2, C3 Mimari Borçlar:** Event Bus birleştirme ve `useDB` monolitinin bölünmesi.
- [ ] **C4 Agent Sadeleştirme:** Agent wrapper'lar tekilleştirilebilir.
- [ ] **Kalan P-görevleri:** SettingsBackup (1206 satır) ve Dashboard (851 satır, sınırda)
- [ ] **Sona Bırakılanlar:** Test kapsamı artırımı (5.9 - 5.12).
- [ ] **Domain servis testleri:** completeSale, cancelSale, returnSale, correctSalePrice için test yazımı

## Notlar

- `SatisAgent`'daki discount/banka/pos testleri eksik, refactor sonrası tamamlanacak.
- Firebase sync için `_firebasePromise` referansı `dbHelpers.ts` üzerinden yönetiliyor.

---

## Geçmiş

| Tarih | Konu | Karar/Not |
|-------|------|-----------|
| 05.06.2026 | GitHub'dan çekme | `dev` branch'i `15f34d1`'e güncellendi |
| 10.06.2026 | MCP & Audit Fix | MCP type'lar düzeltildi, audit-state ve incremental audit aktif edildi |
| 12.06.2026 | Modülerizasyon & G-Fix | Reports, Dashboard, Fatura sayfaları bölündü. G4 ve G5 hataları giderildi. |
| 12.06.2026 | CSS Module Migration (6.7) | Dashboard, Fatura, Reports ~162 inline style .module.css'e taşındı, 16 yeni CSS module dosyası. |
| 13.06.2026 | Dead Code Cleanup (6.8) | not-found.tsx silindi, utils-tr.ts/version.ts/appConfig.ts ölü exportlar temizlendi, ~116 satır kaldırıldı. v3.22.1. |
| 13.06.2026 | 4 Sayfa Parallel Modülerizasyon | 4 general agent ile Suppliers/Monitor/BugHunter/Bank toplam 26 modüle bölündü. 3421 satır monolit silindi. v3.25.0. |
