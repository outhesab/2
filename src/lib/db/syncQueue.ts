/**
 * SyncQueue — Firebase yazma işlemlerini sıralı hale getiren kuyruk sistemi.
 * Race condition'ları önler ve veri tutarlılığını sağlar.
 */
export class SyncQueue {
  private queue: Promise<void> = Promise.resolve();

  /**
   * Bir işlemi kuyruğa ekler. İşlem, kendinden önceki tüm işlemler bittikten sonra başlar.
   */
  enqueue(operation: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(async () => {
      try {
        await operation();
      } catch (error) {
        // Hata durumunda kuyruğu bloklama, sadece logla
        console.error('[SyncQueue] İşlem hatası:', error);
      }
    });
    return this.queue;
  }

  /**
  * Mevcut kuyruğun tamamlanmasını bekler.
  */
  async flush(): Promise<void> {
    await this.queue;
  }
}

export const firebaseSyncQueue = new SyncQueue();
