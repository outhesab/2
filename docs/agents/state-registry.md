# State Registry (External Memory Layer)

> Agent'ların session başında okuyacağı "proven facts" dosyası.

## Nedir?

`state-registry.json`, projenin o anki durumunu özetleyen 1KB'lık bir dosyadır. Agent'lar bu dosyayı okuyarak kod tabanını baştan taramak yerine doğrudan kanıtlanmış bilgilere erişir.

## Neden?

**Context Vortex Sorunu:** AI agent'lar her session başında projeyi baştan okur. 70K+ satır kod, 28 sayfa, 7 agent — hepsini tekrar keşfetmek hem zaman hem token kaybıdır.

**Çözüm:** `state-registry.json` ile kanıtlanmış bilgileri önceden hazırla. Agent sadece bu dosyayı okusun.

## Kullanım

```bash
# Registry'yi yenile (her değişiklik sonrası)
pnpm run registry

# CI'da otomatik üretilir (quality-gate.yml)
```

## İçerik

| Alan | Açıklama |
|------|----------|
| `version` | Mevcut sürüm (3.31.3) |
| `git` | Branch, commit, tarih |
| `ci` | Lint/test/build durumu |
| `codebase` | Dosya sayıları, LOC, bağımlılıklar |
| `agents` | Agent listesi ve dosya yolları |
| `pages` | Sayfa listesi (28 modül) |
| `protectedFiles` | ASLA dokunulmaması gereken dosyalar |
| `rules` | CI sırası, versiyon dosyaları |
| `contextVortex` | Strateji ve token tasarrufu |

## Agent Akışı

```
Session Başlat
    ↓
state-registry.json oku (1KB, 50ms)
    ↓
Proven facts: versiyon=3.31.3, test=555, pages=28
    ↓
Gereken yere odaklan ( gereksiz tarama yok)
    ↓
İşlemi tamamla
```

## Token Tasarrufu

| Yöntem | Token | Süre |
|--------|-------|------|
| Eski: Tam tarama | ~15.000 | ~30s |
| Yeni: Registry oku | ~500 | ~1s |
| **Tasarruf** | **%97** | **%97** |

## Otomatik Güncelleme

- `pnpm run registry` ile manuel güncelleme
- CI'da `quality-gate.yml` após build başarılı
- Pre-commit hook ile drift kontrolü
