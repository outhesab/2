# PARSPEL — Multi-Agent Sistemi

7 ajan, mitt tabanlı AgentBus, BaseAgent pattern'i.

## Yapı

```
src/agents/
├── BaseAgent.ts      # Soyut sınıf: yetkiKontrolu(), yayinla(), onEvent()
├── AgentBus.ts       # mitt event emitter, ajanlar arası iletişim
├── orchestrator.ts   # planAgentFlow() — aksiyon→ajan zinciri
├── types.ts          # AgentId, AgentPermission, AgentRequest/Response
├── index.ts          # Toplu export
├── SatisAgent.ts     # Satış işlemleri
├── KasaAgent.ts      # Kasa hareketleri
├── CariAgent.ts      # Cari hesap yönetimi
├── StokAgent.ts      # Stok güncelleme
├── FaturaAgent.ts    # Fatura oluşturma
├── RaporAgent.ts     # Raporlama
├── DeepSeekAgent.ts  # AI destekli analiz
└── baseAgent.test.ts # BaseAgent testi
```

## AgentId'ler

`stok | kasa | cari | satis | fatura | rapor | deep_seek`

Her ajan `BaseAgent`'dan türer, `islemYap(talep): Promise<AgentResponse>` implemente eder.

## İletişim

- `agentBus.emit(from, type, payload)` — olay yayınlama
- `agent.onEvent(handler)` — olay dinleme
- `Orchestrator.planAgentFlow(action)` — aksiyon tipine göre ajan zinciri belirler
  - Örn: satış → satis→stok→kasa→cari→fatura→rapor

## İzinler

`AgentPermission` string union: `{agent}.{read|write}` (örn: `stok.write`).
Her ajan `yetkiler` dizisiyle hangi izinlere sahip olduğunu belirtir.

## Durum

UI state → `src/stores/agentStore.ts` (Zustand): activeAgent, busy, lastEvent.
