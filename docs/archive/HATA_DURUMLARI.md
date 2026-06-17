# PARSPEL — Hata Durumları Standardı

> Versiyon: 3.10.0 | Tarih: 30 Mayıs 2026

## 1. Her Bileşenin 4 Durumu

Her UI bileşeni şu 4 durumu karşılamalıdır:

```
┌─────────────┐
│   Yükleniyor │  → Loading skeleton / spinner
├─────────────┤
│   Boş       │  → Empty state (Empty component)
├─────────────┤
│   Hata      │  → Error boundary / toast / fallback
├─────────────┤
│   Başarılı  │  → Normal içerik
└─────────────┘
```

### 1.1 Loading State

```tsx
// DOĞRU: SkeletonLoader kullan
import { SkeletonLoader } from '@/components/SkeletonLoaders';

if (loading) return <SkeletonLoader type="card" count={3} />;

// YANLIŞ: "Yükleniyor..." yazısı
// YANLIŞ: inline ternary ile null dönmek
```

### 1.2 Empty State

```tsx
// DOĞRU: Empty component kullan
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';

if (products.length === 0) {
  return (
    <Empty>
      <EmptyMedia>📦</EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>Ürün bulunamadı</EmptyTitle>
      </EmptyHeader>
      <EmptyDescription>İlk ürünü eklemek için + butonunu kullanın.</EmptyDescription>
    </Empty>
  );
}

// YANLIŞ: "Veri yok" yazısı
// YANLIŞ: boş div döndürmek
// YANLIŞ: hiçbir şey göstermemek (boş ekran)
```

### 1.3 Error State

```tsx
// Global hatalar için ErrorBoundary (zaten App.tsx'te sarılı)
// Yerel hatalar için toast:

const { showToast } = useToast();
try {
  await riskyOperation();
} catch (err) {
  showToast(`İşlem başarısız: ${err.message}`, 'error');
}

// Kritik hatalar için fallback UI:
if (criticalError) {
  return <PageFallback error={criticalError} onRetry={retry} />;
}
```

## 2. Bildirim Sistemi

| Tür | Kullanım | Component |
|-----|----------|-----------|
| Toast | Kullanıcı aksiyonu sonucu (kaydetme, silme, hata) | `showToast(msg, type)` — info/success/error/warning |
| Notification Center | Sistem bildirimleri (stok kritik, vade tarihi) | `<NotificationCenter />` |
| Confirm | Silme onayı, riskli işlem | `<ConfirmDialog />` |

### Toast Kullanım Kuralları

```typescript
// Başarılı işlem
showToast('Ürün kaydedildi', 'success');

// Bilgi mesajı
showToast('Firebase sync başladı', 'info');

// Uyarı
showToast('Stok kritik seviyede (3 adet kaldı)', 'warning');

// Hata
showToast('Kaydetme başarısız: stok negatif olamaz', 'error');
```

- Toastlar **otomatik kaybolur** (success/info: 3sn, warning/error: 5sn)
- Üst üste binen toastlar stack'lenir
- Aynı mesaj 5sn içinde tekrarlanırsa **bastırılır**

## 3. Error Boundary Hiyerarşisi

```
<ErrorBoundary>                       // App.tsx — tüm uygulama
  ├── <Sidebar />
  ├── <Header />
  └── <Suspense>                      // React.lazy sayfaları
       └── <ErrorBoundary>            // (her sayfa için ayrı)
            └── <Page />
```

- **Global ErrorBoundary** (App.tsx) — tüm uygulamayı sarar, geri dönülemez hataları yakalar
- **Sayfa ErrorBoundary** — Her sayfa kendi ErrorBoundary'sine sahiptir, sayfa crash'inde diğer sayfalar etkilenmez
- Layout bileşenleri (Sidebar, Header) ErrorBoundary dışındadır — crash'lerinde tüm uygulama kullanılamaz hale gelmemeli

## 4. Skeleton Türleri

```typescript
<SkeletonLoader type="card" count={3} />
<SkeletonLoader type="table" rows={8} />
<SkeletonLoader type="list" count={5} />
<SkeletonLoader type="detail" />       // Detay sayfası için
```

## 5. Kurallar (Checklist)

- [ ] Her sayfa/komponent loading state'e sahip mi? → `SkeletonLoader`
- [ ] Boş veri durumunda Empty component gösteriliyor mu? → `<Empty>`
- [ ] Hata durumunda toast veya fallback var mı? → `showToast` / `PageFallback`
- [ ] Kritik işlemlerde (silme, güncelleme) confirm dialog var mı? → `<ConfirmDialog />`
- [ ] Komponent crash'inde diğer sayfalar çalışıyor mu? → ErrorBoundary
