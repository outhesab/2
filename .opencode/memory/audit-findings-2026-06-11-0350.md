# PARSPEL Frontend Denetim Raporu v2

## Özet

| Metrik | Değer |
|--------|-------|
| Tarih | 11 Haziran 2026, 03:50 UTC |
| Sürüm | 3.20.1 |
| Branch | dev (son commit: `0eb729f`) |
| İterasyon | 1 / 3 |
| Kırmızı Çizgi İhlali | 0 ✅ |

---

## FAZ 2 — Static Analysis Pipeline

| Adım | Sonuç | Süre |
|------|-------|------|
| Lint | **0 error, 0 warning** ✅ | ~10s |
| Typecheck | **Passed** ✅ | ~20s |
| Test:run | **413 pass, 1 skip** ✅ | 71.52s |
| Build | **34.95s, 71 chunks, 2858 KiB** ✅ | 34.95s |

### Build Chunk Sizes (Performance Budget)

| Chunk | Gerçek | Limit | Durum |
|-------|--------|-------|-------|
| `index` | **376.51 KB** | 300 KB | ⚠️ **AŞIM** |
| `vendor` | 234.85 KB | 280 KB | ✅ |
| `firebase` | 165.64 KB | 200 KB | ✅ |
| `charts` | 382.64 KB | 420 KB | ✅ |
| `animations` | 128.69 KB | 160 KB | ✅ |
| `excel` | 424.41 KB | 1.1 MB | ✅ |
| CSS (index) | 181.41 KB | — | ⚠️ Büyük |

### Build Esnasında Düzeltilen
- **changelog.ts satır 27**: `CSS'ler` içindeki tırnak karakteri string'i bozuyordu → **backtick string'e çevrildi** (tek karakter değişikliği)

---

## FAZ 3 — Playwright MCP

### Test Edilen Sayfalar (10 sayfa)

| Sayfa | URL | Console Error | Console Warning |
|-------|-----|---------------|-----------------|
| Login/Kayıt | `/` | 0 | 1 (Firebase) |
| Özet (Dashboard) | `/dashboard` | 0 | 1 (Firebase) |
| Satış | `/sales` | 0 | 1 (Firebase) |
| Ürünler | `/products` | 0 | 1 (Firebase) |
| Kasa | `/kasa` | 0 | 1 (Firebase) |
| Cari | `/cari` | 0 | 1 (Firebase) |
| Fatura | `/fatura` | 0 | 1 (Firebase) |
| Stok | `/stock` | 0 | 1 (Firebase) |
| Raporlar | `/reports` | 0 | 1 (Firebase) |
| Ayarlar | `/settings` | 0 | 1 (Firebase) |

### Akış Testleri

| Akış | Sonuç |
|------|-------|
| Register (kullanıcı oluşturma) | ✅ Çalışıyor |
| Demo hesap ile giriş | ✅ Çalışıyor |
| Sayfalar arası gezinme | ✅ Çalışıyor |
| beforeunload dialog | ✅ Çalışıyor (beklenen davranış) |

### Bilinen Sorunlar
- **beforeunload dialog** her sayfa değişiminde tetikleniyor — `App.tsx`'e eklenmiş bilinçli bir koruma (v3.18.4 changelog)
- **Firebase uyarısı (`%c[WARN] [ui] Firebase'den UI tercihleri yüklenemedi`)** — Firebase opsiyonel, build preview modunda beklenen davranış

---

## FAZ 4 — Lighthouse MCP

Audit tamamlandı ancak temp dosya temizleme hatası (EPERM) nedeniyle skorlar kaydedilemedi. Manuel tekrar çalıştırma gerekebilir.

---

## FAZ 5 — Storybook MCP

| Metrik | Değer |
|--------|-------|
| Durum | ✅ Healthy |
| Component | 1 (UI/Button) |
| Story | 1 (Default) |
| Config | `.storybook/main.ts` + `preview.ts` mevcut |
| Eksik story | 0 |

---

## PARSPEL Kontrol Listesi

- [x] `src/lib/changelog.ts` güncel
- [x] `save()` pipeline'ı bozulmamış
- [x] Agent akış sırası korunmuş
- [x] `src/components/ui/` dosyalarına dokunulmamış
- [x] localStorage'a doğrudan yazma yok
- [x] `any` tip kullanımı yok
- [x] `console.log` yok
- [x] RuleEngine/AuditEngine/AgentBus korunmuş

---

## Bulgular & Öneriler

### P1 — Index chunk boyutu 376 KB (limit 300 KB)
**Etki:** İlk yükleme süresini artırır
**Öneri:** `vite-manual-chunks.ts`'de index chunk'ı bölünebilir veya lazyload optimize edilebilir

### P2 — CSS boyutu 181 KB
**Etki:** Stil yükleme süresi
**Öneri:** Kullanılmayan CSS'ler temizlenebilir (purgeCSS zaten aktif olabilir)

### P3 — Seed data otomatik yüklenmiyor
**Etki:** Demo gösterimlerinde manuel tetikleme gerekir
**Öneri:** İlk kurulumda veya demo modundayken `makeSeedDB()` çağrılabilir

### P3 — Storybook tek component
**Etki:** Component kapsamı eksik
**Öneri:** Ana bileşenler için story eklenebilir (EmptyState, SkeletonLoader, vs.)

---

## Değiştirilen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/lib/changelog.ts:27` | Tek tırnak → backtick string düzeltmesi (build kırılması fix) |

---

## Kırmızı Çizgi İhlalleri

✅ **Hiçbir ihlal tespit edilmedi.**

---

Rapor Sonu.
