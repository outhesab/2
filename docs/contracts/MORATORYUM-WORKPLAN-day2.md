# MORATORYUM WORKPLAN — Gün 2 (2 saat, aralıksız)

> **Tarih:** 27 Haziran 2026 · **Oturum:** Gün 2 / 10
> **Başlangıç:** 03:30 · **Bitiş:** 05:30 (zaman sınırı)
> **Protokol:** `docs/contracts/MORATORYUM.md` (Madde 1-7)
> **Hedef:** "Tümünü bitir" — 3 grup, max 2 saat

---

## ⏱️ PROGRAM (60 dk + 50 dk + 10 dk)

### Grup 1 (60 dk) — `as unknown as` type-safe helper (Madde 2.1)
**Kapsam:** Yeni helper + 2-3 dosya refactor

- [ ] `src/lib/typeSafe.ts` (YENİ): `asDB()`, `asRecord()`, `asArray()` type-safe accessors
- [ ] `src/lib/pageHelpers.ts` — `asArray`/`asDB` import güncelle (zaten mevcut pattern)
- [ ] `src/pages/settings/SettingsSound.tsx` (6 usage) — refactor
- [ ] `src/hooks/db/backup.ts` (1 usage) — refactor
- [ ] `pnpm typecheck` doğrula
- [ ] **Checkpoint:** `git stash -m "moratorium-day2-group1-type-safe-helper"`

### Grup 2 (50 dk) — JSON.parse try/catch coverage (Madde 2.2)
**Kapsam:** Try/catch dışı JSON.parse'leri safeIO.ts üzerinden sarmalama

- [ ] Grep: try/catch dışı JSON.parse (production code only)
- [ ] `src/lib/aiActions.ts:29` — sarmalama
- [ ] `src/components/nexus/SobaNexus.tsx:66` — sarmalama
- [ ] `src/pages/AnomaliOneri.tsx:263` — sarmalama (already inside try? verify)
- [ ] `src/config/tabs.ts:127` — sarmalama
- [ ] `src/lib/streamUtils.ts:32` — sarmalama
- [ ] `pnpm typecheck` + `pnpm test:run` (sadece etkilenen testler)
- [ ] **Checkpoint:** `git stash -m "moratorium-day2-group2-json-parse-coverage"`

### Grup 3 (10 dk) — Final validation (Madde 4 tetik kontrolü)

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test:run`
- [ ] `pnpm build` (kısmi, sadece temel sanity)
- [ ] `.opencode/memory/moratorium.md` — Gün 2 final entry
- [ ] **Final stash** (mevcut + yeni)
- [ ] **Status raporu**

---

## 🚨 KIRMIZI HAT TETİKLEME (Madde 4)

Aşağıdaki durumdan biri olursa → **Saati durdur**, Madde 1-2 askıya al:

1. `pnpm test:run` → 5+ test fail
2. `pnpm build` → kırık
3. `pnpm typecheck` → 5+ yeni hata
4. `git stash apply` → conflict
5. 5+ dosya aynı logical change içinde

---

## 🎯 BAŞARI KRİTERLERİ (Gün 2)

- ✅ Lint: ≤2 warning (baseline korunur)
- ✅ Test: 697/698 baseline
- ✅ LOC delta: negatif veya sıfıra yakın
- ✅ Her grup 1 logical change (max 4 dosya)
- ✅ Madde 4 tetiklenmedi
- ✅ 5:30'a kadar bitirilir (veya durum güncellemesi yapılır)

---

*Hazırlayan: Araf · 2026-06-27 03:30 · Madde 6 günlük log formatı*
