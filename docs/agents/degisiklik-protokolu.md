# Değişiklik Protokolü — Detaylı Adımlar

> Her kod değişikliği **bu sırayı** takip etmek zorundadır. Kısa versiyon için `AGENTS.md` §1'e bak.

## ADIM 0 — Kurulum (Sadece yeni katılımcılar / clone sonrası)

```bash
git clone https://github.com/outhesab/2.git
cd repo_2
pnpm install       # frozen-lockfile kullanılır
pnpm run dev       # http://localhost:3000
```

**Gereksinimler:** Node.js ≥ 22, pnpm ≥ 9, Git ≥ 2.30

## ADIM 1 — Baseline (Değişiklikten önce)

Tüm CI pipeline'ı temiz olmalı:
```bash
pnpm run lint
pnpm run typecheck
pnpm run test:run
pnpm run build
```

**Hepsi PASS** → Devam et.  
**Herhangi biri FAIL** → **Önce onu düzelt**, sonra yeni göreve başla (teknik borç bırakma).

## ADIM 2 — Kapsam Belirle

- Görev net mi? Değilse kullanıcıya sor.
- Hangi dosyalara dokunacaksın? Listele.
- Korunan sistemlerden biri var mı? → **Dur, kullanıcıya sor.**
- 5'ten fazla dosya mı? → Görevi parçalara böl.

**Branş modeli:**
- `dev` — Geliştirme dalı, tüm PR'lar buraya açılır
- `feat/özellik`, `fix/hata`, `chore/bakım`

## ADIM 3 — Değişikliği Yap

- **Sadece** görevde belirtilen şeyi yap.
- Gördüğün başka sorunu **"geçerken düzelt"** → **YAPMA.** Ayrı görev olarak raporla.
- Her fonksiyon değişikliğinde ilgili testi de güncelle.
- Pre-commit hook tetiklenirse (changelog yok, lint hata) → düzelt, bypass etme.

## ADIM 4 — Changelog + package.json Güncelle

> ⚠️ **Bu 3 dosya her zaman birlikte güncellenmelidir**, yoksa CI kırılır!

```typescript
// 1. src/lib/changelog.ts — en üste yeni entry
{
  version: '3.x.x',           // semantic versioning'e göre
  date: '18 Haziran 2026',
  title: 'Kısa başlık',
  summary: 'Ne değişti, neden.',
  changes: [
    { type: 'yeni', text: '...' },
    { type: 'duzeltme', text: '...' },
    { type: 'iyilestirme', text: '...' },
    { type: 'kaldirildi', text: '...' },
  ],
},
```

```json
// 2. package.json — aynı versiyon
{ "version": "3.x.x" }
```

`version-consistency.test.ts` bu 3 dosyayı kontrol eder:
- `CHANGELOG[0].version`
- `package.json.version`
- `APP_DEFAULT_VERSION` (`src/lib/appConfig.ts` üzerinden `__APP_VERSION__` → `vite.config.ts`)

## ADIM 5 — Doğrulama (Değişiklikten sonra)

```bash
pnpm run lint
pnpm run typecheck
pnpm run test:run
pnpm run build
```

**Hepsi PASS** → Commit atabilirsin.  
**Herhangi biri FAIL** → `git revert HEAD`, kullanıcıya bildir, dur.

## ADIM 6 — Commit & Push

```bash
git add <sadece değiştirdiğin dosyalar>
git commit -m "fix/feat/chore: açıklama"
git push origin dev
```

> ⚠️ **`dev` branch'i tek production branch'idir.** Push = canlıya deploy. CI pass etmeden push'lama.

**Commit mesaj formatı:**
- `fix: ...` — hata düzeltme
- `feat: ...` — yeni özellik
- `chore: ...` — bakım, refactor
- `docs: ...` — doküman
- `test: ...` — test ekleme/düzeltme

**`--no-verify` yasak.** Pre-commit hook bypass edilemez.
