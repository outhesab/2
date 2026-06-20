/**
 * voice-sales-simulation.test.ts — Sesli Satış Uçtan Uca Simülasyonu
 * 
 * Bu test, gerçek bir kullanıcının sesli komut vermesini simüle eder.
 * STT (Speech-to-Text) aşamasını atlayıp doğrudan 'VoiceCommand' nesnesiyle
 * tüm pipeline'ı (IntentBuilder -> Executor -> Domain -> DB) test eder.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeVoiceSale, executeConfirmedSale } from '@/features/voice-sales/executor/voiceSaleExecutor';
import { makeDefaultDB } from '@/lib/db/storage';
import type { VoiceCommand } from '@/features/voice-sales/types';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('🎙️ Sesli Satış Simülasyonu', () => {
  beforeEach(() => {
    localStorage.clear();
    const db = makeDefaultDB();
    // Test için bir ürün ekleyelim
    db.products.push({
      id: 'p1',
      name: 'Soba 80lik',
      category: 'soba',
      cost: 5000,
      price: 10000,
      stock: 10,
      minStock: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem('sobaYonetim', JSON.stringify(db));
  });

  it('Scenario 1: Basit Satış (Soba 1 adet, nakit) ✅', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      confidence: 0.95, // Auto-confirm eşiğinin üstünde
      items: [
        { productQuery: '80lik soba', quantity: 1 }
      ],
      payment: 'nakit',
      rawText: '80lik soba 1 adet nakit',
    };

    const result = await executeVoiceSale(command);

    expect(result.success).toBe(true);
    expect(result.sale?.itemCount).toBe(1);
    expect(result.sale?.total).toBe(10000);

    // DB kontrolü
    const db = JSON.parse(localStorage.getItem('sobaYonetim') || '{}') as ReturnType<typeof makeDefaultDB>;
    const product = db.products.find((p) => p.id === 'p1');
    expect(product?.stock).toBe(9);
  });

  it('Scenario 2: İndirimli ve Banka ile Satış ✅', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      confidence: 0.95,
      items: [
        { productQuery: '80lik soba', quantity: 2 }
      ],
      payment: 'kart',
      rawText: '80lik soba 2 adet kart ile %10 indirimli',
      options: {
        discount: 10, // %10 indirim
      },
    };

    const result = await executeVoiceSale(command);

    expect(result.success).toBe(true);
    // 2 * 10000 * 0.9 = 18000
    expect(result.sale?.total).toBe(18000);

    const db = JSON.parse(localStorage.getItem('sobaYonetim') || '{}') as ReturnType<typeof makeDefaultDB>;
    const product = db.products.find((p) => p.id === 'p1');
    expect(product?.stock).toBe(8);
  });

  it('Scenario 3: Geçersiz Ürün (Hata Yönetimi) ❌', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      confidence: 0.95,
      items: [
        { productQuery: 'Uçan Halı', quantity: 1 }
      ],
      payment: 'nakit',
      rawText: 'Uçan Halı 1 adet nakit',
    };

    const result = await executeVoiceSale(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('ürünü bulunamadı');
  });

  it('Scenario 4: Stok Aşımı (RuleEngine Engellemesi) ❌', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      confidence: 0.95,
      items: [
        { productQuery: '80lik soba', quantity: 100 }
      ],
      payment: 'nakit',
      rawText: '80lik soba 100 adet nakit',
    };

    const result = await executeVoiceSale(command);

    expect(result.success).toBe(false);
    // RuleEngine'den gelen hata mesajını yakalamalı
    expect(result.error).toBeDefined();
  });

  it('Scenario 5: Düşük Güven (Onay Mekanizması) ⚠️', async () => {
    const command: VoiceCommand = {
      action: 'satis',
      confidence: 0.6, // Threshold altı, onay istemeli
      items: [
        { productQuery: 'Soba', quantity: 1 }
      ],
      payment: 'nakit',
      rawText: 'Soba 1 adet nakit',
    };

    const result = await executeVoiceSale(command);

    expect(result.success).toBe(false);
    expect(result.needsConfirmation).toBe(true);
    expect(result.confirmationMessage).toBeDefined();
    expect(result.confirmationMessage).toContain('Satış onayı');

    // Onaylama simülasyonu
    const confirmedResult = await executeConfirmedSale(command);
    expect(confirmedResult.success).toBe(true);
  });
});
