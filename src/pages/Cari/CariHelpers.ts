/**
 * Cari sayfasi icin saf yardimci fonksiyonlar ve tip tanimlari.
 */

import type { Cari as CariType, DB } from '@/types';

export interface CariFilters {
  filter: 'all' | 'musteri' | 'tedarikci';
  search: string;
  showOnlyDebt: boolean;
  sortBy: 'name' | 'balance' | 'debt_days';
}

export const emptyForm: Omit<CariType, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  type: 'musteri',
  taxNo: '',
  phone: '',
  email: '',
  address: '',
  balance: 0,
  note: '',
};

export function calcDebtDays(cari: CariType, db: Pick<DB, 'sales' | 'kasa'>): number | null {
  if (cari.balance <= 0) return null;
  const lastPayment = db.kasa
    .filter((k) => !k.deleted && k.cariId === cari.id && k.type === 'gelir')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const lastPaymentDate = lastPayment ? new Date(lastPayment.createdAt) : null;
  const unpaidSales = db.sales
    .filter((s) => !s.deleted && s.status === 'tamamlandi' && s.cariId === cari.id)
    .filter((s) => !lastPaymentDate || new Date(s.createdAt) > lastPaymentDate)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const oldestUnpaid = unpaidSales[0];
  if (oldestUnpaid) return Math.floor((Date.now() - new Date(oldestUnpaid.createdAt).getTime()) / 86400000);
  if (cari.lastTransaction) return Math.floor((Date.now() - new Date(cari.lastTransaction).getTime()) / 86400000);
  return null;
}

export function debtColor(days: number | null): {
  color: string;
  bg: string;
  label: string;
} {
  if (days === null) return { color: 'text-slate-500', bg: '', label: '' };
  if (days <= 7) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: `${days}g` };
  if (days <= 30) return { color: 'text-amber-500', bg: 'bg-amber-500/10', label: `${days}g` };
  if (days <= 60) return { color: 'text-red-500', bg: 'bg-red-500/10', label: `${days}g ⚠️` };
  return { color: 'text-red-600', bg: 'bg-red-600/20', label: `${days}g gecikmis` };
}

export type CariWithDays = CariType & { debtDays: number | null };

export interface AgingBuckets {
  '0-7': CariWithDays[];
  '8-30': CariWithDays[];
  '31-60': CariWithDays[];
  '60+': CariWithDays[];
}

export function filterAndSortCari(
  cariList: CariType[],
  filters: CariFilters,
  db: Pick<DB, 'sales' | 'kasa'>,
): CariWithDays[] {
  let result = cariList.filter((c) => !c.deleted);
  if (filters.filter !== 'all') result = result.filter((c) => c.type === filters.filter);
  if (filters.showOnlyDebt) result = result.filter((c) => c.balance > 0);
  if (filters.search)
    result = result.filter(
      (c) => c.name.toLowerCase().includes(filters.search.toLowerCase()) || (c.phone || '').includes(filters.search),
    );

  const withDays = result.map((c) => ({ ...c, debtDays: calcDebtDays(c, db) }));
  return [...withDays].sort((a, b) => {
    if (filters.sortBy === 'balance') return b.balance - a.balance;
    if (filters.sortBy === 'debt_days') return (b.debtDays ?? -1) - (a.debtDays ?? -1);
    return (a.name || '').localeCompare(b.name || '', 'tr');
  });
}

export function getAgingBuckets(cari: CariWithDays[]): AgingBuckets {
  return {
    '0-7': cari.filter((c) => c.type === 'musteri' && c.debtDays !== null && c.debtDays <= 7),
    '8-30': cari.filter((c) => c.type === 'musteri' && c.debtDays !== null && c.debtDays > 7 && c.debtDays <= 30),
    '31-60': cari.filter((c) => c.type === 'musteri' && c.debtDays !== null && c.debtDays > 30 && c.debtDays <= 60),
    '60+': cari.filter((c) => c.type === 'musteri' && c.debtDays !== null && c.debtDays > 60),
  };
}

export function getTotals(db: DB) {
  const totalReceivable = db.cari
    .filter((c) => !c.deleted && c.type === 'musteri' && c.balance > 0)
    .reduce((s, c) => s + c.balance, 0);
  const totalPayable = db.cari
    .filter((c) => !c.deleted && c.type === 'tedarikci' && c.balance > 0)
    .reduce((s, c) => s + c.balance, 0);
  return { totalReceivable, totalPayable };
}
