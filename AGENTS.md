# Agent Instructions

## Commands & Workflow

- **Package Manager:** `pnpm` (required). Node ≥ 22, pnpm ≥ 9.
- **Dev Server:** `pnpm run dev` (port 3000)
- **Build:** `pnpm run build` (Vite 7)
- **Test:** `pnpm run test:run` (Vitest + fast-check, property-based)
- **Single Test:** `pnpm exec vitest run src/lib/ruleEngine.test.ts`
- **Typecheck:** `pnpm run typecheck` (tsc --noEmit)
- **Lint:** `pnpm run lint` / `pnpm run lint:fix`
- **Format:** `pnpm run format` / `pnpm run format:check`
- **Fallow Audit:** `pnpm run lint:fallow` (CI gate)
- **Mobile Build:** `pnpm run cap:android` (Capacitor 8, Android)
- **Changelog:** **Mandatory** — update `src/lib/changelog.ts` on every source code change. Pre-commit hook enforces this.

### CI Pipeline Order (required command sequence)

```
lint → typecheck → test:run → build
```

1. `pnpm run lint` — ESLint (max 100 warnings)
2. `pnpm run typecheck` — TypeScript
3. `pnpm run test:run` — Vitest + fast-check
4. `pnpm run build` — Vite production build

## Architecture & Conventions

### Data Layer (Offline-First)

- **Primary:** `localStorage` (key: `sobaYonetim`)
- **Backup:** IndexedDB via Dexie (periodic snapshots, 5s debounce)
- **Sync:** Firebase Firestore (optional, 1.2s debounce, last-write-wins)
- **Save Pipeline:** `save(updater)` → prevDB → updater(prevDB) → RuleEngine → AuditEngine → localStorage → IndexedDB → Firebase
- **Never** write to localStorage directly — always use `save()` / `saveGuarded()` / `saveWithLog()`
- **Pattern:** `save((prevDB: DB) => ({ ...prevDB, ...next }))` — immutable updater
- **Key limits:** localStorage ~5-10MB, Firebase 1MB/doc
- **Recovery:** If localStorage corrupt/empty → IndexedDB → dbDefaults

### State Management

- **Data:** `useDB` hook → `useState<DB>` (reacts to localStorage changes)
- **Agents:** Zustand `agentStore` (active agent, busy state)
- **UI:** Component-local `useState`

### Multi-Agent System (7 agents)

| Agent       | Role             |
| ----------- | ---------------- |
| `satis`     | Sales lifecycle  |
| `stok`      | Stock updates    |
| `kasa`      | Cash register    |
| `cari`      | Account balance  |
| `fatura`    | Invoice creation |
| `rapor`     | Activity logging |
| `deep_seek` | AI analysis      |

- Event bus: `AgentBus` (mitt singleton) — `emit(from, type, payload)` / `on(type, handler)`
- Orchestrator: `planAgentFlow(actionType)` → ordered agent list; `dispatchAgentFlow()` executes sequentially
- **Sales flow:** `satis → stok → kasa (nakit/kart) → cari (vadeli) → fatura → rapor`

### Rule Engine

- Runs on every `save()` via `validateTransaction(prevDB, nextDB)`
- `severity: 'block'` → operation stopped
- `severity: 'warn'` → warning shown, operation continues
- 50ms timeout → safe-pass (bypass)
- **Rules:** negative_stock (block), negative_kasa (block), duplicate_transaction (warn, 60s), zero_amount (block)

### Code Style

- TypeScript strict, avoid `any`
- Tailwind CSS classes, no inline styles (except dynamic values)
- Prefer shadcn/ui primitives (`src/components/ui/`) — **do not modify**
- Path alias: `@/` for `src/`
- **Component rules:**
  - Custom component max 150 lines
  - Page max 800 lines
  - Use `Empty` component for empty states
  - Every component needs 4 states: loading (SkeletonLoader), empty (Empty), error (toast/fallback), success

### Testing Patterns

- **Unit:** `src/lib/*.test.ts` (co-located with source)
- **Integration:** `src/__tests__/` (cross-file consistency)
- **E2E:** `e2e/*.spec.ts` (Playwright, critical flows only)
- **Pattern:** `prevDB → işlem → nextDB` (pure functions, no UI deps)
- **Property-based:** fast-check for edge cases
- **No snapshot tests** — they break with trivial changes

### E2E Tests (Playwright)

Critical flows only — login, sync, backup. Run: `pnpm run test:e2e`

### PR Process

1. Branch from `dev`: `feat/...`, `fix/...`, `chore/...`
2. Update `src/lib/changelog.ts`
3. Run CI pipeline: lint → typecheck → test:run → build
4. Open PR with checklist (see `.github/PULL_REQUEST_TEMPLATE.md`)
5. Get at least 1 approval
6. Merge to `dev`

## Key Files & Locations

| Purpose           | Location                             |
| ----------------- | ------------------------------------ |
| Entry point       | `src/main.tsx`                       |
| Routing/App       | `src/App.tsx`                        |
| DB Hook           | `src/hooks/db/core.ts`               |
| Rule Engine       | `src/lib/ruleEngine.ts`              |
| Audit Engine      | `src/lib/auditEngine.ts`             |
| Agent System      | `src/agents/`                        |
| Agent Store       | `src/stores/agentStore.ts`           |
| Types             | `src/types/index.ts`                 |
| Changelog         | `src/lib/changelog.ts`               |
| Config (Tabs)     | `src/config/tabs.ts`                 |
| Pre-commit Hook   | `.simple-git-hooks/pre-commit`       |
| Fallow Config     | `.fallowrc.json`                     |
| Theme Provider    | `src/theme/ThemeProvider.tsx`        |
| Theme Definitions | `src/theme/themes.ts`                |
| CSS Variables     | `src/index.css`                      |
| CI Quality Gate   | `.github/workflows/quality-gate.yml` |
| Deploy            | `.github/workflows/deploy.yml`       |
| APK Build         | `.github/workflows/build-apk.yml`    |

## Common Gotchas

- **Pre-commit blocks commit** if `src/lib/changelog.ts` not updated
- **RuleEngine bypass** on timeout (50ms) — check logs
- **`save()` vs `saveGuarded()`** — latter skips 'warn' blocking (admin ops)
- **`saveWithLog()`** — adds to activity log + audit log
- **Agent private props** (`agent["db"]`) — fragile in tests
- **localStorage ~5-10MB limit** — monitor DB size
- **Firebase 1MB/doc limit** — large DBs chunked
- **useDB every render** — no memoization, consider selectors
- **ExcelJS lazy loaded** — `exceljs` chunk is ~1MB, loaded on demand
- **GitHub Actions bağımlılık** — `deploy` ve `build-apk` workflow'ları önce `quality-gate` çalıştırır (`needs: quality`)
- **Branch koruması** — `block-new-branch.yml` artık sadece `dev`/`main` dışı branch'leri siler

## UI/UX Standards

### Error States (4 states per component)

```tsx
// Loading: SkeletonLoader
if (loading) return <SkeletonLoader type="card" count={3} />;

// Empty: Empty component
if (items.length === 0)
  return (
    <Empty>
      <EmptyTitle>Boş</EmptyTitle>
    </Empty>
  );

// Error: toast or PageFallback
showToast('Hata mesajı', 'error');

// Success: normal content
```

### Component Structure

- shadcn/ui primitives in `src/components/ui/` — **never modify**
- Layout components in `src/components/layout/`
- Custom components in `src/components/`
- All pages use `React.lazy()` for code splitting
- All routes wrapped in `<Suspense>`

### Styling Priority

1. Tailwind CSS classes (default)
2. CSS variables (`var(--...)`) for theme colors
3. CSS Modules for page-specific styles
4. Inline style only for dynamic values (width, color from data)

## Docs Reference

| Doc                        | Purpose                           |
| -------------------------- | --------------------------------- |
| `README.md`                | Overview, commands, features      |
| `DEVELOPMENT.md`           | Architecture, patterns, debugging |
| `CONTRIBUTING.md`          | Branching, commits, PR process    |
| `docs/VERI_KATMANI.md`     | Data layer deep dive              |
| `docs/AGENT_SISTEMI.md`    | Multi-agent flows                 |
| `docs/VERI_MODELI.md`      | Schema, tables, relations         |
| `docs/BILESEN_MIMARISI.md` | Component rules                   |
| `docs/NAVIGASYON.md`       | Routing, tab system               |
| `docs/HATA_DURUMLARI.md`   | Error handling patterns           |
| `docs/UI_UX.md`            | UI flows, wireframes              |
| `docs/TEST_STRATEJISI.md`  | Test patterns, coverage targets   |
| `MASTER_PLAN.md`           | Known issues, improvement roadmap |
| `WEEKLY_PLAN.md`           | 57 pending tasks across 6 weeks   |
| `docs/skin-plan.md`        | Corporate theme transformation    |
| `.opencode/skills/`        | Agent skills for common tasks     |
## Local AI Ortami (Air-Gapped / Offline)

### LM Studio (Yerel LLM Sunucusu)
- **API:** http://127.0.0.1:1234/v1 (OpenAI-uyumlu)
- **Model JIT:** 300 saniye boslukta bellekten bosaltilir
- **GPU Offload:** Qwen3 4B Thinking -> 0.6, VL/Phi -> 0.5
- **Context Limit:** Tum modellerde 2048

### Yerel Modeller (5 adet)
| Model | Boyut | Kullanim |
|-------|-------|----------|
| Qwen3 4B Thinking | ~2.5GB | Karmasik reasoning, offline |
| Qwen3 VL 4B | ~2.5GB | Gorsel isleme |
| Phi-3.5 Mini | ~2GB | Hizli basit isler |
| Liquid 1.2B | ~0.8GB | Cok dusuk kaynak, yedek |
| text-embedding | - | Embedding |

### MCP Servisleri (3 adet, ~25 tool)
| MCP | Protokol | Kullanim |
|-----|----------|----------|
| filesystem | stdio (local) | Dosya okuma/yazma/arama/dizin |
| github | stdio (local) | Issue/PR/repo/commit yonetimi |
| web-search (Exa) | SSE (remote) | Web arama (internet gerekli) |

### Local Agentlar (opencode icinde)
- /yerel-zeki -> Qwen3 4B Thinking (karmasik reasoning)
- /yerel-goruntu -> Qwen3 VL 4B (gorsel isleme)
- /yerel-hizli -> Phi-3.5 Mini (hizli)
- /yerel-hafif -> Liquid 1.2B (yedek)
- /yerel-docs -> Qwen3 4B Thinking (dokumantasyon)

### Local Komutlar (l- on ekli, offline calisir)
- /ltest -> offline test suite
- /lfix -> offline hata duzeltme
- /lreview -> offline kod inceleme
- /ldurum -> offline proje durumu
- /ltasi -> offline refactor/tasi

### Offline (Air-Gapped) Mod Aktiflestirme
Config dosyalarinda "offline": true ayarlidir.
PowerShell profili su env vars icerir:
- OPENCODE_OFFLINE=true
- OPENCODE_DISABLE_AUTOUPDATE=true
- OPENCODE_DISABLE_MODELS_FETCH=true
- OPENCODE_DISABLE_DEFAULT_PLUGINS=true
- OPENCODE_DISABLE_LSP_DOWNLOAD=true
