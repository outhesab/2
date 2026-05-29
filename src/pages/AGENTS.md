# PARSPEL — Sayfalar

36 sayfa + 8 excelmerge alt sayfası, wouter routing, `src/App.tsx`'te tanımlı.

## Modül Grupları

| Grup | Sayfalar |
|------|----------|
| **Ana** | Dashboard, DashboardFinans, DashboardTicaret, DashboardOperasyon, DashboardStrateji, Products, ProductDetail, Sales, SaleDetail, Fatura |
| **Tedarik** | Suppliers, Pelet, BoruTed |
| **Finans** | Cari, CariDetail, Kasa, Butce, Bank |
| **Analiz** | Reports, Stock, Cizelge, Monitor, KontrolHalkasi, AnomaliOneri |
| **Sistem** | Settings, Entegrasyonlar, ExcelMerge, ExcelImport, Notlar, Partners, OrtakEmanet, BugHunter, AIAsistan, AIEylemLog |

## Özel Dizin

`src/pages/excelmerge/` — ExcelMerge sayfasına ait alt bileşenler:
upload, merge, diff, search, preview, temizle, ai-asistan, not-found

## Kurallar

- Tüm sayfalar `React.lazy()` ile import edilir
- `save((prev: DB) => next: DB)` ile veri yazma
- `useDB()` hook'u ile veri okuma
- Her sayfa kendi içinde bağımsız, ortak state yok
- Empty state eksik (~10 sayfada)
- Error boundary yok (global ErrorBoundary tek başına)

## Routing

```tsx
// src/App.tsx — wouter <Route> tanımları
<Route path="/" component={Dashboard} />
<Route path="/urunler" component={Products} />
<Route path="/urunler/:id" component={ProductDetail} />
<Route path="/satis" component={Sales} />
<Route path="/satis/:id" component={SaleDetail} />
<Route path="/cari" component={Cari} />
<Route path="/cari/:id" component={CariDetail} />
// ... toplam 36+ route
```
