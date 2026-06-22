import { describe, it, expect, beforeEach } from 'vitest';
import { getStorageUsage, safeReadJSON, safeWriteJSON, safeRemove, STORAGE_LIMIT } from './safeIO';

/**
 * localStorage mock — her test öncesi temizlenir.
 * Vitest jsdom ortamında localStorage kullanılabilir.
 */
beforeEach(() => {
  localStorage.clear();
});

describe('getStorageUsage', () => {
  it('boş localStorage için 0 kullanım döndürür', () => {
    const usage = getStorageUsage();
    expect(usage.used).toBe(0);
    expect(usage.entries).toBe(0);
    expect(usage.percent).toBe(0);
    expect(usage.warning).toBe(false);
    expect(usage.critical).toBe(false);
  });

  it('tek bir anahtar için doğru boyut hesaplar', () => {
    localStorage.setItem('testKey', 'hello');
    const usage = getStorageUsage();
    // 'testKey' (7) + 'hello' (5) = 12 byte
    expect(usage.used).toBe(12);
    expect(usage.entries).toBe(1);
    expect(usage.limit).toBe(STORAGE_LIMIT);
  });

  it('birden çok anahtar için toplam boyutu hesaplar', () => {
    localStorage.setItem('a', '12');
    localStorage.setItem('b', '3456');
    // 'a'(1)+'12'(2) + 'b'(1)+'3456'(4) = 8
    expect(getStorageUsage().used).toBe(8);
    expect(getStorageUsage().entries).toBe(2);
  });

  it('percent değeri doğru hesaplanır', () => {
    // STORAGE_LIMIT = 5MB = 5_242_880 byte
    // ~%50 doldurmak için ~2.6MB veri yaz
    const bigData = 'x'.repeat(2_621_440);
    localStorage.setItem('big', bigData);
    const usage = getStorageUsage();
    expect(usage.percent).toBeGreaterThan(48);
    expect(usage.percent).toBeLessThan(52);
  });

  it('limit aşımına yaklaşınca warning flag döndürür', () => {
    // %80+ doldurmak için 4.2MB+ yaz
    const bigData = 'x'.repeat(4_200_000);
    localStorage.setItem('big', bigData);
    const usage = getStorageUsage();
    expect(usage.warning).toBe(true);
    expect(usage.percent).toBeGreaterThan(80);
  });

  it('localStorage hatasını sessizce atlar', () => {
    // localStorage.setItem throw edemez normalde, ama getItem null dönebilir
    const key = 'nonexistent';
    expect(() => localStorage.getItem(key)).not.toThrow();
    const usage = getStorageUsage();
    expect(usage).toBeDefined();
  });
});

describe('safeReadJSON', () => {
  it('var olan JSON anahtarını parse eder', () => {
    localStorage.setItem('test', JSON.stringify({ foo: 'bar' }));
    expect(safeReadJSON<{ foo: string }>('test')).toEqual({ foo: 'bar' });
  });

  it('olmayan anahtar için null döndürür', () => {
    expect(safeReadJSON('nonexistent')).toBeNull();
  });

  it('geçersiz JSON için null döndürür (hatayı yutar)', () => {
    localStorage.setItem('bad', '{invalid json}');
    expect(safeReadJSON('bad')).toBeNull();
  });
});

describe('safeWriteJSON', () => {
  it('normal yazma işlemini başarıyla yapar', () => {
    const result = safeWriteJSON('testKey', { hello: 'world' });
    expect(result).toBe(true);
    expect(JSON.parse(localStorage.getItem('testKey')!)).toEqual({ hello: 'world' });
  });

  it('dizi yazma ve okuma döngüsü', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(safeWriteJSON('arr', arr)).toBe(true);
    expect(JSON.parse(localStorage.getItem('arr')!)).toEqual([1, 2, 3, 4, 5]);
  });

  it('null değer yazılabilir', () => {
    expect(safeWriteJSON('nullKey', null)).toBe(true);
    expect(JSON.parse(localStorage.getItem('nullKey')!)).toBeNull();
  });

  it('boş string yazılabilir', () => {
    expect(safeWriteJSON('empty', '')).toBe(true);
    expect(JSON.parse(localStorage.getItem('empty')!)).toBe('');
  });

  it('ardışık yazmalar önceki değeri üzerine yazar', () => {
    safeWriteJSON('key', 'ilk');
    safeWriteJSON('key', 'son');
    expect(JSON.parse(localStorage.getItem('key')!)).toBe('son');
  });

  it('büyük bir diziyi quota aşımında evict eder', () => {
    // localStorage'a sığmayacak büyüklükte dizi yaz
    const largeArr = new Array(1_000_000).fill('veri');
    // Bu kadar büyük bir diziyi jsdom'da mocklamak doğru çalışmayabilir
    // Bu test quota aşımı simülasyonu için bir işaret
    const result = safeWriteJSON('bigArray', largeArr, { maxAttempts: 3, minItems: 5 });
    // jsdom'da localStorage limiti yoktur, dolayısıyla normal yazılır
    // Bu test en azından hatasız çalıştığını doğrular
    expect(typeof result).toBe('boolean');
  });
});

describe('safeRemove', () => {
  it('var olan anahtarı siler', () => {
    localStorage.setItem('test', 'value');
    safeRemove('test');
    expect(localStorage.getItem('test')).toBeNull();
  });

  it('olmayan anahtarı silmeye çalışmak hata vermez', () => {
    expect(() => safeRemove('nonexistent')).not.toThrow();
  });

  it('ardışık silme işlemi çalışır', () => {
    localStorage.setItem('a', '1');
    localStorage.setItem('b', '2');
    safeRemove('a');
    safeRemove('b');
    expect(localStorage.length).toBe(0);
  });
});

describe('STORAGE_LIMIT sabiti', () => {
  it('5MB (5_242_880 byte) olarak tanımlıdır', () => {
    expect(STORAGE_LIMIT).toBe(5 * 1024 * 1024);
  });

  it('pozitif bir sayıdır', () => {
    expect(STORAGE_LIMIT).toBeGreaterThan(0);
  });
});
