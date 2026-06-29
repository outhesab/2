import { DomainAgent } from '@/agents/DomainAgent';
import type { AgentRequest, AgentResponse } from '@/agents/types';
import type { Intent } from '@/domain/types';
import { StokGuncelleSchema, ProductSchema } from '@/lib/schemas';

export class StokAgent extends DomainAgent {
  readonly id = 'stok' as const;
  readonly yetkiler = ['stok.read', 'stok.write', 'rapor.read'] as const;

  async islemYap<P = unknown, R = unknown>(talep: AgentRequest<P>): Promise<AgentResponse<R>> {
    const p = talep.payload ?? {};

    // Zod Validation
    if (talep.action === 'stok_guncelle') {
      const v = StokGuncelleSchema.safeParse(p);
      if (!v.success) return { ok: false, error: `Stok Güncelleme Hatası: ${v.error.issues.map((e) => e.message).join(', ')}` } as AgentResponse<R>;
    }
    if (talep.action === 'urun_ekle') {
      const v = ProductSchema.safeParse(p);
      if (!v.success) return { ok: false, error: `Ürün Ekleme Hatası: ${v.error.issues.map((e) => e.message).join(', ')}` } as AgentResponse<R>;
    }

    return super.islemYap(talep);
  }

  protected mapRequestToIntent(talep: AgentRequest<unknown>): Intent | null {
    const p = talep.payload || {};
    if (talep.action === 'stok_guncelle') {
      const validation = StokGuncelleSchema.parse(p);
      return {
        type: 'stok_guncelle',
        payload: {
          productId: validation.productId,
          amount: validation.quantity,
          type: validation.type,
          description: validation.label,
        },
      };
    }
    if (talep.action === 'urun_ekle') {
      const validation = ProductSchema.parse(p);
      return {
        type: 'urun_ekle',
        payload: {
          productName: validation.name,
          category: validation.category,
          initialStock: validation.stock,
          unitPrice: validation.price,
        },
      };
    }
    return null;
  }
}
