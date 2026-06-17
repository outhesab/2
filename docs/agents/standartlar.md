# Kod Standartları — Detaylı Liste

> Kısa versiyon: `AGENTS.md` §4.

## TypeScript

- **`strict: true`** zorunlu
- **`any` tipi yasak** — `unknown` veya spesifik tip kullan
- **`as unknown as X` yasak** — gerekirse doğru tip tanımla
- **Nullable kontroller:** `if (x === null)` veya `?.` operatörü
- **Generic'ler:** Domain generic'ler `domain/types.ts`'te tanımlı
- **Enum yerine union types:** `type Status = 'active' | 'inactive'`

## React/Component

### Boyut Limitleri
| Tür | Maks Satır |
|-----|------------|
| Custom component | 150 |
| Page | 800 |
| Hook | 100 |
| Utility | 200 |

Büyük component → "Orchestrator + Modules" pattern'ına böl.

### State Pattern (4-state)
Her async/data component şu state'leri desteklemeli:
```typescript
type State = 
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error', error: Error }
  | { status: 'success', data: Data }
```

### State Yönetimi
- **Local state:** `useState` (küçük UI state)
- **Global state:** Zustand store (`src/stores/`)
- **Server state:** TanStack Query (ileride)
- **DB state:** `useDB` hook ailesi (useDBQueries, useDBActions, useDBBackup, useDBSync)

### Loading State
- Tablo: `<SkeletonTable />`
- Kartlar: `<SkeletonStatRow />`
- Boş state: `<EmptyState />`
- Error: `<ErrorState />` veya toast

## Styling

### Tailwind (Statik)
```tsx
<div className="flex items-center gap-2 p-4 bg-card rounded-md">
```

### Inline Style (Sadece Dinamik)
```tsx
<div style={{ width: `${progress}%` }}>  // ✅ dinamik değer
<div style={{ padding: '16px' }}>          // ❌ Tailwind kullan
```

### CSS Modules
Büyük component'ler için `Component.module.css` kullan:
```tsx
import styles from './Component.module.css';
<div className={styles.wrapper}>
```

### shadcn/ui Primitive
- `Button`, `Input`, `Card`, `Dialog`, `Select`, `Toast` vb.
- `src/components/ui/` (KORUNAN) — değiştirme
- Wrapper'lar `src/components/` altında

## Logging

**`logger.ts` kullan, `console.log` yasak:**
```typescript
import { logger } from '@/lib/logger';

logger.debug('detay', { extra: 'data' });
logger.info('bilgi', { userId });
logger.warn('uyarı', { issue: 'x' });
logger.error('hata', error);
logger.critical('kritik', { crash: true });
```

**Log seviyeleri:**
- `debug` — geliştirme
- `info` — normal operasyon
- `warn` — dikkat gerekir
- `error` — hata (kullanıcıya bildirilir)
- `critical` — crash (audit log'a yazılır)

## Test

### Yazım Kuralları
- **Co-located:** `Component.test.tsx` (component'in yanında)
- **Domain services:** `src/domain/services/__tests__/`
- **Spec:** `src/__tests__/`
- **Test framework:** Vitest + fast-check (PBT)

### PBT (Property-Based Testing)
```typescript
import fc from 'fast-check';

it('always valid', () => {
  fc.assert(fc.property(fc.anything(), (input) => {
    const result = process(input);
    expect(result).toBeDefined();
  }));
});
```

### Coverage Eşikleri
| Katman | Minimum |
|--------|---------|
| `lib/` | %80 |
| `agents/` | %75 |
| `hooks/` | %70 |
| `pages/` | %40 |

## Error Handling

### Zorunlu Pattern
```typescript
try {
  await operation();
} catch (err) {
  logger.error('Operation failed', err);
  throw err; // veya graceful fallback
}
```

### Yasak Pattern'ler
- ❌ Boş catch: `catch {}`
- ❌ console.error
- ❌ Sessiz fail (return without logging)

## A11y (Accessibility)

- WCAG AA minimum
- Icon button: `aria-label` zorunlu
- Form: `<label htmlFor="...">` bağlantılı
- Focus: Modal'da focus trap, escape ile kapat
- Contrast: ≥ 4.5:1 (normal), ≥ 3:1 (large)
- Klavye: Tüm interaktif element klavye ile erişilebilir

## File Organization

```
src/
├── pages/              # Sayfa componentleri (orchestrator)
├── components/         # Custom components
│   └── ui/             # shadcn/ui (KORUNAN)
├── hooks/              # React hooks
│   └── db/             # DB hooks (useDB, useDBActions, useDBBackup)
├── lib/                # Business logic, utilities
├── domain/             # Domain types & services
│   ├── services/       # Pure function services
│   └── listeners/      # Domain event listeners
├── agents/             # AI agents (BaseAgent)
├── stores/             # Zustand stores
├── types/              # TypeScript types (KORUNAN)
└── __tests__/          # Test specs
```
