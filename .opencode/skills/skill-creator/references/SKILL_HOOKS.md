# Skill Hook Sistemi — Lifecycle Hooks

Skill'lerin çalışma akışına müdahale edebilmek için lifecycle hook sistemi.

---

## 1. Hook Tipleri

| Hook | Tetiklenme Zamanı | Kullanım |
|------|------------------|----------|
| `onMatch` | Skill eşleştiğinde (kullanıcı mesajı skill pattern'ine uyduğunda) | Ön koşul kontrolü, bağlam hazırlığı |
| `onBeforeExecute` | Her adımdan önce | State doğrulama, yetki kontrolü |
| `onAfterExecute` | Her adımdan sonra | Sonuç doğrulama, log |
| `onComplete` | Tüm adımlar başarıyla bittiğinde | Temizlik, bildirim, sonuç raporu |
| `onError` | Herhangi bir adım hata verdiğinde | Rollback, hata raporu, kurtarma |
| `onRollback` | Rollback tetiklendiğinde | Önceki state'e dönüş |

---

## 2. Frontmatter'da Hook Tanımı

```yaml
---
name: my-skill
hooks:
  onMatch: true
  onBeforeExecute: true
  onAfterExecute: true
  onComplete: true
  onError: true
  onRollback: true
---
```

Sadece desteklenen hook'lar listelenir. Desteklenmeyen hook'lar yazılmaz.

---

## 3. Hook Davranışları (SKILL.md Body)

```markdown
## Hooks

### onMatch
Skill tetiklendiğinde:
- Projede ilgili dosyaların varlığını kontrol et
- Gerekli bağımlılıkların kurulu olduğunu doğrula
- Eksik varsa kullanıcıya bildir ve çık

### onBeforeExecute
Her adım öncesi:
- Önceki adımın çıktısını doğrula
- Gerekirse ara state'i kaydet (rollback için)

### onAfterExecute
Her adım sonrası:
- Adım çıktısını beklentiyle karşılaştır
- Uyuşmazlık varsa uyar

### onComplete
Tüm adımlar başarılı:
- Özet rapor hazırla
- Gerekirse changelog/log kaydı oluştur

### onError
Hata durumunda:
- Hatayı logla
- Mümkünse otomatik kurtarma dene
- Kurtarılamazsa kullanıcıya net hata mesajı göster

### onRollback
Rollback gerektiğinde:
- Önceki state'i geri yükle
- Geçici dosyaları temizle
```

---

## 4. Rollback Pattern'i

Her skill `onBeforeExecute`'da önceki state'i kaydedebilir:

```
1. onBeforeExecute → prev state'i kaydet (örn: dosya yedekle)
2. Adım çalıştır
3. onAfterExecute → başarılı mı? 
   - Evet → devam
   - Hayır → onError → onRollback
4. onRollback → prev state'i geri yükle
```

---

## 5. Hook'lar Arası Veri Akışı

```
onMatch → [onBeforeExecute → Execute → onAfterExecute] × N → onComplete
                                                              ↓
                                                         onError → onRollback
```

- Her hook bir önceki hook'tan context alabilir
- Hata zincir boyunca taşınır
- `onError` her seviyede tetiklenebilir
