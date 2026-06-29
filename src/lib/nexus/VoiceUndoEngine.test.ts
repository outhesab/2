import { describe, it, expect } from 'vitest';
import type { DB, AIActionLogEntry, KasaEntry, Sale } from '@/types';
import { makeDB } from '@/__tests__/testUtils';
import { parseUndoCommand, findLastUndoableAction, buildUndoIntent, resolveUndo } from './VoiceUndoEngine';

// ── Test yardımcıları ────────────────────────────────────────────────────────

function makeLogEntry(
  partial: Partial<AIActionLogEntry> & { id: string; createdAt: string; actionType: string },
): AIActionLogEntry {
  return {
    model: 'offline',
    mode: 'manual',
    label: 'Test işlem',
    status: 'applied',
    ...partial,
  };
}

function makeSale(partial: Partial<Sale> & { id: string }): Sale {
  return {
    cariId: 'c1',
    productName: 'Soba 80lik',
    productCategory: 'soba',
    quantity: 1,
    unitPrice: 5000,
    cost: 4000,
    discount: 0,
    discountAmount: 0,
    subtotal: 5000,
    total: 5000,
    profit: 1000,
    payment: 'nakit',
    status: 'tamamlandi',
    items: [{ productId: 'p1', productName: 'Soba 80lik', quantity: 1, unitPrice: 5000, cost: 4000, total: 5000 }],
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
    ...partial,
  } as Sale;
}

function makeKasaEntry(partial: Partial<KasaEntry> & { id: string }): KasaEntry {
  return {
    type: 'gelir',
    category: 'diger_gelir',
    amount: 500,
    kasa: 'nakit',
    description: 'test',
    relatedId: '',
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
    deleted: false,
    ...partial,
  } as KasaEntry;
}

function makeTestDB(overrides: { aiActionLog?: AIActionLogEntry[]; sales?: Sale[]; kasa?: KasaEntry[] } = {}): DB {
  return makeDB({
    aiActionLog: overrides.aiActionLog ?? [],
    sales: overrides.sales ?? [],
    kasa: overrides.kasa ?? [],
  });
}

// ── parseUndoCommand ─────────────────────────────────────────────────────────

describe('VoiceUndoEngine / parseUndoCommand', () => {
  it('son satışı iptal et → sale', () => {
    const cmd = parseUndoCommand('son satışı iptal et');
    expect(cmd).not.toBeNull();
    expect(cmd?.target).toBe('sale');
  });

  it('son gideri geri al → kasa_gider', () => {
    const cmd = parseUndoCommand('son gideri geri al');
    expect(cmd?.target).toBe('kasa_gider');
  });

  it('son geliri geri al → kasa_gelir', () => {
    const cmd = parseUndoCommand('son geliri geri al');
    expect(cmd?.target).toBe('kasa_gelir');
  });

  it('son tahsilatı geri al → cari_tahsilat', () => {
    const cmd = parseUndoCommand('son tahsilatı geri al');
    expect(cmd?.target).toBe('cari_tahsilat');
  });

  it('son işlemi geri al → any', () => {
    const cmd = parseUndoCommand('son işlemi geri al');
    expect(cmd?.target).toBe('any');
  });

  it('geri al fiili yoksa null', () => {
    expect(parseUndoCommand('satış yap')).toBeNull();
    expect(parseUndoCommand('rapor göster')).toBeNull();
  });

  it("'son' yoksa null (belirli bir işlem değil)", () => {
    expect(parseUndoCommand('geri al')).toBeNull();
    expect(parseUndoCommand('iptal et')).toBeNull();
  });

  it('belirsiz hedef → unknown', () => {
    const cmd = parseUndoCommand('son şeyi geri al');
    expect(cmd?.target).toBe('unknown');
  });

  it('küçük/büyük harf duyarsız', () => {
    expect(parseUndoCommand('SON SATIŞI İPTAL ET')?.target).toBe('sale');
  });
});

// ── findLastUndoableAction ───────────────────────────────────────────────────

describe('VoiceUndoEngine / findLastUndoableAction', () => {
  it('en son applied undoable kaydı bulur', () => {
    const db = makeTestDB({
      aiActionLog: [
        makeLogEntry({ id: 'l1', createdAt: '2026-06-18T10:00:00.000Z', actionType: 'sale', affectedIds: ['s1'] }),
        makeLogEntry({ id: 'l2', createdAt: '2026-06-20T10:00:00.000Z', actionType: 'sale', affectedIds: ['s2'] }),
      ],
    });
    const entry = findLastUndoableAction(db);
    expect(entry?.id).toBe('l2');
  });

  it('filter sale ile sadece satışları', () => {
    const db = makeTestDB({
      aiActionLog: [
        makeLogEntry({
          id: 'l1',
          createdAt: '2026-06-20T10:00:00.000Z',
          actionType: 'kasa_gider',
          affectedIds: ['k1'],
        }),
        makeLogEntry({ id: 'l2', createdAt: '2026-06-19T10:00:00.000Z', actionType: 'sale', affectedIds: ['s1'] }),
      ],
    });
    const entry = findLastUndoableAction(db, 'sale');
    expect(entry?.id).toBe('l2');
    expect(entry?.actionType).toBe('sale');
  });

  it('blocked/failed kayıtları dahil etmez', () => {
    const db = makeTestDB({
      aiActionLog: [
        makeLogEntry({
          id: 'l1',
          createdAt: '2026-06-20T10:00:00.000Z',
          actionType: 'sale',
          status: 'blocked',
          affectedIds: ['s1'],
        }),
        makeLogEntry({
          id: 'l2',
          createdAt: '2026-06-19T10:00:00.000Z',
          actionType: 'sale',
          status: 'applied',
          affectedIds: ['s2'],
        }),
      ],
    });
    const entry = findLastUndoableAction(db);
    expect(entry?.id).toBe('l2');
  });

  it('boş log → null', () => {
    const db = makeTestDB();
    expect(findLastUndoableAction(db)).toBeNull();
  });

  it('undoable olmayan actionType yok sayılır', () => {
    const db = makeTestDB({
      aiActionLog: [
        makeLogEntry({ id: 'l1', createdAt: '2026-06-20T10:00:00.000Z', actionType: 'analyze', status: 'applied' }),
      ],
    });
    expect(findLastUndoableAction(db)).toBeNull();
  });

  it('any filter tüm undoable tipler', () => {
    const db = makeTestDB({
      aiActionLog: [
        makeLogEntry({
          id: 'l1',
          createdAt: '2026-06-20T10:00:00.000Z',
          actionType: 'kasa_gelir',
          affectedIds: ['k1'],
        }),
      ],
    });
    const entry = findLastUndoableAction(db, 'any');
    expect(entry?.id).toBe('l1');
  });
});

// ── buildUndoIntent ──────────────────────────────────────────────────────────

describe('VoiceUndoEngine / buildUndoIntent', () => {
  it('sale → sale_iptal Intent', () => {
    const db = makeTestDB({
      sales: [makeSale({ id: 's1', productName: 'Soba 80lik', total: 5000 })],
    });
    const logEntry = makeLogEntry({
      id: 'l1',
      createdAt: '2026-06-20T10:00:00.000Z',
      actionType: 'sale',
      affectedIds: ['s1'],
    });
    const result = buildUndoIntent(db, logEntry);
    expect(result.ok).toBe(true);
    expect(result.intent?.type).toBe('sale_iptal');
    expect((result.intent?.payload as { saleId: string }).saleId).toBe('s1');
    expect(result.targetDescription).toContain('Soba 80lik');
  });

  it('sale — affectedIds yoksa hata', () => {
    const db = makeTestDB();
    const logEntry = makeLogEntry({
      id: 'l1',
      createdAt: '2026-06-20T10:00:00.000Z',
      actionType: 'sale',
      affectedIds: [],
    });
    const result = buildUndoIntent(db, logEntry);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('ID');
  });

  it("sale — DB'de yoksa hata", () => {
    const db = makeTestDB();
    const logEntry = makeLogEntry({
      id: 'l1',
      createdAt: '2026-06-20T10:00:00.000Z',
      actionType: 'sale',
      affectedIds: ['yok'],
    });
    const result = buildUndoIntent(db, logEntry);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('bulunamadı');
  });

  it('sale — zaten iptal ise hata', () => {
    const db = makeTestDB({
      sales: [makeSale({ id: 's1', status: 'iptal' })],
    });
    const logEntry = makeLogEntry({
      id: 'l1',
      createdAt: '2026-06-20T10:00:00.000Z',
      actionType: 'sale',
      affectedIds: ['s1'],
    });
    const result = buildUndoIntent(db, logEntry);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('zaten');
  });

  it('kasa_gelir → kasa_gider (ters) Intent', () => {
    const db = makeTestDB({
      kasa: [makeKasaEntry({ id: 'k1', type: 'gelir', amount: 500, description: 'kira' })],
    });
    const logEntry = makeLogEntry({
      id: 'l1',
      createdAt: '2026-06-20T10:00:00.000Z',
      actionType: 'kasa_gelir',
      affectedIds: ['k1'],
    });
    const result = buildUndoIntent(db, logEntry);
    expect(result.ok).toBe(true);
    expect(result.intent?.type).toBe('kasa_gider');
    expect((result.intent?.payload as { amount: number }).amount).toBe(500);
  });

  it('kasa_gider → kasa_gelir (ters) Intent', () => {
    const db = makeTestDB({
      kasa: [makeKasaEntry({ id: 'k1', type: 'gider', amount: 200, description: 'fatura' })],
    });
    const logEntry = makeLogEntry({
      id: 'l1',
      createdAt: '2026-06-20T10:00:00.000Z',
      actionType: 'kasa_gider',
      affectedIds: ['k1'],
    });
    const result = buildUndoIntent(db, logEntry);
    expect(result.ok).toBe(true);
    expect(result.intent?.type).toBe('kasa_gelir');
  });

  it('cari_tahsilat → henüz desteklenmiyor', () => {
    const db = makeTestDB();
    const logEntry = makeLogEntry({
      id: 'l1',
      createdAt: '2026-06-20T10:00:00.000Z',
      actionType: 'cari_tahsilat',
      affectedIds: ['c1'],
    });
    const result = buildUndoIntent(db, logEntry);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('desteklenmiyor');
  });

  it('bilinmeyen actionType → hata', () => {
    const db = makeTestDB();
    const logEntry = makeLogEntry({ id: 'l1', createdAt: '2026-06-20T10:00:00.000Z', actionType: 'ozel_islem' });
    const result = buildUndoIntent(db, logEntry);
    expect(result.ok).toBe(false);
  });
});

// ── resolveUndo (tam pipeline) ───────────────────────────────────────────────

describe('VoiceUndoEngine / resolveUndo', () => {
  it('son satışı iptal et → sale_iptal Intent', () => {
    const db = makeTestDB({
      sales: [makeSale({ id: 's1', productName: 'Soba 80lik', total: 5000 })],
      aiActionLog: [
        makeLogEntry({ id: 'l1', createdAt: '2026-06-20T10:00:00.000Z', actionType: 'sale', affectedIds: ['s1'] }),
      ],
    });
    const result = resolveUndo('son satışı iptal et', db);
    expect(result.ok).toBe(true);
    expect(result.intent?.type).toBe('sale_iptal');
    expect(result.command?.target).toBe('sale');
    expect(result.logEntry?.id).toBe('l1');
  });

  it('geri al fiili yoksa hata', () => {
    const db = makeTestDB();
    const result = resolveUndo('rapor göster', db);
    expect(result.ok).toBe(false);
  });

  it('log boşsa hata', () => {
    const db = makeTestDB();
    const result = resolveUndo('son işlemi geri al', db);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('bulunamadı');
  });

  it('unknown hedef → kullanıcıya sor', () => {
    const db = makeTestDB();
    const result = resolveUndo('son şeyi geri al', db);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Hangi işlem');
  });

  it('any → en son işlemi bul (satış)', () => {
    const db = makeTestDB({
      sales: [makeSale({ id: 's1' })],
      aiActionLog: [
        makeLogEntry({ id: 'l1', createdAt: '2026-06-20T10:00:00.000Z', actionType: 'sale', affectedIds: ['s1'] }),
      ],
    });
    const result = resolveUndo('son işlemi geri al', db);
    expect(result.ok).toBe(true);
    expect(result.intent?.type).toBe('sale_iptal');
  });

  it('any → en son işlemi bul (kasa gider)', () => {
    const db = makeTestDB({
      kasa: [makeKasaEntry({ id: 'k1', type: 'gider', amount: 300 })],
      aiActionLog: [
        makeLogEntry({
          id: 'l1',
          createdAt: '2026-06-20T10:00:00.000Z',
          actionType: 'kasa_gider',
          affectedIds: ['k1'],
        }),
      ],
    });
    const result = resolveUndo('son işlemi geri al', db);
    expect(result.ok).toBe(true);
    expect(result.intent?.type).toBe('kasa_gelir');
  });

  it('sale filter ama logda sadece kasa var → null', () => {
    const db = makeTestDB({
      aiActionLog: [
        makeLogEntry({
          id: 'l1',
          createdAt: '2026-06-20T10:00:00.000Z',
          actionType: 'kasa_gider',
          affectedIds: ['k1'],
        }),
      ],
    });
    const result = resolveUndo('son satışı iptal et', db);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('bulunamadı');
  });
});
