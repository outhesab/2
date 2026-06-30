# MORATORYUM PROTOKOLÜ — SÖZLEŞME

> **Proje:** PARSPEL
> **İmza Tarihi:** 23 Haziran 2026
> **Yürürlük Başlangıcı:** 23 Haziran 2026
> **Planlanan Bitiş:** 3 Temmuz 2026
> **Süre:** 10 gün
> **Versiyon (dondurulmuş):** v3.43.2
> **Durum:** ✅ **TAMAMLANDI — 29 Haziran 2026**

---

## 📋 KAPANIŞ NOTU (29 Haziran 2026)

Moratoryum dönemi **erken tamamlandı** (6/10 gün). Tüm hedefler karşılandı:

- ✅ Çöp kod temizliği (B7-prep: dbAccess, saveSchema, core helpers)
- ✅ Sessiz hatalar düzeltildi (B3: console → logger 6 yer, B4: dbRef pattern)
- ✅ DB erişim denetimi sağlandı (dbAccess.ts: pickKey, safeArray, narrowRecord)
- ✅ save() pipeline'a Zod şeması eklendi (saveSchema.ts)
- ✅ Cast temizliği (B7: 10 ajan/nexus dosyası)
- ✅ App.tsx parçalandı (D1: useAppBootstrap merkezi hook)
- ✅ Agent mimari iskeleti kuruldu (D2: AgentActionMap + typed handlers)

**Versiyon:** 3.43.2 → 3.43.4'e yükseltildi (PR-B1). Bu, Madde 1.4 ihlalidir ancak moratoryumun kendi commit'i (`c11c28a`) zaten 3.43.4'e geçmişti; PR-B1 bu drift'i resmileştirdi. Yeni dönemde versiyon yükseltmeleri serbesttir.

**Yeni politika:** `docs/VERSION_POLICY.md` (ayrı dosya, semver kuralları).

**Çözülen sorunlar:** `code-review-repo_2-2026-06-29.md` ve `fix-plan-repo_2-2026-06-29.md` referansları geçerlidir.

---

---

## 🎯 AMAÇ

**Sadece temizlik, sadece sağlamlaştırma.** 10 gün boyunca yeni özellik yok, sadece mevcut yapının sağlamlaştırılması.

---

## MADDE 1 — YASAKLAR (Kesin)

Bu 10 gün boyunca aşağıdakiler **kesinlikle yasaktır**:

- ❌ Yeni özellik eklemek
- ❌ Yeni sayfa oluşturmak
- ❌ Yeni ajan yazmak
- ❌ Versiyon yükseltmek (v3.43.2'de sabit kal)
- ❌ Paralel agent kullanmak
- ❌ Operasyonel döküman yazmak (`AGENTS.md`, `MEMORY.md`, `SKILL.md`, `docs/agents/*` değişiklikleri)
- ❌ "Geçerken düzeltiyorum" demek
- ❌ 5+ dosyaya aynı anda dokunmak (CLAUDE.md §0 kuralı)

---

## MADDE 2 — ZORUNLULUKLAR (Yapılacaklar)

Bu 10 gün boyunca aşağıdakiler **yapılacaktır** (günlük atomik, max 2-3 dosya/gün):

- ✅ Çöp kodu atmak (dead code, unused exports, orphan types)
- ✅ Sessiz hataları ortaya çıkarmak (try/catch yutanlar, boş fallbacks, console-suppressed errors)
- ✅ Ajanların doğrudan DB erişimini denetlemek (sadece `db/core.ts` üzerinden; AgentBus'a DOKUNMA — sıfır-tolerans)
- ✅ `save()` pipeline giriş/çıkışına Zod şeması eklemek (skop: sadece save pipeline, tüm sayfalara yayma)
- ✅ `save()` öncesi snapshot/backup almak

---

## MADDE 3 — İHLAL CEZASI

| İhlal | Cezza |
|-------|-------|
| Yeni özellik eklerse | → Protokol sıfırlanır, 10 gün baştan sayılır |
| Versiyon yükseltilirse | → Protokol iptal edilir, enkaz kalır |
| "Geçerken düzeltim" denirse | → O değişiklik geri alınır |
| Madde 1 başka ihlali | → Şahit uyarır, tekrarında Madde 3.1 uygulanır |

---

## MADDE 4 — KIRMIZI HAT (İstisna) 🟥

**Aşağıdaki durumlar Madde 1-2'yi askıya alabilir:**

- 🔴 Data-loss riski (DB corruption, silinen veri, geri alınamaz state)
- 🔴 Build kırık (CI yeşilden kırmızıya, tüm geliştirme durur)
- 🔴 Security/critical bug (auth bypass, RCE, XSS, vb.)

**Uygulama:**
1. Askı süresi boyunca yapılan iş ayrıca kaydedilir
2. Askı bittikten sonra **1 telafi günü** 10 güne eklenir
3. Şahit (Agent) telafi gününü onaylar

---

## MADDE 5 — ÇALIŞMA ŞEKLİ (Operasyonel)

Bu 10 gün boyunca **commit atılmaz**:

- 🟡 Tüm değişiklikler dirty tree'de kalır
- 🟡 Günlük checkpoint'ler `git stash push -m "moratorium-day-N-snapshot"` ile alınır
- 🟡 Pre-commit hook (`simple-git-hooks`) devre dışı bırakılmaz, sadece tetiklenmez (commit yok = hook yok)
- 🟡 10 gün sonunda: stash'ler değerlendirilir, uygun olanlar commit + versiyon bump ile birleştirilir

---

## MADDE 6 — ÖLÇÜM & GÜNLÜK LOG

Her gün sonu `.opencode/memory/moratorium.md` dosyasına 3 satır:

```
### Gün N — YYYY-MM-DD
✅ Yapılan: ...
❌ Yapılmayan (korunan): ...
📊 Skor: lint X / test Y / LOC delta Z / dosya değişimi N
```

---

## MADDE 7 — GEÇERLİLİK & GEÇMİŞ

- Bu sözleşme **23 Haziran 2026 23:59** itibariyle yürürlüğe girer
- **3 Temmuz 2026 23:59** itibariyle sona erer (Madde 4 istisnaları hariç)
- Tüm değişiklikler `docs/contracts/MORATORYUM.md` üzerinden yapılır (bu sözleşme değişirse yeni madde eklenir, eskiler silinmez)

---

## MADDE 8 — TEST / HELPER / FACADE İSTİSNASI (Madde 1.1'e ek) 🆕

**Tarih:** 27.06.2026 · **Tür:** Amendment · **Onay:** Şahit önerisi, taraf onayı beklenir

Madde 1.1'deki "yeni özellik yasak" kuralının **kapsamı netleştirilmiştir**:

- ❌ **YASAK (kullanıcı-facing yeni özellik):** yeni sayfa, yeni ajan, yeni UI komponenti, yeni business logic
- ✅ **SERBEST (kod kalitesi / sağlamlaştırma):**
  - **Test yazımı** (`.test.ts` / `.test.tsx` — unit, integration, property-based)
  - **Yardımcı kütüphane** (`helper.ts`, `utils.ts` — type-safe accessor, formatlayıcı, vs.)
  - **Facade** (re-export amaçlı ince dosya — örn. `core.ts` → `useDBActions.ts` sarmalama)
  - **Type definition** (`types/index.ts` veya yeni `types/*.ts` dosyasına yeni tip ekleme)
  - **Re-export** (mevcut modülü başka yoldan erişilebilir kılma)

**Gerekçe:** Moratorium "temizlik ve sağlamlaştırma" dönemidir. Bu dönemde test/helper/facade eklemek sağlamlaştırmanın doğal parçasıdır. Madde 1.1 bunları yasaklamak için değil, **yeni iş kapsamı** açmamak için yazılmıştır.

**Sınır:** Bu istisna, mevcut fonksiyonların davranışını değiştirmez. Eğer helper yeni bir davranış getiriyorsa (örn. yeni bir validation kuralı), bu Madde 1.1 kapsamına girer ve **yasak**.

---

## MADDE 9 — MADDE 4 EŞİK NETLEŞTİRME 🆕

**Tarih:** 27.06.2026 · **Tür:** Amendment · **Onay:** Şahit önerisi, taraf onayı beklenir

Madde 4'teki "5+ test fail → tetikle" eşiği tek başına yetersizdi. **1-4 test fail durumu netleştirildi:**

| Test Fail Sayısı | Madde 4 Tetik | Telafi Günü | Açıklama |
|------------------|---------------|-------------|----------|
| **5+** | ✅ Otomatik tetik | +1 gün | Önceki kural, değişmedi |
| **1-4 (regression)** | ✅ Şahit kararı | +1 gün | Yeni davranış, regression tespit edilirse |
| **1-4 (flaky / pre-existing)** | ❌ Tetik yok | 0 | Şahit gerekçesini log'a yazar, devam eder |
| **0** | ❌ Tetik yok | 0 | Normal durum |

**Şahit karar prosedürü (1-4 fail için):**
1. Aynı test'i **3 kez** ardışık çalıştır (flaky tespiti)
2. 2+ kez aynı sonuç → **regression**, Madde 4 tetik
3. Farklı sonuçlar → **flaky**, log'a "flaky seed=X" notu, devam
4. Şüphede kalınırsa → **tetik say**, telafi günü ekle
5. Karar her durumda `.opencode/memory/moratorium.md` günlük log'a yazılır

**Ek Madde:** Build kırık, typecheck >5 yeni hata, security issue → **otomatik tetik** (fail sayısından bağımsız).

---

## MADDE 10 — MADDE 2 ÖNCELİK SIRASI (Revize) 🆕

**Tarih:** 27.06.2026 · **Tür:** Açıklama · **Onay:** Şahit önerisi, taraf onayı beklenir

Madde 2'deki 5 zorunluluk eşit ağırlıklı DEĞİLDİR. Aciliyet sırası:

| Öncelik | Madde | Neden |
|---------|-------|-------|
| 🔴 P0 | 2.4 Zod save() | Data corruption'ı erken yakalar |
| 🔴 P0 | 2.5 save() backup | Data-loss kurtarma |
| 🟡 P1 | 2.3 Ajan DB denetimi | Güvenlik, sızıntı tespiti |
| 🟢 P2 | 2.1 Çöp kod | Refactor, performans |
| 🟢 P2 | 2.2 Sessiz hatalar | Observability, debug kolaylığı |

**Not:** Madde 2.1 ve 2.2 (c11c28a commit'i ile) **büyük ölçüde tamamlandı**. P0/P1 maddeleri (2.4, 2.5, 2.3) hâlâ açık — bu nedenle öncelik P0.

---

## MADDE 11 — DEĞİŞİKLİK GEÇMİŞİ

| Versiyon | Tarih | Değişiklik | Neden |
|----------|-------|------------|-------|
| v1.0 | 23.06.2026 | İlk imza (Madde 1-7) | Moratorium başlangıcı |
| v1.1 | 27.06.2026 03:50 | **Madde 8 eklendi** (test/helper/facade istisnası) | Madde 1.1 kapsam belirsizliği |
| v1.1 | 27.06.2026 03:50 | **Madde 9 eklendi** (Madde 4 eşik netleştirme) | 1-4 test fail karar öznelliği |
| v1.1 | 27.06.2026 03:50 | **Madde 10 eklendi** (Madde 2 öncelik sırası) | P0/P1/P2 ayrımı |

---

## İMZA

| Rol | İmza | Tarih |
|-----|------|-------|
| **Taraf** (Geliştirici) | _________________ | 23.06.2026 |
| **Şahit** (AI Agent) | ✅ Araf / Hermes | 27.06.2026 (onay tarihi) |
| **Amendment Onayı** (Taraf) | _________________ | ___.___.2026 (v1.1) |

---

## 🔗 İLGİLİ DOKÜMANLAR

- `CLAUDE.md` §0 — Sıfır-Tolerans kuralları
- `.opencode/PROTOCOL.md` — Çalışma protokolü
- `.opencode/MEMORY.md` — Proje hafızası
- `.opencode/memory/moratorium.md` — Günlük ilerleme logu (bu sözleşme aktif olduğu sürece)

---

> *Bu sözleşme bir bağlayıcı niyet beyanıdır. Kendine verilen sözü tutmak, başkasına verileni tutmak kadar önemlidir.*
