# Skill Spec — OpenCode Skill Standardı

Bu doküman tüm opencode skill'leri için standart şablonu, kuralları ve en iyi pratikleri tanımlar.

---

## 1. Dizin Yapısı

```
~/.config/opencode/skills/<skill-name>/
  ├── SKILL.md              # Ana skill dosyası (ZORUNLU)
  ├── references/           # Ek dokümantasyon (OPSİYONEL)
  │   ├── SKILL_SPEC.md     # Bu dosya (referans)
  │   └── SKILL_HOOKS.md    # Hook sistemi (referans)
  ├── scripts/              # Çalıştırılabilir scriptler (OPSİYONEL)
  └── assets/               # Görseller, şablonlar (OPSİYONEL)
```

---

## 2. SKILL.md Frontmatter (YAML)

### Zorunlu Alanlar

| Alan | Tip | Örnek |
|------|-----|-------|
| `name` | `string` | `parspel-test` |
| `description` | `string` (folded `>`) | Ne yaptığı + "Use when..." |

### Opsiyonel Alanlar

| Alan | Tip | Örnek |
|------|-----|-------|
| `version` | `string` (semver) | `1.2.0` |
| `author` | `string` | `PARSPEL Team` |
| `hooks` | `object` | `{ onMatch: true, onComplete: true }` |
| `requires` | `string[]` | `["parspel-veri-katmani"]` |
| `tools` | `string[]` | `["read", "edit", "bash"]` |

### Örnek

```yaml
---
name: my-skill
description: >
  Tam açıklama. Ne işe yaradığı.
  Use when [tetikleyici durum].
version: 1.0.0
author: PARSPEL
hooks:
  onMatch: true
  onComplete: true
requires:
  - parspel-veri-katmani
tools:
  - read
  - edit
  - write
  - bash
  - glob
---
```

---

## 3. SKILL.md Body Yapısı

```
# Skill Adı

## Overview
1-3 cümle özet. Ne zaman kullanılır.

## Instructions
Adım adım executable talimatlar.

### Step 1: [Action]
- Alt adımlar
- Kod blokları

### Step 2: [Action]
...

## Rules
Kurallar tablosu veya listesi.

## Examples
Kod örnekleri (opsiyonel).

## Hooks
Hook davranışları (opsiyonel, SKILL_HOOKS.md'ye referans).
```

---

## 4. Yazım Kuralları

| Kural | Açıklama |
|-------|----------|
| **Executable** | Her adım bir agent tarafından tek başına uygulanabilir olmalı |
| **Net dosya yolu** | Ya absolute path ya da proje-root relative (`src/...`) |
| **Kod blokları** | Dil etiketi zorunlu (`typescript`, `bash`, `json`, `yaml`) |
| **Tablo formatı** | Kural tablolarında `\|` ayırıcı kullan |
| **Hata yönetimi** | Her prosedürde hata durumu ve çözümü belirtilmeli |
| **Test/Verify** | Her skill'de doğrulama adımı olmalı |
| **Dil** | Projeyle tutarlı dil kullan (PARSPEL → Türkçe) |
| **No XML** | Frontmatter'da `<` `>` karakteri yasak |

---

## 5. Skill Tipleri

| Tip | Açıklama | Örnek |
|-----|----------|-------|
| **Prosedürel** | Adım adım talimat | `parspel-agent-ekle` |
| **Referans** | Standart/dokümantasyon | `SKILL_SPEC.md` |
| **Köprü (Bridge)** | İki sistem arası geçiş | `opencode-kimi-bridge` |
| **Kural (Rule)** | Kodlama standardı | `parspel-bilesen` |

---

## 6. İçerik Standartları

### Her Skill'de Olması Gerekenler

- [ ] `name` ve `description` frontmatter'da tanımlı
- [ ] En az 1 adet çalıştırılabilir adım
- [ ] Hata durumu ve çözümü
- [ ] Doğrulama/test adımı
- [ ] Dosya yolları doğru

### Olmaması Gerekenler

- Frontmatter'da XML tag
- Çalışmayan/geçersiz dosya yolları
- Muğlak, uygulanamayan talimatlar
- Projeyle ilgisiz içerik
