import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import { processIntent } from "@/domain/intentEngine";
import { applyIntentResult } from "@/hooks/db/dbHelpers";
import type { Intent } from "@/domain/types";

export class SatisAgent extends BaseAgent {
  readonly id = "satis" as const;
  readonly yetkiler = ["satis.read", "satis.write", "kasa.read", "stok.read", "cari.read", "rapor.read"] as const;

  private mapRequestToIntent(talep: AgentRequest): Intent | null {
    const p = talep.payload || {};
    switch (talep.action) {
      case "yeniSatis":
      case "satis":
        return {
          type: "sale",
          payload: {
            items: (p.items || []) as Array<{ productId: string; productName: string; quantity: number; unitPrice: number; cost: number }>,
            payment: (p.payment || "nakit") as "nakit" | "kart" | "havale" | "cari",
            cariId: p.cariId as string | undefined,
            cariName: p.cariName as string | undefined,
            customerName: p.customerName as string | undefined,
            discount: p.discount as number | undefined,
            discountAmount: p.discountAmount as number | undefined,
            tahsilat: p.tahsilat as number | undefined,
            saleDate: p.saleDate as string | undefined,
          },
        };
      case "iptalEt":
      case "sale_iptal":
        return { type: "sale_iptal", payload: { saleId: p.saleId as string } };
      case "iadeYap":
      case "sale_iade":
        return { type: "sale_iade", payload: { saleId: p.saleId as string, qty: p.quantity as number | Record<string, number> | undefined } };
      case "fiyatDuzelt":
      case "sale_fiyat_duzelt":
        return { type: "sale_fiyat_duzelt", payload: { saleId: p.saleId as string, yeniFiyat: (p.yeniFiyat ?? p.unitPrice) as number | Record<string, number> } };
      default:
        return null;
    }
  }

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    if (!this.ctx) return { ok: false, error: `${this.id} agent bağlanmadı — önce bagla() çağırın` };

    this.yayinla("satis.islem", { action: talep.action, payload: talep.payload });

    const intent = this.mapRequestToIntent(talep);
    if (!intent) {
      return { ok: false, error: `Desteklenmeyen satış aksiyonu: ${talep.action}` };
    }
    if (!this.yetkiKontrolu('satis.write')) {
      return { ok: false, error: `${this.id} agent'ının bu işlem için yetkisi yok` };
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
