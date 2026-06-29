/**
 * SOBA NEXUS AI — ExcelNexusModule
 * Handles external file analysis, offline data quality checks,
 * and bridging file data to internal domain agents.
 */

import { analyzeOffline, buildFileContext, type OfflineAnalysis, type ExcelFile } from '@/lib/offline-ai';
import { logger } from '@/lib/logger';

export class ExcelNexusModule {
  private static instance: ExcelNexusModule;

  private constructor() {}

  public static getInstance(): ExcelNexusModule {
    if (!ExcelNexusModule.instance) {
      ExcelNexusModule.instance = new ExcelNexusModule();
    }
    return ExcelNexusModule.instance;
  }

  /**
   * Performs a fast offline analysis of the current file set.
   */
  public analyzeFiles(files: ExcelFile[]): OfflineAnalysis {
    if (files.length === 0) {
      throw new Error('Analiz edilecek dosya bulunamadı');
    }
    return analyzeOffline(files);
  }

  /**
   * Prepares a compact context of the files to be sent to a Cloud LLM.
   */
  public prepareContext(files: ExcelFile[]) {
    return buildFileContext(files);
  }

  /**
   * Sends a query to the Excel AI API.
   */
  public async queryCloudAI(query: string, files: ExcelFile[], messages: unknown[] = []): Promise<string> {
    const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    const fileContext = this.prepareContext(files);

    try {
      const resp = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: query }],
          fileContext,
        }),
      });

      if (!resp.ok) throw new Error(`API Error: ${resp.status}`);

      // Since we want a final string for the Nexus Bubble/Panel,
      // we accumulate the stream here.
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) fullText += data.content;
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      }

      return fullText || 'Analiz tamamlandı ancak yanıt alınamadı.';
    } catch (e) {
      logger.error('ExcelNexusModule', 'Cloud AI query failed', { error: e });
      // Fallback to offline analysis summary
      const off = this.analyzeFiles(files);
      return `Bulut AI'ya erişilemedi. Yerel Analiz: Veri Kalite Skoru ${off.overallScore}/100. ${off.recommendations[0] || ''}`;
    }
  }

  /**
   * Bridges a file-based insight to an internal agent action.
   * Example: "Dosyadaki toplam tutarı kasaya ekle"
   */
  public async bridgeToAgent(
    insight: string,
    agentId: 'satis' | 'stok' | 'kasa' | 'cari' | 'fatura' | 'rapor' | 'deep_seek',
    payload: Record<string, unknown>,
  ) {
    const { getAgent } = await import('@/agents');
    // Cast to specific literal to satisfy overload resolution
    const agent = getAgent(agentId as 'satis' | 'stok' | 'kasa' | 'cari' | 'fatura' | 'rapor' | 'deep_seek');

    return agent.islemYap({
      action: 'nexus_bridge_action',
      payload: {
        source: 'ExcelNexusModule',
        insight,
        ...payload,
      },
    });
  }
}

export const excelNexusModule = ExcelNexusModule.getInstance();
