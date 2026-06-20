# PARSPEL — Soba Yönetim Sistemi

Soba satışı, stok, kasa ve cari takibini tek ekranda yöneten, offline-first çalışan bir işletme yönetim uygulaması.

---

## İçindekiler

- [Başlarken](#başlarken)
- [Özellikler](#özellikler)
- [Teknoloji](#teknoloji)
- [Proje Yapısı](#proje-yapısı)
- [Komutlar](#komutlar)
- [Test](#test)
- [Build & Performans](#build--performans)
- [Changelog Zorunluluğu](#changelog-zorunluluğu)
- [Firebase Sync](#firebase-sync-opsiyonel)
- [Mobil](#mobil)
- [Lisans](#lisans)

---

## Başlarken

```bash
pnpm install
pnpm run dev
```

### Geliştirme Kuralları

Proje kuralları ve talimatlar `opencode.json` dosyasında tanımlıdır. Yeni bir değişiklik yapmadan önce mutlaka okuyun.

Referans dokümanlar:

| Dosya | İçerik |
|-------|--------|
| `AGENTS.md` | Master kurallar (sıfır tolerans, protokol, standartlar) |
| `opencode.json` | Proje kuralları, komutlar, bağımlılıklar |
| `docs/technical/ARCHITECTURE.md` | Mimari: agent sistemi, bileşenler, navigasyon |
| `docs/technical/DATA_LAYER.md` | Veri katmanı, model, servisler |
| `docs/technical/UI_UX.md` | UI/UX akışları, Figma, skin planı |
| `docs/technical/TEST_STRATEGY.md` | Test pattern, coverage |
| `docs/logs/CHANGELOG.md` | Sürüm geçmişi |
| `docs/management/MASTER_PLAN.md` | İyileştirme planı |
| `docs/management/WEEKLY_PLAN.md` | Haftalık plan |
| `src/agents/AGENTS.md` | Agent dokümantasyonu |
| `src/components/AGENTS.md` | Bileşen mimarisi |
| `src/lib/AGENTS.md` | Utility kütüphaneleri |
| `src/hooks/AGENTS.md` | React hook'ları |
| `src/pages/AGENTS.md` | Sayfa yapısı |

---

## Özellikler

- **Satış Yönetimi** — Nakit / kart / cari ödeme, kısmi tahsilat, iskonto, iade ve iptal
- **Stok Takibi** — Giriş / çıkış / düzeltme, hareket geçmişi, sipariş entegrasyonu
- **Kasa** — Çoklu kasa (Nakit, Banka, POS), gelir/gider, soft-delete geri alımı
- **Cari Hesaplar** — Müşteri ve tedarikçi bakiyesi, alacak yaşlandırma, tahsilat
- **Tedarikçi & Sipariş** — Sipariş takibi, stok otomatik güncelleme
- **Fatura** — Satış ve alış faturaları, taksit planı
- **Raporlar & Dashboard** — Günlük ciro, kâr, stok değeri
- **Offline-First** — localStorage birincil depolama, Firebase Firestore opsiyonel bulut sync
- **Multi-Agent Sistemi** — 7 ajan (Satış, Kasa, Cari, Stok, Fatura, Rapor, DeepSeek), mitt tabanlı AgentBus + domainEventBus
- **Rule Engine** — Her işlemde otomatik kural kontrolü (negatif stok, negatif kasa, sıfır tutar, mükerrer işlem)
- **Audit Log** — Tüm işlemlerin denetim kaydı
- **Soba Nexus AI** — Sesli komut ile satış, stok, cari sorgulama; Reasoning Filter + Fast-Path Intent'ler
- **Voice-Sales** — Doğal dil ile sesli satış işlemi (speech-to-text + NLP parser)
- **BatchQueue** — Toplu veri işleme kuyruğu, SafeIO güvenli yazma katmanı
- **State Registry** — External Memory Layer, AI agent'lar için proven facts önbelleği
- **PWA** — Service Worker + Web Manifest, offline çalışma desteği
- **Android** — Capacitor 8 ile native APK

---

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite 7 |
| UI | Tailwind CSS 4 + Radix UI (shadcn/ui) |
| Animasyon | Framer Motion |
| State | Zustand |
| Mobil | Capacitor 8 (Android) |
| Test | Vitest + fast-check (property-based) |
| Depolama | localStorage + Dexie (IndexedDB) + Firebase Firestore (opsiyonel) |
| AI | DeepSeek (API) + Soba Nexus AI (sesli asistan) |
| Voice | Web Speech API + NLP parser |
| Registry | State Registry (AI context optimization) |
| PWA | vite-plugin-pwa + workbox |

---

## Komutlar

```bash
pnpm run dev          # Geliştirme sunucusu
pnpm run build        # Production build
pnpm run preview      # Build önizleme
pnpm run test         # Testleri izle (watch mode)
pnpm run test:run     # Testleri tek seferlik çalıştır
pnpm run typecheck    # TypeScript tip kontrolü
pnpm run lint         # ESLint ile kod kontrolü
pnpm run lint:fix     # ESLint otomatik düzeltme
pnpm run cap:android  # Android build + Android Studio aç
```

---

## Test

```bash
# Tüm testleri çalıştır
pnpm run test:run

# Belirli test dosyası
pnpm exec vitest run src/lib/kapsamli-senaryo.test.ts
```

Test dosyaları `src/lib/`, `src/agents/` ve `src/__tests__/` altında bulunur. Testler UI bağımlılığı olmadan saf fonksiyon olarak çalışır (`prevDB → işlem → nextDB` pattern).

Property-based testler için `fast-check` kullanılır. Tüm testler CI pipeline'ında (`lint → typecheck → test:run → build`) otomatik çalışır.

---

## Build & Performans

```bash
pnpm run build
```

### Chunk Dağılımı

| Chunk | Boyut | İçerik |
|-------|-------|--------|
| `index` | 245 KB | Ana uygulama kodu |
| `vendor` | 235 KB | React 19 + ReactDOM |
| `firebase` | 163 KB | Firebase Firestore SDK |
| `charts` | 385 KB | Recharts / D3 grafikler |
| `animations` | 129 KB | Framer Motion |
| `ui` | 34 KB | Sonner (toast) |
| `exceljs` | 1 MB | Excel işleme (lazy load) |
| `nexus` | 85 KB | Soba Nexus AI (sesli asistan) |

### PWA

Service Worker + Web Manifest aktif. Asset precache ile offline çalışma desteklenir. Google Fonts CacheFirst (1 yıl), Firebase API NetworkOnly olarak yapılandırılmıştır.

Detaylı rapor: `PERFORMANCE_REPORT.md`

---

## Changelog Zorunluluğu

Her kaynak kod değişikliği (`.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.html` vb.) **mutlaka** `src/lib/changelog.ts` dosyasına yeni bir sürüm girişi eklenmelidir.

`src/lib/changelog.ts` dosyası uygulama içinde (Sürüm Kitapçığı sayfası) görüntülenen değişiklik geçmişidir.

### Değişiklik Tipleri

| Tip | Kullanım |
|-----|----------|
| `yeni` | Yeni özellik eklemesi |
| `iyilestirme` | Mevcut özellik iyileştirmesi |
| `duzeltme` | Hata düzeltmesi |
| `kaldirildi` | Özellik kaldırılması |

### Örnek

```typescript
{
  version: '3.2.0',
  date: '26 Mayıs 2026',
  title: 'Performans İyileştirmeleri',
  summary: 'Kısa açıklama.',
  changes: [
    { type: 'iyilestirme', text: 'Yapılan değişiklik' },
    { type: 'duzeltme', text: 'Düzeltilen hata' },
  ],
},
```

### Git Hook (pre-commit)

`src/lib/changelog.ts` güncellenmeden commit yapılmasını engelleyen bir pre-commit hook bulunur:

- Hook dosyası: `.simple-git-hooks/pre-commit`
- `pnpm install` sonrası otomatik aktif olur (`simple-git-hooks` ile)
- Kaynak kod değişikliği varsa ve changelog güncellenmemişse commit reddedilir

---

## Firebase Sync (Opsiyonel)

Uygulama içi **Entegrasyonlar** sayfasından Firebase proje bilgilerini girerek bulut sync aktif edilebilir. Aktif edilmezse uygulama tamamen offline çalışır.

---

## Mobil

Capacitor 8 ile Android APK desteği:

```bash
pnpm run cap:android
```

Android manifest, ikonlar, bildirim izinleri ve tema renkleri `android/` dizininde yapılandırılmıştır.

---

## Lisans

Özel kullanım.
