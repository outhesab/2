/**
 * batchQueue.ts — Generic Async Batch Queue
 *
 * Sık tekrarlanan işlemleri (örn: localStorage.setItem) toplar,
 * son state'i korur, belirlenen aralıkta async flush eder.
 * UI thread'ini bloke etmeden yazma işlemlerini gruplar.
 *
 * Kullanım:
 *   const queue = new BatchQueue({
 *     flushInterval: 100,
 *     flush: (item) => localStorage.setItem('key', JSON.stringify(item)),
 *   });
 *   queue.enqueue(data1);  // async flush
 *   queue.enqueue(data2);  // overwrites data1 (only latest matters)
 */

import { logger } from '@/lib/logger';

export interface BatchQueueOptions<T> {
  /** Flush periyodu (ms, default: 100) */
  flushInterval?: number;
  /** Maksimum kuyruk derinliği (default: 10) */
  maxQueueDepth?: number;
  /** Her flush'ta çağrılacak async fonksiyon */
  flush: (item: T) => void | Promise<void>;
  /** Flush sonrası callback (opsiyonel) */
  onFlushed?: (item: T) => void;
  /** Hata durumunda callback (opsiyonel) */
  onError?: (error: Error, item: T) => void;
}

export class BatchQueue<T> {
  private _queue: T[] = [];
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _flushing = false;
  private readonly _opts: Required<Omit<BatchQueueOptions<T>, 'onFlushed' | 'onError'>> &
    Pick<BatchQueueOptions<T>, 'onFlushed' | 'onError'>;
  private _disposed = false;

  constructor(opts: BatchQueueOptions<T>) {
    this._opts = {
      flushInterval: opts.flushInterval ?? 100,
      maxQueueDepth: opts.maxQueueDepth ?? 10,
      flush: opts.flush,
      onFlushed: opts.onFlushed,
      onError: opts.onError,
    };
  }

  /**
   * Kuyruğa yeni bir item ekler.
   * Son state korunur — aynı türden tekrarlanan işlemlerde
   * sadece son item flush edilir.
   */
  enqueue(item: T): void {
    if (this._disposed) return;

    this._queue.push(item);

    // Kuyruk derinliği kontrolü — taşarsa en eski item'lar atılır
    if (this._queue.length > this._opts.maxQueueDepth) {
      const dropped = this._queue.splice(0, this._queue.length - this._opts.maxQueueDepth);
      logger.warn('batchQueue', 'Queue depth exceeded, dropping old items', {
        dropped: dropped.length,
      });
    }

    // İlk item'da timer başlat
    if (!this._timer && !this._flushing) {
      this._timer = setTimeout(() => this._flush(), this._opts.flushInterval);
    }
  }

  /**
   * Bekleyen tüm item'ları hemen flush eder.
   * Returns a promise that resolves when flush completes.
   */
  async flushNow(): Promise<void> {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._queue.length === 0) return;
    await this._flush();
  }

  /**
   * Kuyruğu temizler ve timer'ı iptal eder.
   * dispose sonrası enqueue çağrıları sessizce reddedilir.
   */
  dispose(): void {
    this._disposed = true;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._queue = [];
  }

  /** Kuyrukta bekleyen item sayısı */
  get pending(): number {
    return this._queue.length;
  }

  /** Queue disposed mi? */
  get disposed(): boolean {
    return this._disposed;
  }

  // ── Private ────────────────────────────────────────────────────

  private async _flush(): Promise<void> {
    if (this._flushing || this._queue.length === 0) return;
    this._flushing = true;
    this._timer = null;

    try {
      // Sadece son item'ı al (stateful işlemler için)
      // Ara item'lar atılır — sadece son state önemli
      const latest = this._queue[this._queue.length - 1];
      this._queue = [];

      await this._opts.flush(latest);
      this._opts.onFlushed?.(latest);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('batchQueue', 'Flush failed', { error: error.message });
      this._opts.onError?.(error, this._queue[0] as T);
    } finally {
      this._flushing = false;
      // Flush sırasında yeni item eklenmişse tekrar zamanla
      if (this._queue.length > 0 && !this._timer) {
        this._timer = setTimeout(() => this._flush(), this._opts.flushInterval);
      }
    }
  }
}

/**
 * requestAnimationFrame tabanlı tek seferlik flush.
 * BatchQueue için alternatif — sonraki frame'de çalıştırır.
 */
export function scheduleIdleFlush(fn: () => void): () => void {
  let scheduled = false;
  const cb = (): void => {
    scheduled = false;
    fn();
  };
  const schedule = (): void => {
    if (scheduled) return;
    scheduled = true;
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => cb());
    } else {
      setTimeout(() => cb(), 0);
    }
  };
  schedule();
  return () => {
    scheduled = false;
  };
}
