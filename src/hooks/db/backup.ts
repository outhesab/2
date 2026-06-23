import { logger } from '@/lib/logger';
import { isFirebaseReady, readDoc, writeDoc, removeDoc, listDocs } from '@/lib/firebase';
import { ARRAY_KEYS } from '@/lib/dbDefaults';
import type { DB } from '@/types';

// ── Firebase Yedekleme ──────────────────────────────────────────────────────

const MAX_BACKUPS = 20;

async function pruneOldBackups(): Promise<void> {
  if (!isFirebaseReady()) return;
  try {
    const backups = await listDocs<{
      version: number;
      createdAt: string;
    }>(['backups'], 50);
    if (backups.length <= MAX_BACKUPS) return;
    const sorted = [...backups].sort((a, b) => (b.data.version ?? 0) - (a.data.version ?? 0));
    const toDelete = sorted.slice(MAX_BACKUPS);
    for (const b of toDelete) {
      await removeDoc(['backups', b.id]).catch(() => logger.error('db', 'Eski yedek silinemedi — yedek birikacak'));
    }
    logger.info('db', `Eski yedekler temizlendi: ${toDelete.length} silindi`);
  } catch (e) {
    logger.error('db', 'Yedek temizleme başarısız', { error: String(e) });
  }
}

export async function saveBackupToFirebase(db: DB, label?: string): Promise<boolean> {
  if (!isFirebaseReady()) return false;
  const backupId =
    label || `v${db._version}_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`;
  try {
    const ok = await writeDoc(['backups', backupId], {
      data: JSON.stringify(db),
      version: db._version ?? 0,
      label: label || `Otomatik v${db._version}`,
      createdAt: new Date().toISOString(),
    });
    logger.info('db', `Yedek kaydedildi: ${backupId}`, { ok });
    if (ok) {
      pruneOldBackups().catch(() => logger.error('db', 'Yedek temizleme başarısız — yedek birikacak'));
    }
    return ok;
  } catch (e) {
    logger.error('db', 'Yedek kaydedilemedi — cloud yedeği yok', { error: String(e) });
    return false;
  }
}

export async function listBackupsFromFirebase(): Promise<
  { id: string; version: number; label: string; createdAt: string }[]
> {
  if (!isFirebaseReady()) return [];
  try {
    const docs = await listDocs<{
      version: number;
      label: string;
      createdAt: string;
    }>(['backups'], 20);
    return docs
      .map((d) => ({
        id: d.id,
        version: d.data.version ?? 0,
        label: d.data.label ?? '',
        createdAt: d.data.createdAt ?? '',
      }))
      .sort((a, b) => b.version - a.version);
  } catch {
    logger.error('db', "Yedek listesi Firebase'den alınamadı — yedek geçmişi görünmüyor");
    return [];
  }
}

export async function restoreBackupFromFirebase(backupId: string): Promise<DB | null> {
  if (!isFirebaseReady()) return null;
  try {
    const doc = await readDoc<{ data: string }>(['backups', backupId]);
    if (!doc?.data) return null;
    return JSON.parse(doc.data) as DB;
  } catch {
    logger.error('db', "Yedek Firebase'den geri yüklenemedi — geri yükleme başarısız");
    return null;
  }
}

// ── Geri yükleme sonrası referans bütünlüğü onarımı ───────────────────────
function repairReferentialIntegrity(db: DB): DB {
  const productIds = new Set(db.products.map((p) => p.id));
  const cariIds = new Set(db.cari.map((c) => c.id));
  const partnerIds = new Set(db.partners.map((p) => p.id));
  const supplierIds = new Set(db.suppliers.map((s) => s.id));
  const boruSupplierIds = new Set((db.boruSuppliers || []).map((s) => s.id));
  const peletSupplierIds = new Set((db.peletSuppliers || []).map((s) => s.id));

  let changed = false;

  const sales = db.sales.map((s) => {
    if (s.productId && !productIds.has(s.productId)) {
      changed = true;
      const { productId: _, ...rest } = s;
      return rest;
    }
    return s;
  });

  const kasa = db.kasa.map((k) => {
    if (k.cariId && !cariIds.has(k.cariId)) {
      changed = true;
      return { ...k, cariId: undefined };
    }
    return k;
  });

  const orders = db.orders.map((o) => {
    if (o.supplierId && !supplierIds.has(o.supplierId)) {
      changed = true;
      return { ...o, deleted: true };
    }
    return o;
  });

  const invoices = (db.invoices || []).map((inv) => {
    if (inv.cariId && !cariIds.has(inv.cariId)) {
      changed = true;
      return { ...inv, cariId: undefined };
    }
    return inv;
  });

  const boruOrders = (db.boruOrders || []).map((o) => {
    if (o.supplierId && !boruSupplierIds.has(o.supplierId)) {
      changed = true;
      return { ...o, deleted: true };
    }
    return o;
  });

  const peletOrders = (db.peletOrders || []).map((o) => {
    if (o.supplierId && !peletSupplierIds.has(o.supplierId)) {
      changed = true;
      return { ...o, deleted: true };
    }
    return o;
  });

  const ortakEmanetler = (db.ortakEmanetler || []).map((e) => {
    if (e.partnerId && !partnerIds.has(e.partnerId)) {
      changed = true;
      return { ...e, deleted: true };
    }
    return e;
  });

  if (!changed) return db;
  logger.info('db', 'Referans bütünlüğü onarıldı', { changed });
  return { ...db, sales, kasa, orders, invoices, boruOrders, peletOrders, ortakEmanetler };
}

// ── Geri yükleme veri doğrulama ve tekerrür kontrolü ─────────────────────

export interface RestoreReport {
  added: number;
  skippedDuplicate: number;
  skippedInvalidName: number;
  skippedMissingField: number;
  warnings: string[];
}

function validateName(name: unknown): string | null {
  if (typeof name !== 'string' || name.trim().length === 0) return 'Ad boş olamaz';
  const trimmed = name.trim();
  if (trimmed.length < 2) return `"${trimmed}" — ad çok kısa (min 2 karakter)`;
  if (/^\d+$/.test(trimmed)) return `"${trimmed}" — ad sadece sayıdan oluşamaz`;
  return null;
}

function mergeCariler(existing: DB['cari'], incoming: DB['cari'], report: RestoreReport): DB['cari'] {
  const existingIds = new Set(existing.map((c) => c.id));
  const result = [...existing];

  for (const c of incoming) {
    if (!c.id || !c.createdAt) {
      report.skippedMissingField++;
      report.warnings.push(`Cari atlandı: zorunlu alan eksik (id veya createdAt yok)`);
      continue;
    }
    if (existingIds.has(c.id)) {
      report.skippedDuplicate++;
      continue;
    }
    const nameErr = validateName(c.name);
    if (nameErr) {
      report.skippedInvalidName++;
      report.warnings.push(`Cari atlandı: ${nameErr}`);
      continue;
    }
    if (c.type !== 'musteri' && c.type !== 'tedarikci') {
      report.skippedMissingField++;
      report.warnings.push(`Cari "${c.name}" atlandı: geçersiz tür "${c.type}"`);
      continue;
    }
    result.push(c);
    existingIds.add(c.id);
    report.added++;
  }
  return result;
}

function mergeProducts(existing: DB['products'], incoming: DB['products'], report: RestoreReport): DB['products'] {
  const existingIds = new Set(existing.map((p) => p.id));
  const result = [...existing];

  for (const p of incoming) {
    if (!p.id || !p.createdAt) {
      report.skippedMissingField++;
      report.warnings.push(`Ürün atlandı: zorunlu alan eksik`);
      continue;
    }
    if (existingIds.has(p.id)) {
      report.skippedDuplicate++;
      continue;
    }
    const nameErr = validateName(p.name);
    if (nameErr) {
      report.skippedInvalidName++;
      report.warnings.push(`Ürün atlandı: ${nameErr}`);
      continue;
    }
    if (typeof p.price !== 'number' || typeof p.cost !== 'number' || typeof p.stock !== 'number') {
      report.skippedMissingField++;
      report.warnings.push(`Ürün "${p.name}" atlandı: fiyat/maliyet/stok sayısal değil`);
      continue;
    }
    result.push(p);
    existingIds.add(p.id);
    report.added++;
  }
  return result;
}

function mergeArray<T extends { id?: string; createdAt?: string }>(
  existing: T[],
  incoming: T[],
  label: string,
  report: RestoreReport,
): T[] {
  const existingIds = new Set(existing.map((item) => item.id).filter(Boolean));
  const result = [...existing];

  for (const item of incoming) {
    if (!item.id || !item.createdAt) {
      report.skippedMissingField++;
      report.warnings.push(`${label} kaydı atlandı: zorunlu alan eksik`);
      continue;
    }
    if (existingIds.has(item.id)) {
      report.skippedDuplicate++;
      continue;
    }
    result.push(item);
    existingIds.add(item.id);
    report.added++;
  }
  return result;
}

export function mergeRestoreDB(
  current: DB,
  incoming: Partial<DB>,
  selectedKeys: Set<string>,
): { db: DB; report: RestoreReport } {
  const report: RestoreReport = {
    added: 0,
    skippedDuplicate: 0,
    skippedInvalidName: 0,
    skippedMissingField: 0,
    warnings: [],
  };
  let next = { ...current };

  if (selectedKeys.has('cari') && Array.isArray(incoming.cari)) {
    next.cari = mergeCariler(current.cari, incoming.cari, report);
  }
  if (selectedKeys.has('products') && Array.isArray(incoming.products)) {
    next.products = mergeProducts(current.products, incoming.products, report);
  }
  if (selectedKeys.has('sales') && Array.isArray(incoming.sales)) {
    next.sales = mergeArray(
      current.sales,
      incoming.sales as (DB['sales'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Satış',
      report,
    );
  }
  if (selectedKeys.has('kasa') && Array.isArray(incoming.kasa)) {
    next.kasa = mergeArray(
      current.kasa,
      incoming.kasa as (DB['kasa'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Kasa',
      report,
    );
  }
  if (selectedKeys.has('invoices') && Array.isArray(incoming.invoices)) {
    next.invoices = mergeArray(
      current.invoices,
      incoming.invoices as (DB['invoices'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Fatura',
      report,
    );
  }
  if (selectedKeys.has('suppliers') && Array.isArray(incoming.suppliers)) {
    next.suppliers = mergeArray(
      current.suppliers,
      incoming.suppliers as (DB['suppliers'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Tedarikçi',
      report,
    );
  }
  if (selectedKeys.has('orders') && Array.isArray(incoming.orders)) {
    next.orders = mergeArray(
      current.orders,
      incoming.orders as (DB['orders'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Sipariş',
      report,
    );
  }
  if (selectedKeys.has('bankTransactions') && Array.isArray(incoming.bankTransactions)) {
    next.bankTransactions = mergeArray(
      current.bankTransactions,
      incoming.bankTransactions as (DB['bankTransactions'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Banka işlemi',
      report,
    );
  }
  if (selectedKeys.has('partners') && Array.isArray(incoming.partners)) {
    next.partners = mergeArray(
      current.partners,
      incoming.partners as (DB['partners'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Ortak',
      report,
    );
  }
  if (selectedKeys.has('notes') && Array.isArray(incoming.notes)) {
    next.notes = mergeArray(
      current.notes,
      incoming.notes as (DB['notes'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Not',
      report,
    );
  }
  if (selectedKeys.has('ortakEmanetler') && Array.isArray(incoming.ortakEmanetler)) {
    next.ortakEmanetler = mergeArray(
      current.ortakEmanetler,
      incoming.ortakEmanetler as (DB['ortakEmanetler'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Emanet',
      report,
    );
  }
  if (selectedKeys.has('installments') && Array.isArray(incoming.installments)) {
    next.installments = mergeArray(
      current.installments,
      incoming.installments as (DB['installments'][number] & {
        id?: string;
        createdAt?: string;
      })[],
      'Taksit',
      report,
    );
  }
  if (selectedKeys.has('company') && incoming.company && typeof incoming.company === 'object') {
    next.company = { ...current.company, ...incoming.company };
  }
  if (selectedKeys.has('pelletSettings') && incoming.pelletSettings && typeof incoming.pelletSettings === 'object') {
    next.pelletSettings = {
      ...current.pelletSettings,
      ...incoming.pelletSettings,
    };
  }

  next = repairReferentialIntegrity(next);
  return { db: next, report };
}

export function fullRestoreDB(incoming: DB, def: DB): { db: DB; report: RestoreReport } {
  const report: RestoreReport = {
    added: 0,
    skippedDuplicate: 0,
    skippedInvalidName: 0,
    skippedMissingField: 0,
    warnings: [],
  };

  let data: DB = { ...def, ...incoming };

  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(data[key])) (data as unknown as Record<string, unknown>)[key] = [];
  }
  if (!data.kasalar || data.kasalar.length === 0) data.kasalar = def.kasalar;
  if (!data.company || typeof data.company !== 'object') data.company = def.company;
  if (!data.pelletSettings) data.pelletSettings = def.pelletSettings;
  if (!Array.isArray(data.productCategories) || data.productCategories.length === 0)
    data.productCategories = def.productCategories;

  data.cari = data.cari.map((c) => {
    const err = validateName(c.name);
    if (err) {
      report.skippedInvalidName++;
      report.warnings.push(`Cari işaretlendi (gizlendi): ${err}`);
      return { ...c, deleted: true };
    }
    return c;
  });

  data.products = data.products.map((p) => {
    const err = validateName(p.name);
    if (err) {
      report.skippedInvalidName++;
      report.warnings.push(`Ürün işaretlendi (gizlendi): ${err}`);
      return { ...p, deleted: true };
    }
    return p;
  });

  data = repairReferentialIntegrity(data);

  report.added =
    data.cari.filter((c) => !c.deleted).length +
    data.products.filter((p) => !p.deleted).length +
    data.sales.length +
    data.kasa.length;

  return { db: data, report };
}
