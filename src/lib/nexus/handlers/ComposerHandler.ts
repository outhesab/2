import { voiceSaleComposer } from '@/lib/nexus/VoiceSaleComposer';
import { voiceConfirmationGateway } from '@/lib/nexus/VoiceConfirmationGateway';
import { logger } from '@/lib/logger';
import type { IntentHandler, HandlerContext, ExecutiveResult } from './IntentHandler';
import type { DB } from '@/types';
import type { AgentRequest } from '@/agents/types';

/**
 * ComposerHandler - Handles step-by-step sale creation (Composer Mode)
 * Active when user says "yeni satış", "satış başlat", etc.
 */
export class ComposerHandler implements IntentHandler {
  readonly name = 'ComposerHandler';
  readonly priority = 90; // High priority, below navigation

  private startCommands = [
    'yeni satış',
    'yeni satis',
    'satış başlat',
    'satis baslat',
    'satış yap',
    'satis yap',
    'satış başlatın',
    'sepet aç',
    'sepet ac',
  ];

  canHandle(input: string, context: HandlerContext): boolean {
    const query = input.toLowerCase().trim();

    // If composer mode is active, handle ALL input
    if (context.composerMode) return true;

    // Check for composer start commands
    return this.startCommands.some((cmd) => query === cmd);
  }

  async handle(input: string, db: DB, context: HandlerContext): Promise<ExecutiveResult> {
    // If composer mode is active, process as composer input
    if (context.composerMode) {
      return this.handleComposerInput(input, db, context);
    }

    // Start composer mode
    return this.startComposer(db, context);
  }

  private async handleComposerInput(input: string, db: DB, context: HandlerContext): Promise<ExecutiveResult> {
    const result = voiceSaleComposer.process(input, db);

    // Cancel - composer closes
    if (result.cancelled) {
      context.setComposerMode?.(false);
      logger.info('composer', 'Composer mode cancelled by user');
      return {
        type: 'composer_active',
        response: result.ack,
        executedActions: [],
        composerAck: result.ack,
        composerCancelled: true,
      };
    }

    // Finalize - SaleIntent created, send to confirmation gateway
    if (result.finalizedIntent) {
      context.setComposerMode?.(false);
      const action: AgentRequest = {
        action: 'satis',
        payload: result.finalizedIntent as unknown as Record<string, unknown>,
      };

      const confirmationPromise = voiceConfirmationGateway.requestConfirmation(action);
      context.registerConfirmationPromise?.(confirmationPromise);
      const readBack = voiceConfirmationGateway.getPendingReadBack();

      logger.info('composer', 'Composer finalized, awaiting confirmation');
      return {
        type: 'pending_confirmation',
        response: readBack ?? 'Satış onayınızı bekliyorum.',
        executedActions: [],
        pendingReadBack: readBack ?? undefined,
        pendingAction: action,
        composerAck: result.ack,
        composerFinalize: action,
      };
    }

    // Status or normal command - composer mode stays active
    return {
      type: 'composer_active',
      response: result.ack,
      executedActions: [],
      composerAck: result.ack,
    };
  }

  private async startComposer(db: DB, context: HandlerContext): Promise<ExecutiveResult> {
    voiceSaleComposer.reset();
    context.setComposerMode?.(true);
    logger.info('composer', 'Composer mode activated');

    return {
      type: 'composer_active',
      response: 'Yeni satış başlatıldı. Ürün ekleyin, müşteri seçin, indirim verin ve "sat" deyin.',
      executedActions: [],
      composerAck: 'Yeni satış başlatıldı. "X tane Y ekle" diyerek başlayın.',
    };
  }
}

// Auto-register
import { intentHandlerRegistry } from './IntentHandler';
intentHandlerRegistry.register(new ComposerHandler());
