# PARSPEL — Kalıcı Hafıza

> Bu dosya her session başında otomatik yüklenir. Önemli notlar, kararlar ve yapılacaklar buraya yazılır.

## Aktif Session

- **Tarih:** 18 Haziran 2026
- **Hedef:** v3.32.0 — Kalan MASTER_PLAN maddeleri + WEEKLY_PLAN 5.12 + Aşama 3 Registry
- **Durum:**
  - ✅ Tüm kalan ~45 madde tarandı, ~30'u zaten çözülmüş, 6'sı fix'lendi
  - ✅ J2: dangerouslySetInnerHTML → React-based rendering (AIAHelpers, ai-asistan)
  - ✅ H1: P1 tautoloji test → real property-based test
  - ✅ E8: 'utf8' as never → Encoding.UTF8 (Capacitor enum)
  - ✅ WEEKLY_PLAN 5.12: coverage exclude temizliği (son task kapandı 🏁)
  - ✅ Aşama 3: State Registry otomasyonu — pre-commit drift tespiti eklendi
  - ✅ v3.32.0: changelog + package.json + state-registry senkron
  - ✅ pre-commit: agent drift + registry drift çift kontrol
  - ✅ CI yeşil (lint, typecheck, 555 test passed, 1 skipped, build)

## Çalışma Protokolü

`.opencode/PROTOCOL.md` dosyası AI agent için bağlayıcı kurallar içerir.
Her session başında okunması zorunludur.

Sinyal sistemi:
- `!görev X` → spesifik görev
- `!tamamla` → tüm kalan görevleri bitir
- `!apk` → build + APK
- `!durum` → 3 satır özet, sonra devam

## Context Vortex Çözümü (Araştırma Sonucu)

**Problem:** AI agent'lar her session başında projeyi baştan okuyor (vortex), 65K+ satır context bloat.

**Çözüm:** Aşamalı uygulama:
- ✅ Aşama 1 (18.06.2026): AGENTS.md 810→111 satır, detaylar docs/agents/ altına taşındı
- ✅ Aşama 2 (18.06.2026): Symlink stratejisi (shim files) — CLAUDE.md + .cursor/rules/rules.mdc otomatik generate
- ⏳ Aşama 3 (plan): External Memory Layer (State Registry) — CI başarılı olduğunda proven facts otomatik yazılsın

**Araştırma kaynakları (50+):** mem0.ai, axiomstudio.ai, zylos.ai, Cursor, Aider, Cline, Devin, Claude Code, arxiv akademik makaleler (CWL, Continuum Memory, VikingMem, WorldDB, Memori).

**Endüstri standartları:**
- 4-Katmanlı bellek: In-Prompt → Ephemeral Working → Durable Project → Organizational
- Stable prefix önce, dynamic sonra (60-80% cost reduction)
- 60-70% threshold = early warning, 80% = rotation
- Hard constraints system prompt'un tepesinde pinned
- AGENTS.md 200 satır limiti (aşılırsa agent kuralları görmezden gelir)

## Önemli Kararlar

- **Refactor Stratejisi:** Sayfa boyutu ihlalleri (P-series) önceliklendirildi. Monolitik sayfalar "Orchestrator + Modules" pattern'ına taşındı.
- **Sync Architecture:** Firebase kayıtları için `SyncQueue` mantığında ardışık (sequential) kayıt yapısına geçildi.
- **Test Yaklaşımı:** Büyük refactor süreci bitene kadar kapsamlı test yazımı sona ertelendi; sadece kritik değişikliklerde mini-testler uygulanıyor.
- **AGENTS.md Politikası:** Kök AGENTS.md max 200 satır (araştırma destekli). Detaylar docs/agents/ altında modüler.

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
Kalan ~45 madde taranıp çoğunun zaten çözüldüğü tespit edildi. v3.32.0 ile son 6 madde fix'lenerek kapatıldı.

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
| 18.06.2026 | MASTER_PLAN Kalan Maddeler | ~45 madde taranıp 30'unun zaten çözüldüğü tespit edildi. J2/H1/E8 fix'lendi, K4/K5/D2-D7/F5 zaten çözülmüş. v3.32.0. |
| 20.06.2026 | Soba Nexus AI Optimization | Reasoning Filter ve Fast-Path Intent'ler eklendi, Router ve VoiceIntent optimize edildi. v3.33.0. |
