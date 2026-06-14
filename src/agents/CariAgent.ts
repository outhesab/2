import { DomainAgent } from "@/agents/DomainAgent";
import type { AgentRequest } from "@/agents/types";
import type { Intent } from "@/domain/types";

export class CariAgent extends DomainAgent {
  readonly id = "cari" as const;
  readonly yetkiler = ["cari.read", "cari.write", "rapor.read"] as const;

  protected mapRequestToIntent(talep: AgentRequest): Intent | null {
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
}
