# Semantic Versiyonlama — Detaylı

> Kısa versiyon: `AGENTS.md` §5.

## 3-Dosya Kuralı (ÇOK ÖNEMLİ)

`changelog.ts` her güncellendiğinde **mutlaka** bu 3 dosya birlikte güncellenmelidir:

| Dosya | Alan | Değer |
|-------|------|-------|
| `src/lib/changelog.ts` | `CHANGELOG[0].version` | `"3.31.1"` |
| `package.json` | `version` | `"3.31.1"` |
| `src/lib/appConfig.ts` | `APP_DEFAULT_VERSION` | (otomatik, `__APP_VERSION__`'dan) |

`__APP_VERSION__` build sırasında `vite.config.ts` tarafından `package.json.version`'dan inject edilir. Yani aslında **2 dosya** manuel güncellenir:
1. `src/lib/changelog.ts` → yeni entry ekle
2. `package.json` → version güncelle

## Versiyon Tipleri

| Tip | Ne Zaman | Örnek |
|-----|----------|-------|
| **PATCH** `x.x.+1` | Hata düzeltme, küçük iyileştirme | `3.31.0 → 3.31.1` |
| **MINOR** `x.+1.0` | Yeni özellik (geriye uyumlu) | `3.31.1 → 3.32.0` |
| **MAJOR** `+1.0.0` | Kırıcı değişiklik, mimari değişim | `3.32.0 → 4.0.0` |

## Kurallar

- Sadece hata düzeltiyorsan → **PATCH**
- Yeni fonksiyon/component ekliyorsan → **MINOR**
- Mevcut API'yi değiştiriyorsan / agent flow kırıyorsan → **MAJOR** (kullanıcıya sor!)
- Aynı sürümde birden fazla değişiklik → en yüksek seviye kazanır (major > minor > patch)

## changelog.ts Formatı

```typescript
export const CHANGELOG: VersionEntry[] = [
  {
    version: '3.31.2',           // ← yeni versiyon
    date: '18 Haziran 2026',
    title: 'Kısa başlık (max 60 karakter)',
    summary: 'Ne değişti, neden. (1-2 cümle)',
    changes: [
      { type: 'yeni', text: '...' },
      { type: 'duzeltme', text: '...' },
      { type: 'iyilestirme', text: '...' },
      { type: 'kaldirildi', text: '...' },
    ],
  },
  // Önceki versiyonlar korunur (silinmez)
];
```

## Change Type Açıklamaları

| Type | Kullanım |
|------|----------|
| `yeni` | Yeni özellik, component, sayfa |
| `iyilestirme` | Mevcut özelliğin geliştirilmesi |
| `duzeltme` | Bug fix |
| `kaldirildi` | Özellik/sistem kaldırıldı |

## Doğrulama

CI `version-consistency.test.ts` otomatik kontrol eder:
- `VERSION` (`src/lib/version.ts`) === `CHANGELOG[0].version`
- `package.json.version` === `CHANGELOG[0].version`
- `APP_DEFAULT_VERSION` === `CHANGELOG[0].version`
- Tüm version'lar valid semver
- changelog azalan sırada (yeni üstte)
