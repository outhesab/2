# 🎨 PARSPEL Figma Tasarım Sistemi

Soba Yönetim Sistemi için tam tasarım sistemi ve bileşen kütüphanesi.

## 📦 İçerik

Bu paket aşağıdaki dosyaları içerir:

### 1. **PARSPEL-DESIGN-SYSTEM.figma.json**

Figma'da kullanılmak üzere tasarlanmış JSON dosyası. İçerir:

- ✅ Tasarım tokenları (renkler, tipografi, spacing, shadows)
- ✅ 55+ shadcn/ui bileşeni
- ✅ 10+ özel bileşen
- ✅ 27 ana sayfa + 5 dashboard varyasyonu
- ✅ Responsive layout tanımları
- ✅ Animasyon ve transition tanımları
- ✅ Erişilebilirlik özellikleri

### 2. **FIGMA-SETUP-GUIDE.md**

Adım adım kurulum ve kullanım rehberi:

- 🚀 Figma dosyası oluşturma
- 🎨 Tasarım tokenlarını ayarlama
- 🧩 Bileşenleri oluşturma
- 📄 Sayfaları oluşturma
- 🎬 Animasyonları tanımlama
- 📐 Responsive tasarım
- 🔗 Figma Plugins kurma
- 📝 Dokümantasyon
- 🔄 Code Connect kurma

### 3. **figma.config.ts**

Figma Code Connect konfigürasyonu:

- 🔗 Figma bileşenlerini React koduna bağlama
- 📝 Otomatik kod örnekleri
- 🎯 Component props tanımları
- 🔄 Senkronizasyon

## 🎯 Hızlı Başlangıç

### 1. Figma Dosyası Oluşturun

```bash
# Figma'da yeni dosya oluşturun
# Dosya adı: "PARSPEL — Soba Yönetim Sistemi v3.1"
```

### 2. Tasarım Sistemini Kurun

```bash
# PARSPEL-DESIGN-SYSTEM.figma.json dosyasını referans olarak kullanın
# FIGMA-SETUP-GUIDE.md'deki adımları takip edin
```

### 3. Code Connect Kurun

```bash
npm install @figma/code-connect
figma connect publish
```

## 🎨 Tasarım Sistemi Özellikleri

### Renkler (OKLCH)

**Primary:** `oklch(0.62 0.18 35)` — Orange/Amber
**Secondary:** `oklch(0.60 0.14 260)` — Purple/Blue
**Accent:** `oklch(0.58 0.18 280)` — Purple

**Semantic:**

- Success: `oklch(0.65 0.18 160)` — Green
- Warning: `oklch(0.70 0.18 85)` — Yellow
- Danger: `oklch(0.60 0.22 30)` — Red
- Info: `oklch(0.60 0.14 260)` — Blue

### Tipografi

**Fonts:**

- Sans: DM Sans
- Mono: JetBrains Mono

**Scales:**

- H1: 1.65rem, Weight 900
- H2: 1.35rem, Weight 800
- H3: 1.15rem, Weight 800
- Body: 0.88rem, Weight 400

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

## 🧩 Bileşenler

### Form Bileşenleri (8)

- Input, Textarea, Select
- Checkbox, Radio Group, Toggle
- Field, Label

### Layout Bileşenleri (7)

- Card, Accordion, Tabs
- Sidebar, Modal, Drawer
- Scroll Area

### Dialog Bileşenleri (5)

- Dialog, Alert Dialog
- Confirm Dialog, Popover
- Hover Card

### Data Display (5)

- Table, Badge, Progress
- Pagination, Chart

### Custom Bileşenleri (10)

- QuickSaleModal, QuickIncomeModal, QuickProductModal
- FAB (Floating Action Button)
- AI Button, Report Button
- NotificationCenter, QuantumLink
- SystemMap, InfoRow

## 📄 Sayfalar

### Ana Sayfalar (5)

- Dashboard — Özet kontrol paneli
- Dashboard Finans — Finansal dashboard
- Dashboard Ticaret — Ticaret dashboard
- Dashboard Operasyon — Operasyon dashboard
- Dashboard Strateji — Strateji dashboard

### İşlem Sayfaları (4)

- Sales — Satış yönetimi
- Products — Ürün kataloğu
- Stock — Stok analizi
- Fatura — Fatura yönetimi

### Tedarik Sayfaları (3)

- Suppliers — Tedarikçi yönetimi
- Pelet — Pelet tedarik
- BoruTed — Boru tedarik

### Finans Sayfaları (4)

- Cari — Cari hesaplar
- Kasa — Kasa yönetimi
- Bütçe — Bütçe planlama
- Banka — Banka hesapları

### Analiz Sayfaları (5)

- Reports — Raporlar
- Cizelge — Çizelge
- Monitor — İzleme
- Kontrol — Kontrol halkası
- Anomali — Anomali tespiti

### Sistem Sayfaları (7)

- Entegrasyon — Entegrasyonlar
- Excel Merge — Veri birleştirme
- Excel Import — Excel içe aktarma
- Notlar — Not defteri
- Partners — Ortak yönetimi
- Settings — Sistem ayarları
- Bug Hunter — Hata raporlama

## 📐 Responsive Tasarım

### Desktop (>768px)

- Sidebar width: 236px (fixed)
- Main padding: 20px 22px
- Card padding: 16px 18px
- Full table view
- Centered modals

### Mobile (<768px)

- Sidebar: Collapsible
- Main padding: 12px 8px
- Card padding: 12px 14px
- Card-based table view
- Bottom sheet modals

## 🎬 Animasyonlar

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

## 🔗 Figma Plugins

Önerilen Figma Plugins:

1. **Design Tokens** — Token yönetimi
2. **Figma to Code** — Kod üretimi
3. **Contrast** — Erişilebilirlik kontrolü
4. **Figma Tokens** — Token senkronizasyonu
5. **Figma Automate** — Otomasyon

## 📝 Dokümantasyon

Her bileşen için:

- Component spec
- Usage guidelines
- Do's and Don'ts
- Code examples
- Accessibility notes

## 🔄 Code Connect

Figma bileşenlerini React koduna bağlayın:

```typescript
// figma.config.ts
figmaConnect.react(
  "Button",
  ({ variant, size, children }) =>
    `<Button variant="${variant}" size="${size}">
      ${children}
    </Button>`,
);
```

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
- [shadcn/ui Components](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)

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

## 📄 Lisans

Özel kullanım — Tüm hakları saklıdır

---

**Son Güncelleme:** 23 Mayıs 2026
**Versiyon:** 3.1.0
**Durum:** Aktif Geliştirme

## 🚀 Sonraki Adımlar

1. ✅ Figma dosyası oluşturun
2. ✅ Tasarım sistemini kurun
3. ✅ Bileşenleri oluşturun
4. ✅ Sayfaları tasarlayın
5. ✅ Code Connect kurun
6. ✅ Takım üyelerini davet edin
7. ✅ Dokümantasyonu güncel tutun
8. ✅ Düzenli olarak gözden geçirin

**Başlamaya hazır mısınız?** FIGMA-SETUP-GUIDE.md'yi okuyun!
