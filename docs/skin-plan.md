# Skin Transformation Plan: Corporate Enterprise

## Executive Summary

- **Current state**: "PARSPEL Design System v3.0" — Dark-first, industrial, amber/orange (`oklch(0.62 0.18 35)`) primary accent. Default theme `carbon` (green #22c55e on dark #041512) but CSS vars use amber. 2069 lines of CSS. Mixed shadcn/ui + custom components. Hardcoded hex colors in modals.
- **Target skin**: `corporate` (Corporate Enterprise) — Professional, minimal, enterprise SaaS finance dashboard
- **Skin philosophy**: Light mode, blue accent (#2563eb), clean surfaces, subtle shadows, premium glass effects
- **Total scope**: ~12 files, ~85 individual changes
- **Risk level**: Medium (visual changes to entire app, but CSS variable approach makes it systematic)
- **Estimated effort**: 4-6 hours for complete transformation

---

## Skin Definition (Target: Corporate)

```json
{
  "id": "corporate",
  "label": "Corporate Enterprise",
  "desc": "Profesyonel, minimal, enterprise SaaS hissi — finance dashboard",
  "type": "light",
  "accent": "#2563eb",
  "bg": "#f8fafc",
  "hueAngle": 265,
  "cssVars": {
    "--shadow-sm": "0 2px 8px oklch(0 0 0 / 0.06)",
    "--shadow": "0 4px 20px oklch(0 0 0 / 0.08)",
    "--shadow-lg": "0 8px 40px oklch(0 0 0 / 0.1)",
    "--shadow-xl": "0 16px 60px oklch(0 0 0 / 0.12)",
    "--shadow-accent": "0 8px 32px oklch(0.55 0.15 265 / 0.2)",
    "--shadow-glow": "0 0 20px oklch(0.55 0.15 265 / 0.15)",
    "--shadow-colored": "0 4px 20px oklch(0.55 0.15 265 / 0.1)",
    "--shadow-soft-white": "0 2px 15px oklch(0 0 0 / 0.04)",
    "--glass-bg": "oklch(1 0 0 / 0.9)",
    "--glass-bg-light": "oklch(1 0 0 / 0.97)",
    "--glass-border": "oklch(0 0 0 / 0.06)",
    "--glass-blur": "blur(12px)",
    "--glass-blur-heavy": "blur(24px)",
    "--gradient-primary": "linear-gradient(135deg, #2563eb, #1d4ed8)",
    "--gradient-card": "linear-gradient(135deg, oklch(1 0 0), oklch(0.98 0.005 265))",
    "--gradient-glass": "linear-gradient(135deg, oklch(1 0 0 / 0.9), oklch(0.98 0.005 265 / 0.9))",
    "--gradient-shine": "linear-gradient(135deg, transparent 30%, oklch(1 0 0 / 0.08) 50%, transparent 70%)",
    "--ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
    "--ease-smooth": "cubic-bezier(0.22, 1, 0.36, 1)",
    "--ease-snappy": "cubic-bezier(0.4, 0, 0.2, 1)",
    "--duration-fast": "0.12s",
    "--duration-normal": "0.2s",
    "--duration-slow": "0.35s",
    "--surface-raised": "oklch(1 0 0)",
    "--surface-overlay": "oklch(0 0 0 / 0.4)",
    "--surface-sunken": "oklch(0.96 0.005 265)",
    "--color-primary-50": "oklch(0.95 0.03 265 / 0.05)",
    "--color-primary-100": "oklch(0.95 0.03 265 / 0.1)",
    "--color-primary-200": "oklch(0.9 0.06 265 / 0.2)",
    "--color-primary-300": "oklch(0.8 0.1 265 / 0.4)",
    "--color-primary-400": "oklch(0.7 0.14 265 / 0.6)",
    "--color-primary-500": "oklch(0.6 0.16 265)",
    "--color-primary-600": "oklch(0.5 0.18 265)",
    "--color-primary-700": "oklch(0.4 0.16 265)",
    "--color-primary-800": "oklch(0.3 0.12 265)",
    "--color-primary-900": "oklch(0.2 0.08 265)"
  }
}
```

---

## Current vs Target Comparison

### Core Palette

| Token | Current (Dark Default) | Target (Corporate Light) | Status |
|-------|----------------------|--------------------------|--------|
| `--color-primary` | `oklch(0.62 0.18 35)` amber/orange | `oklch(0.6 0.16 265)` blue | ⚠️ Change |
| `--color-primary-light` | `oklch(0.70 0.16 35)` | `oklch(0.5 0.18 265)` blue-600 | ⚠️ Change |
| `--color-primary-dark` | `oklch(0.52 0.20 35)` | `oklch(0.4 0.16 265)` | ⚠️ Change |
| `--color-secondary` | `oklch(0.60 0.14 260)` blue | Same blue (OK) | ✅ Match |
| `--color-accent` | `oklch(0.58 0.18 280)` purple | Same purple | ✅ Match |
| `--color-success` | `oklch(0.65 0.18 160)` | Same | ✅ Match |
| `--color-warning` | `oklch(0.70 0.18 85)` | Same | ✅ Match |
| `--color-danger` | `oklch(0.60 0.22 30)` | Same | ✅ Match |

### Background Colors

| Token | Current (Dark) | Target (Light) | Status |
|-------|---------------|----------------|--------|
| `--bg-base` | `oklch(0.08 0.02 260)` | `oklch(0.96 0.01 260)` ≈ #f8fafc | ⚠️ Change |
| `--bg-elevated` | `oklch(0.10 0.03 260)` | `oklch(0.98 0.005 260)` | ⚠️ Change |
| `--bg-card` | `oklch(1 0 0 / 0.035)` | `oklch(1 0 0 / 0.95)` | ⚠️ Change |
| `--bg-card-hover` | `oklch(1 0 0 / 0.055)` | `oklch(1 0 0 / 0.98)` | ⚠️ Change |
| `--bg-sidebar` | `oklch(0.06 0.02 260)` | `oklch(0.92 0.01 260)` | ⚠️ Change |
| `--bg-glass` | `oklch(0.10 0.03 260 / 0.85)` | `oklch(0.98 0.005 260 / 0.90)` | ⚠️ Change |
| `--bg-surface` | `oklch(0.12 0.03 260)` | `oklch(0.90 0.01 260)` | ⚠️ Change |

### Border Colors

| Token | Current (Dark) | Target (Light) | Status |
|-------|---------------|----------------|--------|
| `--border` | `oklch(1 0 0 / 0.07)` | `oklch(0 0 0 / 0.10)` | ⚠️ Change |
| `--border-strong` | `oklch(1 0 0 / 0.12)` | `oklch(0 0 0 / 0.18)` | ⚠️ Change |
| `--border-accent` | `oklch(0.62 0.18 35 / 0.25)` | `oklch(0.58 0.20 35 / 0.20)` | ⚠️ Change |

### Text Colors

| Token | Current (Dark) | Target (Light) | Status |
|-------|---------------|----------------|--------|
| `--text-primary` | `oklch(0.95 0.01 260)` | `oklch(0.12 0.02 260)` | ⚠️ Change |
| `--text-secondary` | `oklch(0.65 0.03 260)` | `oklch(0.35 0.02 260)` | ⚠️ Change |
| `--text-muted` | `oklch(0.40 0.03 260)` | `oklch(0.50 0.02 260)` | ⚠️ Change |
| `--text-dim` | `oklch(0.25 0.05 260)` | `oklch(0.60 0.02 260)` | ⚠️ Change |

### Shadows

| Token | Current (Dark) | Target (Light) | Status |
|-------|---------------|----------------|--------|
| `--shadow-sm` | `0 2px 8px oklch(0 0 0 / 0.3)` | `0 2px 8px oklch(0 0 0 / 0.06)` | ⚠️ Change |
| `--shadow` | `0 4px 20px oklch(0 0 0 / 0.4)` | `0 4px 20px oklch(0 0 0 / 0.08)` | ⚠️ Change |
| `--shadow-lg` | `0 8px 40px oklch(0 0 0 / 0.5)` | `0 8px 40px oklch(0 0 0 / 0.1)` | ⚠️ Change |
| `--shadow-xl` | `0 16px 60px oklch(0 0 0 / 0.6)` | `0 16px 60px oklch(0 0 0 / 0.12)` | ⚠️ Change |

### Typography

| Property | Current | Target | Status |
|----------|---------|--------|--------|
| Font family | DM Sans + JetBrains Mono | DM Sans + JetBrains Mono | ✅ Match |
| Base size | 15px | 15px | ✅ Match |
| Scale | xs→4xl | xs→4xl | ✅ Match |

### Spacing & Radius

| Token | Current | Target | Status |
|-------|---------|--------|--------|
| `--radius-sm` | 8px | 8px | ✅ Match |
| `--radius` | 12px | 12px | ✅ Match |
| `--radius-lg` | 16px | 16px | ✅ Match |
| `--radius-xl` | 20px | 20px | ✅ Match |
| Spacing scale | 1-24 (4px base) | 1-24 (4px base) | ✅ Match |

---

## Phase 1: Foundation — CSS Variables (Do First)

### 1.1 Update Root CSS Variables (Dark → Light)

**File: `src/index.css`, lines 17-168**

The root `:root` block currently defines dark-mode values. We need to change these to the corporate light-mode values AND make the dark mode a `body.dark-mode` override instead.

Current structure:
```css
:root {
  /* Dark values */
  --color-primary: oklch(0.62 0.18 35);  /* amber */
  --bg-base: oklch(0.08 0.02 260);
  --text-primary: oklch(0.95 0.01 260);
  /* ... all dark values ... */
}
body.light-mode {
  /* Light overrides */
}
```

New structure:
```css
:root {
  /* Light (corporate) values as default */
  --color-primary: oklch(0.6 0.16 265);  /* blue */
  --bg-base: oklch(0.96 0.01 260);        /* #f8fafc */
  --text-primary: oklch(0.12 0.02 260);
  /* ... all light values ... */
}
body.dark-mode {
  /* Dark overrides */
}
```

This is the BIGGEST change — flipping the entire color system from dark-first to light-first.

**Detailed change table for `:root` block (lines 17-168):**

| Line(s) | Current | Target |
|---------|---------|--------|
| 18 | `--color-primary: oklch(0.62 0.18 35)` | `--color-primary: oklch(0.6 0.16 265)` |
| 19 | `--color-primary-light: oklch(0.70 0.16 35)` | `--color-primary-light: oklch(0.5 0.18 265)` |
| 20 | `--color-primary-dark: oklch(0.52 0.20 35)` | `--color-primary-dark: oklch(0.4 0.16 265)` |
| 21 | `--color-primary-glow: oklch(0.62 0.18 35 / 0.40)` | `--color-primary-glow: oklch(0.55 0.15 265 / 0.2)` |
| 22 | `--color-primary-soft: oklch(0.62 0.18 35 / 0.12)` | `--color-primary-soft: oklch(0.55 0.15 265 / 0.1)` |
| 36 | `--bg-base: oklch(0.08 0.02 260)` | `--bg-base: oklch(0.96 0.01 260)` |
| 37 | `--bg-elevated: oklch(0.10 0.03 260)` | `--bg-elevated: oklch(0.98 0.005 260)` |
| 38 | `--bg-card: oklch(1 0 0 / 0.035)` | `--bg-card: oklch(1 0 0 / 0.95)` |
| 39 | `--bg-card-hover: oklch(1 0 0 / 0.055)` | `--bg-card-hover: oklch(1 0 0 / 0.98)` |
| 40 | `--bg-sidebar: oklch(0.06 0.02 260)` | `--bg-sidebar: oklch(0.92 0.01 260)` |
| 41 | `--bg-glass: oklch(0.10 0.03 260 / 0.85)` | `--bg-glass: oklch(0.98 0.005 260 / 0.90)` |
| 42 | `--bg-surface: oklch(0.12 0.03 260)` | `--bg-surface: oklch(0.90 0.01 260)` |
| 43 | `--border: oklch(1 0 0 / 0.07)` | `--border: oklch(0 0 0 / 0.10)` |
| 44 | `--border-strong: oklch(1 0 0 / 0.12)` | `--border-strong: oklch(0 0 0 / 0.18)` |
| 45 | `--border-accent: oklch(0.62 0.18 35 / 0.25)` | `--border-accent: oklch(0.55 0.15 265 / 0.2)` |
| 46 | `--text-primary: oklch(0.95 0.01 260)` | `--text-primary: oklch(0.12 0.02 260)` |
| 47 | `--text-secondary: oklch(0.65 0.03 260)` | `--text-secondary: oklch(0.35 0.02 260)` |
| 48 | `--text-muted: oklch(0.40 0.03 260)` | `--text-muted: oklch(0.50 0.02 260)` |
| 49 | `--text-dim: oklch(0.25 0.05 260)` | `--text-dim: oklch(0.60 0.02 260)` |
| 54 | `--shadow-sm: 0 2px 8px oklch(0 0 0 / 0.3)` | `--shadow-sm: 0 2px 8px oklch(0 0 0 / 0.06)` |
| 55 | `--shadow: 0 4px 20px oklch(0 0 0 / 0.4)` | `--shadow: 0 4px 20px oklch(0 0 0 / 0.08)` |
| 56 | `--shadow-lg: 0 8px 40px oklch(0 0 0 / 0.5)` | `--shadow-lg: 0 8px 40px oklch(0 0 0 / 0.1)` |
| 57 | `--shadow-xl: 0 16px 60px oklch(0 0 0 / 0.6)` | `--shadow-xl: 0 16px 60px oklch(0 0 0 / 0.12)` |
| 58 | `--shadow-accent: 0 8px 32px var(--color-primary-glow)` | Keep (auto-adapts) |
| 74 | `--secondary: oklch(0.15 0.03 260)` | `--secondary: oklch(0.90 0.01 260)` |
| 77 | `--muted: oklch(0.15 0.03 260)` | `--muted: oklch(0.90 0.01 260)` |
| 101 | `--shadow-glow: ... var(--color-primary-glow)` | Keep (auto-adapts) |
| 102-104 | Shadow colored/neon/soft-white | Update to lighter values |
| 105-107 | Glass values | Update to light values |
| 120 | `--surface-raised: var(--bg-elevated)` | `--surface-raised: oklch(1 0 0)` |
| 122 | `--surface-sunken: var(--bg-base)` | `--surface-sunken: oklch(0.96 0.01 260)` |
| 123-132 | Primary color scale (50-900) | Update hue from 35 to 265 |

### 1.2 Flip `body.light-mode` → `body.dark-mode` (lines 170-220)

Rename the class and invert values:

**Before (line 170):**
```css
body.light-mode {
```
**After:**
```css
body.dark-mode {
```

Then swap ALL values inside to be the OLD dark values (i.e., move current `:root` values into `body.dark-mode`).

Key changes inside `body.dark-mode`:
- `--color-primary: oklch(0.62 0.18 35)` (amber — old default)
- `--bg-base: oklch(0.08 0.02 260)` (dark)
- `--text-primary: oklch(0.95 0.01 260)` (light text)
- etc.

### 1.3 Update `body.light-mode` References Throughout CSS

Search for ALL instances of `body.light-mode` in the file and change them:

| Line(s) | Current | Change to |
|---------|---------|-----------|
| 232 | `body.light-mode { background-image: none; }` | `body.dark-mode { background-image: ... }` |
| 236 | `body.light-mode ::selection` | `body.dark-mode ::selection` |
| 243-244 | `body.light-mode ::-webkit-scrollbar-thumb` | `body.dark-mode ::-webkit-scrollbar-thumb` |
| 255-263 | `body.light-mode input:focus` (4 blocks) | `body.dark-mode input:focus` |
| 259-262 | `body.light-mode input` | `body.dark-mode input` |
| 263 | `body.light-mode input::placeholder` | `body.dark-mode input::placeholder` |
| 293-297 | `body.light-mode thead/tbody` | `body.dark-mode thead/tbody` |
| 407-410 | `body.light-mode [data-sonner-toast]` | `body.dark-mode [data-sonner-toast]` |
| 408 | `body.light-mode aside` | `body.dark-mode aside` |
| 409 | `body.light-mode header` | `body.dark-mode header` |
| 410 | `body.light-mode .bg-card, ...` | `body.dark-mode .bg-card, ...` |
| 502-551 | `body.light-mode .modal-*` (11 blocks) | `body.dark-mode .modal-*` |
| 604-610 | `body.light-mode .btn-*` | `body.dark-mode .btn-*` |
| 619-620 | `body.light-mode .card` | `body.dark-mode .card` |
| 636-644 | `body.light-mode .input-default` | `body.dark-mode .input-default` |
| 658 | `body.light-mode .text-primary-color` | `body.dark-mode .text-primary-color` |

Total: ~60+ `body.light-mode` → `body.dark-mode` replacements.

### 1.4 Update Body Background

**Line 229-230** (body background gradient):
```css
body {
  background-image: radial-gradient(ellipse 80% 50% at 50% -20%, 
    var(--color-primary-ultra) 0%, transparent 60%), 
    radial-gradient(ellipse 60% 40% at 80% 80%, 
    var(--color-secondary-soft) 0%, transparent 50%);
}
```
For corporate light: Keep the gradient but with lighter values. Or remove entirely for cleaner look.

**Recommendation:** Remove the background gradient for light mode (set `background-image: none` on `:root body` and add it back only in `body.dark-mode`).

### 1.5 Update Light-mode Input Styles

**Line 259-263**: The `body.light-mode input` is currently an override block. After flipping to dark-mode:
- Light mode (default) inputs should use `background: oklch(1 0 0)`, `border-color: var(--border-strong)`
- Dark mode inputs should use `background: oklch(0 0 0 / 0.4)`, `border-color: var(--border)`

### 1.6 Update Focus Ring Colors

**Line 251-253, 255-258**: Change focus ring to blue:
```css
/* Default (light) focus */
input:focus {
  box-shadow: 0 0 0 3px oklch(0.55 0.15 265 / 0.1), 
              0 0 12px oklch(0.55 0.15 265 / 0.05) !important;
}
```

---

## Phase 2: Fix Hardcoded Hex Colors

### 2.1 Modal Component Hardcoded Colors

**File: `src/index.css`, lines 413-551**

The ENTIRE modal section uses hardcoded hex colors instead of CSS variables. This is the biggest source of hardcoded colors.

| Line(s) | Current Hardcoded | Should Use |
|---------|------------------|------------|
| 417 | `rgba(5,10,20,0.8)` | `var(--surface-overlay)` |
| 421 | `linear-gradient(180deg, #0f1e35 0%, #0c1628 100%)` | `var(--gradient-card)` or `var(--bg-elevated)` |
| 424 | `rgba(255,255,255,0.09)` | `var(--border)` |
| 426 | `rgba(0,0,0,0.6)` | `var(--shadow-xl)` as shadow |
| 437 | `rgba(255,255,255,0.15)` | `var(--border)` |
| 442 | `rgba(255,255,255,0.06)` | `var(--border)` |
| 446 | `#f1f5f9` | `var(--text-primary)` |
| 449 | `rgba(255,255,255,0.06)` | `var(--bg-card)` |
| 450 | `#64748b` | `var(--text-muted)` |
| 457-458 | `rgba(239,68,68,0.15)` / `#ef4444` | `var(--color-danger-soft)` / `var(--color-danger)` |
| 467 | `rgba(5,10,20,0.75)` | `var(--surface-overlay)` |
| 471-473 | `#0f1e35 / #0c1628` gradients | `var(--bg-surface)` / `var(--bg-elevated)` |
| 474 | `rgba(0,0,0,0.6)` | `var(--shadow-xl)` |
| 476-477 | `rgba(0,0,0,0.09)` | `var(--border)` |
| 481 | `rgba(255,255,255,0.06)` | `var(--border)` |
| 484 | `#f1f5f9` | `var(--text-primary)` |
| 488 | `rgba(255,255,255,0.06)` | `var(--bg-card)` |
| 489 | `#64748b` | `var(--text-muted)` |
| 494-496 | `rgba(239,68,68,0.15)` / `#ef4444` | `var(--color-danger-soft)` / `var(--color-danger)` |

**Light mode modal overrides (lines 502-551):**

| Line(s) | Current | Should Use |
|---------|---------|------------|
| 503 | `rgba(240,242,248,0.85)` | `var(--surface-overlay)` |
| 506 | `linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)` | `var(--gradient-card)` |
| 507 | `rgba(0,0,0,0.10)` | `var(--border)` |
| 508 | `rgba(0,0,0,0.12)` | `var(--shadow-xl)` |
| 517 | `#0f172a` | `var(--text-primary)` |
| 525 | `#dc2626` | `var(--color-danger)` |
| 531 | Same gradients | `var(--gradient-card)` |
| 539 | `#0f172a` | `var(--text-primary)` |
| 547 | `#dc2626` | `var(--color-danger)` |

### 2.2 Guest Badge Hardcoded Colors

**File: `src/index.css`, lines 899-906**

```css
/* Current */
.guest-badge {
  background: linear-gradient(135deg, #ff5722, #ff9800);
  color: #fff;
}
.user-menu-status.guest { color: #ff9800; }

/* Target — use CSS variables */
.guest-badge {
  background: linear-gradient(135deg, var(--color-warning), var(--color-warning-light));
  color: oklch(1 0 0);
}
.user-menu-status.guest { color: var(--color-warning); }
```

### 2.3 Dash Statcard Hardcoded Colors

**File: `src/index.css`, lines 1682-1685**

```css
/* Current */
.dash-statcard-trend.up { color: #10b981; background: rgba(16,185,129,0.12); }
.dash-statcard-trend.down { color: #ef4444; background: rgba(239,68,68,0.12); }
.dash-statcard-label { color: rgba(255,255,255,0.4); }
.dash-statcard-sub { color: rgba(255,255,255,0.25); }

/* Target */
.dash-statcard-trend.up { color: var(--color-success); background: var(--color-success-soft); }
.dash-statcard-trend.down { color: var(--color-danger); background: var(--color-danger-soft); }
.dash-statcard-label { color: var(--text-muted); }
.dash-statcard-sub { color: var(--text-dim); }
```

### 2.4 Login Background Animations

**File: `src/index.css`, line 1361**

```css
/* Current */
@keyframes loginGlowPulse {
  0%,100% { box-shadow: 0 0 40px rgba(255,87,34,0.12), 0 40px 120px rgba(0,0,0,0.6); }
  50% { box-shadow: 0 0 70px rgba(255,87,34,0.22), 0 40px 120px rgba(0,0,0,0.6); }
}

/* Target — use CSS variables */
@keyframes loginGlowPulse {
  0%,100% { box-shadow: 0 0 40px var(--color-primary-soft), 0 40px 120px var(--shadow-xl); }
  50% { box-shadow: 0 0 70px var(--color-primary-glow), 0 40px 120px var(--shadow-xl); }
}
```

### 2.5 Modal.tsx Inline Styles

**File: `src/components/Modal.tsx`, line 49**

```tsx
/* Current — the modal uses CSS classes, no hardcoded inline styles. 
   But it does pass maxWidth via style: */
<div className="modal-desktop-content" style={{ maxWidth }}>
```

The `style={{ maxWidth }}` is acceptable (it's dynamic). No change needed.

---

## Phase 3: Update Theme Provider for Corporate Default

### 3.1 Make Corporate the Default Theme

**File: `src/theme/ThemeProvider.tsx`, line 110**

```tsx
// Current
currentThemeId: uiPrefs.themeId || 'carbon',

// Target
currentThemeId: uiPrefs.themeId || 'corporate',
```

### 3.2 Ensure Builtin Theme Map Has Corporate-like Values

**File: `src/theme/ThemeProvider.tsx`, line 125-133**

The current `BUILTIN_THEME_MAP` doesn't need changing since it's for builtin themes. But ensure the `carbon` default isn't wrong:
- `carbon: { accent: '#22c55e', bg: '#041512', light: false }` — stays for those who select it

---

## Phase 4: Sidebar & Header Updates

### 4.1 Sidebar Background for Light Mode

**File: `src/index.css`, line 669**

```css
/* Current — dark-specific gradient */
.app-sidebar {
  background: linear-gradient(180deg, oklch(0.06 0.02 260) 0%, oklch(0.08 0.02 260) 60%, oklch(0.06 0.02 260) 100%);
}

/* Target — light gradient, add dark-mode override */
.app-sidebar {
  background: linear-gradient(180deg, oklch(0.94 0.01 260) 0%, oklch(0.92 0.01 260) 60%, oklch(0.94 0.01 260) 100%);
}
body.dark-mode .app-sidebar {
  background: linear-gradient(180deg, oklch(0.06 0.02 260) 0%, oklch(0.08 0.02 260) 60%, oklch(0.06 0.02 260) 100%);
}
```

### 4.2 Sidebar Shadow for Light

**Line 669**: Change `box-shadow: 4px 0 30px oklch(0 0 0 / 0.3)` to lighter:
```
box-shadow: 4px 0 30px oklch(0 0 0 / 0.06);
```

### 4.3 Header Background

**Line 828**: `var(--bg-glass)` already adapts. But the `backdrop-filter: blur(20px)` and border will look different on light. Should be fine with CSS vars.

---

## Phase 5: Dashboard & StatCard Updates

### 5.1 Update StatCard Inline Styles

**File: `src/pages/Dashboard.tsx`, lines 33-36**

```tsx
/* Current — inline styles with dynamic color */
style={{
  background: `linear-gradient(135deg, ${gradient})`,
  border: `1px solid ${color}22`,
  boxShadow: `0 2px 8px ${color}10`,
}}

/* Target — use CSS variables with className, keep minimal inline */
style={{
  background: `linear-gradient(135deg, ${gradient})`,
  border: `1px solid var(--border)`,
  boxShadow: `var(--shadow-sm)`,
}}
```

### 5.2 StatCard Value Color

**Line 42**: Change from inline `style={{ color }}` to CSS class:
```tsx
/* Current */
<div className="dash-statcard-value" style={{ color }}>{value}</div>

/* Target — use CSS variable or keep minimal inline for dynamic values */
<div className="dash-statcard-value" style={{ color }}>{value}</div>
```
(Keep inline for dynamic color — this is acceptable for data-driven colors)

---

## Phase 6: Button System Updates

### 6.1 Shadcn Button — Keep Default Variant

**File: `src/components/ui/button.tsx`, line 13-15**

```tsx
// Current (already uses CSS vars - good)
default:
  "bg-primary text-primary-foreground border border-primary-border",
```

No change needed — the `--primary` and `--primary-foreground` CSS vars will auto-adapt with the new colors.

---

## Phase 7: Sidebar Icon Colors

### 7.1 Priority Tab Active Colors

**File: `src/index.css`, lines 688-697**

The `.app-priority-tab.ana.active` uses `var(--color-primary-light)` and `var(--color-primary-soft)`. Since we're changing primary from amber to blue, these will auto-adapt.

**However**, the `border-color` should be blue for corporate:
```css
.app-priority-tab.ana.active {
  border-color: var(--color-primary-soft);   /* auto-adapts to blue */
  background: var(--color-primary-soft);     /* auto-adapts to blue */
  color: var(--color-primary);               /* auto-adapts to blue */
}
```
✅ No change needed — CSS variables handle this.

### 7.2 Navigation Tab Active States

**File: `src/index.css`, lines 725-746**

All `.app-nav-tab-btn.ana.active` and similar use CSS variables. These auto-adapt.

---

## Phase 8: Quick Form & Action Styles

### 8.1 Quick Submit Buttons

**File: `src/index.css`, lines 865-869**

All use `var(--color-primary)`, `var(--color-success)`, `var(--color-danger)` which auto-adapt.

### 8.2 Quick Input Background

**Line 859**: `.quick-form-input` uses `background: oklch(0 0 0 / 0.4)` — this is dark-specific. Should change to:
```css
/* Default (light) */
.quick-form-input {
  background: oklch(1 0 0);
}
body.dark-mode .quick-form-input {
  background: oklch(0 0 0 / 0.4);
}
```

### 8.3 Quick Summary Box

**Line 864**: `.quick-summary-box` uses `background: oklch(0 0 0 / 0.3)`. Same issue:
```css
.quick-summary-box {
  background: var(--bg-card);
}
```
✅ Use `var(--bg-card)` which auto-adapts.

---

## Phase 9: Login Screen

### 9.1 Login Background Gradient

**File: `src/index.css`, lines 1375-1379**

```css
/* Current — dark-specific */
.login-bg-gradient {
  background: linear-gradient(-45deg, oklch(0.06 0.02 260), oklch(0.09 0.03 260), ...);
}

/* Target — make it adapt */
.login-bg-gradient {
  background: linear-gradient(-45deg, var(--bg-base), var(--bg-elevated), var(--bg-surface));
}
```

### 9.2 Login Card

**Line 1434**: Uses `var(--bg-card)` — ✅ auto-adapts.
**Line 1441**: Uses `animation: loginGlowPulse` — needs CSS variable update as noted in 2.4.

---

## Phase 10: Premium Theme CSS Var Updates

### 10.1 Update Corporate Theme CSS Vars

**File: `src/theme/themes.ts`, lines 12-48**

The corporate theme definition is already correct (it's the target). However, ensure the values match what we're putting in `:root`:

- `--shadow-sm`: `0 2px 8px oklch(0 0 0 / 0.06)` ✅ matches target
- All other values ✅ match target

### 10.2 Apply Premium CSS Vars Only When Needed

When the default `:root` already has corporate values, the premium theme application in `ThemeProvider.tsx` will still apply `premium.cssVars`. This is a **double-application** — the root already has the values, then ThemeProvider sets them again via inline styles.

**To fix:** Make `ThemeProvider.tsx` check if current theme is the default before applying:
```tsx
// In ThemeProvider.tsx, applyTheme function
if (isPremiumTheme(prefs.themeId)) {
  const premium = getPremiumTheme(prefs.themeId);
  if (premium) {
    isPremiumRef.current = true;
    // Don't re-set if already set in :root
    // But setting via style attributes is fine — it takes precedence
    Object.entries(premium.cssVars).forEach(([key, value]) => {
      if (value !== undefined) {
        root.style.setProperty(key, value);
      }
    });
  }
}
```
This double-application is harmless — the inline style will just confirm what's already in `:root`.

---

## Phase 11: Remove Amber-Hue Traces

### 11.1 Update Primary Color Scale

**File: `src/index.css`, lines 123-132**

The primary color scale uses hue `35` (amber). Change to hue `265` (blue):

| Line | Current | Change to |
|------|---------|-----------|
| 123 | `--color-primary-50: oklch(0.95 0.03 35 / 0.05)` | `oklch(0.95 0.03 265 / 0.05)` |
| 124 | `--color-primary-100: oklch(0.95 0.03 35 / 0.1)` | `oklch(0.95 0.03 265 / 0.1)` |
| 125 | `--color-primary-200: oklch(0.9 0.06 35 / 0.2)` | `oklch(0.9 0.06 265 / 0.2)` |
| 126 | `--color-primary-300: oklch(0.8 0.1 35 / 0.4)` | `oklch(0.8 0.1 265 / 0.4)` |
| 127 | `--color-primary-400: oklch(0.7 0.14 35 / 0.6)` | `oklch(0.7 0.14 265 / 0.6)` |
| 128 | `--color-primary-500: oklch(0.62 0.18 35)` | `oklch(0.6 0.16 265)` |
| 129 | `--color-primary-600: oklch(0.52 0.20 35)` | `oklch(0.5 0.18 265)` |
| 130 | `--color-primary-700: oklch(0.42 0.18 35)` | `oklch(0.4 0.16 265)` |
| 131 | `--color-primary-800: oklch(0.32 0.14 35)` | `oklch(0.3 0.12 265)` |
| 132 | `--color-primary-900: oklch(0.22 0.10 35)` | `oklch(0.2 0.08 265)` |

Also update the `body.dark-mode` equivalent scale (same lines but inside dark-mode block).

### 11.2 Update Gradients That Reference Amber

**Line 110**: `--gradient-primary: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))` — ✅ auto-adapts

### 11.3 Update Chart Colors

**Lines 87-91**: Chart colors reference semantic variables — ✅ auto-adapts.

---

## Phase 12: Responsive & Print Fixes

### 12.1 Print Styles

**File: `src/index.css`, lines 974-978**

```css
/* Current — assumes dark background */
@media print {
  body { background: oklch(1 0 0) !important; color: oklch(0 0 0) !important; }
}
```
✅ These already work for light mode. No change needed.

### 12.2 Mobile Modal Bottom Sheet

**Line 987**: `border-radius: 20px 20px 0 0` — ✅ fine.

---

## Phase 13: Update AGENTS.md Rules

### 13.1 Version About the Skin

**File: `src/components/AGENTS.md`** — update design rules section to reference corporate light theme.

---

## Files Changed Summary

| File | Changes | Risk |
|------|---------|------|
| `src/index.css` | ~80 changes (flip dark→light, fix hardcoded colors, update modal) | High |
| `src/theme/ThemeProvider.tsx` | 1 change (default theme 'carbon' → 'corporate') | Low |
| `src/theme/themes.ts` | 0 changes (already correct) | None |
| `src/components/Modal.tsx` | 0 changes (uses CSS classes) | None |
| `src/pages/Dashboard.tsx` | ~4 changes (StatCard inline styles → use CSS vars) | Medium |
| `src/components/AGENTS.md` | ~1 change (design rules update) | Low |

---

## Quick Reference: Copy-Paste Ready Code

### New `:root` Block (Corporate Light)

Replace lines 17-168 with:

```css
:root {
  /* ── Primary: Blue (#2563eb) ─── */
  --color-primary: oklch(0.6 0.16 265);
  --color-primary-light: oklch(0.5 0.18 265);
  --color-primary-dark: oklch(0.4 0.16 265);
  --color-primary-glow: oklch(0.55 0.15 265 / 0.2);
  --color-primary-soft: oklch(0.55 0.15 265 / 0.1);
  --color-primary-ultra: oklch(0.55 0.15 265 / 0.05);
  --color-secondary: oklch(0.60 0.14 260);
  --color-secondary-soft: oklch(0.60 0.14 260 / 0.10);
  --color-accent: oklch(0.58 0.18 280);
  --color-accent-soft: oklch(0.58 0.18 280 / 0.10);
  --color-success: oklch(0.65 0.18 160);
  --color-success-soft: oklch(0.65 0.18 160 / 0.10);
  --color-warning: oklch(0.70 0.18 85);
  --color-warning-soft: oklch(0.70 0.18 85 / 0.10);
  --color-danger: oklch(0.60 0.22 30);
  --color-danger-soft: oklch(0.60 0.22 30 / 0.10);
  --color-info: oklch(0.60 0.14 260);
  --color-info-soft: oklch(0.60 0.14 260 / 0.10);
  /* ── Backgrounds ─── */
  --bg-base: oklch(0.96 0.01 260);
  --bg-elevated: oklch(0.98 0.005 260);
  --bg-card: oklch(1 0 0 / 0.95);
  --bg-card-hover: oklch(1 0 0 / 0.98);
  --bg-sidebar: oklch(0.92 0.01 260);
  --bg-glass: oklch(0.98 0.005 260 / 0.90);
  --bg-surface: oklch(0.90 0.01 260);
  /* ── Borders ─── */
  --border: oklch(0 0 0 / 0.10);
  --border-strong: oklch(0 0 0 / 0.18);
  --border-accent: oklch(0.55 0.15 265 / 0.2);
  /* ── Text ─── */
  --text-primary: oklch(0.12 0.02 260);
  --text-secondary: oklch(0.35 0.02 260);
  --text-muted: oklch(0.50 0.02 260);
  --text-dim: oklch(0.60 0.02 260);
  /* ── Radius ─── */
  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  /* ── Shadows ─── */
  --shadow-sm: 0 2px 8px oklch(0 0 0 / 0.06);
  --shadow: 0 4px 20px oklch(0 0 0 / 0.08);
  --shadow-lg: 0 8px 40px oklch(0 0 0 / 0.1);
  --shadow-xl: 0 16px 60px oklch(0 0 0 / 0.12);
  --shadow-accent: 0 8px 32px var(--color-primary-glow);
  /* ── Fonts ─── */
  --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  --font-size-base: 15px;
  --transition: 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  --sidebar-width: 240px;
  /* ── Semantic Tokens ─── */
  --background: var(--bg-base);
  --foreground: var(--text-primary);
  --card: var(--bg-card);
  --card-foreground: var(--text-primary);
  --popover: oklch(1 0 0 / 0.98);
  --popover-foreground: var(--text-primary);
  --primary: var(--color-primary);
  --primary-foreground: oklch(1 0 0 / 0.95);
  --primary-border: var(--color-primary);
  --secondary: oklch(0.90 0.01 260);
  --secondary-foreground: var(--text-secondary);
  --secondary-border: var(--border);
  --muted: oklch(0.90 0.01 260);
  --muted-foreground: var(--text-muted);
  --accent: var(--color-accent);
  --accent-foreground: var(--text-primary);
  --destructive: var(--color-danger);
  --destructive-foreground: oklch(1 0 0 / 0.95);
  --destructive-border: var(--color-danger);
  --border-input: var(--border);
  --ring: var(--color-primary);
  --button-outline: var(--border-strong);
  --chart-1: var(--color-primary);
  --chart-2: var(--color-secondary);
  --chart-3: var(--color-accent);
  --chart-4: var(--color-success);
  --chart-5: var(--color-warning);
  --sidebar-background: var(--bg-sidebar);
  --sidebar-foreground: var(--text-primary);
  --sidebar-primary: var(--color-primary);
  --sidebar-primary-foreground: oklch(1 0 0 / 0.95);
  --sidebar-accent: var(--color-primary-soft);
  --sidebar-accent-foreground: var(--text-primary);
  --sidebar-border: var(--border);
  --sidebar-ring: var(--color-primary);
  /* ── Premium Theme Tokens ─── */
  --shadow-glow: 0 0 20px var(--color-primary-glow);
  --shadow-colored: 0 4px 20px oklch(0.55 0.15 265 / 0.1);
  --shadow-neon: 0 0 40px oklch(0.55 0.15 265 / 0.06), 0 0 80px oklch(0.55 0.15 265 / 0.03);
  --shadow-soft-white: 0 2px 15px oklch(0 0 0 / 0.04);
  --glass-bg: oklch(1 0 0 / 0.9);
  --glass-bg-light: oklch(1 0 0 / 0.97);
  --glass-border: oklch(0 0 0 / 0.06);
  --glass-blur: blur(12px);
  --glass-blur-heavy: blur(24px);
  --gradient-primary: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  --gradient-card: linear-gradient(135deg, oklch(1 0 0), oklch(0.98 0.005 265));
  --gradient-glass: linear-gradient(135deg, var(--glass-bg), var(--glass-bg-light));
  --gradient-shine: linear-gradient(135deg, transparent 30%, oklch(0 0 0 / 0.03) 50%, transparent 70%);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-snappy: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 0.12s;
  --duration-normal: 0.2s;
  --duration-slow: 0.35s;
  --surface-raised: oklch(1 0 0);
  --surface-overlay: oklch(0 0 0 / 0.2);
  --surface-sunken: oklch(0.96 0.01 260);
  --color-primary-50: oklch(0.95 0.03 265 / 0.05);
  --color-primary-100: oklch(0.95 0.03 265 / 0.08);
  --color-primary-200: oklch(0.92 0.06 265 / 0.15);
  --color-primary-300: oklch(0.85 0.1 265 / 0.3);
  --color-primary-400: oklch(0.72 0.15 265 / 0.5);
  --color-primary-500: oklch(0.6 0.16 265);
  --color-primary-600: oklch(0.5 0.18 265);
  --color-primary-700: oklch(0.4 0.16 265);
  --color-primary-800: oklch(0.3 0.12 265);
  --color-primary-900: oklch(0.2 0.08 265);
  /* ── Spacing Scale ─── */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 28px;  --space-8: 32px;
  --space-9: 36px; --space-10: 40px; --space-12: 48px; --space-14: 56px;
  --space-16: 64px; --space-20: 80px; --space-24: 96px;
  /* ── Typography Scale ─── */
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.25rem; --text-2xl: 1.5rem;
  --text-3xl: 1.875rem; --text-4xl: 2.25rem;
  --leading-tight: 1.2; --leading-normal: 1.5; --leading-relaxed: 1.75;
  --tracking-tight: -0.02em; --tracking-normal: 0em; --tracking-wide: 0.02em;
  --font-weight-normal: 400; --font-weight-medium: 500;
  --font-weight-semibold: 600; --font-weight-bold: 700;
}
```

### New `body.dark-mode` Block

Replace lines 170-220 with the old `:root` values, wrapped in `body.dark-mode`:

```css
body.dark-mode {
  --color-primary: oklch(0.62 0.18 35);
  --color-primary-light: oklch(0.70 0.16 35);
  --color-primary-dark: oklch(0.52 0.20 35);
  --color-primary-glow: oklch(0.62 0.18 35 / 0.40);
  --color-primary-soft: oklch(0.62 0.18 35 / 0.12);
  --color-primary-ultra: oklch(0.62 0.18 35 / 0.06);
  --bg-base: oklch(0.08 0.02 260);
  --bg-elevated: oklch(0.10 0.03 260);
  --bg-card: oklch(1 0 0 / 0.035);
  --bg-card-hover: oklch(1 0 0 / 0.055);
  --bg-sidebar: oklch(0.06 0.02 260);
  --bg-glass: oklch(0.10 0.03 260 / 0.85);
  --bg-surface: oklch(0.12 0.03 260);
  --border: oklch(1 0 0 / 0.07);
  --border-strong: oklch(1 0 0 / 0.12);
  --border-accent: oklch(0.62 0.18 35 / 0.25);
  --text-primary: oklch(0.95 0.01 260);
  --text-secondary: oklch(0.65 0.03 260);
  --text-muted: oklch(0.40 0.03 260);
  --text-dim: oklch(0.25 0.05 260);
  --shadow-sm: 0 2px 8px oklch(0 0 0 / 0.3);
  --shadow: 0 4px 20px oklch(0 0 0 / 0.4);
  --shadow-lg: 0 8px 40px oklch(0 0 0 / 0.5);
  --shadow-xl: 0 16px 60px oklch(0 0 0 / 0.6);
  --secondary: oklch(0.15 0.03 260);
  --muted: oklch(0.15 0.03 260);
  --popover: var(--bg-elevated);
  --shadow-glow: 0 0 20px var(--color-primary-glow);
  --shadow-soft-white: 0 2px 15px oklch(0 0 0 / 0.3);
  --glass-bg: oklch(0.10 0.03 260 / 0.85);
  --glass-bg-light: oklch(0.10 0.03 260 / 0.6);
  --glass-border: oklch(1 0 0 / 0.08);
  --surface-raised: var(--bg-elevated);
  --surface-overlay: oklch(0 0 0 / 0.6);
  --surface-sunken: var(--bg-base);
  --color-primary-50: oklch(0.95 0.03 35 / 0.05);
  --color-primary-100: oklch(0.95 0.03 35 / 0.1);
  --color-primary-200: oklch(0.9 0.06 35 / 0.2);
  --color-primary-300: oklch(0.8 0.1 35 / 0.4);
  --color-primary-400: oklch(0.7 0.14 35 / 0.6);
  --color-primary-500: oklch(0.62 0.18 35);
  --color-primary-600: oklch(0.52 0.20 35);
  --color-primary-700: oklch(0.42 0.18 35);
  --color-primary-800: oklch(0.32 0.14 35);
  --color-primary-900: oklch(0.22 0.10 35);
  /* Dark BG gradient */
  background-image: radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-primary-ultra) 0%, transparent 60%),
                    radial-gradient(ellipse 60% 40% at 80% 80%, var(--color-secondary-soft) 0%, transparent 50%);
}
```

### New Modal Styles (CSS Variables Only)

Replace the ENTIRE modal section (lines 413-551) with:

```css
/* ── Modal.tsx ─────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9000;
  display: flex; align-items: flex-end; justify-content: center;
  background: var(--surface-overlay); backdrop-filter: blur(8px);
  animation: fadeIn 0.18s ease;
}
.modal-sheet {
  background: var(--gradient-card);
  border-radius: 20px 20px 0 0;
  width: 100%;
  border: 1px solid var(--border);
  border-bottom: none;
  box-shadow: 0 -20px 60px var(--shadow-xl);
  max-height: 92vh; overflow-y: auto;
  animation: slideUpSheet 0.28s cubic-bezier(0.22,1,0.36,1);
}
.modal-handle-wrap {
  display: flex; justify-content: center;
  padding-top: 12px; padding-bottom: 4px;
}
.modal-handle {
  width: 40px; height: 4px;
  border-radius: 2px;
  background: var(--border);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 18px 14px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  font-weight: 800; font-size: 1rem;
  color: var(--text-primary); letter-spacing: -0.01em; margin: 0;
}
.modal-close-btn {
  background: var(--bg-card);
  border: none; color: var(--text-muted); cursor: pointer;
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; flex-shrink: 0;
  transition: all 0.15s;
}
.modal-close-btn:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.modal-body {
  padding: 16px 16px 32px;
}
.modal-desktop-overlay {
  position: fixed; inset: 0; z-index: 9000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px; overflow-y: auto;
  background: var(--surface-overlay); backdrop-filter: blur(8px);
  animation: fadeIn 0.18s ease;
}
.modal-desktop-content {
  background: var(--gradient-card);
  border-radius: 18px; width: 100%;
  border: 1px solid var(--border);
  box-shadow: 0 30px 80px var(--shadow-xl);
  max-height: 90vh; overflow-y: auto;
  animation: modalSlideUp 0.2s ease;
}
.modal-desktop-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.modal-desktop-title {
  font-weight: 800; font-size: 1.05rem;
  color: var(--text-primary); letter-spacing: -0.01em;
}
.modal-desktop-close-btn {
  background: var(--bg-card);
  border: none; color: var(--text-muted); cursor: pointer;
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; transition: all 0.15s;
}
.modal-desktop-close-btn:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.modal-desktop-body {
  padding: 20px 24px;
}
```

(The `body.dark-mode` modal overrides are no longer needed since CSS variables handle it automatically.)

---

## Migration Notes

- **Breaking changes**: The dark→light flip will significantly change the app's appearance. Users will see a light theme by default instead of dark.
- **Deprecations**: `body.light-mode` class is deprecated. All instances replaced with `body.dark-mode`.
- **New additions**: Default `:root` now has light values. Dark mode is the override.
- **Default theme**: Changes from `carbon` to `corporate` in ThemeProvider.

---

## Testing Checklist

- [ ] All pages render in light mode (default) correctly
- [ ] Toggle to `corporate` premium theme — no visual change (already matches)
- [ ] Toggle to `carbon` builtin dark theme — dark mode activates correctly
- [ ] Toggle to all 10 other themes — each works correctly
- [ ] Modal opens/closes with correct colors
- [ ] Login screen renders correctly
- [ ] Dashboard stat cards display correctly
- [ ] Sidebar navigation colors correct
- [ ] Buttons (primary, success, danger, ghost, outline) all correct
- [ ] Quick form / sale modals correct
- [ ] Confirm dialog correct
- [ ] Toast notifications correct
- [ ] Print styles still work
- [ ] Responsive breakpoints intact
- [ ] Touch/mobile adaptations intact
- [ ] Accessibility contrast ratios met (light theme has higher contrast)
- [ ] Capacitor/cordova overrides unaffected

---

## Execution Order

1. **Phase 1**: Flip `:root` and `body.light-mode` → `body.dark-mode` (foundation)
2. **Phase 2**: Fix hardcoded colors in modals, guest badge, statcards
3. **Phase 3**: Update default theme in ThemeProvider
4. **Phase 4**: Update sidebar and header for light
5. **Phase 8**: Update quick form inputs
6. **Phase 11**: Update primary color scale to blue
7. **Test**: Full visual regression test
8. **Phase 5**: Dashboard minor fixes
9. **Final test**: All themes toggle correctly

---
Generated by opencode-reskin | Skin: corporate v1.0
