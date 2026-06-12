import type { DB } from '@/types';

export type Tab = 'ozet' | 'satis' | 'urun' | 'cari' | 'kasa' | 'olusturucu';
export type Period = 'bu_ay' | 'gecen_ay' | 'bu_yil' | 'ozel';

export interface ReportProps {
  db: DB;
  start: Date;
  end: Date;
}
