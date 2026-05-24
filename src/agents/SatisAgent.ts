import { BaseAgent } from "@/agents/BaseAgent";
import type { AgentRequest, AgentResponse, SatisSonuc, YeniSatisParams } from "@/agents/types";
import { formatMoney, genId } from "@/lib/utils-tr";
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
    if (params.items.length === 0) {
      return { ok: false, error: "En az bir ürün ekleyin" };
    }

    const db = this.db;
    const nowIso = params.saleDate
      ? new Date(params.saleDate).toISOString()
      : new Date().toISOString();
    const discountAmount = params.discountAmount ?? 0;
    const total = params.items.reduce((s, i) => s + i.total, 0) - discountAmount;
    const profit = params.items.reduce((s, i) => s + i.quantity * (i.unitPrice - i.cost), 0) - discountAmount;
    const tahsilatNum = params.tahsilat ?? total;
    const kalan = total - tahsilatNum;

    const yetersizStok = params.items.filter((i) => {
      const p = db.products.find((x) => x.id === i.productId);
      return p && p.stock < i.quantity;
    });
    if (yetersizStok.length > 0) {
      const mesaj = yetersizStok
        .map((i) => {
          const p = db.products.find((x) => x.id === i.productId);
          return `${i.productName}: stok ${p?.stock ?? 0}, talep ${i.quantity}`;
        })
        .join("\n");
      return { ok: false, error: `Yetersiz stok:\n${mesaj}` };
    }

    const sale: Sale = {
      id: genId(),
      cariId: params.cariId || undefined,
      cariName: params.cariId
        ? db.cari.find((c) => c.id === params.cariId)?.name
        : undefined,
      productId: params.items[0]?.productId,
      productName:
        params.items.length === 1
          ? params.items[0].productName
          : `${params.items[0].productName} +${params.items.length - 1}`,
      productCategory: params.items[0]
        ? db.products.find((p) => p.id === params.items[0].productId)?.category
        : undefined,
      quantity: params.items.reduce((s, i) => s + i.quantity, 0),
      unitPrice:
        total / Math.max(1, params.items.reduce((s, i) => s + i.quantity, 0)),
      cost: params.items.reduce((s, i) => s + i.cost * i.quantity, 0),
      discount: params.discount ?? 0,
      discountAmount,
      subtotal: params.items.reduce((s, i) => s + i.total, 0),
      total,
      profit,
      payment: params.payment,
      status: "tamamlandi",
      items: params.items,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.save((prev) => {
      const products = prev.products.map((p) => {
        const item = params.items.find((i) => i.productId === p.id);
        if (!item) return p;
        return { ...p, stock: Math.max(0, p.stock - item.quantity) };
      });

      const kasaEntries: typeof prev.kasa = [];
      const fiiliTahsilat =
        params.tahsilat === undefined && params.payment === "cari" ? 0 : tahsilatNum;
      if (fiiliTahsilat > 0) {
        const kasaId = params.payment === "cari" ? "nakit" : params.payment;
        kasaEntries.push({
          id: genId(),
          type: "gelir" as const,
          category: "satis",
          amount: fiiliTahsilat,
          kasa: kasaId,
          description: `Satış: ${sale.productName}`,
          relatedId: sale.id,
          cariId: params.cariId || undefined,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      let cari = prev.cari;
      if (params.cariId && kalan > 0) {
        cari = cari.map((c) =>
          c.id === params.cariId
            ? {
                ...c,
                balance: (c.balance || 0) + kalan,
                lastTransaction: nowIso,
                updatedAt: nowIso,
              }
            : c,
        );
      }

      const stockMovements = [
        ...prev.stockMovements,
        ...params.items.map((i) => {
          const currentStock =
            prev.products.find((p) => p.id === i.productId)?.stock || 0;
          const actualDecrease = Math.min(i.quantity, currentStock);
          return {
            id: genId(),
            productId: i.productId,
            productName: i.productName,
            type: "satis" as const,
            amount: -actualDecrease,
            before: currentStock,
            after: currentStock - actualDecrease,
            note: "Satış",
            date: nowIso,
          };
        }),
      ];

      return {
        ...prev,
        products,
        sales: [...prev.sales, sale],
        kasa: [...prev.kasa, ...kasaEntries],
        cari,
        stockMovements,
      };
    });

    this.yayinla("satis.tamamlandi", { saleId: sale.id, total, profit });
    return { ok: true, data: { saleId: sale.id, total, profit } };
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
