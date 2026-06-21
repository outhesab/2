import { nexusRouter } from '@/lib/nexus/NexusRouter';
import { voiceConfirmationGateway, requiresConfirmation } from '@/lib/nexus/VoiceConfirmationGateway';
import { logger } from '@/lib/logger';
import type { IntentHandler, HandlerContext, ExecutiveResult } from './IntentHandler';
import type { DB } from '@/types';
import type { AgentRequest, AgentResponse } from '@/agents/types';
import { getAgent } from '@/agents';

/**
 * ActionHandler - Handles single action routing via NexusRouter
 * Fast path, Action path, Memory path
 */
export class ActionHandler implements IntentHandler {
  readonly name = 'ActionHandler';
  readonly priority = 70;

  canHandle(_input: string, _context: HandlerContext): boolean {
    // This handler is the fallback for router-based paths
    // It will be tried after specific handlers
    return true;
  }

  async handle(input: string, db: DB, context: HandlerContext): Promise<ExecutiveResult> {
    const routeResult = await nexusRouter.route(input, db, {
      isFileContext: context.isFileContext,
      currentFiles: context.currentFiles,
      adminMode: context.adminMode,
    });

    // Fast Path
    if (routeResult.type === 'fast') {
      return {
        type: 'fast',
        response: routeResult.response as string,
        executedActions: [],
      };
    }

    // Memory Path (Cross-Entity Discount Transfer)
    if (routeResult.type === 'memory' && routeResult.memoryProposal) {
      const proposal = routeResult.memoryProposal;
      return {
        type: 'smart',
        response: routeResult.response as string,
        executedActions: [],
        finalData: proposal.applicable ? {
          kind: 'discount_transfer',
          proposal,
          suggestedAction: proposal.applicable ? {
            action: 'satis',
            payload: {
              cariId: proposal.toCari?.id,
              cariName: proposal.toCari?.name,
              discount: proposal.recommendedDiscount?.percent,
              discountAmount: proposal.recommendedDiscount?.amount,
            },
          } : undefined,
        } : undefined,
      };
    }

    // Action Path
    if (routeResult.type === 'action' && routeResult.action) {
      return this.handleAction(routeResult.action, context);
    }

    // Smart Path - delegate to SmartHandler
    // This will be handled by SmartHandler which has lower priority
    // but we need to signal that this wasn't an action
    return {
      type: 'smart',
      response: routeResult.response as string,
      executedActions: [],
    };
  }

  private async handleAction(action: AgentRequest, context: HandlerContext): Promise<ExecutiveResult> {
    // Security Gate: write actions require confirmation
    if (requiresConfirmation(action.action)) {
      const confirmationPromise = voiceConfirmationGateway.requestConfirmation(action);
      context.registerConfirmationPromise?.(confirmationPromise);
      const readBack = voiceConfirmationGateway.getPendingReadBack();


      logger.info('action', 'Action awaiting confirmation', { action: action.action });

      return {
        type: 'pending_confirmation',
        response: readBack ?? 'İşlem onayınızı bekliyorum.',
        executedActions: [],
        pendingReadBack: readBack ?? undefined,
        pendingAction: action,
      };
    }

    // Read-only actions execute directly
    const result = await this.executeSingleAction(action);

    return {
      type: 'action_chain',
      response: result.success ? `İşlem başarıyla tamamlandı: ${result.message}` : `Hata oluştu: ${result.message}`,
      executedActions: [{
        agent: this.mapActionToAgent(action.action),
        action: action.action,
        status: result.success ? 'success' : 'failed',
      }],
      finalData: result.data,
    };
  }

  private async executeSingleAction(request: AgentRequest): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const agentId = this.mapActionToAgent(request.action);
      // Use type assertion to bypass overload resolution
      const agent = (getAgent as (id: string) => { islemYap: (req: AgentRequest) => Promise<AgentResponse<unknown>> })(agentId);

      const result = await agent.islemYap(request);

      if (result.ok) {
        return { success: true, message: `Agent ${agentId} işlemi tamamladı.`, data: result.data };
      } else {
        return { success: false, message: result.error || 'Agent işlemi reddetti.' };
      }
    } catch (e) {
      logger.error('action', 'Action execution failed', { error: e });
      return { success: false, message: 'Sistem hatası oluştu.' };
    }
  }

  private mapActionToAgent(action: string): string {
    if (action.includes('sale') || action.includes('satis')) return 'satis';
    if (action.includes('stock') || action.includes('stok')) return 'stok';
    if (action.includes('cari') || action.includes('customer')) return 'cari';
    if (action.includes('kasa') || action.includes('cash')) return 'kasa';
    if (action.includes('invoice') || action.includes('fatura')) return 'fatura';
    if (action.includes('report') || action.includes('rapor')) return 'rapor';
    return 'deep_seek';
  }
}

// Auto-register
import { intentHandlerRegistry } from './IntentHandler';
intentHandlerRegistry.register(new ActionHandler());