# PARSPEL — Kalıcı Hafıza

> Bu dosya her session başında otomatik yüklenir. Önemli notlar, kararlar ve yapılacaklar buraya yazılır.

## Aktif Session

- **Tarih:** 17 Haziran 2026 
- **Hedef:** v3.31.0 — C2 domainEventBus + Listeners, 5 sayfa refactor, CHANGELOG.md sync
- **Durum:** 
  - ✅ C2 domainEventBus: mitt-based pub/sub + 3 listener (agentBridge, auditLogger, notification)
  - ✅ 5 sayfa inline→Tailwind: AnomaliOneri (−474), SaleFormModal (−496), Sales, Stock, Kasa
  - ✅ CariAgent.test.ts timeout fix
  - ✅ Lint/Typecheck/Test(555)/Build — tam yeşil
  - ✅ CHANGELOG.md root sync (v3.23.3→v3.31.0)
  - ✅ MEMORY.md güncellemesi

## Çalışma Protokolü

`.opencode/PROTOCOL.md` dosyası AI agent için bağlayıcı kurallar içerir.
Her session başında okunması zorunludur.

Sinyal sistemi:
- `!görev X` → spesifik görev
- `!tamamla` → tüm kalan görevleri bitir
- `!apk` → build + APK
- `!durum` → 3 satır özet, sonra devam

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

## Yapılacaklar (Sıradaki Session — Her Şey Tamam)

- [x] **C2 domainEventBus + Listeners** — mitt-based pub/sub, 3 listener, intentEngine emit ✅
- [x] **5 Sayfa inline→Tailwind** — AnomaliOneri, Kasa, SaleFormModal, Sales, Stock ✅
- [x] **CHANGELOG.md root sync** — v3.23.3→v3.31.0 ✅
- [x] **CariAgent.test.ts fix** — dynamic→static import ✅
- [x] **Lint/Typecheck/Test(555)/Build** — tam yeşil ✅

Tüm P-görevleri (sayfa boyutu), C1-C4, D+E+F+H+I+J+K kod kalitesi maddeleri tamamlandı.
Kalan işler düşük öncelikli: D-F-H-I-J-K ~45 madde (tip, performans, a11y).

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
