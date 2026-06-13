# PARSPEL — Kapsamlı Analiz Raporu

> Oluşturulma: 13 Haziran 2026  
> Versiyon: 3.23.2  
> Kapsam: Kod, mimari, süreç, döküman

---

## 🔴 SEVİYE 1 — KRİTİK HATALAR (Acil)

### 1.1 Build Kırık — 19 TypeScript Hatası

```
src/components/LoginScreen.tsx       → 8 hata (çalışmayan kod)
src/components/layout/Sidebar.tsx    → 2 hata (kullanılmayan import)
src/pages/Fatura/FaturaStats.tsx     → 2 hata (kullanılmayan değişken)
src/pages/Reports/ReportsOzet.tsx    → 4 hata (kullanılmayan değişken)
```

**LoginScreen.tsx en kritik:**
- `registerMode`, `setRegisterMode`, `pass2`, `setPass2`, `capsLock`, `setCapsLock` → **çift tanımlanmış** (muhtemelen kötü merge)
- `PARTICLES`, `Particle`, `setTime`, `time` → **tanımlı değil** (55 animasyonlu particle referansı kaybolmuş)
- `ShieldCheck`, `ParspelLogo`, `Button`, `Input`, `Label` → import edilmiş ama kullanılmamış

**pnpm run build → FAIL.** Deploy edilemez.

### 1.2 TOCTOU Yarış Koşulu — Çift Tıklama Veri Kaybı

```
SatisAgent.islemYap():
  T1: const db = this.db              ← snapshot al
  T2: processIntent(intent, db)        ← snapshot'tan hesapla
  T3: this.ctx.save(...)               ← kaydet (bu sırada başka save olmuş olabilir)
```

Kullanıcı hızlı çift tıklayınca **ikinci işlem birincinin değişikliklerini görmez.**  
❌ Stok şişer, kasa ve cari bakiyeleri yanlış hesaplanır.  
❌ 2. işlem 1.'nin üzerine yazar.

### 1.3 `result.data!` — Non-null Yalanı

```typescript
this.ctx.save((prev) => applyIntentResult(prev, result.data!));
```

`IntentResult.data` **opsiyonel** (`data?: {...}`).  
Bir domain servis `{ ok: true }` dönerse (data'sız):  
→ `applyIntentResult(prev, undefined)` → `if (!data) return prev;`  
→ **Hiçbir şey kaydedilmez**  
→ Kullanıcı "Başarılı!" görür, veri kaybolur.

### 1.4 Hata Durumunda Rollback Yok

```typescript
async islemYap(talep): Promise<AgentResponse> {
  const result = processIntent(intent, db);
  if (!result.ok) return { ok: false, error: result.error };
  this.ctx.save((prev) => applyIntentResult(prev, result.data!));
  return { ok: true, data: {...} };   // ← save patlarsa YALAN SÖYLER
}
```

`save()` throw atarsa (localStorage dolu, quota aşımı, vs.):  
→ agent zaten `ok: true` dönmüş  
→ UI "İşlem başarılı" gösterir  
→ Veri KAYBOLDU

---

## 🟡 SEVİYE 2 — MİMARİ KUSURLAR

### 2.1 domainEventBus → Sıfır Dinleyici

```
completeSale() → events: [sale.created, stock.deducted, ...]
  → processIntent: emit(event) on domainEventBus
  → grep "domainEventBus.on(" = 0 SONUÇ
  → 💨 SESSİZLİĞE GİTTİ
```

Event'ler üretiliyor ama **kimse dinlemiyor:**
- Anomali motoru tetiklenmez
- Bildirim motoru tetiklenmez
- Event-driven mimari yarısı havada

**Aslında çalışma şekli:** `applyIntentResult` event'leri OKUYUP stock movement'ları kaydediyor.  
domainEventBus ise **alternatif bir yol** olarak eklenmiş ama arkası getirilmemiş.

### 2.2 Multi-Agent Orchestration Kırıldı

Eski akış:
```
satis → AgentBus.emit → stok dinler → kasa dinler → cari dinler → ...
```

Yeni akış:
```
satis → completeSale() → tüm yan etkiler TEK FONKSİYONDA
     → domainEventBus.emit() → kimse dinlemez
```

**Sorun:** Agent'lar event-driven orchestration için tasarlanmıştı. Yeni sistem hepsini tek fonksiyonda topladı. Bu daha temiz ama:
- AgentBus'a event gitmiyor (sadece `satis.islem` başlangıçta)
- Diğer agent'lar işlem bittiğinden HABERSİZ
- Eğer bir agent'ın işlem sonrası aksiyon alması gerekiyorsa (ör: rapor agent'ı aktivite kaydı) — ÇALIŞMAZ

### 2.3 Domain Servisleri Test Edilmemiş

| Servis | Satır | Test |
|--------|-------|------|
| saleCompletion.ts | 356 | 0 ❌ |
| cashService.ts | 58 | 0 ❌ |
| stockService.ts | 104 | 0 ❌ |
| cariService.ts | 92 | 0 ❌ |
| **TOPLAM** | **610** | **0** |

Pure function'ların EN KOLAY test edilecek katman olması gerekirken **hiç test yok.**  
İş mantığının kalbi güvencesiz.

### 2.4 Save Pipeline'da Çifte Event İşleme

Event'ler **iki farklı mekanizmayla** işleniyor:
1. `applyIntentResult()` → events'ı okuyup stockMovement kaydı ekler ✅
2. `processIntent()` → events'ı domainEventBus'a emit eder → kimse dinlemez ❌

Aynı event iki kere işlenmeye çalışılıyor, biri başarılı biri havaya gidiyor.

### 2.5 Agent'ların Yetki Kontrolü Sadece SatisAgent'da

Sadece `SatisAgent.islemYap()` `yetkiKontrolu('satis.write')` çağırıyor.  
Diğer 6 agent'ın `islemYap()`'ında **yetki kontrolü YOK.**

```typescript
// StokAgent.islemYap() — yetki kontrolü EKSİK
async islemYap(talep): Promise<AgentResponse> {
  // ❌ yetkiKontrolu('stok.write') çağrılmamış!
  const result = processIntent(intent, this.db);
  ...
}
```

### 2.6 Domain Servisleri RuleEngine By-pass Ediyor

Domain servisleri `validateTransaction()` çağırmıyor. RuleEngine sadece `processSave()` içinde çalışıyor. Bu şu an için çalışıyor ama domain servisleri doğrudan çağrılırsa (ör: `import { completeSale } from '@/domain'`) **rules atlanır.**

---

## ⚠️ SEVİYE 3 — UYARILAR

### 3.1 LoginScreen.tsx — 55 Kayıp Particle

Dökümanlarda `PARTICLES` (55 adet animasyonlu parçacık) LoginScreen'de geçiyor ama kodda:
```typescript
// LoginScreen.tsx:193 — TANIMLI DEĞİL!
const PARTICLE_COUNT = 55;
{PARTICLES.map((p, i) => (...
```

Particle animasyonları tamamen kaybolmuş. Render hatası.

### 3.2 Incremental Mode = Stale Veri

```json
// audit-state.json
"incrementalMode": true,
"fullScanBlocked": true
```

AI sadece değişen dosyaları analiz ediyor.  
Sonuç:
- Dökümanlar v3.7'de kaldı, kod v3.23.2'de
- Build'deki 19 hata AI audit raporlarında "Passed ✅" yazıyor
- Test sayısı 413→411 düştü, kimse fark etmedi

### 3.3 Index Chunk Budget Aşımı

| Chunk | Mevcut | Limit | Durum |
|-------|--------|-------|-------|
| index | **376 KB** | 300 KB | ⚠️ +76 KB |
| CSS | **181 KB** | — | ⚠️ Büyük |

AI audit raporunda tespit edilmiş ama çözülmemiş (11 Haziran'dan beri).

### 3.4 AI Performans Metriği Yok

Hangi agent ne kadar hata yapıyor? Kaç task başarılı/başarısız? **Takip edilmiyor.**

| Ne var | Ne yok |
|--------|--------|
| MEMORY.md (elle) | Agent başarı/başarısızlık oranı |
| audit-state.json (otomatik) | Trend analizi |
| audit-findings-*.md (rapor) | Regresyon tespiti |

### 3.5 7 Agent Ama Aynı Pattern

Tüm agent'lar `islemYap`+`mapRequestToIntent`+`processIntent` pattern'ını kullanıyor.  
Bu kadar çok agent'a gerek var mı? `BaseAgent`'a generic `islemYap` eklenip tek agent'a indirgenebilir (C4).

### 3.6 6 MCP Servisi Ama Aktif Kullanımı Bilinmiyor

| MCP | Kurulu mu? | Kullanılıyor mu? |
|-----|-----------|-----------------|
| filesystem | ✅ | ? |
| web-search | ✅ | ? |
| github | ✅ | ? |
| playwright | ✅ | Evet (audit raporunda 10 sayfa test edilmiş) |
| lighthouse | ✅ | Evet (1 audit yapılmış) |
| storybook | ✅ | 1 component (Button) |

Playwright ve Lighthouse çalışmış. Storybook'ta sadece 1 component var. Github ve filesystem kullanımı bilinmiyor.

### 3.7 Test Suite 120sn+ Sürebiliyor

İlk çalıştırmada 120sn timeout yedi, ikincide 49sn sürdü.  
Tutarsız performans. `kapsamli-senaryo.test.ts` (2649 satır) muhtemelen darboğaz.

---

## 🟢 SEVİYE 4 — ÖNERİLER

### 4.1 Acil (1-2 saat)

| # | Aksiyon | Süre |
|---|---------|------|
| 1 | **LoginScreen.tsx'i düzelt** — duplicate değişkenleri temizle, PARTİCLE referansını düzelt veya kaldır | 20 dk |
| 2 | **FaturaStats.tsx, ReportsOzet.tsx, Sidebar.tsx** — kullanılmayan değişkenleri temizle | 10 dk |
| 3 | **saleCompletion.ts:245-250** — CashTransaction/KasaEntry tip uyumsuzluğunu düzelt | 5 dk |
| 4 | **Domain testleri** — ilk 5 kritik testi yaz (completeSale başarılı/yetersiz stok/boş ürün) | 1 saat |

Toplam: ~1.5 saat → **build temizlenir, 19 hata gider.**

### 4.2 Kısa Vade (3-5 saat)

| # | Aksiyon | Süre |
|---|---------|------|
| 5 | **TOCTOU fix** — `processIntent`'i save callback'inin içine al: `save((prev) => applyIntentResult(prev, processIntent(intent, prev).data!))` | 30 dk |
| 6 | **result.data! fix** — `result.data` yoksa hata döndür | 5 dk |
| 7 | **Rollback mekanizması** — save başarısız olursa agent `ok: false` dönsün | 15 dk |
| 8 | **domainEventBus cleanup** — ya dinleyici ekle (anomali/bildirim) ya da emit'i kaldır | 30 dk |
| 9 | **Diğer 6 agent'a yetki kontrolü ekle** | 15 dk |
| 10 | **Full scan cron** — haftada 1 `tsc --noEmit` + `vitest run` çalıştır, sonucu MEMORY.md'ye yaz | 30 dk |

### 4.3 Orta Vade (10-20 saat)

| # | Aksiyon | Süre |
|---|---------|------|
| 11 | **Suppliers.tsx (1298 satır) → 3-4 modüle böl** | 4 saat |
| 12 | **SettingsBackup.tsx (1206 satır) → 3 modüle böl** | 4 saat |
| 13 | **Monitor.tsx (1178) + BugHunter.tsx (1092) + Bank.tsx (1031) + Cari.tsx (1006) böl** | 12 saat |
| 14 | **Domain servislerine kapsamlı test yaz** (tüm edge case'ler) | 4 saat |
| 15 | **Agent sadeleştirme (C4)** — 7 agent → 1 generic agent | 2 saat |

### 4.4 Uzun Vade

| # | Aksiyon |
|---|---------|
| 16 | **Index chunk budama** — 376KB → 300KB altı |
| 17 | **AI performans dashboard** — agent başarı/başarısızlık takibi |
| 18 | **Storybook kapsamını genişlet** — 1 component → 20+ |
| 19 | **Test suite hızlandırma** — `kapsamli-senaryo.test.ts` parçala |

---

## 📊 ÖZET TABLO

| Kategori | Açık | Acil |
|----------|------|------|
| Build hatası | 19 | 8 (LoginScreen) |
| Runtime bug (TOCTOU) | 1 | 1 |
| Veri kaybı riski | 2 | 2 |
| Test açığı | 610 satır | 0 |
| Sayfa >800 satır | 9 | 6 |
| Event dead code | 1 | 0 |
| Agent yetki açığı | 6 agent | 6 |
| Budget aşımı | 2 (index + css) | 1 |
| Toplam acil iş | — | ~5 saat |
| Toplam orta iş | — | ~25 saat |
