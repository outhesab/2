import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn() },
}));

describe('excelExport', () => {
  it('should export expected functions', async () => {
    const mod = await import('./excelExport');
    expect(typeof mod.exportToExcel).toBe('function');
    expect(typeof mod.exportArrayToExcel).toBe('function');
  });
});
