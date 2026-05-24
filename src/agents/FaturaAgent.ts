import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";

export class FaturaAgent extends BaseAgent {
  readonly id = "fatura" as const;
  readonly yetkiler = ["fatura.read", "fatura.write", "rapor.read"] as const;

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("fatura.islem", { action: talep.action, payload: talep.payload });
    if (!this.ctx) return { ok: false, error: "Agent bağlanmadı" };

    try {
      const payload = talep.payload || {};
      if (talep.action === "sale") {
        this.save((prev) => ({
          ...prev,
          invoices: [
            ...(prev.invoices || []),
            {
              id: crypto.randomUUID(),
              invoiceNo: `INV-${Date.now()}`,
              type: "satis" as const,
              status: "bekliyor" as const,
              cariId: payload.cariId as string || "",
              cariName: payload.customerName as string || "",
              customerName: payload.customerName as string || "",
              items: (payload.items as Array<{ productId: string; productName: string; quantity: number; unitPrice: number; total: number }> || []).map((i) => ({ ...i, description: i.productName || "", vatRate: 0 })),
              subtotal: payload.subtotal as number || (payload.amount as number) || 0,
              vatTotal: 0,
              discount: 0,
              total: payload.total as number || (payload.amount as number) || 0,
              payment: "nakit" as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
      }
      return { ok: true, data: { agent: this.id, action: talep.action, status: "completed" } };
    } catch (error) {
      return { ok: false, error: `Fatura hatası: ${error}` };
    }
  }
}
