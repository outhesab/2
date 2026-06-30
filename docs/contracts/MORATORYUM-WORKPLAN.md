# MORATORYUM WORKPLAN — Gün 1 (8 saat)

> **Tarih:** 27 Haziran 2026 · **Oturum:** Gün 1 / 10
> **Protokol:** `docs/contracts/MORATORYUM.md` (Madde 1-7)
> **Çalışma modu:** Dirty tree · No commit · Stash checkpoint her saat başı
> **Ölçüm:** `.opencode/memory/moratorium.md` (her saat güncellenir)

---

## ⏱️ SAATLİK PROGRAM

### Saat 0 (15 dk) — Plan & Setup
- [ ] Bu dosyayı yaz
- [ ] `.opencode/memory/moratorium.md` → Gün 1 başlangıç entry
- [ ] TODO listesi oluştur
- [ ] **Çıktı:** Bu dosya + log güncellemesi

### Saat 1 (60 dk) — AUDIT (Read-only, paralel)
- [ ] Grep: `console\.(log|warn|error)` (vs `logger.ts`)
- [ ] Grep: `eslint-disable` (CLAUDE.md yasak)
- [ ] Grep: `: any\b|<any>` (TS strict ihlal)
- [ ] Grep: `TODO|FIXME|HACK|XXX`
- [ ] Grep: `catch\s*(\s*\)\s*\{\s*\}` (boş catch)
- [ ] Grep: `agents/.*\b(db|localStorage|IndexedDB)\b` (ajan DB erişim denetimi)
- [ ] **Çıktı:** `docs/contracts/MORATORYUM-AUDIT-day1.md` (sıralı issue listesi)

### Saat 2-3 (90 dk) — Madde 2.1 Çöp Kod Temizliği
- [ ] Audit'ten en çok sorunlu 2-3 dosyayı seç
- [ ] Dead export'ları sil
- [ ] Kullanılmayan fonksiyonları kaldır
- [ ] Orphan type'ları temizle
- [ ] Stale comment'leri sil
- [ ] `pnpm typecheck` ile doğrula
- [ ] **Checkpoint:** `git stash push -m "moratorium-day1-hour2-3-copkod"`

### Saat 4 (60 dk) — Madde 2.2 Sessiz Hatalar
- [ ] Audit'ten en kritik 1-2 dosyayı seç
- [ ] Boş catch'lere logger ekle
- [ ] console.error → logger.error
- [ ] Sessiz fallback'leri işaretle
- [ ] `pnpm typecheck` + `pnpm test:run` ile doğrula
- [ ] **Checkpoint:** `git stash push -m "moratorium-day1-hour4-sessizhata"`

### Saat 5-6 (90 dk) — Madde 2.3 + 2.4
- [ ] **2.3 Ajan DB denetimi (READ-ONLY):**
  - [ ] 7 ajan dosyasını tara
  - [ ] `db/core.ts` dışı doğrudan DB erişimi → işaretle
  - [ ] `AgentBus.ts` → DOKUNMA (sıfır-tolerans)
  - [ ] **Çıktı:** Audit tablosu (sadece rapor, değişiklik yok)
- [ ] **2.4 Zod save() pipeline (1 dosya):**
  - [ ] `src/hooks/db/core.ts` mevcut save() imzasını incele
  - [ ] Zod input şeması ekle
  - [ ] `pnpm test:run` ile doğrula
  - [ ] **Checkpoint:** `git stash push -m "moratorium-day1-hour5-6-zod"`

### Saat 7 (60 dk) — Madde 2.5 save() Backup
- [ ] `src/hooks/db/core.ts` → pre-save snapshot
- [ ] Recovery prosedürünü dökümante et
- [ ] Rollback senaryosu test et
- [ ] **Checkpoint:** `git stash push -m "moratorium-day1-hour7-backup"`

### Saat 8 (30 dk) — Final Validation
- [ ] `pnpm lint` (max 100 warning)
- [ ] `pnpm typecheck`
- [ ] `pnpm test:run`
- [ ] `pnpm build`
- [ ] `.opencode/memory/moratorium.md` → Gün 1 final entry
- [ ] **Final stash:** `git stash push -m "moratorium-day1-end"`
- [ ] **Çıktı:** Status raporu (skor: lint/test/LOC delta)

---

## 🚨 KIRMIZI HAT TETİKLEME KRİTERLERİ (Madde 4)

Aşağıdaki durumlardan biri olursa → **Saati durdur**, Madde 1-2 askıya al:

1. `pnpm test:run` → 5+ test fail
2. `pnpm build` → kırık
3. `pnpm typecheck` → 10+ yeni hata
4. `git stash apply` → conflict (staged veya unstaged değişiklik bozulması)
5. Disk/permission/CI critical error

**Madde 4 tetiklenirse:**
1. Askı süresini kaydet (UTC timestamp)
2. Sorunu izole et ve düzelt
3. 1 telafi günü 10 güne eklenir
4. Log'a yaz

---

## 📏 BAŞARI KRİTERLERİ (Gün 1)

- ✅ Lint warning sayısı: baseline'a eşit veya az
- ✅ Test: 697/698 baseline korunur (5+ fail tetikleyici)
- ✅ LOC delta: negatif veya küçük pozitif (çöp atma hedefi)
- ✅ Atomic: max 2-3 dosya/saat (Madde 1)
- ✅ Madde 4 tetiklenmedi
- ✅ Tüm stash'ler geri alınabilir

---

## 🔗 İLGİLİ

- `docs/contracts/MORATORYUM.md` — Ana sözleşme
- `.opencode/memory/moratorium.md` — Canlı log
- `CLAUDE.md` — Sıfır-tolerans kuralları
- `.opencode/PROTOCOL.md` — Çalışma protokolü
