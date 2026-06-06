---
name: parspel-fallow
description: >
  Fallow codebase intelligence entegrasyonu. Kullanılmayan kod, tekrar, circular
  dependency, complexity hotspot, mimari boundary tespiti. CI'da PR gate olarak
  calisir. npx fallow audit ile degisen kodun riskini olcer.
version: 1.0.0
author: PARSPEL
hooks:
  onComplete: true
requires:
  - pnpm
tools:
  - bash
  - edit
  - write
---

# PARSPEL — Fallow Codebase Intelligence

## Overview

Fallow, JS/TS reposu için deterministic kod kalite analizi yapar. Rust-native, sub-second, zero-config.

**Kategori**:

| Özellik | Açıklama |
|---------|----------|
| Dead code | Kullanılmayan export, dosya, dependency, enum member, suppression |
| Duplication | Clone family tespiti (4 mod: strict/mild/weak/semantic) |
| Complexity | Fonksiyon bazında complexity, health score (0-100), hotspot |
| Architecture | Circular dep, boundary violation, re-export chain |
| PR Risk | `fallow audit` ile degisen kodun risk skoru (pass/warn/fail) |
| Agent | MCP server, LSP, typed JSON output, `actions[]` ile auto-fix |

## Kurulum

```bash
pnpm add -D fallow
```

## Kullanım

### PR Audit (CI'da calistirilacak)
```bash
npx fallow audit --format json
```
Verdik: **pass** (exit 0), **warn** (exit 0), **fail** (exit 1)

### Health Score
```bash
npx fallow health --score --hotspots --targets
```

### Dead Code
```bash
npx fallow dead-code
```

### Duplication
```bash
npx fallow dupes --mode semantic
```

### Tek Dosya Kontrolü (lint-staged entegrasyonu)
```bash
npx fallow dead-code --file src/utils.ts
```

## CI Entegrasyonu

GitHub Actions:
```yaml
- uses: fallow-rs/fallow@v2
  with:
    command: audit
    comment: true
    review-comments: true
```

GitLab:
```yaml
include:
  - remote: 'https://raw.githubusercontent.com/fallow-rs/fallow/v2/ci/gitlab-ci.yml'
```

## Agent Kullanımı

Fallow, AI agent'larin repo hakkinda tahmin yurutmek yerine yapılandırılmış veri almasini saglar.

Agent su sorulari sorabilir:
- Bu symbol kim tarafindan import ediliyor?
- Bu export neden kullanilmamis sayiliyor?
- Bu dosyaya dokunmak riskli mi?
- Hangi dosyalar architectural hotspot?

Cikti:
```bash
npx fallow audit --format json
npx fallow --format json
npx fallow fix --dry-run --format json
```

## Scripts

```json
{
  "lint:fallow": "fallow audit",
  "lint:fallow:all": "fallow",
  "lint:fallow:health": "fallow health --score",
  "lint:fallow:deadcode": "fallow dead-code"
}
```

## Yapılandırma

`.fallowrc.json`:
```json
{
  "production": {
    "health": true,
    "deadCode": false,
    "dupes": false
  }
}
```
