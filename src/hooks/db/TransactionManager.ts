import type { DB, RuleViolation } from '@/types';
import { logger } from '@/lib/logger';
import { safeClone } from '@/lib/safeClone';

export interface TransactionResult {
  ok: boolean;
  db: DB;
  error?: string;
  violations?: RuleViolation[];
  blocked?: boolean;
}

/**
 * TransactionManager centralizes the logic for applying updates
 * to the DB state with atomic guarantees and validation.
 */
export class TransactionManager {
  /**
   * Executes a transaction: updater(prev) -> validate -> audit -> return result
   */
  static run(
    prev: DB,
    updater: (prev: DB) => DB,
    validate: (prev: DB, next: DB) => { violations: RuleViolation[]; hasBlock: boolean; hasWarn: boolean },
  ): TransactionResult {
    const t = logger.time('db', 'transaction');

    // 1. Snapshot (prev is already our immutable snapshot in React flow)

    try {
      // 2. Try Update
      const next = updater(prev);

      // Basic integrity check
      if (!next || typeof next !== 'object') {
        throw new Error('Updater returned invalid state');
      }

      // 3. Validate
      const { violations, hasBlock } = validate(prev, next);

      if (hasBlock) {
        t.end({ status: 'blocked', version: prev._version });
        return {
          ok: false,
          db: prev,
          blocked: true,
          violations
        };
      }

      // 4. Success
      t.end({ status: 'success', version: next._version });
      return {
        ok: true,
        db: next,
        violations
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      t.end({ status: 'error', error: error.message });
      logger.error('db', 'Transaction failed', { error: error.message });

      // 5. Rollback (return original prev)
      return {
        ok: false,
        db: prev,
        error: error.message
      };
    }
  }
}
