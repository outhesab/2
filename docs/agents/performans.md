# Performans Budget — Detaylı

> Kısa versiyon: `AGENTS.md` §7.

## Chunk Limitleri (Maksimum)

| Chunk | Maks (gzipped) | İçerik |
|-------|----------------|--------|
| `index` | 300 KB | Ana uygulama (router, App.tsx) |
| `vendor` | 280 KB | React 19, React DOM |
| `firebase` | 200 KB | Firebase SDK |
| `charts` | 420 KB | Recharts, D3 |
| `exceljs` | 1.1 MB | Excel (lazy loaded) |
| `animations` | 130 KB | Framer Motion |
| `radix` | 100 KB | Radix UI primitives |
| `dexie` | 100 KB | IndexedDB (Dexie) |

**Toplam initial bundle:** ~800 KB gzipped (ideal: <500 KB)

## Lazy Loading

### Route-Level (Zorunlu)
Tüm sayfa componentleri `React.lazy()` ile sarılmalı:
```typescript
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
```

### Library-Level (Büyük kütüphaneler)
- `xlsx` (excel) → sadece export sırasında yükle
- `framer-motion` → sadece animasyonlu component'lerde
- `recharts` → dashboard widget'larında

## Yeni Kütüphane Kontrol

Yeni dependency eklemeden önce:
```bash
npx bundlephobia <paket-adı>
```

**Kabul kriterleri:**
- 50KB altı: ✅ Kabul
- 50-100KB: ⚠️ Gerekçe gerekli
- 100KB+: ❌ Alternatif ara, onaysız ekleme

## Code Splitting Stratejisi

- `vendor` — React core (değişmez, her zaman yüklü)
- `index` — app shell (router, providers)
- Sayfa chunk'ları — route bazlı lazy
- Library chunk'ları — kullanım bazlı lazy

## Render Performance

### Memoization
- `React.memo` — pure component
- `useMemo` — pahalı hesaplama
- `useCallback` — function prop (parent → child)

### Re-render Optimizasyonu
- Selector pattern (state → derived value)
- Context split (sık değişen state ayrı context)
- Virtualization (büyük listeler: `react-virtual`)

### useEffect Cleanup
```typescript
useEffect(() => {
  const timer = setInterval(...);
  return () => clearInterval(timer);  // ZORUNLU
}, []);
```

## Build Performance

- **Cold build:** ~1m 30s (full)
- **Warm build:** ~25s (incremental, cache'li)
- CI'da cold build her zaman

## Lighthouse Hedefleri

| Metrik | Hedef |
|--------|-------|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |

## Monitoring

- `web-vitals` ile Core Web Vitals tracking
- `react-scan` ile dev ortamında render sayısı
- Bundle size CI gate (her PR'da kontrol)

## Network Performance

- Firebase sync: 1.2s debounce (çok sık sync yapma)
- IndexedDB snapshot: 5s debounce
- localStorage write: anlık (debounce yok)
