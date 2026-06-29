import { describe, it, expect } from 'vitest';
import { pickKey, safeArray, narrowRecord, withKey } from './dbAccess';

describe('dbAccess', () => {
  describe('pickKey', () => {
    it('returns typed value when key exists', () => {
      const db = { name: 'test', count: 42 };
      expect(pickKey<string>(db, 'name')).toBe('test');
      expect(pickKey<number>(db, 'count')).toBe(42);
    });

    it('returns undefined when key is missing', () => {
      const db = { name: 'test' };
      expect(pickKey<string>(db, 'missing')).toBeUndefined();
    });

    it('returns undefined for null input', () => {
      expect(pickKey<string>(null, 'key')).toBeUndefined();
    });

    it('returns undefined for non-object input', () => {
      expect(pickKey<string>(42, 'key')).toBeUndefined();
      expect(pickKey<string>('string', 'key')).toBeUndefined();
      expect(pickKey<string>(undefined, 'key')).toBeUndefined();
    });
  });

  describe('safeArray', () => {
    it('returns array as-is when valid', () => {
      const arr = [1, 2, 3];
      expect(safeArray<number>(arr)).toBe(arr);
    });

    it('returns empty array for non-array values', () => {
      expect(safeArray<number>(null)).toEqual([]);
      expect(safeArray<number>(undefined)).toEqual([]);
      expect(safeArray<number>('string')).toEqual([]);
      expect(safeArray<number>(42)).toEqual([]);
      expect(safeArray<number>({})).toEqual([]);
    });

    it('preserves type parameter', () => {
      const result = safeArray<{ id: string }>([{ id: '1' }]);
      expect(result[0].id).toBe('1');
    });
  });

  describe('narrowRecord', () => {
    it('returns object as T when valid', () => {
      const value = { foo: 'bar', count: 42 };
      const result = narrowRecord<{ foo: string; count: number }>(value);
      expect(result).toEqual(value);
    });

    it('returns undefined for non-object values', () => {
      expect(narrowRecord<{ x: number }>(null)).toBeUndefined();
      expect(narrowRecord<{ x: number }>(undefined)).toBeUndefined();
      expect(narrowRecord<{ x: number }>('string')).toBeUndefined();
      expect(narrowRecord<{ x: number }>(42)).toBeUndefined();
    });
  });

  describe('withKey', () => {
    it('creates new object with updates', () => {
      const orig = { a: 1, b: 2 };
      const updated = withKey(orig, { b: 20, c: 30 });
      expect(updated).toEqual({ a: 1, b: 20, c: 30 });
      expect(orig).toEqual({ a: 1, b: 2 });
    });

    it('does not mutate original', () => {
      const orig: { a: number } = { a: 1 };
      withKey(orig, { a: 2 });
      expect(orig.a).toBe(1);
    });
  });
});
