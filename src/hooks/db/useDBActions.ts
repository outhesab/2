import { useCallback } from 'react';
import type { DB, RuleViolation, DBError } from '@/types';
import { genId } from '@/lib/utils-tr';
import { isGuestSession, getUserSession } from '@/lib/userManager';
import { safeClone } from '@/lib/safeClone';
import { saveToStorage, saveToIndexedSnapshot } from '@/lib/db/storage';
import { createAuditEntry, trimAuditLog } from '@/lib/auditEngine';
import { validateAndClassify, computeAuditStatus, saveBlockedState, saveAppliedState } from './dbHelpers';
import { saveToFirebase } from './sync';
import { getFirebasePromise } from './dbHelpers';
import { TransactionManager } from './TransactionManager';
import { domainEventBus } from '@/domain/eventBus';

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
      if (isGuestSession()) {
        return prev;
      }

      // Execute via TransactionManager for atomicity and fail-safe snapshot/rollback
      const txResult = TransactionManager.run(
        prev,
        (p) => {
          let next = updater(p);
          (next as DB & { _lastSyncAt?: string })._lastSyncAt = new Date().toISOString();
          if (next.stockMovements && next.stockMovements.length > 1000) {
            next = { ...next, stockMovements: next.stockMovements.slice(0, 1000) };
          }
          return next;
        },
        (p, n) => validateAndClassify(p, n, `${opts.action}: Rule Engine`)
      );

      if (txResult.error) {
        domainEventBus.emitError(txResult.error, `${opts.action.toUpperCase()}_FAILED`);
        setDbError({
          message: txResult.error,
          code: `${opts.action.toUpperCase()}_FAILED`,
          timestamp: new Date().toISOString(),
          recoverable: true,
        });
        return prev; // Rollback already handled by returning prev
      }

      const { violations, hasBlock, hasWarn } = validateAndClassify(prev, txResult.db, `${opts.action}: Final Check`);

      if (hasBlock) {
        const msg = violations.find(v => v.severity === 'block')?.message || opts.blockMsg;
        domainEventBus.emitError(msg, 'BLOCK_VIOLATION');
      } else if (hasWarn) {
        const msg = violations.find(v => v.severity === 'warn')?.message || 'İşlem sırasında uyarılar oluştu';
        domainEventBus.emitWarning(msg, 'WARN_VIOLATION');
      }

      const effectiveViolations = opts.guarded ? violations.filter((v) => v.severity === 'block') : violations;
      const effectiveHasBlock = txResult.blocked;
      const effectiveHasWarn = opts.guarded ? false : hasWarn;

      if ((effectiveHasBlock || effectiveHasWarn) && opts.onViolation) opts.onViolation(effectiveViolations);

      const auditStatus = computeAuditStatus(effectiveHasBlock || false, effectiveHasWarn);
      const entry = createAuditEntry({
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        prevDB: Object.freeze({ ...prev }),
        nextDB: txResult.db,
        status: auditStatus,
        violations: effectiveViolations.length > 0 ? effectiveViolations : undefined,
        detail: opts.detail,
      });

      if (effectiveHasBlock) {
        return saveBlockedState(
          prev,
          entry,
          effectiveViolations,
          saveToStorage,
          saveToIndexedSnapshot,
          () => {},
          opts.blockMsg,
        );
      }

      if (opts.captureUndo) {
        undoStackRef.current = [...undoStackRef.current.slice(-(MAX_UNDO - 1)), safeClone(prev)];
      }

      // Manual backup before save (Phase 5 of Do's)
      if (opts.action !== 'auto_backup') {
        const snap = safeClone(txResult.db);
        void saveToIndexedSnapshot(snap);
      }

      return saveAppliedState(txResult.db, entry, saveToStorage, saveToIndexedSnapshot, syncTimer, () => {}, {
        warned: effectiveHasWarn,
      });
    },
    [setDbError, undoStackRef, syncTimer],
  );

  const _save = useCallback(
    (updater: (prev: DB) => DB, guarded: boolean) => {
      const action = guarded ? 'save_guarded' : 'save';
      setDb((prev) =>
        processSave(prev, updater, { action, entity: 'DB', blockMsg: 'İşlem engellendi', captureUndo: true, guarded }),
      );
    },
    [setDb, processSave],
  );

  const save = useCallback((updater: (prev: DB) => DB) => _save(updater, false), [_save]);

  const saveGuarded = useCallback((updater: (prev: DB) => DB) => _save(updater, true), [_save]);

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

  const clearUndoStack = useCallback(() => {
    undoStackRef.current = [];
  }, [undoStackRef]);

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
