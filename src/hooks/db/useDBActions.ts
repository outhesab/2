import { useCallback } from 'react';
import type { DB } from '@/types';
import { genId } from '@/lib/utils-tr';

export function useDBActions(
  db: DB,
  save: (updater: (prev: DB) => DB) => void,
) {
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
    logActivity,
    saveWithLog,
  };
}
