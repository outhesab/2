import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import { genId } from "@/lib/utils-tr";

export class StokAgent extends BaseAgent {
  readonly id = "stok" as const;
  readonly yetkiler = ["stok.read", "stok.write", "rapor.read"] as const;

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("stok.islem", { action: talep.action, payload: talep.payload });
    if (!this.ctx) return { ok: false, error: "Agent bağlanmadı" };

    try {
      const payload = talep.payload || {};
      if (talep.action === "stok_guncelle" || talep.action === "urun_ekle") {
        const productId = payload.productId as string;
        const delta = -(Math.abs(payload.quantity as number) || 0);
        if (productId && delta) {
          this.save((prev) => ({
            ...prev,
            products: prev.products.map((p) =>
              p.id === productId
                ? { ...p, stock: Math.max(0, (p.stock || 0) + delta) }
                : p,
            ),
            stockMovements: [
              ...(prev.stockMovements || []),
              {
                id: genId(),
                productId,
                productName: (payload.productName as string) || "",
                type: "cikis" as const,
                amount: delta,
                before: (this.db.products.find((p) => p.id === productId)?.stock || 0),
                after: Math.max(0, ((this.db.products.find((p) => p.id === productId)?.stock || 0) + delta)),
                note: payload.label ? `Agent: ${payload.label}` : "Agent işlemi",
                date: new Date().toISOString(),
              },
            ],
          }));
        }
      }
      return { ok: true, data: { agent: this.id, action: talep.action, status: "completed" } };
    } catch (error) {
      return { ok: false, error: `Stok hatası: ${error}` };
    }
  }
}
