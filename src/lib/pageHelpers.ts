import { genId } from './utils-tr';
import type { DB } from '@/types';

type CastDB = Record<string, unknown>;
type Entry = { id: string };

function asDB(prev: DB): CastDB {
  return prev as unknown as CastDB;
}

function fromDB(prev: DB, mutated: CastDB): DB {
  return mutated as unknown as DB;
}

function asArray<T>(items: unknown): T[] {
  return (Array.isArray(items) ? items : []) as T[];
}

export function upsertSupplier<T extends Entry>(
  prev: DB,
  dbKey: string,
  form: Partial<T>,
  editId: string | null,
  nowIso: string,
  defaults: Partial<T> = {},
): DB {
  const db = asDB(prev);
  const arr = [...asArray<Entry>(db[dbKey])];
  if (editId) {
    const i = arr.findIndex((s) => s.id === editId);
    if (i >= 0) arr[i] = { ...arr[i], ...form, updatedAt: nowIso } as Entry;
  } else {
    arr.push({ id: genId(), createdAt: nowIso, updatedAt: nowIso, ...defaults, ...form } as Entry);
  }
  return fromDB(prev, { ...db, [dbKey]: arr });
}

export function addOrder(prev: DB, dbKey: string, order: Record<string, unknown>, nowIso: string): DB {
  const db = asDB(prev);
  return fromDB(prev, {
    ...db,
    [dbKey]: [...asArray<Record<string, unknown>>(db[dbKey]), { id: genId(), createdAt: nowIso, updatedAt: nowIso, ...order }],
  });
}

export function removeById(prev: DB, dbKey: string, id: string): DB {
  const db = asDB(prev);
  return fromDB(prev, { ...db, [dbKey]: asArray<Entry>(db[dbKey]).filter((s) => s.id !== id) });
}

export function updateStatusInDB(prev: DB, dbKey: string, id: string, status: string): DB {
  const db = asDB(prev);
  return fromDB(prev, {
    ...db,
    [dbKey]: asArray<Entry & { status?: string; updatedAt?: string }>(db[dbKey]).map((o) =>
      o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
    ),
  });
}
