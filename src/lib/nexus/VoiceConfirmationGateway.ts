/**
 * SOBA NEXUS AI — VoiceConfirmationGateway
 * Güvenli Ses-Only İşlem için Onay Kapısı (Safety Core).
 *
 * Vizyon: Kullanıcı sadece konuşarak tüm işlemleri yapabilmeli —
 * ama yanlış duyulmuş bir komut maddi zarar vermemeli.
 *
 * Bu modül:
 * 1. Yazma (write) işlemlerini execute öncesi yakalar.
 * 2. Doğal dilde read-back üretir ("Ali'ye 4500 lira satış, onaylıyor musunuz?").
 * 3. Kullanıcının sesli onayını/reddini ayrıştırır.
 * 4. Sadece açık onayda işlemi serbest bırakır.
 *
 * Tasarım:
 * - Saf fonksiyonlar (generateReadBack, parseConfirmation, requiresConfirmation)
 *   test edilebilir, yan etkisiz.
 * - Stateful gateway (singleton) pending confirmation state machine yönetir.
 * - Timeout koruması: 15 sn içinde onaz yoksa otomatik iptal.
 * - Üst üste istek koruması: yeni istek gelince eski otomatik reddedilir.
 */

import type { AgentRequest } from '@/agents/types';
import { logger } from '@/lib/logger';

// ── Sabitler ─────────────────────────────────────────────────────────────────

/**
 * Onay gerektiren (write/financial) aksiyonlar.
 * Read-only sorgular (navigation, analiz) dahil değildir.
 */
const WRITE_ACTIONS: ReadonlySet<string> = new Set([
  'sale',
  'satis',
  'yeniSatis',
  'sale_iptal',
  'iptalEt',
  'iptal',
  'sale_iade',
  'iadeYap',
  'sale_fiyat_duzelt',
  'fiyatDuzelt',
  'kasa_gelir',
  'kasa_gider',
  'cari_tahsilat',
  'cari_ekle',
  'stok_guncelle',
  'urun_ekle',
]);

export function requiresConfirmation(action: string): boolean {
  return WRITE_ACTIONS.has(action);
}

// ── Read-back üreteci (saf fonksiyon) ────────────────────────────────────────

function asString(val: unknown): string | undefined {
  return typeof val === 'string' && val.length > 0 ? val : undefined;
}
function asNumber(val: unknown): number | undefined {
  return typeof val === 'number' && !Number.isNaN(val) ? val : undefined;
}

function money(n: number): string {
  return `${Math.round(n).toLocaleString('tr-TR')} TL`;
}

/**
 * Bir AgentRequest için doğal Türkçe okuma metni üretir.
 * TTS layer (VoiceNexusCore.prepareTextForSpeech) ₺ ve %'yi konuşmaya çevirir.
 *
 * Bilinmeyen aksiyonlar için generic fallback döner.
 */
export function generateReadBack(req: AgentRequest): string {
  const p = (req.payload as Record<string, unknown>) || {};
  const action = req.action;

  switch (action) {
    case 'sale':
    case 'satis':
    case 'yeniSatis': {
      const items = Array.isArray(p.items) ? (p.items as Array<Record<string, unknown>>) : [];
      const cariName = asString(p.cariName) || asString(p.customerName);
      const payment = asString(p.payment) || 'nakit';
      const discount = asNumber(p.discount);
      const discountAmount = asNumber(p.discountAmount);
      const total = asNumber(p.total);

      const itemDesc =
        items.length === 0
          ? 'ürün'
          : items
              .map((i) => {
                const qty = asNumber(i.quantity) ?? 1;
                const name = asString(i.productName) ?? asString(i.productName) ?? 'ürün';
                const price = asNumber(i.unitPrice);
                return price !== undefined ? `${qty} adet ${name}, ${money(price)}'den` : `${qty} adet ${name}`;
              })
              .join(', ');

      const parts: string[] = [];
      if (cariName) parts.push(`${cariName}'ya`);
      parts.push(itemDesc);

      if (discount && discount > 0) {
        parts.push(`yüzde ${discount} indirim`);
      } else if (discountAmount && discountAmount > 0) {
        parts.push(`${money(discountAmount)} indirim`);
      }

      if (total !== undefined) parts.push(`toplam ${money(total)}`);
      parts.push(`${payment} ödeme`);

      return `${parts.join(', ')}. Onaylıyor musunuz?`;
    }

    case 'sale_iptal':
    case 'iptalEt':
    case 'iptal': {
      const saleId = asString(p.saleId);
      return saleId
        ? `${saleId} numaralı satış iptal edilecek. Onaylıyor musunuz?`
        : 'Satış iptal edilecek. Onaylıyor musunuz?';
    }

    case 'sale_iade':
    case 'iadeYap': {
      const saleId = asString(p.saleId);
      const qty = asNumber(p.quantity);
      const qtyDesc = qty !== undefined ? ` (${qty} adet)` : '';
      return saleId
        ? `${saleId} numaralı satıştan iade${qtyDesc}. Onaylıyor musunuz?`
        : `Satıştan iade${qtyDesc}. Onaylıyor musunuz?`;
    }

    case 'sale_fiyat_duzelt':
    case 'fiyatDuzelt': {
      const saleId = asString(p.saleId);
      const yeniFiyat = asNumber(p.yeniFiyat) ?? asNumber(p.unitPrice);
      return saleId && yeniFiyat !== undefined
        ? `${saleId} numaralı satışın fiyatı ${money(yeniFiyat)} olarak düzeltilecek. Onaylıyor musunuz?`
        : 'Satış fiyatı düzeltilecek. Onaylıyor musunuz?';
    }

    case 'kasa_gelir': {
      const amount = asNumber(p.amount) ?? 0;
      const kasa = asString(p.kasa) || 'nakit';
      const desc = asString(p.description);
      const category = asString(p.category);
      const catDesc = category && category !== 'diger_gelir' ? ` (${category})` : '';
      const descPart = desc ? ` — ${desc}` : '';
      return `${money(amount)} gelir, ${kasa} kasasına${catDesc}${descPart}. Onaylıyor musunuz?`;
    }

    case 'kasa_gider': {
      const amount = asNumber(p.amount) ?? 0;
      const kasa = asString(p.kasa) || 'nakit';
      const desc = asString(p.description);
      const category = asString(p.category);
      const catDesc = category && category !== 'diger_gider' ? ` (${category})` : '';
      const descPart = desc ? ` — ${desc}` : '';
      return `${money(amount)} gider, ${kasa} kasasından${catDesc}${descPart}. Onaylıyor musunuz?`;
    }

    case 'cari_tahsilat': {
      const amount = asNumber(p.amount) ?? 0;
      const cariName = asString(p.cariName);
      const kasa = asString(p.kasa) || 'nakit';
      const fromPart = cariName ? `${cariName}'den ` : '';
      return `${fromPart}${money(amount)} tahsilat, ${kasa} kasasına. Onaylıyor musunuz?`;
    }

    case 'cari_ekle': {
      const name = asString(p.name);
      const type = asString(p.type) || 'müşteri';
      const phone = asString(p.phone);
      const phonePart = phone ? `, telefon ${phone}` : '';
      return `Yeni ${type}: ${name || 'isimsiz'}${phonePart}. Onaylıyor musunuz?`;
    }

    case 'stok_guncelle': {
      const productName = asString(p.productName);
      const stock = asNumber(p.stock);
      const note = asString(p.note);
      const notePart = note ? ` — ${note}` : '';
      return productName && stock !== undefined
        ? `${productName} stoğu ${stock} olarak güncellenecek${notePart}. Onaylıyor musunuz?`
        : 'Stok güncellenecek. Onaylıyor musunuz?';
    }

    case 'urun_ekle': {
      const name = asString(p.name);
      const price = asNumber(p.price);
      const stock = asNumber(p.stock);
      const category = asString(p.category) || 'soba';
      const pricePart = price !== undefined ? `, ${money(price)}` : '';
      const stockPart = stock !== undefined ? `, ${stock} adet stok` : '';
      return `Yeni ürün: ${name || 'isimsiz'} (${category})${pricePart}${stockPart}. Onaylıyor musunuz?`;
    }

    default: {
      // Generic fallback — action adını açıkça söyle
      return `"${action}" işlemi yapılacak. Onaylıyor musunuz?`;
    }
  }
}

// ── Onay ayrıştırıcı (saf fonksiyon) ─────────────────────────────────────────

export type ConfirmationVerdict = 'confirm' | 'reject' | 'unclear';

const CONFIRM_WORDS = [
  'evet',
  'onay',
  'onayla',
  'onaylıyorum',
  'tamam',
  'olur',
  'peki',
  'tabi',
  'tabii',
  'doğru',
  'dogru',
  'onay veriyorum',
  'evet yap',
  'olur yap',
  'devam',
  'tamam onayla',
  'evet onaylıyorum',
];

const REJECT_WORDS = [
  'hayır',
  'hayir',
  'iptal',
  'vazgeç',
  'vazgec',
  'olmasın',
  'olmasin',
  'yanlış',
  'yanlis',
  'değil',
  'degil',
  'hayır yapma',
  'hayir yapma',
  'olmasın yapma',
  'geri',
  'geri al',
  'iptal et',
  'hayır iptal',
];

/**
 * Kullanıcının sesli yanıtını onay/red/belirsiz olarak sınıflandırır.
 * Türkçe karakter normalize eder (ı→i, ş→s vb. — STT bazen hatalı döner).
 */
export function parseConfirmation(text: string): ConfirmationVerdict {
  const raw = text.toLocaleLowerCase('tr-TR').trim();
  if (raw.length === 0) return 'unclear';

  // Türkçe karakterleri ASCII'ye normalize (STT hataları için tolerans)
  const normalized = raw
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i');

  const normalizeWord = (w: string) =>
    w
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

  // Red öncelikli — "hayır onaylıyorum" gibi çelişkilerde güvenlik tarafı kazanır
  for (const w of REJECT_WORDS) {
    if (normalized.includes(normalizeWord(w))) return 'reject';
  }
  for (const w of CONFIRM_WORDS) {
    if (normalized.includes(normalizeWord(w))) return 'confirm';
  }

  return 'unclear';
}

// ── Gateway state machine ────────────────────────────────────────────────────

export interface ConfirmationResult {
  confirmed: boolean;
  request: AgentRequest;
  responseText?: string;
  cancelled?: boolean;
  reason?: string;
  verdict?: ConfirmationVerdict;
}

export interface GatewayState {
  state: 'idle' | 'pending';
  pendingAction: string | null;
}

interface PendingEntry {
  request: AgentRequest;
  resolve: (r: ConfirmationResult) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const DEFAULT_TIMEOUT_MS = 15000;

export class VoiceConfirmationGateway {
  private static instance: VoiceConfirmationGateway;
  private pending: PendingEntry | null = null;

  private constructor() {}

  public static getInstance(): VoiceConfirmationGateway {
    if (!VoiceConfirmationGateway.instance) {
      VoiceConfirmationGateway.instance = new VoiceConfirmationGateway();
    }
    return VoiceConfirmationGateway.instance;
  }

  /**
   * Bir write aksiyon için onay ister.
   * Caller, await sırasında getPendingReadBack() ile metni alıp TTS ile söylemeli,
   * sonra kullanıcının sesli yanıtını submitResponse()'a iletmeli.
   *
   * Returns: confirmed=true ise işlem onaylandı, false ise reddedildi/iptal/zaman aşımı.
   */
  public requestConfirmation(request: AgentRequest, opts?: { timeoutMs?: number }): Promise<ConfirmationResult> {
    // Üst üste istek koruması — eski pending'i güvenli reddet
    if (this.pending) {
      this.cancelInternal('Üst üste yeni istek geldi, önceki onay iptal edildi');
    }

    return new Promise<ConfirmationResult>((resolve) => {
      const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      this.pending = {
        request,
        resolve,
        timeout: setTimeout(() => {
          logger.warn('voice', 'Onay zaman aşımı', { action: request.action });
          this.cancelInternal('Onay zaman aşımı');
        }, timeoutMs),
      };
      logger.info('voice', 'Confirmation requested', { action: request.action });
    });
  }

  /**
   * Kullanıcının sesli yanıtını işle.
   * Belirsiz (unclear) ise false döner — caller tekrar sormalı.
   * Açık onay/red ise true döner ve pending resolve edilir.
   */
  public submitResponse(text: string): boolean {
    if (!this.pending) return false;

    const verdict = parseConfirmation(text);
    if (verdict === 'unclear') {
      logger.info('voice', 'Confirmation unclear, re-asking', { text });
      return false;
    }

    const p = this.pending;
    clearTimeout(p.timeout);
    this.pending = null;

    p.resolve({
      confirmed: verdict === 'confirm',
      request: p.request,
      responseText: text,
      verdict,
    });
    logger.info('voice', 'Confirmation resolved', { verdict });
    return true;
  }

  /**
   * Pending onayı iptal et (kullanıcı "vazgeç" dışında bir yolla çıktıysa).
   */
  public cancel(reason?: string): void {
    this.cancelInternal(reason);
  }

  private cancelInternal(reason?: string): void {
    if (!this.pending) return;
    const p = this.pending;
    clearTimeout(p.timeout);
    this.pending = null;
    p.resolve({ confirmed: false, request: p.request, cancelled: true, reason });
  }

  /**
   * Pending işlemin read-back metnini al (TTS için).
   */
  public getPendingReadBack(): string | null {
    if (!this.pending) return null;
    return generateReadBack(this.pending.request);
  }

  public getState(): GatewayState {
    return {
      state: this.pending ? 'pending' : 'idle',
      pendingAction: this.pending?.request.action ?? null,
    };
  }

  /**
   * Test/yardımcı: pending'i sıfırla (unit testler için).
   */
  public reset(): void {
    if (this.pending) {
      clearTimeout(this.pending.timeout);
      this.pending = null;
    }
  }
}

export const voiceConfirmationGateway = VoiceConfirmationGateway.getInstance();
