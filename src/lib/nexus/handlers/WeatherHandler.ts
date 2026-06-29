import { weatherProactiveEngine } from '@/lib/nexus/WeatherProactiveEngine';
import { logger } from '@/lib/logger';
import type { IntentHandler, HandlerContext, ExecutiveResult } from './IntentHandler';
import type { DB } from '@/types';

/**
 * WeatherHandler - Handles proactive weather and stock queries
 * Examples: "hava durumu", "stok kontrol", "hava nasıl etkiler"
 */
export class WeatherHandler implements IntentHandler {
  readonly name = 'WeatherHandler';
  readonly priority = 80;

  canHandle(input: string, context: HandlerContext): boolean {
    if (context.composerMode) return false;

    const query = input.toLowerCase().trim();
    if (query.includes('hava durumu') || query.includes('hava nasıl') || query.includes('hava nasil')) return true;
    if (query.includes('stok kontrol') || query.includes('stok öner') || query.includes('stok oner')) return true;
    if (query.includes('hava etkisi') || query.includes('proaktif') || query.includes('öneri ver')) return true;

    return false;
  }

  async handle(input: string, db: DB, _context: HandlerContext): Promise<ExecutiveResult> {
    const result = await weatherProactiveEngine.check(db, undefined, true);

    logger.info('weather', 'Proactive weather check requested', { alertCount: result.alerts?.length ?? 0 });

    return {
      type: 'smart',
      response: result.message,
      executedActions: [],
      finalData: { kind: 'weather_proactive', alerts: result.alerts, weather: result.weather },
    };
  }
}

// Auto-register
import { intentHandlerRegistry } from './IntentHandler';
intentHandlerRegistry.register(new WeatherHandler());
