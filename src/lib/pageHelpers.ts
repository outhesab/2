/* eslint-disable @typescript-eslint/no-explicit-any */
import { genId } from './utils-tr';

export function upsertSupplier<T extends { id: string }>(
  prev: Record<string, any>,
  dbKey: string,
  form: Partial<T>,
  editId: string | null,
  nowIso: string,
  defaults: Partial<T> = {},
): any {
  const arr = [...prev[dbKey]];
  if (editId) {
    const i = arr.findIndex((s: any) => s.id === editId);
    if (i >= 0) arr[i] = { ...arr[i], ...form, updatedAt: nowIso };
  } else {
    arr.push({ id: genId(), createdAt: nowIso, updatedAt: nowIso, ...defaults, ...form });
  }
  return { ...prev, [dbKey]: arr };
}

export function addOrder(prev: Record<string, any>, dbKey: string, order: Record<string, any>, nowIso: string): any {
  return {
    ...prev,
    [dbKey]: [...prev[dbKey], { id: genId(), createdAt: nowIso, updatedAt: nowIso, ...order }],
  };
}

export function removeById(prev: Record<string, any>, dbKey: string, id: string): any {
  return { ...prev, [dbKey]: prev[dbKey].filter((s: any) => s.id !== id) };
}

export function updateStatusInDB(prev: Record<string, any>, dbKey: string, id: string, status: string): any {
  return {
    ...prev,
    [dbKey]: prev[dbKey].map((o: any) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o)),
  };
}
