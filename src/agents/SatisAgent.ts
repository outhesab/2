import { DomainAgent } from '@/agents/DomainAgent';
import type { AgentRequest, AgentResponse } from '@/agents/types';
import type { Intent } from '@/domain/types';
import { SaleIntentSchema } from '@/lib/schemas';

function asString(val: unknown): string | undefined {
  return typeof val === 'string' ? val : undefined;
}

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

  async islemYap<P = any, R = any>(talep: AgentRequest<P>): Promise<AgentResponse<R>> {
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
          error: `GEÇERSİZ SATIŞ VERİSİ: ${validation.error.errors.map((e) => e.message).join(', ')}`,
        } as AgentResponse<R>;
      }
    }

    // Silinmiş kayıt kontrolü (Sertleştirme)
    if (talep.payload && Array.isArray((talep.payload as any).items)) {
      for (const item of (talep.payload as any).items) {
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

  protected mapRequestToIntent(talep: AgentRequest<any>): Intent | null {
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
        const saleId = asString(p.saleId);
        if (!saleId) return null;
        return { type: 'sale_iptal', payload: { saleId } };
      }
      case 'iadeYap':
      case 'sale_iade': {
        const saleId = asString(p.saleId);
        if (!saleId) return null;
        return { type: 'sale_iade', payload: { saleId, qty: asNumberOrRecord(p.quantity) } };
      }
      case 'fiyatDuzelt':
      case 'sale_fiyat_duzelt': {
        const saleId = asString(p.saleId);
        if (!saleId) return null;
        const yeniFiyat = asNumberOrRecord(p.yeniFiyat) ?? asNumberOrRecord(p.unitPrice) ?? 0;
        return { type: 'sale_fiyat_duzelt', payload: { saleId, yeniFiyat } };
      }
      default:
        return null;
    }
  }
}
