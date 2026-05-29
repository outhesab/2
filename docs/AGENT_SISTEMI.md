# PARSPEL — Agent Sistemi

> Versiyon: 3.7.0 | Tarih: 29 Mayıs 2026

## 1. Mimarî

```
src/agents/
├── BaseAgent.ts      # Soyut sınıf — bagla(), yetkiKontrolu(), yayinla()
├── AgentBus.ts       # mitt event emitter singleton
├── index.ts          # Agent registry (lazy singleton factory)
├── orchestrator.ts   # planAgentFlow(), dispatchAgentFlow()
├── types.ts          # AgentId, AgentPermission, AgentRequest/Response
├── SatisAgent.ts     # Satış işlemleri (372 satır)
├── StokAgent.ts      # Stok güncelleme
├── KasaAgent.ts      # Kasa hareketleri
├── CariAgent.ts      # Cari hesap yönetimi
├── FaturaAgent.ts    # Fatura oluşturma
├── RaporAgent.ts     # Raporlama / aktivite kaydı
├── DeepSeekAgent.ts  # AI destekli analiz (146 satır)
├── baseAgent.test.ts # BaseAgent testi
└── AGENTS.md         # Dokümantasyon

stores/
└── agentStore.ts     # Zustand: activeAgent, busy, lastEvent
```

## 2. AgentId'ler ve İzinler

```
AgentId: "stok" | "kasa" | "cari" | "satis" | "fatura" | "rapor" | "deep_seek"

AgentPermission: "{agentId}.{read|write}"
  Örn: stok.read, stok.write, kasa.read, kasa.write
```

## 3. Agent Orchestration — Flow Şeması

```
┌─────────────────────────────────────────────────────────────────────┐
│  SATIŞ AKIŞI                                                        │
│                                                                     │
│  satis → stok → kasa (nakit/kart ise) → cari (vadeli ise)         │
│       → fatura (opsiyonel) → rapor                                  │
│                                                                     │
│  Adım 1: SatisAgent.yeniSatis()                                     │
│    - Sale kaydı oluşturur                                           │
│    - AgentBus.emit('satis', 'sale_created', {sale})                 │
│                                                                     │
│  Adım 2: StokAgent (dinler: sale_created)                           │
│    - Her SaleItem için stok düşer                                   │
│    - StockMovement kaydedilir                                       │
│    - AgentBus.emit('stok', 'stock_updated', {productId, qty})       │
│                                                                     │
│  Adım 3a: KasaAgent (nakit/kart ise)                                │
│    - KasaEntry ekler (gelir)                                        │
│    - AgentBus.emit('kasa', 'entry_created', {entry})                │
│                                                                     │
│  Adım 3b: CariAgent (vadeli ise)                                    │
│    - Cari.balance += total                                         │
│    - AgentBus.emit('cari', 'balance_updated', {cariId, amount})     │
│                                                                     │
│  Adım 4: FaturaAgent (opsiyonel)                                    │
│    - Invoice oluşturur (taslak)                                     │
│                                                                     │
│  Adım 5: RaporAgent                                                 │
│    - Aktivite kaydı, istatistik güncelleme                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  KASA GELİR/GİDER AKIŞI                                            │
│  kasa → rapor                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STOK GÜNCELLEME / ÜRÜN EKLEME AKIŞI                               │
│  stok → rapor                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CARİ TAHSİLAT / CARİ EKLEME AKIŞI                                  │
│  cari → rapor                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 4. Agent Sorumlulukları

| Agent | Görevi | Önemli Metotlar |
|-------|--------|-----------------|
| **SatisAgent** | Satış yaşam döngüsü | `yeniSatis()`, `iptalEt()`, `iadeYap()`, `fiyatDuzelt()` |
| **StokAgent** | Stok güncelleme, hareket kaydı | `stokGuncelle(productId, miktar, tip)` |
| **KasaAgent** | Kasa giriş/çıkış, bakiye | `kasaGelirGider(params)`, `bakiyeSorgula(kasaId)` |
| **CariAgent** | Cari bakiye güncelleme | `cariGuncelle(cariId, tutar)`, `cariEkle(params)` |
| **FaturaAgent** | Fatura oluşturma | `faturaOlustur(sale)` |
| **RaporAgent** | Aktivite kaydı, istatistik | `raporKaydet(action, detail)` |
| **DeepSeekAgent** | AI analiz, öneri | `analizYap(soru, db)`, `oneriGetir(db)` |

## 5. İletişim Modeli

```
AgentBus (mitt singleton):
  - agentBus.emit(from: AgentId, type: string, payload?: object)
  - agentBus.on(type: string, handler: (event: AgentEvent) => void)
  - AgentEvent: { from, type, payload?, createdAt }

BaseAgent:
  - bagla(ctx: AgentContext) → { getDB, save } atar
  - yayinla(type, payload) → AgentBus.emit()
  - onEvent(handler) → AgentBus.on()

Orchestrator:
  - planAgentFlow(actionType) → AgentId[] (sıralı ajan listesi)
  - dispatchAgentFlow(actionType, payload) → void (sırayla dispatch)
```
