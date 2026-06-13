// voice-sales/parser/voiceIntentBuilder.ts

import type { DB, Product } from '@/types';
import type { SaleIntent } from '@/domain/types';
import type { VoiceCommand, VoiceItem, VoiceSaleOptions } from '../types';
import { findBestProductMatch } from './productMatcher';

export interface IntentBuildResult {
  success: boolean;
  intent?: SaleIntent;
  errors: string[];
  warnings: string[];
  unmatchedItems: VoiceItem[];
}

/**
 * VoiceCommand → SaleIntent (completeSale'in anladığı format)
 *
 * Bu fonksiyon:
 * 1. VoiceCommand.items[] içindeki productQuery'leri fuzzy match ile çözümler
 * 2. DB'den fiyat ve maliyet bilgisini alır
 * 3. SaleIntent oluşturur
 * 4. Eşleşmeyen ürünü unmatchedItems olarak döndürür
 */
export function buildSaleIntent(
  command: VoiceCommand,
  db: DB,
): IntentBuildResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const unmatchedItems: VoiceItem[] = [];
  const matchedItems: SaleIntent['items'] = [];

  // 1. Validate action
  if (command.action !== 'satis') {
    return {
      success: false,
      errors: [`"${command.action}" işlemi için IntentBuilder desteklenmiyor. Sadece "satis" desteklenir.`],
      warnings: [],
      unmatchedItems: command.items,
    };
  }

  // 2. Validate items exist
  if (command.items.length === 0) {
    return {
      success: false,
      errors: ['Ürün belirtilmedi. Örneğin: "2 tane 80\'lik soba"'],
      warnings: [],
      unmatchedItems: [],
    };
  }

  // 3. Resolve each item via fuzzy matching
  for (const item of command.items) {
    const match = findBestProductMatch(
      item.productQuery,
      db.products,
      0.4, // Lower threshold for voice (more forgiving)
    );

    if (match) {
      matchedItems.push({
        productId: match.id,
        productName: match.name,
        quantity: item.quantity,
        unitPrice: match.price,
        cost: match.cost,
      });

      // Warn if match score is low
      if (match.score < 0.6) {
        warnings.push(
          `"${item.productQuery}" → "${match.name}" eşleşmesi zayıf (${Math.round(match.score * 100)}%). Onay istenebilir.`,
        );
      }

      // Warn if stock is insufficient
      if (match.stock < item.quantity) {
        warnings.push(
          `"${match.name}" stokta ${match.stank} adet var, ${item.quantity} adet isteniyor.`,
        );
      }
    } else {
      unmatchedItems.push(item);
      errors.push(`"${item.productQuery}" ürünü bulunamadı.`);
    }
  }

  // 4. If any items unmatched, fail
  if (unmatchedItems.length > 0) {
    return {
      success: false,
      errors,
      warnings,
      unmatchedItems,
    };
  }

  // 5. Build SaleIntent
  const intent: SaleIntent = {
    items: matchedItems,
    payment: command.payment || 'nakit', // Default to nakit
  };

  // 6. Apply options
  if (command.options) {
    if (command.options.discount !== undefined) {
      intent.discount = command.options.discount;
    }
    if (command.options.discountAmount !== undefined) {
      intent.discountAmount = command.options.discountAmount;
    }
    if (command.options.cariId) {
      intent.cariId = command.options.cariId;
    }
    if (command.options.customerName) {
      intent.customerName = command.options.customerName;
    }
    if (command.options.saleDate) {
      intent.saleDate = command.options.saleDate;
    }
  }

  // 7. For cari payment, require cariId
  if (intent.payment === 'cari' && !intent.cariId) {
    warnings.push('Cari ödeme seçildi ancak cari hesap belirtilmedi.');
  }

  return {
    success: true,
    intent,
    errors,
    warnings,
    unmatchedItems: [],
  };
}

/**
 * Quick build — throws on error instead of returning result object.
 * Use when you want simple success/failure.
 */
export function buildSaleIntentOrThrow(
  command: VoiceCommand,
  db: DB,
): SaleIntent {
  const result = buildSaleIntent(command, db);
  if (!result.success || !result.intent) {
    throw new Error(result.errors.join('; '));
  }
  return result.intent;
}

/**
 * Build with partial success — returns matched items even if some fail.
 * Useful for "best effort" voice commands.
 */
export function buildSaleIntentPartial(
  command: VoiceCommand,
  db: DB,
): IntentBuildResult {
  const result = buildSaleIntent(command, db);

  // If we have at least one matched item, return partial success
  if (result.intent && result.intent.items.length > 0) {
    return {
      ...result,
      success: true,
      warnings: [
        ...result.warnings,
        `${result.unmatchedItems.length} ürün eşleşmedi, ${result.intent.items.length} ürün işleniyor.`,
      ],
    };
  }

  return result;
}
