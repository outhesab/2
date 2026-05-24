import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";

export class RaporAgent extends BaseAgent {
  readonly id = "rapor" as const;
  readonly yetkiler = [
    "stok.read",
    "kasa.read",
    "cari.read",
    "satis.read",
    "fatura.read",
    "rapor.read",
  ] as const;

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("rapor.islem", { action: talep.action, payload: talep.payload });
    if (!this.ctx) return { ok: false, error: "Agent bağlanmadı" };

    try {
      const db = this.db;
      const payload = talep.payload || {};
      const action = talep.action;

      // Rapor agent'ı işlem sonrası özet bilgi toplar ve loglar
      const reportData: Record<string, unknown> = {
        action,
        timestamp: new Date().toISOString(),
        label: payload.label || action,
      };

      if (action === "sale") {
        const totalSales = db.sales.length;
        const todaySales = db.sales.filter(
          (s) => new Date(s.createdAt).toDateString() === new Date().toDateString(),
        );
        reportData.totalSales = totalSales;
        reportData.todaySalesCount = todaySales.length;
        reportData.todaySalesTotal = todaySales.reduce((s, x) => s + (x.total || 0), 0);
      }

      if (action === "kasa_gelir" || action === "kasa_gider") {
        const balance = db.kasa.reduce(
          (s, k) => s + (k.type === "gelir" ? k.amount : -k.amount),
          0,
        );
        reportData.kasaBalance = balance;
      }

      if (action === "stok_guncelle") {
        const zeroStock = db.products.filter((p) => !p.deleted && p.stock === 0).length;
        reportData.zeroStockProducts = zeroStock;
      }

      // Rapor verisini activity log'a kaydet
      this.save((prev) => ({
        ...prev,
        _activityLog: [
          ...(prev._activityLog || []).slice(-100),
          {
            id: crypto.randomUUID(),
            type: "agent_rapor",
            action,
            data: reportData,
            createdAt: new Date().toISOString(),
          },
        ],
      }));

      return {
        ok: true,
        data: {
          agent: this.id,
          action,
          status: "completed",
          report: reportData,
        },
      };
    } catch (error) {
      return { ok: false, error: `Rapor hatası: ${error}` };
    }
  }
}
