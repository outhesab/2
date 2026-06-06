---
name: parspel-agent-ekle
description: >
  PARSPEL multi-agent sistemine yeni bir ajan ekler. BaseAgent soyut sınıfından
  türetme, AgentId/AgentPermission/types.ts tanımları, AgentBus event flow,
  orchestrator kaydı ve index.ts export işlemlerini yönlendirir.
  Kullanici yeni bir islev (ör: "tedarikci agenti") istediginde kullan.
version: 1.1.0
author: PARSPEL
hooks:
  onComplete: true
  onError: true
requires:
  - parspel-test
  - parspel-veri-katmani
---

# PARSPEL — Agent Ekleme

## Overview

Yeni bir agent eklemek için 6 adımlık prosedür. Her adımda hangi dosyada ne yapılacağı net olarak belirtilmiştir.

## Instructions

### 1. AgentId ve İzinleri Tanımla

`src/agents/types.ts` dosyasında:

- `AgentId` union tipine yeni ID'yi ekle (`"stok" | "kasa" | ... | "yeni"`)
- `AgentPermission` union tipine `{id}.read` ve `{id}.write` ekle

```typescript
// Örnek: AgentId
export type AgentId = "stok" | "kasa" | "cari" | "satis" | "fatura" | "rapor" | "deepseek" | "yeni";

// Örnek: AgentPermission
export type AgentPermission = "stok.read" | "stok.write" | ... | "yeni.read" | "yeni.write";
```

### 2. Agent Sınıfını Oluştur

`src/agents/YeniAgent.ts`:

```typescript
import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";

export class YeniAgent extends BaseAgent {
  readonly id = "yeni" as const;
  readonly yetkiler = ["yeni.read", "yeni.write"] as const;

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    // Yetki kontrolü
    this.yetkiKontrolu("yeni.write");

    // İşlem mantığı
    // this.db, this.save, this.yayinla() kullanılabilir

    return { ok: true, data: { agent: this.id, action: talep.action } };
  }
}
```

#### Hata Yönetimi Template'i

```typescript
async islemYap(talep: AgentRequest): Promise<AgentResponse> {
  try {
    this.yetkiKontrolu("yeni.write");

    // İşlem mantığı...

    return { ok: true, data: { agent: this.id, action: talep.action } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    };
  }
}
```

### 3. Export ve Registry

`src/agents/index.ts`:

1. Import ekle: `import { YeniAgent } from "@/agents/YeniAgent";`
2. Export ekle: `export { YeniAgent } from "@/agents/YeniAgent";`
3. `getAgent()` overload'ını ekle
4. `switch` case'i ekle
5. `getAllAgents()` dizisine ID'yi ekle

```typescript
// getAllAgents() örneği
export function getAllAgents(): BaseAgent[] {
  return [
    new SatisAgent(),
    new KasaAgent(),
    new CariAgent(),
    new StokAgent(),
    new FaturaAgent(),
    new RaporAgent(),
    new DeepseekAgent(),
    new YeniAgent(), // <-- yeni
  ];
}
```

### 4. Orchestrator'a Ekle

`src/agents/orchestrator.ts`:

- `OrchestratorAction` tipine yeni action type ekle
- `planAgentFlow()` fonksiyonuna yeni case ekle
- Agent akış zincirini belirle (hangi agent hangi agent'ı tetikler)

```typescript
// planAgentFlow() örnek case
case "yeni_flow":
  return ["yeni", "kasa"]; // önce yeni agent, sonra kasa
```

### 5. Test Yaz

`src/agents/YeniAgent.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { YeniAgent } from "./YeniAgent";
import type { AgentContext } from "@/agents/types";

function makeContext(initialDB: any) {
  let currentDB = structuredClone(initialDB);
  return {
    ctx: {
      getDB: () => currentDB,
      save: (updater: (db: any) => any) => { currentDB = updater(currentDB); },
    } as AgentContext,
    getDB: () => currentDB,
  };
}

describe("YeniAgent", () => {
  it("bağlamsız çağrı hata döndürür", async () => {
    const agent = new YeniAgent();
    const sonuc = await agent.islemYap({ action: "test" });
    expect(sonuc.ok).toBe(false);
  });

  it("yetkisiz işlem hata döndürür", async () => {
    // yetki mock'u ile test et
  });

  it("başarılı işlem", async () => {
    const agent = new YeniAgent();
    const { ctx } = makeContext({});
    agent.bagla(ctx);
    const sonuc = await agent.islemYap({ action: "test" });
    expect(sonuc.ok).toBe(true);
  });
});
```

### 6. Dokümantasyonu Güncelle

- `src/agents/AGENTS.md` dosyasına yeni ajanı ekle
- Varsa `CHANGELOG.md`'ye not düş

## Rules

| Kural | Açıklama |
|-------|----------|
| BaseAgent | Tüm agent'lar `BaseAgent`'dan türemeli |
| AgentId | `types.ts`'deki union tipine eklenmeli |
| Yetki | Her agent en az 1 izin tanımlamalı |
| Export | `index.ts`'de import + export + switch + getAllAgents |
| Test | P0: bağlamsız, yetkisiz, başarılı, hata senaryoları |
| Orchestrator | Sadece zincir akışı gerekiyorsa ekle |
| Rollback | Kritik işlemlerde `prevDB`'yi koru |

## Hooks

### onComplete
- Testlerin geçtiğini doğrula (`pnpm run test:run`)
- TypeScript hatası olmadığını kontrol et (`pnpm run typecheck`)

### onError
- Hangi adımda hata oluştuğunu belirt
- Önceki adımları geri almak için talimat ver
- `git checkout -- <dosya>` ile son değişiklikleri sıfırla
