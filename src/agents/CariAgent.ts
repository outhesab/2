import { DomainAgent, type ActionHandlerMap } from '@/agents/DomainAgent';
import type { AgentResponse } from '@/agents/types';
import type { Intent } from '@/domain/types';
import { processIntent } from '@/domain/intentEngine';
import { domainEventBus } from '@/domain/eventBus';
import { CariTahsilatSchema, CariEkleSchema } from '@/lib/schemas';
import type { CariTahsilatParams, CariEkleParams } from '@/agents/actionMap';

export class CariAgent extends DomainAgent {
  readonly id = 'cari' as const;
  readonly yetkiler = ['cari.read', 'cari.write', 'rapor.read'] as const;

  /**
   * A-2: Typed handler'lar — validation + cari kontrolü + processIntent.
   * Eski islemYap override + mapRequestToIntent kaldırıldı.
   */
  protected actionHandlers: ActionHandlerMap = {
    cari_tahsilat: (payload: CariTahsilatParams) => this.handleCariTahsilat(payload),
    cari_ekle: (payload: CariEkleParams) => this.handleCariEkle(payload),
  };

  private handleCariTahsilat(payload: CariTahsilatParams): AgentResponse<unknown> {
    // Zod validation
    const v = CariTahsilatSchema.safeParse(payload);
    if (!v.success) {
      return { ok: false, error: `Cari Tahsilat Hatası: ${v.error.issues.map((e) => e.message).join(', ')}` };
    }

    // Cari existence check
    const cari = this.db.cari.find((c) => c.id === v.data.cariId);
    if (!cari || cari.deleted) {
      return { ok: false, error: `CARI HATASI: ${v.data.cariId} ID'li cari hesap bulunamadı veya silinmiş.` };
    }

    const intent: Intent = {
      type: 'cari_tahsilat',
      payload: {
        cariId: v.data.cariId,
        amount: v.data.amount,
        kasa: v.data.kasa,
      },
    };

    const result = processIntent(intent, this.db);
    if (!result.ok) {
      domainEventBus.emitError(result.error || 'Cari tahsilat başarısız', 'INTENT_FAILED', { agent: this.id, action: 'cari_tahsilat' });
      return { ok: false, error: result.error };
    }

    return { ok: true, data: { intentResult: result } };
  }

  private handleCariEkle(payload: CariEkleParams): AgentResponse<unknown> {
    // Zod validation
    const v = CariEkleSchema.safeParse(payload);
    if (!v.success) {
      return { ok: false, error: `Cari Ekleme Hatası: ${v.error.issues.map((e) => e.message).join(', ')}` };
    }

    const intent: Intent = {
      type: 'cari_ekle',
      payload: {
        name: v.data.name,
        taxNumber: v.data.taxNumber,
        email: v.data.email,
        phone: v.data.phone,
        address: v.data.address,
      },
    };

    const result = processIntent(intent, this.db);
    if (!result.ok) {
      domainEventBus.emitError(result.error || 'Cari ekleme başarısız', 'INTENT_FAILED', { agent: this.id, action: 'cari_ekle' });
      return { ok: false, error: result.error };
    }

    return { ok: true, data: { intentResult: result } };
  }
}