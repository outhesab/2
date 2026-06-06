import type { DB } from "@/types";

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
