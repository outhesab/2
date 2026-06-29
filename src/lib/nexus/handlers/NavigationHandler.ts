import { logger } from '@/lib/logger';
import type { IntentHandler, HandlerContext, ExecutiveResult } from './IntentHandler';
import type { DB } from '@/types';

/**
 * NavigationHandler - Handles navigation commands (highest priority)
 * Examples: "satışlar", "kasa", "cari", "stok", "raporlar", "dashboard", "ayarlar"
 */
export class NavigationHandler implements IntentHandler {
  readonly name = 'NavigationHandler';
  readonly priority = 100; // Highest priority

  private navMap: Record<string, string> = {
    satışlar: '/sales',
    'satış sayfası': '/sales',
    kasa: '/kasa',
    cari: '/cari',
    'müşteri listesi': '/cari',
    stok: '/stock',
    ürünler: '/stock',
    raporlar: '/reports',
    dashboard: '/dashboard',
    'ana sayfa': '/dashboard',
    ayarlar: '/settings',
  };

  canHandle(input: string, _context: HandlerContext): boolean {
    const query = input.toLowerCase().trim();

    // Check direct navigation commands
    for (const key of Object.keys(this.navMap)) {
      if (query.includes(key)) return true;
    }

    // Check entity-specific navigation
    if (query.includes('sayfasına git') || query.includes('detayını aç')) {
      return true;
    }

    return false;
  }

  async handle(input: string, _db: DB, context: HandlerContext): Promise<ExecutiveResult> {
    const query = input.toLowerCase().trim();

    // Navigation resets composer mode (highest priority)
    if (context.composerMode && context.resetComposer) {
      context.resetComposer();
      logger.info('navigation', 'Composer reset due to navigation');
    }

    // Direct navigation
    for (const [key, path] of Object.entries(this.navMap)) {
      if (query.includes(key)) {
        logger.info('navigation', `Navigating to ${path}`, { trigger: key });
        return {
          type: 'smart',
          response: `Hemen ${path} sayfasına yönlendiriyorum...`,
          executedActions: [],
          navigation: { path },
        };
      }
    }

    // Entity-specific navigation (e.g., "Ahmet Bey'in sayfasına git")
    if (query.includes('sayfasına git') || query.includes('detayını aç')) {
      logger.info('navigation', 'Entity detail navigation requested');
      return {
        type: 'smart',
        response: 'İlgili detay sayfasına yönlendiriyorum...',
        executedActions: [],
        navigation: { path: '/cari/detail' },
      };
    }

    // Should not reach here if canHandle works correctly
    return {
      type: 'smart',
      response: 'Navigasyon hedefi bulunamadı.',
      executedActions: [],
    };
  }
}

// Auto-register
import { intentHandlerRegistry } from './IntentHandler';
intentHandlerRegistry.register(new NavigationHandler());
