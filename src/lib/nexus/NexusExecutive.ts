import { getAgent } from '@/agents';
import { nexusRouter, RouteResult } from './NexusRouter';
import { logger } from '@/lib/logger';
import type { DB, AgentRequest, AgentResponse } from '@/types';

export type ExecutiveResult = {
  type: 'fast' | 'smart' | 'action_chain';
  response: string;
  executedActions: Array<{ agent: string; action: string; status: 'success' | 'failed' }>;
  finalData?: unknown;
  navigation?: { path: string; params?: Record<string, string> };
};

export class NexusExecutive {
  private static instance: NexusExecutive;

  private constructor() {}

  public static getInstance(): NexusExecutive {
    if (!NexusExecutive.instance) {
      NexusExecutive.instance = new NexusExecutive();
    }
    return NexusExecutive.instance;
  }

  /**
   * God-Mode Execution: Plans and executes complex requests.
   */
  public async execute(input: string, db: DB, context: {
    isFileContext?: boolean,
    currentFiles?: unknown[],
    adminMode?: boolean,
  }): Promise<ExecutiveResult> {
    logger.info('NexusExecutive', 'Executing God-Mode request', { input });

    // 0. NAVIGATION CHECK (Highest Priority)
    const nav = this.checkNavigation(input);
    if (nav) {
      return {
        type: 'smart',
        response: `Hemen ${nav.path} sayfasına yönlendiriyorum...`,
        executedActions: [],
        navigation: nav,
      };
    }

    // 1. Use NexusRouter for initial classification
    const routeResult = await nexusRouter.route(input, db, context);

    // 2. Handle Fast Path (Direct answer)
    if (routeResult.type === 'fast') {
      return {
        type: 'fast',
        response: routeResult.response as string,
        executedActions: [],
      };
    }

    // 3. Handle Action Path (Single or Chain)
    if (routeResult.type === 'action' && routeResult.action) {
      const action = routeResult.action;
      const result = await this.executeSingleAction(action);
      
      return {
        type: 'action_chain',
        response: result.success ? `İşlem başarıyla tamamlandı: ${result.message}` : `Hata oluştu: ${result.message}`,
        executedActions: [{ 
          agent: this.mapActionToAgent(action.action), 
          action: action.action, 
          status: result.success ? 'success' : 'failed' 
        }],
        finalData: result.data
      };
    }

    // 4. Handle Smart Path (Deep Reasoning & Potential Chaining)
    if (routeResult.type === 'smart') {
      const responseText = routeResult.response as string;
      
      // Check if the AI suggested a multi-step plan
      if (this.containsPlan(responseText)) {
        return await this.handleComplexPlan(input, responseText, db);
      }

      return {
        type: 'smart',
        response: responseText,
        executedActions: [],
      };
    }

    return {
      type: 'smart',
      response: 'Üzgünüm, bu isteği nasıl gerçekleştireceğimi çözemedim.',
      executedActions: [],
    };
  }

  private checkNavigation(input: string): { path: string; params?: Record<string, string> } | null {
    const query = input.toLowerCase().trim();
    
    const navMap: Record<string, string> = {
      'satışlar': '/sales',
      'satış sayfası': '/sales',
      'kasa': '/kasa',
      'cari': '/cari',
      'müşteri listesi': '/cari',
      'stok': '/stock',
      'ürünler': '/stock',
      'raporlar': '/reports',
      'dashboard': '/dashboard',
      'ana sayfa': '/dashboard',
      'ayarlar': '/settings',
    };

    for (const [key, path] of Object.entries(navMap)) {
      if (query.includes(key)) return { path };
    }

    // Handle specific entity navigation (e.g., "Ahmet Bey'in sayfasına git")
    if (query.includes('sayfasına git') || query.includes('detayını aç')) {
      // In a real scenario, we would search the DB for the name
      // For now, we'll return a generic route or try to extract the name
      return { path: '/cari/detail' }; 
    }

    return null;
  }

  private async executeSingleAction(request: AgentRequest): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const agentId = this.mapActionToAgent(request.action);
      const agent = getAgent(agentId);
      
      const result: AgentResponse<unknown> = await agent.islemYap(request);
      
      if (result.ok) {
        return { success: true, message: `Agent ${agentId} işlemi tamamladı.`, data: result.data };
      } else {
        return { success: false, message: result.error || 'Agent işlemi reddetti.' };
      }
    } catch (e) {
      logger.error('NexusExecutive', 'Action execution failed', { error: e });
      return { success: false, message: 'Sistem hatası oluştu.' };
    }
  }

  private async handleComplexPlan(input: string, planText: string, db: DB): Promise<ExecutiveResult> {
    // Ask DeepSeek to convert the textual plan into a JSON array of AgentRequests
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

    if (planResult.ok && planResult.data) {
      let actions: AgentRequest[] = [];
      try {
        const raw = typeof planResult.data === 'string' ? planResult.data : JSON.stringify(planResult.data);
        const jsonMatch = raw.match(/\\{.*\\}/s);
        actions = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      } catch (e) {
        logger.error('NexusExecutive', 'Plan parsing failed', { error: e });
        return { type: 'smart', response: 'Plan oluşturuldu ama teknik bir hata nedeniyle uygulanamadı.', executedActions: [] };
      }

      const executed: Array<{ agent: string; action: string; status: 'success' | 'failed' }> = [];
      let chainContext: Record<string, unknown> = {};

      for (const actionReq of actions) {
        // Inject context from previous steps (e.g. saleId)
        const augmentedRequest = { 
          ...actionReq, 
          payload: { ...actionReq.payload, ...chainContext } 
        };
        
        const res = await this.executeSingleAction(augmentedRequest);
        
        executed.push({ 
          agent: this.mapActionToAgent(actionReq.action), 
          action: actionReq.action, 
          status: res.success ? 'success' : 'failed' 
        });

        if (!res.success) break;
        if (res.data) chainContext = { ...chainContext, ...res.data };
      }

      return {
        type: 'action_chain',
        response: executed.every(a => a.status === 'success') 
          ? 'Tüm adımlar başarıyla uygulandı.' 
          : 'Bazı adımlar sırasında hata oluştu.',
        executedActions: executed,
        finalData: chainContext
      };
    }

    return { type: 'smart', response: planText, executedActions: [] };
  }

  private containsPlan(text: string): boolean {
    const keywords = ['öncelikle', 'ardından', 'sonra', 'adım', 'plan', 'yapacağım', 'sırasıyla'];
    return keywords.some(kw => text.toLowerCase().includes(kw));
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

export const nexusExecutive = NexusExecutive.getInstance();
