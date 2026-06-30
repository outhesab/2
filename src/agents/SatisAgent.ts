import { DomainAgent, type ActionHandlerMap } from '@/agents/DomainAgent';
import type { AgentRequest, AgentResponse } from '@/agents/types';
import type { Intent } from '@/domain/types';
import { processIntent } from '@/domain/intentEngine';
import { domainEventBus } from '@/domain/eventBus';
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
   * A-2: Typed handler'lar — validation + processIntent + intentResult döndürür.
   * DomainAgent.islemYap handler varsa delegasyon yapar, intentResult'u save'e uygular.
   */
  protected actionHandlers: ActionHandlerMap = {
    yeniSatis: (payload: YeniSatisParams, request: AgentRequest<unknown>) => this.handleYeniSatis(payload, request),
    satis: (payload: YeniSatisParams, request: AgentRequest<unknown>) => this.handleYeniSatis(payload, request),
    sale_iptal: (payload: SaleIptalParams) => this.handleSaleIptal(payload),
    iptalEt: (payload: SaleIptalParams) => this.handleSaleIptal(payload),
    sale_iade: (payload: SaleIadeParams) => this.handleSaleIade(payload),
    iadeYap: (payload: SaleIadeParams) => this.handleSaleIade(payload),
    sale_fiyat_duzelt: (payload: SaleFiyatDuzeltParams) => this.handleSaleFiyatDuzelt(payload),
    fiyatDuzelt: (payload: SaleFiyatDuzeltParams) => this.handleSaleFiyatDuzelt(payload),
  };

  private requireWritePermission(): AgentResponse<unknown> | null {
    if (!this.yetkiKontrolu('satis.write')) {
      return { ok: false, error: `${this.id} agent'ının bu işlem için yetkisi yok` };
    }
    return null;
  }

  private handleSaleIptal(payload: SaleIptalParams): AgentResponse<unknown> {
    const perm = this.requireWritePermission();
    if (perm) return perm;

    if (!payload.saleId) return { ok: false, error: 'saleId gerekli' };

    const v = SaleIptalSchema.safeParse(payload);
    if (!v.success) {
      return { ok: false, error: `İptal hatası: ${v.error.issues.map((e) => e.message).join(', ')}` };
    }

    const intent: Intent = { type: 'sale_iptal', payload: { saleId: v.data.saleId } };
    const result = processIntent(intent, this.db);
    if (!result.ok) {
      domainEventBus.emitError(result.error || 'İptal başarısız', 'INTENT_FAILED', { agent: this.id, action: 'sale_iptal' });
      return { ok: false, error: result.error };
    }

    return { ok: true, data: { intentResult: result } };
  }

  private handleSaleIade(payload: SaleIadeParams): AgentResponse<unknown> {
    const perm = this.requireWritePermission();
    if (perm) return perm;

    if (!payload.saleId) return { ok: false, error: 'saleId gerekli' };

    const v = SaleIadeSchema.safeParse(payload);
    if (!v.success) {
      return { ok: false, error: `İade hatası: ${v.error.issues.map((e) => e.message).join(', ')}` };
    }

    const qty = asNumberOrRecord(v.data.quantity);
    const intent: Intent = { type: 'sale_iade', payload: { saleId: v.data.saleId, qty } };
    const result = processIntent(intent, this.db);
    if (!result.ok) {
      domainEventBus.emitError(result.error || 'İade başarısız', 'INTENT_FAILED', { agent: this.id, action: 'sale_iade' });
      return { ok: false, error: result.error };
    }

    return { ok: true, data: { intentResult: result } };
  }

  private handleSaleFiyatDuzelt(payload: SaleFiyatDuzeltParams): AgentResponse<unknown> {
    const perm = this.requireWritePermission();
    if (perm) return perm;

    if (!payload.saleId) return { ok: false, error: 'saleId gerekli' };

    const v = SaleFiyatDuzeltSchema.safeParse(payload);
    if (!v.success) {
      return { ok: false, error: `Fiyat düzeltme hatası: ${v.error.issues.map((e) => e.message).join(', ')}` };
    }

    const yeniFiyat = asNumberOrRecord(v.data.yeniFiyat) ?? asNumberOrRecord(v.data.unitPrice) ?? 0;
    const intent: Intent = { type: 'sale_fiyat_duzelt', payload: { saleId: v.data.saleId, yeniFiyat } };
    const result = processIntent(intent, this.db);
    if (!result.ok) {
      domainEventBus.emitError(result.error || 'Fiyat düzeltme başarısız', 'INTENT_FAILED', { agent: this.id, action: 'sale_fiyat_duzelt' });
      return { ok: false, error: result.error };
    }

    return { ok: true, data: { intentResult: result } };
  }

  /**
   * A-2: handleYeniSatis — validation + processIntent + silinmiş kayıt kontrolü.
   * Eski islemYap override + mapRequestToIntent kaldırıldı, hepsi bu handler'da.
   */
  private handleYeniSatis(payload: YeniSatisParams, _request: AgentRequest<unknown>): AgentResponse<unknown> {
    const perm = this.requireWritePermission();
    if (perm) return perm;

    // Zod validation
    const validation = SaleIntentSchema.safeParse(payload);
    if (!validation.success) {
      return {
        ok: false,
        error: `GEÇERSİZ SATIŞ VERİSİ: ${validation.error.issues.map((e) => e.message).join(', ')}`,
      };
    }

    // Silinmiş kayıt kontrolü
    if (payload.items && payload.items.length > 0) {
      for (const item of payload.items) {
        const p = this.db.products.find((x) => x.id === item.productId);
        if (!p || p.deleted) {
          return {
            ok: false,
            error: `SATIŞ HATASI: ${item.productName || item.productId} ürünü sistemde bulunamadı veya silinmiş.`,
          };
        }
      }
    }

    // Intent oluştur + processIntent
    const v = validation.data;
    const intent: Intent = {
      type: 'sale',
      payload: {
        items: v.items,
        payment: v.payment,
        cariId: v.cariId,
        cariName: v.cariName,
        customerName: v.customerName,
        discount: v.discount,
        discountAmount: v.discountAmount,
        tahsilat: v.tahsilat,
        saleDate: v.saleDate,
        dueDays: v.dueDays,
      },
    };

    const result = processIntent(intent, this.db);
    if (!result.ok) {
      domainEventBus.emitError(result.error || 'Satış başarısız', 'INTENT_FAILED', { agent: this.id, action: 'yeniSatis' });
      return { ok: false, error: result.error };
    }

    return {
      ok: true,
      data: {
        action: 'yeniSatis',
        status: 'completed',
        intentResult: result,
      },
    };
  }
}