import { DomainAgent, type ActionHandlerMap } from '@/agents/DomainAgent';
import type { AgentRequest, AgentResponse } from '@/agents/types';
import type { Intent } from '@/domain/types';
import { KasaIslemSchema } from '@/lib/schemas';
import type { KasaIslemParams } from '@/agents/actionMap';

export class KasaAgent extends DomainAgent {
  readonly id = 'kasa' as const;
  readonly yetkiler = ['kasa.read', 'kasa.write', 'rapor.read'] as const;

  /**
   * PR-D2 tamamlama: Typed action handlers.
   * actionHandlers[action] payload type'ı otomatik KasaIslemParams olarak gelir.
   */
  protected actionHandlers: ActionHandlerMap = {
    kasa_gelir: (payload: KasaIslemParams) => this.handleKasaIslem(payload),
    kasa_gider: (payload: KasaIslemParams) => this.handleKasaIslem(payload),
  };

  private handleKasaIslem(payload: KasaIslemParams): AgentResponse<unknown> {
    // Validation (typed payload üzerinden)
    const v = KasaIslemSchema.safeParse(payload);
    if (!v.success) {
      return { ok: false, error: `Kasa İşlemi Hatası: ${v.error.issues.map((e) => e.message).join(', ')}` };
    }
    // Cast yok — payload zaten typed
    return { ok: true, data: v.data };
  }

  async islemYap<P = unknown, R = unknown>(talep: AgentRequest<P>): Promise<AgentResponse<R>> {
    const p = talep.payload ?? {};

    // Zod Validation
    if (talep.action === 'kasa_gelir' || talep.action === 'kasa_gider') {
      const v = KasaIslemSchema.safeParse(p);
      if (!v.success)
        return {
          ok: false,
          error: `Kasa İşlemi Hatası: ${v.error.issues.map((e) => e.message).join(', ')}`,
        } as AgentResponse<R>;

      // Validation sonrası kasaId zaten string — cast gereksiz
      const kasaId = v.data.kasa;
      const kasa = this.db.kasalar.find((k) => k.id === kasaId);
      if (!kasa) {
        return { ok: false, error: `KASA HATASI: ${kasaId} isimli kasa bulunamadı.` } as AgentResponse<R>;
      }
    }
    return super.islemYap(talep);
  }

  protected mapRequestToIntent(talep: AgentRequest<unknown>): Intent | null {
    const p = talep.payload || {};
    if (talep.action === 'kasa_gelir' || talep.action === 'kasa_gider') {
      const validation = KasaIslemSchema.parse(p);
      return {
        type: talep.action as 'kasa_gelir' | 'kasa_gider',
        payload: {
          amount: validation.amount,
          kasa: validation.kasa,
          description: validation.description || '',
          category: validation.category || '',
        },
      };
    }
    return null;
  }
}
