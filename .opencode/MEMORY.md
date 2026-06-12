# PARSPEL — Kalıcı Hafıza

> Bu dosya her session başında otomatik yüklenir. Önemli notlar, kararlar ve yapılacaklar buraya yazılır.

## Aktif Session

- **Tarih:** 12.06.2026 (Gece)
- **Hedef:** CSS Module Migration (6.7) — Dashboard, Fatura, Reports
- **Durum:** 
  - ✅ 6.7 Dashboard CSS Module: Kalan 13 inline style temizlendi (7 migrated, 6 dynamic kaldı)
  - ✅ 6.7 Fatura CSS Module: 117 inline style → ~75 migrated, 42 dynamic kaldı (6 yeni .module.css)
  - ✅ 6.7 Reports CSS Module: 105 inline style → ~80 migrated, 21 dynamic kaldı (8 yeni .module.css)
  - ✅ Toplam: ~162 statik inline style CSS Module'a taşındı, 16 yeni .module.css dosyası
  - ✅ CI: lint (0 err), typecheck (0 err), test (413 pass), build (success)
  - ✅ Version bump: 3.21.5 → 3.22.0

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

- [x] **6.7 Inline CSS $\rightarrow$ CSS Module:** Dashboard, Fatura ve Reports modülleri inline stilleri `.module.css`'e taşındı.
- [ ] **6.8 Dead Code Temizliği:** Kullanılmayan export ve yorum bloklarını temizle.
- [ ] **C1, C2, C3 Mimari Borçlar:** `processIntent` geçişi, Event Bus birleştirme ve `useDB` monolitinin bölünmesi.
- [ ] **Sona Bırakılanlar:** Test kapsamı artırımı (5.9 - 5.12).

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
