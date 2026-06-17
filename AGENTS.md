# AGENTS.md — Parspel Agent Talimatları

> Bu dosya her AI agent/tool için zorunlu okumadır.
> İlk önce SIFIR-TOLERANS bölümünü oku, sonra devam et.

---

## 0. SIFIR-TOLERANS KURALLARI (EN ÖNEMLİ)

### ❌ ASLA YAPMA — Bu kuralları hiçbir gerekçeyle ihlal edemezsin

**Korunan Sistemler — Dokunma:**
- `src/lib/ruleEngine.ts` — kural motoru, iş mantığının kalbi
- `src/hooks/db/core.ts` içindeki `save()` / `saveGuarded()` / `saveWithLog()` pipeline'ı
- `src/agents/AgentBus.ts` — event bus, agent iletişimi
- `src/components/ui/` — shadcn/ui primitifleri, asla değiştirme
- `src/lib/auditEngine.ts` — denetim kaydı
- `src/lib/changelog.ts` — sadece yeni entry ekle, eskiyi silme/değiştirme
- `.github/workflows/` — CI/CD workflow'ları
- `.simple-git-hooks/` — pre-commit hook'ları
- `src/types/index.ts` — mevcut type'ları silme/kırma, sadece ekle

**Yasak Davranışlar:**
- localStorage'a direkt yazma — her zaman `save()` kullan
- `any` tip kullanma — strict TypeScript zorunlu
- Inline style (dinamik değerler hariç) — Tailwind kullan
- `console.log` bırakma — `logger.ts` kullan
- Test silme veya skip etme
- `eslint-disable` yorum satırı ekleme (mevcut olanlar hariç)
- Aynı anda 5'ten fazla dosyaya dokunma
- `src/lib/changelog.ts` güncellemeden commit atma

---

## 1. DEĞİŞİKLİK PROTOKOLÜ (Her değişiklik bu sırayı takip eder)
 
### ADIM 0 — Kurulum ve Ortam (Yeni Katılımcılar İçin)
```bash
# Depoyu clone edin
git clone https://github.com/outhesab/2.git
cd repo_2

# Bağımlılıkları kurun
pnpm install

# Geliştirme sunucusunu başlatın
pnpm run dev
```
**Gereksinimler:** Node.js >= 22, pnpm >= 9, Git.

### ADIM 1 — Baseline Al (Değişikliğe başlamadan önce)
```bash
pnpm run lint
pnpm run typecheck
pnpm run test:run
pnpm run build
```
Hepsi pass etmeli. Herhangi biri fail ediyorsa, **önce onu düzelt**, sonra göreve başla.

### ADIM 2 — Kapsam Belirle ve Branş Aç
**Branş Modeli:**
- `dev` — Geliştirme dalı, tüm PR'lar buraya açılır.
- Branş açarken: `feat/özellik`, `fix/hata`, `chore/bakım`.

**Süreç:**
- Görev net mi? Değilse sor.
- Hangi dosyalara dokunacaksın? Listele.
- Korunan sistemlerden birine mi dokunuyorsun? → Dur, kullanıcıya sor.
- 5'ten fazla dosya mı? → Görevi parçalara böl.


### ADIM 3 — Değişikliği Yap
- Sadece görevde belirtilen şeyi yap.
- Gördüğün başka sorunu "geçerken düzelt" → YAPMA. Ayrı görev olarak raporla.
- Her fonksiyon değişikliğinde ilgili testi de güncelle.

### ADIM 4 — Changelog Güncelle
```typescript
// src/lib/changelog.ts — en üste yeni entry ekle
{
  version: '3.x.x',
  date: 'DD Ay YYYY',
  title: 'Kısa başlık',
  summary: 'Ne değişti, neden.',
  changes: [
    { type: 'duzeltme', text: 'Açıklama' },
  ],
},
```

### ADIM 5 — Doğrulama (Değişiklikten sonra)
```bash
pnpm run lint
pnpm run typecheck
pnpm run test:run
pnpm run build
```
**Hepsi pass** → Devam et.
**Herhangi biri fail** → `git revert HEAD`, kullanıcıya bildir, dur.

### ADIM 6 — Commit
```bash
git add <sadece değiştirdiğin dosyalar>
git commit -m "fix/feat/chore: açıklama"
```
Branch: `dev`'den ayrıl → `feat/...`, `fix/...`, `chore/...`

---

## 2. KOMUTLAR & ORTAM

- **Package Manager:** `pnpm` (zorunlu). Node ≥ 22, pnpm ≥ 9.
- **Dev Server:** `pnpm run dev` (port 3000)
- **Build:** `pnpm run build` (Vite 7)
- **Test:** `pnpm run test:run` (Vitest + fast-check)
- **Tek Test:** `pnpm exec vitest run src/lib/ruleEngine.test.ts`
- **Typecheck:** `pnpm run typecheck` (tsc --noEmit)
- **Lint:** `pnpm run lint` / `pnpm run lint:fix`
- **Format:** `pnpm run format` / `pnpm run format:check`
- **Fallow Audit:** `pnpm run lint:fallow` (CI kapısı)
- **Mobile:** `pnpm run cap:android` (Capacitor 8)

### CI Pipeline Sırası (değiştirilemez)
```
lint → typecheck → test:run → build
```

---

## 3. MİMARİ

### Veri Katmanı (Offline-First)
- **Birincil:** `localStorage` (key: `sobaYonetim`)
- **Yedek:** IndexedDB via Dexie (5s debounce snapshot)
- **Sync:** Firebase Firestore (opsiyonel, 1.2s debounce, last-write-wins)
- **Kayıt Pipeline:** `save(updater)` → prevDB → updater(prevDB) → RuleEngine → AuditEngine → localStorage → IndexedDB → Firebase

**Save Kuralları:**
```typescript
// DOĞRU — immutable updater pattern
save((prevDB: DB) => ({ ...prevDB, field: newValue }))

// YANLIŞ — direkt yazma, asla yapma
localStorage.setItem('sobaYonetim', JSON.stringify(db))
```

Kurtarma sırası: localStorage bozuksa → IndexedDB → `dbDefaults`

**Limitler:**
- localStorage: ~5-10MB
- Firebase: 1MB/doc (büyük DB'ler chunk'lanır)

### State Yönetimi
- **Veri:** `useDB` hook → `useState<DB>`
- **Agent:** Zustand `agentStore` (aktif agent, busy state)
- **UI:** Component-local `useState`

### Domain-Driven Mimari (v3.23+)

Son session'larda **yeni domain katmanı** eklendi. Artık iş mantığı `src/domain/` altında saf fonksiyonlar olarak çalışır:

```
src/domain/
├── types.ts              → Intent, IntentResult, DBUpdates, SaleIntent
├── eventBus.ts            → DomainEventBus (typed pub/sub)
├── intentEngine.ts        → Central router: processIntent(intent, db)
└── services/
    ├── saleCompletion.ts  → completeSale, cancelSale, returnSale, correctSalePrice
    ├── cashService.ts     → processCashTransaction
    ├── stockService.ts    → processStockUpdate, processProductAdd
    └── cariService.ts     → processCariTahsilat, processCariAdd
```

**İşlem Pipeline'ı:**
```
Page → agent.islemYap({ action, payload })
     → mapRequestToIntent() → Intent
     → processIntent(intent, db)
     → domain service (pure function) → { dbUpdates, events }
     → applyIntentResult(prevDB, dbUpdates)
     → save() → localStorage + IndexedDB + Firebase
```

**Önemli:** Agent'lar artık **thin wrapper** — tüm iş mantığı domain servislerinde. Agent'lar sadece HTTP isteklerini Intent'e çevirip sonucu kaydediyor.

### Multi-Agent Sistemi (7 Agent)

| Agent | Rol |
|-------|-----|
| `satis` | Satış yaşam döngüsü |
| `stok` | Stok güncellemeleri |
| `kasa` | Kasa işlemleri |
| `cari` | Cari bakiye |
| `fatura` | Fatura oluşturma |
| `rapor` | Aktivite kaydı |
| `deep_seek` | AI analizi |

**Satış Akışı (değiştirilemez):**
```
satis → stok → kasa (nakit/kart) → cari (vadeli) → fatura → rapor
```

**AgentBus kullanımı:**
```typescript
// Emit
AgentBus.emit('satis', 'SALE_COMPLETED', payload)
// Dinle
AgentBus.on('SALE_COMPLETED', handler)
```

### Rule Engine
- Her `save()` çağrısında `validateTransaction(prevDB, nextDB)` çalışır
- `severity: 'block'` → işlem durur
- `severity: 'warn'` → uyarı gösterilir, işlem devam eder
- 50ms timeout → safe-pass (bypass)
- **Kurallar:** negative_stock (block), negative_kasa (block), duplicate_transaction (warn, 60s), zero_amount (block)

---

## 4. KOD STANDARTLARI

### TypeScript
```typescript
// DOĞRU
const result: SaleResult = processSale(items)

// YANLIŞ — yasak
const result: any = processSale(items)
const result = processSale(items) as unknown as SaleResult
```

- `strict: true` — pazarlık yok
- `noUnusedLocals: true` aktif
- Non-null assertion (`!`) yerine null-check yaz
- `as unknown as X` tip yalanı — yasak

### Stil
```typescript
// DOĞRU — Tailwind
<div className="flex items-center gap-2 p-4">

// DOĞRU — dinamik değer için inline
<div style={{ width: `${percentage}%` }}>

// YANLIŞ — statik inline style
<div style={{ display: 'flex', padding: '16px' }}>
```

### Logging
```typescript
// DOĞRU
import { logger } from '@/lib/logger'
logger.error('İşlem hatası', { context, error })

// YANLIŞ
console.log('debug')
console.error('hata')
```

### Component Kuralları
- Custom component: max 150 satır
- Page component: max 800 satır
- Her component 4 state'i destekler:
  ```typescript
  if (loading) return <SkeletonLoader type="card" count={3} />
  if (items.length === 0) return <Empty><EmptyTitle>Boş</EmptyTitle></Empty>
  if (error) { showToast('Hata', 'error'); return <PageFallback /> }
  return <SuccessContent />
  ```
- `shadcn/ui` primitifleri (`src/components/ui/`) — **asla değiştirme**
- Path alias: `@/` → `src/`

---

## 5. TEST STANDARTLARI

### Pattern
```typescript
// Her test bu yapıyı kullanır — UI bağımlılığı yok
const prevDB = makeDefaultDB()
const nextDB = islemYap(prevDB, input)
expect(nextDB.field).toBe(expectedValue)
```

### Dosya Konumları
- Unit: `src/lib/*.test.ts` (kaynak yanında)
- Integration: `src/__tests__/` (çapraz dosya)
- E2E: `e2e/*.spec.ts` (sadece kritik akışlar)

### Zorunluluklar
- Yeni fonksiyon → mutlaka test yaz
- Hata düzeltme → önce fail eden test yaz, sonra düzelt
- Property-based test için fast-check kullan
- Snapshot test yazma — trivial değişikliklerde kırılır
- Agent private property erişimi (`agent["db"]`) — kırılgan, kullanma
- Shared mutable state testlerde → test sıra bağımlılığı yaratır, kullanma

### Mevcut Test Sorunları (bilgi amaçlı, dokunma)
- H1: P1 tautoloji `kapsamli-senaryo.test.ts:2729`
- H7: Sabit tarih "2020-01-01" zaman bombası
- H5: Private prop erişimi kırılgan

---

## 6. DOSYA HARİTASI

| Amaç | Konum |
|------|-------|
| Entry point | `src/main.tsx` |
| Routing/App | `src/App.tsx` |
| DB Hook | `src/hooks/db/core.ts` |
| Rule Engine | `src/lib/ruleEngine.ts` ⚠️ korumalı |
| Audit Engine | `src/lib/auditEngine.ts` ⚠️ korumalı |
| Agent Sistemi | `src/agents/` |
| AgentBus | `src/agents/AgentBus.ts` ⚠️ korumalı |
| Agent Store | `src/stores/agentStore.ts` |
| Types | `src/types/index.ts` |
| Changelog | `src/lib/changelog.ts` |
| Tab Config | `src/config/tabs.ts` |
| Theme | `src/theme/ThemeProvider.tsx` |
| CSS Değişkenleri | `src/index.css` |
| Logger | `src/lib/logger.ts` |
| Pre-commit Hook | `.simple-git-hooks/pre-commit` ⚠️ korumalı |
| CI Quality Gate | `.github/workflows/quality-gate.yml` ⚠️ korumalı |

---

## 7. PR SÜRECİ

1. `dev`'den branch aç: `feat/...`, `fix/...`, `chore/...`
2. `src/lib/changelog.ts` güncelle (pre-commit hook zorluyor)
3. CI pipeline çalıştır: `lint → typecheck → test:run → build`
4. PR aç (`.github/PULL_REQUEST_TEMPLATE.md` kullan)
5. En az 1 onay al
6. `dev`'e merge

---

## 8. YAYGIN TUZAKLAR

| Tuzak | Açıklama | Çözüm |
|-------|----------|-------|
| Pre-commit bloğu | changelog güncellenmeden commit atılamaz | `src/lib/changelog.ts` güncelle |
| RuleEngine bypass | 50ms timeout aşılırsa safe-pass | Logs kontrol et |
| save() vs saveGuarded() | saveGuarded 'warn' kurallarını atlar | Admin işlemler için saveGuarded |
| saveWithLog() | aktivite + audit log'a ekler | Kullanıcı aksiyonları için |
| localStorage 5-10MB | büyük DB'de jank | DB boyutunu monitör et |
| Firebase 1MB/doc | büyük DB chunk'lanır | sync.ts dikkat |
| useDB her render | memoization yok | selector kullan |
| ExcelJS ~1MB | lazy load, demand'de yüklenir | normal |
| quality-gate zorunlu | deploy/build-apk önce quality çalışır | CI'da needs: quality |

---

## 9. GÜNCEL DURUM (v3.31.0)
 
### ✅ TAMAMLANAN REFACTORLAR
 
| Görev | Eski Durum | Şimdiki Durum |
|-------|-----------|---------------|
| **6.1** Settings.tsx → modüller | 4394 satır monolit | 322 satır + 13 modül ✅ |
| **6.2** AIAsistan.tsx → 3 modül | 1354 satır | 562 satır + ChatPanel/MessageList/ActionHistory ✅ |
| **6.3** Fatura.tsx → 3 modül | Devasa | 360 satır + 5 alt modül ✅ |
| **6.7** Inline CSS → CSS Module | 162 inline style | 16 CSS modül dosyasına taşındı ✅ |
| **6.8** Dead code temizliği | 249 issue | 0 issue ✅ |
| **5.9-5.11** DB testleri | Yok | backup.test.ts (239), core.test.ts (180), sync.test.ts (186) ✅ |
| **5.12** Vitest exclude | Eski kurallar | Temizlendi ✅ |
| **C1** processIntent geçişi | Yarım | Tamamlandı — orchestrator.ts silindi ✅ |
| **C2** Domain Event Bus | Planlandı | mitt-based typed pub/sub + 3 listener ✅ |
| **C3** useDB bölme | 640 satır | 7 dosyaya bölündü ✅ |
| **C4** Agent sadeleştirme | 4 agent ayrı islemYap | DomainAgent base class (~40 satır) ✅ |
| **C7** excel-merge.ts bölme | 742 satır | 3 modül: types, utils, core (~350 satır) ✅ |
| **G4** Firebase sync | setTimeout uncached | SyncQueue ile düzeltildi ✅ |
| **G5** Kasa/POS routing | Hep bankaya | `payment` alanından routing ✅ |
| **Reports.tsx** | 1755 satır | 124 satır + 7 modül ✅ |
| **Dashboard.tsx** | 1425 satır | 851 satır + Dashboard/ (7 bileşen) ✅ |
| **P1 Suppliers.tsx** | 1298 satır | 5 modül (index 736) ✅ |
| **P2 SettingsBackup.tsx** | 1206 satır | 5 modüle bölündü ✅ |
| **P3 Monitor.tsx** | 1178 satır | 5 modül (index 372) ✅ |
| **P4 BugHunter.tsx** | 1092 satır | 6 modül (index 133) ✅ |
| **P5 Bank.tsx** | 1031 satır | 7 modül (index 516) ✅ |
| **P7 Dashboard.tsx** | 851 satır | 398 satır + 9 bileşen ✅ |
| **P8 Products.tsx** | 833 satır | 623 satır ✅ |
| **AnomaliOneri.tsx** | 819 satır | Tailwind Refactor (Sınır altına indi) ✅ |
| **SaleFormModal.tsx** | Devasa | Tailwind Refactor (Sınır altına indi) ✅ |
| **Sales.tsx** | Aşım | Tailwind Refactor (Sınır altına indi) ✅ |
| **Stock.tsx** | Aşım | Tailwind Refactor (Sınır altına indi) ✅ |
| **Kasa.tsx** | Aşım | Tailwind Refactor (Sınır altına indi) ✅ |
| — | **Domain servis testleri** | Yok | 29 test ✅ |
| — | **CI quality gate** | Kesintili | Tam yeşil (lint/typecheck/test/build) ✅ |
 
### ❌ KALAN GÖREVLER
 
#### Sayfa Boyutu (>800 satır, sınırda)
| # | Dosya | Satır | Aşım |
|---|-------|-------|------|
| P6 | **Cari.tsx** | 772 | ✅ Sınır Altında |
 
#### Diğer (düşük öncelikli)
| # | Görev | Detay |
|---|-------|-------|
| — | dataIntegrityChecker.ts (546 satır) | Sınırda |
| D-F-H-I-J-K | ~45 kod kalitesi maddesi | Tekrar, tip, performans, test kalitesi, a11y, dökümantasyon (tümü LOW) |

---

## 10. LOCAL AI ORTAMI

### LM Studio (Offline)
- **API:** `http://127.0.0.1:1234/v1` (OpenAI-uyumlu)
- **JIT:** 300s boşlukta bellekten boşaltılır
- **Context:** Tüm modeller 2048 token

### Yerel Modeller

| Model | Boyut | Kullanım |
|-------|-------|----------|
| Qwen3 4B Thinking | ~2.5GB | Karmaşık reasoning |
| Qwen3 VL 4B | ~2.5GB | Görsel işleme |
| Phi-3.5 Mini | ~2GB | Hızlı basit işler |
| Liquid 1.2B | ~0.8GB | Düşük kaynak/yedek |
| text-embedding | — | Embedding |

### MCP Servisleri

| MCP | Protokol | Kullanım |
|-----|----------|----------|
| filesystem | stdio | Dosya okuma/yazma |
| github | stdio | Issue/PR/repo |
| web-search (Exa) | SSE | Web arama |

### Local Komutlar
- `/ltest` → offline test suite
- `/lfix` → offline hata düzeltme
- `/lreview` → offline kod inceleme
- `/ldurum` → offline proje durumu
- `/ltasi` → offline refactor

### Offline Env Vars
```
OPENCODE_OFFLINE=true
OPENCODE_DISABLE_AUTOUPDATE=true
OPENCODE_DISABLE_MODELS_FETCH=true
OPENCODE_DISABLE_DEFAULT_PLUGINS=true
OPENCODE_DISABLE_LSP_DOWNLOAD=true
```

---

## REFERANS DOKÜMANLARI

| Dosya | İçerik |
|-------|--------|
| `AGENTS.md` | Bu dosya — master kurallar |
| `README.md` | Genel bakış, komutlar |
| `docs/technical/ARCHITECTURE.md` | Mimari: agent sistemi, bileşenler, navigasyon |
| `docs/technical/DATA_LAYER.md` | Veri katmanı, model, servisler |
| `docs/technical/UI_UX.md` | UI/UX akışları, Figma, skin planı |
| `docs/technical/TEST_STRATEGY.md` | Test pattern, coverage |
| `docs/logs/CHANGELOG.md` | Sürüm geçmişi (v1.0.0 → v3.31.0) |
| `docs/management/MASTER_PLAN.md` | İyileştirme planı, ~70 madde (çoğu tamam) |
| `docs/management/WEEKLY_PLAN.md` | Haftalık plan |
| `docs/management/DEVELOPMENT.md` | Mimari, debug |
| `docs/archive/` | Eski doküman arşivi |
| `src/agents/AGENTS.md` | Agent dokümantasyonu |
| `src/components/AGENTS.md` | Bileşen mimarisi |
| `src/lib/AGENTS.md` | Utility kütüphaneleri |
| `src/hooks/AGENTS.md` | React hook'ları |
| `src/pages/AGENTS.md` | Sayfa yapısı |
| `.opencode/skills/` | AI agent skill dosyaları |
| `opencode.json` | 16 AI agent yapılandırması |

---

## 11. SEMANTIC VERSİYONLAMA

Her kaynak kod değişikliğinde `src/lib/changelog.ts` güncellenir. Versiyon numarası şu kurala göre artar:

| Tip | Ne zaman | Örnek |
|-----|----------|-------|
| **PATCH** `x.x.+1` | Hata düzeltme, küçük iyileştirme | `3.7.1 → 3.7.2` |
| **MINOR** `x.+1.0` | Yeni özellik, geriye uyumlu | `3.7.2 → 3.8.0` |
| **MAJOR** `+1.0.0` | Kırıcı değişiklik, mimari değişim | `3.8.0 → 4.0.0` |

**Kurallar:**
- Sadece hata düzeltiyorsan → PATCH
- Yeni fonksiyon/component ekliyorsan → MINOR
- Mevcut API'yi değiştiriyorsan / agent flow kırıyorsan → MAJOR, kullanıcıya sor
- Aynı sürümde birden fazla değişiklik → en yüksek seviye kazanır (major > minor > patch)

---

## 12. ERROR HANDLING PATTERN

### Zorunlu Pattern
```typescript
// DOĞRU — her try/catch logger kullanır
import { logger } from '@/lib/logger'

try {
  const result = await riskyOperation()
  return result
} catch (error) {
  logger.error('İşlem başarısız', {
    context: 'fonksiyon_adı',
    error,
    input: { ilgili, parametreler }
  })
  throw error // veya kullanıcıya göster
}

// YANLIŞ — boş catch, yasak
try {
  riskyOperation()
} catch {}

// YANLIŞ — sadece console, yasak
try {
  riskyOperation()
} catch (e) {
  console.error(e)
}
```

### Agent İçinde Error Handling
```typescript
// Agent metodları her zaman Result pattern döner
type AgentResult<T> = { success: true; data: T } | { success: false; error: string }

// Kullanıcıya göstermek için
showToast('Açıklayıcı mesaj', 'error')

// DB işlemi hata verirse — geri alma
try {
  await save((prev) => ({ ...prev, ...changes }))
} catch (error) {
  logger.error('DB kayıt hatası', { context: 'agent_adi', error })
  showToast('Kayıt başarısız, tekrar deneyin', 'error')
}
```

### Yasak Catch Kalıpları
```typescript
catch {}                          // boş — yasak
catch (e) { console.log(e) }     // console — yasak
catch (e) { /* ignore */ }       // yorum — yasak
catch (e) { return null }        // sessiz fail — yasak (en az logger ekle)
```

---

## 13. IMPORT PATH KURALLARI

### Zorunlu: @/ alias
```typescript
// DOĞRU
import { save } from '@/hooks/db/core'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'

// YANLIŞ — relative path, yasak (tek seviye hariç)
import { save } from '../../hooks/db/core'
import { logger } from '../../../lib/logger'
```

**İstisna:** Aynı klasör içi tek seviye relative kabul edilir:
```typescript
// Kabul edilir — aynı klasörde
import { helper } from './helper'
import type { MyType } from './types'
```

### Import Sırası (ESLint zorluyor)
```typescript
// 1. React / framework
import React, { useState } from 'react'

// 2. Üçüncü parti kütüphaneler
import { motion } from 'framer-motion'

// 3. Internal — @/ alias
import { useDB } from '@/hooks/db/core'
import { logger } from '@/lib/logger'

// 4. Component'ler
import { Button } from '@/components/ui/button'

// 5. Types
import type { DB, Sale } from '@/types'
```

---

## 14. GÜVENLİK KURALLARI

### API Key Yönetimi
```typescript
// DOĞRU — sadece env var
const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY

// YANLIŞ — hardcode, yasak
const apiKey = 'sk-abc123...'

// YANLIŞ — localStorage'da saklama, yasak
localStorage.setItem('apiKey', key)
```

**Kurallar:**
- Tüm API key'ler `.env` dosyasında, `VITE_` prefix ile
- `.env` asla commit edilmez (`.gitignore`'da)
- `.env.example` her yeni key eklendiğinde güncellenir (değer değil, key adı)
- Firebase config `import.meta.env` üzerinden okunur, URL query'de geçmez

### XSS Koruması
```typescript
// DOĞRU — DOMPurify zorunlu
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />

// YANLIŞ — sanitize'sız, yasak
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

**Kurallar:**
- `dangerouslySetInnerHTML` → her zaman DOMPurify ile
- Kullanıcıdan gelen veri direkt render edilmez
- `document.write()` yasak
- URL parametrelerini direkt render etme

### Kullanıcı Verisi
```typescript
// YANLIŞ — şifre/hash localStorage'da düz, yasak
localStorage.setItem('userHash', hash)

// DOĞRU — userManager.ts üzerinden
import { getUser } from '@/lib/userManager'
```

---

## 15. SUB-AGENTS.MD OKUMA ZORUNLULUĞU

Her klasörün kendi `AGENTS.md`'i var. O klasörde çalışmadan önce **mutlaka** oku:

| Klasör | AGENTS.md Konumu |
|--------|-----------------|
| `src/agents/` | `src/agents/AGENTS.md` |
| `src/components/` | `src/components/AGENTS.md` |
| `src/lib/` | `src/lib/AGENTS.md` |
| `src/hooks/` | `src/hooks/AGENTS.md` |
| `src/pages/` | `src/pages/AGENTS.md` |

**Protokol:**
1. Hangi klasörde çalışacaksın? Belirle.
2. O klasörün `AGENTS.md`'ini oku.
3. Çelişki varsa → sub-AGENTS.md önceliklidir (daha spesifik).
4. Sub-AGENTS.md yoksa → bu dosyayı baz al.

---

## 16. ROLLBACK PROTOKOLÜ

### Ne Zaman Rollback?
CI pipeline'ın herhangi bir adımı fail ederse → rollback zorunlu. İstisna yok.

### Rollback Adımları
```bash
# 1. Son commit'i geri al (henüz push etmediysen)
git revert HEAD --no-edit

# 2. CI'ı tekrar çalıştır — temiz mi?
pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build

# 3. Temizse kullanıcıya bildir, root cause analiz et
# 4. Temiz değilse — daha önceki commit'e dön
git log --oneline -10  # son 10 commit listesi
git revert <commit-hash> --no-edit

# 5. Push ettiysen (PR'a)
git revert HEAD --no-edit
git push origin <branch>
# — ASLA force push yapma main/dev'e
```

### reset vs revert
| Durum | Komut | Neden |
|-------|-------|-------|
| Henüz commit yok | `git checkout -- .` | Staged değişiklikleri geri al |
| Commit var, push yok | `git reset HEAD~1` | Commit'i geri al, değişiklikler kalır |
| Commit var, push var | `git revert HEAD` | Yeni commit ile geri al, history bozma |
| Çok adım geri | `git revert <hash>` | Spesifik commit'i geri al |

**Altın Kural:** `git push --force` → `main` veya `dev`'e asla. Feature branch'te bile dikkatli.

---

## 17. PERFORMANCE BUDGET

### Chunk Limitleri (aşılırsa build uyarır, PR bloklanır)

| Chunk | Mevcut | Maksimum | İçerik |
|-------|--------|---------|--------|
| `index` | 245 KB | 300 KB | Ana uygulama |
| `vendor` | 235 KB | 280 KB | React 19 + ReactDOM |
| `firebase` | 163 KB | 200 KB | Firebase SDK |
| `charts` | 385 KB | 420 KB | Recharts/D3 |
| `animations` | 129 KB | 160 KB | Framer Motion |
| `exceljs` | ~1 MB | 1.1 MB | Excel (lazy) |

### Yeni Kütüphane Ekleme Kuralları
```bash
# Önce bundle boyutunu kontrol et
npx bundlephobia <paket-adi>
```

- 50KB altı → genelde kabul
- 50-200KB → kullanıcıya sor, alternatif var mı?
- 200KB üzeri → kesinlikle kullanıcıya sor, lazy load zorunlu
- `dependencies` yerine `devDependencies`'e koyulabilecekse → devDep'e koy

### Performans Kuralları
- Yeni `useEffect` eklerken cleanup fonksiyonu zorunlu
- `useCallback` / `useMemo` — sadece gerçek performans sorunu varsa (premature optimization yapma)
- Büyük liste render → `React.memo` veya virtualization
- Senkron CPU-blocking işlem (>16ms) → `setTimeout` veya `Web Worker`'a taşı

---

## 18. BRANCH & DEPLOY YAPISI

### Tek Branch: dev → Direkt Canlı
```
dev  ← tek branch, her push direkt production'a deploy edilir
```

**Bu ne anlama gelir:**
- `dev`'e her push → otomatik Vercel deploy → canlı site güncellenir
- Ayrı `main`, `feat/*`, `fix/*` branch'i **yok ve açılmaz**
- CI pipeline pass etmeden push yapma — canlıya bozuk kod gider

**Yasak:**
```bash
git push --force origin dev   # force push — kesinlikle yasak, history bozar
```

**Doğru Push Akışı:**
```bash
# 1. CI'ı çalıştır
pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build

# 2. Hepsi pass → commit
git add <dosyalar>
git commit -m "fix: açıklama"

# 3. Push → canlıya gider
git push origin dev
```

**Kritik Uyarı:** `dev`'e push = canlıya push. CI pass etmeden commit atma.

---

## 19. TEST COVERAGE EŞİĞİ

### Minimum Zorunlu Coverage

| Katman | Satır | Branch | Fonksiyon |
|--------|-------|--------|-----------|
| `src/lib/` (utility) | %80 | %75 | %85 |
| `src/agents/` | %75 | %70 | %80 |
| `src/hooks/db/` | %70 | %65 | %75 |
| `src/pages/` | %40 | — | — |
| **Genel** | **%60** | **%55** | **%65** |

```bash
# Coverage raporu
pnpm run test:run --coverage

# Belirli dosya coverage'ı
pnpm exec vitest run --coverage src/lib/ruleEngine.ts
```

### Coverage Kuralları
- Yeni fonksiyon eklediysen → o fonksiyonun coverage'ı %80 altına düşemez
- Coverage eşiği altına düşen PR → merge edilmez
- `/* istanbul ignore */` veya `/* c8 ignore */` → sadece gerçekten test edilemeyen kod (platform-specific, vb.)
- Edge case'leri test et: boş array, undefined, sınır değerleri, negatif sayılar

### Öncelikli Test Edilmesi Gerekenler
Bu dosyalarda test yok veya yetersiz — yeni ekleme yaparsan test de yaz:
- `src/hooks/db/core.ts` (5.9 — açık görev)
- `src/hooks/db/backup.ts` (5.10 — açık görev)
- `src/hooks/db/sync.ts` (5.11 — açık görev)
- `src/agents/SatisAgent.ts` — discount, banka/pos testi eksik
- `src/lib/ruleEngine.ts` — min_stock kuralı test edilmemiş

---

## 20. OPENCODE AGENT SEÇİMİ

`opencode.json`'da tanımlı agentlar ve ne zaman kullanılacakları:

| Agent | Model | Ne Zaman |
|-------|-------|----------|
| `hermes` | Qwen3-4B-Thinking (local) | **Default** — günlük kodlama, offline |
| `coder` | qwen3-coder:free | Çok dosyalı değişiklikler, büyük refactor |
| `architect` | qwen3-next-80b:free | Mimari karar, uzun vadeli planlama |
| `reviewer` | llama-3.3-70b:free | Kod review, güvenlik, performans kontrolü |
| `power-coder` | opencode-go | Yoğun coding, SWE-Bench seviyesi görevler |
| `power-planner` | qwen3.6-plus | 1M context, büyük codebase analizi |
| `visionary` | gemma-4-31b | Screenshot'tan kod, UI review, görsel analiz |
| `yerel-hizli` | Phi-3.5 Mini (local) | Hızlı basit işler, internet yok |
| `yerel-goruntu` | Qwen3 VL 4B (local) | Görsel işleme, offline |

**Kurallar:**
- Default agent `hermes` — çoğu görev için yeterli
- `disabled_providers`: openai, gemini, github-copilot, groq, anthropic — bunları seçme
- Context compaction: `auto: true`, `tail_turns: 20` — uzun session'larda otomatik özetleme yapılır
- Compaction sonrası context kaybolabilir — kritik bilgileri `MEMORY.md`'e yaz

---

## 21. FALLOW AUDIT KURALLARI

`pnpm run lint:fallow` her CI'da zorunlu çalışır. Fallow şunları kontrol eder:
- Dead code (kullanılmayan export, fonksiyon)
- Duplicate code (clone grupları)
- Health issues (karmaşıklık, bağımlılık)

### Fallow'ın Dokunmadığı Dosyalar (ignorePatterns)
Bu dosyalar Fallow tarafından taranmaz — değiştirirken dikkatli ol, otomatik uyarı gelmez:
```
scripts/archive/*
src/components/ui/*.tsx        ← shadcn primitifleri
src/lib/specs/*.ts
src/domain/*.ts
src/hooks/db/index.ts
src/lib/dbDefaults.ts
src/lib/vite-manual-chunks.ts
src/lib/utils.ts
src/components/IconPicker.tsx
src/components/SkeletonLoaders.tsx
src/pages/Settings.module.css
src/pages/excelmerge/ai-asistan.css
src/pages/excelmerge/not-found.tsx
src/pages/ConsoleKayit.tsx
src/hooks/use-mobile.tsx
```

### Korunan Class Metodları (usedClassMembers)
Fallow bunları "kullanılmıyor" saymaz — agent sisteminin çekirdek metodları:
```
islemYap, bagla, onEvent, iptalEt, iadeYap, fiyatDuzelt
```
Bu isimleri değiştirme — Fallow config güncellenmeden dead code sayılır.

### Fallow'dan Muaf Export'lar
`ignoreExports` listesindeki dosyaların export'ları Fallow tarafından kontrol edilmez.
Bu dosyalara yeni export eklerken Fallow'a güvenme — manuel kontrol yap:
- Tüm `src/agents/*.ts` dosyaları
- `src/lib/ruleEngine.ts`, `src/lib/auditEngine.ts`, `src/lib/aiActions.ts`
- `src/types/index.ts`, `src/hooks/useDB.ts`

### Fallow Metrikleri (hedef)
```
dead-code issues:      0      (şu an: 0 ✓)
duplicate clone groups: <126  (şu an: 126)
health issues:         <440   (şu an: 440)
maintainability score: >89    (şu an: 89.2)
```

---

## 22. MCP KULLANIMI

Üç MCP aktif — doğru aracı seç:

### filesystem MCP
```
Kullanım: Dosya okuma, yazma, arama, dizin listeleme
Protokol: stdio (local, internet gerektirmez)
Ne zaman: Kod analizi, dosya düzenleme, proje yapısı inceleme
```

### github MCP
```
Kullanım: Issue açma/kapatma, PR yönetimi, commit geçmişi, repo bilgisi
Protokol: stdio (local, GITHUB_TOKEN gerekli)
Ne zaman: Issue takip, commit log inceleme, PR oluşturma
Dikkat: GITHUB_TOKEN env var'da olmalı
```

### web-search MCP (Exa)
```
Kullanım: Web arama, güncel bilgi, dokümantasyon
Protokol: SSE (remote, internet gerekli)
Ne zaman: Kütüphane versiyonu, API dokümantasyonu, hata araştırma
Dikkat: Offline modda çalışmaz
```

**MCP Öncelik Sırası:**
1. `filesystem` — proje dosyaları için her zaman önce bu
2. `github` — repo/issue işlemleri için
3. `web-search` — sadece yukarıdaki ikisi yetmediğinde

---

## 23. MEMORY.MD KULLANIMI

`.opencode/MEMORY.md` — session'lar arası kalıcı hafıza.

### Ne Zaman Yaz?
- Önemli mimari karar alındığında
- Bir bug'ın root cause'u bulunduğunda
- Tekrar eden bir sorun çözüldüğünde
- Kritik bağlam kaybolmamalıysa

### Nasıl Yaz?
```markdown
### Format Örneği
- Karar/Bulgu
- Neden bu seçim yapıldı
- Dikkat edilmesi gereken
```

### Ne Zaman Okuyorsun?
- **Her session başında** — bağlamı kursorlara hatırlatır
- Compaction sonrası — context özetlendiğinde kaybolacak bilgiler burada olmalı

**Dikkat:** `opencode.json` instructions'a `".opencode/MEMORY.md"` eklenmiş — her prompt'ta otomatik yüklenir.

---

## 24. PRE-COMMIT HOOK DETAYI

`.simple-git-hooks/pre-commit` — her commit'te otomatik çalışır.

**Ne yapar:**
- Staged dosyalarda `.ts/.tsx/.js/.jsx/.css/.html/.json` değişikliği varsa
- `src/lib/changelog.ts` staged değilse → **commit reddedilir**
- changelog.ts zaten staged'se → geçer

**Bypass edilemez** — `git commit --no-verify` kullanma, hook'u devre dışı bırakma.

**Hook tetikleyen dosya uzantıları:** `.ts` `.tsx` `.js` `.jsx` `.css` `.html` `.json`

**Hook tetiklemeyen:** `node_modules/`, `dist/`, diğer dosyalar

**Commit reddedilirse ne yaparsın:**
```bash
# 1. changelog.ts'e yeni entry ekle
# 2. Staged'e al
git add src/lib/changelog.ts
# 3. Tekrar commit
git commit -m "..."
```

---

## 25. GITHUB ACTIONS — CI/CD

### quality-gate.yml
```
Tetikler: push → dev, pull_request → dev/main, workflow_call
Node: 22, pnpm: 10
```

**Adımlar (sırayla):**
```
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run test:run
pnpm run build
```

**Kritik:** `--frozen-lockfile` — `pnpm-lock.yaml` değişmeden install yapılır.
Yeni paket ekleyince `pnpm-lock.yaml`'ı commit'e dahil etmeyi unutma.

### Deploy (dev → Canlı)
- `dev`'e her push → quality-gate çalışır → geçerse Vercel'e deploy
- Quality-gate fail → deploy olmaz, canlı etkilenmez
- **Yani:** local CI pass etse de GitHub Actions fail edebilir — ikisi aynı ortam değil

### Yerel vs CI Farkı
| | Yerel | GitHub Actions |
|--|-------|----------------|
| OS | Windows/Linux | Ubuntu |
| pnpm | lokal versiyon | v10 |
| Node | lokal versiyon | v22 |

**Kural:** `pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build` — push'tan önce zorunlu.

---

## 26. SUB-AGENTS.MD DURUMU

`src/agents/`, `src/components/`, `src/lib/`, `src/hooks/`, `src/pages/` altında henüz AGENTS.md yok.

Bu klasörlerde çalışırken bu ana `AGENTS.md` geçerlidir.

Sub-AGENTS.md oluşturulacaksa — o klasörün spesifik kurallarını yaz, genel kuralları tekrar etme.
