import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import { processIntent } from "@/domain/intentEngine";
import type { Intent } from "@/domain/types";

export class StokAgent extends BaseAgent {
  readonly id = "stok" as const;
  readonly yetkiler = ["stok.read", "stok.write", "rapor.read"] as const;

  private mapRequestToIntent(talep: AgentRequest): Intent | null {
    const p = talep.payload || {};
    if (talep.action === "stok_guncelle") {
      return {
        type: "stok_guncelle",
        payload: {
          productId: p.productId as string,
          amount: p.quantity as number, // Map quantity to amount
          type: p.type as "giris" | "cikis",
          description: p.label as string,
        }
      };
    }
    if (talep.action === "urun_ekle") {
      return {
        type: "urun_ekle",
        payload: {
          productName: p.productName as string,
          category: p.category as string,
          initialStock: p.initialStock as number,
          unitPrice: p.unitPrice as number,
        }
      };
    }
    return null;
  }

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("stok.islem", { action: talep.action, payload: talep.payload });

    const intent = this.mapRequestToIntent(talep);
    if (!intent) {
      return { ok: false, error: `Desteklenmeyen stok aksiyonu: ${talep.action}` };
    }

    const result = processIntent(intent, this.db);
    if (!result.ok) return { ok: false, error: result.error };

    return { 
      ok: true, 
      data: { agent: this.id, action: talep.action, status: "completed", intentResult: result } 
    };
  }
}
