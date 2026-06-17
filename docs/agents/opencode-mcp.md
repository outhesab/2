# OpenCode & MCP — Detaylı

> Kısa versiyon: `AGENTS.md` §9.

## OpenCode Nedir?

OpenCode, terminal/IDE üzerinden çalışan AI kodlama asistanıdır. Multi-agent yapıdadır ve `.opencode/` dizini altında proje-spesifik yapılandırma tutar.

## Agent'lar (`opencode.json`)

| Agent | Model | Ne Zaman Kullan |
|-------|-------|-----------------|
| `hermes` (default) | Qwen3-4B-Thinking (local) | Günlük kodlama, offline, hızlı |
| `coder` | qwen3-coder:free | Çok dosyalı değişiklikler, büyük refactor |
| `architect` | qwen3-next-80b:free | Mimari karar, uzun vadeli planlama |
| `reviewer` | llama-3.3-70b:free | Kod review, güvenlik, performans kontrolü |
| `brainstorm` | (router) | Fikir alışverişi, araştırma |
| `explore` | (fast) | Hızlı dosya arama, codebase analizi |
| `general` | (general-purpose) | Çok adımlı görevler |
| `power-frontend` | (multimodal) | UI/UX, screenshot analizi |
| `power-planner` | (1M context) | Zorunlu CoT, guaranteed capacity |
| `power-reasoner` | (reasoning) | Math/logic problemler |

## MCP (Model Context Protocol)

OpenCode MCP server'lar üzerinden external tool'lara erişir.

### Mevcut MCP'ler
| MCP | Kullanım | Öncelik |
|-----|----------|---------|
| `filesystem` | Dosya okuma/yazma (local) | 1 (en yüksek) |
| `github` | GitHub API (PR, issue, repo) | 2 |
| `web-search` | Web araması (Exa) | 3 |
| `playwright` | Browser automation, E2E test | 4 |
| `lighthouse` | Performance audit | 5 |
| `storybook` | UI validation | 6 |

### MCP Sırası (kullanım önceliği)
```
filesystem → github → web-search → playwright → lighthouse → storybook
```

Yerel dosya işlemleri için önce `filesystem`, sonra `github` (remote repo işlemleri), sonra `web-search` (araştırma).

## Skill Sistemi

`.opencode/skills/` altında özelleştirilmiş skill'ler:

| Skill | Açıklama |
|-------|----------|
| `parspel-audit` | Proje denetim ajanı (v2, deterministic) |
| `parspel-bilesen` | UI bileşen geliştirme |
| `parspel-sayfa` | Sayfa ekleme |
| `parspel-test` | Test yazma |
| `parspel-veri-katmani` | Veri katmanı işlemleri |
| `parspel-agent-ekle` | Yeni agent ekleme |
| `parspel-fallow` | Fallow entegrasyonu |
| `opencode-kimi-bridge` | Kimi planning köprüsü |
| `customize-opencode` | OpenCode config düzenleme |
| `skill-creator` | Yeni skill oluşturma |

## Konfigürasyon

### `opencode.json`
Ana yapılandırma (agents, MCP, providers, instructions).

### `.opencode/MEMORY.md`
Her session başında yüklenen kalıcı hafıza. Session durumu, kararlar, yapılacaklar buraya yazılır.

### `.opencode/PROTOCOL.md`
AI agent için bağlayıcı kurallar. Her session başında okunmalı.

### `.opencode/memory/audit-state.json`
Audit/MCP state tracking:
- `filesAnalyzed` — analiz edilen dosyalar (hash tracking)
- `mcpStates` — MCP durumları
- `processedOperations` — tekrar işlem kontrolü

## Context Management Best Practices

### Session Başlangıcı
1. `.opencode/MEMORY.md` oku
2. `.opencode/PROTOCOL.md` oku
3. Son CI durumunu `audit-state.json`'dan al
4. Değişiklik varsa incremental scan

### Session Süresince
- Aynı dosyayı 2 kez okuma (hash tracking)
- Sadece değişen dosyaları oku
- Sinyal üret, gürültü üretme

### Session Sonu
- Önemli kararları `MEMORY.md`'ye yaz
- `audit-state.json`'u güncelle
- Changelog + package.json güncelle
