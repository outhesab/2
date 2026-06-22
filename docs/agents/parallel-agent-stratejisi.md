# 🚀 Parallel Agent Stratejisi Rehberi

> **Deneyim Tarihi:** 23 Haziran 2026
> **Sonuç:** 9 agent ile 15 dakikada ~4.5 saatlik iş (%94 kazanç)

---

## 📋 İçindekiler

1. [Temel Mantık](#temel-mantık)
2. [Kısıtlar ve Kurallar](#kısıtlar-ve-kurallar)
3. [Aşamalı Çalışma Modeli](#aşamalı-çalışma-modeli)
4. [Agent Seçimi](#agent-seçimi)
5. [Prompt Mühendisliği](#prompt-mühendisliği)
6. [Örnek Senaryolar](#örnek-senaryolar)
7. [Sık Yapılan Hatalar](#sık-yapılan-hatalar)
8. [Metrikler ve Ölçüm](#metrikler-ve-ölçüm)

---

## 🎯 Temel Mantık

```
Serial:    Agent A (1 saat) → Agent B (1 saat) → Agent C (1 saat) = 3 saat
Parallel:  Agent A (1 saat) + Agent B (1 saat) + Agent C (1 saat) = 1 saat
```

**Kazanç = (Serial Süre - Parallel Süre) / Serial Süre × 100**

---

## ⚠️ Kısıtlar ve Kurallar

### KURAL 1: Dosya Çakışma Yasağı

```
✅ DOĞRU: Her agent farklı dosyalara dokunur
   Agent 1 → src/lib/safeIO.test.ts
   Agent 2 → src/lib/dbDefaults.test.ts
   
❌ YANLIŞ: İki agent aynı dosyaya dokunur
   Agent 1 → src/components/SobaNexus.tsx (lint fix)
   Agent 2 → src/components/SobaNexus.tsx (logger fix)
```

**Çözüm:** Dosya listesi önceden planlanmalı, hiçbir overlap olmamalı.

### KURAL 2: Bağımlılık Sırası

```
AŞAMA 1 (Paralel): Bağımsız görevler
   Agent 1: Test fix
   Agent 2: Lint fix
   Agent 3: Logger fix

AŞAMA 2 (Sıralı): Bağımlı görevler
   Agent Final: lint + test + build (hepsi tamamlandıktan sonra)
```

### KURAL 3: Optimum Agent Sayısı

| Agent Sayısı | Hızlanma | Risk | Öneri |
|-------------|----------|------|--------|
| 1-2 | %50 | Düşük | ✅ Basit görevler |
| 4 | %65 | Düşük | ✅ Orta görevler |
| **8** | **%75** | **Orta** | **✅ Optimum** |
| 10 | %78 | Orta-Yüksek | ⚠️ Büyük görevler |
| 16+ | %80+ | Yüksek | ❌ Tavsiye edilmez |

**Neden 8 optimum?**
- CPU/RAM yeterli
- API rate limit aşılmaz
- Token maliyeti makul
- Koordinasyon karmaşıklığı yönetilebilir

---

## 📊 Aşamalı Çalışma Modeli

### 3 Aşamalı Strateji

```
AŞAMA 1: Paralel Değişiklikler (5-8 agent)
   ├── Agent 1: Test fix (dosya A)
   ├── Agent 2: Test fix (dosya B)
   ├── Agent 3: Lint fix (dosya C, D, E)
   ├── Agent 4: Lint fix (dosya F, G, H)
   └── Agent 5: Logger fix (dosya I, J, K)
         ↓
AŞAMA 2: Paralel Değişiklikler (3-5 agent)
   ├── Agent 6: Logger fix (dosya L, M, N)
   ├── Agent 7: Kod kalitesi (dosya O, P)
   └── Agent 8: Doküman (dosya Q, R)
         ↓
AŞAMA 3: Sıralı Doğrulama (1 agent)
   └── Agent Final: lint + typecheck + test + build
```

---

## 🤖 Agent Seçimi

### Kullanılabilir Agent Tipleri

| Agent Tipi | Yetenekler | Kullanım |
|-----------|------------|----------|
| `general` | Dosya okuma, düzenleme, komut çalıştırma | **En çok tercih edilen** |
| `agentic-coder` | Kod yazma, refactor | Kod değişiklikleri |
| `explore` | Dosya arama, analiz | Araştırma görevleri |
| `reviewer` | Kod inceleme | Review görevleri |

### Öneri

**%90 durumda `general` agent yeterli.** Diğer agent'lar sadece özel durumlarda.

---

## ✍️ Prompt Mühendisliği

### İyi Prompt Yapısı

```
PARSPEL projesinde [GÖREV] yap.

### Görevin:
1. [DOSYA 1] dosyasını oku
2. [DOSYA 2] dosyasını oku  
3. [İŞLEM] yap
4. [DOĞRULAMA] kontrol et

### ÖNEMLİ:
- Sadece [DOSYA LİSTESİ] dosyalarına dokun
- Başka dosya DEĞİŞTİRME
- [YAPILMAYACAK ŞEY]

Sonuç olarak ne yaptığını ve [SONUÇ] bildir.
```

### Kötü Prompt Örneği

```
Kodları düzelt. (Hangi dosyalar? Ne düzeltilecek? Belirsiz)
```

### İyi Prompt Örneği

```
PARSPEL projesinde `src/lib/safeIO.test.ts` dosyasındaki testleri düzelt.

### Görevin:
1. `src/lib/safeIO.test.ts` dosyasını oku
2. `beforeEach` bloğundaki `localStorage.clear()` hatasını düzelt
3. Testleri çalıştır: `pnpm exec vitest run src/lib/safeIO.test.ts`

### ÖNEMLİ:
- Sadece `safeIO.test.ts` dosyasına dokun
- Başka dosya DEĞİŞTİRME
- Test sonucunu bildir
```

---

## 📝 Örnek Senaryolar

### Senaryo 1: Toplu Test Düzeltme (5 Paralel Agent)

**Durum:** 20 test fail ediyor, 5 farklı dosyada

```
Agent 1: src/lib/safeIO.test.ts → localStorage mock fix
Agent 2: src/lib/dbDefaults.test.ts → assertion güncelleme
Agent 3: src/agents/SatisAgent.test.ts → mock düzeltme
Agent 4: src/hooks/db/core.test.ts → setup fix
Agent 5: src/lib/ruleEngine.test.ts → assertion fix
```

**Sonuç:** Serial 2.5 saat → Parallel 30 dakika (%80 kazanç)

### Senaryo 2: Console→Logger Dönüşümü (8 Paralel Agent)

**Durum:** 50 dosyada console.warn/error var

```
Agent 1-2: Hook dosyaları (10 dosya)
Agent 3-4: Lib dosyaları (15 dosya)
Agent 5-6: Component dosyaları (15 dosya)
Agent 7-8: Page dosyaları (10 dosya)
```

**Sonuç:** Serial 4 saat → Parallel 45 dakika (%81 kazanç)

### Senaryo 3: Büyük Refactor (6 Paralel Agent)

**Durum:** 3 sayfayı modüllere bölme

```
Agent 1: Sayfa 1 → Orchestrator + 4 modül
Agent 2: Sayfa 2 → Orchestrator + 3 modül
Agent 3: Sayfa 3 → Orchestrator + 5 modül
Agent 4: Ortak component'leri çıkar
Agent 5: Testleri güncelle
Agent 6: Import'ları düzelt
```

**Sonuç:** Serial 6 saat → Parallel 1 saat (%83 kazanç)

---

## ❌ Sık Yapılan Hatalar

### HATA 1: Aynı Dosyaya Çakışma

```
❌ Agent 1: SobaNexus.tsx → lint fix
❌ Agent 2: SobaNexus.tsx → logger fix
→ ÇAKIŞMA: İkisi de aynı satırları değiştiriyor
```

**Çözüm:** Dosya listesi önceden planlanmalı.

### HATA 2: Bağımlılığı Göz Ardı Etme

```
❌ AŞAMA 1: lint fix (tüm dosyalar)
❌ AŞAMA 1: test fix (tüm dosyalar) ← paralel
❌ AŞAMA 2: build ← BAĞIMLILIK YOK
```

**Çözüm:** Build/test her zaman en sonda, tüm değişikliklerden sonra.

### HATA 3: Çok Fazla Agent

```
❌ 20 agent paralel çalıştır
→ API rate limit, CPU aşırı yüklenme, token maliyeti
```

**Çözüm:** Maksimum 8-10 agent.

### HATA 4: Belirsiz Prompt

```
❌ "Kodları düzelt"
→ Agent ne yapacağını bilemez
```

**Çözüm:** Net dosya listesi ve işlem talimatı.

---

## 📏 Metrikler ve Ölçüm

### Takip Edilecek Metrikler

| Metrik | Hesaplama | Hedef |
|--------|-----------|-------|
| **Kazanç %** | (Serial - Parallel) / Serial × 100 | > %70 |
| **Başarı Oranı** | Başarılı Agent / Toplam Agent × 100 | > %90 |
| **Dosya Çakışması** | Çakışan dosya sayısı | 0 |
| **Test Geçme** | (Önceki FAIL - Sonra FAIL) / Önceki FAIL × 100 | %100 |

### Rapor Şablonu

```markdown
## Parallel Agent Raporu — [Tarih]

### Kullanılan Agent Sayısı: X
### Toplam Süre: X dakika
### Serial Süre Tahmini: X saat
### Kazanç: %X

### Agent Detayları:
| # | Görev | Dosya | Durum |
|---|-------|-------|-------|
| 1 | ... | ... | ✅/❌ |

### Sonuçlar:
- Lint: X uyarı → Y uyarı
- Test: X fail → Y fail
- Build: X saniye → Y saniye
```

---

## 🔧 Araçlar ve Komutlar

### Agent Başlatma

```typescript
// Tek agent
await task({
  description: "Görev açıklaması",
  prompt: "Detaylı talimat...",
  subagent_type: "general"
});

// Paralel agent'lar (aynı message'da)
await Promise.all([
  task({ ... }),  // Agent 1
  task({ ... }),  // Agent 2
  task({ ... }),  // Agent 3
]);
```

### Doğrulama Komutları

```bash
# Lint
pnpm run lint

# Type check
pnpm run typecheck

# Test
pnpm run test:run

# Build
pnpm run build

# Hepsi birden
pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build
```

---

## 📚 Kaynaklar

- **Deneyim Kaydı:** `.opencode/MEMORY.md` → "Parallel Agent Orkestrasyon Deneyimi"
- **Proje Durumu:** `state-registry.json`
- **CI Kuralları:** `AGENTS.md` → §2 Komutlar

---

**Son güncelleme:** 23 Haziran 2026
**Deneyim sahibi:** PARSPEL ekibi
