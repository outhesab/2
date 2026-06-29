import { getAgent } from '@/agents';
import { logger } from '@/lib/logger';
import type { IntentHandler, HandlerContext, ExecutiveResult } from './IntentHandler';
import type { DB } from '@/types';
import type { AgentRequest, AgentResponse } from '@/agents/types';
import { z } from 'zod';

/**
 * SmartHandler - Handles deep reasoning (Smart Path) and complex plan execution
 * Uses DeepSeek agent for reasoning and plan generation
 */
export class SmartHandler implements IntentHandler {
  readonly name = 'SmartHandler';
  readonly priority = 50;

  // Zod schema for validating AI-generated action chains
  private readonly AgentRequestSchema = z.object({
    action: z.string().min(1),
    payload: z.record(z.string(), z.unknown()).optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
  });
  private readonly AgentRequestChainSchema = z.array(this.AgentRequestSchema);

  // Keywords that indicate a multi-step plan
  private readonly planKeywords = ['öncelikle', 'ardından', 'sonra', 'adım', 'plan', 'yapacağım', 'sırasıyla'];

  canHandle(input: string, context: HandlerContext): boolean {
    // Skip if composer is active (ComposerHandler handles that)
    if (context.composerMode) return false;
    return true; // Fallback for all remaining inputs
  }

  async handle(input: string, db: DB, _context: HandlerContext): Promise<ExecutiveResult> {
    // First, get deep reasoning response
    const deepSeek = getAgent('deep_seek');
    const reasoningResult = await deepSeek.islemYap({
      action: 'analiz',
      payload: { query: input, dbContext: 'summarized' },
    });

    if (!reasoningResult.ok) {
      return {
        type: 'smart',
        response: 'Üzgünüm, bu isteği işlerken bir hata oluştu.',
        executedActions: [],
      };
    }

    const responseText = String(reasoningResult.data ?? '');

    // Check if the response contains a plan
    if (this.containsPlan(responseText)) {
      return this.handleComplexPlan(input, responseText, db);
    }

    // Regular smart response
    return {
      type: 'smart',
      response: responseText,
      executedActions: [],
    };
  }

  private containsPlan(text: string): boolean {
    const lower = text.toLowerCase();
    return this.planKeywords.some((kw) => lower.includes(kw));
  }

  private async handleComplexPlan(input: string, planText: string, _db: DB): Promise<ExecutiveResult> {
    const plannerAgent = getAgent('deep_seek');
    const planningPrompt = `
      Kullanıcı isteği: "${input}"
      Önerdiğin plan: "${planText}"

      Lütfen bu planı, SatisAgent, StokAgent, CariAgent ve KasaAgent'ın anlayacağı bir JSON dizisine çevir.
      Format: [ { "agent": "agent_id", "action": "action_name", "payload": { ... } }, ... ]

      Agent ID'leri: "satis", "stok", "cari", "kasa", "fatura", "rapor".
      Lütfen sadece saf JSON dön.
    `;

    const planResult = await plannerAgent.islemYap({
      action: 'generate_action_chain',
      payload: { prompt: planningPrompt },
    });

    if (!planResult.ok || !planResult.data) {
      return { type: 'smart', response: planText, executedActions: [] };
    }

    let actions: AgentRequest[] = [];
    try {
      const raw = typeof planResult.data === 'string' ? planResult.data : JSON.stringify(planResult.data);
      const jsonMatch = raw.match(/\{.*\}/s);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

      // Validate with Zod
      const validationResult = this.AgentRequestChainSchema.safeParse(parsed);
      if (!validationResult.success) {
        logger.error('smart', 'Plan validation failed', { errors: validationResult.error.format() });
        return {
          type: 'smart',
          response: 'AI planı şema doğrulaması geçemedi, lütfen tekrar deneyin.',
          executedActions: [],
        };
      }
      actions = validationResult.data;
    } catch (e) {
      logger.error('smart', 'Plan parsing failed', { error: e });
      return {
        type: 'smart',
        response: 'Plan oluşturuldu ama teknik bir hata nedeniyle uygulanamadı.',
        executedActions: [],
      };
    }

    // Execute action chain
    const executed: Array<{ agent: string; action: string; status: 'success' | 'failed' }> = [];
    let chainContext: Record<string, unknown> = {};

    for (const actionReq of actions) {
      const augmentedRequest: AgentRequest = {
        ...actionReq,
        payload: { ...(actionReq.payload ?? {}), ...chainContext } as Record<string, unknown>,
      };

      const res = await this.executeSingleAction(augmentedRequest);

      executed.push({
        agent: this.mapActionToAgent(actionReq.action),
        action: actionReq.action,
        status: res.success ? 'success' : 'failed',
      });

      if (!res.success) break;
      if (res.data) chainContext = { ...chainContext, ...res.data };
    }

    return {
      type: 'action_chain',
      response: executed.every((a) => a.status === 'success')
        ? 'Tüm adımlar başarıyla uygulandı.'
        : 'Bazı adımlar sırasında hata oluştu.',
      executedActions: executed,
      finalData: chainContext,
    };
  }

  private async executeSingleAction(
    request: AgentRequest,
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const agentId = this.mapActionToAgent(request.action);
      const agent = (getAgent as (id: string) => { islemYap: (req: AgentRequest) => Promise<AgentResponse<unknown>> })(
        agentId,
      );

      const result = await agent.islemYap(request);

      if (result.ok) {
        return { success: true, message: `Agent ${agentId} işlemi tamamladı.`, data: result.data };
      } else {
        return { success: false, message: result.error || 'Agent işlemi reddetti.' };
      }
    } catch (e) {
      logger.error('smart', 'Action execution failed', { error: e });
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
intentHandlerRegistry.register(new SmartHandler());
