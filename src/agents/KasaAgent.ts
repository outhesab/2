import { DomainAgent, type ActionHandlerMap } from '@/agents/DomainAgent';
import type { AgentResponse } from '@/agents/types';
import type { Intent } from '@/domain/types';
import { processIntent } from '@/domain/intentEngine';
import { domainEventBus } from '@/domain/eventBus';
import { KasaIslemSchema } from '@/lib/schemas';
import type { KasaIslemParams } from '@/agents/actionMap';

export class KasaAgent extends DomainAgent {
  readonly id = 'kasa' as const;
  readonly yetkiler = ['kasa.read', 'kasa.write', 'rapor.read'] as const;

  /**
   * A-2: Typed handler — validation + kasa kontrolü + processIntent.
   * Eski islemYap override + mapRequestToIntent kaldırıldı.
   */
  protected actionHandlers: ActionHandlerMap = {
    kasa_gelir: (payload: KasaIslemParams) => this.handleKasaIslem(payload, 'kasa_gelir'),
    kasa_gider: (payload: KasaIslemParams) => this.handleKasaIslem(payload, 'kasa_gider'),
  };

  private handleKasaIslem(payload: KasaIslemParams, actionType: 'kasa_gelir' | 'kasa_gider'): AgentResponse<unknown> {
    // Zod validation
    const v = KasaIslemSchema.safeParse(payload);
    if (!v.success) {
      return { ok: false, error: `Kasa İşlemi Hatası: ${v.error.issues.map((e) => e.message).join(', ')}` };
    }

    // Kasa existence check
    const kasaId = v.data.kasa;
    const kasa = this.db.kasalar.find((k) => k.id === kasaId);
    if (!kasa) {
      return { ok: false, error: `KASA HATASI: ${kasaId} isimli kasa bulunamadı.` };
    }

    // Intent oluştur + processIntent
    const intent: Intent = {
      type: actionType,
      payload: {
        amount: v.data.amount,
        kasa: v.data.kasa,
        description: v.data.description || '',
        category: v.data.category || '',
      },
    };

    const result = processIntent(intent, this.db);
    if (!result.ok) {
      domainEventBus.emitError(result.error || 'Kasa işlemi başarısız', 'INTENT_FAILED', { agent: this.id, action: actionType });
      return { ok: false, error: result.error };
    }

    return { ok: true, data: { intentResult: result } };
  }
}