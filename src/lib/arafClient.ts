// ============================================================
// arafClient.ts — ARAF Sunucu REST API istemcisi
// PARSPEL mobil/web uygulamasından ARAF'a bağlanır.
// Offline-first: ARAF sunucu kapalıysa sessizçe devre dışı kalır.
// ============================================================

import { logger } from '@/lib/logger';

// ARAF ayarları localStorage'da saklanır (kullanıcı Ayarlar'dan değiştirebilir)
const ANAHTAR_KEY = 'araf-api-key';
const ADRES_KEY = 'araf-server-url';

// Varsayılan yerel sunucu adresi — kullanıcı değiştirebilir
export const VARSAYILAN_ARAF_ADRESI = 'http://127.0.0.1:3131';

export interface ArafCevap {
  cevap: string;
  oturumId: string;
  model: string;
  kullanim?: {
    prompt_token?: number;
    completion_token?: number;
    total_token?: number;
  };
}

export interface ArafSaglik {
  durum: string;
  model: string;
  saglayicilar: { ad: string; model: string; musait: boolean; cooldown: boolean }[];
  hafiza: { tureGore: { tur: string; adet: number }[]; toplam: number };
  zaman: string;
}

// --- Ayar helpers ---
export function arafAdresiAl(): string {
  return localStorage.getItem(ADRES_KEY) ?? VARSAYILAN_ARAF_ADRESI;
}

export function arafAdresiKaydet(adres: string): void {
  localStorage.setItem(ADRES_KEY, adres);
}

export function arafAnahtariAl(): string {
  return localStorage.getItem(ANAHTAR_KEY) ?? '';
}

export function arafAnahtariKaydet(anahtar: string): void {
  localStorage.setItem(ANAHTAR_KEY, anahtar);
}

// --- Sunucu sağlık kontrolü (auth gerektirmez) ---
export async function arafSaglikKontrol(): Promise<ArafSaglik | null> {
  try {
    const adres = arafAdresiAl();
    const res = await fetch(`${adres}/saglik`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const veri = (await res.json()) as ArafSaglik;
    logger.info('arafClient', `Sağlık: ${veri.durum}, ${veri.hafiza.toplam} kayıt`);
    return veri;
  } catch (hata) {
    logger.warn('arafClient', `ARAF sunucu kapalı: ${(hata as Error).message}`);
    return null;
  }
}

// --- ARAF'a sor ---
export async function arafaSor(
  mesaj: string,
  baglam?: string,
  oturumId?: string,
): Promise<ArafCevap | null> {
  try {
    const adres = arafAdresiAl();
    const anahtar = arafAnahtariAl();
    if (!anahtar) {
      logger.warn('arafClient', 'API anahtarı tanımlı değil. Ayarlar\'dan ekleyin.');
      return null;
    }
    const res = await fetch(`${adres}/sor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-araf-key': anahtar,
      },
      body: JSON.stringify({ mesaj, baglam, oturumId }),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) {
      const hata = await res.text();
      throw new Error(`ARAF ${res.status}: ${hata}`);
    }
    return (await res.json()) as ArafCevap;
  } catch (hata) {
    logger.error('arafClient', `Soru hatası: ${(hata as Error).message}`);
    return null;
  }
}

// --- Kod inceleme ---
export async function arafIncele(
  kod: string,
  dil?: string,
  baglam?: string,
): Promise<ArafCevap | null> {
  try {
    const adres = arafAdresiAl();
    const anahtar = arafAnahtariAl();
    if (!anahtar) return null;
    const res = await fetch(`${adres}/incele`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-araf-key': anahtar,
      },
      body: JSON.stringify({ kod, dil, baglam }),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`ARAF ${res.status}`);
    return (await res.json()) as ArafCevap;
  } catch (hata) {
    logger.error('arafClient', `İnceleme hatası: ${(hata as Error).message}`);
    return null;
  }
}

// --- Karar verme ---
export async function arafKararVer(
  soru: string,
  secenekler?: string[],
  baglam?: string,
): Promise<ArafCevap | null> {
  try {
    const adres = arafAdresiAl();
    const anahtar = arafAnahtariAl();
    if (!anahtar) return null;
    const res = await fetch(`${adres}/karar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-araf-key': anahtar,
      },
      body: JSON.stringify({ soru, secenekler, baglam }),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`ARAF ${res.status}`);
    return (await res.json()) as ArafCevap;
  } catch (hata) {
    logger.error('arafClient', `Karar hatası: ${(hata as Error).message}`);
    return null;
  }
}

// --- Hafıza ekle (kullanıcı öğrenme) ---
export async function arafHafizaEkle(
  tur: 'ders' | 'karar' | 'kullanici_oz' | 'hata' | 'tercih' | 'proje_bilgi',
  deger: string,
  guven: 'kesin' | 'olası' | 'belirsiz' = 'olası',
): Promise<boolean> {
  try {
    const adres = arafAdresiAl();
    const anahtar = arafAnahtariAl();
    if (!anahtar) return false;
    const res = await fetch(`${adres}/hafiza`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-araf-key': anahtar,
      },
      body: JSON.stringify({ tur, deger, guven, kaynak: 'parspel-mobil' }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch (hata) {
    logger.error('arafClient', `Hafıza ekleme hatası: ${(hata as Error).message}`);
    return false;
  }
}

// --- Oturum mesajlarını getir (bir önceki konuşmaya devam) ---
export async function arafOturumMesajlari(oturumId: string): Promise<{ rol: string; icerik: string }[] | null> {
  try {
    const adres = arafAdresiAl();
    const anahtar = arafAnahtariAl();
    if (!anahtar) return null;
    const res = await fetch(`${adres}/oturum/${encodeURIComponent(oturumId)}`, {
      headers: { 'x-araf-key': anahtar },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (hata) {
    logger.error('arafClient', `Oturum hatası: ${(hata as Error).message}`);
    return null;
  }
}