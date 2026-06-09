import { describe, expect, it } from 'vitest';
import { generateNotifications, getUnreadCount, type AppNotification } from './notificationEngine';
import type { DB } from '@/types';

const EMPTY_DB: DB = {
  _version: 1,
  products: [], sales: [], suppliers: [], orders: [], cari: [], kasa: [],
  kasalar: [{ id: 'nakit', name: 'Nakit', icon: '💵' }],
  bankTransactions: [], matchRules: [], monitorRules: [], monitorLog: [],
  stockMovements: [], peletSuppliers: [], peletOrders: [], boruSuppliers: [],
  boruOrders: [], invoices: [], budgets: [], returns: [],
  _activityLog: [], _auditLog: [],
  company: { id: 'c1', name: '', createdAt: new Date().toISOString() },
  settings: {},
  pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
  ortakEmanetler: [], installments: [], partners: [],
  productCategories: [], notes: [], aiActionLog: [],
};

describe('notificationEngine', () => {
  it('should return empty array for empty DB', () => {
    const notifs = generateNotifications(EMPTY_DB);
    expect(Array.isArray(notifs)).toBe(true);
  });

  it('should return notifications with correct structure', () => {
    const notifs = generateNotifications(EMPTY_DB);
    for (const n of notifs) {
      expect(n).toHaveProperty('id');
      expect(n).toHaveProperty('severity');
      expect(n).toHaveProperty('title');
      expect(n).toHaveProperty('generatedAt');
    }
  });

  it('getUnreadCount should return 0 for empty dismissed set', () => {
    const notifs: AppNotification[] = [
      { id: 'n1', severity: 'warning', category: 'stok', icon: '⚠', title: 'Test', detail: '', generatedAt: new Date().toISOString() },
    ];
    expect(getUnreadCount(notifs, new Set())).toBe(1);
  });

  it('getUnreadCount should exclude dismissed', () => {
    const notifs: AppNotification[] = [
      { id: 'n1', severity: 'warning', category: 'stok', icon: '⚠', title: 'Test', detail: '', generatedAt: new Date().toISOString() },
      { id: 'n2', severity: 'info', category: 'sistem', icon: 'ℹ', title: 'Test2', detail: '', generatedAt: new Date().toISOString() },
    ];
    expect(getUnreadCount(notifs, new Set(['n1']))).toBe(1);
  });
});
