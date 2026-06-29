import { describe, it, expect } from 'vitest';
import { checkDBStructure, DBStructureSchema } from './saveSchema';
import { makeDefaultDB } from '@/lib/dbDefaults';

describe('saveSchema', () => {
  describe('checkDBStructure', () => {
    it('returns ok=true for a valid default DB', () => {
      const db = makeDefaultDB();
      const result = checkDBStructure(db);
      expect(result.ok).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('returns ok=false for null input', () => {
      const result = checkDBStructure(null);
      expect(result.ok).toBe(false);
      expect(result.issues).toContain('<root>: object bekleniyor');
    });

    it('returns ok=false for non-object input', () => {
      expect(checkDBStructure('string').ok).toBe(false);
      expect(checkDBStructure(42).ok).toBe(false);
      expect(checkDBStructure(undefined).ok).toBe(false);
    });

    it('detects missing _version field', () => {
      const db = makeDefaultDB();
      const broken = { ...db, _version: undefined };
      const result = checkDBStructure(broken);
      expect(result.ok).toBe(false);
      expect(result.issues.some((i) => i.includes('_version'))).toBe(true);
    });

    it('detects wrong _version type', () => {
      const db = makeDefaultDB();
      const broken = { ...db, _version: '3.43.0' as unknown as number };
      const result = checkDBStructure(broken);
      expect(result.ok).toBe(false);
      expect(result.issues.some((i) => i.includes('_version'))).toBe(true);
    });

    it('detects missing array field (sales)', () => {
      const db = makeDefaultDB();
      const broken = { ...db, sales: undefined };
      const result = checkDBStructure(broken);
      expect(result.ok).toBe(false);
      expect(result.issues.some((i) => i.includes('sales'))).toBe(true);
    });

    it('detects wrong type for array field (products as string)', () => {
      const db = makeDefaultDB();
      const broken = { ...db, products: 'invalid' as unknown as never[] };
      const result = checkDBStructure(broken);
      expect(result.ok).toBe(false);
      expect(result.issues.some((i) => i.includes('products'))).toBe(true);
    });

    it('detects missing company object', () => {
      const db = makeDefaultDB();
      const broken = { ...db, company: undefined };
      const result = checkDBStructure(broken);
      expect(result.ok).toBe(false);
      expect(result.issues.some((i) => i.includes('company'))).toBe(true);
    });

    it('detects missing pelletSettings object', () => {
      const db = makeDefaultDB();
      const broken = { ...db, pelletSettings: undefined };
      const result = checkDBStructure(broken);
      expect(result.ok).toBe(false);
      expect(result.issues.some((i) => i.includes('pelletSettings'))).toBe(true);
    });

    it('accepts optional aiActionLog as undefined', () => {
      const db = makeDefaultDB();
      // aiActionLog is optional, no issue if missing
      const result = checkDBStructure(db);
      expect(result.ok).toBe(true);
    });

    it('handles multiple errors at once', () => {
      const broken = {
        _version: 'wrong',
        products: 'not array',
        sales: null,
        // missing many fields
      };
      const result = checkDBStructure(broken);
      expect(result.ok).toBe(false);
      expect(result.issues.length).toBeGreaterThan(2);
    });
  });

  describe('DBStructureSchema (direct)', () => {
    it('exposes the Zod schema', () => {
      expect(DBStructureSchema).toBeDefined();
      expect(typeof DBStructureSchema.safeParse).toBe('function');
    });

    it('safeParse returns success for valid DB', () => {
      const db = makeDefaultDB();
      const result = DBStructureSchema.safeParse(db);
      expect(result.success).toBe(true);
    });
  });
});
