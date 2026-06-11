# PARSPEL — Değişiklik Kurallar Zinciri

> **Prensip:** Çalışan akışı bozan hiçbir değişiklik kabul edilmez.  
> **Kural:** Zincirin herhangi bir halkası kırılırsa İŞLEM DURUR, değişiklik GERİ ALINIR.

---

## A. DEĞİŞİKLİK ÖNCESİ (Baseline)

```
1. pnpm run lint        → 0 error olmalı. Warning varsa not al.
2. pnpm run typecheck    → Temiz olmalı.
3. pnpm run test:run     → Geçen test sayısı not al. 
4. pnpm run build        → Başarılı olmalı.
```

Bu 4 adım geçtikten sonra **baseline kaydedilir.**  
Geçen test sayısı: `X`. Build süresi: `Y`.

---

## B. DEĞİŞİKLİK ESNASINDA

```
1. SADECE hedef dosyalar değiştirilir.
2. Kırmızı çizgi dosyalara DOKUNULMAZ.
3. Her dosya değişikliğinden sonra changelog güncellenir.
4. Aynı anda MAX 3 dosya değiştirilir.
```

**Kırmızı çizgiler (dokunulamaz):**
- `src/components/ui/**`
- `src/lib/ruleEngine.ts`
- Business logic
- Agent akış sırası
- Git (commit/push/branch)

---

## C. DEĞİŞİKLİK SONRASI (Doğrulama)

```
1. pnpm run lint        → 0 error, warning sayısı artmamış olmalı.
2. pnpm run typecheck    → Temiz olmalı.
3. pnpm run test:run     → Geçen test sayısı azalmamış olmalı.
4. pnpm run build        → Başarılı olmalı.
```

### Başarısızlık durumunda:

| Hata | Aksiyon |
|------|---------|
| Lint yeni error veriyorsa | Değişiklik geri alınır |
| Typecheck kırılırsa | Değişiklik geri alınır |
| Test sayısı azalırsa | Değişiklik geri alınır |
| Build başarısızsa | Değişiklik geri alınır |

**Hiçbir koşulda** "warning artması", "yeni lint hatası", "test kırılması" tolere edilmez.

---

## D. İZİN VERİLEN DEĞİŞİKLİKLER

| Tip | Örnek |
|-----|-------|
| `console.*` → `logger.*` | `console.warn(...)` → `logger.warn('module', ...)` |
| `localStorage` → `save()` | Doğrudan `sobaYonetim` yazma → `save()` pipeline |
| Relative import → `@/` | `../components/` → `@/components/` |
| Eksik import ekleme | `EmptyState`, `SkeletonLoader` import |
| Tip düzeltmesi | `any` → doğru tip |
| null guard ekleme | `if (!x) return` |

## E. YASAKLI DEĞİŞİKLİKLER

| Tip | Sebep |
|-----|-------|
| Business logic değişikliği | Akışı bozar |
| UI redesign | Kapsam dışı |
| Agent akış sırası değişikliği | Multi-agent sistem bozulur |
| `src/components/ui/**` | shadcn upstream |
| `ruleEngine.ts` | Veri bütünlüğü |
| Inline style toplu temizliği | Kapsam çok geniş, risk yüksek |
| Sayfa bölme refactoru | Bağımlılıkları kırabilir |

---

## F. İŞLEM KAYDI

Her oturum sonunda `audit-findings-[tarih].md` dosyasına:
- Yapılan değişiklikler
- CI sonuçları (önce/sonra)
- Kalan işler

---

## G. TEK CÜMLEDE

**Çalışanı bozma. Bozarsan geri al. Geçmezsen devam etme.**
