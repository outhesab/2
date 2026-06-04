import { genId } from "@/lib/utils-tr";
import type { DB } from "@/types";
import type { SaleIntent, StockMovementV2, CashTransaction, CariUpdate, SaleResult } from "../types";
import type { DomainEvent } from "@/types";

function calcSubtotal(items: SaleIntent["items"]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
}

function calcDiscountAmount(items: SaleIntent["items"], discountPercent: number, discountAmount?: number): number {
  if (discountAmount !== undefined && discountAmount > 0) return discountAmount;
  if (discountPercent > 0) {
    return Math.round(calcSubtotal(items) * (discountPercent / 100));
  }
  return 0;
}

function calcProfit(items: SaleIntent["items"], discountAmount: number): number {
  return items.reduce((sum, i) => sum + (i.unitPrice - i.cost) * i.quantity, 0) - discountAmount;
}

function findProductCategory(db: DB, productId: string): string | undefined {
  return db.products.find((p) => p.id === productId)?.category;
}

function findCariName(db: DB, cariId: string): string | undefined {
  return db.cari.find((c) => c.id === cariId)?.name;
}

function buildSaleRecord(
  id: string,
  intent: SaleIntent,
  db: DB,
  subtotal: number,
  total: number,
  profit: number,
  discountAmount: number,
  nowIso: string,
) {
  const firstItem = intent.items[0];
  const totalQty = intent.items.reduce((s, i) => s + i.quantity, 0);
  return {
    id,
    cariId: intent.cariId || undefined,
    cariName: intent.cariId ? findCariName(db, intent.cariId) : undefined,
    customerName: intent.customerName || undefined,
    productId: firstItem?.productId,
    productName: intent.items.length === 1 ? firstItem.productName : `${firstItem.productName} +${intent.items.length - 1}`,
    productCategory: firstItem ? findProductCategory(db, firstItem.productId) : undefined,
    quantity: totalQty,
    unitPrice: total / Math.max(1, totalQty),
    cost: intent.items.reduce((s, i) => s + i.cost * i.quantity, 0),
    discount: intent.discount ?? 0,
    discountAmount,
    subtotal,
    total,
    profit,
    payment: intent.payment,
    status: "tamamlandi" as const,
    items: intent.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      cost: i.cost,
      total: i.quantity * i.unitPrice,
    })),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function completeSale(
  intent: SaleIntent,
  db: DB,
): { ok: true; data: SaleResult } | { ok: false; error: string } {
  if (intent.items.length === 0) {
    return { ok: false, error: "En az bir ürün ekleyin" };
  }

  const yetersizStok = intent.items.filter((i) => {
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

  const nowIso = intent.saleDate
    ? new Date(intent.saleDate).toISOString()
    : new Date().toISOString();
  const saleId = genId();

  const discountAmount = calcDiscountAmount(intent.items, intent.discount ?? 0, intent.discountAmount);
  const subtotal = calcSubtotal(intent.items);
  const total = subtotal - discountAmount;
  const profit = calcProfit(intent.items, discountAmount);

  const sale = buildSaleRecord(saleId, intent, db, subtotal, total, profit, discountAmount, nowIso);

  const stockMovements: StockMovementV2[] = [];
  for (const item of intent.items) {
    const product = db.products.find((p) => p.id === item.productId);
    const before = product?.stock ?? 0;
    const decrease = Math.min(item.quantity, before);
    stockMovements.push({
      productId: item.productId,
      productName: item.productName,
      type: "satis",
      amount: -decrease,
      before,
      after: before - decrease,
    });
  }

  let cashTransaction: CashTransaction | null = null;
  const tahsilatNum = intent.tahsilat ?? total;
  const kalan = total - tahsilatNum;
  const fiiliTahsilat = intent.tahsilat === undefined && intent.payment === "cari" ? 0 : tahsilatNum;
  if (fiiliTahsilat > 0) {
    const kasaId = intent.payment === "cari" ? "nakit" : intent.payment;
    cashTransaction = {
      amount: fiiliTahsilat,
      type: "gelir",
      category: "satis",
      kasa: kasaId,
      description: `Satış: ${sale.productName}`,
      relatedId: saleId,
    };
  }

  let cariUpdate: CariUpdate | null = null;
  if (intent.cariId && kalan > 0) {
    cariUpdate = {
      cariId: intent.cariId,
      balanceChange: kalan,
    };
  }

  const events: DomainEvent[] = [
    {
      id: genId(),
      type: "sale.completed",
      aggregateId: saleId,
      aggregateType: "sale",
      payload: { ...intent, total } as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    },
    ...stockMovements.map((sm) => ({
      id: genId(),
      type: "stock.deducted" as const,
      aggregateId: sm.productId,
      aggregateType: "stock" as const,
      payload: sm as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    })),
  ];
  if (cashTransaction) {
    events.push({
      id: genId(),
      type: "cash.recorded",
      aggregateId: saleId,
      aggregateType: "cash",
      payload: cashTransaction as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    });
  }
  if (cariUpdate) {
    events.push({
      id: genId(),
      type: "cari.updated",
      aggregateId: cariUpdate.cariId,
      aggregateType: "cari",
      payload: cariUpdate as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    });
  }

  return {
    ok: true,
    data: {
      sale,
      stockMovements,
      cashTransaction,
      cariUpdate,
      events,
    },
  };
}
