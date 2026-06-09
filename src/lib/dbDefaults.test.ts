import { describe, expect, it } from 'vitest';
import { makeDefaultDB } from './dbDefaults';

describe('dbDefaults', () => {
  const db = makeDefaultDB();

  it('should return a DB with _version 1', () => {
    expect(db._version).toBe(1);
  });

  it('should have empty arrays for all collections', () => {
    expect(db.products).toEqual([]);
    expect(db.sales).toEqual([]);
    expect(db.suppliers).toEqual([]);
    expect(db.orders).toEqual([]);
    expect(db.cari).toEqual([]);
    expect(db.kasa).toEqual([]);
    expect(db.invoices).toEqual([]);
    expect(db.budgets).toEqual([]);
    expect(db.returns).toEqual([]);
    expect(db._activityLog).toEqual([]);
    expect(db._auditLog).toEqual([]);
  });

  it('should have default kasalar with nakit and banka', () => {
    expect(db.kasalar).toHaveLength(2);
    expect(db.kasalar[0].id).toBe('nakit');
    expect(db.kasalar[1].id).toBe('banka');
  });

  it('should have default pelletSettings', () => {
    expect(db.pelletSettings.gramaj).toBe(14);
    expect(db.pelletSettings.kgFiyat).toBe(6.5);
    expect(db.pelletSettings.cuvalKg).toBe(15);
    expect(db.pelletSettings.critDays).toBe(3);
  });

  it('should have company with random UUID', () => {
    expect(db.company.id).toBeDefined();
    expect(db.company.id.length).toBeGreaterThan(0);
    expect(db.company.createdAt).toBeDefined();
  });

  it('should be a fresh object each call', () => {
    const db2 = makeDefaultDB();
    expect(db2).not.toBe(db);
    expect(db2.company.id).not.toBe(db.company.id);
  });

  it('should have all required fields', () => {
    const requiredFields = ['products', 'sales', 'cari', 'kasa', 'kasalar', 'invoices', 'stockMovements', 'notes', 'aiActionLog'];
    for (const field of requiredFields) {
      expect(db).toHaveProperty(field);
    }
  });
});
