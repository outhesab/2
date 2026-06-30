import { agentBus } from '@/agents/AgentBus';
import type { AgentContext, AgentEvent, AgentId, AgentPermission, AgentRequest, AgentResponse } from '@/agents/types';
import type { DB } from '@/types';
import type { AgentAction, AgentActionMap } from './actionMap';

/**
 * Action handler'lar için typed map.
 * Her ajan kendi action'ları için typed handler tanımlar.
 * Cast (\`as any\`, \`as unknown as\`) yerine type system üzerinden dispatch.
 */
export type ActionHandler<K extends AgentAction> = (
  payload: AgentActionMap[K],
  request: AgentRequest<AgentActionMap[K]>,
) => Promise<AgentResponse<unknown>> | AgentResponse<unknown>;

export type ActionHandlerMap = {
  [K in AgentAction]?: ActionHandler<K>;
};

export abstract class BaseAgent {
  abstract readonly id: AgentId;
  abstract readonly yetkiler: readonly AgentPermission[];

  protected ctx: AgentContext | null = null;

  /**
   * Ajan action handler'ları — \`AgentActionMap\` üzerinden typed.
   * Alt sınıflar bu map'i doldurarak \`handle()\` üzerinden dispatch sağlar.
   * Ajan sadece kendi action'larına handler tanımlar.
   */
  protected abstract actionHandlers: ActionHandlerMap;

  bagla(ctx: AgentContext): void {
    this.ctx = ctx;
  }

  protected get db(): DB {
    if (!this.ctx) throw new Error(`${this.id} agent bağlanmadı — önce bagla() çağırın`);
    return this.ctx.getDB();
  }

  protected get save() {
    if (!this.ctx) throw new Error(`${this.id} agent bağlanmadı — önce bagla() çağırın`);
    return this.ctx.save;
  }

  yetkiKontrolu(izin: AgentPermission): boolean {
    return this.yetkiler.includes(izin);
  }

  protected yayinla(type: string, payload?: Record<string, unknown>) {
    agentBus.emit(this.id, type, payload);
  }

  onEvent(handler: (event: AgentEvent) => void): () => void {
    return agentBus.onEvent(handler);
  }

  /**
   * Typed dispatch — actionHandlers map'i üzerinden type-safe handler çağırır.
   * PR-D2 tamamlama: Ajanlar bu method'u kullanarak cast'ten kurtulur.
   *
   * @example
   *   return this.handle('sale_iptal', { saleId: 'abc123' });
   *   // payload tipi otomatik SaleIptalParams
   */
  protected handle<K extends AgentAction>(
    action: K,
    payload: AgentActionMap[K],
  ): Promise<AgentResponse<unknown>> | AgentResponse<unknown> {
    const handler = this.actionHandlers[action] as ActionHandler<K> | undefined;
    if (!handler) {
      return {
        ok: false,
        error: `${this.id} ajanı '${action}' aksiyonunu desteklemiyor`,
      };
    }
    return handler(payload, {
      action,
      payload,
      meta: undefined,
    });
  }

  /**
   * Generic islemYap — geriye dönük uyumluluk için korunuyor.
   * Yeni kodlar \`handle(action, payload)\` typed API'sini kullanmalı.
   */
  abstract islemYap<P = unknown, R = unknown>(talep: AgentRequest<P>): Promise<AgentResponse<R>>;
}
