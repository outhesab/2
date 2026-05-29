# PARSPEL — UI/UX Akışları ve Wireframe

> Versiyon: 3.7.0 | Tarih: 29 Mayıs 2026

## 1. Genel Mimarî

```
┌─────────────────────────────────────────────────────────────────────┐
│  APP SHELL                                                          │
│  ┌─────────┬─────────────────────────────────────────────────────┐ │
│  │SİDEBAR  │  HEADER                                              │ │
│  │         │  [☰] [Başlık] [Arama] [Bildirim] [Sync] [💾] [👤]  │ │
│  │ Hızlı   ├──────────────────────────────────────────────────────┤ │
│  │ Erişim  │                                                      │ │
│  │ [Özet]  │  MAIN CONTENT (lazy loaded page)                     │ │
│  │ [Ürün]  │                                                      │ │
│  │ [Satış] │                                                      │ │
│  │ [Kasa]  │                                                      │ │
│  │ [Cari]  │                                                      │ │
│  │         │                                                      │ │
│  │ Gruplar │                                                      │ │
│  │ ▶ Ana   │                                                      │ │
│  │ ▶ Ted.. │                                                      │ │
│  │ ▶ Fin.. │                                                      │ │
│  │ ▶ Ana.. │                                                      │ │
│  │ ▶ Sis.. │                                                      │ │
│  │         │                                                      │ │
│  │ KASA    │                                                      │ │
│  │ Toplam  │                                                      │ │
│  │ ₺ 1.234 │                                                      │ │
│  │ Nakit.. │                                                      │ │
│  │         │                                                      │ │
│  │ [🟢 Çev.]│                                                      │ │
│  │ [🔒Güv.]│                                                      │ │
│  └─────────┴──────────────────────────────────────────────────────┘ │
│                                                                     │
│  [FAB: +] [🤖 AI Asistan] [🐛 Hata Bildir]                        │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Navigasyon Yapısı

```
Gruplama:
┌──────┬──────────────────────────────────────────────────────┐
│ Grup │ Sayfalar                                              │
├──────┼──────────────────────────────────────────────────────┤
│ Ana  │ Özet, Finans, Ticaret, Operasyon, Strateji           │
│      │ (5 Dashboard varyantı) + Ürünler + Satış + Fatura    │
├──────┼──────────────────────────────────────────────────────┤
│ Ted. │ Tedarikçi, Pelet, Boru Tedarik                       │
├──────┼──────────────────────────────────────────────────────┤
│ Fin. │ Cari, Kasa, Bütçe, Banka                             │
├──────┼──────────────────────────────────────────────────────┤
│ Ana. │ Raporlar, Çizelge, Stok, İzleme, Kontrol, Anomali    │
├──────┼──────────────────────────────────────────────────────┤
│ Sis. │ Entegrasyon, Veri Birleştir, Not Defteri, Ortaklar   │
│      │ Ayarlar, Bug Hunter, Excel İçe Aktar                  │
└──────┴──────────────────────────────────────────────────────┘

Navigasyon özellikleri:
- Hızlı Erişim: Kullanıcının favorilediği (★) 6 modül
- Grup daraltma/genişletme
- Badge: stok sıfır, bekleyen sipariş, eşleşmemiş banka işlemi
- Klavye kısayolları: Ctrl+1..5 → Özet..Raporlar
- Global arama: ürün, müşteri, modül (en az 2 karakter)
```

## 3. Ekran Akışları

### 3.1 Giriş / İlk Kurulum

```
[LoginScreen] ──login──→ [SetupWizard] ──done──→ [Dashboard]
     │                       │
     ├─ Login (isim + şifre, PBKDF2 doğrulama)
     ├─ Misafir Girişi (süreli, kayıt engelli)
     └─ Kayıt Ol (yeni kullanıcı oluştur)
     
SetupWizard:
  Adım 1: Şirket adı, şehir
  Adım 2: Varsayılan kategoriler (soba, aksesuar, vb.)
  Adım 3: Varsayılan kasalar (nakit, banka, POS'lar)
  Adım 4: Demo ürünler (opsiyonel)
  Adım 5: Ortak carileri (opsiyonel)
  → getSetupData() ile DB'ye yazılır, bir kez uygulanır
```

### 3.2 Dashboard (5 Varyant)

```
Dashboard (Özet):
  ├─ İstatistik kartları: Bugünkü ciro, toplam kasa, toplam cari, stok değeri
  ├─ Satış grafiği (son 7 gün) — Recharts
  ├─ Kasa bakiye özeti
  ├─ Son işlemler listesi
  └─ Hızlı aksiyon: Yedek al, Kasa sayım, Sürüm kitapçığı

DashboardFinans:
  ├─ Kâr-zarar grafiği
  ├─ Alacak yaşlandırma
  ├─ Nakit akışı
  └─ Bütçe takibi

DashboardTicaret:
  ├─ Ürün satış dağılımı
  ├─ Tedarikçi performansı
  └─ Sipariş durumu

DashboardOperasyon:
  ├─ Stok seviyeleri
  ├─ Sipariş takvimi
  └─ İzleme kuralları durumu

DashboardStrateji:
  ├─ Büyüme metrikleri
  ├─ Kârlılık analizi
  └─ Anomali özeti
```

### 3.3 Satış Akışı

```
[Sales.tsx] — 1034 satır
  ├─ Filtreler: Tarih aralığı, ödeme tipi, durum, ürün
  ├─ Liste: tablo + durum renk kodlaması
  ├─ Yeni Satış butonu → QuickSaleModal (sayfa üstü)
  │   ├─ Ürün seç (dropdown) + miktar + birim fiyat
  │   ├─ İskonto (TL veya %)
  │   ├─ Müşteri seç (cari) — opsiyonel
  │   ├─ Ödeme tipi: Nakit/Kart/Havale/Cari
  │   ├─ Peşinat (vadeli ise) — tahsilat
  │   └─ Kaydet → SatisAgent flow
  └─ Satış detayı: ürün listesi, kâr, taksit bilgisi

QuickSaleModal (mobil):
  ── Drawer (vaul) olarak açılır, mobilde tam ekran
  ── Ürün seç → kalan bilgiler aynı
```

### 3.4 Offline-First Davranış

```
┌──────────────────────────────────────────────────────────────────┐
│  OFFLINE-FIRST STRATEJİ                                         │
│                                                                  │
│  Çevrimiçi:                                                     │
│    save() → localStorage + IndexedDB → debounce 1.2sn → Firebase│
│                                                                  │
│  Çevrimdışı:                                                    │
│    save() → localStorage + IndexedDB (tamamen çalışır)          │
│    Firebase senkron atlanır (no-op)                             │
│    Header'da "🔴 Çevrimdışı" gösterilir                          │
│                                                                  │
│  Yeniden çevrimiçi:                                             │
│    Toast: "İnternet bağlantısı yeniden kuruldu"                 │
│    Sonraki save() → Firebase yazar                              │
│                                                                  │
│  İlk yükleme:                                                   │
│    localStorage'dan yüklenir                                     │
│    Firebase'den güncel veri varsa (version kontrolü) → merge    │
│    IndexedDB'den snapshot varsa (localStorage boşsa) → restore  │
│                                                                  │
│  Misafir oturumu:                                               │
│    save() tamamen engellenir (guestBlocked)                     │
│    Süre dolunca otomatik logout                                 │
└──────────────────────────────────────────────────────────────────┘
```

### 3.5 Mobil Uyum (Responsive)

```
Breakpoint: 768px

Desktop (>768px):
  ├─ Sidebar sabit, genişlik ~260px
  ├─ Header: arama, kısayollar, sync badge, tarih
  ├─ Ana içerik: sidebar yanında, scroll
  └─ Modal: ortalanmış, max 480px

Mobil (<768px):
  ├─ Sidebar: hamburger menü (☰) ile açılır, overlay + slide
  ├─ Header: hamburger + başlık + bildirim + kullanıcı
  ├─ Ana içerik: tam genişlik
  ├─ Modal: bottom sheet (Drawer, vaul kütüphanesi)
  └─ FAB: sağ alt köşe, hareketli
```

### 3.6 Özel Bileşenler

```
FAB (Floating Action Button):
  ── Sağ alt köşe, hareketli (pointer drag, localStorage'ta pozisyon)
  ── Ana buton: + (açılır: Hızlı Satış, Ürün Ekle, Gelir, Gider)
  ── Açıkken siyah overlay

AI Asistan Butonu:
  ── Sol alt köşe, hareketli
  ── 🤖 ikonu → AI Drawer açılır (sağdan slide)
  ── AI Drawer: DeepSeek/Claude/Gemini/Offline modları
  ── Drawer içinde AIAsistan page embedded

Hata Bildirme Butonu:
  ── Sağ alt (konfigüre edilebilir pozisyon)
  ── 4 tip: Hata, Öneri, Not, Takip
  ── localStorage'a kaydedilir (max 50 kayıt)

Global Arama:
  ── Header'da, desktop görünür
  ── Ürün, cari, tedarikçi, modül adı arama
  ── 2+ karakter → sonuç listesi (max 8)

Kasa Widget (Sidebar alt):
  ── Toplam kasa bakiyesi
  ── Nakit / Banka ayrımı
  ── Pozitif → yeşil, negatif → kırmızı
  ── Tıklayınca Kasa sayfasına gider
```

## 4. Tema ve UI Konfigürasyonu

```
useUIPrefs() hook:
  localStorage'da "sobaUI" key'inde saklanır
  Firebase'den de yüklenebilir (birden çok cihaz)
  Özellikler:
    - accentColor, bgColor
    - font (system/modern/classic)
    - animation (full/reduced/none)
    - showAIButton (boolean)
    - showFABButton (boolean)
    - showReportButton (boolean)
    - soundTheme (classic/minimal/off)
    - speechEnabled (boolean)
    - sidebarCollapsed (boolean)

  applyUIPrefs(prefs): CSS değişkenlerine yazar
  saveUIPrefs(prefs): localStorage + Firebase
  loadUIPrefs(): localStorage'dan okur
```

## 5. Toast / Bildirim Sistemi

```
Toast (sonner):
  ── Position: bottom-right
  ── Rich colors: success (yeşil), error (kırmızı), info (mavi), warning (sarı)
  ── 5 visible, expand enabled, 4sn duration
  ── Ses + konuşma: useSoundFeedback + useSpeech ile
  ── Özel soba-toast CSS class'ları

NotificationCenter:
  ── Header'da 🔔 ikonu
  ── Slide-out panel (sağdan)
  ── notificationEngine() tarafından üretilir
  ── Severity'ye göre gruplandırma: critical → warning → info
  ── Tıklayınca ilgili sayfaya yönlendirir
```

## Ek: Proje Referansları

| Konu | Dosya |
|------|-------|
| Tip tanımları | `src/types/index.ts` |
| İş mantığı (DB state) | `src/hooks/db/core.ts` |
| Firebase senkron | `src/hooks/db/sync.ts` |
| Firebase yedekleme | `src/hooks/db/backup.ts` |
| Agent sistemi | `src/agents/` |
| Kural motoru | `src/lib/ruleEngine.ts` |
| Denetim motoru | `src/lib/auditEngine.ts` |
| Anomali tespiti | `src/lib/anomalyEngine.ts` |
| Veri bütünlüğü | `src/lib/dataIntegrityChecker.ts` |
| Bildirim motoru | `src/lib/notificationEngine.ts` |
| AI servisleri | `src/lib/deepseek.ts`, `src/lib/aiApi.ts` |
| AI aksiyon parser | `src/lib/aiActions.ts` |
| Changelog (zorunlu) | `src/lib/changelog.ts` |
| Build yapılandırması | `vite.config.ts`, `src/lib/vite-manual-chunks.ts` |
| opencode kuralları | `opencode.json` |
| Routing + UI shell | `src/App.tsx` |
| Test (kapsamlı) | `src/lib/kapsamli-senaryo.test.ts` |
