---
name: parspel-bilesen
description: >
  PARSPEL icin UI bileseni gelistirme. shadcn/ui primitives (dokunulmaz),
  layout bilesenleri, custom reusable bilesenler. Tailwind CSS 4, Radix UI,
  Framer Motion, loading/empty/error state patternleri, a11y, responsive.
  Yeni bir UI bileseni olustururken veya mevcut bileseni duzenlerken kullan.
version: 1.1.0
author: PARSPEL
hooks:
  onComplete: true
requires:
  - parspel-test
---

# PARSPEL — Bileşen Geliştirme

## Overview

PARSPEL UI bileşen geliştirme standartları. shadcn/ui primitives dokunulmaz, layout bileşenleri sayfa iskeleti, custom bileşenler projeye özel reusable parçalar.

## Bileşen Türleri

| Tür | Klasör | Kural |
|-----|--------|-------|
| shadcn/ui | `src/components/ui/` | **HIÇ dokunma** |
| Layout | `src/components/layout/` | Sayfa iskeleti, app'te 1 kez |
| Custom | `src/components/` | Projeye özel, reusable |

## Instructions

### 1. Stil Kuralları

```tsx
// DOĞRU: Tailwind class (varsayılan)
<div className="flex items-center gap-2 p-4 rounded-lg bg-elevated">

// DOĞRU: CSS Module (sadece sayfalar)
// Settings.module.css → Settings.tsx

// KABUL: inline style (sadece dinamik değerler)
<div style={{ color: theme.accent, width: `${pct}%` }}>

// YANLIŞ: inline style statik değerler için
<div style={{ display: 'flex' }}>  // → className kullan
```

### 2. State Yönetimi

```
Page (sayfa)               ← useDB() ile db'yi okur, save() ile yazar
  └── Component (çocuk)    ← props alır, callback yukarı akıtır
```

- Component **asla** doğrudan DB yazmaz (`useDB()` kullanmaz)
- Kendi UI state'i olabilir (accordion, dropdown, input)
- Veri aşağı akar (props), olay yukarı akar (callback)

### 3. Import Kuralları

```tsx
// DOĞRU
import { Button } from '@/components/ui/button';
import { useDB } from '@/hooks/useDB';

// YANLIŞ
import { Button } from '../../../components/ui/button';
```

### 4. Zorunlu State Patterns

**Empty State (boş liste):**
```tsx
<Empty>
  <EmptyMedia>📦</EmptyMedia>
  <EmptyHeader><EmptyTitle>Liste boş</EmptyTitle></EmptyHeader>
  <EmptyDescription>İlk ürünü eklemek için + butonunu kullanın.</EmptyDescription>
</Empty>
```

**Loading State:**
```tsx
<PageFallback loading />
```

**Error State:**
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

### 5. Erişilebilirlik (A11y)

```tsx
// Buton
<Button aria-label="Yeni ürün ekle" onClick={...}>

// Form input
<label htmlFor="ad">Ürün Adı</label>
<input id="ad" aria-describedby="ad-desc" />
<span id="ad-desc">Ürünün görünen adı</span>

// Dialog
<Dialog aria-labelledby="dialog-title">
  <h2 id="dialog-title">Onay</h2>
</Dialog>

// Klavye navigasyonu
<div role="tablist" aria-label="Sekmeler">
  <button role="tab" aria-selected={active === "tab1"} ...>
```

### 6. Responsive Tasarım

```tsx
// Mobile-first: varsayılan mobil, büyük ekranlarda override
<div className="
  grid
  grid-cols-1        // mobil: 1 kolon
  sm:grid-cols-2     // tablet: 2 kolon
  lg:grid-cols-3     // desktop: 3 kolon
  gap-4
">
```

| Breakpoint | Min-width | Kullanım |
|-----------|-----------|----------|
| `sm` | 640px | Tablet dikey |
| `md` | 768px | Tablet yatay |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Geniş ekran |

### 7. Bileşen Testi (Smoke Test)

```typescript
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("render edilir", () => {
    const { container } = render(<MyComponent />);
    expect(container).toBeTruthy();
  });
});
```

## Rules

| Kural | Açıklama |
|-------|----------|
| shadcn/ui | **HIÇ dokunma** — otomatik güncelleme ile gelir |
| Tailwind | Varsayılan stil yöntemi Tailwind CSS 4 |
| CSS Module | Sadece sayfa seviyesinde, karmaşık stiller için |
| Inline style | Sadece runtime/dinamik değerler için |
| A11y | Tüm interactive elementlerde `aria-label` zorunlu |
| Responsive | Mobile-first, `sm/md/lg/xl` breakpoint'leri kullan |
| Boyut limiti | Custom 150, Layout 100, Page 800, shadcn dokunma |
| Test | En az smoke test zorunlu |

## Hooks

### onComplete
- Bileşen boyut limitini kontrol et
- A11y kurallarına uyulduğunu doğrula
- Responsive class'ların eklendiğini kontrol et
