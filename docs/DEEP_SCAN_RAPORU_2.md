# DEEP SCAN RAPORU — repo_2 (PARSPEL v3.23.2+)

**Tarih:** 20 Haziran 2026  
**Metod:** Pure Python statik analiz + ripgrep doğrulama  
**Kapsam:** 408 TS/TSX dosyası (src/), 70.960 satır  

---

## 1. ÖLÜ DOSYALAR (Production'da Hiç Import Edilmeyen)

### 1.1 Tümüyle Ölü Dosyalar

| Dosya | Satır | Açıklama |
|-------|-------|----------|
| `components/ui/sidebar.tsx` | **727** | shadcn/ui sidebar — hiçbir yerde import edilmemiş. Gerçek sidebar: `components/layout/Sidebar.tsx` |
| `features/voice-sales/` **(9 dosya)** | **~1.700** | Tüm feature modülü — 0 production import (sadece changelog + spec exclude'ları referans veriyor) |
| `config/agentConfig.ts` | 38 | `loadAgentSettings` tanımlı ama hiç çağrılmıyor. `AgentSettingsPanel` kendi kopyasını içeriyor |
| `lib/seedData.ts` | 98 | `makeSeedDB` — muhtemelen eski test/seed aracı |
| `lib/domainDictionary.ts` | 33 | `DOMAIN_DICTIONARY` — hiç import edilmemiş |
| `lib/streamUtils.ts` | 47 | Sadece `logger.ts`'de kategori adı olarak geçiyor, fonksiyon import edilmiyor |
| `stories/Button.stories.tsx` | 18 | Storybook — sadece changelog'da referans var |

### 1.2 Ölü shadcn/ui Bileşenleri (0 external import)

| Dosya | Satır | 
|-------|-------|
| `components/ui/accordion.tsx` | 56 |
| `components/ui/aspect-ratio.tsx` | 6 |
| `components/ui/button-group.tsx` | 84 |
| `components/ui/hover-card.tsx` | 28 |
| `components/ui/scroll-area.tsx` | 47 |
| `components/ui/slider.tsx` | 27 |
| `components/ui/toggle-group.tsx` | 62 |

### 1.3 Ölü Export'lar (SkeletonLoaders)

| Export | Dosya | Durum |
|--------|-------|-------|
| `SkeletonStatCard` | `SkeletonLoaders.tsx:12` | 0 external ref |
| `SkeletonWidget` | `SkeletonLoaders.tsx:111` | 0 external ref |
| `SkeletonDetail` | `SkeletonLoaders.tsx:125` | 0 external ref |

---

## 2. AYIKLANABİLİR SİSTEM DOSYALARI

| Dizin | Boyut | İçerik |
|-------|-------|--------|
| `PAKET/` | **1.2 MB** | Eski icon taslakları, duplicate icon setleri (`files (1)/`) |
| `android/build/` | **1.2 MB** | Capacitor build artifacts |
| `PAKET/files (1)/` | - | `files/` ile aynı icon'ların kopyası |

Toplam gereksiz: **~2.4 MB**

---

## 3. KOD KALİTESİ BULGULARI

### 3.1 Inline Styles (BÜYÜK SORUN)
```
style={{...}}      1.356 kullanım
```
Bu, `70.960 satırlık` projede **%1.9** inline-style oranı demek. Her inline style:
- Performans kaybı (her render'da yeni obje)
- Tailwind class'larına alternativesiz
- CSS Module / styled-components ile yönetilebilir

**En kötü dosyalar:** QuantumLink.tsx, AIAsistan/index.tsx, VoiceAgentUI.tsx

### 3.2 Güvenlik & Kalite
| Pattern | Adet | Risk |
|---------|------|------|
| `dangerouslySetInnerHTML` | **7** | XSS potansiyeli |
| `as any` | 7 | Tip güvenliği ihlali |
| `: any` | 9 | Tip güvenliği ihlali |
| `@ts-ignore` / `@ts-expect-error` | **6** | Tip sistemi bypass |
| `eslint-disable` | 13 | Lint kuralları bypass |
| `console.log` | 11 | Production log泄漏 |
| `!important` | 2 | CSS specificity sorunu |

### 3.3 Timer & Performance
| Pattern | Adet | Risk |
|---------|------|------|
| `setTimeout` | **49** | Memory leak potansiyeli (cleanup kontrol edilmeli) |
| `setInterval` | **5** | Memory leak potansiyeli |

### 3.4 Zaman Damgası / Yapılacak
```
TODO:    0
FIXME:   0
HACK:    0
```
✅ Sıfır — çok iyi. Kod temizliği bilinci yüksek.

---

## 4. Ölü Dependency'ler (Import Yok)

| Paket | package.json'da |
|-------|----------------|
| `@emotion/is-prop-valid` | ^1.4.0 |
| `mitt` | ^3.0.1 |
| `zustand` | ^5.0.13 |
| `react-hook-form` | ^7.0.0 |
| `@hookform/resolvers` | ^5.0.1 |
| `@radix-ui/react-toast` | ^1.2.10 |
| `fallow` | ^0.1.5 |
| `lightningcss` | ^1.32.0 |
| `vite-plugin-inspect` | ^11.3.3 |
| `rollup-plugin-visualizer` | ^7.0.1 |
| `react-scan` | ^0.5.7 |
| `husky` | ^9.1.7 |
| `lint-staged` | ^17.0.7 |
| `prettier` | ^3.5.0 |
| `simple-git-hooks` | ^2.13.1 |
| `@storybook/react-vite` | ^8.6.18 |
| `@storybook/addon-essentials` | ^8.6.14 |
| `storybook` | ^8.6.18 |
| `@axe-core/playwright` | ^4.11.3 |
| `@playwright/test` | ^1.60.0 |
| `@playwright/mcp` | ^0.0.76 |
| `playwright` | ^1.52.0 |
| `lighthouse` | ^13.4.0 |
| `jsdom` | ^29.1.1 |
| `@capacitor/*` (5 paket) | ^7-8.x |
| `@testing-library/react` | ^16.3.0 |
| `@vitejs/plugin-react` | ^4.4.1 |
| `eslint` + plugins | ^9.x |
| `postcss` | ^8.5.3 |
| `tailwindcss` | ^4.1.4 |
| `typescript-eslint` | ^8.31.0 |
| `vitest` | ^4.1.7 |

**Not:** Bazıları devDependency olduğu için (eslint, prettier, typescript, vitest) import edilmemesi normal. Ancak `zustand`, `mitt`, `lightningcss`, `@hookform/resolvers`, `react-hook-form` gibi runtime paketlerin import edilmemesi ayıklanabileceklerini gösteriyor.

---

## 5. MİMARİ BULGULAR

### 5.1 `features/voice-sales/` — Terkedilmiş Feature
- 9 dosya, ~1.700 satır
- 0 production import (sadece spec/data-rules.ts `exclude` listesinde)
- `VoiceSaleButton.tsx`, `useVoiceSale.ts`, speech recognizer, NLP parser, executor — hepsi ölü
- SobaNexus bu işlevselliğin yerini almış

### 5.2 `config/agentConfig.ts` — Eski API
- `loadAgentSettings()` localStorage'dan okur
- `AgentSettingsPanel` kendi kopyasını içerir
- Muhtemelen bir refactor sonrası kullanım dışı kalmış

### 5.3 Çift Sidebar
- `components/ui/sidebar.tsx` (727 satır, ölü shadcn/ui)
- `components/layout/Sidebar.tsx` (196 satır, aktif)
- İkisi de sidebar ama biri sistem tarafından kullanılıyor, diğeri dosya olarak duruyor

### 5.4 CSS Module Fazlalığı (31 CSS dosyası)
Her sayfa için ayrı `.module.css` dosyası var (Fatura: 6 CSS, Dashboard: 4 CSS). 
Toplam 31 CSS module dosyasının bir kısmı çok küçük (<50 satır) ve Tailwind ile replace edilebilir.

---

## 6. PERFORMANS VE BOYUT

### 6.1 En Büyük Dosyalar (Potansiyel bölünme adayları)

| Dosya | Satır | Not |
|-------|-------|-----|
| `lib/changelog.ts` | 2.069 | Sadece changelog verisi — JSON/veritabanına taşınabilir |
| `pages/Cizelge.tsx` | 796 | Monolitik sayfa |
| `pages/DashboardStrateji.tsx` | 785 | Monolitik sayfa |
| `components/ui/sidebar.tsx` | 728 | **Ölü dosya** |
| `lib/anomalyEngine.ts` | 712 | Monolitik motor |
| `pages/excelmerge/ai-asistan.tsx` | 697 | Büyük sayfa |
| `pages/BugHunter/TestRunner.ts` | 653 | Monolitik test koşucusu |

### 6.2 İlk Yükleme Tahmini
Build'de chunk'lar büyük olabilir:
- **`lib/changelog.ts`** (2.069 satır): lazy-load değil — her sayfada import edilebilir
- **UI skeleton/components**: ~13 ölü component bundle'da şişkinlik yaratıyor

---

## 7. ÖZET: AYIKLANABİR KOD

| Kategori | Satır | Etki |
|----------|-------|------|
| Ölü dosyalar | ~2.850 satır | ~1.700'ü voice-sales, 727'si sidebar |
| Ölü UI component | ~310 satır | 7 shadcn/ui |
| Ölü export (Skeleton) | ~30 satır | 3 named export |
| Gereksiz binary | ~2.4 MB | PAKET/ + android/build/ |
| **TOPLAM** | **~2.850 satır + 2.4 MB** | |

**İlk adım önerisi:** Önce `features/voice-sales/` + `sidebar.tsx` + `stories/`'i temizlemek ~2.450 satır kazandırır. `config/agentConfig.ts` + `lib/streamUtils.ts` + `lib/seedData.ts` + `lib/domainDictionary.ts` 180 satır daha. Toplam ~2.850 satır + 2.4 MB.

---

## 8. TAVSİYELER

1. **ACİL:** `dangerouslySetInnerHTML` (7 adet) — XSS vektörü, sanitize eklenmeli veya alternatif kullanılmalı
2. **YÜKSEK:** Inline style yoğunluğu (1.356) — Tailwind class migration
3. **ORTA:** `console.log` (11) — production'da silinmeli
4. **ORTA:** `@ts-ignore`/`@ts-expect-error` (6) — tip düzeltmeleri yapılmalı
5. **DÜŞÜK:** Ölü dosyaların temizliği
6. **DÜŞÜK:** PAKET/ ve android/build/ silinmesi

---

*Scan: 408 dosya, 70.960 satır, 905 export, 103 dependency*  
*Stored as: `docs/DEEP_SCAN_RAPORU_2.md`*
