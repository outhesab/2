/**
 * SOBA NEXUS AI — DiscountMemoryModule
 * Cross-Entity Discount Memory: "Ali Bey'e yaptığım indirimini Ahmet Bey'e de uygula"
 *
 * Tasarım:
 * - Saf fonksiyonlar (pure) — prevDB → sorgu → sonuç, yan etkisiz.
 * - Offline-first: LLM gerektirmez. GLM-5.2 yalnızca NL → structured query
 *   ayrıştırması için kullanılır; asıl "geçmişten hatırlama" burada deterministiktir.
 * - Test edilebilir: DB girdisi → sabit çıktı.
 *
 * Mimariye uygun: IntentEngine → domain service (pure) → save() pattern.
 * Bu modül save() yapmaz; sadece öneri (proposal) üretir. Uygulama caller'a aittir.
 */

import type { DB, Sale } from '@/types';
import { logger } from '@/lib/logger';
// ── Tipler ──────────────────────────────────────────────────────────────────

export interface DiscountedSaleRef {
  saleId: string;
  date: string;
  productName: string;
  productCategory?: string;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  total: number;
  payment: string;
}

export interface DiscountRecall {
  cariId: string;
  cariName: string;
  salesWithDiscount: DiscountedSaleRef[];
  latestDiscount: {
    percent: number;
    amount: number;
    date: string;
    saleId: string;
    productName: string;
  } | null;
  averagePercent: number;
  averageAmount: number;
  frequency: number;
  hasMemory: boolean;
}

export interface DiscountTransferProposal {
  ok: boolean;
  error?: string;
  fromCari: { id: string; name: string } | null;
  toCari: { id: string; name: string } | null;
  sourceSale: {
    id: string;
    date: string;
    productName: string;
    discountPercent: number;
    discountAmount: number;
    subtotal: number;
  } | null;
  recommendedDiscount: {
    percent: number;
    amount: number | null;
  } | null;
  reasoning: string;
  applicable: boolean;
}

// ── Yardımcı: İsim eşleştirme ───────────────────────────────────────────────

/**
 * Türkçe isimler için toleranslı eşleştirme.
 * "ali" → "Ali Bey", "Ali Yılmaz", "ALİ" hepsiyle eşleşir.
 * "bey"/"beyefendi"/"abla"/"abi" gibi hitapları normalize eder.
 */
const HONORIFICS = ['bey', 'beyefendi', 'abla', 'abi', 'hoca', 'usta'];

function normalizeName(name: string): string {
  const lower = name.toLocaleLowerCase('tr-TR').trim();
  const tokens = lower.split(/\s+/).filter((t) => t.length > 0 && !HONORIFICS.includes(t));
  return tokens.join(' ');
}

/**
 * Verilen isim ile cari kaydını eşleştir.
 * Önce tam normalize eşleşme, sonra kısmi (includes) eşleşme dener.
 */
export function findCariByName(db: DB, name: string): { id: string; name: string; balance: number } | null {
  const target = normalizeName(name);
  if (target.length === 0) return null;

  const candidates = db.cari.filter((c) => !c.deleted);

  // 1) Tam normalize eşleşme
  const exact = candidates.find((c) => normalizeName(c.name) === target);
  if (exact) return { id: exact.id, name: exact.name, balance: exact.balance };

  // 2) Kısmi eşleşme (hedef, cari adının içinde veya tersi)
  const partial = candidates.find((c) => {
    const cn = normalizeName(c.name);
    return cn.length > 0 && (cn.includes(target) || target.includes(cn));
  });
  if (partial) return { id: partial.id, name: partial.name, balance: partial.balance };

  return null;
}

// ── Çekirdek: İndirim geçmişini hatırla ──────────────────────────────────────

function saleHasDiscount(sale: Sale): boolean {
  return (sale.discount > 0 || sale.discountAmount > 0) && !sale.deleted && sale.status === 'tamamlandi';
}

function toRef(sale: Sale): DiscountedSaleRef {
  return {
    saleId: sale.id,
    date: sale.createdAt,
    productName: sale.productName,
    productCategory: sale.productCategory,
    discountPercent: sale.discount,
    discountAmount: sale.discountAmount,
    subtotal: sale.subtotal,
    total: sale.total,
    payment: sale.payment,
  };
}

/**
 * Bir cari'nin tüm indirimli satışlarını hatırlar.
 * Son tarihten eskiye sıralar.
 */
export function recallDiscountHistory(db: DB, cariIdOrName: string): DiscountRecall | null {
  // cariId veya isim olabilir — önce id dene, sonra isim ara
  let cari = db.cari.find((c) => c.id === cariIdOrName && !c.deleted);
  if (!cari) {
    const found = findCariByName(db, cariIdOrName);
    if (!found) {
      logger.info('ai', 'Cari bulunamadı', { query: cariIdOrName });
      return null;
    }
    cari = db.cari.find((c) => c.id === found.id);
    if (!cari) return null;
  }

  const discounted = db.sales
    .filter((s) => s.cariId === cari.id && saleHasDiscount(s))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(toRef);

  if (discounted.length === 0) {
    return {
      cariId: cari.id,
      cariName: cari.name,
      salesWithDiscount: [],
      latestDiscount: null,
      averagePercent: 0,
      averageAmount: 0,
      frequency: 0,
      hasMemory: false,
    };
  }

  const avgPct = discounted.reduce((s, x) => s + x.discountPercent, 0) / discounted.length;
  const avgAmt = discounted.reduce((s, x) => s + x.discountAmount, 0) / discounted.length;
  const latest = discounted[0];

  return {
    cariId: cari.id,
    cariName: cari.name,
    salesWithDiscount: discounted,
    latestDiscount: {
      percent: latest.discountPercent,
      amount: latest.discountAmount,
      date: latest.date,
      saleId: latest.saleId,
      productName: latest.productName,
    },
    averagePercent: Math.round(avgPct * 10) / 10,
    averageAmount: Math.round(avgAmt * 10) / 10,
    frequency: discounted.length,
    hasMemory: true,
  };
}

// ── Çıkarım: İndirim kalıbını çıkar ─────────────────────────────────────────

/**
 * Geçmiş satışlardan "uygulanacak" indirim kalıbını çıkar.
 * Strateji: En son indirim öncelikli (son davranış daha güçlü sinyal).
 *
 * Transfer semantiği: Yüzde, yeni satışın alt toplamına göre yeniden hesaplanır;
 * bu yüzden percent > 0 ise amount = null döner (completeSale hesaplar).
 * Sadece sabit-tutar indirimi varsa (percent=0, amount>0) amount döner.
 */
export function extractDiscountPattern(recall: DiscountRecall): {
  percent: number;
  amount: number | null;
  basis: 'latest' | 'average';
} | null {
  if (!recall.hasMemory) return null;

  const latest = recall.latestDiscount;
  if (latest && latest.percent > 0) {
    return { percent: latest.percent, amount: null, basis: 'latest' };
  }

  if (recall.averagePercent > 0) {
    return { percent: recall.averagePercent, amount: null, basis: 'average' };
  }

  // Sadece sabit tutar indirimi varsa (yüzde yok)
  if (latest && latest.amount > 0) {
    return { percent: 0, amount: latest.amount, basis: 'latest' };
  }

  return null;
}

// ── Ana API: Cross-entity transfer önerisi ──────────────────────────────────

/**
 * "Ali Bey'in indirimini Ahmet Bey'e de uygula" vizyonunun çekirdeği.
 * fromCariName → geçmiş indirim kalıbı → toCariName için öneri.
 *
 * Bu fonksiyon DB'ye yazmaz; sadece yapısal bir öneri döner.
 * Uygulama, caller'ın intentEngine/save() üzerinden yapması gerekir.
 */
export function proposeDiscountTransfer(db: DB, fromCariName: string, toCariName: string): DiscountTransferProposal {
  const fromCari = findCariByName(db, fromCariName);
  const toCari = findCariByName(db, toCariName);

  if (!fromCari) {
    return {
      ok: false,
      error: `"${fromCariName}" adlı cari bulunamadı.`,
      fromCari: null,
      toCari,
      sourceSale: null,
      recommendedDiscount: null,
      reasoning: `Kaynak cari "${fromCariName}" sistemde kayıtlı değil. İndirim geçmişi okunamadı.`,
      applicable: false,
    };
  }

  if (!toCari) {
    return {
      ok: false,
      error: `"${toCariName}" adlı cari bulunamadı.`,
      fromCari,
      toCari: null,
      sourceSale: null,
      recommendedDiscount: null,
      reasoning: `Hedef cari "${toCariName}" sistemde kayıtlı değil. İndirim uygulanacak kayıt yok.`,
      applicable: false,
    };
  }

  if (fromCari.id === toCari.id) {
    return {
      ok: false,
      error: 'Kaynak ve hedef cari aynı.',
      fromCari,
      toCari,
      sourceSale: null,
      recommendedDiscount: null,
      reasoning: 'İndirim aynı kişiye transfer edilemez.',
      applicable: false,
    };
  }

  const recall = recallDiscountHistory(db, fromCari.id);
  if (!recall || !recall.hasMemory) {
    return {
      ok: false,
      error: `"${fromCari.name}" için indirim geçmişi bulunamadı.`,
      fromCari,
      toCari,
      sourceSale: null,
      recommendedDiscount: null,
      reasoning: `${fromCari.name} adlı cariye daha önce hiç indirim uygulanmamış. Transfer için bir kalıp yok.`,
      applicable: false,
    };
  }

  const pattern = extractDiscountPattern(recall);
  if (!pattern) {
    return {
      ok: false,
      error: 'İndirim kalıbı çıkarılamadı.',
      fromCari,
      toCari,
      sourceSale: null,
      recommendedDiscount: null,
      reasoning: `${fromCari.name} geçmişinde indirim var ama tutarlı bir kalıp çıkarılamadı.`,
      applicable: false,
    };
  }

  const sourceSale = recall.salesWithDiscount[0];
  const basisLabel = pattern.basis === 'latest' ? 'en son uygulanan' : 'ortalama';
  const discountDesc =
    pattern.amount !== null ? `${pattern.amount.toLocaleString('tr-TR')} TL tutarında` : `%${pattern.percent} oranında`;

  const reasoning =
    `${fromCari.name} için ${recall.frequency} adet indirimli satış bulundu. ` +
    `Kaynak satış: ${sourceSale.productName} (${new Date(sourceSale.date).toLocaleDateString('tr-TR')}). ` +
    `${basisLabel} indirim: ${discountDesc}. ` +
    `Bu indirim ${toCari.name} için yeni satışa uygulanabilir.`;

  return {
    ok: true,
    fromCari,
    toCari,
    sourceSale: {
      id: sourceSale.saleId,
      date: sourceSale.date,
      productName: sourceSale.productName,
      discountPercent: sourceSale.discountPercent,
      discountAmount: sourceSale.discountAmount,
      subtotal: sourceSale.subtotal,
    },
    recommendedDiscount: {
      percent: pattern.percent,
      amount: pattern.amount,
    },
    reasoning,
    applicable: true,
  };
}

// ── Yardımcı: Öneriyi sale payload'ına enjekte et ───────────────────────────

/**
 * Bir transfer önerisindeki indirimi, satış intent payload'ına yazar.
 * Caller (ör. NexusRouter → SatisAgent) bu payload'ı completeSale'a gönderir.
 *
 * Generic<T>: payload'ın items/payment gibi diğer alanlarını korur; yalnızca
 * indirim ve cari alanlarını günceller.
 */
export function applyDiscountProposalToPayload<T extends Record<string, unknown>>(
  proposal: DiscountTransferProposal,
  payload: T,
): T & { discount?: number; discountAmount?: number; cariId?: string; cariName?: string } {
  if (!proposal.ok || !proposal.recommendedDiscount || !proposal.toCari) {
    return payload;
  }

  const d = proposal.recommendedDiscount;
  return {
    ...payload,
    cariId: proposal.toCari.id,
    cariName: proposal.toCari.name,
    discount: d.percent > 0 ? d.percent : (payload.discount as number | undefined),
    discountAmount: d.amount !== null ? d.amount : (payload.discountAmount as number | undefined),
  };
}
