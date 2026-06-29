import { getBrandVersion } from '@/config/brand';
import { CHANGELOG } from './changelog';

export const VERSION = getBrandVersion();

export function getAppVersion(): string {
  return VERSION;
}

export function getVersionTitle(): string {
  return CHANGELOG[0]?.title || '';
}
