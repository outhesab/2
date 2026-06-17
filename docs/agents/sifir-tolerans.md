# Sıfır-Tolerans Kuralları — Detaylı Liste

> **AGENTS.md**'deki özetten daha kapsamlı versiyon. Bu dosya yalnızca referans amaçlıdır; günlük çalışmada AGENTS.md yeterlidir.

## 1. Korunan Sistemler (Asla Değiştirme)

| Sistem | Neden Korunuyor | Risk |
|--------|-----------------|------|
| `src/lib/ruleEngine.ts` | İş mantığının kalbi, veri doğrulama | Veri bozulması |
| `src/hooks/db/core.ts` → `save()` / `saveGuarded()` / `saveWithLog()` | DB yazım pipeline'ı, tüm veri akışı buradan geçer | Veri kaybı |
| `src/agents/AgentBus.ts` | Multi-agent event bus, ajanlar arası iletişim | Agent koordinasyonu çöker |
| `src/components/ui/**` | shadcn/ui kaynak kodları, upstream'den gelir | UI primitive kırılması |
| `src/lib/auditEngine.ts` | Denetim kaydı (her değişiklik loglanır) | Audit trail kaybı |
| `src/lib/changelog.ts` | Versiyon geçmişi (eski entry'ler silinemez) | Versiyon takibi bozulur |
| `.github/workflows/**` | CI/CD pipeline | Build/test kırılır |
| `.simple-git-hooks/**` | Pre-commit guard'ları (changelog, lint zorunluluğu) | Kalite kontrolü bypass |
| `src/types/index.ts` | Mevcut type'lar (sadece ekle, silme/kırma) | Type uyumsuzluğu |

## 2. Yasak Davranışlar

- **localStorage'a direkt yazma:** Her zaman `save()` kullan (RuleEngine + AuditEngine bypass olur)
- **`any` tip kullanımı:** `strict: true` zorunlu, `unknown` veya spesifik tip kullan
- **Inline style (statik):** Tailwind class kullan, sadece dinamik değerler için inline
- **`console.log`:** `logger.ts` üzerinden git (level: debug/info/warn/error/critical)
- **Test silme veya skip:** Yeni test yaz veya düzelt, asla silme
- **`eslint-disable` ekleme:** Mevcut olanlara dokunma, yeni ekleme
- **5'ten fazla dosyaya aynı anda dokunma:** Görevi parçalara böl
- **changelog.ts güncellemeden commit:** Pre-commit hook engelliyor

## 3. İhlal Durumunda Yapılacaklar

Eğer bir korunan sisteme dokunmak zorundaysan:
1. **Dur.** Kullanıcıya sor.
2. Değişiklik gerekçesi + risk analizi sun.
3. Onay alırsan, değişikliği `changelog.ts`'e `kaldirildi` veya `degisti` olarak işle.
4. `git revert` planını önceden hazırla.

## 4. Bilinen İstisnalar

Bazı yerlerde `eslint-disable` mevcut (tarihsel nedenlerle). Yeni ekleme yapma, mevcutları temizlemek ayrı görev.
