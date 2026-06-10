import { describe, expect, it } from 'vitest';
import type { DB } from '@/types';
import { runAnomalyDetection } from './anomalyEngine';

const EMPTY_DB: DB = {
  _version: 1,
  products: [],
  sales: [],
  suppliers: [],
  orders: [],
  cari: [],
  kasa: [],
  kasalar: [{ id: 'nakit', name: 'Nakit', icon: '💵' }],
  bankTransactions: [],
  matchRules: [],
  monitorRules: [],
  monitorLog: [],
  stockMovements: [],
  peletSuppliers: [],
  peletOrders: [],
  boruSuppliers: [],
  boruOrders: [],
  invoices: [],
  budgets: [],
  returns: [],
  _activityLog: [],
  _auditLog: [],
  company: { id: 'c1', name: '', createdAt: new Date().toISOString() },
  settings: {},
  pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
  ortakEmanetler: [],
  installments: [],
  partners: [],
  productCategories: [],
  notes: [],
  aiActionLog: [],
};

describe('anomalyEngine', () => {
  it('should export runAnomalyDetection function', () => {
    expect(typeof runAnomalyDetection).toBe('function');
  });

  it('should return AnomalyReport for empty DB', () => {
    const result = runAnomalyDetection(EMPTY_DB);
    expect(result).toHaveProperty('anomalies');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.anomalies)).toBe(true);
  });
});
