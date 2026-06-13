import { trimAuditLog } from '@/lib/auditEngine';
import { logger } from '@/lib/logger';
import { validateTransaction } from '@/lib/ruleEngine';
import { saveToFirebase } from './sync';
import { getUserSession } from '@/lib/userManager';
import type { DB, RuleViolation, AuditEntry } from '@/types';
import type { IntentResult } from '@/domain/types';

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
  const { dbUpdates } = data;
  const next: DB = { ...prev };

  if (dbUpdates.products) {
    next.products = next.products.map((p) => {
      const update = dbUpdates.products!.find((u) => u.id === p.id);
      return update ? { ...p, stock: update.newStock } : p;
    });
  }

  if (dbUpdates.kasa) {
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
    next.sales = [...(next.sales || []), dbUpdates.sale!];
  }

  return {
    ...next,
    _version: (prev._version || 0) + 1,
  };
}
