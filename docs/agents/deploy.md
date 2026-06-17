# Branch & Deploy — Detaylı

> Kısa versiyon: `AGENTS.md` §8.

## Branch Modeli

**Tek production branch:** `dev`

```
local → git push origin dev → Vercel auto-deploy → production
```

## Neden Tek Branch?

- Vercel GitHub integration → her push = deploy
- Basit, hızlı, hata kaynağı az
- Feature flag'ler ile yeni özellikler yavaş yavaş açılır (gerekirse)

## Yasak Komutlar

| Komut | Neden Yasak |
|-------|-------------|
| `git push --force` | History bozar, rollback imkansızlaşır |
| `git push --no-verify` | Pre-commit hook bypass |
| `git commit --no-verify` | Hook bypass |
| `git push origin main` | main branch yok (sadece dev) |
| `git push --mirror` | Tüm remote branch'ler silinir |

## Pre-Commit Hook (`.simple-git-hooks/`)

Her commit'te otomatik çalışır:
1. **Staged files check** — `.ts/.tsx`/`.json`/`.md`
2. **Lockfile sync** — `pnpm-lock.yaml` senkron
3. **Typecheck** — `tsc --noEmit`
4. **Lint** — ESLint (staged files)
5. **Prettier** — staged files
6. **JSON validation**
7. **Changelog check** — `src/lib/changelog.ts` staged olmalı (eğer başka dosya değiştiyse)
8. **Korumalı dosya uyarısı** — protected files değişirse uyar

## Pre-Push Hook

Her push'ta:
1. Korumalı branch kontrolü
2. Test suite (full)
3. Build
4. Spec compliance
5. Bundle size karşılaştırması
6. Commit sayısı uyarısı

## Commit Message Format

**Conventional Commits:**
```
fix: kısa açıklama
feat: yeni özellik
chore: bakım
docs: doküman
test: test
refactor: refactor
```

**Örnekler:**
```
fix: cari bakiye hesaplama yanlışlığı
feat: alacak takip sayfası eklendi
chore: changelog v3.31.1 sync
docs: AGENTS.md sıkıştırıldı
test: SatisAgent discount testleri
```

## CI/CD (`.github/workflows/`)

**KORUNAN** — workflow'lar değiştirilemez.

Workflow sırası:
```
lint → typecheck → test:run → build → deploy
```

## Rollback

Eğer production'a kötü bir commit gittiyse:
1. **Hemen geri al:** Vercel dashboard → "Redeploy" önceki commit
2. **Veya:** `git revert HEAD` → push

**`git reset --hard` ASLA production'da kullanma.**

## Environment Variables

- `.env` (local) — gitignored
- `.env.example` — committed (template)
- Vercel env'ler — Vercel dashboard'da

**Hassas veriler:**
- Firebase keys
- API keys
- Database credentials

> ⚠️ Asla `.env`'yi commit etme. Asla API key'i source code'a yazma.

## Mobile Deploy (Capacitor)

```bash
pnpm run cap:apk:release  # Production APK
pnpm run cap:apk:dev      # Development APK
```

APK → Google Play Console'a yükle.
