import { BaseAgent, type ActionHandlerMap } from './BaseAgent';
import { processIntent } from '@/domain/intentEngine';
import { applyIntentResult } from '@/hooks/db/dbHelpers';
import type { AgentRequest, AgentResponse } from './types';
import type { AgentAction } from './actionMap';
import type { Intent, IntentResult } from '@/domain/types';
import { dbMutex } from '@/lib/mutex';
import { domainEventBus } from '@/domain/eventBus';

export abstract class DomainAgent extends BaseAgent {
  /**
   * Legacy intent mapping — fallback islemYap yolu.
   * A-2: Typed handler'lar tercih edilir. Agent tamamen typed handler'a
   * geçtiyse bu method null dönebilir (DomainAgent varsayılanı).
   * Kaldırılma sürecinde: CariAgent, StokAgent hâlâ override ediyor.
   */
  protected mapRequestToIntent(_talep: AgentRequest<unknown>): Intent | null {
    return null;
  }

  /**
   * Ana dispatch yöntemi.
   * A-2: Önce typed handler'a dene, varsa → handler validate + processIntent yapar,
   * DomainAgent save'i uygular. Yoksa legacy mapRequestToIntent → processIntent yoluna düşer.
   */
  async islemYap<P = unknown, R = unknown>(talep: AgentRequest<P>): Promise<AgentResponse<R>> {
    if (!this.ctx) return { ok: false, error: `${this.id} bağlanmadı` } as AgentResponse<R>;

    const unlock = await dbMutex.lock();
    try {
      this.yayinla(`${this.id}.islem`, { action: talep.action, payload: talep.payload });

      // A-2: Typed handler varsa önce onu dene
      const handlerFn = this.actionHandlers[talep.action as AgentAction];
      if (handlerFn) {
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
      }

      // Legacy fallback: mapRequestToIntent → processIntent → save
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

      this.save((prev) => applyIntentResult(prev, result.data!));

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
