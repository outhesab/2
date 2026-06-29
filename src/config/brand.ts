export const BRAND_NAME = 'PARSPEL';
export const BRAND_SUBTITLE = 'Soba Yönetim Sistemi';
export const BRAND_TAGLINE = `${BRAND_NAME} ${BRAND_SUBTITLE}`;
export const BRAND_STORAGE_KEY = 'parspel_brand';

export function getBrandVersion(): string {
  if (typeof __APP_VERSION__ === 'string' && __APP_VERSION__) {
    return __APP_VERSION__;
  }
  return '0.0.0';
}
