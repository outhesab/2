# Git Hooks Sistemi

PARSPEL projesi, kod kalitesini ve iş akışı tutarlılığını sağlamak için **Husky** tabanlı git hook'ları kullanır.

## Genel Bakış

```
.husky/
├── pre-commit          # Commit öncesi doğrulamalar
├── pre-push            # Push öncesi doğrulamalar
├── commit-msg          # Commit mesajı format kontrolü
├── post-merge          # Merge sonrası bağımlılık kontrolü
├── post-checkout       # Branch switch sonrası uyarılar
├── helpers/
│   ├── colors.sh       # Renkli çıktı fonksiyonları
│   ├── staged-files.sh # Staged dosya filtreleme
│   └── git-context.sh  # Git context helpers
└── _/
    └── .gitignore      # Husky internal
```

## Hook'lar

### 1. `pre-commit` (Commit Öncesi)

6 adımlı doğrulama zinciri:

| Adım | Kontrol | Başarısız |
|------|---------|-----------|
| 1/6 | `pnpm-lock.yaml` senkronizasyonu | ❌ Bloklar |
| 2/6 | TypeScript tip kontrolü (`tsc --noEmit`) | ❌ Bloklar |
| 3/6 | ESLint + Prettier (staged files) | ⚠️ Auto-fix dener |
| 4/6 | JSON dosya validasyonu | ❌ Bloklar |
| 5/6 | Changelog güncelleme kontrolü | ⚠️ Uyarı |
| 6/6 | Korumalı dosya değişiklik kontrolü | ⚠️ Uyarı |

### 2. `pre-push` (Push Öncesi)

5 adımlı doğrulama:

| Adım | Kontrol | Başarısız |
|------|---------|-----------|
| — | Korumalı branch kontrolü (main/master) | ❌ Bloklar |
| 1/5 | Test suite (`pnpm run test:run`) | ❌ Bloklar |
| 2/5 | Build (`pnpm run build`) | ❌ Bloklar |
| 3/5 | Spec compliance (`pnpm run test:specs`) | ⚠️ Uyarı |
| 4/5 | Bundle size kaydı | ℹ️ Bilgi |
| 5/5 | Commit sayısı kontrolü | ⚠️ Uyarı |

### 3. `commit-msg` (Commit Mesajı)

Conventional Commits formatı zorunludur:

```
feat(scope): Açıklama
fix: Hata düzeltmesi
chore(ci): CI yapılandırması
```

Kurallar:
- Format: `tip(scope)!?: açıklama`
- Subject: 8-72 karakter
- Body: subject'ten sonra boş satır
- Geçerli tipler: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`, `build`, `revert`
- Geçerli scope'lar: `core`, `ui`, `api`, `db`, `agents`, `tests`, `build`, `ci`, `docs`, `deps`

### 4. `post-merge`

Merge sonrası otomatik kontroller:
- `pnpm-lock.yaml` değişmişse → `pnpm install`
- `package.json` değişmişse → uyarı
- `tsconfig`/`vite.config` değişmişse → build uyarısı
- PR numarası tespiti

### 5. `post-checkout`

Branch değişiminde `pnpm-lock.yaml` farkı varsa uyarı.

## lint-staged

`lint-staged.config.js` ile staged dosyalara otomatik format uygulanır:

| Pattern | İşlem |
|---------|-------|
| `*.{ts,tsx}` | ESLint --fix + Prettier |
| `*.json` | Prettier + validasyon |
| `*.md` | Prettier |
| `*.test.ts` | ESLint + vitest run |

## Kurulum

Hook'lar `pnpm install` ile otomatik kurulur (`prepare` script'i ile).

Manuel kurulum:
```bash
pnpm exec husky install
```

## Test

Hook'ları test etmek için:
```bash
# pre-commit test
pnpm exec husky run pre-commit

# commit-msg test
echo "feat: test mesajı" | pnpm exec husky run commit-msg
```
