import { logger } from '@/lib/logger';

export type AgentId = 'satis' | 'stok' | 'cari' | 'kasa' | 'fatura' | 'rapor';

export type AgentSettings = Record<AgentId, boolean>;

const STORAGE_KEY = 'sobaYonetim';

const defaultAgentSettings: AgentSettings = {
  satis: true,
  stok: true,
  cari: true,
  kasa: true,
  fatura: true,
  rapor: true,
};

type StoredShape = {
  agentSettings?: Partial<AgentSettings>;
};

export function loadAgentSettings(): AgentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultAgentSettings };

    const parsed = JSON.parse(raw) as StoredShape;
    const partial = parsed.agentSettings || {};

    return {
      ...defaultAgentSettings,
      ...partial,
    };
  } catch (e) {
    logger.warn('system', 'loadAgentSettings localStorage parse hatası', { error: e });
    return { ...defaultAgentSettings };
  }
}

/* saveAgentSettings + setAgentEnabled kaldırıldı — kullanılmıyor */
