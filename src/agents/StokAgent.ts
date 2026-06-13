import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import { processIntent } from "@/domain/intentEngine";
import { applyIntentResult } from "@/hooks/db/dbHelpers";
import type { Intent } from "@/domain/types";

export class StokAgent extends BaseAgent {
  readonly id = "stok" as const;
  readonly yetkiler = ["stok.read", "stok.write", "rapor.read"] as const;

  private mapRequestToIntent(talep: AgentRequest): Intent | null {
    const p = talep.payload || {};
    if (talep.action === "stok_guncelle") {
      if (!p.productId) return null;
      return {
        type: "stok_guncelle",
        payload: {
          productId: p.productId as string,
          amount: p.quantity as number, // Map quantity to amount
          type: (p.type as "giris" | "cikis") || "cikis",
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
    if (!this.ctx) return { ok: false, error: `${this.id} agent bağlanmadı — önce bagla() çağırın` };

    this.yayinla("stok.islem", { action: talep.action, payload: talep.payload });

    const intent = this.mapRequestToIntent(talep);
    if (!intent) {
      // Bilinmeyen aksiyon veya eksik parametre — no-op, başarılı dön
      return { ok: true, data: { agent: this.id, action: talep.action, status: "completed" } };
    }

    const db = this.db;
    const result = processIntent(intent, db);
    if (!result.ok) return { ok: false, error: result.error };

    this.ctx.save((prev) => applyIntentResult(prev, result.data!));

    return { 
      ok: true, 
      data: { agent: this.id, action: talep.action, status: "completed", intentResult: result } 
    };
  }
}
