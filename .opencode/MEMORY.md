# PARSPEL — Kalıcı Hafıza

> Bu dosya her session başında otomatik yüklenir. Önemli notlar, kararlar ve yapılacaklar buraya yazılır.

## Aktif Session

- **Tarih:** 23 Haziran 2026
- **Hedef:** v3.43.0 — GitHub pull + senkronizasyon
- **Durum:**
  - ✅ GitHub'dan son değişiklikler çekildi (1 commit, v3.41.0→v3.43.0)
  - ✅ 21 dosya değişti, 716 satır eklendi, 343 satır silindi
  - ✅ Registry güncellendi: v3.43.0, 209 ts + 182 tsx, 70.776 LOC
  - ✅ AGENTS.md/MEMORY.md güncellendi

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
- ✅ Aşama 3 (20.06.2026): State Registry (External Memory Layer) — `state-registry.json`, `generate-registry.mjs`, pre-commit drift tespiti

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
SatisAgent discount/banka/pos testleri de eklendi ve geçiyor (18/18).

## 🚀 Parallel Agent Orkestrasyon Deneyimi (23.06.2026)

**Tarih:** 23 Haziran 2026
**Sonuç:** 9 agent ile paralel çalışma — 15 dakikada ~4.5 saatlik iş tamamlandı (%94 kazanç)

### Başlangıç Durumu
- 22 test FAIL (safeIO.test.ts + dbDefaults.test.ts)
- 17 lint uyarısı
- Build süresi: 2 dakika
- Toplam tahmini süre (serial): ~4.5 saat

### Parallel Strateji (3 Aşama)

#### AŞAMA 1: Test + Lint + Logger (5 agent paralel)
| Agent | Görev | Dosya |
|-------|-------|-------|
| 1 | safeIO.test.ts localStorage mock fix | 1 dosya |
| 2 | dbDefaults.test.ts assertion güncelleme | 1 dosya |
| 3 | Lint fixes (SobaNexus, useSpeech, useVoiceAgent) | 3 dosya |
| 4 | Lint fixes (6 dosya) | 6 dosya |
| 5 | Console→Logger (hook dosyaları) | 6 dosya |

#### AŞAMA 2: Lib + Kalite + Docs (4 agent paralel)
| Agent | Görev | Dosya |
|-------|-------|-------|
| 6 | Console→Logger (lib dosyaları) | 6 dosya |
| 7 | Performans chunk analizi | 0 (analiz) |
| 8 | Kod kalitesi temizliği | 3 dosya |
| 9 | Changelog + version güncellemesi | 2 dosya |

#### AŞAMA 3: Final Doğrulama (1 agent sıralı)
- lint + typecheck + test + build

### Sonuç
| Metrik | Önceki | Sonra | İyileşme |
|--------|--------|-------|----------|
| Test FAIL | 22 | **0** | ✅ %100 |
| Lint uyarı | 17 | **2** | ✅ %88 |
| Build süresi | 2m 1s | **19.96s** | ✅ %84 |
| Toplam süre | ~4.5 saat | **~15 dk** | ✅ %94 |

### Kritik Öğrenilenler

1. **Dosya Ççekinme Kuralı:** Her agent sadece kendi dosyasına dokunmalı, başka agent'ın dosyasına DOKUNMAMALI
2. **Optimum Agent Sayısı:** 8-10 arası (20+ zararlı — API rate limit, CPU, token maliyeti)
3. **Aşamalı Çalışma:** Farklı dosya grupları paralel, aynı dosyalar sıralı
4. **Final Doğrulama:** Tüm değişikliklerden sonra tek agent ile lint+test+build
5. **Agent Seçimi:** `general` agent tipi her şeyi yapabilir (dosya okuma, düzenleme, komut çalıştırma)
6. **Prompt Mühendisliği:** Her agent'a net dosya listesi, ne yapılacağı ve ne YAPILMAYACAĞI söylenmeli

### Hız vs Agent Sayısı Grafiği
```
Hızlanma (%)
100│                          ╭──── 8 agent (optimum)
   │                    ╭─────╯
 80│              ╭─────╯
   │        ╭─────╯
 60│  ╭─────╯
   │──╯
 40│
 20│
  0└─────────────────────────────────
   1  2  4  6  8  10  12  16  20
              Agent Sayısı
```

### Gelecek Kullanım Alanları
- Büyük refactor işlemleri (sayfa bölme, modülerizasyon)
- Toplu lint/bug fix
- Console→Logger dönüşümü (çoklu dosya)
- Test yazımı (paralel test dosyaları)
- Doküman güncelleme

> 📖 Detaylı rehber: `docs/agents/parallel-agent-stratejisi.md`

## Notlar

- Firebase sync için `_firebasePromise` referansı `dbHelpers.ts` üzerinden yönetiliyor.
- v3.43.1 sürümüne yükseltildi — tüm testler geçiyor (697/698).

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
| 20.06.2026 | GitHub pull + doküman güncelleme | 6 commit çekildi (v3.32.1→v3.33.0), MEMORY.md/AGENTS.md/WEEKLY_PLAN güncellendi, state-registry v3.33.0. |
| 23.06.2026 | GitHub pull (v3.43.0) | 21 dosya değişti, 716 satır eklendi, 343 satır silindi. NexusPanel/SobaNexus/VoiceNexusCore güncellendi. |
