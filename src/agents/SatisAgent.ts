import { BaseAgent } from '@/agents/BaseAgent';
import type { AgentPermission, AgentRequest, AgentResponse, SatisSonuc, YeniSatisParams } from '@/agents/types';
import { formatMoney, genId } from '@/lib/utils-tr';
import { completeSale } from '@/domain/services/saleCompletion';
import type { DB, Sale } from '@/types';
import { requireSatisWrite, applyRefundToDB } from './satisHelpers';

function mapProductStock(
  products: DB['products'],
  getMatch: (p: DB['products'][number]) => { quantity: number } | undefined | null,
  updateStock: (p: DB['products'][number], match: { quantity: number }) => number,
): DB['products'] {
  return products.map((p) => {
    const match = getMatch(p);
    if (!match) return p;
    return { ...p, stock: updateStock(p, match) };
  });
}

function checkWritePermission(
  yetkiKontrolu: (y: string) => boolean,
  ctx: unknown,
  msg?: string,
): { ok: false; error: string } | void {
  const err = requireSatisWrite(yetkiKontrolu, ctx, msg);
  if (err) return err;
}

function processSaleRefund(
  save: (fn: (prev: DB) => DB) => void,
  saleId: string,
  nowIso: string,
  status: 'iptal' | 'iade',
  getProducts: (prev: DB, sale: Sale) => DB['products'],
) {
  save((prev) => {
    const sale = prev.sales.find((s) => s.id === saleId);
    if (!sale) return prev;
    const products = getProducts(prev, sale);
    const extra = status === 'iade' ? { returnedAt: nowIso } : {};
    const sales = prev.sales.map((s) => (s.id === saleId ? { ...s, status, updatedAt: nowIso, ...extra } : s));
    const { kasa, cari } = applyRefundToDB(prev.kasa, prev.cari, sale, nowIso, status);
    return { ...prev, sales, products, kasa, cari };
  });
}

export class SatisAgent extends BaseAgent {
  readonly id = 'satis' as const;
  readonly yetkiler = ['satis.read', 'satis.write', 'rapor.read'] as const;

  async yeniSatis(params: YeniSatisParams): Promise<AgentResponse<SatisSonuc>> {
    const permErr = checkWritePermission(
      (y: string) => this.yetkiKontrolu(y as AgentPermission),
      this.ctx,
      'Agent bağlanmadı — önce bagla() çağırın',
    );
    if (permErr) return permErr;

    const db = this.db;
    const result = completeSale(
      {
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
      },
      db,
    );

    if (!result.ok) return result;

    const { sale: cs, stockMovements, cashTransaction, cariUpdate, events } = result.data;

    this.save((prev) => {
      const products = mapProductStock(
        prev.products,
        (p) => {
          const sm = stockMovements.find((s) => s.productId === p.id);
          return sm ? { quantity: sm.after } : undefined;
        },
        (p, sm) => Math.max(0, sm.quantity),
      );

      const sale: Sale = {
        ...cs,
        cariName: params.cariId ? prev.cari.find((c) => c.id === params.cariId)?.name : undefined,
        _domainEventLog: events,
      };

      const kasaEntries: typeof prev.kasa = [];
      if (cashTransaction) {
        kasaEntries.push({
          id: genId(),
          type: 'gelir',
          category: 'satis',
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
        type: 'satis' as const,
        amount: sm.amount,
        before: sm.before,
        after: sm.after,
        note: 'Satış',
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

    this.yayinla('satis.tamamlandi', { saleId: cs.id, total: cs.total, profit: cs.profit });
    return { ok: true, data: { saleId: cs.id, total: cs.total, profit: cs.profit } };
  }

  async iptalEt(saleId: string): Promise<AgentResponse<void>> {
    const permErr = checkWritePermission((y: string) => this.yetkiKontrolu(y as AgentPermission), this.ctx);
    if (permErr) return permErr;

    const nowIso = new Date().toISOString();
    processSaleRefund(
      (fn) => this.save(fn),
      saleId,
      nowIso,
      'iptal',
      (prev, sale) =>
        mapProductStock(
          prev.products,
          (p) => sale.items?.find((i) => i.productId === p.id),
          (p, item) => p.stock + item.quantity,
        ),
    );

    this.yayinla('satis.iptal', { saleId });
    return { ok: true };
  }

  async iadeYap(saleId: string, qty?: number | Record<string, number>): Promise<AgentResponse<void>> {
    const permErr = checkWritePermission((y: string) => this.yetkiKontrolu(y as AgentPermission), this.ctx);
    if (permErr) return permErr;

    const nowIso = new Date().toISOString();
    processSaleRefund(
      (fn) => this.save(fn),
      saleId,
      nowIso,
      'iade',
      (prev, sale) => {
        const isPerItem = typeof qty === 'object' && qty !== null;
        const totalSaleQty = sale.items?.reduce((s, i) => s + i.quantity, 0) || 0;
        return prev.products.map((p) => {
          const items = sale.items?.filter((i) => i.productId === p.id);
          if (!items || items.length === 0) return p;
          const totalItemQty = items.reduce((s, i) => s + i.quantity, 0);
          if (isPerItem) {
            const iadeMiktar = Math.min((qty as Record<string, number>)[p.id] ?? totalItemQty, totalItemQty);
            return { ...p, stock: p.stock + iadeMiktar };
          }
          const iadeMiktar = qty !== undefined ? Math.round((totalItemQty / totalSaleQty) * qty) : totalItemQty;
          return { ...p, stock: p.stock + iadeMiktar };
        });
      },
    );

    this.yayinla('satis.iade', { saleId, qty });
    return { ok: true };
  }

  async fiyatDuzelt(saleId: string, yeniFiyat: number | Record<string, number>): Promise<AgentResponse<void>> {
    const permErr = checkWritePermission((y: string) => this.yetkiKontrolu(y as AgentPermission), this.ctx);
    if (permErr) return permErr;

    const nowIso = new Date().toISOString();
    this.save((prev) => {
      const sale = prev.sales.find((s) => s.id === saleId);
      if (!sale) return prev;

      const isPerItem = typeof yeniFiyat === 'object' && yeniFiyat !== null;

      const updatedItems = (sale.items || []).map((item) => {
        const itemPrice = isPerItem
          ? ((yeniFiyat as Record<string, number>)[item.productId] ?? item.unitPrice)
          : (yeniFiyat as number);
        return { ...item, unitPrice: itemPrice };
      });

      const yeniTotal = updatedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const yeniProfit = updatedItems.reduce((s, i) => s + (i.unitPrice - i.cost) * i.quantity, 0);

      const ilkItem = updatedItems[0];
      const eskiFiyat = sale.unitPrice;
      const gecerliYeniFiyat = isPerItem ? yeniTotal : (yeniFiyat as number);

      const sales = prev.sales.map((s) =>
        s.id === saleId
          ? {
              ...s,
              items: updatedItems,
              unitPrice: ilkItem?.unitPrice ?? yeniFiyat,
              total: yeniTotal - (s.discountAmount ?? 0),
              profit: yeniProfit - (s.discountAmount ?? 0),
              updatedAt: nowIso,
            }
          : s,
      );

      const activityLog = {
        id: genId(),
        action: 'fiyat_duzeltme',
        detail: `${sale.productName}: ${formatMoney(eskiFiyat)} → ${formatMoney(gecerliYeniFiyat)} (fark: ${formatMoney(gecerliYeniFiyat - eskiFiyat)})`,
        time: nowIso,
        relatedId: saleId,
      };

      return {
        ...prev,
        sales,
        _activityLog: [...(prev._activityLog || []), activityLog],
      };
    });

    this.yayinla('satis.fiyat-duzelt', { saleId, yeniFiyat });
    return { ok: true };
  }

  async islemYap(talep: AgentRequest): Promise<AgentResponse> {
    this.yayinla('satis.islem', { action: talep.action, payload: talep.payload });

    if (talep.action === 'sale' && talep.payload) {
      const p = talep.payload as Record<string, unknown>;
      if (!p || typeof p !== 'object' || !Array.isArray(p.items)) {
        return { ok: false, error: 'Geçersiz satış payload' };
      }
      const params: YeniSatisParams = {
        items: (p.items as YeniSatisParams['items']) || [],
        cariId: (p.cariId as string) || '',
        payment: (p.payment as YeniSatisParams['payment']) || 'nakit',
        discount: (p.discount as number) || 0,
        discountAmount: (p.discountAmount as number) || 0,
        tahsilat: (p.tahsilat as number) || 0,
        saleDate: (p.saleDate as string) || undefined,
      };
      return this.yeniSatis(params);
    }

    return {
      ok: true,
      data: { agent: this.id, action: talep.action, status: 'completed' },
    };
  }
}
