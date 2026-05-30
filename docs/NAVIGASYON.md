# PARSPEL — Navigasyon & Route Yapısı

> Versiyon: 3.10.0 | Tarih: 30 Mayıs 2026
> Routing: wouter (~3.6KB), 36+ route, 5 tab grubu

## 1. Routing Mimarisi

```
App.tsx (Router)
 └── Switch
      ├── Route path="/" → Dashboard (lazy)
      ├── Route path="/urunler" → Products (lazy)
      ├── Route path="/urunler/:id" → ProductDetail (lazy)
      ├── Route path="/satis" → Sales (lazy)
      ├── Route path="/satis/:id" → SaleDetail (lazy)
      ├── Route path="/cari" → Cari (lazy)
      ├── Route path="/cari/:id" → CariDetail (lazy)
      ├── ... (30+ route daha)
      └── Route → NotFound
```

Hepsi `React.lazy()` ile yüklenir → ana bundle'a dahil edilmez.

```typescript
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Products = lazy(() => import('@/pages/Products'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
```

## 2. Tab - Route İlişkisi

```
Tab ID              URL Path        Sayfa                    Detay Route
─────────────────────────────────────────────────────────────────────────
dashboard           /               Dashboard.tsx            —
dashboard-finans    /finans         DashboardFinans.tsx      —
products            /urunler        Products.tsx             /urunler/:id
sales               /satis          Sales.tsx                /satis/:id
cari                /cari           Cari.tsx                 /cari/:id
...
```

**Detay route kuralı:** `/kaynak/:id` pattern'i. `getActiveTabFromLocation()` path'i eşleştirir, detay route'larını ana tab'a yönlendirir.

## 3. Tab Grupları

| Grup | ID | Varsayılan expanded |
|------|----|-------------------|
| Ana | `ana` | Evet |
| Tedarik | `tedarik` | Hayır |
| Finans | `finans` | Evet |
| Analiz | `analiz` | Hayır |
| Sistem | `sistem` | Hayır |

```typescript
interface TabGroup {
  id: string;           // grup id
  label: string;        // ekranda görünen
  icon: string;         // emoji
  children: TabId[];    // grup içindeki tab'lar
}
```

## 4. Navigasyon

```typescript
// Programatik navigasyon
const [location, setLocation] = useLocation();
setLocation('/kasa');

// Tab'a navigasyon (stok sayfası güncellemelerinde)
onTabChange('stok');  // Dashboard kartlarından

// Link ile navigasyon
<a href="/urunler">Ürünler</a>
```

## 5. Lazy Loading Kuralları

- Her sayfa `React.lazy()` ile import edilir
- `Suspense` ile sarılır (fallback: `<PageFallback />`)
- `preload` stratejisi: Favori tab'lar önceden yüklenir

```typescript
// App.tsx
<Suspense fallback={<PageFallback loading />}>
  <Route path="/" component={Dashboard} />
</Suspense>
```

## 6. Favorite Tab Sistemi

- Kullanıcı maksimum 6 tab'ı favori olarak işaretleyebilir
- Favori tab'lar localStorage'a (`sobaYonetim_favoriteTabs`) kaydedilir
- Favori tab'lar Sidebar'da üstte gösterilir
- Favori olmayan tab'lar grup altında gösterilir

## 7. Route Ekleme Prosedürü

Yeni bir sayfa eklemek için:

1. `src/pages/` altında sayfa dosyasını oluştur
2. `src/App.tsx`'e lazy import + Route ekle
3. `src/config/tabs.ts`'e tab tanımını ekle (opsiyonel)
4. `src/pages/AGENTS.md`'yi güncelle
5. Detay sayfası ise `/:id` pattern'ini kullan, `getActiveTabFromLocation`'da mapping yap

## 8. Route Kuralları

- [ ] Her route `React.lazy()` ile import edilir (direkt import yasak)
- [ ] Her route `<Suspense>` içinde tanımlanır
- [ ] Path'ler Türkçe: `/urunler`, `/satis`, `/cari` (İngilizce yasak)
- [ ] Detay route'ları `/:id` ile biter
- [ ] `getActiveTabFromLocation()` her yeni route için güncellenir
