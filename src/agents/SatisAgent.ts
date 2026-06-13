import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import { processIntent } from "@/domain/intentEngine";
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
            items: p.items || [],
            payment: p.payment || "nakit",
            cariId: p.cariId,
            cariName: p.cariName,
            customerName: p.customerName,
            discount: p.discount,
            discountAmount: p.discountAmount,
            tahsilat: p.tahsilat,
            saleDate: p.saleDate,
          },
        };
      case "iptalEt":
      case "sale_iptal":
        return { type: "sale_iptal", payload: { saleId: p.saleId as string } };
      case "iadeYap":
      case "sale_iade":
        return { type: "sale_iade", payload: { saleId: p.saleId as string, qty: p.quantity } };
      case "fiyatDuzelt":
      case "sale_fiyat_duzelt":
        return { type: "sale_fiyat_duzelt", payload: { saleId: p.saleId as string, yeniFiyat: p.yeniFiyat as number } };
      default:
        return null;
    }
  }

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("satis.islem", { action: talep.action, payload: talep.payload });

    const intent = this.mapRequestToIntent(talep);
    if (!intent) {
      return { ok: false, error: `Desteklenmeyen satış aksiyonu: ${talep.action}` };
    }

    const result = processIntent(intent, this.db);
    if (!result.ok) return { ok: false, error: result.error };

    return { 
      ok: true, 
      data: { agent: this.id, action: talep.action, status: "completed", intentResult: result } 
    };
  }
}
