# PARSPEL Kapsamlı UI/UX Review Raporu

**Tarih:** 07.06.2026  
**Değerlendiren:** Visionary AI Review  
**Genel Puan:** 7.5/10

---

## 1. Yönetici Özeti

PARSPEL, güçlü **offline-first altyapısı**, **multi-agent mimarisi** ve **widget sistemi** ile teknik olarak çok olgun bir Türk iş yönetim uygulaması. 31 sayfa/sekme, 7 ajan, Firebase entegrasyonu, kapsamlı veri modeli ile özellik açısından zengin.

Ancak **görsel dil tutarsızlıkları** ve **erişilebilirlik boşlukları** "enterprise" hissi vermesini engelliyor. Üç farklı stil yaklaşımı (inline style, özel CSS class'ları, shadcn/ui) bir arada kullanılıyor. Renk kontrastı, klavye navigasyonu ve responsive tasarımda iyileştirme gerekiyor.

---

## 2. Değerlendirme Kategorileri

### 📐 Layout & Spacing: 7/10

- **Grid sistemi:** Dashboard'da widget grid'i iyi çalışıyor. Products sayfasında `auto-fill, minmax(240px, 1fr)` iyi.
- **Padding/margin:** Dashboard'da `20px 22px` desktop, `12px 8px` mobile — tutarlı. Ancak bazı sayfalarda inline style ile hardcoded değerler var.
- **Beyaz alan:** Genel olarak iyi. Sidebar'da `236px` genişlik yeterli.
- **Hizalama:** Sidebar navigasyon elementleri iyi hizalanmış. Dashboard stat kartlarında yatay scroll'da hizalama bozulabiliyor.

### 🎨 Renk & Tipografi: 6/10

- **Renk paleti:** Dark tema (`#0a0e27`) iyi. `--color-danger` (#ff5722) güçlü aksan. Premium tema desteği var (Corporate, Modern Dark, Elegant Light).
- **Kontrast:** `var(--text-dim)` ve `var(--text-muted)` açık temada yetersiz kalıyor. WCAG AA standartlarına tam uyumlu değil.
- **Font hierarchy:** `.text-h1` → `.text-h6` class'ları tanımlı ama bazı sayfalarda kullanılmıyor. Dashboard'ta h3 etiketi widget başlığı olarak kullanılıyor ama stil tutarsız.
- **Font boyutları:** Body `0.88rem` (~14px) — 16px WCAG önerisinin altında.

### 🧩 Component Tutarlılığı: 5/10

- **Butonlar:** 3 farklı stil — shadcn Button vs inline `<button style={}>` vs özel CSS class'ları
- **Inputlar:** Settings shadcn Input, Products inline `<input style={}>`, Dashboard özel `.dash-*`
- **Kartlar:** Dashboard `dash-widget-card`, Products `var(--bg-card)` inline, Settings `Card` shadcn — hepsi farklı
- **Border radius:** 8px, 10px, 12px, `var(--radius)` karışık
- **Loading/Empty state'ler:** EmptyState component var ama bazı sayfalarda eksik

### ♿ Erişilebilirlik (A11Y): 4/10

- **Focus indicator:** Sadece input'larda `box-shadow` ile. Butonlar, sidebar elementleri, Chip'lerde yok.
- **Renk körlüğü:** Stok durumu sadece renk ile. Dashboard emoji ikonları Lucide ile değişmeli.
- **Metin boyutları:** Body 14px, bazı etiketler 10px — çok küçük.
- **Touch hedefleri:** Sidebar tab'leri 44px'ten küçük. Favori butonu 34px — minimum 44px olmalı.

### 📱 Responsive: 5/10

- **Mobil uyum:** Sidebar collapse <768px — iyi. Mobile overlay — iyi.
- **Breakpoint'ler:** Sadece 768px ve 640px için table responsive. Dashboard 1100px altında side panel gizliyor — widget'lar stackleniyor.
- **Overflow/scroll:** Dashboard yatay scroll çalışıyor. Settings 17 sekme mobilde taşıyor.
- **Padding ayarları:** Mobilde `12px 8px` + `padding-bottom: 80px` (FAB için) — iyi düşünülmüş.

### 🧭 Navigasyon & UX: 7/10

- **Ana navigasyon:** Sidebar 5 grup (Ana, Tedarik, Finans, Analiz, Sistem) — net. Priority tab'lar favori sistemi — iyi.
- **Sayfa başlıkları:** Header'da `activeTab` gösteriliyor — açıklayıcı.
- **Primary action:** FAB (sağ alt) — hızlı erişim için iyi. Dashboard'ta "Yeni Satış" butonu vurgulanmış.
- **Klavye kısayolları:** Ctrl+1-5 — kullanışlı.

### 🐛 Hata Durumları: 6/10

- **Validation:** Products'ta `if (!form.name) showToast(...)` — basit ama işlevsel.
- **Error state:** Toast notification'lar (sonner) — iyi. Ancak form validation hataları inline değil.
- **Success feedback:** Toast ile — yeterli.

---

## 3. Kritik Sorunlar (High Priority)

### 3.1 Karışık Stil Yaklaşımları

**3 farklı stil sistemi bir arada:**
| Sistem | Kullanıldığı Yer | Satır Sayısı |
|--------|------------------|-------------|
| Inline style (`style={{}}`) | Products, Dashboard, Sales | ~200+ |
| Özel CSS class'lar (`.dash-*`, `.app-*`) | index.css (661+ satır) | 661+ |
| shadcn/ui + Tailwind | Settings, bazı component'ler | ~500+ |

**Çözüm:** Unified Design System oluşturulmalı. Tüm butonlar, inputlar, kartlar tek bir component API'si üzerinden yönetilmeli.

### 3.2 Renk Kontrastı ve Erişilebilirlik

- `--text-dim` (#475569 açık, #94a3b8 koyu) → WCAG AA için yetersiz
- Stok durumu → sadece renk kodu (kırmızı/sarı/yeşil), ikon/metin yok
- Emoji ikonlar → Lucide ile değiştirilmeli, renk kodu yanında etiket olmalı
- Focus ring → sadece input'larda var, butonlarda ve navigasyonda yok

### 3.3 Klavye Navigasyonu Eksik

- Sidebar favori butonları `★/☆` → keyboard reachable değil
- Dashboard yatay scroll → klavye ile kaydırılamıyor
- Global search → sonuçlarda arrow key navigasyon yok
- Modal'lar → `autoFocus` eksik, Tab sırası bozuk

### 3.4 Mobil Responsive Problemleri

- Settings 17 sekme → mobilde horizontal overflow
- Products Chip filtreleri → 3 satıra wrap oluyor
- Dashboard side panel → `<1100px` aniden kayboluyor, geçiş yumuşak değil
- Sidebar priority tab'lar → mobilde görünmüyor

---

## 4. Önemli Sorunlar (Medium Priority)

### 4.1 Tipografi Tutarsızlığı

| Element          | Mevcut                                  | Olması Gereken |
| ---------------- | --------------------------------------- | -------------- |
| Sayfa başlıkları | `font-size: 1rem` / `1.3rem` / inline   | `--text-h1`    |
| Kart başlıkları  | `font-weight: 700, 0.95rem` / `text-h4` | `--text-h4`    |
| Body metni       | `0.88rem` / `0.9rem` / `text-sm`        | `--text-body`  |
| Yardımcı metin   | `0.72rem` / `0.78rem` / `text-xs`       | `--text-small` |

### 4.2 Empty/Loading/Error State Eksiklikleri

**Empty state olmayan sayfalar:** Sales, Reports, Cari, Bank, Butce, Fatura
**Loading skeleton olmayan yerler:** Dashboard widget'ları, grafikler
**Error state:** Toast ile, ama form validation mesajları inline değil

### 4.3 İkon Sistemi Parçalanması

- **Lucide React** (55+ ikon): Sidebar, Header, Tabs
- **Emoji** (40+): Dashboard stat kartları, Products badge'leri, Settings sekmeleri
- **Özel SVG:** NotificationCenter, UserMenu

---

## 5. İyileştirme Önerileri (Low Priority)

### 5.1 Animasyon Performansı

- Dashboard: 15+ framer-motion component aynı anda
- Sidebar logo pulse: 4s döngü sürekli
- `will-change: transform` optimizasyonu gerekli

### 5.2 Dark Mode Tutarlılığı

- Bazı inline style'larda hardcoded `#0f172a` gibi açık renkler
- `body.dark-mode` override'ları CSS variable'larla değişmeli

### 5.3 Yoğunluk/Compact Mod

- Tablo padding'leri power user'lar için fazla geniş
- Kullanıcı tercihi olarak compact/dense mod eklenebilir

---

## 6. Spesifik Sayfa Sorunları

| Sayfa            | Screenshot              | Sorun                                                                 |
| ---------------- | ----------------------- | --------------------------------------------------------------------- |
| Dashboard        | `_dashboard.png`        | Yatay scroll indicator yok; Net Sermaye formülü dar ekranda kırılıyor |
| Products         | `_products.png`         | Chip filtreleri 3 satıra wrap; toplu fiyat modal önizlemesi overlap   |
| Settings         | `_settings.png`         | 17 sekme overflow; Security panel admin tablosu yoğun                 |
| Dashboard Finans | `_dashboard_finans.png` | Ana dashboard ile aynı layout, finans spesifik değil                  |
| Excel Merge      | `_excelmerge.png`       | Multi-step wizard'da progress indicator eksik                         |

---

## 7. En Kritik 3 Aksiyon

### #1: Unified Design System (2-3 hafta)

```
src/design-system/
├── tokens/
│   ├── colors.ts       # Semantik renk alias'ları
│   ├── spacing.ts      # 4px base scale
│   ├── typography.ts   # h1-h6, body, caption, mono
│   ├── shadows.ts      # elevation scale
│   └── radius.ts       # 4/8/12/16/24
├── primitives/
│   ├── Button.tsx      # Tek Button API (variant, size, loading)
│   ├── Card.tsx        # Tutarlı elevation/border
│   ├── Input.tsx       # Focus ring, error state, label
│   ├── Badge.tsx       # Semantik variant'lar
│   ├── Modal.tsx       # Mevcut Modal.tsx'i değiştir
│   └── Table.tsx       # Responsive, sortable, selectable
└── theme/
    ├── css-vars.css    # Tek kaynak
    └── ThemeProvider.tsx
```

### #2: Erişilebilirlik Denetimi (1-2 hafta)

- Tüm elementlere `focus-visible` ring
- Stok durumu: renk + ikon + metin (sadece renk değil)
- İkon-only butonlara ARIA label
- Dashboard yatay scroll → klavye navigasyonu
- `prefers-reduced-motion` medya sorgusu
- Renk kontrastı audit

### #3: Mobile-First Responsive (2 hafta)

- Breakpoint'ler: 320/640/768/1024/1280px
- Dashboard widget'ları <1100px stack
- Settings sekmeleri → mobilde accordion
- Products grid: <480px 1-col
- Sidebar priority tab'lar mobilde erişilebilir

---

## 8. Hızlı Kazanımlar (Bu Hafta)

| Görev                            | Süre   | Etki   |
| -------------------------------- | ------ | ------ |
| Dashboard emoji → Lucide + renk  | 30 dk  | Yüksek |
| `focus-visible` ring ekle        | 1 saat | Yüksek |
| Settings Button → `variant` API  | 2 saat | Orta   |
| Sales/Reports/Cari → Empty state | 1 saat | Orta   |
| Products modal `autoFocus`       | 10 dk  | Düşük  |
| Yatay scroll gradient            | 30 dk  | Düşük  |

---

_Rapor otomatik oluşturulmuştur. Screenshot'lar `screenshots/` klasöründe mevcuttur._
