import { DomainAgent, type ActionHandlerMap } from '@/agents/DomainAgent';
import type { AgentResponse } from '@/agents/types';
import type { Intent } from '@/domain/types';
import { processIntent } from '@/domain/intentEngine';
import { domainEventBus } from '@/domain/eventBus';
import { StokGuncelleSchema, ProductSchema } from '@/lib/schemas';
import type { StokGuncelleParams, UrunEkleParams } from '@/agents/actionMap';

export class StokAgent extends DomainAgent {
  readonly id = 'stok' as const;
  readonly yetkiler = ['stok.read', 'stok.write', 'rapor.read'] as const;

  /**
   * A-2: Typed handler'lar — validation + processIntent.
   * Eski islemYap override + mapRequestToIntent kaldırıldı.
   */
  protected actionHandlers: ActionHandlerMap = {
    stok_guncelle: (payload: StokGuncelleParams) => this.handleStokGuncelle(payload),
    urun_ekle: (payload: UrunEkleParams) => this.handleUrunEkle(payload),
  };

  private handleStokGuncelle(payload: StokGuncelleParams): AgentResponse<unknown> {
    // Zod validation
    const v = StokGuncelleSchema.safeParse(payload);
    if (!v.success) {
      return { ok: false, error: `Stok Güncelleme Hatası: ${v.error.issues.map((e) => e.message).join(', ')}` };
    }

    const intent: Intent = {
      type: 'stok_guncelle',
      payload: {
        productId: v.data.productId,
        amount: v.data.quantity,
        type: v.data.type,
        description: v.data.label,
      },
    };

    const result = processIntent(intent, this.db);
    if (!result.ok) {
      domainEventBus.emitError(result.error || 'Stok güncelleme başarısız', 'INTENT_FAILED', { agent: this.id, action: 'stok_guncelle' });
      return { ok: false, error: result.error };
    }

    return { ok: true, data: { intentResult: result } };
  }

  private handleUrunEkle(payload: UrunEkleParams): AgentResponse<unknown> {
    // Zod validation
    const v = ProductSchema.safeParse(payload);
    if (!v.success) {
      return { ok: false, error: `Ürün Ekleme Hatası: ${v.error.issues.map((e) => e.message).join(', ')}` };
    }

    const intent: Intent = {
      type: 'urun_ekle',
      payload: {
        productName: v.data.name,
        category: v.data.category,
        initialStock: v.data.stock,
        unitPrice: v.data.price,
      },
    };

    const result = processIntent(intent, this.db);
    if (!result.ok) {
      domainEventBus.emitError(result.error || 'Ürün ekleme başarısız', 'INTENT_FAILED', { agent: this.id, action: 'urun_ekle' });
      return { ok: false, error: result.error };
    }

    return { ok: true, data: { intentResult: result } };
  }
}