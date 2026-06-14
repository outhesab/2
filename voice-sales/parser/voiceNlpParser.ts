// voice-sales/parser/voiceNlpParser.ts

import type {
  VoiceCommand,
  VoiceCommandAction,
  VoiceItem,
  PaymentMethod,
  VoiceSaleOptions,
} from '../types';

// ─── Action Keywords ────────────────────────────────────────────

const ACTION_KEYWORDS: Record<VoiceCommandAction, string[]> = {
  satis: ['sat', 'satis', 'olustur', 'kaydet', 'ekle', 'fatura', 'kes'],
  iptal: ['iptal', 'sil', 'geri al', 'vazgec'],
  iade: ['iade', 'geri ver', 'geri', 'dondur'],
  fiyat_duzelt: ['fiyat', 'duzelt', 'degistir', 'guncelle', 'indirim'],
  unknown: [],
};

const PAYMENT_KEYWORDS: Record<PaymentMethod, string[]> = {
  nakit: ['nakit', 'pesin', 'elden', 'nakit para'],
  kart: ['kart', 'kredi karti', 'banka karti', 'kartla', 'kart ile', 'pos'],
  havale: ['havale', 'eft', 'banka', 'transfer', 'havale ile'],
  cari: ['cari', 'borc', 'vadeli', 'hesaba', 'hesap'],
};

const DISCOUNT_KEYWORDS = ['indirim', 'indir', 'düş', 'yüzde', '%'];

// ─── Main Parser ────────────────────────────────────────────────

export function parseVoiceCommand(
  transcript: string,
  context?: {
    lastSaleId?: string;
    lastSaleItems?: Array<{ productId: string; productName: string }>;
  },
): VoiceCommand {
  const normalized = normalizeTranscript(transcript);

  const action = detectAction(normalized);
  const payment = detectPayment(normalized);
  const options = detectOptions(normalized, context);
  const items = extractItems(normalized, transcript);

  // Calculate overall confidence
  const confidence = calculateConfidence(action, items, payment, normalized);

  return {
    action,
    items,
    payment,
    options,
    confidence,
    rawText: transcript,
  };
}

// ─── Action Detection ───────────────────────────────────────────

function detectAction(text: string): VoiceCommandAction {
  const scores: Record<VoiceCommandAction, number> = {
    satis: 0,
    iptal: 0,
    iade: 0,
    fiyat_duzelt: 0,
    unknown: 0,
  };

  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      // Use word-boundary matching to avoid partial matches (e.g., "sat" in "satisi")
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) {
        scores[action as VoiceCommandAction] += 1;
      }
    }
  }

  // If no explicit action keyword found, default to 'satis'
  // (most common case: "2 tane 80'lik soba nakit")
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    // Check if it looks like a sale (has quantity + product-like words)
    if (hasQuantityIndicator(text) && !hasCancelIndicator(text)) {
      return 'satis';
    }
    return 'unknown';
  }

  const bestAction = Object.entries(scores).find(([, s]) => s === maxScore);
  return (bestAction?.[0] as VoiceCommandAction) || 'unknown';
}

// ─── Payment Detection ──────────────────────────────────────────

function detectPayment(text: string): PaymentMethod | undefined {
  for (const [method, keywords] of Object.entries(PAYMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return method as PaymentMethod;
      }
    }
  }
  return undefined;
}

// ─── Item Extraction ────────────────────────────────────────────

function extractItems(normalized: string, rawText: string): VoiceItem[] {
  const items: VoiceItem[] = [];

  // Pattern: "[quantity] [unit] [product name] [payment]"
  // "2 tane 80'lik soba nakit" → { qty: 2, query: "80'lik soba" }
  // "bir tane klima kart ile" → { qty: 1, query: "klima" }

  // Remove payment keywords to isolate product part
  let productPart = normalized;
  for (const keywords of Object.values(PAYMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      productPart = productPart.replace(new RegExp(`\\s*${keyword}\\s*`, 'g'), ' ');
    }
  }

  // Remove discount keywords
  for (const keyword of DISCOUNT_KEYWORDS) {
    productPart = productPart.replace(new RegExp(`\\s*${keyword}\\s*`, 'g'), ' ');
  }

  // Remove action keywords
  for (const keywords of Object.values(ACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      productPart = productPart.replace(new RegExp(`\\s*${keyword}\\s*`, 'g'), ' ');
    }
  }

  productPart = productPart.replace(/\s+/g, ' ').trim();

  // Extract quantity
  const quantity = extractQuantityFromText(productPart);

  // Strip quantity words to get product query
  let productQuery = stripQuantityFromText(productPart);

  // Clean up common filler words
  productQuery = productQuery
    .replace(/\s*(al|ver|iste|istiyorum|lütfen|please)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (productQuery.length > 0) {
    items.push({
      productQuery,
      quantity,
    });
  }

  return items;
}

// ─── Options Detection ──────────────────────────────────────────

function detectOptions(
  text: string,
  context?: { lastSaleId?: string; lastSaleItems?: Array<{ productId: string; productName: string }> },
): VoiceSaleOptions {
  const options: VoiceSaleOptions = {};

  // Discount detection - "10 yüzde indirim" or "yüzde 10 indirim"
  // Note: text is already normalized (ü→u, etc.), so use "yuzde"
  const discountMatch = text.match(/(?:(\d+)\s*(?:yuzde|%)|(?:yuzde|%)\s*(\d+))\s*(?:indirim)?/);
  if (discountMatch) {
    options.discount = parseInt(discountMatch[1] || discountMatch[2], 10);
  }

  const tlDiscountMatch = text.match(/(\d+)\s*(?:tl|₺|lira)\s*(?:indirim)?/);
  if (tlDiscountMatch) {
    options.discountAmount = parseInt(tlDiscountMatch[1], 10);
  }

  return options;
}

// ─── Confidence Calculation ──────────────────────────────────────

function calculateConfidence(
  action: VoiceCommandAction,
  items: VoiceItem[],
  payment: PaymentMethod | undefined,
  text: string,
): number {
  let score = 0.5; // Base confidence

  // Action detected
  if (action !== 'unknown') score += 0.2;

  // Has items
  if (items.length > 0) score += 0.15;

  // Has payment method
  if (payment) score += 0.1;

  // Has quantity
  if (items.some((i) => i.quantity > 0)) score += 0.05;

  // Penalize very short or very long input
  const wordCount = text.split(' ').length;
  if (wordCount < 2) score -= 0.2;
  if (wordCount > 15) score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

// ─── Helpers ────────────────────────────────────────────────────

function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[.,!?;:"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasQuantityIndicator(text: string): boolean {
  const quantityWords = ['tane', 'adet', 'parca', 'kilo', 'kg', 'litre', 'lt', 'paket', 'kutu'];
  const numberPattern = /\d+|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on/;
  return quantityWords.some((w) => text.includes(w)) || numberPattern.test(text);
}

function hasCancelIndicator(text: string): boolean {
  return ['iptal', 'sil', 'geri al', 'vazgec'].some((w) => text.includes(w));
}

function extractQuantityFromText(text: string): number {
  const numberWords: Record<string, number> = {
    'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4, 'beş': 5,
    'altı': 6, 'yedi': 7, 'sekiz': 8, 'dokuz': 9, 'on': 10,
    'yirmi': 20, 'otuz': 30, 'kırk': 40, 'elli': 50,
  };

  // First: check for Turkish number word at the start of text (word boundary)
  const textStart = text.split(/\s+/)[0];
  if (textStart in numberWords) {
    return numberWords[textStart];
  }

  // Second: look for leading numeric digits (before any product identifier)
  // Match number at start or number followed by unit word
  const leadingNum = text.match(/^(\d+)\s*(?:tane|adet|parça|kilo|kg|litre|lt|paket|kutu|şişe|bidon|metre|mt)\b/);
  if (leadingNum) return parseInt(leadingNum[1], 10);

  // Third: generic number anywhere (may be part of product name like "80'lik")
  // Only use this if preceded by a quantity word
  const unitMatch = text.match(/(?:tane|adet|parça|kilo|kg)\s+(\d+)/);
  if (unitMatch) return parseInt(unitMatch[1], 10);

  // Fourth: look for Turkish word anywhere in text
  for (const [word, num] of Object.entries(numberWords)) {
    if (text.includes(word)) return num;
  }

  return 1;
}

function stripQuantityFromText(text: string): string {
  let result = text;

  // Remove leading numbers (only when followed by unit or at start)
  result = result.replace(/^\d+\s+(?:tane|adet|parça|kilo|kg|litre|lt|paket|kutu|şişe|bidon|metre|mt)\s+/g, '');
  result = result.replace(/^\d+\s*/, '');

  // Remove Turkish number words
  const numberWords = ['bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'yirmi', 'otuz', 'kırk', 'elli'];
  for (const word of numberWords) {
    result = result.replace(new RegExp(`^${word}\\s+`), '');
  }

  // Remove unit words
  result = result.replace(/\s*(tane|adet|parça|kilo|kg|litre|lt|metre|mt|paket|kutu|şişe|bidon)\s*/g, ' ');

  return result.trim();
}
