# Komutlar & CI Pipeline — Detaylı Referans

> Kısa versiyon: `AGENTS.md` §2.

## Komutlar

### Geliştirme
| Komut | Açıklama |
|-------|----------|
| `pnpm run dev` | Vite dev server (port 3000) |
| `pnpm run build` | Production build |
| `pnpm run preview` | Build'i local'de test et |

### Kalite Kontrolü
| Komut | Açıklama |
|-------|----------|
| `pnpm run lint` | ESLint (max 100 warning) |
| `pnpm run lint:fix` | Otomatik lint fix |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run test` | Vitest watch mode |
| `pnpm run test:run` | Tek seferlik test çalıştırma |
| `pnpm run test:specs` | Sadece spec-compliance testleri |
| `pnpm run test:e2e` | Playwright E2E testleri |
| `pnpm run test:e2e:axe` | Accessibility testleri |
| `pnpm run test:lighthouse` | Lighthouse performance testi |
| `pnpm run format` | Prettier ile format |
| `pnpm run format:check` | CI için format kontrolü |
| `pnpm run lint:fallow` | Fallow dead-code audit |
| `pnpm run lint:fallow:all` | Fallow full analysis |
| `pnpm run lint:fallow:health` | Fallow health score |
| `pnpm run lint:fallow:deadcode` | Fallow dead-code only |

### Storybook
| Komut | Açıklama |
|-------|----------|
| `pnpm run storybook` | Storybook dev (port 6006) |
| `pnpm run storybook:build` | Storybook build |

### Mobile (Capacitor 8)
| Komut | Açıklama |
|-------|----------|
| `pnpm run cap:android` | Android Studio aç |
| `pnpm run cap:apk:dev` | Development APK |
| `pnpm run cap:apk:release` | Release APK |
| `pnpm run cap:apk:fast` | Hızlı development build |

### Build & Coverage
| Komut | Açıklama |
|-------|----------|
| `pnpm run build:apk` | Full APK build pipeline |
| `pnpm run build:check` | Tüm CI pipeline'ı çalıştır |
| `pnpm run coverage` | Coverage raporu (HTML) |
| `pnpm run coverage:ui` | Coverage UI aç |
| `pnpm run analyze` | Bundle analyzer (stats.html) |

## CI Pipeline Sırası (değiştirilemez)

```
lint → typecheck → test:run → build
```

Bu sıra **asla** değiştirilemez. Her adım bir sonrakinin ön koşuludur.

## Environment

- **Node.js:** ≥ 22
- **pnpm:** ≥ 9
- **Browser:** Modern (Chrome/Firefox/Safari/Edge son 2 versiyon)
- **Mobile:** Android 8+ (Capacitor 8)

## Test Çalıştırma İpuçları

```bash
# Tek test dosyası
pnpm exec vitest run src/lib/ruleEngine.test.ts

# Pattern ile
pnpm exec vitest run "src/lib/*.test.ts"

# Coverage
pnpm run coverage
```

## Fallow (Dead-Code Analysis)

Fallow, kod tabanında kullanılmayan export/dead code tespit eder. CI kapısıdır:
```bash
pnpm run lint:fallow       # audit
pnpm run lint:fallow:health # health score
```
