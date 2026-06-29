import { describe, expect, it } from 'vitest';

describe('FaturaAgent', () => {
  it('should export the agent class', async () => {
    const mod = await import('@/agents/FaturaAgent');
    expect(mod.FaturaAgent).toBeDefined();
    expect(typeof mod.FaturaAgent).toBe('function');
  });
});
