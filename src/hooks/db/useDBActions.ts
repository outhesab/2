import { useCallback } from 'react';
import type { DB, RuleViolation, DBError } from '@/types';
import { genId } from '@/lib/utils-tr';
import { logger } from '@/lib/logger';
import { isGuestSession, getUserSession } from '@/lib/userManager';
import { safeClone } from '@/lib/safeClone';
import { saveToStorage, saveToIndexedSnapshot } from '@/lib/db/storage';
import { createAuditEntry, trimAuditLog } from '@/lib/auditEngine';
import {
  validateAndClassify,
  computeAuditStatus,
  saveBlockedState,
  saveAppliedState,
} from './dbHelpers';
import { saveToFirebase } from './sync';
import { getFirebasePromise } from './dbHelpers';

export function useDBActions(
  db: DB,
  setDb: React.Dispatch<React.SetStateAction<DB>>,
  setDbError: React.Dispatch<React.SetStateAction<DBError | null>>,
  undoStackRef: React.MutableRefObject<DB[]>,
  syncTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
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
    [setDbError, undoStackRef, syncTimer],
  );

  const _save = useCallback(
    (updater: (prev: DB) => DB, guarded: boolean) => {
      const action = guarded ? 'save_guarded' : 'save';
      setDb((prev) => processSave(prev, updater, { action, entity: 'DB', blockMsg: 'İşlem engellendi', captureUndo: true, guarded }));
    },
    [setDb, processSave],
  );

  const save = useCallback(
    (updater: (prev: DB) => DB) => _save(updater, false),
    [_save],
  );

  const saveGuarded = useCallback(
    (updater: (prev: DB) => DB) => _save(updater, true),
    [_save],
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
  }, [setDb, undoStackRef, syncTimer]);

  const clearUndoStack = useCallback(() => { undoStackRef.current = []; }, [undoStackRef]);

  const logActivity = useCallback(
    (action: string, detail?: string) => {
      save((prev) => {
        const log = [
          {
            id: genId(),
            action,
            detail: detail || '',
            time: new Date().toISOString(),
          },
          ...(prev._activityLog || []),
        ].slice(0, 200);
        return { ...prev, _activityLog: log };
      });
    },
    [save],
  );

  const saveWithLog = useCallback(
    (updater: (prev: DB) => DB, action?: string, detail?: string) => {
      save((prev) => {
        let next = updater(prev);
        if (action) {
          const log = [
            {
              id: genId(),
              action,
              detail: detail || '',
              time: new Date().toISOString(),
            },
            ...(next._activityLog || []),
          ].slice(0, 200);
          next = { ...next, _activityLog: log };
        }
        return next;
      });
    },
    [save],
  );

  return {
    save,
    saveGuarded,
    undo,
    clearUndoStack,
    logActivity,
    saveWithLog,
  };
}
