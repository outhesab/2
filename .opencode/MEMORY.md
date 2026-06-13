# PARSPEL — Kalıcı Hafıza

> Bu dosya her session başında otomatik yüklenir. Önemli notlar, kararlar ve yapılacaklar buraya yazılır.

## Aktif Session

- **Tarih:** 13.06.2026 (1 saatlik hızlı oturum)
- **Hedef:** AIAsistan modülerizasyonu tamamlama (P3/6.2) + lint/type fix + orchestrator temizliği (C1)
- **Durum:** 
  - ✅ AIAsistan.tsx → ChatPanel, MessageList, ActionHistory, index.tsx (4 modül)
  - ✅ `any` tipleri temizlendi (AIAsistan/index.tsx:317,320)
  - ✅ `hasDuplicate` (unused) aiActions.ts'den kaldırıldı
  - ✅ Import path `../` yerine `@/` alias kullanıldı (spec-compliance fix)
  - ✅ Gereksiz `import React` kaldırıldı (ChatPanel, MessageList, ActionHistory)
  - ✅ `orchestrator.ts` + `orchestrator.test.ts` silindi (C1)
  - ✅ `dispatchAgentFlow` kaldırıldı, `processIntent` + `applyIntentResult` kullanılıyor
  - ✅ CI: lint (0 err, 10 warn), test (37 passed, 3 pre-existing fail), build (success)
  - ✅ Version bump: 3.22.1 → 3.23.1

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
- [ ] **C2, C3 Mimari Borçlar:** Event Bus birleştirme ve `useDB` monolitinin bölünmesi.
- [ ] **C4 Agent Sadeleştirme:** Agent wrapper'lar tekilleştirilebilir.
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
| 13.06.2026 | Dead Code Cleanup (6.8) | not-found.tsx silindi, utils-tr.ts/version.ts/appConfig.ts ölü exportlar temizlendi, ~116 satır kaldırıldı. v3.22.1. |
