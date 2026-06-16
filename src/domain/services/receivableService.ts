import type { DB } from "@/types";

export interface OverdueCustomer {
  cariId: string;
  name: string;
  totalOverdue: number;
  oldestDebtDate: string;
  totalCariBalance: number;
  overdueSales: Array<{
    saleId: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
  }>;
}

export function getOverdueReceivables(db: DB): OverdueCustomer[] {
  const now = new Date();
  const overdueMap = new Map<string, {
    total: number,
    oldestDate: string,
    sales: OverdueCustomer['overdueSales']
  }>();

  db.sales
    .filter(s => !s.deleted && s.status === 'tamamlandi' && s.payment === 'cari' && s.cariId)
    .forEach(sale => {
      const dueDate = new Date(sale.dueDate || sale.createdAt);
      if (dueDate >= now) return;
      const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const cid = sale.cariId!;
      const current = overdueMap.get(cid) || { total: 0, oldestDate: sale.createdAt, sales: [] };

      const payments = db.kasa
        .filter(k => !k.deleted && k.relatedId === sale.id && k.type === 'gelir')
        .reduce((sum, k) => sum + k.amount, 0);

      const remaining = sale.total - payments;
      if (remaining > 0) {
        current.total += remaining;
        if (new Date(sale.createdAt) < new Date(current.oldestDate)) {
          current.oldestDate = sale.createdAt;
        }
        current.sales.push({
          saleId: sale.id,
          amount: remaining,
          dueDate: sale.dueDate || sale.createdAt,
          daysOverdue: diffDays,
        });
      }
    });

  const result: OverdueCustomer[] = [];
  overdueMap.forEach((data, cariId) => {
    const cari = db.cari.find(c => c.id === cariId);
    if (cari) {
      result.push({
        cariId,
        name: cari.name,
        totalOverdue: data.total,
        oldestDebtDate: data.oldestDate,
        totalCariBalance: cari.balance || 0,
        overdueSales: data.sales,
      });
    }
  });

  return result.sort((a, b) => b.totalOverdue - a.totalOverdue);
}
