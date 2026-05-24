# PARSPEL Figma Tasarım Sistemi Kurulum Rehberi

## 📋 Genel Bakış

Bu rehber, PARSPEL projesinin Figma tasarım sistemini kurmanız ve kullanmanız için adım adım talimatlar sağlar.

## 🚀 Adım 1: Figma Dosyası Oluşturma

1. **Figma'da Oturum Açın**
   - https://www.figma.com adresine gidin
   - Hesabınıza oturum açın

2. **Yeni Dosya Oluşturun**
   - "New file" butonuna tıklayın
   - Dosya adını "PARSPEL — Soba Yönetim Sistemi v3.1" olarak ayarlayın

3. **Tasarım Sistemini İçe Aktarın**
   - `PARSPEL-DESIGN-SYSTEM.figma.json` dosyasını referans olarak kullanın
   - Aşağıdaki bölümleri Figma'da oluşturun

## 🎨 Adım 2: Tasarım Tokenlarını Ayarlama

### Renkler (Colors)

**Primary Colors:**

```
Primary: oklch(0.62 0.18 35) — Orange/Amber
Secondary: oklch(0.60 0.14 260) — Purple/Blue
Accent: oklch(0.58 0.18 280) — Purple
```

**Semantic Colors:**

```
Success: oklch(0.65 0.18 160) — Green
Warning: oklch(0.70 0.18 85) — Yellow
Danger: oklch(0.60 0.22 30) — Red
Info: oklch(0.60 0.14 260) — Blue
```

**Backgrounds:**

```
Base: oklch(0.08 0.02 260) — Very Dark
Elevated: oklch(0.10 0.03 260) — Dark
Card: oklch(1 0 0 / 0.035) — Semi-transparent White
Sidebar: oklch(0.06 0.02 260) — Very Dark
```

**Text:**

```
Primary: oklch(0.95 0.01 260) — Near White
Secondary: oklch(0.65 0.03 260) — Gray
Muted: oklch(0.40 0.03 260) — Dark Gray
Dim: oklch(0.25 0.05 260) — Very Dark Gray
```

### Tipografi

**Font Families:**

- Sans: DM Sans (Google Fonts)
- Mono: JetBrains Mono

**Typography Scales:**

- H1: 1.65rem, Weight 900
- H2: 1.35rem, Weight 800
- H3: 1.15rem, Weight 800
- H4: 1rem, Weight 700
- Body: 0.88rem, Weight 400
- Small: 0.78rem, Weight 500

### Spacing

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
3xl: 32px
4xl: 40px
```

### Border Radius

```
sm: 8px
md: 12px
lg: 16px
xl: 20px
```

### Shadows

```
sm: 0 2px 8px oklch(0 0 0 / 0.3)
md: 0 4px 20px oklch(0 0 0 / 0.4)
lg: 0 8px 40px oklch(0 0 0 / 0.5)
xl: 0 16px 60px oklch(0 0 0 / 0.6)
accent: 0 8px 32px oklch(0.62 0.18 35 / 0.40)
```

## 🧩 Adım 3: Bileşenleri Oluşturma

### Temel Bileşenler

1. **Button**
   - Variants: default, destructive, outline, secondary, ghost, link
   - Sizes: sm, default, lg, icon
   - States: default, hover, active, disabled

2. **Input**
   - Text input field
   - States: default, focus, disabled, error

3. **Card**
   - Container component
   - Includes: Header, Title, Content, Footer

4. **Modal**
   - Desktop: Centered modal
   - Mobile: Bottom sheet
   - Responsive behavior

### Form Bileşenleri

- Input, Textarea, Select
- Checkbox, Radio Group, Toggle
- Field, Label

### Layout Bileşenleri

- Sidebar (236px width)
- Tabs, Accordion, Collapsible
- Scroll Area, Separator

### Dialog Bileşenleri

- Dialog, Alert Dialog
- Confirm Dialog (danger/warning/info/success)
- Popover, Hover Card

### Data Display

- Table (with responsive card view)
- Badge, Progress, Pagination
- Chart (Recharts integration)

### Custom Components

- QuickSaleModal, QuickIncomeModal, QuickProductModal
- FAB (Floating Action Button)
- AI Button, Report Button
- NotificationCenter, QuantumLink

## 📄 Adım 4: Sayfaları Oluşturma

### Ana Sayfalar (5)

1. **Dashboard** — Özet kontrol paneli
2. **Dashboard Finans** — Finansal dashboard
3. **Dashboard Ticaret** — Ticaret dashboard
4. **Dashboard Operasyon** — Operasyon dashboard
5. **Dashboard Strateji** — Strateji dashboard

### İşlem Sayfaları (4)

1. **Sales** — Satış yönetimi
2. **Products** — Ürün kataloğu
3. **Stock** — Stok analizi
4. **Fatura** — Fatura yönetimi

### Tedarik Sayfaları (3)

1. **Suppliers** — Tedarikçi yönetimi
2. **Pelet** — Pelet tedarik
3. **BoruTed** — Boru tedarik

### Finans Sayfaları (4)

1. **Cari** — Cari hesaplar
2. **Kasa** — Kasa yönetimi
3. **Bütçe** — Bütçe planlama
4. **Banka** — Banka hesapları

### Analiz Sayfaları (5)

1. **Reports** — Raporlar
2. **Cizelge** — Çizelge
3. **Monitor** — İzleme
4. **Kontrol** — Kontrol halkası
5. **Anomali** — Anomali tespiti

### Sistem Sayfaları (7)

1. **Entegrasyon** — Entegrasyonlar
2. **Excel Merge** — Veri birleştirme
3. **Excel Import** — Excel içe aktarma
4. **Notlar** — Not defteri
5. **Partners** — Ortak yönetimi
6. **Settings** — Sistem ayarları
7. **Bug Hunter** — Hata raporlama

## 🎬 Adım 5: Animasyonları Tanımlama

### Transitions

- pageEnter: 0.3s ease-out
- pageExit: 0.2s ease-in
- fadeIn: 0.18s ease-out
- fadeInUp: 0.3s ease-out
- scaleIn: 0.2s ease-out
- slideUp: 0.3s ease-out
- slideIn: 0.3s ease-out

### Keyframes

- shimmer — Yükleme animasyonu
- accentGlow — Vurgu parıltısı
- onlinePulse — Çevrimiçi durumu
- badgePulse — Badge nabız
- countUp — Sayı artış
- reportPulse — Rapor nabız
- micPulse — Mikrofon nabız
- ripple — Dalgalanma efekti

## 📐 Adım 6: Responsive Tasarım

### Desktop Layout (>768px)

- Sidebar width: 236px (fixed)
- Main padding: 20px 22px
- Card padding: 16px 18px
- Full table view
- Centered modals

### Mobile Layout (<768px)

- Sidebar: Collapsible (hamburger menu)
- Main padding: 12px 8px
- Card padding: 12px 14px
- Card-based table view
- Bottom sheet modals

## 🔗 Adım 7: Figma Plugins Kurma

Önerilen Figma Plugins:

1. **Design Tokens** — Token yönetimi
2. **Figma to Code** — Kod üretimi
3. **Contrast** — Erişilebilirlik kontrolü
4. **Figma Tokens** — Token senkronizasyonu

## 📝 Adım 8: Dokümantasyon

### Component Library

Her bileşen için oluşturun:

- Component spec
- Usage guidelines
- Do's and Don'ts
- Code examples

### Design System Documentation

- Color palette
- Typography scale
- Spacing system
- Shadow system
- Animation guidelines
- Accessibility guidelines

## 🔄 Adım 9: Code Connect (Opsiyonel)

Figma bileşenlerini React koduna bağlayın:

```typescript
// Button.tsx
import { figmaConnect } from "@figma/code-connect";

figmaConnect.react("Button", ({ variant, size, children }) => (
  <Button variant={variant} size={size}>
    {children}
  </Button>
));
```

## 📤 Adım 10: Paylaşım ve İşbirliği

1. **Takım Üyelerini Davet Edin**
   - Figma dosyasını paylaşın
   - Edit izni verin

2. **Versiyonlama**
   - Figma versiyonlarını kullanın
   - Değişiklikleri takip edin

3. **Feedback**
   - Figma comments kullanın
   - Design reviews yapın

## 🎯 Best Practices

### Tasarım Sistemi

- ✅ Bileşenleri modüler tutun
- ✅ Tutarlı naming conventions kullanın
- ✅ Variants ve states tanımlayın
- ✅ Dokümantasyon güncel tutun
- ✅ Düzenli olarak gözden geçirin

### Figma Dosyası

- ✅ Sayfaları organize edin
- ✅ Frames kullanın
- ✅ Constraints ayarlayın
- ✅ Auto layout kullanın
- ✅ Bileşenleri kütüphaneleştirin

### İşbirliği

- ✅ Açık iletişim kurun
- ✅ Değişiklikleri dokumenteyin
- ✅ Düzenli sync yapın
- ✅ Feedback'i değerlendirin

## 📚 Kaynaklar

- [Figma Documentation](https://help.figma.com)
- [Design System Best Practices](https://www.designsystems.com)
- [PARSPEL GitHub](https://github.com/parspel)
- [React Component Library](https://ui.shadcn.com)

## 🆘 Sorun Giderme

### Renkler doğru görünmüyor

- OKLCH renk modunu kullanın
- Figma'da renk profilini kontrol edin
- Tarayıcı renk ayarlarını kontrol edin

### Bileşenler responsive değil

- Auto layout kullanın
- Constraints ayarlayın
- Breakpoints tanımlayın

### Animasyonlar çalışmıyor

- Figma Prototype'ı kullanın
- Interactions tanımlayın
- Easing functions ayarlayın

## 📞 İletişim

Sorularınız veya önerileriniz için:

- GitHub Issues: [PARSPEL Issues](https://github.com/parspel/issues)
- Email: support@parspel.com
- Slack: #design-system

---

**Son Güncelleme:** 23 Mayıs 2026
**Versiyon:** 3.1.0
**Durum:** Aktif Geliştirme
