import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";

export class CariAgent extends BaseAgent {
  readonly id = "cari" as const;
  readonly yetkiler = ["cari.read", "cari.write", "rapor.read"] as const;

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("cari.islem", { action: talep.action, payload: talep.payload });
    if (!this.ctx) return { ok: false, error: "Agent bağlanmadı" };

    try {
      const payload = talep.payload || {};
      if (talep.action === "cari_tahsilat") {
        const cariId = payload.cariId as string;
        const amount = payload.amount as number;
        if (cariId && amount) {
          this.save((prev) => ({
            ...prev,
            cari: prev.cari.map((c) =>
              c.id === cariId
                ? {
                    ...c,
                    balance: (c.balance || 0) - amount,
                    lastTransaction: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                : c,
            ),
          }));
        }
      }
      if (talep.action === "cari_ekle") {
        return { ok: true, data: { agent: this.id, action: talep.action, status: "completed", message: "Cari ekleme UI üzerinden yapılmalı" } };
      }
      return { ok: true, data: { agent: this.id, action: talep.action, status: "completed" } };
    } catch (error) {
      return { ok: false, error: `Cari hatası: ${error}` };
    }
  }
}
