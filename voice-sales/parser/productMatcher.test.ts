// voice-sales/parser/productMatcher.test.ts

import { describe, it, expect } from 'vitest';
import { findBestProductMatch, extractQuantity, stripQuantityWords } from './productMatcher';
import type { Product } from '@/types';

// ─── Test Data ───────────────────────────────────────────────────

const TEST_PRODUCTS: Product[] = [
  {
    id: 'p1', name: "80'lik Soba", category: 'soba', brand: 'Test',
    cost: 1200, price: 1700, stock: 50, minStock: 5,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'p2', name: '120\'lik Klima', category: 'klima', brand: 'Test',
    cost: 3000, price: 4500, stock: 20, minStock: 3,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'p3', name: 'Tüp Gaz', category: 'aksesuar', brand: 'Test',
    cost: 150, price: 250, stock: 100, minStock: 10,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'p4', name: 'Baca Borusu', category: 'aksesuar', brand: 'Test',
    cost: 80, price: 150, stock: 200, minStock: 20,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'p5', name: 'Kömür 1 Kg', category: 'yakıt', brand: 'Test',
    cost: 20, price: 35, stock: 500, minStock: 50,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
];

// ─── findBestProductMatch Tests ──────────────────────────────────

describe('findBestProductMatch', () => {
  describe('exact matches', () => {
    it('matches exact product name', () => {
      const result = findBestProductMatch("80'lik Soba", TEST_PRODUCTS);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p1');
      expect(result!.score).toBeGreaterThanOrEqual(0.9);
    });

    it('matches case-insensitive', () => {
      const result = findBestProductMatch("80'LIK SOBA", TEST_PRODUCTS);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p1');
    });

    it('matches with Turkish character normalization', () => {
      const result = findBestProductMatch("baca borusu", TEST_PRODUCTS);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p4');
    });
  });

  describe('fuzzy matches', () => {
    it('matches partial name "80 lik"', () => {
      const result = findBestProductMatch("80 lik", TEST_PRODUCTS);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p1');
    });

    it('matches partial name "klima"', () => {
      const result = findBestProductMatch("klima", TEST_PRODUCTS);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p2');
    });

    it('matches with typos "kömrü" → "kömür"', () => {
      const result = findBestProductMatch("komur", TEST_PRODUCTS);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p5');
    });

    it('matches "tüp" → "Tüp Gaz"', () => {
      const result = findBestProductMatch("tup", TEST_PRODUCTS);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p3');
    });
  });

  describe('threshold handling', () => {
    it('returns null for very low match', () => {
      const result = findBestProductMatch("xyzabc123", TEST_PRODUCTS, 0.5);
      expect(result).toBeNull();
    });

    it('returns null for empty query', () => {
      const result = findBestProductMatch("", TEST_PRODUCTS);
      expect(result).toBeNull();
    });

    it('returns null for empty products', () => {
      const result = findBestProductMatch("soba", []);
      expect(result).toBeNull();
    });

    it('skips deleted products', () => {
      const products = [{ ...TEST_PRODUCTS[0], deleted: true }, ...TEST_PRODUCTS.slice(1)];
      const result = findBestProductMatch("80'lik soba", products);
      expect(result).toBeNull();
    });
  });

  describe('scoring', () => {
    it('exact match has highest score', () => {
      const exact = findBestProductMatch("80'lik Soba", TEST_PRODUCTS);
      const fuzzy = findBestProductMatch("80 lik", TEST_PRODUCTS);
      expect(exact!.score).toBeGreaterThan(fuzzy!.score);
    });

    it('returns correct product data', () => {
      const result = findBestProductMatch("klima", TEST_PRODUCTS);
      expect(result!.price).toBe(4500);
      expect(result!.cost).toBe(3000);
      expect(result!.stock).toBe(20);
    });
  });
});

// ─── extractQuantity Tests ───────────────────────────────────────

describe('extractQuantity', () => {
  it('extracts numeric quantity "2 tane"', () => {
    expect(extractQuantity('2 tane')).toBe(2);
  });

  it('extracts Turkish number "iki tane"', () => {
    expect(extractQuantity('iki tane')).toBe(2);
  });

  it('extracts "bir adet"', () => {
    expect(extractQuantity('bir adet')).toBe(1);
  });

  it('extracts "üçü"', () => {
    expect(extractQuantity('üçü')).toBe(3);
  });

  it('extracts "5\'ini"', () => {
    expect(extractQuantity("5'ini")).toBe(5);
  });

  it('extracts "on parça"', () => {
    expect(extractQuantity('on parça')).toBe(10);
  });

  it('extracts "yirmi tane"', () => {
    expect(extractQuantity('yirmi tane')).toBe(20);
  });

  it('defaults to 1 for no quantity', () => {
    expect(extractQuantity('soba')).toBe(1);
  });

  it('extracts from "100 kilo"', () => {
    expect(extractQuantity('100 kilo')).toBe(100);
  });
});

// ─── stripQuantityWords Tests ────────────────────────────────────

describe('stripQuantityWords', () => {
  it('strips "2 tane" from "2 tane 80\'lik soba"', () => {
    expect(stripQuantityWords("2 tane 80'lik soba")).toBe("80'lik soba");
  });

  it('strips "iki tane" from "iki tane klima"', () => {
    expect(stripQuantityWords('iki tane klima')).toBe('klima');
  });

  it('strips "bir adet" from "bir adet tüp"', () => {
    expect(stripQuantityWords('bir adet tüp')).toBe('tüp');
  });

  it('strips unit words "kilo" "kg"', () => {
    expect(stripQuantityWords('5 kilo kömür')).toBe('kömür');
    expect(stripQuantityWords('10 kg kömür')).toBe('kömür');
  });

  it('handles plain product name', () => {
    expect(stripQuantityWords('baca borusu')).toBe('baca borusu');
  });

  it('handles empty string', () => {
    expect(stripQuantityWords('')).toBe('');
  });
});
