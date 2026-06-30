import { DomainAgent, type ActionHandlerMap } from '@/agents/DomainAgent';
import type { AgentRequest, AgentResponse } from '@/agents/types';
import type { Intent } from '@/domain/types';
import { SaleIntentSchema, SaleIptalSchema, SaleIadeSchema, SaleFiyatDuzeltSchema } from '@/lib/schemas';
import type { SaleIptalParams, SaleIadeParams, SaleFiyatDuzeltParams } from '@/agents/actionMap';
import type { YeniSatisParams } from '@/agents/types';

function asNumber(val: unknown): number | undefined {
  return typeof val === 'number' && !Number.isNaN(val) ? val : undefined;
}

function asNumberOrRecord(val: unknown): number | Record<string, number> | undefined {
  const n = asNumber(val);
  if (n !== undefined) return n;
  if (typeof val === 'object' && val !== null) {
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(val)) {
      if (typeof v === 'number') result[k] = v;
    }
    return result;
  }
  return undefined;
}

export class SatisAgent extends DomainAgent {
  readonly id = 'satis' as const;
  readonly yetkiler = ['satis.read', 'satis.write', 'kasa.read', 'stok.read', 'cari.read', 'rapor.read'] as const;

  /**
   * PR-D2: Typed action handler'lar — her action için payload tipi
   * AgentActionMap'ten geliyor, cast ihtiyacı sıfır.
   */
  protected actionHandlers: ActionHandlerMap = {
    yeniSatis: (payload: YeniSatisParams) => this.handleYeniSatis(payload),
    satis: (payload: YeniSatisParams) => this.handleYeniSatis(payload),
    sale_iptal: (payload: SaleIptalParams) => this.handleSaleIptal(payload),
    iptalEt: (payload: SaleIptalParams) => this.handleSaleIptal(payload),
    sale_iade: (payload: SaleIadeParams) => this.handleSaleIade(payload),
    iadeYap: (payload: SaleIadeParams) => this.handleSaleIade(payload),
    sale_fiyat_duzelt: (payload: SaleFiyatDuzeltParams) => this.handleSaleFiyatDuzelt(payload),
    fiyatDuzelt: (payload: SaleFiyatDuzeltParams) => this.handleSaleFiyatDuzelt(payload),
  };

  /**
   * Typed handler — payload zaten SaleIptalParams, cast yok.
   */
  private handleSaleIptal(payload: SaleIptalParams): AgentResponse<unknown> {
    if (!payload.saleId) return { ok: false, error: 'saleId gerekli' };
    return { ok: true, data: { saleId: payload.saleId } };
  }

  private handleSaleIade(payload: SaleIadeParams): AgentResponse<unknown> {
    if (!payload.saleId) return { ok: false, error: 'saleId gerekli' };
    return { ok: true, data: { saleId: payload.saleId, qty: asNumberOrRecord(payload.quantity) } };
  }

  private handleSaleFiyatDuzelt(payload: SaleFiyatDuzeltParams): AgentResponse<unknown> {
    if (!payload.saleId) return { ok: false, error: 'saleId gerekli' };
    const yeniFiyat = asNumberOrRecord(payload.yeniFiyat) ?? asNumberOrRecord(payload.unitPrice) ?? 0;
    return { ok: true, data: { saleId: payload.saleId, yeniFiyat } };
  }

  /**
   * Typed handler — yeniSatis payload validation.
   * Not: Persistence legacy islemYap → mapRequestToIntent → processIntent üzerinden yürür.
   * Bu handler yalnızca validation ve shape consistency sağlar (R3-6 TD-3).
   */
  private handleYeniSatis(payload: YeniSatisParams): AgentResponse<unknown> {
    if (!payload.items || payload.items.length === 0) {
      return { ok: false, error: 'En az bir ürün gerekli' };
    }
    // Shape'i legacy path ile uyumlu hale getir (TD-3 fix)
    return {
      ok: true,
      data: {
        action: 'yeniSatis',
        status: 'completed',
        intentResult: {
          ok: true,
          data: {
            dbUpdates: { sale: payload },
          },
        },
      },
    };
  }

  async islemYap<P = unknown, R = unknown>(talep: AgentRequest<P>): Promise<AgentResponse<R>> {
    if (!this.ctx) {
      return { ok: false, error: `${this.id} agent bağlanmadı - önce bagla() çağrın` } as AgentResponse<R>;
    }
    if (!this.yetkiKontrolu('satis.write')) {
      return { ok: false, error: `${this.id} agent'ının bu işlem için yetkisi yok` } as AgentResponse<R>;
    }

    // Zod Validation for sale actions
    if (talep.action === 'yeniSatis' || talep.action === 'satis') {
      const validation = SaleIntentSchema.safeParse(talep.payload);
      if (!validation.success) {
        return {
          ok: false,
          error: `GEÇERSİZ SATIŞ VERİSİ: ${validation.error.issues.map((e) => e.message).join(', ')}`,
        } as AgentResponse<R>;
      }
    }

    // Silinmiş kayıt kontrolü (Sertleştirme)
    if (talep.payload && Array.isArray((talep.payload as Record<string, unknown>).items)) {
      for (const item of (talep.payload as Record<string, unknown>).items as Array<{
        productId: string;
        productName?: string;
      }>) {
        const p = this.db.products.find((x) => x.id === item.productId);
        if (!p || p.deleted) {
          return {
            ok: false,
            error: `SATIŞ HATASI: ${item.productName || item.productId} ürünü sistemde bulunamadı veya silinmiş.`,
          } as AgentResponse<R>;
        }
      }
    }

    return super.islemYap(talep);
  }

  protected mapRequestToIntent(talep: AgentRequest<unknown>): Intent | null {
    const p = talep.payload || {};
    switch (talep.action) {
      case 'yeniSatis':
      case 'satis': {
        const validation = SaleIntentSchema.parse(p);
        return {
          type: 'sale',
          payload: {
            items: validation.items,
            payment: validation.payment,
            cariId: validation.cariId,
            cariName: validation.cariName,
            customerName: validation.customerName,
            discount: validation.discount,
            discountAmount: validation.discountAmount,
            tahsilat: validation.tahsilat,
            saleDate: validation.saleDate,
            dueDays: validation.dueDays,
          },
        };
      }
      case 'iptalEt':
      case 'sale_iptal': {
        const v = SaleIptalSchema.safeParse(p);
        if (!v.success) return null;
        return { type: 'sale_iptal', payload: { saleId: v.data.saleId } };
      }
      case 'iadeYap':
      case 'sale_iade': {
        const v = SaleIadeSchema.safeParse(p);
        if (!v.success) return null;
        return { type: 'sale_iade', payload: { saleId: v.data.saleId, qty: asNumberOrRecord(v.data.quantity) } };
      }
      case 'fiyatDuzelt':
      case 'sale_fiyat_duzelt': {
        const v = SaleFiyatDuzeltSchema.safeParse(p);
        if (!v.success) return null;
        const yeniFiyat = asNumberOrRecord(v.data.yeniFiyat) ?? asNumberOrRecord(v.data.unitPrice) ?? 0;
        return { type: 'sale_fiyat_duzelt', payload: { saleId: v.data.saleId, yeniFiyat } };
      }
      default:
        return null;
    }
  }
}
