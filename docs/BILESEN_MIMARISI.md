# PARSPEL — Bileşen Mimarisi

> Versiyon: 3.10.0 | Tarih: 30 Mayıs 2026
> Mevcut: 78 bileşen (55 shadcn/ui + 15 custom + 8 layout)

## 1. Bileşen Türleri

```
src/components/
├── ui/             # 55 shadcn/ui primitives — DOKUNMA
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/         # 8 layout bileşeni
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── ...
└── *.tsx           # 15 custom bileşen
    ├── ConfirmDialog.tsx
    ├── ErrorBoundary.tsx
    └── ...
```

| Tür | Klasör | Kural |
|-----|--------|-------|
| shadcn/ui | `ui/` | Hiçbir şekilde değiştirilmez |
| Layout | `layout/` | Sayfa iskeleti, app'te 1 kez kullanılır |
| Custom | root | Projeye özel, reusable bileşenler |

## 2. Stil Kuralları

```tsx
// DOĞRU: CSS class + Tailwind
<div className="flex items-center gap-2 p-4 rounded-lg bg-elevated">
  {children}
</div>

// DOĞRU: CSS Module (sadece sayfalar için)
// Settings.module.css → Settings.tsx

// KABUL EDİLEBİLİR: inline style (dinamik değerler)
<div style={{ color: theme.accent, width: `${pct}%` }}>

// YANLIŞ: inline style statik değerler için
<div style={{ display: 'flex', alignItems: 'center' }}>  // → className kullan
```

| Stil yöntemi | Ne zaman | Örnek |
|-------------|----------|-------|
| Tailwind class | Varsayılan | `className="flex gap-2"` |
| CSS Module | Sayfa özel stiller | `Settings.module.css` |
| Inline style | Sadece dinamik değerler | `style={{ width: pct + '%' }}` |
| CSS variable | Tema renkleri | `var(--text-primary)` |

## 3. Import Kuralları

```tsx
// DOĞRU: @/ alias kullan
import { Button } from '@/components/ui/button';
import { useDB } from '@/hooks/useDB';

// DOĞRU: component içinde component import
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

// YANLIŞ: relative path ile component çağırmak
import { Button } from '../../../components/ui/button';

// YANLIŞ: direkt shadcn/ui import
import { Button } from '@/components/ui/button';  // sadece re-export için
```

## 4. State Kaldırma

```
┌────────────────────────────────────────────────────┐
│                  Page (sayfa)                        │
│  • db verisini useDB() ile okur                     │
│  • save() ile yazar                                │
│  • kendi UI state'ini useState ile yönetir          │
├────────────────────────────────────────────────────┤
│                  Component (çocuk)                   │
│  • props alır, state'i yukarıda                     │
│  • kendi UI state'i olabilir (accordion, dropdown)  │
│  • asla doğrudan DB yazmaz                          │
└────────────────────────────────────────────────────┘
```

**Kural:** Veri aşağı akar (props), olay yukarı akar (callback).

```tsx
// DOĞRU: Component sadece props alır
<StatCard
  icon="💰"
  label="Kasa"
  value={formatMoney(kasaBakiye)}
  onClick={() => onTabChange('kasa')}
/>

// YANLIŞ: Component doğrudan DB okur
// const { db } = useDB(); // ❌ component içinde
```

## 5. Empty Component Kullanımı

```tsx
<Empty>
  <EmptyMedia>📦</EmptyMedia>
  <EmptyHeader>
    <EmptyTitle>Liste boş</EmptyTitle>
  </EmptyHeader>
  <EmptyDescription>
    Henüz kayıt eklenmemiş.
  </EmptyDescription>
</Empty>
```

- Empty, boş liste/dizi durumlarında **zorunludur**
- Her sayfa boş durumunu yönetmelidir
- `EmptyMedia` emoji veya icon alır
- `EmptyDescription` yönlendirici olmalıdır ("İlk ürünü eklemek için + butonunu kullanın.")

## 6. Bileşen Boyutu Sınırı

| Bileşen | Max satır | Uyarı |
|---------|-----------|-------|
| Custom component | 150 satır | 150+ ise böl |
| Layout component | 100 satır | 100+ ise böl |
| Page | 800 satır | 800+ ise böl |
| shadcn/ui | — | hiç dokunma |
