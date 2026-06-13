import { genId } from "@/lib/utils-tr";
import type { DB } from "@/types";
import type { SaleIntent, StockMovementV2, CariUpdate, CashTransaction, IntentResult } from "@/domain/types";
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
): IntentResult {
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
 
  let kasaEntry: CashTransaction | null = null;
  const tahsilatNum = intent.tahsilat ?? total;
  const kalan = total - tahsilatNum;
  const fiiliTahsilat = intent.tahsilat === undefined && intent.payment === "cari" ? 0 : tahsilatNum;
  if (fiiliTahsilat > 0) {
    const kasaId = intent.payment === "cari" ? "nakit" : intent.payment;
    kasaEntry = {
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
      type: "sale.completed" as const,
      aggregateId: saleId,
      aggregateType: "sale" as const,
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
  if (kasaEntry) {
    events.push({
      id: genId(),
      type: "cash.recorded" as const,
      aggregateId: saleId,
      aggregateType: "cash" as const,
      payload: kasaEntry as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    });
  }
  if (cariUpdate) {
    events.push({
      id: genId(),
      type: "cari.updated" as const,
      aggregateId: cariUpdate.cariId,
      aggregateType: "cari" as const,
      payload: cariUpdate as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    });
  }
 
  return {
    ok: true,
    data: {
      dbUpdates: {
        sale,
        stockMovements: stockMovements.map(sm => ({ id: sm.productId, productId: sm.productId, newStock: sm.after })),
        cashTransaction: kasaEntry ? [kasaEntry] : undefined,
        cari: cariUpdate ? [cariUpdate] : undefined,
      },
      events,
    },
  };
}

export function cancelSale(saleId: string, db: DB): IntentResult {
  const sale = db.sales.find((s) => s.id === saleId);
  if (!sale) return { ok: false, error: "Satış bulunamadı" };
  if (sale.status === 'iptal' || sale.status === 'iade') return { ok: false, error: "Bu satış zaten iptal edilmiş veya iade edilmiş" };

  const nowIso = new Date().toISOString();
  
  const productUpdates = (sale.items || []).map(item => {
    const p = db.products.find(prod => prod.id === item.productId);
    return { id: item.productId, newStock: (p?.stock ?? 0) + item.quantity };
  });

  const events: DomainEvent[] = [
    {
      id: genId(),
      type: "sale.cancelled" as const,
      aggregateId: saleId,
      aggregateType: "sale" as const,
      payload: { saleId } as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    },
  ];

  const cariUpdate = sale.cariId && sale.payment === 'cari'
    ? [{ cariId: sale.cariId, balanceChange: -(sale.total || 0) }]
    : undefined;

  const kasaEntry: CashTransaction = {
    amount: sale.total || 0,
    type: 'gider',
    category: 'satis_iptal',
    kasa: 'nakit',
    description: `Satış iptal: ${sale.id}`,
    relatedId: sale.id,
  };

  return {
    ok: true,
    data: {
      dbUpdates: {
        sale: { ...sale, status: 'iptal', updatedAt: nowIso, returnedAt: nowIso },
        products: productUpdates,
        cashTransaction: [kasaEntry],
        ...(cariUpdate ? { cari: cariUpdate } : {}),
      },
      events,
    },
  };
}

export function returnSale(saleId: string, db: DB, qty?: number | Record<string, number>): IntentResult {
  const sale = db.sales.find((s) => s.id === saleId);
  if (!sale) return { ok: false, error: "Satış bulunamadı" };
  if (sale.status === 'iptal') return { ok: false, error: "İptal edilmiş satış iade edilemez" };

  const nowIso = new Date().toISOString();
  const totalSaleQty = sale.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  
  const productUpdates: Array<{ id: string; newStock: number }> = [];
  const stockMovements: StockMovementV2[] = [];

  (sale.items || []).forEach(item => {
    const p = db.products.find(prod => prod.id === item.productId);
    const currentStock = p?.stock ?? 0;
    
    let iadeMiktar = 0;
    if (typeof qty === 'object' && qty !== null) {
      iadeMiktar = Math.min((qty as Record<string, number>)[item.productId] ?? item.quantity, item.quantity);
    } else {
      const ratio = qty !== undefined ? qty / totalSaleQty : 1;
      iadeMiktar = Math.round(item.quantity * ratio);
    }

    productUpdates.push({ id: item.productId, newStock: currentStock + iadeMiktar });
    stockMovements.push({
      id: genId(),
      productId: item.productId,
      productName: item.productName,
      type: "iade",
      amount: iadeMiktar,
      before: currentStock,
      after: currentStock + iadeMiktar,
    });
  });

  const events: DomainEvent[] = [
    {
      id: genId(),
      type: "sale.returned" as const,
      aggregateId: saleId,
      aggregateType: "sale" as const,
      payload: { saleId, qty } as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    },
    ...stockMovements.map(sm => ({
      id: genId(),
      type: "stock.returned" as const,
      aggregateId: sm.productId,
      aggregateType: "stock" as const,
      payload: sm as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    })),
  ];

  return {
    ok: true,
    data: {
      dbUpdates: {
        sale: { ...sale, status: 'iade', updatedAt: nowIso, returnedAt: nowIso },
        products: productUpdates,
      },
      events,
    },
  };
}

export function correctSalePrice(saleId: string, yeniFiyat: number | Record<string, number>, db: DB): IntentResult {
  const sale = db.sales.find((s) => s.id === saleId);
  if (!sale) return { ok: false, error: "Satış bulunamadı" };

  const nowIso = new Date().toISOString();
  const isPerItem = typeof yeniFiyat === 'object' && yeniFiyat !== null;

  const updatedItems = (sale.items || []).map((item) => {
    const itemPrice = isPerItem
      ? ((yeniFiyat as Record<string, number>)[item.productId] ?? item.unitPrice)
      : (yeniFiyat as number);
    return { ...item, unitPrice: itemPrice };
  });

  const yeniTotal = updatedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const yeniProfit = updatedItems.reduce((s, i) => s + (i.unitPrice - i.cost) * i.quantity, 0);

  const events: DomainEvent[] = [
    {
      id: genId(),
      type: "sale.price_corrected" as const,
      aggregateId: saleId,
      aggregateType: "sale" as const,
      payload: { saleId, yeniFiyat } as unknown as Record<string, unknown>,
      timestamp: nowIso,
      version: 1,
    },
  ];

  return {
    ok: true,
    data: {
      dbUpdates: {
        sale: {
          ...sale,
          items: updatedItems,
          unitPrice: updatedItems[0]?.unitPrice ?? (yeniFiyat as number),
          total: yeniTotal - (sale.discountAmount ?? 0),
          profit: yeniProfit - (sale.discountAmount ?? 0),
          updatedAt: nowIso,
        },
      },
      events,
    },
  };
}
