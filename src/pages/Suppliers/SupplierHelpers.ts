/**
 * @file SupplierHelpers.ts
 * @description Tedarikçi sayfası için pure yardımcı fonksiyonlar.
 */

import { similarity } from '@/lib/similarity';
import type { DB, Order } from '@/types';
import type { CatFilter, SupplierWithCat } from './types';

export function getAllSuppliers(db: DB): SupplierWithCat[] {
  return [
    ...db.suppliers
      .filter((s) => !s.deleted)
      .map((s) => ({ ...s, _kat: 'genel' as const })),
    ...(db.peletSuppliers || []).map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      category: 'Pelet',
      totalOrders: 0,
      totalAmount: 0,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      _kat: 'pelet' as const,
    })),
    ...(db.boruSuppliers || []).map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      category: 'Boru',
      totalOrders: 0,
      totalAmount: 0,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      _kat: 'boru' as const,
    })),
  ];
}

export function filterSuppliers(
  suppliers: SupplierWithCat[],
  catFilter: CatFilter,
  search: string,
): SupplierWithCat[] {
  let result = suppliers;
  if (catFilter !== 'hepsi') {
    result = result.filter((s) => s._kat === catFilter);
  }
  if (search.trim()) {
    const term = search.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(term) || (s.phone || '').includes(search),
    );
  }
  return result;
}

export function calcScore(supplier: SupplierWithCat, orders: Order[]): number {
  const supplierOrders = orders.filter(
    (o) => o.supplierId === supplier.id && o.status !== 'iptal',
  );
  const completedOnTime = supplierOrders.filter((o) => {
    if (o.status !== 'tamamlandi') return false;
    if (!o.deliveryDate || !o.createdAt) return true;
    const diff =
      (new Date(o.deliveryDate).getTime() - new Date(o.createdAt).getTime()) /
      86400000;
    return diff <= 7;
  });
  const onTimeRate =
    supplierOrders.length > 0
      ? (completedOnTime.length / supplierOrders.length) * 100
      : 0;
  const orderScore = Math.min(30, (supplier.totalOrders || 0) * 3);
  const amountScore = Math.min(30, ((supplier.totalAmount || 0) / 10000) * 10);
  const deliveryScore = onTimeRate * 0.4;
  return Math.min(100, Math.round(orderScore + amountScore + deliveryScore));
}

export function checkDuplicateSuppliers(
  name: string,
  editId: string | null,
  db: DB,
): { name: string; score: number }[] {
  if (!name) return [];
  const candidates = [
    ...db.suppliers.filter((s) => !editId || s.id !== editId),
    ...(db.peletSuppliers || []),
    ...(db.boruSuppliers || []),
  ];
  return candidates
    .map((s) => ({ name: s.name, score: similarity(name, s.name) }))
    .filter((x) => x.score >= 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
