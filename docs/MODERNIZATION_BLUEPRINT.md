# 🔷 PARSPEL Modernizasyon Blueprint (Yol Haritası)

## 1. GENEL KARŞILAŞTIRMA TABLOSU
- CSS Framework: Tailwind v4 + shadcn/tailwind
- Tema Sistemi: OKLCH CSS vars (2 paket: Blue/Teal)
- UI Kütüphanesi: @base-ui/react + shadcn Base-Nova
- Font: Geist Sans + Manrope (headings)
- Radius Sistemi: --radius: 0.75rem (12px) tabanlı skala
- Renk Uzayı: OKLCH (tutarlı)

## 2. PROTOTİP BİLEŞENLERİ → MEVCUT SAYFA EŞLEME
- AppShell -> Sidebar.tsx + Header.tsx
- AuthScreen -> LoginScreen.tsx
- Dashboard -> Dashboard.tsx
- Fatura -> Fatura.tsx
- Raporlar -> Reports.tsx

## 3. KORUNACAK STANDARTLAR (Design Tokens)
### Renkler (OKLCH)
- --background: oklch(0.985 0.004 247)
- --foreground: oklch(0.21 0.03 257)
- --primary: oklch(0.52 0.18 258)
- --radius: 0.75rem

### Radius Skalası
- --radius-sm: calc(var(--radius) * 0.6)
- --radius-md: calc(var(--radius) * 0.8)
- --radius-lg: var(--radius)
- --radius-xl: calc(var(--radius) * 1.4)
- --radius-2xl: calc(var(--radius) * 1.8)

## 4. DEĞİŞİM LİSTESİ (Sıralı)
### P1: Global Standartlar
- [ ] design-tokens.css radius güncellemesi
- [ ] Font geçişi (Geist Sans + Manrope)
- [ ] Global Button/Card/Input shadcn migration

### P2: Layout
- [ ] ParspelLogo Flame icon entegrasyonu
- [ ] Header Avatar + Bell icon eklemesi
- [ ] Mobil bottom tab nav eklemesi

### P3: Sayfalar
- [ ] Dashboard: Minimalist StatCard + Avatar'lı tablolar
- [ ] Fatura: Icon'lu özet kartlar + shadcn Badge
- [ ] Reports: ChartContainer + Minimalist summary
- [ ] Login: 2-panel layout + Icon'lu inputlar

## 5. ÖNCELİK SIRALAMASI
1. Radius/Font/Renk standardizasyonu (High Impact, Low Effort)
2. Logo ve Header güncellemeleri (High Impact, Low Effort)
3. Dashboard/Fatura/Reports görsel refactor (High Impact, Medium Effort)
4. LoginScreen tamamen yeniden tasarım (Medium Impact, Medium Effort)
