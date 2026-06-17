// voice-sales/parser/voiceNlpParser.test.ts

import { describe, it, expect } from 'vitest';
import { parseVoiceCommand } from './voiceNlpParser';

// ─── Action Detection ───────────────────────────────────────────

describe('parseVoiceCommand - action detection', () => {
  it('detects "satis" from "2 tane soba nakit"', () => {
    const result = parseVoiceCommand("2 tane 80'lik soba nakit");
    expect(result.action).toBe('satis');
  });

  it('detects "satis" from "satış yap"', () => {
    const result = parseVoiceCommand("satış yap");
    expect(result.action).toBe('satis');
  });

  it('detects "iptal" from "iptal et"', () => {
    const result = parseVoiceCommand("iptal et");
    expect(result.action).toBe('iptal');
  });

  it('detects "iptal" from "son satışı iptal et"', () => {
    const result = parseVoiceCommand("son satışı iptal et");
    expect(result.action).toBe('iptal');
  });

  it('detects "iade" from "iade yap"', () => {
    const result = parseVoiceCommand("iade yap");
    expect(result.action).toBe('iade');
  });

  it('detects "iade" from "geri ver"', () => {
    const result = parseVoiceCommand("geri ver");
    expect(result.action).toBe('iade');
  });

  it('detects "fiyat_duzelt" from "fiyatı düzelt"', () => {
    const result = parseVoiceCommand("fiyatı düzelt");
    expect(result.action).toBe('fiyat_duzelt');
  });

  it('defaults to "satis" when no action keyword but has quantity', () => {
    const result = parseVoiceCommand("3 tane klima");
    expect(result.action).toBe('satis');
  });

  it('returns "unknown" for unclear input', () => {
    const result = parseVoiceCommand("merhaba");
    expect(result.action).toBe('unknown');
  });
});

// ─── Quantity Extraction ────────────────────────────────────────

describe('parseVoiceCommand - quantity extraction', () => {
  it('extracts "2" from "2 tane soba"', () => {
    const result = parseVoiceCommand("2 tane 80'lik soba");
    expect(result.items[0].quantity).toBe(2);
  });

  it('extracts Turkish "iki" from "iki tane soba"', () => {
    const result = parseVoiceCommand("iki tane 80'lik soba");
    expect(result.items[0].quantity).toBe(2);
  });

  it('extracts "bir" as 1', () => {
    const result = parseVoiceCommand("bir tane klima");
    expect(result.items[0].quantity).toBe(1);
  });

  it('extracts "on" as 10', () => {
    const result = parseVoiceCommand("on parça baca");
    expect(result.items[0].quantity).toBe(10);
  });

  it('defaults to 1 when no quantity specified', () => {
    const result = parseVoiceCommand("80'lik soba");
    expect(result.items[0].quantity).toBe(1);
  });
});

// ─── Product Query Extraction ───────────────────────────────────

describe('parseVoiceCommand - product query', () => {
  it('extracts "80\'lik soba" from "2 tane 80\'lik soba nakit"', () => {
    const result = parseVoiceCommand("2 tane 80'lik soba nakit");
    expect(result.items[0].productQuery).toContain("soba");
  });

  it('strips payment keywords from product query', () => {
    const result = parseVoiceCommand("2 tane klima kart ile");
    expect(result.items[0].productQuery).not.toContain("kart");
    expect(result.items[0].productQuery).toContain("klima");
  });

  it('strips quantity words from product query', () => {
    const result = parseVoiceCommand("3 tane baca borusu");
    expect(result.items[0].productQuery).not.toContain("tane");
    expect(result.items[0].productQuery).toContain("baca");
  });

  it('handles filler words "lütfen" "istiyorum"', () => {
    const result = parseVoiceCommand("lütfen 2 tane soba istiyorum");
    expect(result.items[0].productQuery).toContain("soba");
  });
});

// ─── Payment Detection ──────────────────────────────────────────

describe('parseVoiceCommand - payment detection', () => {
  it('detects "nakit" from "nakit"', () => {
    const result = parseVoiceCommand("2 tane soba nakit");
    expect(result.payment).toBe('nakit');
  });

  it('detects "nakit" from "peşin"', () => {
    const result = parseVoiceCommand("2 tane soba peşin");
    expect(result.payment).toBe('nakit');
  });

  it('detects "kart" from "kart ile"', () => {
    const result = parseVoiceCommand("2 tane soba kart ile");
    expect(result.payment).toBe('kart');
  });

  it('detects "kart" from "kredi kartı"', () => {
    const result = parseVoiceCommand("2 tane soba kredi kartı");
    expect(result.payment).toBe('kart');
  });

  it('detects "cari" from "cari"', () => {
    const result = parseVoiceCommand("2 tane soba cari");
    expect(result.payment).toBe('cari');
  });

  it('detects "cari" from "vadeli"', () => {
    const result = parseVoiceCommand("2 tane soba vadeli");
    expect(result.payment).toBe('cari');
  });

  it('detects "havale" from "havale ile"', () => {
    const result = parseVoiceCommand("2 tane soba havale ile");
    expect(result.payment).toBe('havale');
  });

  it('returns undefined when no payment specified', () => {
    const result = parseVoiceCommand("2 tane soba");
    expect(result.payment).toBeUndefined();
  });
});

// ─── Options Detection ──────────────────────────────────────────

describe('parseVoiceCommand - options', () => {
  it('detects percentage discount "yüzde 10 indirim"', () => {
    const result = parseVoiceCommand("2 tane soba yüzde 10 indirim");
    expect(result.options?.discount).toBe(10);
  });

  it('detects TL discount "50 tl indirim"', () => {
    const result = parseVoiceCommand("2 tane soba 50 tl indirim");
    expect(result.options?.discountAmount).toBe(50);
  });
});

// ─── Confidence ─────────────────────────────────────────────────

describe('parseVoiceCommand - confidence', () => {
  it('high confidence for complete command', () => {
    const result = parseVoiceCommand("2 tane 80'lik soba nakit");
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('low confidence for unclear command', () => {
    const result = parseVoiceCommand("merhaba");
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('very short text has reduced confidence', () => {
    const result = parseVoiceCommand("soba");
    expect(result.confidence).toBeLessThan(0.8);
  });
});

// ─── Raw Text Preservation ─────────────────────────────────────

describe('parseVoiceCommand - raw text', () => {
  it('preserves original transcript', () => {
    const input = "2 tane 80'lik soba nakit";
    const result = parseVoiceCommand(input);
    expect(result.rawText).toBe(input);
  });
});

// ─── Edge Cases ─────────────────────────────────────────────────

describe('parseVoiceCommand - edge cases', () => {
  it('handles empty string', () => {
    const result = parseVoiceCommand("");
    expect(result.action).toBe('unknown');
    expect(result.items.length).toBe(0);
  });

  it('handles numbers only', () => {
    const result = parseVoiceCommand("5 10 15");
    expect(result.action).toBe('satis'); // has quantity indicator
  });

  it('handles Turkish characters', () => {
    const result = parseVoiceCommand("ılık soba");
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('handles extra whitespace', () => {
    const result = parseVoiceCommand("  2   tane   soba   nakit  ");
    expect(result.action).toBe('satis');
    expect(result.items[0].quantity).toBe(2);
  });
});
