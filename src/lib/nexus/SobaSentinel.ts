import { voiceNexusCore } from '@/lib/nexus/VoiceNexusCore';
import { computeKasaToplam, computeAlacak, getOutOfStockProducts } from '@/lib/dbUtils';
import type { DB } from '@/types';
import { logger } from '@/lib/logger';

export type SentinelAlert = {
  id: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
};

export class SobaSentinel {
  private static instance: SobaSentinel;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastAlertTime: number = 0;
  private alertCooldown = 1000 * 60 * 15; // 15 minutes cooldown between alerts
  private processedAlerts: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): SobaSentinel {
    if (!SobaSentinel.instance) {
      SobaSentinel.instance = new SobaSentinel();
    }
    return SobaSentinel.instance;
  }

  public start(dbProvider: () => DB) {
    if (this.checkInterval) return;

    logger.info('sentinel', 'Starting Sentinel monitoring...');
    this.checkInterval = setInterval(
      () => {
        this.runAudit(dbProvider());
      },
      1000 * 60 * 5,
    ); // Audit every 5 minutes
  }

  public stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('sentinel', 'Sentinel stopped.');
    }
  }

  private async runAudit(db: DB) {
    logger.info('sentinel', 'Running business health audit...');
    const alerts: SentinelAlert[] = [];

    // 1. Kasa Kritik Seviye
    const kasa = computeKasaToplam(db);
    if (kasa < 5000) {
      alerts.push({
        id: 'kasa_low',
        priority: 'high',
        message: `Dikkat, kasa seviyesi kritik düzeye indi: ${kasa} TL.`,
        timestamp: Date.now(),
      });
    }

    // 2. Stok Kritik Seviye
    const outOfStock = getOutOfStockProducts(db);
    if (outOfStock.length > 0) {
      alerts.push({
        id: 'stock_empty',
        priority: 'medium',
        message: `${outOfStock.length} ürünün stoğu tamamen bitti. Tedarik planlaması yapmanızı öneririm.`,
        timestamp: Date.now(),
      });
    }

    // 3. Yüksek Alacak Riski
    const alacak = computeAlacak(db);
    if (alacak > 100000) {
      alerts.push({
        id: 'high_debt',
        priority: 'medium',
        message: `Müşteri alacakları 100 bin TL eşiğini aştı. Tahsilat sürecini başlatmak ister misiniz?`,
        timestamp: Date.now(),
      });
    }

    if (alerts.length > 0) {
      await this.processAlerts(alerts);
    }
  }

  private async processAlerts(alerts: SentinelAlert[]) {
    const now = Date.now();
    if (now - this.lastAlertTime < this.alertCooldown) return;

    // Sort by priority: high > medium > low
    const priorityMap = { high: 3, medium: 2, low: 1 };
    alerts.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

    const topAlert = alerts[0];

    // Only alert if this specific alert hasn't been processed recently or is high priority
    if (topAlert.priority === 'high' || !this.processedAlerts.has(topAlert.id)) {
      logger.warn('sentinel', 'Triggering voice alert', { alert: topAlert });

      await voiceNexusCore.speak(`Soba Nexus Uyarı: ${topAlert.message}`);

      this.lastAlertTime = now;
      this.processedAlerts.add(topAlert.id);
    }
  }
}

export const sobaSentinel = SobaSentinel.getInstance();
