import { getAgent } from '@/agents';
import { voiceConfirmationGateway, type ConfirmationResult } from './VoiceConfirmationGateway';
import { voiceSaleComposer } from './VoiceSaleComposer';
import { logger } from '@/lib/logger';
import type { DB } from '@/types';
import type { AgentRequest, AgentId } from '@/agents/types';
import { intentHandlerRegistry } from './handlers/IntentHandler';
import type { HandlerContext } from './handlers/IntentHandler';

export type ExecutiveResult = {
  type: 'fast' | 'smart' | 'action_chain' | 'pending_confirmation' | 'composer_active';
  response: string;
  executedActions: Array<{ agent: string; action: string; status: 'success' | 'failed' }>;
  finalData?: unknown;
  navigation?: { path: string; params?: Record<string, string> };
  /** pending_confirmation tipinde: konuşulacak read-back metni */
  pendingReadBack?: string;
  /** pending_confirmation tipinde: onay bekleyen aksiyon */
  pendingAction?: AgentRequest;
  /** composer_active tipinde: composer'dan gelen kısa ack mesajı */
  composerAck?: string;
  /** composer finalize ettiyse: onay için SaleIntent → AgentRequest */
  composerFinalize?: AgentRequest;
  /** composer iptal ettiyse true */
  composerCancelled?: boolean;
  /** Handler registry için: bu sonucu atla, sonraki handler'a geç (internal) */
  _skipNext?: boolean;
};

export class NexusExecutive {
  private static instance: NexusExecutive;
  /** Onay bekleyen işlem'in promise'ı — submitConfirmation bunu resolve eder */
  private pendingConfirmationPromise: Promise<ConfirmationResult> | null = null;
  /** Composer modu aktif mi? (yeni satış başlatıldığında true, finalize/cancel'da false) */
  private composerMode = false;

  private constructor() {}

  public static getInstance(): NexusExecutive {
    if (!NexusExecutive.instance) {
      NexusExecutive.instance = new NexusExecutive();
    }
    return NexusExecutive.instance;
  }

  /**
   * God-Mode Execution: Delegates to IntentHandlerRegistry.
   * Handlers are sorted by priority:
   *   100 Navigation  → 90 Composer → 85 Undo → 80 Weather → 75 WhatsApp
   *   → 70 ActionHandler (NexusRouter: fast/memory/action, passthrough for smart)
   *   → 50 SmartHandler (DeepSeek deep reasoning, fallback)
   */
  public async execute(input: string, db: DB, context: {
    isFileContext?: boolean,
    currentFiles?: unknown[],
    adminMode?: boolean,
  }): Promise<ExecutiveResult> {
    logger.info('ai', 'Executing God-Mode request', { input, composerMode: this.composerMode });

    const handlerContext: HandlerContext = {
      composerMode: this.composerMode,
      isFileContext: context.isFileContext,
      currentFiles: context.currentFiles,
      adminMode: context.adminMode,
      setComposerMode: (active: boolean) => { this.composerMode = active; },
      resetComposer: () => {
        voiceSaleComposer.reset();
        this.composerMode = false;
      },
      registerConfirmationPromise: (promise: Promise<unknown>) => {
        this.pendingConfirmationPromise = promise as Promise<ConfirmationResult>;
      },
    };

    const result = await intentHandlerRegistry.execute(input, db, handlerContext);
    return result;
  }

  /**
   * Composer modunu manuel başlat (UI butonu için).
   */
  public startComposer(): void {
    voiceSaleComposer.reset();
    this.composerMode = true;
  }

  /**
   * Composer modunu manuel kapat (UI çıkışında).
   */
  public stopComposer(): void {
    voiceSaleComposer.reset();
    this.composerMode = false;
  }

  public isComposerActive(): boolean {
    return this.composerMode;
  }

  /**
   * Sesli onay akışı: pending_confirmation sonrası kullanıcının yanıtını işle.
   * - "evet/tamam/onay" → pending aksiyonu execute et, action_chain döner.
   * - "hayır/iptal/vazgeç" → discard, cancelled action_chain döner.
   * - belirsiz → tekrar sor (aynı pending_confirmation döner, re-ask metni ile).
   *
   * Caller (voice UI) akışı:
   *   1. execute() → type='pending_confirmation' + pendingReadBack
   *   2. TTS ile pendingReadBack'i söyle
   *   3. STT ile kullanıcı yanıtını al
   *   4. submitConfirmation(yanit) → sonuç
   */
  public async submitConfirmation(text: string): Promise<ExecutiveResult> {
    if (!this.pendingConfirmationPromise) {
      return {
        type: 'smart',
        response: 'Şu an onay bekleyen bir işlem yok.',
        executedActions: [],
      };
    }

    const handled = voiceConfirmationGateway.submitResponse(text);
    if (!handled) {
      // Belirsiz — tekrar sor
      return {
        type: 'pending_confirmation',
        response: 'Anlayamadım. Evet veya hayır deyin mi?',
        executedActions: [],
        pendingReadBack: 'Anlayamadım. Lütfen evet veya hayır deyin.',
      };
    }

    const result = await this.pendingConfirmationPromise;
    this.pendingConfirmationPromise = null;

    if (!result.confirmed) {
      const reason = result.cancelled ? (result.reason ?? 'İptal edildi') : 'İşlem reddedildi';
      return {
        type: 'action_chain',
        response: `İşlem yapılmadı: ${reason}.`,
        executedActions: [],
      };
    }

    // Onaylandı — aksiyonu çalıştır
    const action = result.request;
    const execResult = await this.executeSingleAction(action);
    return {
      type: 'action_chain',
      response: execResult.success
        ? `İşlem başarıyla tamamlandı: ${execResult.message}`
        : `Hata oluştu: ${execResult.message}`,
      executedActions: [{
        agent: this.mapActionToAgent(action.action),
        action: action.action,
        status: execResult.success ? 'success' : 'failed',
      }],
      finalData: execResult.data,
    };
  }

  /**
   * Pending onayı iptal et (UI çıkışında/zaman aşımında çağrılabilir).
   */
  public cancelPendingConfirmation(reason?: string): void {
    voiceConfirmationGateway.cancel(reason);
    this.pendingConfirmationPromise = null;
  }

  private async executeSingleAction(request: AgentRequest): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const agentId = this.mapActionToAgent(request.action);
      // Cast to satisfy overload resolution
      const agent = getAgent(agentId as 'satis' | 'stok' | 'kasa' | 'cari' | 'fatura' | 'rapor' | 'deep_seek');
      
      const result = await agent.islemYap(request);
      
      if (result.ok) {
        return { success: true, message: `Agent ${agentId} işlemi tamamladı.`, data: result.data };
      } else {
        return { success: false, message: result.error || 'Agent işlemi reddetti.' };
      }
    } catch (e) {
      logger.error('nexus', 'Action execution failed', { error: e });
      return { success: false, message: 'Sistem hatası oluştu.' };
    }
  }

  private mapActionToAgent(action: string): AgentId {
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
