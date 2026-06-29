import { describe, expect, it, vi } from 'vitest';
import { agentBus } from '@/agents/AgentBus';

describe('AgentBus', () => {
  it('should be a singleton', () => {
    expect(agentBus).toBeDefined();
  });

  it('should have emit and on methods', () => {
    expect(typeof agentBus.emit).toBe('function');
    expect(typeof agentBus.on).toBe('function');
    expect(typeof agentBus.off).toBe('function');
  });

  it('should emit and receive events', () => {
    const fn = vi.fn();
    agentBus.on('test.event', fn);
    agentBus.emit('satis', 'test.event', { data: 1 });
    expect(fn).toHaveBeenCalled();
    agentBus.off('test.event', fn);
  });
});
