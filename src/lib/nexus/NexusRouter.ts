/**
 * SOBA NEXUS AI — NexusRouter
 * The central decision-making engine for all AI interactions.
 * 
 * Routes requests based on:
 * 1. Fast Path (Deterministic / Regex)
 * 2. Smart Path (Cloud LLM / Reasoning)
 * 3. Action Path (Domain Agents)
 * 4. Data Path (Excel / File Analysis)
 * 5. Memory Path (Cross-Entity Discount Transfer)
 */

import { getAgent } from '@/agents';
import { offlineReply } from '@/lib/aiOffline';
import { parseVoiceIntent } from '@/lib/voiceIntent';
import { logger } from '@/lib/logger';
import { excelNexusModule } from '@/lib/nexus/modules/ExcelNexusModule';
import { proposeDiscountTransfer, type DiscountTransferProposal } from '@/lib/nexus/modules/DiscountMemoryModule';
import type { DB } from '@/types';
import type { AgentRequest, AgentResponse } from '@/agents/types';

export type RouteResult = {
  type: 'fast' | 'smart' | 'action' | 'data' | 'memory';
  response: string | AgentResponse;
  action?: AgentRequest;
  memoryProposal?: DiscountTransferProposal;
  confidence: number;
};

export class NexusRouter {
  private static instance: NexusRouter;

  private constructor() {}

  public static getInstance(): NexusRouter {
    if (!NexusRouter.instance) {
      NexusRouter.instance = new NexusRouter();
    }
    return NexusRouter.instance;
  }

  /**
   * Primary routing function.
   * Determines the best path for a given input.
   */
  public async route(input: string, db: DB, context: {
    isFileContext?: boolean,
    currentFiles?: unknown[],
    adminMode?: boolean,
  }): Promise<RouteResult> {
    const query = input.toLowerCase().trim();

    // 1. DATA PATH (Excel / File context)
    if (context.isFileContext && context.currentFiles) {
      try {
        const response = await excelNexusModule.queryCloudAI(input, context.currentFiles);
        return {
          type: 'data',
          response,
          confidence: 1.0,
        };
      } catch (e) {
        logger.error('nexus', 'Data path failure', { error: e });
      }
    }

    // Reasoning Check: If the user asks "Why", "How", "Predict", "Compare", skip Fast Path
    const reasoningKeywords = ['sence', 'neden', 'nasıl', 'karşılaştır', 'tahmin', 'gelecek', 'beklenti', 'analiz et'];
    const isReasoning = reasoningKeywords.some(kw => query.includes(kw));

    // 1b. MEMORY PATH (Cross-Entity Discount Transfer)
    // "Ali'nin indirimini Ahmet'e de uygula" kalıbını yakalar.
    const memoryProposal = this.detectDiscountTransfer(input, db);
    if (memoryProposal) {
      const text = memoryProposal.ok && memoryProposal.applicable
        ? `🧠 Hafıza: ${memoryProposal.reasoning}`
        : `🧠 Hafıza: ${memoryProposal.error ?? memoryProposal.reasoning}`;
      return {
        type: 'memory',
        response: text,
        memoryProposal,
        confidence: memoryProposal.applicable ? 0.92 : 0.4,
      };
    }

    // 2. FAST PATH (Deterministic / Local)
    // Skip fast path if it's a reasoning query
    if (!isReasoning) {
      const fastResponse = offlineReply(db, query);
      if (fastResponse && !fastResponse.includes('Cevrimdisi Mod')) {
        return {
          type: 'fast',
          response: fastResponse,
          confidence: 0.9,
        };
      }
    }

    // 3. ACTION PATH (Agent Mapping)
    // Try to see if the input is a direct command (like "100 TL gider yaz")
    const intent = await parseVoiceIntent(input);
    if (intent) {
      return {
        type: 'action',
        response: `İşlem anlaşıldı: ${intent.action}`,
        action: intent,
        confidence: 0.85,
      };
    }

    // 4. SMART PATH (Cloud LLM reasoning)
    // Fallback to the most powerful agent for deep reasoning
    try {
      const deepSeek = getAgent('deep_seek');
      const result = await deepSeek.islemYap({
        action: 'analiz',
        payload: { query, dbContext: 'summarized' },
      });

      if (result.ok) {
        return {
          type: 'smart',
          response: String(result.data ?? ''),
          confidence: 0.7,
        };
      }
    } catch (e) {
      logger.error('nexus', 'Smart path failure', { error: e });
    }

    // Ultimate Fallback
    return {
      type: 'smart',
      response: 'Üzgünüm, bunu anlayamadım. Lütfen daha farklı ifade eder misiniz?',
      confidence: 0.1,
    };
  }

  /**
   * Cross-entity discount transfer kalıbını yakalar.
   * Örn: "Ali'nin indirimini Ahmet'e de uygula", "Ali beye yaptığım indirimi ahmete yap"
   *
   * Token-tabanlı yaklaşım: "indirim" kelimesini bulur, bir önceki ve bir sonraki
   * anlamlı ismi çıkarır. Regex'ten daha sağlam — Türkçe ek/apostrof varyasyonlarına dayanıklı.
   * Saf/deterministiktir — LLM gerektirmez (GLM-5.2 yalnızca belirsiz durumlarda devreye girer).
   */
  private detectDiscountTransfer(input: string, db: DB): DiscountTransferProposal | null {
    const q = input.toLowerCase().trim();

    // "indirim" ve bir transfer fiili içermeli
    if (!q.includes("indirim")) return null;
    const transferVerbs = ["uygula", "yap", "geçerli olsun", "geç", "uygulansın", "uygula yine", "tekrap uygula"];
    if (!transferVerbs.some((v) => q.includes(v))) return null;

    // "indirim" kelimesini ekleriyle birlikte tüket (indirimini, indirimi, indirim, ...)
    const indirimMatch = q.match(/indirimi?[a-zçğıöşü]*/);
    if (!indirimMatch || indirimMatch.index === undefined) return null;
    const indirimEnd = indirimMatch.index + indirimMatch[0].length;
    const before = q.slice(0, indirimMatch.index);
    const after = q.slice(indirimEnd);

    // Token'ları çıkar (sadece harf dizileri)
    const beforeTokens = before.match(/[a-zçğıöşü]+/g) || [];
    const afterTokens = after.match(/[a-zçğıöşü]+/g) || [];

    // Filler/eylem kelimeleri — isim adayı değiller
    const FILLERS = ["nin", "nın", "beye", "beyin", "yaptığım", "uyguladığım", "de", "ye", "ya", "bir", "icin", "ile", "ve", "ama", "fakat", "bu", "su", "o", "benim", "senin", "bizim", "gibi", "kadar", "da", "ki"];
    const VERBS = ["uygula", "yap", "geç", "geçerli", "olsun", "uygulansın", "tekrar", "yine"];

    // Kaynak isim: "indirim"den önceki son filler-olmayan token
    const fromCandidates = beforeTokens.filter((t) => !FILLERS.includes(t) && t.length >= 2);
    const fromName = fromCandidates[fromCandidates.length - 1];

    // Hedef isim: "indirim"den sonraki ilk filler/verb-olmayan token
    const toName = afterTokens.find((t) => !FILLERS.includes(t) && !VERBS.includes(t) && t.length >= 2);

    if (!fromName || !toName) return null;
    if (fromName === toName) return null;

    logger.info("ai", "Discount transfer detected", { from: fromName, to: toName });
    return proposeDiscountTransfer(db, fromName, toName);
  }
}

export const nexusRouter = NexusRouter.getInstance();
