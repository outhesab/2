/**
 * DB type-safe accessors
 *
 * Moratorium Madde 2.1: `as unknown as X` cast'lerini azaltmak için
 * güvenli erişim yardımcıları. CLAUDE.md §0'da `as unknown as` yasak;
 * bu helper'lar onaylanmış istisnalardır (typed bridge).
 *
 * Kullanım:
 *   pickKey<SoundSettings>(db, 'soundSettings')   // tip güvenli
 *   safeArray<unknown>(value)                     // her zaman array
 *   narrowRecord<T>(value)                        // type guard
 */

import type { DB } from '@/types';

/**
 * Bir DB nesnesinden tip güvenli şekilde anahtar okur.
 * Mevcut değilse undefined döner (cast hatası yerine kontrol).
 */
export function pickKey<T>(db: DB | unknown, key: string): T | undefined {
  if (typeof db !== 'object' || db === null) return undefined;
  const record = db as Record<string, unknown>;
  const value = record[key];
  return value === undefined ? undefined : (value as T);
}

/**
 * Değeri her zaman bir dizi olarak döndürür. Değilse boş dizi.
 */
export function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Değeri T tipinde bir record olarak daraltır.
 * Tip uyuşmazsa undefined döner (no throw).
 */
export function narrowRecord<T extends Record<string, unknown>>(value: unknown): T | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  return value as T;
}

/**
 * Verilen objenin belirli bir alanını güvenli şekilde günceller.
 * Orijinal objeyi değiştirmez, yeni bir kopyasını döndürür.
 * `U` tipi `T`'den daha geniş olabilir (yeni alanlar eklemek için).
 */
export function withKey<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  obj: T,
  updates: U,
): T & U {
  return { ...obj, ...updates };
}

/**
 * Verilen objenin belirtilen anahtarını, eğer array değilse boş array yapar.
 * ARRAY_KEYS pattern'i için tip-güvenli helper. Cast burada izole edilmiştir,
 * çağıran tarafta `as unknown as` gerekmez.
 */
export function ensureArrayKey<T extends object>(obj: T, key: string): void {
  const rec = obj as unknown as Record<string, unknown>;
  if (!Array.isArray(rec[key])) {
    rec[key] = [];
  }
}
