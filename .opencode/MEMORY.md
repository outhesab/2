# PARSPEL — Kalıcı Hafıza

> Bu dosya her session başında otomatik yüklenir. Önemli notlar, kararlar ve yapılacaklar buraya yazılır.

## Aktif Session

- **Tarih:** 10.06.2026
- **Hedef:** MCP fix + Memory/Cache optimizasyonu
- **Durum:** MCP'ler düzeltildi, audit-state.json oluşturuldu, incremental audit aktif

## Önemli Kararlar

- Skill'ler `~/.config/opencode/skills/` yerine proje içi `.opencode/skills/` klasöründe
- `opencode.json`'da `skills.paths` ile referans verildi — GitHub'da versiyonlanır
- `MEMORY.md` ile cross-session hafıza — `instructions` dizisinde referans
- SKILL_SPEC.md ve SKILL_HOOKS.md standartları oluşturuldu
- **MCP Fix (10.06.2026):** Tüm MCP type'ları `local→stdio`, `remote→sse` olarak düzeltildi → **HATALIYDI! Doğrusu: `stdio→local`, `sse→remote` olacak. opencode schema `type: "local"` ve `type: "remote"` bekliyor.**
- **Tool Call Fix (10.06.2026):** Tüm LM Studio modellerine `tool_call: true` eklendi
- **Incremental Audit (10.06.2026):** Full scan yasak, sadece değişen dosyalar analiz edilir
- **File Hash Tracking (10.06.2026):** Aynı hash = skip, sadece değişen dosyalar okunur
- **MCP State Tracking (10.06.2026):** Playwright, Lighthouse, Storybook state'leri `.opencode/memory/audit-state.json`'da tutulur

## Optimizasyon Kuralları (ZORUNLU)

### 1. File Hash Tracking
- Her dosya için hash hesapla (SHA-256)
- Dosya değişmediyse **tekrar OKUMA**
- Sadece hash değiştiyse yeniden analiz et
- Mantık: `filePath → hash → compare → skip / analyze`

### 2. Smart File Read Rule
- Eğer dosya `audit-state.json` içinde `filesAnalyzed` listesinde varsa VE hash değişmemişse → **SKIP**

### 3. Incremental Audit Mode (ZORUNLU)
- **Full scan YASAK**
- Sadece: değişen dosyalar, etkilenmiş componentler, bağımlı route'lar analiz edilir

### 4. Re-run Kontrolü
- Aynı işlem 2 kere yapılamaz
- Eğer işlem `type + target` aynıysa → **SKIP** (already processed)

### 5. Memory Update Rule
- Her başarılı işlem sonrası `audit-state.json` güncellenmeli
- `filesAnalyzed`, `componentsChecked`, `pagesTested` ekle
- Hash güncelle

### 6. Global Performance Rules (YASAK)
- ❌ Full project re-scan
- ❌ Unnecessary glob tekrarları
- ❌ Aynı dosyayı tekrar read etmek
- ❌ Değişmeyen sayfaları tekrar Playwright ile gezmek

### 7. Optimized Workflow
Her cycle: `detect changed → analyze scope → MCP affected only → update memory → repeat`

## Yapılacaklar

- [x] GITHUB_TOKEN env var'ı tanımlandı (GitHub MCP için)
- [x] GITHUB_TOKEN test edildi — geçersiz (401), yeni token gerekli → **düzeltildi, token geçerli (outhesab)**
- [x] LM Studio devre dışı bırakıldı (`disabled_providers` + hermes → openrouter/free)
- [ ] `git commit` ile değişiklikleri kaydet

## Notlar

- `data-query` diye bir klasör PARSPEL'de yok, başka projedeymiş
- Tüm skill'ler spec'e uygun hale getirildi (version, hooks, tools, requires)
- Skill'ler otomatik çalışır, manuel müdahale gerekmez
- MCP'lerin önceki oturumda görünmeme sebebi: `tool_call: false` + yanlış type (`local`/`remote`)
- `GITHUB_TOKEN` tanımlı değil — GitHub MCP'si bu olmadan çalışamaz
- **LM Studio devre dışı (10.06.2026):** `disabled_providers`'a `lmstudio` eklendi. hermes agent OpenRouter'a geçti. yerel-* agent'lar çalışmaz durumda.

---

## Geçmiş

| Tarih | Konu | Karar/Not |
|-------|------|-----------|
| 05.06.2026 | GitHub'dan çekme | `dev` branch'i `15f34d1`'e güncellendi, typecheck+lint+test temiz |
| 05.06.2026 | Skill Creator düzeltme | Yanlış yol düzeltildi, validation, spec, hook sistemi eklendi |
| 05.06.2026 | Tüm skill'ler güncellendi | 7 skill de spec'e uygun hale getirildi |
| 05.06.2026 | Skill'ler projeye taşındı | `.opencode/skills/` + `opencode.json` config |
| 05.06.2026 | MEMORY.md oluşturuldu | Cross-session hafıza sistemi aktif |
| 10.06.2026 | MCP Fix | Tüm type'lar `local→stdio`, `remote→sse` düzeltildi |
| 10.06.2026 | Tool Call Fix | 4 LM Studio modeline `tool_call: true` eklendi |
| 10.06.2026 | Audit State | `.opencode/memory/audit-state.json` oluşturuldu |
| 10.06.2026 | Optimizasyon | File hash tracking + incremental audit kuralları eklendi |
| 10.06.2026 | Audit v2 | parspel-audit SKILL.md v2.0.0: deterministik execution, strict tool pipeline, stop condition, safe fix tanımı, loop-safe |
| 10.06.2026 | LM Studio disable | `disabled_providers` → `lmstudio`, hermes → `openrouter/free`, yerel agent'lar pasif |
| 10.06.2026 | GITHUB_TOKEN | Token tanımlandı ama geçersiz (401), yeni token gerekli |
