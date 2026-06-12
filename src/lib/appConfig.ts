/**
 * PARSPEL — Uygulama Konfigürasyonu
 * Uygulama adı, versiyon ve ikon sistemi buradan yönetilir.
 */

import { logger } from "@/lib/logger";
import { BRAND_NAME, BRAND_SUBTITLE, getBrandVersion } from "@/config/brand";

export const APP_NAME = BRAND_NAME;
export const APP_SUBTITLE = BRAND_SUBTITLE;
export const APP_DEFAULT_VERSION = getBrandVersion();
export const APP_STORAGE_KEY = 'parspelConfig';

// ── Versiyon Yönetimi ──────────────────────────────────────────────────────

export interface AppConfig {
  version: string;       // örn: "2.1.0", "2.1.0-beta", "3.0.0-rc1"
  appName: string;       // özelleştirilebilir uygulama adı
  appIcon: string;       // emoji veya URL
  updatedAt: string;
}

export function loadAppConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (raw) return { ...defaultConfig(), ...JSON.parse(raw) };
  } catch {
    logger.warn("appConfig", "Yapılandırma yüklenemedi");
    /* ignore */ }
  return defaultConfig();
}

export function saveAppConfig(cfg: AppConfig): void {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ ...cfg, updatedAt: new Date().toISOString() }));
}

function defaultConfig(): AppConfig {
  return {
    version: APP_DEFAULT_VERSION,
    appName: APP_NAME,
    appIcon: '🔥',
    updatedAt: new Date().toISOString(),
  };
}

// ── İkon Sistemi ───────────────────────────────────────────────────────────

/** Emoji kategorileri — IconPicker'da kullanılır */
export const ICON_CATEGORIES: { label: string; icons: string[] }[] = [
  {
    label: 'İş & Finans',
    icons: ['💰','💵','💳','🏦','📊','📈','📉','🧾','💼','🏢','🤝','📋','📌','📎','🔖'],
  },
  {
    label: 'Ürün & Stok',
    icons: ['📦','🛒','🏪','🏭','⚙️','🔧','🔩','🪛','🔨','🪚','🔥','🪵','🔩','🧱','🪜'],
  },
  {
    label: 'Kişi & İletişim',
    icons: ['👤','👥','🧑‍💼','📞','📱','✉️','📬','🔔','🔕','📢','📣','🗣️','👋','🤝','🫱'],
  },
  {
    label: 'Araç & Ulaşım',
    icons: ['🚛','🚚','🚗','🏎️','🚐','🚌','✈️','🚢','🚂','🛵','🚲','⛽','🛣️','🗺️','📍'],
  },
  {
    label: 'Doğa & Çevre',
    icons: ['🌿','🌱','🌲','🌳','🍃','🌾','🌻','🌊','⛰️','🏔️','🌍','☀️','🌙','⭐','❄️'],
  },
  {
    label: 'Sistem & Teknik',
    icons: ['⚡','🔌','💡','🖥️','💻','📡','🛰️','🔐','🔑','🗝️','🛡️','⚠️','✅','❌','🔄'],
  },
];

/** Versiyon formatı doğrulama: "2.1.0", "2.1.0-beta", "3.0.0-rc1" */
export function validateVersion(v: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(v.trim());
}
