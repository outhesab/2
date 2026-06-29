import { useCallback, useMemo, useRef, useState } from 'react';
import { loadFromStorage } from '@/lib/db/storage';
import type { DB } from '@/types';
import { emitSync, type SyncStatus } from './sync';
import { useDBQueries } from './useDBQueries';
import { useDBActions } from './useDBActions';
import { useDBBackup } from './useDBBackup';
import { useDBSync } from './useDBSync';
import { type RestoreReport } from './backup';

export interface DBError {
  message: string;
  code: string;
  timestamp: string;
  recoverable: boolean;
  context?: Record<string, unknown>;
}

export type { SyncStatus, RestoreReport };

export function useDB() {
  const [db, setDb] = useState<DB>(loadFromStorage);
  const [dbError, setDbError] = useState<DBError | null>(null);
  const [isDBReady, setIsDbReady] = useState(false);
  const undoStackRef = useRef<DB[]>([]);

  // Initial load from IndexedDB (higher priority than localStorage)
  useEffect(() => {
    import('@/lib/db/storage').then(async (m) => {
      const snap = await m.loadFromIndexedSnapshot();
      if (snap && snap._version > (db._version || 0)) {
        setDb(snap);
      }
      setIsDbReady(true);
    });
  }, []);

  const { syncTimer } = useDBSync(db, setDb);

  const queries = useDBQueries(db);
  const actions = useDBActions(db, setDb, setDbError, undoStackRef, syncTimer);
  const backup = useDBBackup(db, setDb);

  const clearError = useCallback(() => setDbError(null), []);

  return useMemo(
    () => ({
      db,
      dbError,
      isDBReady,
      clearError,
      ...queries,
      ...actions,
      ...backup,
      emitSync,
    }),
    [db, dbError, isDBReady, clearError, queries, actions, backup],
  );
}
