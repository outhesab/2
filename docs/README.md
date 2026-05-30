# PARSPEL Dokümanları

Bu dizin PARSPEL projesinin teknik dokümanlarını içerir.

## Doküman Listesi

| Dosya | İçerik | Hedef Kitle |
|-------|--------|-------------|
| [VERI_MODELI.md](VERI_MODELI.md) | Veri şeması, tablolar, ilişkiler, depolama hiyerarşisi | Backend, veri mühendisi |
| [VERI_KATMANI.md](VERI_KATMANI.md) | Depolama hiyerarşisi, save pipeline, Firebase sync, backup | Geliştirici |
| [KULLANICI_SENARYOLARI.md](KULLANICI_SENARYOLARI.md) | 6 detaylı kullanıcı senaryosu | Ürün yöneticisi, tester |
| [API_SERVIS.md](API_SERVIS.md) | Servis katmanı, kural motoru, AI, raporlama | Geliştirici |
| [AGENT_SISTEMI.md](AGENT_SISTEMI.md) | Multi-agent mimarisi, flow diyagramları | Geliştirici |
| [BILESEN_MIMARISI.md](BILESEN_MIMARISI.md) | Bileşen türleri, stil kuraları, state kaldırma, import kuralları | Frontend |
| [NAVIGASYON.md](NAVIGASYON.md) | Route yapısı, tab sistemi, lazy loading, route ekleme prosedürü | Frontend |
| [HATA_DURUMLARI.md](HATA_DURUMLARI.md) | Loading, empty, error state'leri, toast sistemi, ErrorBoundary | Frontend |
| [TEST_STRATEJISI.md](TEST_STRATEJISI.md) | Test piramidi, pattern'ler, CI entegrasyonu, coverage hedefleri | Tüm ekip |
| [PERFORMANS.md](PERFORMANS.md) | Build chunk analizi, PWA, optimizasyon | DevOps, performans |
| [UI_UX.md](UI_UX.md) | UI/UX wireframe, navigasyon, offline-first | Tasarımcı, frontend |
| [FIGMA.md](FIGMA.md) | Tasarım sistemi, kurulum rehberi | Tasarımcı |

## Arşiv

| Dosya | İçerik |
|-------|--------|
| [arsiv/GPT_OTURUM_KAYDI.md](arsiv/GPT_OTURUM_KAYDI.md) | GPT Codex CLI oturum kaydı (26 Mayıs 2026) |

## Hızlı Başlangıç

1. Proje yapısı için → [VERI_MODELI.md](VERI_MODELI.md)
2. Uygulama akışları için → [KULLANICI_SENARYOLARI.md](KULLANICI_SENARYOLARI.md)
3. Servis katmanı için → [API_SERVIS.md](API_SERVIS.md)
4. Agent sistemi için → [AGENT_SISTEMI.md](AGENT_SISTEMI.md)
5. UI detayları için → [UI_UX.md](UI_UX.md)

## Geliştirici Başlangıcı

Yeni bir geliştirici önce şu sırayla okumalı:
1. [NAVIGASYON.md](NAVIGASYON.md) — sayfalar ve route yapısı
2. [VERI_KATMANI.md](VERI_KATMANI.md) — veri akışı ve save pipeline
3. [BILESEN_MIMARISI.md](BILESEN_MIMARISI.md) — bileşen kuralları
4. [HATA_DURUMLARI.md](HATA_DURUMLARI.md) — hata yönetimi
5. [TEST_STRATEJISI.md](TEST_STRATEJISI.md) — nasıl test yazılır
