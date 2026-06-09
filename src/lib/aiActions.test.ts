import { describe, expect, it } from 'vitest';
import { parseActions, stripActions } from './aiActions';

describe('aiActions', () => {
  it('should export parseActions', () => {
    expect(typeof parseActions).toBe('function');
  });

  it('should export stripActions', () => {
    expect(typeof stripActions).toBe('function');
  });

  it('parseActions should parse valid action JSON', () => {
    const result = parseActions('[{"type":"satis","payload":{"productId":"p1","qty":1,"price":100,"payment":"nakit"}}]');
    expect(Array.isArray(result)).toBe(true);
  });

  it('parseActions should return empty array for invalid input', () => {
    const result = parseActions('invalid json');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('stripActions should remove action code blocks', () => {
    const result = stripActions('```action\n{"type":"test"}\n```');
    expect(result).not.toContain('```action');
  });
});
