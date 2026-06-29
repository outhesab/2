import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  requestNotificationPermission,
  sendLocalNotification,
  saveFileToDevice,
  requestAllPermissions,
} from './permissions';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

describe('permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export requestNotificationPermission', () => {
    expect(typeof requestNotificationPermission).toBe('function');
  });

  it('should export sendLocalNotification', () => {
    expect(typeof sendLocalNotification).toBe('function');
  });

  it('should export saveFileToDevice', () => {
    expect(typeof saveFileToDevice).toBe('function');
  });

  it('should export requestAllPermissions', () => {
    expect(typeof requestAllPermissions).toBe('function');
  });
});
