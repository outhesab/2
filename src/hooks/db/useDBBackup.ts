import { useCallback } from 'react';
import type { DB } from '@/types';
import { Encoding } from '@capacitor/filesystem';
import {
  saveBackupToFirebase,
  restoreBackupFromFirebase,
  listBackupsFromFirebase,
  fullRestoreDB,
  type RestoreReport,
} from './backup';
import { makeDefaultDB } from '@/lib/dbDefaults';
import { saveToStorage, saveToIndexedSnapshot } from '@/lib/db/storage';
import { saveToFirebase } from './sync';
import { getUserSession } from '@/lib/userManager';
import { logger } from '@/lib/logger';

export function useDBBackup(
  db: DB,
  setDb: React.Dispatch<React.SetStateAction<DB>>,
) {
  const exportJSON = useCallback(async () => {
    const data = JSON.stringify(db, null, 2);
    const filename = `soba-yedek-${new Date().toISOString().slice(0, 10)}.json`;

    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        await Filesystem.writeFile({
          path: filename,
          data,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        alert(`✅ Yedek kaydedildi!\nKonum: Belgeler/${filename}`);
        return;
      }
    } catch {
      // fallback
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [db]);

  const manualBackup = useCallback(
    async (label?: string): Promise<boolean> => {
      return saveBackupToFirebase(
        db,
        label || `manuel_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`,
      );
    },
    [db],
  );

  const listBackups = useCallback(() => listBackupsFromFirebase(), []);

  const restoreBackup = useCallback(
    async (backupId: string): Promise<{ ok: boolean; report?: RestoreReport }> => {
      const preLabel = `onceki_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`;
      await saveBackupToFirebase(db, preLabel).catch(() => {});

      const restored = await restoreBackupFromFirebase(backupId);
      if (!restored) return { ok: false };

      const def = makeDefaultDB();
      const { db: data, report } = fullRestoreDB(restored, def);
      setDb(data);
      saveToStorage(data);
      void saveToIndexedSnapshot(data);
      const session = getUserSession();
      if (session) {
        await saveToFirebase(data, session.userId);
      } else {
        logger.warn('db', 'Oturum bulunamadı, yedek Firebase\'e yazılamadı');
      }
      return { ok: true, report };
    },
    [db, setDb],
  );

  const importJSON = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string);
          if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            resolve(false);
            return;
          }
          if ('__proto__' in raw || 'constructor' in raw || 'prototype' in raw) {
            resolve(false);
            return;
          }
          const jsonStr = JSON.stringify(raw);
          if (jsonStr.length > 10 * 1024 * 1024) {
            resolve(false);
            return;
          }
          const arrayKeys = ['products', 'sales', 'suppliers', 'kasa', 'cari', 'invoices'];
          for (const key of arrayKeys) {
            if (key in raw && !Array.isArray(raw[key])) {
              resolve(false);
              return;
            }
          }
          const def = makeDefaultDB();
          const { db: data } = fullRestoreDB(raw as DB, def);
          setDb(data);
          saveToStorage(data);
          void saveToIndexedSnapshot(data);
          const session = getUserSession();
          if (session) {
            saveToFirebase(data, session.userId);
          } else {
            logger.warn('db', 'Oturum bulunamadı, içe aktarılan veri Firebase\'e yazılamadı');
          }
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }, [setDb]);

  return {
    exportJSON,
    importJSON,
    manualBackup,
    listBackups,
    restoreBackup,
  };
}
