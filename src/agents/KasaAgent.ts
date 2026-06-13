import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import { processIntent } from "@/domain/intentEngine";
import type { Intent } from "@/domain/types";

export class KasaAgent extends BaseAgent {
  readonly id = "kasa" as const;
  readonly yetkiler = ["kasa.read", "kasa.write", "rapor.read"] as const;

  private mapRequestToIntent(talep: AgentRequest): Intent | null {
    const p = talep.payload || {};
    if (talep.action === "kasa_gelir" || talep.action === "kasa_gider") {
      return {
        type: talep.action as "kasa_gelir" | "kasa_gider",
        payload: {
          amount: p.amount as number,
          kasa: p.kasa as string,
          description: p.description as string,
          category: p.category as string,
        }
      };
    }
    return null;
  }

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("kasa.islem", { action: talep.action, payload: talep.payload });

    const intent = this.mapRequestToIntent(talep);
    if (!intent) {
      return { ok: false, error: `Desteklenmeyen kasa aksiyonu: ${talep.action}` };
    }

    const result = processIntent(intent, this.db);
    if (!result.ok) return { ok: false, error: result.error };

    return { 
      ok: true, 
      data: { agent: this.id, action: talep.action, status: "completed", intentResult: result } 
    };
  }
}
