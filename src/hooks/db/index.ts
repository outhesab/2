import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  STORAGE_KEY,
  saveToIndexedSnapshot,
  loadFromIndexedSnapshot,
  loadFromStorage,
  saveToStorage,
} from '@/lib/db/storage';
import { createAuditEntry, trimAuditLog } from '@/lib/auditEngine';
import { logger } from '@/lib/logger';
import { safeClone } from '@/lib/safeClone';
import { isGuestSession, getUserSession } from '@/lib/userManager';
import type { DB, RuleViolation } from '@/types';
import { saveToFirebase, loadFromFirebase, emitSync, type SyncStatus } from './sync';
import { type RestoreReport } from './backup';
import {
  validateAndClassify,
  computeAuditStatus,
  saveBlockedState,
  saveAppliedState,
  getFirebasePromise,
} from './dbHelpers';
import { useDBQueries } from './useDBQueries';
import { useDBActions } from './useDBActions';
import { useDBBackup } from './useDBBackup';

export interface DBError {
  message: string;
  code: string;
  timestamp: string;
  recoverable: boolean;
  context?: Record<string, unknown>;
}

export type { SyncStatus, RestoreReport };

// Global sync lock
let _pendingFirebasePromise: Promise<void> | null = null;
export function getPendingFirebasePromise(): Promise<void> | null { return _pendingFirebasePromise; }
export function setPendingFirebasePromise(p: Promise<void> | null): void { _pendingFirebasePromise = p; }

export function useDB() {
  const [db, setDb] = useState<DB>(loadFromStorage);
  const [dbError, setDbError] = useState<DBError | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearError = useCallback(() => setDbError(null), []);

  useEffect(() => {
    emitSync('loading');
    (async () => {
      const session = getUserSession();
      if (!session) {
        emitSync('idle');
        return;
      }

      const cloudDb = await loadFromFirebase(session.userId);
      if (cloudDb && (cloudDb._version || 0) > (db._version || 0)) {
        saveToStorage(cloudDb);
        await saveToIndexedSnapshot(cloudDb);
        setDb(cloudDb);
      }
      if (!localStorage.getItem(STORAGE_KEY)) {
        const snap = await loadFromIndexedSnapshot();
        if (snap) {
          saveToStorage(snap);
          setDb(snap);
        }
      }
      emitSync('idle');
    })();
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const undoStackRef = useRef<DB[]>([]);
  const MAX_UNDO = 30;

  const processSave = useCallback(
    (
      prev: DB,
      updater: (prev: DB) => DB,
      opts: {
        action: string;
        entity: string;
        entityId?: string;
        detail?: string;
        blockMsg: string;
        captureUndo?: boolean;
        onViolation?: (violations: RuleViolation[]) => void;
        guarded?: boolean;
      },
    ): DB => {
      const t = logger.time('db', opts.action);
      if (isGuestSession()) {
        t.end({ version: prev._version, guestBlocked: true });
        return prev;
      }
      try {
        let next = updater(prev);
        (next as DB & { _lastSyncAt?: string })._lastSyncAt = new Date().toISOString();
        if (next.stockMovements && next.stockMovements.length > 1000) {
          next = { ...next, stockMovements: next.stockMovements.slice(0, 1000) };
        }

        const { violations, hasBlock, hasWarn } = validateAndClassify(prev, next, `${opts.action}: Rule Engine`);
        
        // Guarded mode: only care about blocks, ignore warnings
        const effectiveViolations = opts.guarded 
          ? violations.filter(v => v.severity === 'block') 
          : violations;
        const effectiveHasBlock = hasBlock;
        const effectiveHasWarn = opts.guarded ? false : hasWarn;

        if ((effectiveHasBlock || effectiveHasWarn) && opts.onViolation) opts.onViolation(effectiveViolations);

        const auditStatus = computeAuditStatus(effectiveHasBlock, effectiveHasWarn);
        const entry = createAuditEntry({
          action: opts.action,
          entity: opts.entity,
          entityId: opts.entityId,
          prevDB: Object.freeze({ ...prev }),
          nextDB: next,
          status: auditStatus,
          violations: effectiveViolations.length > 0 ? effectiveViolations : undefined,
          detail: opts.detail,
        });

        if (effectiveHasBlock) {
          return saveBlockedState(prev, entry, effectiveViolations, saveToStorage, saveToIndexedSnapshot, (meta) => t.end(meta), opts.blockMsg);
        }

        if (opts.captureUndo) {
          undoStackRef.current = [...undoStackRef.current.slice(-(MAX_UNDO - 1)), safeClone(prev)];
        }

        return saveAppliedState(next, entry, saveToStorage, saveToIndexedSnapshot, syncTimer, (meta) => t.end(meta), { warned: effectiveHasWarn });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        t.end({ error: error.message });
        setDbError({ message: error.message, code: `${opts.action.toUpperCase()}_FAILED`, timestamp: new Date().toISOString(), recoverable: true });
        return prev;
      }
    },
    [],
  );

  const save = useCallback(
    (updater: (prev: DB) => DB) => {
      setDb((prev) => processSave(prev, updater, { action: 'save', entity: 'DB', blockMsg: 'İşlem engellendi', captureUndo: true }));
    },
    [processSave],
  );

  const saveGuarded = useCallback(
    (updater: (prev: DB) => DB) => {
      setDb((prev) => processSave(prev, updater, { action: 'save_guarded', entity: 'DB', blockMsg: 'İşlem engellendi', captureUndo: true, guarded: true }));
    },
    [processSave],
  );

  const undo = useCallback((): boolean => {
    if (isGuestSession()) return false;
    const stack = undoStackRef.current;
    if (stack.length === 0) return false;
    const target = stack.pop()!;
    setDb((prev) => {
      const restored: DB = {
        ...target,
        _version: (prev._version || 0) + 1,
        _auditLog: trimAuditLog([
          createAuditEntry({ action: 'undo', entity: 'DB', prevDB: prev, nextDB: target, status: 'applied' }),
          ...(prev._auditLog || []),
        ]),
      };
      saveToStorage(restored);
      void saveToIndexedSnapshot(restored);
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        const session = getUserSession();
        if (session && !getFirebasePromise()) {
          void saveToFirebase(restored, session.userId);
        }
      }, 1200);
      return restored;
    });
    return true;
  }, []);

  const clearUndoStack = useCallback(() => { undoStackRef.current = []; }, []);

  const queries = useDBQueries(db);
  const actions = useDBActions(db, save);
  const backup = useDBBackup(db, setDb);

  return useMemo(
    () => ({
      db,
      save,
      saveGuarded,
      undo,

      clearUndoStack,
      dbError,
      clearError,
      ...queries,
      ...actions,
      ...backup,
      emitSync,
    }),
    [db, save, saveGuarded, undo, clearUndoStack, dbError, clearError, queries, actions, backup],
  );
}
