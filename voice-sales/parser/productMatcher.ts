// voice-sales/parser/productMatcher.ts

import type { Product } from '@/types';

export interface MatchResult {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  score: number;
}

/**
 * Fuzzy product matcher for Turkish voice input.
 * Handles: typos, partial matches, number-to-word, synonyms.
 */
export function findBestProductMatch(
  query: string,
  products: Product[],
  threshold: number = 0.5,
): MatchResult | null {
  if (!query || products.length === 0) return null;

  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(normalizedQuery);

  let bestMatch: MatchResult | null = null;
  let bestScore = 0;

  for (const product of products) {
    if (product.deleted) continue;

    const normalizedName = normalizeText(product.name);
    const nameTokens = tokenize(normalizedName);

    // Strategy 1: Exact substring match (highest priority)
    if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
      const score = 0.95;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { id: product.id, name: product.name, price: product.price, cost: product.cost, stock: product.stock, score };
      }
      continue;
    }

    // Strategy 2: Token overlap (Jaccard similarity)
    const overlapScore = tokenOverlap(queryTokens, nameTokens);
    if (overlapScore > bestScore) {
      bestScore = overlapScore;
      bestMatch = { id: product.id, name: product.name, price: product.price, cost: product.cost, stock: product.stock, score: overlapScore };
    }

    // Strategy 3: Levenshtein distance on full strings
    if (bestScore < 0.7) {
      const levScore = 1 - levenshtein(normalizedQuery, normalizedName) / Math.max(normalizedQuery.length, normalizedName.length);
      if (levScore > bestScore) {
        bestScore = levScore;
        bestMatch = { id: product.id, name: product.name, price: product.price, cost: product.cost, stock: product.stock, score: levScore };
      }
    }
  }

  return bestScore >= threshold ? bestMatch : null;
}

/**
 * Normalize Turkish text for matching.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into words.
 */
function tokenize(text: string): string[] {
  return text.split(' ').filter((t) => t.length > 0);
}

/**
 * Jaccard similarity between two token sets.
 */
function tokenOverlap(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Extract quantity from Turkish text.
 * "2 tane", "iki tane", "bir adet", "üçü", "5'ini"
 */
export function extractQuantity(text: string): number {
  const numberWords: Record<string, number> = {
    'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4, 'beş': 5,
    'altı': 6, 'yedi': 7, 'sekiz': 8, 'dokuz': 9, 'on': 10,
    'yirmi': 20, 'otuz': 30, 'kırk': 40, 'elli': 50,
    'yüz': 100, 'bin': 1000,
  };

  const normalized = normalizeText(text);

  // Direct number: "2 tane", "5 adet"
  const numMatch = normalized.match(/^(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);

  // Turkish number word: "iki tane", "bir adet"
  for (const [word, num] of Object.entries(numberWords)) {
    if (normalized.startsWith(word)) return num;
  }

  // Suffix: "üçü", "beşini", "ikisi"
  const suffixMatch = normalized.match(/^(bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on)(si|i|ü|si|ını|ini)/);
  if (suffixMatch) {
    const word = suffixMatch[1];
    return numberWords[word] || 1;
  }

  // Default: 1
  return 1;
}

/**
 * Strip quantity words from query to get product name.
 * "2 tane 80'lik soba" → "80'lik soba"
 */
export function stripQuantityWords(text: string): string {
  const normalized = normalizeText(text);

  // Remove leading numbers
  let result = normalized.replace(/^\d+\s*/, '');

  // Remove Turkish number words
  const numberWords = ['bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'yüz', 'bin'];
  for (const word of numberWords) {
    result = result.replace(new RegExp(`^${word}\\s*`), '');
  }

  // Remove quantity suffixes
  result = result.replace(/\s*(tane|adet|parça|kilo|kg|litre|lt|metre|mt|adet|paket|kutu|şişe|bidon)\s*/g, ' ');

  return result.trim();
}
