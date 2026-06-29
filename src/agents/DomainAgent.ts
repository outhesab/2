import { BaseAgent, type ActionHandlerMap } from './BaseAgent';
import { processIntent } from '@/domain/intentEngine';
import { applyIntentResult } from '@/hooks/db/dbHelpers';
import type { AgentRequest, AgentResponse } from './types';
import type { Intent } from '@/domain/types';
import { dbMutex } from '@/lib/mutex';
import { domainEventBus } from '@/domain/eventBus';

export abstract class DomainAgent extends BaseAgent {
  protected abstract mapRequestToIntent(talep: AgentRequest<unknown>): Intent | null;

  async islemYap<P = unknown, R = unknown>(talep: AgentRequest<P>): Promise<AgentResponse<R>> {
    if (!this.ctx) return { ok: false, error: `${this.id} bağlanmadı` } as AgentResponse<R>;

    const unlock = await dbMutex.lock();
    try {
      this.yayinla(`${this.id}.islem`, { action: talep.action, payload: talep.payload });

      const intent = this.mapRequestToIntent(talep as AgentRequest<unknown>);

      if (!intent) {
        const error = `Desteklenmeyen aksiyon: ${talep.action}`;
        domainEventBus.emitError(error, 'INVALID_ACTION', { agent: this.id });
        return { ok: false, error } as AgentResponse<R>;
      }

      const db = this.db;
      const result = processIntent(intent, db);

      if (!result.ok) {
        domainEventBus.emitError(result.error || 'İşlem başarısız', 'INTENT_FAILED', {
          agent: this.id,
          action: talep.action,
        });
        return { ok: false, error: result.error } as AgentResponse<R>;
      }

      this.ctx.save((prev) => applyIntentResult(prev, result.data!));

      return {
        ok: true,
        data: {
          agent: this.id,
          action: talep.action,
          status: 'completed',
          intentResult: result,
        } as R,
      };
    } finally {
      unlock();
    }
  }
}

// Re-export for convenience
export type { ActionHandlerMap };
