import type { DB, Cari } from "@/types";

export function computeAlacak(db: DB): number {
  return db.cari
    .filter((c) => !c.deleted && c.type === "musteri" && c.balance > 0)
    .reduce((s, c) => s + c.balance, 0);
}

export function computeBorc(db: DB): number {
  return db.cari
    .filter((c) => !c.deleted && c.type === "tedarikci" && c.balance > 0)
    .reduce((s, c) => s + c.balance, 0);
}

export function computeKasaToplam(db: DB): number {
  return db.kasa
    .filter((k) => !k.deleted)
    .reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0);
}

export function computeKasaByType(db: DB, type: string): number {
  return db.kasa
    .filter((k) => !k.deleted && k.kasa === type)
    .reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0);
}

export function computeStokDeger(db: DB): number {
  return db.products
    .filter((p) => !p.deleted)
    .reduce((s, p) => s + p.cost * p.stock, 0);
}

export function getOutOfStockProducts(db: DB) {
  return db.products.filter((p) => !p.deleted && p.stock === 0);
}

export function getLowStockProducts(db: DB) {
  return db.products.filter(
    (p) => !p.deleted && p.stock > 0 && p.stock <= p.minStock,
  );
}

export function getMonthSales(db: DB) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const sales = db.sales.filter(
    (s) => !s.deleted && s.status === "tamamlandi" && new Date(s.createdAt) >= monthStart,
  );
  const ciro = sales.reduce((s, x) => s + x.total, 0);
  const kar = sales.reduce((s, x) => s + x.profit, 0);
  return { sales, ciro, kar };
}

export function getTopBorclu(db: DB, n = 5): Cari[] {
  return [...db.cari]
    .filter((c) => !c.deleted && c.type === "musteri" && c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, n);
}

export function getOverdueMusteri(db: DB, minDays = 30): Array<Cari & { days: number | null }> {
  return db.cari
    .filter((c) => !c.deleted && c.type === "musteri" && c.balance > 0)
    .map((c) => {
      const lastPay = db.kasa
        .filter((k) => !k.deleted && k.cariId === c.id && k.type === "gelir")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const lastPayDate = lastPay ? new Date(lastPay.createdAt) : null;
      const unpaidSale = db.sales
        .filter((s) => !s.deleted && s.status === "tamamlandi" && s.cariId === c.id)
        .filter((s) => !lastPayDate || new Date(s.createdAt) > lastPayDate)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      const refDate = unpaidSale
        ? new Date(unpaidSale.createdAt)
        : c.lastTransaction
          ? new Date(c.lastTransaction)
          : null;
      const days = refDate
        ? Math.floor((Date.now() - refDate.getTime()) / 86400000)
        : null;
      return { ...c, days };
    })
    .filter((c) => c.days !== null && c.days >= minDays)
    .sort((a, b) => (b.days ?? 0) - (a.days ?? 0));
}

export function getCategorySales(db: DB): Record<string, { ciro: number; kar: number }> {
  const catSales: Record<string, { ciro: number; kar: number }> = {};
  db.sales
    .filter((s) => !s.deleted && s.status === "tamamlandi")
    .forEach((s) => {
      const c = s.productCategory || "Diğer";
      if (!catSales[c]) catSales[c] = { ciro: 0, kar: 0 };
      catSales[c].ciro += s.total;
      catSales[c].kar += s.profit;
    });
  return catSales;
}

export function getProductSalesAgg(db: DB): Record<string, { ciro: number; adet: number; kar: number }> {
  const agg: Record<string, { ciro: number; adet: number; kar: number }> = {};
  db.sales
    .filter((s) => !s.deleted && s.status === "tamamlandi")
    .forEach((s) => {
      const id = s.productId || s.productName;
      if (!agg[id]) agg[id] = { ciro: 0, adet: 0, kar: 0 };
      agg[id].ciro += s.total;
      agg[id].adet += s.quantity;
      agg[id].kar += s.profit;
    });
  return agg;
}
