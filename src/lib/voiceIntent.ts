import { AgentRequest } from '@/agents/types';
import { getAgent } from '@/agents';
import { getDomainContext } from '@/lib/domainDictionary';
import { logger } from '@/lib/logger';

/**
 * PARSPEL — Voice Intent Parser
 * Sesli komutları SatisAgent'ın anlayacağı AgentRequest formatına çevirir.
 */

export async function parseVoiceIntent(text: string): Promise<AgentRequest | null> {
  const input = text.toLowerCase().trim();

  // --- FAST PATH: Regex-based intent detection (Offline & Instant) ---
  // Pattern: "100 TL gider", "500 lira gider yaz"
  const giderMatch = input.match(/(\d+)\s*(tl|lira)\s*gider/);
  if (giderMatch) {
    return {
      action: 'kasa_gider',
      payload: { amount: parseInt(giderMatch[1]), kasa: 'nakit', category: 'diger_gider', description: text },
    };
  }

  // Pattern: "200 TL gelir", "1000 lira gelir kaydet"
  const gelirMatch = input.match(/(\d+)\s*(tl|lira)\s*gelir/);
  if (gelirMatch) {
    return {
      action: 'kasa_gelir',
      payload: { amount: parseInt(gelirMatch[1]), kasa: 'nakit', category: 'diger_gelir', description: text },
    };
  }

  // Pattern: "500 TL tahsilat", "Ahmet'ten 200 tl tahsilat"
  const tahsilatMatch = input.match(/(\d+)\s*(tl|lira)\s*tahsilat/);
  if (tahsilatMatch) {
    return {
      action: 'cari_tahsilat',
      payload: { amount: parseInt(tahsilatMatch[1]), kasa: 'nakit', cariName: '' },
    };
  }

  // --- SMART PATH: LLM-based intent detection ---
  const aiAgent = getAgent('deep_seek');
  const domainContext = getDomainContext();
  
  const prompt = `
    Sen bir soba bayii satış asistanı niyet analizcisisin. 
    Sektöre özel terimleri içeren şu sözlüğü baz al:
    ${domainContext}

    Kullanıcının söylediği metindeki gürültüleri temizle ve onu SatisAgent'ın anlayacağı JSON formatına çevir.
    
    Mevcut aksiyonlar:
    - 'sale': Yeni satış başlatır. Payload: { items: [{productId, quantity, unitPrice}], payment: 'nakit'|'kart'|'vadeli', cariId?: string }
    - 'iptal': Satışı tamamen iptal eder. Payload: { saleId: string }
    - 'iade': Satıştan ürün iadesi alır. Payload: { saleId: string, qty: number | Record<string, number> }
    - 'fiyat_duzelt': Ürün fiyatını günceller. Payload: { saleId: string, yeniFiyat: number | Record<string, number> }

    KURALLAR:
    1. Sadece saf JSON dön, açıklama yapma.
    2. Sözlükteki terimlerle eşleşen kelimeleri doğru aksiyona ata.
    3. Eğer niyet belirsizse null dön.

    Kullanıcı Metni: "${text}"
    
    JSON Formatı:
    { "action": "aksiyon_adı", "payload": { ... } }
  `;

  try {
    const result = await aiAgent.islemYap({
      action: 'analyze_intent',
      payload: { prompt },
    });

    if (result.ok && result.data) {
      const rawResponse = typeof result.data === 'string' 
        ? result.data 
        : JSON.stringify(result.data);
      
      const jsonMatch = rawResponse.match(/\\{.*\\}/s);
      const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
      
      return JSON.parse(jsonString) as AgentRequest;
    }
  } catch (error) {
    logger.error('voice', 'Voice Intent Parse Hatası', { error });
  }

  return null;
}

