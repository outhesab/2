import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import { genId } from "@/lib/utils-tr";

export class KasaAgent extends BaseAgent {
  readonly id = "kasa" as const;
  readonly yetkiler = ["kasa.read", "kasa.write", "rapor.read"] as const;

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("kasa.islem", { action: talep.action, payload: talep.payload });
    if (!this.ctx) return { ok: false, error: "Agent bağlanmadı" };

    try {
      const payload = talep.payload || {};
      if (talep.action === "kasa_gelir" || talep.action === "kasa_gider") {
        const amount = payload.amount as number;
        const type = talep.action === "kasa_gelir" ? "gelir" : "gider";

        if (amount && amount > 0) {
          this.save((prev) => ({
            ...prev,
            kasa: [
              ...prev.kasa,
              {
                id: genId(),
                type: type as "gelir" | "gider",
                category: (payload.category as string) || "diger",
                amount,
                kasa: (payload.kasa as string) || "nakit",
                description: (payload.description as string) || `Agent: ${talep.action}`,
                relatedId: payload.relatedId as string,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }));
        }
      }
      return { ok: true, data: { agent: this.id, action: talep.action, status: "completed" } };
    } catch (error) {
      return { ok: false, error: `Kasa hatası: ${error}` };
    }
  }
}
