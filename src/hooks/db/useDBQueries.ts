import { useCallback } from 'react';
import type { DB } from '@/types';

export function useDBQueries(db: DB) {
  const getKasaBakiye = useCallback(
    (kasaId: string) => {
      return db.kasa
        .filter((k) => !k.deleted && k.kasa === kasaId)
        .reduce((sum, k) => {
          return sum + (k.type === 'gelir' ? k.amount : -k.amount);
        }, 0);
    },
    [db.kasa],
  );

  const getTotalKasa = useCallback(() => {
    return db.kasa.filter((k) => !k.deleted).reduce((sum, k) => sum + (k.type === 'gelir' ? k.amount : -k.amount), 0);
  }, [db.kasa]);

  return {
    getKasaBakiye,
    getTotalKasa,
  };
}
