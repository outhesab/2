# Mimari — Detaylı Açıklama

> Kısa versiyon: `AGENTS.md` §3.

## Veri Katmanı (Offline-First)

### Akış
```
┌─────────────┐
│  localStorage  │  ← Birincil depolama (sobaYonetim)
│  (anlık)       │
└──────┬───────┘
       │ her 5s
       ▼
┌─────────────┐
│  IndexedDB   │  ← Dexie ile yedek
│  (5s debounce)│
└──────┬───────┘
       │ her 1.2s (online ise)
       ▼
┌─────────────┐
│  Firebase    │  ← Opsiyonel cloud sync
│  (1.2s)      │     last-write-wins
└─────────────┘
```

### Save Pipeline (ASLA bypass etme)

```typescript
save(updater)  // updater: (prevDB) => nextDB
  → prevDB snapshot
  → updater(prevDB) → nextDB
  → RuleEngine.validate(nextDB, prevDB) → violations
  → AuditEngine.computeDiff(prevDB, nextDB) → activity log
  → localStorage.setItem('sobaYonetim', JSON.stringify(nextDB))
  → IndexedDB snapshot (5s debounce)
  → Firebase sync (1.2s debounce, online ise)
```

### Kurtarma Sırası (DB bozuksa)
1. localStorage → bozuksa
2. IndexedDB → boş/eskimişse
3. `dbDefaults` (fabrika ayarları) → minimal valid DB

### localStorage Limitleri
- **~5-10MB** toplam (tüm key'ler dahil)
- Büyük DB'de `QuotaExceededError` riski
- DB boyutu monitör edilmeli

## Agent Sistemi (7 agent)

### Akış Sırası (değiştirilemez)
```
satis → stok → kasa → cari → fatura → rapor
                ↓
            deep_seek (yan akış)
```

### Base Class
**`DomainAgent`** (C4 refactor sonrası) — 4 domain agent (Satis, Stok, Kasa, Cari) ortak `islemYap` pipeline'ını paylaşır.

### Event Bus
- `AgentBus` (korunan sistem) — agent'lar arası pub/sub
- `domainEventBus` (C2) — domain event'leri için mitt-based

### Listener'lar (C2)
- `agentBridge` — DomainEvent → AgentBus köprüsü
- `auditLogger` — Activity log'a kaydeder
- `notification` — Toast bildirimleri

## Multi-Domain Mimari (v3.23+)

```
Page Component
    ↓
intentEngine.processIntent(intent)  → DomainIntent
    ↓
domain service (pure function)       → DBUpdates
    ↓
save(updater)                        → veri katmanı
```

**Domain servisleri (pure function):**
- `saleCompletion.ts` — completeSale, cancelSale, returnSale
- `stockService.ts` — processStockUpdate
- `cashService.ts` — kasa işlemleri
- `cariService.ts` — cari hesap
- `receivableService.ts` — alacak takip

## UI/Component Yapısı

### shadcn/ui
- `src/components/ui/` — korunan (upstream)
- Wrapper'lar `src/components/` altında

### Sayfa Yapısı
- **Orchestrator + Modules pattern** (3.25.0+)
- Büyük sayfalar (`Suppliers/`, `Monitor/`, `Bank/`, `BugHunter/`) modüllere bölünmüş
- Her modül `index.tsx` (orkestratör) + alt modüller

## Rule Engine

**Konum:** `src/lib/ruleEngine.ts` (KORUNAN)

### Çalışma
- Severity: `block` (engelle) · `warn` (uyar) · `info` (bilgi)
- Timeout: 50ms — sonra **safe-pass** (kalan kurallar atlanır, normal)
- Test: `src/lib/ruleEngine.test.ts` (32 test)

### Mevcut Kurallar
- `min_total` (block) — minimum satış tutarı
- `min_stock` (warn) — stok minimum altı
- `cari_limit` (warn) — cari limit aşımı
- `payment_validation` (block) — ödeme tipi doğrulama
- Custom kurallar: `ruleEngine.ts`'e eklenebilir

## Audit Engine

**Konum:** `src/lib/auditEngine.ts` (KORUNAN)

- Her `save()` çağrısında diff hesaplanır
- `activity log`'a yazılır (`sobaLogs_v2` key)
- Compact storage (500 entry, archive 2000)
