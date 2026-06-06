---
name: opencode-kimi-bridge
description: >
  Kimi'nin planlama, reasoning ve geniş bağlam işleme yetenekleri ile
  opencode'un kod yazma, düzenleme ve araç kullanım gücünü birleştirir.
  Karmaşık, çok adımlı yazılım görevlerinde öncelikli olarak kullanılır.
version: 1.1.0
author: PARSPEL
hooks:
  onComplete: true
  onError: true
tools:
  - webfetch
  - read
  - write
  - edit
  - bash
  - glob
  - grep
---

# opencode-kimi-bridge

## Overview

Bu skill, iki güçlü modelin avantajlarını birleştirir: önce Kimi (veya herhangi bir üstün planlama modeli) ile kapsamlı bir plan çıkarılır, ardından opencode ile uygulanır. Karmaşık, çok adımlı görevler için idealdir.

## Instructions

### Phase 1: Planlama (Kimi)

Karmaşık görev geldiğinde:

1. **Kod tabanını analiz et**
   - İlgili tüm dosyaları bul (glob/grep ile)
   - Mevcut yapıyı ve pattern'leri anla
   - Bağımlılıkları belirle

2. **Plan çıkar**
   - Her adımı tek bir dosya değişikliği olacak şekilde parçala
   - Her adım için: hangi dosya, hangi değişiklik, neden
   - Beklenen çıktıyı / test sonucunu belirt

3. **Risk değerlendirmesi**
   - Hangi adımlar geri alınabilir?
   - Hangi adımlar veri kaybına yol açabilir?
   - Kritik adımlar için rollback planı

### Phase 2: Uygulama (Opencode)

Planı adım adım uygula:

1. Her adımda opencode araçlarını kullan:
   - `glob` / `grep` — dosya ara
   - `read` — dosya oku
   - `edit` / `write` — değişiklik yap
   - `bash` — test/lint/build çalıştır

2. Her adımdan sonra doğrula:
   ```bash
   pnpm run typecheck
   pnpm run lint
   pnpm run test:run
   ```

3. Hata varsa dur ve değerlendir:
   - Küçük hata → düzelt ve devam et
   - Büyük hata → Phase 1'e dön, planı revize et

### Phase 3: Kalite Kontrol

1. Tüm testler geçiyor mu? (`pnpm run test:run`)
2. TypeScript hatası var mı? (`pnpm run typecheck`)
3. Lint hatası var mı? (`pnpm run lint`)
4. Plan ile gerçekleşen arasında fark var mı?
5. CHANGELOG güncellendi mi?

## Rules

| Kural | Açıklama |
|-------|----------|
| Planla-uygula | Önce plan, sonra uygulama — asla plansız başlama |
| Her adım atomic | Her adım tek bir değişiklik, kolay geri alınabilir |
| Doğrula | Her adımdan sonra typecheck + lint + test |
| Hata yönetimi | Hata → düzelt veya plana dön |
| Rollback | Kritik adımlar öncesi state kaydet (yedek/git stash) |

## Hooks

### onComplete
- Özet rapor hazırla (kaç adım, kaç dosya, test sonucu)
- CHANGELOG güncellemesini doğrula

### onError
- Hatayı logla
- Geri alınabilir adım mı? → rollback öner
- Kurtarılamaz mı? → kullanıcıya net hata + hangi adımda kalındığını bildir
