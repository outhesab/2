/**
 * SOBA NEXUS AI — NexusRouter
 * The central decision-making engine for all AI interactions.
 * 
 * Routes requests based on:
 * 1. Fast Path (Deterministic / Regex)
 * 2. Smart Path (Cloud LLM / Reasoning)
 * 3. Action Path (Domain Agents)
 * 4. Data Path (Excel / File Analysis)
 */

import { getAgent } from '@/agents';
import { offlineReply } from '@/lib/aiOffline';
import { parseVoiceIntent } from '@/lib/voiceIntent';
import { logger } from '@/lib/logger';
import { excelNexusModule } from '@/lib/nexus/modules/ExcelNexusModule';
import type { DB, AgentRequest, AgentResponse } from '@/types';

export type RouteResult = {
  type: 'fast' | 'smart' | 'action' | 'data';
  response: string | AgentResponse;
  action?: AgentRequest;
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
        logger.error('NexusRouter', 'Data path failure', { error: e });
      }
    }

    // Reasoning Check: If the user asks "Why", "How", "Predict", "Compare", skip Fast Path
    const reasoningKeywords = ['sence', 'neden', 'nasıl', 'karşılaştır', 'tahmin', 'gelecek', 'beklenti', 'analiz et'];
    const isReasoning = reasoningKeywords.some(kw => query.includes(kw));

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
        action: 'analyze',
        payload: { query, dbContext: 'summarized' }, // Context optimization will be added
      });

      if (result.ok) {
        return {
          type: 'smart',
          response: result.data as string,
          confidence: 0.7,
        };
      }
    } catch (e) {
      logger.error('NexusRouter', 'Smart path failure', { error: e });
    }

    // Ultimate Fallback
    return {
      type: 'smart',
      response: 'Üzgünüm, bunu anlayamadım. Lütfen daha farklı ifade eder misiniz?',
      confidence: 0.1,
    };
  }
}

export const nexusRouter = NexusRouter.getInstance();
