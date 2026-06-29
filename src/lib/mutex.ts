/**
 * Simple Mutex implementation to prevent race conditions
 * during database write operations.
 */
export class Mutex {
  private _locking: Promise<void> | null = null;
  private _locked = false;

  async lock(): Promise<() => void> {
    while (this._locking) {
      await this._locking;
    }

    let resolve: () => void;
    this._locking = new Promise((res) => {
      resolve = res;
    });

    this._locked = true;

    return () => {
      this._locked = false;
      this._locking = null;
      if (resolve) resolve();
    };
  }

  isLocked(): boolean {
    return this._locked;
  }
}

export const dbMutex = new Mutex();
