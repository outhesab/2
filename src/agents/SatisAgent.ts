import { DomainAgent } from "@/agents/DomainAgent";
import type { AgentRequest, AgentResponse } from "@/agents/types";
import type { Intent, SaleIntent } from "@/domain/types";

type PaymentType = SaleIntent["payment"];

function asString(val: unknown): string | undefined {
  return typeof val === "string" ? val : undefined;
}

function asNumber(val: unknown): number | undefined {
  return typeof val === "number" && !Number.isNaN(val) ? val : undefined;
}

function asPaymentType(val: unknown): PaymentType {
  if (val === "nakit" || val === "kart" || val === "havale" || val === "cari") return val;
  return "nakit";
}

function asSaleItem(val: unknown): { productId: string; productName: string; quantity: number; unitPrice: number; cost: number } | null {
  if (typeof val !== "object" || val === null) return null;
  const obj = val as Record<string, unknown>;
  const productId = asString(obj.productId);
  const productName = asString(obj.productName);
  if (!productId || !productName) return null;
  return {
    productId,
    productName,
    quantity: asNumber(obj.quantity) ?? 0,
    unitPrice: asNumber(obj.unitPrice) ?? 0,
    cost: asNumber(obj.cost) ?? 0,
  };
}

function asNumberOrRecord(val: unknown): number | Record<string, number> | undefined {
  const n = asNumber(val);
  if (n !== undefined) return n;
  if (typeof val === "object" && val !== null) {
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(val)) {
      if (typeof v === "number") result[k] = v;
    }
    return result;
  }
  return undefined;
}

export class SatisAgent extends DomainAgent {
  readonly id = "satis" as const;
  readonly yetkiler = ["satis.read", "satis.write", "kasa.read", "stok.read", "cari.read", "rapor.read"] as const;

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    if (!this.yetkiKontrolu("satis.write")) {
      return { ok: false, error: `${this.id} agent'ının bu işlem için yetkisi yok` };
    }
    return super.islemYap(talep);
  }

  protected mapRequestToIntent(talep: AgentRequest): Intent | null {
    const p = talep.payload || {};
    switch (talep.action) {
      case "yeniSatis":
      case "satis": {
        const rawItems = Array.isArray(p.items) ? p.items : [];
        const items = rawItems.map(asSaleItem).filter((x): x is NonNullable<typeof x> => x !== null);
        return {
          type: "sale",
          payload: {
            items,
            payment: asPaymentType(p.payment),
            cariId: asString(p.cariId),
            cariName: asString(p.cariName),
            customerName: asString(p.customerName),
            discount: asNumber(p.discount),
            discountAmount: asNumber(p.discountAmount),
            tahsilat: asNumber(p.tahsilat),
            saleDate: asString(p.saleDate),
          },
        };
      }
      case "iptalEt":
      case "sale_iptal": {
        const saleId = asString(p.saleId);
        if (!saleId) return null;
        return { type: "sale_iptal", payload: { saleId } };
      }
      case "iadeYap":
      case "sale_iade": {
        const saleId = asString(p.saleId);
        if (!saleId) return null;
        return { type: "sale_iade", payload: { saleId, qty: asNumberOrRecord(p.quantity) } };
      }
      case "fiyatDuzelt":
      case "sale_fiyat_duzelt": {
        const saleId = asString(p.saleId);
        if (!saleId) return null;
        const yeniFiyat = asNumberOrRecord(p.yeniFiyat) ?? asNumberOrRecord(p.unitPrice) ?? 0;
        return { type: "sale_fiyat_duzelt", payload: { saleId, yeniFiyat } };
      }
      default:
        return null;
    }
  }
}
