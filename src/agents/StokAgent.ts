import { DomainAgent } from "@/agents/DomainAgent";
import type { AgentRequest } from "@/agents/types";
import type { Intent } from "@/domain/types";

export class StokAgent extends DomainAgent {
  readonly id = "stok" as const;
  readonly yetkiler = ["stok.read", "stok.write", "rapor.read"] as const;

  protected mapRequestToIntent(talep: AgentRequest): Intent | null {
    const p = talep.payload || {};
    if (talep.action === "stok_guncelle") {
      if (!p.productId) return null;
      return {
        type: "stok_guncelle",
        payload: {
          productId: p.productId as string,
          amount: p.quantity as number,
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
}
