// voice-sales/executor/voiceSaleExecutor.ts

import { completeSale } from '@/domain/services/saleCompletion';
import { applyIntentResult } from '@/hooks/db/dbHelpers';
import { getDB } from '@/hooks/db/index';
import { saveToStorage, saveToIndexedSnapshot } from '@/lib/db/storage';
import type { SaleIntent } from '@/domain/types';
import type { VoiceCommand, VoiceSaleResult } from '../types';
import { buildSaleIntent } from '../parser/voiceIntentBuilder';

export interface ExecutorOptions {
  /** Require confirmation before executing (for low-confidence commands) */
  confidenceThreshold: number;
  /** Auto-confirm if confidence is above this */
  autoConfirmThreshold: number;
}

const DEFAULT_OPTIONS: ExecutorOptions = {
  confidenceThreshold: 0.5,
  autoConfirmThreshold: 0.85,
};

/**
 * Execute a voice command as a sale.
 *
 * Flow:
 * 1. Parse VoiceCommand → SaleIntent (via VoiceIntentBuilder)
 * 2. Call completeSale(intent, db) — pure function, TOCTOU-safe
 * 3. Apply result via applyIntentResult
 * 4. Persist via saveToStorage + saveToIndexedSnapshot
 * 5. Return VoiceSaleResult with spoken feedback
 *
 * IMPORTANT: This function does NOT use Agent or useDB hook.
 * It directly calls the domain layer for TOCTOU safety.
 */
export async function executeVoiceSale(
  command: VoiceCommand,
  options: Partial<ExecutorOptions> = {},
): Promise<VoiceSaleResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. Check confidence threshold
  if (command.confidence < opts.confidenceThreshold) {
    return {
      success: false,
      error: 'Komut anlaşılamadı. Lütfen tekrar edin.',
      parsedCommand: command,
      needsConfirmation: false,
    };
  }

  // 2. Get current DB state (fresh snapshot — TOCTOU-safe)
  const db = getDB();
  if (!db) {
    return {
      success: false,
      error: 'Veritabanı erişilebilir değil.',
      parsedCommand: command,
      needsConfirmation: false,
    };
  }

  // 3. Build SaleIntent from VoiceCommand
  const buildResult = buildSaleIntent(command, db);

  if (!buildResult.success || !buildResult.intent) {
    return {
      success: false,
      error: buildResult.errors.join(' ') || 'Ürün eşleştirilemedi.',
      parsedCommand: command,
      needsConfirmation: false,
    };
  }

  // 4. Check if confirmation is needed
  const needsConfirmation =
    command.confidence < opts.autoConfirmThreshold ||
    buildResult.warnings.length > 0 ||
    buildResult.unmatchedItems.length > 0;

  if (needsConfirmation) {
    const confirmationMessage = buildConfirmationMessage(buildResult.intent, buildResult.warnings);
    return {
      success: false,
      error: '',
      parsedCommand: command,
      needsConfirmation: true,
      confirmationMessage,
    };
  }

  // 5. Execute sale via domain layer (PURE FUNCTION)
  return performSale(buildResult.intent, command);
}

/**
 * Execute sale after confirmation.
 * Called when user confirms a low-confidence command.
 * Accepts a single VoiceCommand and builds the SaleIntent internally.
 */
export async function executeConfirmedSale(
  command: VoiceCommand,
): Promise<VoiceSaleResult> {
  const db = getDB();
  if (!db) {
    return {
      success: false,
      error: 'Veritabanı erişilebilir değil.',
      parsedCommand: command,
      needsConfirmation: false,
    };
  }

  const buildResult = buildSaleIntent(command, db);
  if (!buildResult.success || !buildResult.intent) {
    return {
      success: false,
      error: buildResult.errors.join(' ') || 'Ürün eşleştirilemedi.',
      parsedCommand: command,
      needsConfirmation: false,
    };
  }

  return performSale(buildResult.intent, command);
}

// ─── Internal ───────────────────────────────────────────────────

async function performSale(
  intent: SaleIntent,
  originalCommand: VoiceCommand,
): Promise<VoiceSaleResult> {
  try {
    // 1. Get FRESH db snapshot at execution time (TOCTOU-safe)
    const db = getDB();
    if (!db) {
      return {
        success: false,
        error: 'Veritabanı erişilebilir değil.',
        parsedCommand: originalCommand,
        needsConfirmation: false,
      };
    }

    // 2. Call domain service (PURE FUNCTION)
    const result = completeSale(intent, db);

    if (!result.ok || !result.data) {
      return {
        success: false,
        error: result.error || 'Satış işlemi başarısız.',
        parsedCommand: originalCommand,
        needsConfirmation: false,
      };
    }

    // 3. Apply DB updates
    const nextDB = applyIntentResult(db, result.data);

    // 4. Persist
    saveToStorage(nextDB);
    await saveToIndexedSnapshot(nextDB);

    // 5. Build success result
    const sale = result.data.dbUpdates.sale;
    return {
      success: true,
      sale: sale
        ? {
            id: sale.id,
            total: sale.total,
            itemCount: intent.items.length,
          }
        : undefined,
      parsedCommand: originalCommand,
      needsConfirmation: false,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Bilinmeyen hata oluştu.',
      parsedCommand: originalCommand,
      needsConfirmation: false,
    };
  }
}

// ─── Confirmation Message Builder ───────────────────────────────

function buildConfirmationMessage(
  intent: SaleIntent,
  warnings: string[],
): string {
  const itemDescriptions = intent.items.map((item) => {
    const total = item.quantity * item.unitPrice;
    return `${item.quantity} adet ${item.productName} (${formatMoney(total)})`;
  });

  const parts = [
    'Satış onayı:',
    ...itemDescriptions,
    `Ödeme: ${translatePayment(intent.payment)}`,
  ];

  if (intent.discount) {
    parts.push(`İskonto: %${intent.discount}`);
  }
  if (intent.discountAmount) {
    parts.push(`İskonto: ${formatMoney(intent.discountAmount)}`);
  }

  if (warnings.length > 0) {
    parts.push('');
    parts.push('Uyarılar:');
    parts.push(...warnings.map((w) => `• ${w}`));
  }

  const total = intent.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  parts.push('');
  parts.push(`Toplam: ${formatMoney(total)}`);

  return parts.join('\n');
}

// ─── Helpers ────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function translatePayment(payment?: string): string {
  const map: Record<string, string> = {
    nakit: 'Nakit',
    kart: 'Kredi Kartı',
    havale: 'Havale/EFT',
    cari: 'Cari Hesap',
  };
  return map[payment || 'nakit'] || 'Nakit';
}
