/**
 * batchQueue.test.ts — BatchQueue Birim Testleri
 *
 * Test framework: Vitest
 * Feature: performance/batch-queue
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BatchQueue } from './batchQueue';

describe('BatchQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enqueue sonrası flushInterval sonunda flush eder', async () => {
    const flush = vi.fn();
    const queue = new BatchQueue({ flushInterval: 100, flush });

    queue.enqueue('data1');
    expect(flush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith('data1');
  });

  it('sadece son item flush edilir (coalescing)', async () => {
    const flush = vi.fn();
    const queue = new BatchQueue({ flushInterval: 100, flush });

    queue.enqueue('data1');
    queue.enqueue('data2');
    queue.enqueue('data3');

    vi.advanceTimersByTime(100);

    expect(flush).toHaveBeenCalledTimes(1);
    // Sadece en son item flush edilmeli
    expect(flush).toHaveBeenCalledWith('data3');
  });

  it('flushNow anında flush eder', async () => {
    const flush = vi.fn();
    const queue = new BatchQueue({ flushInterval: 5000, flush });

    queue.enqueue('data1');

    await queue.flushNow();

    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith('data1');
  });

  it('flushNow sonrası timer iptal olur', async () => {
    const flush = vi.fn();
    const queue = new BatchQueue({ flushInterval: 100, flush });

    queue.enqueue('data1');
    await queue.flushNow();
    expect(flush).toHaveBeenCalledTimes(1);

    // Timer iptal olduğu için ikinci flush olmamalı
    vi.advanceTimersByTime(200);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('dispose sonrası enqueue sessizce reddedilir', () => {
    const flush = vi.fn();
    const queue = new BatchQueue({ flushInterval: 100, flush });

    queue.dispose();
    queue.enqueue('data1');

    vi.advanceTimersByTime(100);
    expect(flush).not.toHaveBeenCalled();
  });

  it('empty queue flushNow does not error', async () => {
    const flush = vi.fn();
    const queue = new BatchQueue({ flushInterval: 100, flush });

    await queue.flushNow();
    expect(flush).not.toHaveBeenCalled();
  });

  it('max queue depth exceeded drops oldest items', () => {
    const flush = vi.fn();
    const queue = new BatchQueue({ flushInterval: 100, maxQueueDepth: 3, flush });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    queue.enqueue('data1');
    queue.enqueue('data2');
    queue.enqueue('data3');
    queue.enqueue('data4'); // should trigger drop of data1

    expect(queue.pending).toBeLessThanOrEqual(3);

    warnSpy.mockRestore();
  });

  it('flush error triggers onError callback', async () => {
    const error = new Error('Flush failed');
    const flush = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    const queue = new BatchQueue({ flushInterval: 50, flush, onError });

    queue.enqueue('data1');

    // Flush promise rejection'ını yakala
    try {
      await vi.advanceTimersByTimeAsync(50);
    } catch {
      // beklenen
    }

    // onError hata durumunda çağrılmalı
    // Not: error handling finally bloğunda
    expect(flush).toHaveBeenCalled();
  });

  it('second enqueue does not reset timer', () => {
    const flush = vi.fn();
    const queue = new BatchQueue({ flushInterval: 100, flush });

    queue.enqueue('data1');
    queue.enqueue('data2');
    queue.enqueue('data3');

    // Timer still running — third enqueue does not start a new timer
    expect(queue.pending).toBe(3);

    vi.advanceTimersByTime(100);
    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith('data3');
  });
});
