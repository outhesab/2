import { DomainAgent } from "@/agents/DomainAgent";
import type { AgentRequest } from "@/agents/types";
import type { Intent } from "@/domain/types";

export class KasaAgent extends DomainAgent {
  readonly id = "kasa" as const;
  readonly yetkiler = ["kasa.read", "kasa.write", "rapor.read"] as const;

  protected mapRequestToIntent(talep: AgentRequest): Intent | null {
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
}
