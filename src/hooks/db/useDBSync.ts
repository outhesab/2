import { useEffect, useRef } from 'react';
import { STORAGE_KEY, saveToIndexedSnapshot, loadFromIndexedSnapshot, saveToStorage } from '@/lib/db/storage';
import { getUserSession } from '@/lib/userManager';
import { loadFromFirebase, emitSync } from './sync';
import type { DB } from '@/types';

export function useDBSync(db: DB, setDb: React.Dispatch<React.SetStateAction<DB>>) {
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timerToClear = syncTimer.current;
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
    return () => {
      if (timerToClear) {
        clearTimeout(timerToClear);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { syncTimer };
}
