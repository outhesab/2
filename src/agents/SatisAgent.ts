import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse, SatisSonuc, YeniSatisParams } from "@/agents/types";
import { formatMoney, genId } from "@/lib/utils-tr";
import { completeSale } from "@/domain/services/saleCompletion";
import type { Sale } from "@/types";

export class SatisAgent extends BaseAgent {
  readonly id = "satis" as const;
  readonly yetkiler = ["satis.read", "satis.write", "rapor.read"] as const;

  async yeniSatis(params: YeniSatisParams): Promise<AgentResponse<SatisSonuc>> {
    if (!this.yetkiKontrolu("satis.write")) {
      return { ok: false, error: "satis.write yetkisi yok" };
    }
    if (!this.ctx) {
      return { ok: false, error: "Agent bağlanmadı — önce bagla() çağırın" };
    }

    const db = this.db;
    const result = completeSale({
      items: params.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        cost: i.cost,
      })),
      payment: params.payment,
      cariId: params.cariId || undefined,
      customerName: undefined,
      discount: params.discount,
      discountAmount: params.discountAmount,
      tahsilat: params.tahsilat,
      saleDate: params.saleDate,
    }, db);

    if (!result.ok) return result;

    const { sale: cs, stockMovements, cashTransaction, cariUpdate, events } = result.data;

    this.save((prev) => {
      const products = prev.products.map((p) => {
        const sm = stockMovements.find((s) => s.productId === p.id);
        if (!sm) return p;
        return { ...p, stock: Math.max(0, sm.after) };
      });

      const sale: Sale = {
        ...cs,
        cariName: params.cariId
          ? prev.cari.find((c) => c.id === params.cariId)?.name
          : undefined,
        _domainEventLog: events,
      };

      const kasaEntries: typeof prev.kasa = [];
      if (cashTransaction) {
        kasaEntries.push({
          id: genId(),
          type: "gelir",
          category: "satis",
          amount: cashTransaction.amount,
          kasa: cashTransaction.kasa,
          description: cashTransaction.description,
          relatedId: sale.id,
          cariId: params.cariId || undefined,
          createdAt: cs.createdAt,
          updatedAt: cs.createdAt,
        });
      }

      let cari = prev.cari;
      if (cariUpdate) {
        cari = cari.map((c) =>
          c.id === cariUpdate.cariId
            ? {
                ...c,
                balance: (c.balance || 0) + cariUpdate.balanceChange,
                lastTransaction: cs.createdAt,
                updatedAt: cs.createdAt,
              }
            : c,
        );
      }

      const stockMovementRecords = stockMovements.map((sm) => ({
        id: genId(),
        productId: sm.productId,
        productName: sm.productName,
        type: "satis" as const,
        amount: sm.amount,
        before: sm.before,
        after: sm.after,
        note: "Satış",
        date: cs.createdAt,
      }));

      return {
        ...prev,
        products,
        sales: [...prev.sales, sale],
        kasa: [...prev.kasa, ...kasaEntries],
        cari,
        stockMovements: [...prev.stockMovements, ...stockMovementRecords],
      };
    });

    this.yayinla("satis.tamamlandi", { saleId: cs.id, total: cs.total, profit: cs.profit });
    return { ok: true, data: { saleId: cs.id, total: cs.total, profit: cs.profit } };
  }

  async iptalEt(saleId: string): Promise<AgentResponse<void>> {
    if (!this.yetkiKontrolu("satis.write")) {
      return { ok: false, error: "satis.write yetkisi yok" };
    }
    if (!this.ctx) {
      return { ok: false, error: "Agent bağlanmadı" };
    }

    const nowIso = new Date().toISOString();
    this.save((prev) => {
      const sale = prev.sales.find((s) => s.id === saleId);
      if (!sale) return prev;

      const products = prev.products.map((p) => {
        const item = sale.items?.find((i) => i.productId === p.id);
        if (!item) return p;
        return { ...p, stock: p.stock + item.quantity };
      });

      const sales = prev.sales.map((s) =>
        s.id === saleId
          ? { ...s, status: "iptal" as const, updatedAt: nowIso }
          : s,
      );

      let kasa = prev.kasa;
      let cari = prev.cari;

      const relatedKasaEntries = prev.kasa.filter(
        (k) => !k.deleted && k.relatedId === sale.id && k.type === "gelir",
      );
      const tahsilEdilen = relatedKasaEntries.reduce((s, k) => s + k.amount, 0);

      if (tahsilEdilen > 0) {
        const kasaId = sale.payment === "cari" ? "nakit" : sale.payment;
        kasa = [
          ...kasa,
          {
            id: genId(),
            type: "gider" as const,
            category: "iptal",
            amount: tahsilEdilen,
            kasa: kasaId,
            description: `İptal: ${sale.productName}`,
            relatedId: sale.id,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        ];
      }

      if (sale.cariId) {
        const cariyeYazilan = sale.total - tahsilEdilen;
        if (cariyeYazilan > 0) {
          cari = cari.map((c) =>
            c.id === sale.cariId
              ? {
                  ...c,
                  balance: (c.balance || 0) - cariyeYazilan,
                  lastTransaction: nowIso,
                  updatedAt: nowIso,
                }
              : c,
          );
        }
      }

      return { ...prev, sales, products, kasa, cari };
    });

    this.yayinla("satis.iptal", { saleId });
    return { ok: true };
  }

  async iadeYap(saleId: string, qty?: number): Promise<AgentResponse<void>> {
    if (!this.yetkiKontrolu("satis.write")) {
      return { ok: false, error: "satis.write yetkisi yok" };
    }
    if (!this.ctx) {
      return { ok: false, error: "Agent bağlanmadı" };
    }

    const nowIso = new Date().toISOString();
    this.save((prev) => {
      const sale = prev.sales.find((s) => s.id === saleId);
      if (!sale) return prev;

      const products = prev.products.map((p) => {
        const item = sale.items?.find((i) => i.productId === p.id);
        if (!item) return p;
        const iadeMiktar = qty !== undefined ? Math.min(qty, item.quantity) : item.quantity;
        return { ...p, stock: p.stock + iadeMiktar };
      });

      const sales = prev.sales.map((s) =>
        s.id === saleId
          ? {
              ...s,
              status: "iade" as const,
              returnedAt: nowIso,
              updatedAt: nowIso,
            }
          : s,
      );

      let kasa = prev.kasa;
      let cari = prev.cari;

      const relatedKasaEntries = prev.kasa.filter(
        (k) => !k.deleted && k.relatedId === sale.id && k.type === "gelir",
      );
      const tahsilEdilen = relatedKasaEntries.reduce((s, k) => s + k.amount, 0);

      if (tahsilEdilen > 0) {
        const kasaId = sale.payment === "cari" ? "nakit" : sale.payment;
        kasa = [
          ...kasa,
          {
            id: genId(),
            type: "gider" as const,
            category: "iade",
            amount: tahsilEdilen,
            kasa: kasaId,
            description: `İade: ${sale.productName}`,
            relatedId: sale.id,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        ];
      }

      if (sale.cariId) {
        const cariyeYazilan = sale.total - tahsilEdilen;
        if (cariyeYazilan > 0) {
          cari = cari.map((c) =>
            c.id === sale.cariId
              ? {
                  ...c,
                  balance: (c.balance || 0) - cariyeYazilan,
                  lastTransaction: nowIso,
                  updatedAt: nowIso,
                }
              : c,
          );
        }
      }

      return { ...prev, sales, products, kasa, cari };
    });

    this.yayinla("satis.iade", { saleId, qty });
    return { ok: true };
  }

  async fiyatDuzelt(saleId: string, yeniFiyat: number): Promise<AgentResponse<void>> {
    if (!this.yetkiKontrolu("satis.write")) {
      return { ok: false, error: "satis.write yetkisi yok" };
    }
    if (!this.ctx) {
      return { ok: false, error: "Agent bağlanmadı" };
    }

    const nowIso = new Date().toISOString();
    this.save((prev) => {
      const sale = prev.sales.find((s) => s.id === saleId);
      if (!sale) return prev;

      const eskiFiyat = sale.unitPrice;
      const fark = yeniFiyat - eskiFiyat;

      const sales = prev.sales.map((s) =>
        s.id === saleId
          ? {
              ...s,
              unitPrice: yeniFiyat,
              total: yeniFiyat * s.quantity - (s.discountAmount ?? 0),
              profit: (yeniFiyat - s.cost) * s.quantity - (s.discountAmount ?? 0),
              updatedAt: nowIso,
            }
          : s,
      );

      const activityLog = {
        id: genId(),
        action: "fiyat_duzeltme",
        detail: `${sale.productName}: ${formatMoney(eskiFiyat)} → ${formatMoney(yeniFiyat)} (fark: ${formatMoney(fark)})`,
        time: nowIso,
        relatedId: saleId,
      };

      return {
        ...prev,
        sales,
        _activityLog: [...(prev._activityLog || []), activityLog],
      };
    });

    this.yayinla("satis.fiyat-duzelt", { saleId, yeniFiyat });
    return { ok: true };
  }

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla("satis.islem", { action: talep.action, payload: talep.payload });

    if (talep.action === "sale" && talep.payload) {
      const p = talep.payload as Record<string, unknown>;
      const params: YeniSatisParams = {
        items: p.items as YeniSatisParams["items"] || [],
        cariId: (p.cariId as string) || "",
        payment: (p.payment as YeniSatisParams["payment"]) || "nakit",
        discount: p.discount as number || 0,
        discountAmount: p.discountAmount as number || 0,
        tahsilat: p.tahsilat as number || 0,
        saleDate: p.saleDate as string || undefined,
      };
      return this.yeniSatis(params);
    }

    return {
      ok: true,
      data: { agent: this.id, action: talep.action, status: "completed" },
    };
  }
}
