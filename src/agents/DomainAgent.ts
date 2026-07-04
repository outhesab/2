import { BaseAgent, type ActionHandlerMap } from './BaseAgent';
import { applyIntentResult } from '@/hooks/db/dbHelpers';
import type { AgentRequest, AgentResponse } from './types';
import type { AgentAction } from './actionMap';
import type { IntentResult } from '@/domain/types';
import { dbMutex } from '@/lib/mutex';

export abstract class DomainAgent extends BaseAgent {
  /**
   * Ana dispatch yöntemi.
   * A-2: Typed handler'a delegasyon yapar. Handler validate + processIntent
   * işlemini yapar, intentResult döndürür. DomainAgent save'i uygular.
   * Handler yoksa "Desteklenmeyen aksiyon" hatası döner.
   */
  async islemYap<P = unknown, R = unknown>(talep: AgentRequest<P>): Promise<AgentResponse<R>> {
    if (!this.ctx) return { ok: false, error: `${this.id} bağlanmadı` } as AgentResponse<R>;

    const unlock = await dbMutex.lock();
    try {
      this.yayinla(`${this.id}.islem`, { action: talep.action, payload: talep.payload });

      const handlerFn = this.actionHandlers[talep.action as AgentAction];

      if (!handlerFn) {
        return { ok: false, error: `Desteklenmeyen aksiyon: ${talep.action}` } as AgentResponse<R>;
      }

      const handlerResult = await (handlerFn as (payload: unknown) => Promise<AgentResponse<unknown>>)(
        talep.payload,
      );
      if (!handlerResult.ok) return handlerResult as AgentResponse<R>;

      // Handler intentResult döndüyse save'i uygula
      const hrData = handlerResult.data as { intentResult?: IntentResult } | undefined;
      const intentResult = hrData?.intentResult;
      if (intentResult?.ok && intentResult.data) {
        this.save((prev) => applyIntentResult(prev, intentResult.data));
      }

      return {
        ok: true,
        data: {
          agent: this.id,
          action: talep.action,
          status: 'completed',
          intentResult: hrData?.intentResult,
        } as R,
      };
    } finally {
      unlock();
    }
  }
}

// Re-export for convenience
export type { ActionHandlerMap };