# BELLEK.md — PARSPEL Proje Hafızası

> **Amaç:** Oturumlar arasında kaybolmaması gereken bağlam.
> OpenCode (ARAF) her oturum başında okur, önemli kararlar alınınca güncellenir.
> Ne CLI ne de OpenCode'a özel format — düz Markdown.

---

## Proje Özeti

React + TypeScript + Vite ERP uygulaması (Türkçe). Offline-first: localStorage → IndexedDB → Firebase.
7 domain agent, multi-domain service layer, rule engine, audit engine.

**Stack:** React 19, TypeScript strict, Zustand, Wouter, Tailwind, shadcn/ui, Vitest, Capacitor (Android).

---

## Kritik Dosyalar — ASLA DOKUNMA

| Dosya | Sebep |
|---|---|
| `src/lib/ruleEngine.ts` | Merchant rule engine, her satış/kasa/.. kaydından geçer |
| `src/hooks/db/core.ts` | Save pipeline facade |
| `src/agents/AgentBus.ts` | Agent dispatch hub |
| `src/components/ui/**` | shadcn/ui — framework dosyaları |
| `src/lib/auditEngine.ts` | Denetim zinciri |
| `src/lib/changelog.ts` | Changelog (sadece ekleme yap) |
| `src/types/index.ts` | Global tipler (sadece ekleme) |
| `.github/workflows/**` | CI pipeline |

---

## Mimari Kararlar (ADR)

### [ADR-001] A-2 (DomainAgent dispatch) — Ertelendi
Tüm agent handler'larını DomainAgent.handle çatısı altında birleştirme fikri 1.5-2.5 günlük refactor.
Typed handler'lar validation-only, persistence legacy path'te kaldı.
**Karar:** Belgelenip ertelendi, çalışıyor, bloker değil. Gerektiğinde ele alınır.

### [ADR-002] Round2 kapsam daraltması
F-3 (.env API key'leri) acil değil → "projede kalabilir" dendi.
R3-8 sadece F-4 (AppRoutes extraction) yapıldı.

### [ADR-003] OpenCode + CLI'ya geçiş
Cursor, Claude Code, VS Code bırakıldı.
Agent sync mekanizması (AGENTS.md → CLAUDE.md / .cursor) kaldırıldı.
Pre-commit hook sadece registry drift kontrolü yapıyor.

---

## Çalışma Kuralları

### Değişiklik Protokolü
1. Baseline al (`pnpm run lint && pnpm run typecheck && pnpm run test -- --run`)
2. Kapsamı netleştir (ne yapılacak, ne YAPILMAYACAK)
3. Uygula (sadece görevdeki şey — "geçerken düzeltme" YAPMA)
4. Gerekirse versiyon güncelle (`changelog.ts` + `package.json` + `appConfig.ts` — 3 dosya birlikte)
5. Doğrula (baseline tekrar, hepsi PASS)
6. Commit (`fix/feat/chore: mesaj`)

### Yasaklar
- `localStorage`'a direkt yazma → `save()` kullan
- `any` tipi, `console.log`, statik inline style
- Test silme/skip etme, `eslint-disable` ekleme
- Aynı anda 5+ dosyaya dokunma (bölmediysen sor)
- `git push --force`, `--no-verify`

### /ONAY Modu
`/ONAY` komutu verildiğinde o session boyunca ARAF onay beklemeden çalışır:
- Rutin işlemler (commit, push, dosya sil/düzenle) sormadan yapılır
- Bir sonraki adım biliniyorsa devam edilir
- Sadece güvenlik riski, kırıcı değişiklik veya net olmayan yön varsa durulur

---

## Komutlar

| Komut | Ne işe yarar |
|---|---|
| `pnpm run dev` | Dev server (port 3000) |
| `pnpm run lint` | ESLint |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run test -- --run` | Tüm testler (en son: 734 passed) |
| `pnpm run build` | Production build |
| `pnpm run registry` | state-registry.json güncelle |

---

## Versiyonlama

| Tip | Kural |
|---|---|
| PATCH | Hata düzeltme (`3.43.4 → 3.43.5`) |
| MINOR | Yeni özellik, geriye uyumlu |
| MAJOR | Kırıcı değişiklik — kullanıcıya sor |

**3 dosya kuralı:** `changelog.ts` + `package.json` + `appConfig.ts` aynı anda güncellenmeli.

---

## Oturum Geçmişi

| Tarih | Oturum | Önemli Kararlar |
|---|---|---|
| 30 Haz 2026 | Round2 tamamlama | Tüm 21 sorun çözüldü, R3-8 (AppRoutes extraction) push. IDE dosyaları temizlendi, AGENTS.md → BELLEK.md dönüşümü. |

---

## Performans Budget

| Chunk | Maks |
|---|---|
| `index` | 300 KB |
| `vendor` | 280 KB |
| `firebase` | 200 KB |
| `charts` | 420 KB |
| `exceljs` | 1.1 MB (lazy) |

Yeni kütüphane eklemeden önce: `npx bundlephobia <paket>` → 50KB altı kabul.

---

## Branch

Tek branch: **`dev`** — her push = otomatik Vercel deploy.

---

*Son güncelleme: 30 Haziran 2026*
