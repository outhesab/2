import { resolveUndo } from '@/lib/nexus/VoiceUndoEngine';
import { voiceConfirmationGateway } from '@/lib/nexus/VoiceConfirmationGateway';
import { logger } from '@/lib/logger';
import type { IntentHandler, HandlerContext, ExecutiveResult } from './IntentHandler';
import type { DB } from '@/types';
import type { AgentRequest } from '@/agents/types';

/**
 * UndoHandler - Handles "undo last action" commands
 * Examples: "son satışı geri al", "son gideri iptal et"
 */
export class UndoHandler implements IntentHandler {
  readonly name = 'UndoHandler';
  readonly priority = 85;

  private undoVerbs = ['geri al', 'geri alalım', 'geri alalim', 'iptal et', 'iade et'];

  canHandle(input: string, context: HandlerContext): boolean {
    // Don't handle if composer mode is active
    if (context.composerMode) return false;

    const query = input.toLowerCase().trim();
    if (!query.includes('son')) return false;

    return this.undoVerbs.some(v => query.includes(v));
  }

  async handle(input: string, db: DB, _context: HandlerContext): Promise<ExecutiveResult> {
    const undoResult = resolveUndo(input, db);

    if (!undoResult.ok || !undoResult.intent) {
      return {
        type: 'smart',
        response: undoResult.error ?? 'Geri alınamadı.',
        executedActions: [],
      };
    }

    // Convert Undo Intent to AgentRequest
    const action: AgentRequest = {
      action: undoResult.intent.type,
      payload: undoResult.intent.payload as unknown as Record<string, unknown>,
    };

    // Send to confirmation gateway (undo is a write action)
    const confirmationPromise = voiceConfirmationGateway.requestConfirmation(action);
    _context.registerConfirmationPromise?.(confirmationPromise);
    const readBack = voiceConfirmationGateway.getPendingReadBack();

    const targetInfo = undoResult.targetDescription ? ` (${undoResult.targetDescription})` : '';
    logger.info('undo', 'Undo awaiting confirmation', { actionType: undoResult.logEntry?.actionType });

    return {
      type: 'pending_confirmation',
      response: `${readBack ?? 'Geri alma onayınızı bekliyorum.'}${targetInfo}`,
      executedActions: [],
      pendingReadBack: readBack ?? undefined,
      pendingAction: action,
    };
  }
}

// Auto-register
import { intentHandlerRegistry } from './IntentHandler';
intentHandlerRegistry.register(new UndoHandler());