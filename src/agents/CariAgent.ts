import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import { processIntent } from "@/domain/intentEngine";
import type { Intent } from "@/domain/types";

export class CariAgent extends BaseAgent {
  readonly id = "cari" as const;
  readonly yetkiler = ["cari.read", "cari.write", "rapor.read"] as const;

  private mapRequestToIntent(talep: AgentRequest): Intent | null {
    const p = talep.payload || {};
    if (talep.action === "cari_tahsilat") {
      return {
        type: "cari_tahsilat",
        payload: {
          cariId: p.cariId as string,
          amount: p.amount as number,
          kasa: p.kasa as string,
        }
      };
    }
    if (talep.action === "cari_ekle") {
      return {
        type: "cari_ekle",
        payload: {
          name: p.name as string,
          taxNumber: p.taxNumber as string,
          email: p.email as string,
          phone: p.phone as string,
          address: p.address as string,
        }
      };
    }
    return null;
  }

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("cari.islem", { action: talep.action, payload: talep.payload });

    const intent = this.mapRequestToIntent(talep);
    if (!intent) {
      return { ok: false, error: `Desteklenmeyen cari aksiyonu: ${talep.action}` };
    }

    const result = processIntent(intent, this.db);
    if (!result.ok) return { ok: false, error: result.error };

    return { 
      ok: true, 
      data: { agent: this.id, action: talep.action, status: "completed", intentResult: result } 
    };
  }
}
