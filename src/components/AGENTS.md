# PARSPEL — UI Bileşenleri

55 shadcn/ui + 15 custom + 8 layout = 78 bileşen.

## Yapı

```
src/components/
├── ui/               # 55 shadcn/ui bileşeni (Radix UI tabanlı)
├── layout/           # 8 layout bileşeni
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── FAB.tsx
│   ├── AIDrawer.tsx
│   ├── GlobalSearch.tsx
│   ├── UserMenu.tsx
│   ├── ReportButton.tsx
│   └── PageFallback.tsx
├── ConfirmDialog.tsx
├── ErrorBoundary.tsx
├── IconPicker.tsx
├── InfoRow.tsx
├── LoginScreen.tsx
├── MobileSelect.tsx
├── Modal.tsx
├── NotificationCenter.tsx
├── QuantumLink.tsx
├── QuickIncomeModal.tsx
├── QuickProductModal.tsx
├── QuickSaleModal.tsx
├── SetupWizard.tsx
├── SkeletonLoaders.tsx
├── SystemMap.tsx
└── Toast.tsx
```

## Kurallar

- **Yeni bileşenler**: CSS class kullan, `style={}` kullanma
- **shadcn/ui bileşenleri**: `src/components/ui/` altında, dokunma
- **Inline style**: Sadece Modal.tsx'te mevcut. Yenisini ekleme
- **Import**: `@/components/...` ile çağır
- **Empty state**: `<Empty>` bileşeni mevcut (`ui/empty.tsx`), kullan
