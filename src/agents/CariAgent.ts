import { DomainAgent } from '@/agents/DomainAgent';
import type { AgentRequest, AgentResponse } from '@/agents/types';
import type { Intent } from '@/domain/types';
import { CariTahsilatSchema, CariEkleSchema } from '@/lib/schemas';

export class CariAgent extends DomainAgent {
  readonly id = 'cari' as const;
  readonly yetkiler = ['cari.read', 'cari.write', 'rapor.read'] as const;

  async islemYap<P = unknown, R = unknown>(talep: AgentRequest<P>): Promise<AgentResponse<R>> {
    const p = talep.payload ?? {};

    // Zod Validation
    if (talep.action === 'cari_tahsilat') {
      const v = CariTahsilatSchema.safeParse(p);
      if (!v.success)
        return {
          ok: false,
          error: `Cari Tahsilat Hatası: ${v.error.issues.map((e) => e.message).join(', ')}`,
        } as AgentResponse<R>;
    }
    if (talep.action === 'cari_ekle') {
      const v = CariEkleSchema.safeParse(p);
      if (!v.success)
        return {
          ok: false,
          error: `Cari Ekleme Hatası: ${v.error.issues.map((e) => e.message).join(', ')}`,
        } as AgentResponse<R>;
    }

    const cariId = (p as Record<string, unknown>).cariId as string | undefined;
    if (cariId) {
      const cari = this.db.cari.find((c) => c.id === cariId);
      if (!cari || cari.deleted) {
        return {
          ok: false,
          error: `CARI HATASI: ${cariId} ID'li cari hesap bulunamadı veya silinmiş.`,
        } as AgentResponse<R>;
      }
    }
    return super.islemYap(talep);
  }

  protected mapRequestToIntent(talep: AgentRequest<unknown>): Intent | null {
    const p = talep.payload || {};
    if (talep.action === 'cari_tahsilat') {
      const validation = CariTahsilatSchema.parse(p);
      return {
        type: 'cari_tahsilat',
        payload: {
          cariId: validation.cariId,
          amount: validation.amount,
          kasa: validation.kasa,
        },
      };
    }
    if (talep.action === 'cari_ekle') {
      const validation = CariEkleSchema.parse(p);
      return {
        type: 'cari_ekle',
        payload: {
          name: validation.name,
          taxNumber: validation.taxNumber,
          email: validation.email,
          phone: validation.phone,
          address: validation.address,
        },
      };
    }
    return null;
  }
}
