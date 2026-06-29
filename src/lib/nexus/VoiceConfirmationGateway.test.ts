import { describe, it, expect, beforeEach } from 'vitest';
import type { AgentRequest } from '@/agents/types';
import {
  requiresConfirmation,
  generateReadBack,
  parseConfirmation,
  VoiceConfirmationGateway,
} from './VoiceConfirmationGateway';

// ── requiresConfirmation ─────────────────────────────────────────────────────

describe('VoiceConfirmationGateway / requiresConfirmation', () => {
  it('write aksiyonlar onay gerektirir', () => {
    expect(requiresConfirmation('sale')).toBe(true);
    expect(requiresConfirmation('satis')).toBe(true);
    expect(requiresConfirmation('kasa_gelir')).toBe(true);
    expect(requiresConfirmation('kasa_gider')).toBe(true);
    expect(requiresConfirmation('cari_tahsilat')).toBe(true);
    expect(requiresConfirmation('stok_guncelle')).toBe(true);
    expect(requiresConfirmation('urun_ekle')).toBe(true);
    expect(requiresConfirmation('cari_ekle')).toBe(true);
    expect(requiresConfirmation('sale_iptal')).toBe(true);
    expect(requiresConfirmation('sale_iade')).toBe(true);
    expect(requiresConfirmation('sale_fiyat_duzelt')).toBe(true);
  });

  it('read-only/bilinmeyen aksiyonlar onay gerektirmez', () => {
    expect(requiresConfirmation('analyze')).toBe(false);
    expect(requiresConfirmation('analiz')).toBe(false);
    expect(requiresConfirmation('read')).toBe(false);
    expect(requiresConfirmation('')).toBe(false);
    expect(requiresConfirmation('bilinmeyen')).toBe(false);
  });
});

// ── generateReadBack ─────────────────────────────────────────────────────────

describe('VoiceConfirmationGateway / generateReadBack', () => {
  it('satış: cari + ürün + indirim + toplam + ödeme', () => {
    const req: AgentRequest = {
      action: 'sale',
      payload: {
        cariName: 'Ali Yılmaz',
        items: [{ productName: 'Soba 80lik', quantity: 1, unitPrice: 5000 }],
        discount: 10,
        total: 4500,
        payment: 'nakit',
      },
    };
    const rb = generateReadBack(req);
    expect(rb).toContain('Ali Yılmaz');
    expect(rb).toContain('Soba 80lik');
    expect(rb).toContain('yüzde 10');
    expect(rb).toContain('4.500 TL');
    expect(rb).toContain('nakit');
    expect(rb).toContain('Onaylıyor musunuz');
  });

  it('satış: cari olmadan da çalışır', () => {
    const req: AgentRequest = {
      action: 'satis',
      payload: {
        items: [{ productName: 'Soba 60lık', quantity: 2, unitPrice: 3000 }],
        total: 6000,
        payment: 'kart',
      },
    };
    const rb = generateReadBack(req);
    expect(rb).toContain('2 adet');
    expect(rb).toContain('Soba 60lık');
    expect(rb).toContain('6.000 TL');
    expect(rb).toContain('kart');
  });

  it('kasa gelir: tutar + kasa + açıklama', () => {
    const req: AgentRequest = {
      action: 'kasa_gelir',
      payload: { amount: 500, kasa: 'nakit', category: 'diger_gelir', description: 'kira' },
    };
    const rb = generateReadBack(req);
    expect(rb).toContain('500 TL');
    expect(rb).toContain('nakit');
    expect(rb).toContain('kira');
  });

  it('kasa gider: tutar + kasa', () => {
    const req: AgentRequest = {
      action: 'kasa_gider',
      payload: { amount: 150, kasa: 'nakit', description: 'fatura' },
    };
    const rb = generateReadBack(req);
    expect(rb).toContain('150 TL');
    expect(rb).toContain('gider');
    expect(rb).toContain('fatura');
  });

  it('cari tahsilat: cari + tutar + kasa', () => {
    const req: AgentRequest = {
      action: 'cari_tahsilat',
      payload: { cariName: 'Ahmet Bey', amount: 2000, kasa: 'nakit' },
    };
    const rb = generateReadBack(req);
    expect(rb).toContain('Ahmet Bey');
    expect(rb).toContain('2.000 TL');
    expect(rb).toContain('tahsilat');
  });

  it('stok güncelleme: ürün + yeni stok', () => {
    const req: AgentRequest = {
      action: 'stok_guncelle',
      payload: { productName: 'Soba 80lik', stock: 25, note: 'yeni sevkiyat' },
    };
    const rb = generateReadBack(req);
    expect(rb).toContain('Soba 80lik');
    expect(rb).toContain('25');
    expect(rb).toContain('yeni sevkiyat');
  });

  it('ürün ekleme: ad + fiyat + stok', () => {
    const req: AgentRequest = {
      action: 'urun_ekle',
      payload: { name: 'Soba 100lük', price: 7500, stock: 10, category: 'soba' },
    };
    const rb = generateReadBack(req);
    expect(rb).toContain('Soba 100lük');
    expect(rb).toContain('7.500 TL');
    expect(rb).toContain('10 adet');
  });

  it('satış iptal: saleId', () => {
    const req: AgentRequest = { action: 'sale_iptal', payload: { saleId: 's12345' } };
    const rb = generateReadBack(req);
    expect(rb).toContain('s12345');
    expect(rb).toContain('iptal');
  });

  it('bilinmeyen aksiyon: generic fallback', () => {
    const req: AgentRequest = { action: 'ozel_islem', payload: {} };
    const rb = generateReadBack(req);
    expect(rb).toContain('ozel_islem');
    expect(rb).toContain('Onaylıyor musunuz');
  });

  it("tüm read-back'ler 'Onaylıyor musunuz?' ile bitiyor", () => {
    const cases: AgentRequest[] = [
      { action: 'sale', payload: {} },
      { action: 'kasa_gelir', payload: { amount: 100 } },
      { action: 'cari_ekle', payload: { name: 'X' } },
      { action: 'stok_guncelle', payload: { productName: 'Y', stock: 1 } },
    ];
    for (const c of cases) {
      expect(generateReadBack(c)).toContain('Onaylıyor musunuz');
    }
  });
});

// ── parseConfirmation ────────────────────────────────────────────────────────

describe('VoiceConfirmationGateway / parseConfirmation', () => {
  it('onay kelimeleri confirm döner', () => {
    expect(parseConfirmation('evet')).toBe('confirm');
    expect(parseConfirmation('onay')).toBe('confirm');
    expect(parseConfirmation('onayla')).toBe('confirm');
    expect(parseConfirmation('tamam')).toBe('confirm');
    expect(parseConfirmation('olur')).toBe('confirm');
    expect(parseConfirmation('peki')).toBe('confirm');
    expect(parseConfirmation('evet onaylıyorum')).toBe('confirm');
    expect(parseConfirmation('Evet')).toBe('confirm');
    expect(parseConfirmation('EVET')).toBe('confirm');
  });

  it('red kelimeleri reject döner', () => {
    expect(parseConfirmation('hayır')).toBe('reject');
    expect(parseConfirmation('hayir')).toBe('reject');
    expect(parseConfirmation('iptal')).toBe('reject');
    expect(parseConfirmation('vazgeç')).toBe('reject');
    expect(parseConfirmation('vazgec')).toBe('reject');
    expect(parseConfirmation('olmasın')).toBe('reject');
    expect(parseConfirmation('geri al')).toBe('reject');
  });

  it('boş/belirsiz yanıt unclear döner', () => {
    expect(parseConfirmation('')).toBe('unclear');
    expect(parseConfirmation('   ')).toBe('unclear');
    expect(parseConfirmation('belki')).toBe('unclear');
    expect(parseConfirmation('bir düşüneyim')).toBe('unclear');
  });

  it('STT hatalarına toleranslı (Türkçe karakter normalize)', () => {
    // STT bazen "hayır" yerine "hayir" dönebilir
    expect(parseConfirmation('hayir iptal')).toBe('reject');
    // "onay" yerine "onay" doğru dönmeli
    expect(parseConfirmation('onay')).toBe('confirm');
  });

  it('çelişkili ifadede güvenlik tarafı kazanır (red öncelikli)', () => {
    // "hayır onaylıyorum" — çelişkili, güvenlik için reject
    expect(parseConfirmation('hayır onaylıyorum')).toBe('reject');
    expect(parseConfirmation('hayir evet')).toBe('reject');
  });
});

// ── VoiceConfirmationGateway state machine ───────────────────────────────────

describe('VoiceConfirmationGateway / state machine', () => {
  let gateway: VoiceConfirmationGateway;

  beforeEach(() => {
    // Her test için fresh instance (private constructor ama getInstance cached)
    // reset() ile state temizle
    gateway = VoiceConfirmationGateway.getInstance();
    gateway.reset();
  });

  it('initial state idle', () => {
    expect(gateway.getState().state).toBe('idle');
    expect(gateway.getState().pendingAction).toBeNull();
  });

  it('requestConfirmation pending state başlatır', async () => {
    const req: AgentRequest = { action: 'kasa_gider', payload: { amount: 100 } };
    const promise = gateway.requestConfirmation(req);
    expect(gateway.getState().state).toBe('pending');
    expect(gateway.getState().pendingAction).toBe('kasa_gider');
    expect(gateway.getPendingReadBack()).toContain('100 TL');

    // Temizle (bekleyen promise'ı resolve et)
    gateway.cancel('test');
    await promise;
  });

  it('onay (confirm) confirmed=true döner', async () => {
    const req: AgentRequest = { action: 'sale', payload: { total: 500 } };
    const promise = gateway.requestConfirmation(req);

    const resolved = gateway.submitResponse('evet');
    expect(resolved).toBe(true);

    const result = await promise;
    expect(result.confirmed).toBe(true);
    expect(result.request).toBe(req);
    expect(result.responseText).toBe('evet');
    expect(gateway.getState().state).toBe('idle');
  });

  it('red (reject) confirmed=false döner', async () => {
    const req: AgentRequest = { action: 'kasa_gelir', payload: { amount: 200 } };
    const promise = gateway.requestConfirmation(req);

    gateway.submitResponse('hayır');
    const result = await promise;
    expect(result.confirmed).toBe(false);
    expect(result.verdict).toBe('reject');
  });

  it('belirsiz (unclear) pending kalır, false döner', async () => {
    const req: AgentRequest = { action: 'sale', payload: {} };
    const promise = gateway.requestConfirmation(req);

    const handled = gateway.submitResponse('belki');
    expect(handled).toBe(false);
    expect(gateway.getState().state).toBe('pending'); // hala pending

    // Sonra onayla
    gateway.submitResponse('tamam');
    const result = await promise;
    expect(result.confirmed).toBe(true);
  });

  it('cancel confirmed=false + cancelled=true döner', async () => {
    const req: AgentRequest = { action: 'sale', payload: {} };
    const promise = gateway.requestConfirmation(req);

    gateway.cancel('kullanıcı çıktı');
    const result = await promise;
    expect(result.confirmed).toBe(false);
    expect(result.cancelled).toBe(true);
    expect(result.reason).toBe('kullanıcı çıktı');
  });

  it('zaman aşımı confirmed=false + cancelled=true döner', async () => {
    const req: AgentRequest = { action: 'sale', payload: {} };
    const promise = gateway.requestConfirmation(req, { timeoutMs: 50 });

    // zaman aşımını bekle
    const result = await promise;
    expect(result.confirmed).toBe(false);
    expect(result.cancelled).toBe(true);
    expect(result.reason).toContain('zaman aşımı');
    expect(gateway.getState().state).toBe('idle');
  }, 5000);

  it('üst üste istek eskini iptal eder', async () => {
    const req1: AgentRequest = { action: 'kasa_gelir', payload: { amount: 100 } };
    const req2: AgentRequest = { action: 'kasa_gider', payload: { amount: 200 } };

    const promise1 = gateway.requestConfirmation(req1);
    const promise2 = gateway.requestConfirmation(req2);

    // İlk istek otomatik iptal edilmeli
    const result1 = await promise1;
    expect(result1.confirmed).toBe(false);
    expect(result1.cancelled).toBe(true);

    // İkinci hala pending
    expect(gateway.getState().pendingAction).toBe('kasa_gider');

    gateway.cancel('test cleanup');
    await promise2;
  });

  it('submitResponse pending yoksa false döner', () => {
    gateway.reset();
    expect(gateway.submitResponse('evet')).toBe(false);
  });

  it('getPendingReadBack pending yoksa null döner', () => {
    gateway.reset();
    expect(gateway.getPendingReadBack()).toBeNull();
  });
});
