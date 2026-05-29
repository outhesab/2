# PARSPEL — Figma Tasarım Sistemi

> Versiyon: 3.7.0 | Tarih: 29 Mayıs 2026

Soba Yönetim Sistemi için tam tasarım sistemi ve bileşen kütüphanesi.

## İçerik

| Dosya | Açıklama |
|-------|----------|
| `PARSPEL-DESIGN-SYSTEM.figma.json` | Tasarım tokenları, bileşenler, sayfa tanımları |
| `figma.config.ts` | Figma Code Connect konfigürasyonu |
| `FIGMA.md` | Bu dosya — kurulum rehberi ve referans |

---

## Tasarım Sistemi Özellikleri

### Renkler (OKLCH)

| Token | Değer | Açıklama |
|-------|-------|----------|
| Primary | `oklch(0.62 0.18 35)` | Orange/Amber |
| Secondary | `oklch(0.60 0.14 260)` | Purple/Blue |
| Accent | `oklch(0.58 0.18 280)` | Purple |
| Success | `oklch(0.65 0.18 160)` | Green |
| Warning | `oklch(0.70 0.18 85)` | Yellow |
| Danger | `oklch(0.60 0.22 30)` | Red |
| Info | `oklch(0.60 0.14 260)` | Blue |

### Tipografi

| Scale | Boyut | Weight |
|-------|-------|--------|
| H1 | 1.65rem | 900 |
| H2 | 1.35rem | 800 |
| H3 | 1.15rem | 800 |
| Body | 0.88rem | 400 |
| Small | 0.78rem | 500 |

Fontlar: DM Sans (sans), JetBrains Mono (mono)

### Spacing

```
xs: 4px    | sm: 8px    | md: 12px   | lg: 16px
xl: 20px   | 2xl: 24px  | 3xl: 32px  | 4xl: 40px
```

### Shadows

```
sm: 0 2px 8px oklch(0 0 0 / 0.3)
md: 0 4px 20px oklch(0 0 0 / 0.4)
lg: 0 8px 40px oklch(0 0 0 / 0.5)
xl: 0 16px 60px oklch(0 0 0 / 0.6)
```

---

## Bileşenler

### Form (8)
Input, Textarea, Select, Checkbox, Radio Group, Toggle, Field, Label

### Layout (7)
Card, Accordion, Tabs, Sidebar, Modal, Drawer, Scroll Area

### Dialog (5)
Dialog, Alert Dialog, Confirm Dialog, Popover, Hover Card

### Data Display (5)
Table, Badge, Progress, Pagination, Chart

### Custom (10)
QuickSaleModal, QuickIncomeModal, QuickProductModal, FAB, AI Button, Report Button, NotificationCenter, QuantumLink, SystemMap, InfoRow

---

## Sayfalar

| Grup | Sayfalar |
|------|----------|
| Ana (5) | Dashboard, Dashboard Finans, Dashboard Ticaret, Dashboard Operasyon, Dashboard Strateji |
| İşlem (4) | Sales, Products, Stock, Fatura |
| Tedarik (3) | Suppliers, Pelet, BoruTed |
| Finans (4) | Cari, Kasa, Bütçe, Banka |
| Analiz (5) | Reports, Cizelge, Monitor, Kontrol, Anomali |
| Sistem (7) | Entegrasyon, Excel Merge, Excel Import, Notlar, Partners, Settings, Bug Hunter |

---

## Responsive Tasarım

| | Desktop (>768px) | Mobile (<768px) |
|--|-----------------|-----------------|
| Sidebar | Sabit 236px | Collapsible (hamburger) |
| Main padding | 20px 22px | 12px 8px |
| Card padding | 16px 18px | 12px 14px |
| Tablo | Full view | Card-based view |
| Modal | Centered, max 480px | Bottom sheet (Drawer) |

---

## Animasyonlar

### Transitions
pageEnter: 0.3s ease-out | pageExit: 0.2s ease-in | fadeIn: 0.18s | fadeInUp: 0.3s | scaleIn: 0.2s | slideUp: 0.3s | slideIn: 0.3s

### Keyframes
shimmer, accentGlow, onlinePulse, badgePulse, countUp, reportPulse, micPulse, ripple

---

## Kurulum Rehberi

### Adım 1: Figma Dosyası

1. https://www.figma.com adresine gidin
2. Yeni dosya oluşturun: "PARSPEL — Soba Yönetim Sistemi v3.7"
3. `PARSPEL-DESIGN-SYSTEM.figma.json` dosyasını referans olarak kullanın

### Adım 2: Tasarım Tokenlarını Ayarlama

Figma'da renk, tipografi, spacing ve shadow tokenlarını yukarıdaki değerlere göre tanımlayın.

### Adım 3: Bileşenleri Oluşturma

Her bileşen için:
- Variants tanımlayın (default, hover, active, disabled)
- States ekleyin
- Auto layout kullanın
- Constraints ayarlayın

### Adım 4: Sayfaları Oluşturma

Her sayfa için:
- Frame oluşturun (desktop: 1440px, mobile: 375px)
- Responsive layout ayarlayın
- İçerikleri doldurun

### Adım 5: Animasyonları Tanımlama

Figma Prototype ile:
- Sayfa geçişleri: pageEnter/pageExit
- Hover efektleri: fadeIn, scaleIn
- Yükleme: shimmer

### Adım 6: Code Connect (Opsiyonel)

```bash
npm install @figma/code-connect
figma connect publish
```

```typescript
// figma.config.ts
figmaConnect.react("Button", ({ variant, size, children }) => (
  <Button variant={variant} size={size}>{children}</Button>
));
```

---

## Önerilen Figma Plugins

1. **Design Tokens** — Token yönetimi
2. **Figma to Code** — Kod üretimi
3. **Contrast** — Erişilebilirlik kontrolü
4. **Figma Tokens** — Token senkronizasyonu

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Renkler doğru görünmüyor | OKLCH renk modunu kullanın, Figma renk profilini kontrol edin |
| Bileşenler responsive değil | Auto layout + constraints kullanın |
| Animasyonlar çalışmıyor | Figma Prototype'ı kullanın, interactions tanımlayın |

---

## Kaynaklar

- [Figma Documentation](https://help.figma.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
