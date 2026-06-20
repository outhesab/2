/**
 * useStorageMonitor — localStorage kullanımını izler ve uyarı verir.
 *
 * Kullanım:
 *   const { status, isNearLimit } = useStorageMonitor({ warnAt: 80 });
 *   if (isNearLimit) { /* UI uyarısı göster *\/ }
 */
import { useState, useEffect, useCallback } from 'react';
import { getStorageUsage } from '@/lib/safeIO';
import type { StorageStatus } from '@/lib/safeIO';

export interface StorageMonitorOptions {
  /** Uyarı eşiği (yüzde). Varsayılan: 80 */
  warnAt?: number;
  /** Kritik eşik (yüzde). Varsayılan: 95 */
  criticalAt?: number;
  /** Kontrol aralığı (ms). Varsayılan: 30000 (30sn) */
  intervalMs?: number;
}

export interface StorageMonitorResult {
  status: StorageStatus;
  isNearLimit: boolean;
  isCritical: boolean;
  usagePercent: number;
  usageMB: string;
  refresh: () => void;
}

const defaultOptions: Required<StorageMonitorOptions> = {
  warnAt: 80,
  criticalAt: 95,
  intervalMs: 30_000,
};

/**
 * localStorage kullanımını periyodik olarak izler.
 * UI'da storage durumu göstermek için kullanılır.
 */
export function useStorageMonitor(options?: StorageMonitorOptions): StorageMonitorResult {
  const { warnAt, criticalAt, intervalMs } = { ...defaultOptions, ...options };

  const [status, setStatus] = useState<StorageStatus>(() => getStorageUsage());

  const refresh = useCallback(() => {
    setStatus(getStorageUsage());
  }, []);

  useEffect(() => {
    // İlk kontrol
    refresh();

    // Periyodik kontrol
    const timer = setInterval(refresh, intervalMs);

    // localStorage değişikliklerini de yakala (diğer sekmeler)
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, [intervalMs, refresh]);

  return {
    status,
    isNearLimit: status.percent >= warnAt,
    isCritical: status.percent >= criticalAt,
    usagePercent: status.percent,
    usageMB: (status.used / (1024 * 1024)).toFixed(1),
    refresh,
  };
}

/** Tek seferlik storage kullanım sorgusu (hook gerektirmeyen) */
export function checkStorageStatus(): StorageStatus {
  return getStorageUsage();
}

/** İnsan-okunabilir storage raporu */
export function formatStorageStatus(status: StorageStatus): string {
  const usedMB = (status.used / (1024 * 1024)).toFixed(1);
  const limitMB = (status.limit / (1024 * 1024)).toFixed(1);
  const level = status.critical ? '🔴 Kritik' : status.warning ? '🟡 Uyarı' : '🟢 Normal';
  return `${level}: ${usedMB}MB / ${limitMB}MB (${status.percent}%) — ${status.entries} kayıt`;
}
