# PARSPEL — Sayfalar

27 sayfa, wouter routing, `src/App.tsx`'te tanımlı.

## Modül Grupları

| Grup | Sayfalar |
|------|----------|
| **Ana** | Dashboard, Products, Sales, Fatura |
| **Tedarik** | Suppliers, Pelet, BoruTed |
| **Finans** | Cari, Kasa, Butce, Bank |
| **Analiz** | Reports, Stock, Cizelge, Monitor, KontrolHalkasi, AnomaliOneri |
| **Sistem** | Settings, Entegrasyonlar, ExcelMerge, ExcelImport, Notlar, Partners, BugHunter, AIAsistan |

## Özel Dizin

`src/pages/excelmerge/` — ExcelMerge sayfasına ait alt bileşenler.

## Kurallar

- Tüm sayfalar statik import (React.lazy kullanılmıyor — yeni sayfada kullan)
- `save((prev: DB) => next: DB)` ile veri yazma
- `useDB()` hook'u ile veri okuma
- Her sayfa kendi içinde bağımsız, ortak state yok
- Empty state eksik (~10 sayfada)
- Error boundary yok (global ErrorBoundary tek başına)

## Routing

```tsx
// src/App.tsx — wouter <Route> tanımları
<Route path="/" component={Dashboard} />
<Route path="/sales" component={Sales} />
// ... 27 route
```
