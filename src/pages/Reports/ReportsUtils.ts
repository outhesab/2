import { Period } from './types';

export function periodDates(p: Period, from: string, to: string): { start: Date; end: Date } {
  const now = new Date();
  if (p === 'bu_ay') return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  if (p === 'gecen_ay')
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  if (p === 'bu_yil') return { start: new Date(now.getFullYear(), 0, 1), end: now };
  return {
    start: from ? new Date(from) : new Date(2000, 0, 1),
    end: to ? new Date(to + 'T23:59:59') : now,
  };
}
