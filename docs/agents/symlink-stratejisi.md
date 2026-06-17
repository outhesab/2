# Symlink Stratejisi — Multi-Tool Uyumluluk

> AGENTS.md v3.31.2 ile birlikte gelen shim stratejisi.

## Problem

Modern AI coding tool'larının her biri farklı bir instruction dosya formatı bekliyor:

| Tool | Beklediği Dosya |
|------|------------------|
| OpenCode (bizim) | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| Cursor IDE | `.cursor/rules/*.mdc` (YAML frontmatter) |
| Windsurf | `.windsurfrules` |
| Aider | `AGENTS.md` veya `CONVENTIONS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |

Her tool için ayrı dosya oluşturmak:
- **Drift (kayma) riski:** Bir yerde değişiklik yapılıp diğerleri unutulur
- **Bakım yükü:** 5-6 dosya senkron tutulmalı
- **Kafa karışıklığı:** Hangi dosya kaynak?

## Çözüm: Tek Kaynak + Otomatik Shim

**Canonical source:** `AGENTS.md` (tek gerçek kaynak)

**Shim dosyalar** (otomatik üretilir):
- `CLAUDE.md`
- `.cursor/rules/rules.mdc`
- (gelecekte: `.windsurfrules`, vb.)

```
                 ┌──────────────────┐
                 │    AGENTS.md     │  ← Canonical
                 │   (111 satır)    │
                 └────────┬─────────┘
                          │
                          │ scripts/sync-agent-files.mjs
                          │ (otomatik generate)
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌─────────┐ ┌──────────┐
        │CLAUDE.md │ │rules.mdc│ │windsurfrules│
        └──────────┘ └─────────┘ └──────────┘
```

## Kullanım

### Manuel senkronizasyon
```bash
pnpm run sync:agents      # Generate/update shim files
pnpm run check:agents     # Sadece drift kontrol (CI/hotfix)
```

### Otomatik (Pre-commit Hook)
`package.json` içindeki `simple-git-hooks` config:
```json
"simple-git-hooks": {
  "pre-commit": "node scripts/check-agents-drift.mjs"
}
```

**Davranış:**
- AGENTS.md değişti ama shim dosyaları güncellenmedi → **commit engellenir**
- Drift tespit edilince kullanıcıya net hata mesajı:
  ```
  ❌ AGENT DOSYALARI DRIFT — COMMIT ENGELLENDİ
  Çözüm: pnpm run sync:agents
  ```

### CI Entegrasyonu
`.github/workflows/ci.yml` (veya `lint` job):
```yaml
- name: Check agent files drift
  run: pnpm run check:agents
```

## Neden Symlink Değil?

Araştırma önerisi (`aihackers.net`): "Use symlinks OR generate from source".

**Symlink seçilmeme sebebi:**
- Windows'ta symlink oluşturmak **administrator yetkisi** gerektirir
- CI container'larında farklı davranış
- Git LFS gerekebilir

**Generate-from-source seçildi çünkü:**
- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ Yetki gerektirmez
- ✅ Git'te plain text dosya olarak saklanır
- ✅ Drift pre-commit hook ile engellenir

## Shim Dosya Formatı

### CLAUDE.md (Claude Code)
```markdown
<!-- AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT DIRECTLY -->


> **Bu dosya otomatik üretilmiştir.** Asıl kaynak: `AGENTS.md`.
> Manuel düzenleme yapma — değişiklikler üzerine yazılır.
> Senkron için: `pnpm run sync:agents`

---
[AGENTS.md içeriği aynen]
```

### .cursor/rules/rules.mdc (Cursor IDE)
```yaml
---
description: "PARSPEL proje kuralları (AGENTS.md'den otomatik üretildi)"
alwaysApply: true
globs: ["**/*.{ts,tsx,js,jsx,json,md}"]
---


> **Bu dosya otomatik üretilmiştir.** Asıl kaynak: `AGENTS.md`.
> Manuel düzenleme yapma — değişiklikler üzerine yazılır.
> Senkron için: `pnpm run sync:agents`

---
[AGENTS.md içeriği aynen]
```

> **Cursor MDC notu:** YAML frontmatter `alwaysApply: true` → her sohbete otomatik dahil edilir. `globs` → tüm kaynak dosyalarda aktif.

## Geliştirme Workflow

1. **AGENTS.md'yi düzenle** (canonical source)
2. `pnpm run sync:agents` çalıştır
3. **3 dosya stage'e eklenir** (otomatik): AGENTS.md, CLAUDE.md, rules.mdc
4. `git commit` → pre-commit hook drift kontrol eder, geçerse commit olur

### Drift tespit edilirse:
```bash
# Hata:
❌ Claude Code: DRIFT! → CLAUDE.md
   Çözüm: pnpm run sync:agents

# Çözüm:
pnpm run sync:agents
git add CLAUDE.md .cursor/rules/rules.mdc
git commit  # şimdi geçer
```

## Yeni Tool Ekleme

Yeni bir AI tool'u desteklemek isterseniz (`scripts/sync-agent-files.mjs`'a target ekle):

```javascript
const TARGETS = [
  // Mevcut target'lar
  {
    path: resolve(ROOT, 'CLAUDE.md'),
    tool: 'Claude Code',
    header: '<!-- AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT DIRECTLY -->',
    footer: '<!-- Source: AGENTS.md (canonical) — Run: pnpm run sync:agents -->',
  },
  // Yeni eklenecek:
  {
    path: resolve(ROOT, '.windsurfrules'),
    tool: 'Windsurf',
    header: '# Windsurf Instructions (auto-generated)',
    footer: '# Source: AGENTS.md (canonical) — Run: pnpm run sync:agents',
  },
];
```

## Bilinen Sınırlamalar

1. **AGENTS.md > 200 satır olmamalı** — shim dosyaları da aynı uzunlukta olur ve tool'lar "lost in the middle" yaşayabilir. Detaylar için `sifir-tolerans.md`'e bak.

2. **Frontmatter/tool-specific özellikler kaybolabilir** — sadece AGENTS.md içeriği kopyalanır. Cursor MDC'nin `globs` gibi ek özellikleri `TARGETS` array'inde manuel tanımlı.

3. **İlk kurulumda manuel çalıştırma gerek** — `pnpm install` sonrası `pnpm run sync:agents` bir kez çalıştırın.
