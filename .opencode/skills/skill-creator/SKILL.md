---
name: skill-creator
description: >
  Create, modify, and improve opencode skills. Guides through full lifecycle:
  spec compliance, folder structure, SKILL.md with YAML frontmatter, validation,
  hook registration, and testing. Use when creating a new skill or editing
  an existing one.
---

# Skill Creator

## 1. Define the Skill

Ask the user:
- **Purpose**: What should this skill do?
- **Trigger**: When should it activate? (specific task patterns, file patterns)
- **Tools**: What does it need? (read, edit, write, bash, glob, grep, websearch, webfetch)
- **Dependencies**: Does it depend on other skills or project config?

## 2. Create Folder Structure

```
~/.config/opencode/skills/<skill-name>/
  ├── SKILL.md              # Ana skill dosyası (zorunlu)
  ├── references/           # Detaylı dokümantasyon (opsiyonel)
  │   ├── SKILL_SPEC.md     # Skill spec standardı (referans)
  │   └── SKILL_HOOKS.md    # Hook sistemi (referans)
  ├── scripts/              # Shell/PowerShell scriptleri (opsiyonel)
  └── assets/               # Görsel vb. (opsiyonel)
```

- Folder name: `kebab-case`
- Ana dosya: `SKILL.md` (case-sensitive, **zorunlu**)

## 3. Write SKILL.md

### Frontmatter (YAML)

```yaml
---
name: my-skill
description: >
  Ne yaptığı. Ne zaman kullanılacağı.
  Use when [trigger condition].
version: 1.0.0
author: PARSPEL
hooks:
  onMatch: true        # Skill eşleştiğinde çalışır
  onComplete: true     # İşlem bittiğinde çalışır
  onError: true        # Hata durumunda çalışır
requires:
  - other-skill-name   # Bağımlılıklar (opsiyonel)
tools:
  - read
  - edit
  - write
  - bash
---
```

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `name` | Evet | Kebab-case, benzersiz |
| `description` | Evet | Ne yaptığı + tetikleyici |
| `version` | Hayır | Semver |
| `author` | Hayır | Kim yazdı |
| `hooks` | Hayır | Hangi lifecycle hook'ları destekler |
| `requires` | Hayır | Bağımlı olduğu skill'ler |
| `tools` | Hayır | İhtiyaç duyduğu araçlar |

### Body (Markdown)

```
# Skill Adı

## Overview
Kısa açıklama, ne zaman kullanılır.

## Instructions
Adım adım talimatlar. Her adım net ve executable olmalı.

### Step 1: ...
### Step 2: ...

## Rules
Tablo veya liste ile kurallar.

## Examples
Mümkünse kod örnekleri.

## Hooks (opsiyonel)
Varsa hook davranışları.
```

## 4. Validation

Oluşturduktan sonra:

```bash
# 1. SKILL.md var mı?
Test-Path -LiteralPath "$env:USERPROFILE\.config\opencode\skills\<name>\SKILL.md"

# 2. Frontmatter geçerli YAML mi? (name + description var mı?)
# Elle kontrol
```

Manual validation checklist:
- [ ] name kebab-case ve benzersiz
- [ ] description "Use when..." içeriyor
- [ ] Hiçbir satırda XML angle bracket (`<`, `>`) yok (frontmatter'da)
- [ ] Adımlar executable (agent tek başına uygulayabilir)
- [ ] Dosya yolları ya absolute ya da proje-root relative
- [ ] Test/verify adımı var

## 5. opencode.json Registration (opsiyonel)

Skill bir agent'a bağlanacaksa `opencode.json`'da:

```json
{
  "agentDefinitions": {
    "agent-adı": {
      "description": "Açıklama",
      "skills": ["skill-name"]
    }
  }
}
```

## 6. Test

- Skill'i tetikleyecek bir task simüle et
- Tüm adımların çalıştığını doğrula
- Hata durumlarını test et

## Rules

| Kural | Açıklama |
|-------|----------|
| Kebab-case | Folder adı `my-cool-skill` |
| SKILL.md | Büyük-küçük harf duyarlı |
| Description | Ne yaptığı + "Use when..." |
| No XML | Frontmatter'da `<` `>` yasak |
| Executable | Adımlar agent tarafından uygulanabilir olmalı |
| Referans | Detaylı doküman `references/` altında |
