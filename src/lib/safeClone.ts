import { logger } from '@/lib/logger';

export function safeClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch {
      logger.warn('safeClone', 'structuredClone başarısız, JSON fallback kullanılıyor');
      // structuredClone not available, falling back to JSON
    }
  }
  return JSON.parse(JSON.stringify(obj));
}
