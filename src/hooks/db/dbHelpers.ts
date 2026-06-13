import { trimAuditLog } from '@/lib/auditEngine';
import { logger } from '@/lib/logger';
import { validateTransaction } from '@/lib/ruleEngine';
import { saveToFirebase } from './sync';
import { getUserSession } from '@/lib/userManager';
import { genId } from '@/lib/utils-tr';
import type { DB, StockMovement, RuleViolation, AuditEntry, KasaEntry } from '@/types';
import type { IntentResult, StockMovementV2 } from '@/domain/types';

// G4 fix: shared pending promise reference
let _firebasePromise: Promise<void> | null = null;
export function getFirebasePromise() {
  return _firebasePromise;
}

// Global sync lock for the main useDB useEffect
let _pendingFirebasePromise: Promise<void> | null = null;
export function getPendingFirebasePromise(): Promise<void> | null { return _pendingFirebasePromise; }
export function setPendingFirebasePromise(p: Promise<void> | null): void { _pendingFirebasePromise = p; }

async function scheduleFirebaseSave(db: DB): Promise<void> {
  const session = getUserSession();
  if (!session) {
    logger.warn('db', 'Kayıtlı oturum bulunamadı, Firebase sync atlandı');
    return;
  }
  // Chain saves: wait for previous, then schedule new one
  if (_firebasePromise) {
    try {
      await _firebasePromise;
    } catch {
      /* previous failed, continue */
    }
  }
  _firebasePromise = saveToFirebase(db, session.userId);
  _firebasePromise.finally(() => {
    _firebasePromise = null;
  });
}

export function validateAndClassify(
  prev: DB,
  next: DB,
  warnMsg: string,
): { violations: RuleViolation[]; hasBlock: boolean; hasWarn: boolean } {
  let violations: RuleViolation[] = [];
  try {
    violations = validateTransaction(prev, next);
  } catch (e) {
    logger.warn('db', warnMsg, { error: String(e) });
  }
  const hasBlock = violations.some((v) => v.severity === 'block');
  const hasWarn = violations.some((v) => v.severity === 'warn');
  return { violations, hasBlock, hasWarn };
}

export function computeAuditStatus(hasBlock: boolean, hasWarn: boolean): 'applied' | 'blocked' | 'warned' {
  return hasBlock ? 'blocked' : hasWarn ? 'warned' : 'applied';
}

export function saveBlockedState(
  prev: DB,
  entry: AuditEntry,
  violations: RuleViolation[],
  saveToStorage: (db: DB) => boolean,
  saveToIndexedSnapshot: (db: DB) => Promise<void>,
  end: (meta: Record<string, unknown>) => void,
  source: string,
): DB {
  const auditOnly: DB = {
    ...prev,
    _auditLog: trimAuditLog([entry, ...(prev._auditLog || [])]),
  };
  saveToStorage(auditOnly);
  void saveToIndexedSnapshot(auditOnly);
  end({ version: prev._version, blocked: true });
  logger.warn('db', `${source}: İşlem engellendi`, {
    violations: violations.filter((v) => v.severity === 'block').map((v) => v.ruleId),
  });
  return auditOnly;
}

export function saveAppliedState(
  next: DB,
  entry: AuditEntry,
  saveToStorage: (db: DB) => boolean,
  saveToIndexedSnapshot: (db: DB) => Promise<void>,
  syncTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  end: (meta: Record<string, unknown>) => void,
  extraEndMeta?: Record<string, unknown>,
): DB {
  const withAudit: DB = {
    ...next,
    _auditLog: trimAuditLog([entry, ...(next._auditLog || [])]),
  };
  saveToStorage(withAudit);
  void saveToIndexedSnapshot(withAudit);
  end({ version: withAudit._version, ...extraEndMeta });
  if (syncTimer.current) clearTimeout(syncTimer.current);
  syncTimer.current = setTimeout(() => {
    scheduleFirebaseSave(withAudit);
  }, 1200);
  return withAudit;
}

export function applyIntentResult(prev: DB, data: IntentResult["data"]): DB {
  if (!data) return prev;
  const { dbUpdates, events } = data;
  const next: DB = { ...prev };

  if (dbUpdates.stockMovements) {
    next.products = next.products.map((p) => {
      const update = dbUpdates.stockMovements!.find((u) => u.id === p.id || u.productId === p.id);
      return update ? { ...p, stock: update.newStock } : p;
    });
  } else if (dbUpdates.products) {
    next.products = next.products.map((p) => {
      const update = dbUpdates.products!.find((u) => u.id === p.id);
      return update ? { ...p, stock: update.newStock } : p;
    });
  }

  if (events && events.length > 0) {
    const now = new Date().toISOString();
    for (const evt of events) {
      if (evt.type === 'stock.deducted' || evt.type === 'stock.returned' || evt.type === 'stock.updated') {
        const sm = evt.payload as unknown as StockMovementV2;
        if (sm && sm.productId) {
          next.stockMovements = [...(next.stockMovements || []), {
            id: sm.id || evt.id,
            productId: sm.productId,
            productName: sm.productName || '',
            type: (evt.type === 'stock.returned' ? 'iade' : sm.type === 'iade' ? 'giris' : sm.type === 'satis' ? 'satis' : 'duzeltme') as StockMovement['type'],
            amount: sm.amount || 0,
            before: sm.before || 0,
            after: sm.after || 0,
            note: '',
            date: now,
          }];
        }
      }
    }
  }

  if (dbUpdates.cashTransaction) {
    const nowIso = new Date().toISOString();
    const kasaEntries: KasaEntry[] = dbUpdates.cashTransaction.map((ct) => ({
      id: genId(),
      createdAt: nowIso,
      updatedAt: nowIso,
      ...ct,
    }));
    next.kasa = [...(next.kasa || []), ...kasaEntries];
  } else if (dbUpdates.kasa) {
    next.kasa = [...(next.kasa || []), ...dbUpdates.kasa!];
  }

  if (dbUpdates.cari) {
    next.cari = next.cari.map((c) => {
      const update = dbUpdates.cari!.find((u) => u.cariId === c.id);
      return update ? { ...c, balance: (c.balance || 0) + update.balanceChange } : c;
    });
  }

  if (dbUpdates.newProduct) {
    next.products = [...(next.products || []), dbUpdates.newProduct!];
  }

  if (dbUpdates.newCari) {
    next.cari = [...(next.cari || []), dbUpdates.newCari!];
  }

  if (dbUpdates.sale) {
    const existingIndex = next.sales.findIndex((s) => s.id === dbUpdates.sale!.id);
    if (existingIndex >= 0) {
      next.sales[existingIndex] = { ...next.sales[existingIndex], ...dbUpdates.sale };
    } else {
      next.sales = [...next.sales, dbUpdates.sale!];
    }
  }

  return {
    ...next,
    _version: (prev._version || 0) + 1,
  };
}
