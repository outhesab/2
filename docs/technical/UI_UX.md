# PARSPEL — UI/UX Dokümanı

> Versiyon: 3.31.0 | Tarih: 17 Haziran 2026
> İçerik: UI/UX Akışları, Figma Tasarım Sistemi, Skin Dönüşüm Planı

---

# Bölüm 1: UI/UX Akışları

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
│  │ └─────────┴──────────────────────────────────────────────────────┘ │
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
│ ...  │                                                      │
└──────┴──────────────────────────────────────────────────────┘
```

## 3. Sayfa State Pattern'i

Her sayfa 4 state'i yönetir:
```tsx
if (loading) return <SkeletonLoader type="card" count={3} />
if (items.length === 0) return <Empty><EmptyTitle>Boş</EmptyTitle></Empty>
if (error) { showToast('Hata', 'error'); return <PageFallback /> }
return <SuccessContent />
```

## 4. Bildirimler

- **Toast**: Başarı/hata/uyarı bildirimleri (sağ üst, auto-close 3sn)
- **AI Toast**: AI işlem sonuçları (auto-close 5sn, icon'lu)
- **Modal**: Karar gerektiren işlemler (silme onayı, form)
- **Badge**: Sidebar'da stok uyarı sayısı

## 5. Sidebar (Sol Navigasyon)

- Üst: Kasa özeti (toplam bakiye)
- Favori tab'lar (max 6)
- Gruplanmış tab listesi (Ana, Tedarik, Finans, Analiz, Sistem)
- Alt: Kullanıcı menüsü, tema değiştirme

## 6. Header

- Sol: Başlık
- Sağ: Bildirim zili, Sync durumu, Kullanıcı menüsü
- Dark/light theme toggle

## 7. FAB (Floating Action Button)

Ana sayfada "+" butonu — hızlı işlem menüsü:
- Yeni Satış
- Yeni Ürün
- Kasa Giriş/Çıkış
- Cari Ekle

---

# Bölüm 2: Figma Tasarım Sistemi

## Renkler (OKLCH)

| Token | Değer | Açıklama |
|-------|-------|----------|
| Primary | `oklch(0.62 0.18 35)` | Orange/Amber |
| Secondary | `oklch(0.60 0.14 260)` | Purple/Blue |
| Accent | `oklch(0.58 0.18 280)` | Purple |
| Success | `oklch(0.65 0.18 160)` | Green |
| Warning | `oklch(0.70 0.18 85)` | Yellow |
| Danger | `oklch(0.60 0.22 30)` | Red |
| Info | `oklch(0.60 0.14 260)` | Blue |

## Tipografi

| Scale | Boyut | Weight |
|-------|-------|--------|
| H1 | 1.65rem | 900 |
| H2 | 1.35rem | 800 |
| H3 | 1.15rem | 800 |
| Body | 0.88rem | 400 |
| Small | 0.78rem | 500 |

Fontlar: DM Sans (sans), JetBrains Mono (mono)

## Spacing

```
xs: 4px  | sm: 8px  | md: 12px | lg: 16px
xl: 20px | 2xl: 24px | 3xl: 32px | 4xl: 40px
```

## Bileşen Durumları

Her bileşen 6 durumu destekler:
1. Default — normal görünüm
2. Hover — fare üzerinde
3. Active — tıklanmış/seçilmiş
4. Focus — klavye odağı
5. Disabled — pasif, etkileşim yok
6. Loading — yükleniyor (skeleton/spinner)

## Responsive Breakpoints

| Breakpoint | Ekran | Davranış |
|-----------|-------|----------|
| < 640px | Mobil | Sidebar drawer, tek sütun |
| 640-1024px | Tablet | Sidebar simge, 2 sütun |
| 1024-1280px | Desktop | Tam sidebar, 3 sütun |
| > 1280px | Large | Maksimum genişlik |

---

# Bölüm 3: Skin Dönüşüm Planı (Corporate Enterprise)

## Executive Summary

- **Current state**: "PARSPEL Design System v3.0" — Dark-first, industrial, amber/orange primary
- **Target skin**: `corporate` (Corporate Enterprise) — Professional, minimal, enterprise SaaS finance dashboard
- **Skin philosophy**: Light mode, blue accent (#2563eb), clean surfaces, subtle shadows, premium glass effects
- **Total scope**: ~12 files, ~85 individual changes
- **Risk level**: Medium (visual changes, but CSS variable approach makes it systematic)

## Skin Definition (Target: Corporate)

```json
{
  "id": "corporate",
  "label": "Corporate Enterprise",
  "desc": "Profesyonel, minimal, enterprise SaaS hissi",
  "type": "light",
  "accent": "#2563eb",
  "bg": "#f8fafc",
  "hueAngle": 265
}
```

### CSS Variable Changes

| Değişken | Eski (carbon) | Yeni (corporate) |
|----------|--------------|------------------|
| `--color-primary` | `oklch(0.62 0.18 35)` | `oklch(0.55 0.15 265)` |
| `--color-primary-hover` | `oklch(0.68 0.20 35)` | `oklch(0.60 0.17 265)` |
| `--accent` | `#d97706` | `#2563eb` |
| `--bg` | `#041512` | `#f8fafc` |
| `--text-primary` | `white` | `#1e293b` |
| Gölgeler | Koyu teması | Soft light shadows |
| Cam efekti | Koyu saydam | Beyaz saydam |

### Implementation Steps

1. CSS variable tanımları (`src/index.css`) — yeni skin eklenecek
2. Tema sistemi (`src/theme/`) — skin switcher'a `corporate` eklenecek
3. Tema provider (`ThemeProvider.tsx`) — yeni URL parametreleri
4. Bileşen kontrolleri — modal, sidebar, header, kartlar
5. Renk token geçişi — hardcoded renkler taranıp CSS variable'a çevrilecek
6. Test — görsel regresyon kontrolü

### Files to Modify

- `src/index.css` — yeni CSS variables
- `src/theme/themes.ts` — yeni skin tanımı
- `src/theme/ThemeProvider.tsx` — skin desteği
- `src/components/layout/*.tsx` — glass effect geçişi
- Modal, kart, form stilleri
