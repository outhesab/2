import { whatsAppBridge } from '@/lib/nexus/WhatsAppBridge';
import { logger } from '@/lib/logger';
import type { IntentHandler, HandlerContext, ExecutiveResult } from './IntentHandler';
import type { DB } from '@/types';

/**
 * WhatsAppHandler - Handles WhatsApp simulation commands
 * Examples: "whatsapp'tan 0555... dedi: merhaba", "whatsapp mesajı: ..."
 */
export class WhatsAppHandler implements IntentHandler {
  readonly name = 'WhatsAppHandler';
  readonly priority = 75;

  canHandle(input: string, context: HandlerContext): boolean {
    if (context.composerMode) return false;

    const query = input.toLowerCase().trim();
    return query.includes('whatsapp') && (query.includes('dedi') || query.includes('mesaj') || query.includes('sordu'));
  }

  async handle(input: string, db: DB, _context: HandlerContext): Promise<ExecutiveResult> {
    const msgPhone = this.extractWhatsAppMessage(input);
    if (!msgPhone) {
      return {
        type: 'smart',
        response: 'WhatsApp mesajı anlaşılamadı.',
        executedActions: [],
      };
    }

    const result = whatsAppBridge.incoming(msgPhone.message, msgPhone.phone, db);

    logger.info('whatsapp', 'WhatsApp simulation processed', { phone: msgPhone.phone, intent: result.intent });

    return {
      type: 'smart',
      response: `WhatsApp simülasyonu (${msgPhone.phone}): "${msgPhone.message}" → Cevap: ${result.reply}`,
      executedActions: [],
      finalData: { kind: 'whatsapp_sim', intent: result.intent, customer: result.customer, reply: result.reply },
    };
  }

  private extractWhatsAppMessage(input: string): { message: string; phone: string } | null {
    const q = input;

    // "whatsapp'tan 05551234567 dedi: merhaba" or "whatsapptan 0555... mesajı: soba"
    const m1 = q.match(/whatsapp'?(?:tan|ten)?\s+(\+?\d{10,15})\s*(?:dedi|mesajı|sordu)[:\\s]+(.+)/i);
    if (m1) return { phone: m1[1], message: m1[2].trim() };

    // "whatsapp mesajı: soba fiyatı" — no phone, default
    const m2 = q.match(/whatsapp\s*mesaj[ıi]?:\s*(.+)/i);
    if (m2) return { phone: '+905551234567', message: m2[1].trim() };

    return null;
  }
}

// Auto-register
import { intentHandlerRegistry } from './IntentHandler';
intentHandlerRegistry.register(new WhatsAppHandler());
