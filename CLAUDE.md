<!-- AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT DIRECTLY -->


> **Bu dosya otomatik üretilmiştir.** Asıl kaynak: `AGENTS.md`.
> Manuel düzenleme yapma — değişiklikler üzerine yazılır.
> Senkron için: `pnpm run sync:agents`

---
# AGENTS.md — PARSPEL Agent Talimatları (Hızlı Referans)

> Bu dosya her AI agent/tool için zorunlu okumadır. **İlk önce §0 SIFIR-TOLERANS, sonra §1 Değişiklik Protokolü.**
> Detaylı versiyonlar için `docs/agents/` klasörüne bak.

---

## ⚡ HIZLI BAŞLANGIÇ (Context Vortex Önleme)

**Her session başında şunu oku:** `state-registry.json` (1KB, ~50ms)
- Proven facts: versiyon, test sayısı (555), sayfa listesi (28), korunan dosyalar
- Gereksiz dosya taramayı azalt → **%60-80 token tasarrufu**
- Registry'yi yenile: `pnpm run registry`

---

## §0. SIFIR-TOLERANS KURALLARI

### Korunan Sistemler — ASLA Dokunma
- `src/lib/ruleEngine.ts` · `src/hooks/db/core.ts` (save pipeline) · `src/agents/AgentBus.ts`
- `src/components/ui/**` (shadcn) · `src/lib/auditEngine.ts` · `src/lib/changelog.ts` (sadece ekle)
- `.github/workflows/**` · `.simple-git-hooks/**` · `src/types/index.ts` (sadece ekle)

### Yasak Davranışlar
- localStorage'a direkt yazma → `save()` kullan
- `any` tipi kullanma · `console.log` bırakma (`logger.ts` kullan)
- Statik inline style (Tailwind kullan) · Test silme/skip etme
- `eslint-disable` ekleme · Aynı anda 5+ dosyaya dokunma
- `changelog.ts` güncellemeden commit atma (pre-commit engelliyor)

> 📖 Detay: `docs/agents/sifir-tolerans.md`

---

## §1. DEĞİŞİKLİK PROTOKOLÜ (6 adım)

```
0. Kurulum → pnpm install
1. Baseline → lint + typecheck + test:run + build (hepsi PASS)
2. Kapsam   → görev net mi? korunan sistem? 5+ dosya? → sor/böl
3. Yap      → sadece görevdeki şeyi yap, "geçerken düzeltme" YAPMA
4. Changelog + package.json → birlikte güncelle (3 dosya!)
5. Doğrula  → aynı baseline, hepsi PASS
6. Commit   → fix/feat/chore: mesaj
```

> ⚠️ **3 dosya kuralı:** `changelog.ts` + `package.json` + `appConfig.ts` versiyonları senkron olmalı. CI `version-consistency.test.ts` ile kontrol eder.
> 📖 Detay: `docs/agents/degisiklik-protokolu.md`

---

## §2. KOMUTLAR (Hızlı)

| Komut | Açıklama |
|-------|----------|
| `pnpm run dev` | Dev server (port 3000) |
| `pnpm run lint` | ESLint (max 100 warning) |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run test:run` | Vitest (555+ test) |
| `pnpm run build` | Vite production build |
| `pnpm run lint:fallow` | Fallow dead-code audit |

**CI Sırası (değiştirilemez):** `lint → typecheck → test:run → build`

> 📖 Detay: `docs/agents/komutlar-ve-ci.md`

---

## §3. MİMARİ (Özet)

### Veri Katmanı (Offline-First)
```
localStorage (sobaYonetim) → IndexedDB (Dexie, 5s) → Firebase (1.2s, last-write-wins)
```
**Save pipeline:** `save(updater)` → prevDB → updater → RuleEngine → AuditEngine → localStorage → IndexedDB → Firebase

### Agent Sistemi (7 agent)
`satis → stok → kasa → cari → fatura → rapor → deep_seek`

### Multi-Domain (v3.23+)
`Page → intentEngine → domain service (pure function) → save()`

> 📖 Detay: `docs/agents/mimari-detay.md`

---

## §4. KOD STANDARTLARI

- **TypeScript:** `strict: true`, `any` yasak, `as unknown as X` yasak
- **Style:** Tailwind (statik), inline sadece dinamik
- **Logging:** `import { logger } from '@/lib/logger'`
- **Component:** max 150 satır custom, 800 satır page
- **State:** 4-state pattern (loading/empty/error/success)

> 📖 Detay: `docs/agents/standartlar.md`

---

## §5. SEMANTIC VERSİYONLAMA

| Tip | Kural | Örnek |
|-----|-------|-------|
| PATCH | Hata düzeltme | 3.31.0 → 3.31.1 |
| MINOR | Yeni özellik (geriye uyumlu) | 3.31.1 → 3.32.0 |
| MAJOR | Kırıcı değişiklik (kullanıcıya sor) | 3.32.0 → 4.0.0 |

> 📖 Detay: `docs/agents/versiyonlama.md`

---

## §6. YAYGIN TUZAKLAR

| Tuzak | Çözüm |
|-------|-------|
| Pre-commit blok (changelog yok) | `changelog.ts` güncelle |
| Version inconsistency (CHANGELOG ≠ package.json) | **3 dosyayı birlikte** güncelle |
| RuleEngine 50ms timeout (safe-pass) | Normal davranış, log kontrol et |
| `saveGuarded` warn kurallarını atlar | Admin işlemleri için |
| localStorage 5-10MB limit | DB boyutunu monitör et |

> 📖 Detay: `docs/agents/tuzaklar.md`

---

## §7. PERFORMANS BUDGET

| Chunk | Maks | İçerik |
|-------|------|--------|
| `index` | 300 KB | Ana uygulama |
| `vendor` | 280 KB | React 19 |
| `firebase` | 200 KB | Firebase SDK |
| `charts` | 420 KB | Recharts/D3 |
| `exceljs` | 1.1 MB | Excel (lazy) |

Yeni kütüphane: `npx bundlephobia <paket>` → 50KB altı kabul.

> 📖 Detay: `docs/agents/performans.md`

---

## §8. BRANCH & DEPLOY

**Tek branch:** `dev` → her push = otomatik Vercel deploy

**Yasak:** `git push --force` (history bozar), `--no-verify` (hook bypass)

> 📖 Detay: `docs/agents/deploy.md`

---

## §9. OPENCODE & MCP

**Default agent:** `hermes` (Qwen3-4B local, offline)

**MCP sırası:** filesystem → github → web-search

> 📖 Detay: `docs/agents/opencode-mcp.md`

---

## Daha Fazla Bilgi

- Mimari: `docs/technical/ARCHITECTURE.md`
- Veri katmanı: `docs/technical/DATA_LAYER.md`
- UI/UX: `docs/technical/UI_UX.md`
- Test stratejisi: `docs/technical/TEST_STRATEGY.md`
- Ana plan: `docs/management/MASTER_PLAN.md`
- Changelog: `docs/logs/CHANGELOG.md`
- **Detaylı agent kuralları:** `docs/agents/`

---

**Son güncelleme:** 20 Haziran 2026 · v3.33.0
