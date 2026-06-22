/**
 * SOBA NEXUS AI — VoiceSaleComposer
 * Çok adımlı sesli satış inşacı (Multi-turn Voice Sale Composer).
 *
 * Vizyon: Kullanıcı sadece konuşarak bir satışı parça parça inşa eder:
 *   "2 tane 80lik ekle"     → item ekle
 *   "Ali'ye sat"            → cari ata
 *   "yüzde 10 indirim"      → discount
 *   "kartla"                → payment
 *   "sat" / "tamamla"       → finalize → SaleIntent üret → onay gateway
 *   "iptal" / "vazgeç"      → composer sıfırla
 *   "ne var" / "durum"      → mevcut draft özeti
 *   "80liği çıkar"          → item sil
 *   "80liği 3 tane yap"     → adet güncelle
 *
 * Tasarım:
 * - Saf fonksiyonlar (parseComposerCommand, applyCommandToDraft, draftToSaleIntent,
 *   summarizeDraft) — test edilebilir, yan etkisiz, DB'ye yazmaz.
 * - Stateful composer (singleton) — draft state machine yönetir.
 * - SatisAgent/SaleIntent ile %100 uyumlu — finalize çıktısı completeSale'a gider.
 */

import type { DB, Product } from "@/types";
import type { SaleIntent } from "@/domain/types";
import { findCariByName } from "@/lib/nexus/modules/DiscountMemoryModule";
import { logger } from "@/lib/logger";

// ── Draft modeli ─────────────────────────────────────────────────────────────

export interface ComposerItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  cost: number;
}

export interface ComposerDraft {
  items: ComposerItem[];
  cariId?: string;
  cariName?: string;
  discount?: number;        // yüzde
  discountAmount?: number;  // sabit tutar
  payment?: SaleIntent["payment"];
}

export type ComposerCommandKind =
  | "add_item"
  | "set_cari"
  | "set_discount"
  | "set_discount_amount"
  | "set_payment"
  | "remove_item"
  | "set_qty"
  | "set_unit_price"
  | "finalize"
  | "cancel"
  | "status"
  | "unknown";

export interface ComposerCommand {
  kind: ComposerCommandKind;
  /** Kullanıcıya gösterilecek kısa onay mesajı ("2 adet Soba 80lik eklendi") */
  ack: string;
  /** Komuta özgü veri (productId, cariId, amount vb.) */
  data?: Record<string, unknown>;
}

export interface ApplyResult {
  draft: ComposerDraft;
  command: ComposerCommand;
  /** Komut uygulanamazsa hata mesajı */
  error?: string;
}

// ── Yardımcı: Ürün arama (toleranslı) ────────────────────────────────────────

function normalizeText(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ürün adını toleranslı arar.
 * "80lik" → "Soba 80lik", "soba 80" → "Soba 80lik" gibi kısmi eşleşmeler.
 * Stoktan düşürme öncesi quantity kontrolü caller'da yapılır (composer stok düşürmez).
 */
export function findProductByName(db: DB, name: string): Product | null {
  const target = normalizeText(name);
  if (target.length === 0) return null;

  const candidates = db.products.filter((p) => !p.deleted);

  // 1) Tam normalize eşleşme
  const exact = candidates.find((p) => normalizeText(p.name) === target);
  if (exact) return exact;

  // 2) Hedef, ürün adının içinde (kısmi)
  const partial = candidates.find((p) => {
    const pn = normalizeText(p.name);
    return pn.includes(target);
  });
  if (partial) return partial;

  // 3) Ürün adı, hedefin içinde (ters yön — "soba 80lik kırmızı" → "Soba 80lik")
  const reverse = candidates.find((p) => {
    const pn = normalizeText(p.name);
    return pn.length >= 3 && target.includes(pn);
  });
  if (reverse) return reverse;

  return null;
}

// ── Saf: Komut ayrıştırıcı ───────────────────────────────────────────────────

function asInt(s: string | undefined): number | undefined {
  if (s === undefined) return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
}

function asFloat(s: string | undefined): number | undefined {
  if (s === undefined) return undefined;
  const n = parseFloat(s.replace(",", "."));
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Kelime-bazlı boundary kontrolü — JavaScript \b Türkçe karakterlerde
 (özellikle ç/ş/ğ) güvenilir değil. Bunun yerine kelime split + includes kullanır.
 */
function hasWord(q: string, ...words: string[]): boolean {
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);
  return words.some((w) => tokens.includes(w));
}

/**
 * Sesli metni ComposerCommand'a çevirir.
 * DB bağlamı gerekir — ürün/cari arama için.
 *
 * Kelime-bazlı yaklaşım: \b regex boundary yerine token split + includes.
 * Türkçe karakterlere (ç/ş/ğ/ı) güvenli.
 *
 * Öncelik sırası:
 * 1. cancel (iptal/vazgeç) — en yüksek, yanlışlıkla finalize olmasın
 * 2. status (durum/ne var)
 * 3. add_item (ekle içeriyor)
 * 4. set_cari ("X'ye sat", "Xbeye" — ekle İÇERMİYORSA)
 * 5. set_payment (nakit/kart/havale/cari/veresiye — ekle İÇERMİYORSA)
 * 6. set_discount (yüzde X indirim/iskonto)
 * 7. remove_item (çık/çıkar/sil içeriyor)
 * 8. set_qty (X yap)
 * 9. set_unit_price (X olsun)
 * 10. finalize (sadece "sat"/"tamamla" — cari eki YOKSA)
 */
export function parseComposerCommand(text: string, db: DB): ComposerCommand {
  const q = normalizeText(text);
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);

  // --- 1. cancel ---
  if (hasWord(q, "iptal", "vazgeç", "vazgec")) {
    return { kind: "cancel", ack: "Satış iptal edildi." };
  }

  // --- 2. status ---
  if (hasWord(q, "durum", "özet") || q.includes("ne var") || q.includes("ne ekledim") || q.includes("sepette ne var")) {
    return { kind: "status", ack: "" };
  }

  // --- 3. add_item (ekle içeriyor) ---
  if (q.includes("ekle")) {
    // "X tane/adet Y ekle"  veya  "Y ekle"
    // Quantity sadece "tane/adet" takip ediyorsa yakalanır (80lik'in "80"i yanlış yakalanmasın)
    const m = q.match(/(?:(\d+)\s*(?:tane|adet)\s+)?(.+?)\s*(?:ekle|ekle sepete|sepete ekle)/);
    if (m) {
      const qty = asInt(m[1]) ?? 1;
      const productName = (m[2] || "").trim();
      // "cari ekle" / "müşteri ekle" — composer'a düşmez
      if (productName === "cari" || productName.includes("müşteri")) {
        return { kind: "unknown", ack: "Müşteri eklemek için cari sayfasını kullanın.", data: { reason: "cari_ekle_not_supported" } };
      }
      if (productName.length >= 2) {
        const product = findProductByName(db, productName);
        if (product) {
          return {
            kind: "add_item",
            ack: `${qty} adet ${product.name} eklendi (${product.price} TL).`,
            data: { productId: product.id, productName: product.name, quantity: qty, unitPrice: product.price, cost: product.cost },
          };
        }
        return { kind: "unknown", ack: `"${productName}" adlı ürün bulunamadı.`, data: { reason: "product_not_found" } };
      }
    }
  }

  // --- 4. set_cari (ekle YOKSA) ---
  if (!q.includes("ekle") && !q.includes("ürün")) {
    // "ali'ye sat", "ali'ye", "ahmet beye"
    // Apostroflu: "X'ye/X'ya"  VEYA  kelime: "X beye/beyine/hanıma"
    const apostrof = q.match(/([a-zçğıöşü]{2,})\s*'?(?:ye|ya)\b/);
    if (apostrof) {
      const nameCandidate = apostrof[1];
      const FILLERS = ["de", "ye", "ya", "bir", "icin", "ile", "ve", "ama", "bu", "su", "ne", "kadar"];
      if (!FILLERS.includes(nameCandidate)) {
        const found = findCariByName(db, nameCandidate);
        if (found) {
          return { kind: "set_cari", ack: `Müşteri: ${found.name}.`, data: { cariId: found.id, cariName: found.name } };
        }
      }
    }
    // "ahmet beye", "ali beyine", "ayşe hanıma"
    const honorific = q.match(/([a-zçğıöşü]{2,})\s+(?:beye|beyine|hanıma|abla|abime)\b/);
    if (honorific) {
      const nameCandidate = honorific[1];
      const FILLERS = ["de", "ye", "ya", "bir", "icin", "ile", "ve", "ama", "bu", "su", "ne", "kadar"];
      if (!FILLERS.includes(nameCandidate)) {
        const found = findCariByName(db, nameCandidate);
        if (found) {
          return { kind: "set_cari", ack: `Müşteri: ${found.name}.`, data: { cariId: found.id, cariName: found.name } };
        }
      }
    }
  }

  // --- 5. set_payment (ekle YOKSA) ---
  if (!q.includes("ekle")) {
    if (hasWord(q, "nakit")) return { kind: "set_payment", ack: "Ödeme: nakit.", data: { payment: "nakit" } };
    if (hasWord(q, "kartla", "kart") && !q.includes("kartla öde")) return { kind: "set_payment", ack: "Ödeme: kart.", data: { payment: "kart" } };
    if (hasWord(q, "havaleyle", "havale")) return { kind: "set_payment", ack: "Ödeme: havale.", data: { payment: "havale" } };
    if (hasWord(q, "veresiye") || (hasWord(q, "cariden") && !q.includes("ekle"))) {
      return { kind: "set_payment", ack: "Ödeme: cari (veresiye).", data: { payment: "cari" } };
    }
    // "cari" tek başına (ekle YOKSA, "cariye sat" set_cari'ye düşer ama cari kelimesi buraya gelir)
    if (hasWord(q, "cari") && !q.includes("'ye") && !q.includes("beye")) {
      return { kind: "set_payment", ack: "Ödeme: cari (veresiye).", data: { payment: "cari" } };
    }
  }

  // --- 6. set_discount: "yüzde 10 indirim", "%10 indirim/iskonto" ---
  if (q.includes("indirim") || q.includes("iskonto")) {
    const pctMatch = q.match(/(?:yüzde|%)\s*(\d+(?:[.,]\d+)?)\s*(?:indirim|iskonto|çık)?/);
    if (pctMatch) {
      const pct = asFloat(pctMatch[1]);
      if (pct !== undefined && pct >= 0 && pct <= 100) {
        return { kind: "set_discount", ack: `Yüzde ${pct} indirim uygulandı.`, data: { discount: pct } };
      }
    }
    const amtMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:tl|lira|₺)\s*(?:indirim|iskonto)/);
    if (amtMatch) {
      const amt = asFloat(amtMatch[1]);
      if (amt !== undefined && amt > 0) {
        return { kind: "set_discount_amount", ack: `${Math.round(amt)} TL indirim.`, data: { discountAmount: amt } };
      }
    }
    // "10 indirim" (sayı + indirim, yüzde işareti yok, 0-100 arası)
    const numOnly = q.match(/(\d+(?:[.,]\d+)?)\s*(?:indirim|iskonto)/);
    if (numOnly) {
      const n = asFloat(numOnly[1]);
      if (n !== undefined && n > 0 && n <= 100) {
        return { kind: "set_discount", ack: `Yüzde ${n} indirim uygulandı.`, data: { discount: n } };
      }
    }
  }

  // --- 7. remove_item (çık/çıkar/sil içeriyor) ---
  if (q.includes("çık") || q.includes("çıkar") || q.includes("cikar") || q.includes("sil")) {
    const m = q.match(/(.+?)\s*(?:çık|çıkar|cikar|sil)/);
    if (m) {
      let nameCandidate = (m[1] || "").trim();
      nameCandidate = nameCandidate.replace(/\b(sepetten|sepet|ürünü|ürün)\b/g, "").trim();
      nameCandidate = nameCandidate.replace(/liği$/, "lik").replace(/lığı$/, "lık").replace(/luğu$/, "luk").replace(/lüğü$/, "lük");
      const nameTokens = nameCandidate.split(/\s+/).filter((t) => t.length > 0);
      const lastToken = nameTokens[nameTokens.length - 1] ?? nameCandidate;
      if (lastToken.length >= 2) {
        return { kind: "remove_item", ack: `Ürün çıkarılmaya çalışılıyor.`, data: { productName: lastToken } };
      }
    }
  }

  // --- 8. set_qty: "80liği 3 tane yap", "80liği 3 yap" ---
  const qtyMatch = q.match(/(.+?)\s*(\d+)\s*(?:tane|adet)?\s*yap/);
  if (qtyMatch) {
    let nameCandidate = (qtyMatch[1] || "").trim();
    nameCandidate = nameCandidate.replace(/liği$/, "lik").replace(/lığı$/, "lık").replace(/luğu$/, "luk").replace(/lüğü$/, "lük");
    const nameTokens = nameCandidate.split(/\s+/).filter((t) => t.length > 0);
    const lastToken = nameTokens[nameTokens.length - 1] ?? nameCandidate;
    const qty = asInt(qtyMatch[2]);
    if (qty !== undefined && qty > 0 && lastToken.length >= 2) {
      return { kind: "set_qty", ack: `Adet güncelleniyor.`, data: { productName: lastToken, quantity: qty } };
    }
  }

  // --- 9. set_unit_price: "80lik 4500 lira olsun" ---
  const priceMatch = q.match(/(.+?)\s*(\d+(?:[.,]\d+)?)\s*(?:tl|lira|₺)?\s*(?:olsun|yap|fiyat)/);
  if (priceMatch) {
    let nameCandidate = (priceMatch[1] || "").trim();
    nameCandidate = nameCandidate.replace(/liği$/, "lik").replace(/lığı$/, "lık");
    nameCandidate = nameCandidate.replace(/\b(fiyatı|fiyat|olsun|yap)\b/g, "").trim();
    const nameTokens = nameCandidate.split(/\s+/).filter((t) => t.length > 0);
    const lastToken = nameTokens[nameTokens.length - 1] ?? nameCandidate;
    const price = asFloat(priceMatch[2]);
    if (price !== undefined && price > 0 && lastToken.length >= 2) {
      return { kind: "set_unit_price", ack: `Fiyat güncelleniyor.`, data: { productName: lastToken, unitPrice: price } };
    }
  }

  // --- 10. finalize (en son — cari eki YOKSA, ekle YOKSA) ---
  // Sadece net finalize kelimeleri: "sat" tek başına, "tamamla", "gönder"
  // "ali'ye sat" set_cari'ye düştü, buraya gelmez
  if (!q.includes("'ye") && !q.includes("'ya") && !q.includes("beye") && !q.includes("beyine") && !q.includes("ekle")) {
    if (tokens.length === 1 && (tokens[0] === "sat" || tokens[0] === "tamamla" || tokens[0] === "gonder" || tokens[0] === "gönder" || tokens[0] === "kapat")) {
      return { kind: "finalize", ack: "Satış tamamlanmak üzere." };
    }
    if (q === "satış yap" || q === "satışı tamamla" || q === "satış tamamla" || q === "onayla satışı") {
      return { kind: "finalize", ack: "Satış tamamlanmak üzere." };
    }
  }

  return { kind: "unknown", ack: "Bu komutu anlamadım. 'X tane Y ekle', 'Ali'ye sat', 'yüzde 10 indirim', 'sat' diyebilirsiniz." };
}

// ── Saf: Komutu draft'a uygula ───────────────────────────────────────────────

function findItemIndex(draft: ComposerDraft, productName: string): number {
  const target = normalizeText(productName);
  return draft.items.findIndex((i) => normalizeText(i.productName).includes(target) || target.includes(normalizeText(i.productName)));
}

export function applyCommandToDraft(draft: ComposerDraft, command: ComposerCommand, _db: DB): ApplyResult {
  switch (command.kind) {
    case "add_item": {
      const d = command.data as { productId: string; productName: string; quantity: number; unitPrice: number; cost: number };
      // Aynı ürün varsa miktarı artır
      const existing = draft.items.find((i) => i.productId === d.productId);
      if (existing) {
        const items = draft.items.map((i) =>
          i.productId === d.productId ? { ...i, quantity: i.quantity + d.quantity } : i,
        );
        return { draft: { ...draft, items }, command: { ...command, ack: `${d.productName} adedi ${existing.quantity + d.quantity} oldu.` } };
      }
      return {
        draft: {
          ...draft,
          items: [...draft.items, { productId: d.productId, productName: d.productName, quantity: d.quantity, unitPrice: d.unitPrice, cost: d.cost }],
        },
        command,
      };
    }

    case "set_cari": {
      const d = command.data as { cariId: string; cariName: string };
      return { draft: { ...draft, cariId: d.cariId, cariName: d.cariName }, command };
    }

    case "set_discount": {
      const d = command.data as { discount: number };
      return { draft: { ...draft, discount: d.discount, discountAmount: undefined }, command };
    }

    case "set_discount_amount": {
      const d = command.data as { discountAmount: number };
      return { draft: { ...draft, discountAmount: d.discountAmount, discount: undefined }, command };
    }

    case "set_payment": {
      const d = command.data as { payment: SaleIntent["payment"] };
      return { draft: { ...draft, payment: d.payment }, command };
    }

    case "remove_item": {
      const d = command.data as { productName: string };
      const idx = findItemIndex(draft, d.productName);
      if (idx === -1) {
        return { draft, command, error: `"${d.productName}" sepette bulunamadı.` };
      }
      const items = draft.items.filter((_, i) => i !== idx);
      return { draft: { ...draft, items }, command: { ...command, ack: `${draft.items[idx].productName} çıkarıldı.` } };
    }

    case "set_qty": {
      const d = command.data as { productName: string; quantity: number };
      const idx = findItemIndex(draft, d.productName);
      if (idx === -1) {
        return { draft, command, error: `"${d.productName}" sepette bulunamadı.` };
      }
      const items = draft.items.map((i, ix) => (ix === idx ? { ...i, quantity: d.quantity } : i));
      return { draft: { ...draft, items }, command: { ...command, ack: `${draft.items[idx].productName} adedi ${d.quantity} oldu.` } };
    }

    case "set_unit_price": {
      const d = command.data as { productName: string; unitPrice: number };
      const idx = findItemIndex(draft, d.productName);
      if (idx === -1) {
        return { draft, command, error: `"${d.productName}" sepette bulunamadı.` };
      }
      const items = draft.items.map((i, ix) => (ix === idx ? { ...i, unitPrice: d.unitPrice } : i));
      return { draft: { ...draft, items }, command: { ...command, ack: `${draft.items[idx].productName} fiyatı ${d.unitPrice} TL oldu.` } };
    }

    case "finalize":
    case "cancel":
    case "status":
    case "unknown":
      return { draft, command };

    default:
      return { draft, command };
  }
}

// ── Saf: Draft → SaleIntent + validation ─────────────────────────────────────

export interface FinalizeResult {
  ok: boolean;
  intent?: SaleIntent;
  error?: string;
}

/**
 * Draft'ı SaleIntent'e çevirir. Validation yapar:
 * - En az 1 item olmalı
 * - Her item geçerli productId'ye sahip olmalı (stok kontrolü caller'da — completeSale)
 * - payment yoksa default 'nakit'
 */
export function draftToSaleIntent(draft: ComposerDraft): FinalizeResult {
  if (draft.items.length === 0) {
    return { ok: false, error: "Sepette ürün yok. Önce 'X tane Y ekle' deyin." };
  }

  for (const item of draft.items) {
    if (!item.productId || item.quantity <= 0) {
      return { ok: false, error: `${item.productName}: geçersiz ürün veya adet.` };
    }
  }

  const intent: SaleIntent = {
    items: draft.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      cost: i.cost,
    })),
    payment: draft.payment ?? "nakit",
    cariId: draft.cariId,
    cariName: draft.cariName,
    discount: draft.discount,
    discountAmount: draft.discountAmount,
  };

  return { ok: true, intent };
}

// ── Saf: Draft özeti (TTS için) ──────────────────────────────────────────────

function money(n: number): string {
  return `${Math.round(n).toLocaleString("tr-TR")} TL`;
}

function subtotal(draft: ComposerDraft): number {
  return draft.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}

function calcTotal(draft: ComposerDraft): number {
  const sub = subtotal(draft);
  if (draft.discountAmount && draft.discountAmount > 0) return Math.max(0, sub - draft.discountAmount);
  if (draft.discount && draft.discount > 0) return Math.round(sub * (1 - draft.discount / 100));
  return sub;
}

/**
 * Draft'ın insan-okunabilir özetini üretir. TTS layer ₺/%'yi konuşmaya çevirir.
 * "Sepette 2 ürün: 1 adet Soba 80lik, 2 adet Soba 60lık. Müşteri Ali. Yüzde 10 indirim. Toplam 13.500 TL, nakit."
 */
export function summarizeDraft(draft: ComposerDraft): string {
  if (draft.items.length === 0) {
    return "Sepet boş. 'X tane Y ekle' diyerek başlayın.";
  }

  const parts: string[] = [];
  parts.push(`Sepette ${draft.items.length} ürün:`);
  parts.push(draft.items.map((i) => `${i.quantity} adet ${i.productName}`).join(", "));

  if (draft.cariName) parts.push(`Müşteri: ${draft.cariName}`);

  if (draft.discount && draft.discount > 0) {
    parts.push(`Yüzde ${draft.discount} indirim`);
  } else if (draft.discountAmount && draft.discountAmount > 0) {
    parts.push(`${money(draft.discountAmount)} indirim`);
  }

  parts.push(`Toplam ${money(calcTotal(draft))}, ${draft.payment ?? "nakit"}`);
  return parts.join(". ") + ".";
}

// ── Stateful: VoiceSaleComposer ──────────────────────────────────────────────

export interface ComposerStateResult {
  draft: ComposerDraft;
  ack: string;
  error?: string;
  /** finalize ise SaleIntent hazır; caller onay gateway'ine gönderir */
  finalizedIntent?: SaleIntent;
  /** cancel ise true */
  cancelled?: boolean;
  /** status ise özet döner */
  summary?: string;
}

export class VoiceSaleComposer {
  private static instance: VoiceSaleComposer;
  private draft: ComposerDraft = { items: [] };

  private constructor() {}

  public static getInstance(): VoiceSaleComposer {
    if (!VoiceSaleComposer.instance) {
      VoiceSaleComposer.instance = new VoiceSaleComposer();
    }
    return VoiceSaleComposer.instance;
  }

  /**
   * Sesli komutu işle. DB ürün/cari arama için gerekir.
   * Composer DB'ye yazmaz — finalize çıktısı caller'da completeSale'a gider.
   */
  public process(text: string, db: DB): ComposerStateResult {
    const command = parseComposerCommand(text, db);

    // cancel: draft'ı sıfırla
    if (command.kind === "cancel") {
      const ack = command.ack;
      this.draft = { items: [] };
      logger.info("ai", "Sale composer cancelled");
      return { draft: this.draft, ack, cancelled: true };
    }

    // status: özet döner, draft değişmez
    if (command.kind === "status") {
      const summary = summarizeDraft(this.draft);
      return { draft: this.draft, ack: summary, summary };
    }

    // finalize: SaleIntent üret
    if (command.kind === "finalize") {
      const result = draftToSaleIntent(this.draft);
      if (!result.ok || !result.intent) {
        return { draft: this.draft, ack: result.error ?? "Satış tamamlanamadı.", error: result.error };
      }
      logger.info("ai", "Sale composer finalized", { itemCount: this.draft.items.length });
      // Draft'ı sıfırlama — caller onay sonrası reset() çağırmalı
      return { draft: this.draft, ack: command.ack, finalizedIntent: result.intent };
    }

    // Diğer komutlar: draft'a uygula
    const apply = applyCommandToDraft(this.draft, command, db);
    if (apply.error) {
      return { draft: this.draft, ack: apply.error, error: apply.error };
    }
    this.draft = apply.draft;
    return { draft: this.draft, ack: apply.command.ack };
  }

  public getDraft(): ComposerDraft {
    return this.draft;
  }

  public reset(): void {
    this.draft = { items: [] };
  }

  public isEmpty(): boolean {
    return this.draft.items.length === 0;
  }
}

export const voiceSaleComposer = VoiceSaleComposer.getInstance();
