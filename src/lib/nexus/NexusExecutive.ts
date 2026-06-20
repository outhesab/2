import { getAgent } from '@/agents';
import { nexusRouter, RouteResult } from './NexusRouter';
import { voiceConfirmationGateway, requiresConfirmation, type ConfirmationResult } from './VoiceConfirmationGateway';
import { voiceSaleComposer } from './VoiceSaleComposer';
import { resolveUndo } from './VoiceUndoEngine';
import { weatherProactiveEngine } from './WeatherProactiveEngine';
import { whatsAppBridge } from './WhatsAppBridge';
import { logger } from '@/lib/logger';
import type { DB, AgentRequest, AgentResponse } from '@/types';

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
   * God-Mode Execution: Plans and executes complex requests.
   */
  public async execute(input: string, db: DB, context: {
    isFileContext?: boolean,
    currentFiles?: unknown[],
    adminMode?: boolean,
  }): Promise<ExecutiveResult> {
    logger.info('ai', 'Executing God-Mode request', { input, composerMode: this.composerMode });

    // 0. NAVIGATION CHECK (Highest Priority)
    const nav = this.checkNavigation(input);
    if (nav) {
      // Navigation composer modunu bozar
      if (this.composerMode) {
        voiceSaleComposer.reset();
        this.composerMode = false;
      }
      return {
        type: 'smart',
        response: `Hemen ${nav.path} sayfasına yönlendiriyorum...`,
        executedActions: [],
        navigation: nav,
      };
    }

    // 0b. COMPOSER MODE: aktifse her komutu composer ile işle
    if (this.composerMode) {
      return this.handleComposerInput(input, db);
    }

    // 0c. COMPOSER START: "yeni satış" / "satış başlat" → composer moduna geç
    if (this.isComposerStartCommand(input)) {
      voiceSaleComposer.reset();
      this.composerMode = true;
      logger.info('ai', 'Composer mode activated');
      return {
        type: 'composer_active',
        response: 'Yeni satış başlatıldı. Ürün ekleyin, müşteri seçin, indirim verin ve "sat" deyin.',
        executedActions: [],
        composerAck: 'Yeni satış başlatıldı. "X tane Y ekle" diyerek başlayın.',
      };
    }

    // 0d. UNDO: "son ... geri al" → undo engine + confirmation gateway
    if (!this.composerMode && this.isUndoCommand(input)) {
      const undoResult = resolveUndo(input, db);
      if (!undoResult.ok || !undoResult.intent) {
        return {
          type: 'smart',
          response: undoResult.error ?? 'Geri alınamadı.',
          executedActions: [],
        };
      }
      // Undo Intent → AgentRequest'e çevir, confirmation gateway'e gönder
      const action: AgentRequest = {
        action: undoResult.intent.type,
        payload: undoResult.intent.payload as unknown as Record<string, unknown>,
      };
      this.pendingConfirmationPromise = voiceConfirmationGateway.requestConfirmation(action);
      const readBack = voiceConfirmationGateway.getPendingReadBack();
      const targetInfo = undoResult.targetDescription ? ` (${undoResult.targetDescription})` : '';
      logger.info('ai', 'Undo awaiting confirmation', { actionType: undoResult.logEntry?.actionType });
      return {
        type: 'pending_confirmation',
        response: `${readBack ?? 'Geri alma onayınızı bekliyorum.'}${targetInfo}`,
        executedActions: [],
        pendingReadBack: readBack ?? undefined,
        pendingAction: action,
      };
    }

    // 0e. PROAKTIF HAVA: "hava durumu analizi", "stok durumu kontrol et", "hava nasıl etkiler"
    if (!this.composerMode && this.isProactiveWeatherCommand(input)) {
      const result = await weatherProactiveEngine.check(db, undefined, true);
      return {
        type: 'smart',
        response: result.message,
        executedActions: [],
        finalData: { kind: 'weather_proactive', alerts: result.alerts, weather: result.weather },
      };
    }

    // 0f. WHATSAPP SIM: "whatsapp'tan X dedi" → incoming simulation
    if (!this.composerMode && this.isWhatsAppSimCommand(input)) {
      const msgPhone = this.extractWhatsAppMessage(input);
      if (msgPhone) {
        const result = whatsAppBridge.incoming(msgPhone.message, msgPhone.phone, db);
        return {
          type: 'smart',
          response: `WhatsApp simülasyonu (${msgPhone.phone}): "${msgPhone.message}" → Cevap: ${result.reply}`,
          executedActions: [],
          finalData: { kind: 'whatsapp_sim', intent: result.intent, customer: result.customer, reply: result.reply },
        };
      }
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

    // 2b. Handle Memory Path (Cross-Entity Discount Transfer)
    // Öneriyi kullanıcıya sunar; gerçek uygulama UI onayı sonrası SatisAgent ile yapılır.
    if (routeResult.type === 'memory' && routeResult.memoryProposal) {
      const proposal = routeResult.memoryProposal;
      return {
        type: 'smart',
        response: routeResult.response as string,
        executedActions: [],
        finalData: proposal.applicable ? {
          kind: 'discount_transfer',
          proposal,
          // UI bu veriyi alıp onay sonrası completeSale'a gönderecek
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

    // 3. Handle Action Path (Single or Chain)
    if (routeResult.type === 'action' && routeResult.action) {
      const action = routeResult.action;

      // 3a. Güvenlik Kapısı: write aksiyonlar onay gerektirir
      if (requiresConfirmation(action.action)) {
        this.pendingConfirmationPromise = voiceConfirmationGateway.requestConfirmation(action);
        const readBack = voiceConfirmationGateway.getPendingReadBack();
        logger.info('ai', 'Action awaiting confirmation', { action: action.action });
        return {
          type: 'pending_confirmation',
          response: readBack ?? 'İşlem onayınızı bekliyorum.',
          executedActions: [],
          pendingReadBack: readBack ?? undefined,
          pendingAction: action,
        };
      }

      // 3b. Onay gerektirmeyen (read-only) aksiyonlar doğrudan çalışır
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

  /**
   * Composer başlatma komutu mu? ("yeni satış", "satış başlat", "satış yap")
   */
  private isComposerStartCommand(input: string): boolean {
    const q = input.toLowerCase().trim();
    return q === 'yeni satış' || q === 'yeni satis' || q === 'satış başlat' ||
           q === 'satis baslat' || q === 'satış yap' || q === 'satis yap' ||
           q === 'satış başlatın' || q === 'sepet aç' || q === 'sepet ac';
  }

  /**
   * Undo komutu mu? ("son ... geri al", "son ... iptal et")
   */
  private isUndoCommand(input: string): boolean {
    const q = input.toLowerCase().trim();
    if (!q.includes("son")) return false;
    const undoVerbs = ["geri al", "geri alalım", "geri alalim", "iptal et", "iade et"];
    return undoVerbs.some((v) => q.includes(v));
  }

  /**
   * Proaktif hava komutu mu? ("hava durumu", "stok kontrol", "hava nasıl etkiler")
   */
  private isProactiveWeatherCommand(input: string): boolean {
    const q = input.toLowerCase().trim();
    if (q.includes("hava durumu") || q.includes("hava nasıl") || q.includes("hava nasil")) return true;
    if (q.includes("stok kontrol") || q.includes("stok öner") || q.includes("stok oner")) return true;
    if (q.includes("hava etkisi") || q.includes("proaktif") || q.includes("öneri ver")) return true;
    return false;
  }

  /**
   * WhatsApp simülasyon komutu mu? ("whatsapp'tan X dedi", "whatsapp mesajı: X")
   */
  private isWhatsAppSimCommand(input: string): boolean {
    const q = input.toLowerCase().trim();
    return q.includes("whatsapp") && (q.includes("dedi") || q.includes("mesaj") || q.includes("sordu"));
  }

  /**
   * WhatsApp simülasyon mesajını ve telefonu çıkarır.
   * Format: "whatsapp'tan 0555... dedi: merhaba" veya "whatsapp mesajı: soba fiyatı (0555...)"
   */
  private extractWhatsAppMessage(input: string): { message: string; phone: string } | null {
    const q = input;
    // "whatsapp'tan 05551234567 dedi: merhaba" veya "whatsapptan 0555... mesajı: soba"
    const m1 = q.match(/whatsapp'?(?:tan|ten)?\s+(\+?\d{10,15})\s*(?:dedi|mesajı|sordu)[:\s]+(.+)/i);
    if (m1) return { phone: m1[1], message: m1[2].trim() };
    // "whatsapp mesajı: soba fiyatı" — telefon yok, varsayılan
    const m2 = q.match(/whatsapp\s*mesaj[ıi]?:\s*(.+)/i);
    if (m2) return { phone: "+905551234567", message: m2[1].trim() };
    return null;
  }

  /**
   * Composer modunda gelen sesli komutu işle.
   * - add_item/set_cari/set_discount vb. → draft güncellenir, ack döner
   * - finalize → SaleIntent → confirmation gateway'e yönlendir (composer mode kapanır)
   * - cancel → composer sıfırlanır, mode kapanır
   * - status → draft özeti döner
   */
  private handleComposerInput(input: string, db: DB): ExecutiveResult {
    const result = voiceSaleComposer.process(input, db);

    // Cancel — composer kapanır
    if (result.cancelled) {
      this.composerMode = false;
      return {
        type: 'composer_active',
        response: result.ack,
        executedActions: [],
        composerAck: result.ack,
        composerCancelled: true,
      };
    }

    // Finalize — SaleIntent üretildi, onay gateway'ine gönder
    if (result.finalizedIntent) {
      this.composerMode = false;
      const action: AgentRequest = {
        action: 'satis',
        payload: result.finalizedIntent as unknown as Record<string, unknown>,
      };
      // Onay gateway'den geçir (sale write aksiyon)
      this.pendingConfirmationPromise = voiceConfirmationGateway.requestConfirmation(action);
      const readBack = voiceConfirmationGateway.getPendingReadBack();
      logger.info('ai', 'Composer finalized, awaiting confirmation');
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

    // Status veya normal komut — composer mode açık kalır
    return {
      type: 'composer_active',
      response: result.ack,
      executedActions: [],
      composerAck: result.ack,
    };
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
