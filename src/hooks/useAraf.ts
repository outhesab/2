// ============================================================
// useAraf.ts — ARAF Sunucu React hook'u
// PARSPEL içinde ARAF ile konuşmak için kullanılır.
// Offline-first: sunucu kapalıysa null döner, UI'ı bozmaz.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  arafaSor as arafaSorApi,
  arafSaglikKontrol,
  arafAdresiAl,
  arafAdresiKaydet,
  arafAnahtariAl,
  arafAnahtariKaydet,
  type ArafCevap,
  type ArafSaglik,
  VARSAYILAN_ARAF_ADRESI,
} from '@/lib/arafClient';

export interface UseArafState {
  yukleniyor: boolean;
  cevap: ArafCevap | null;
  hata: string | null;
  sunucuDurumu: ArafSaglik | null; // null = kapalı/bilinmiyor
}

export interface UseArafDeger {
  durum: UseArafState;
  sor: (mesaj: string, baglam?: string) => Promise<ArafCevap | null>;
  yenidenKontrol: () => Promise<void>;
  // ayar helpers
  adres: string;
  anahtar: string;
  ayarKaydet: (adres: string, anahtar: string) => void;
}

export function useAraf(): UseArafDeger {
  const [durum, setDurum] = useState<UseArafState>({
    yukleniyor: false,
    cevap: null,
    hata: null,
    sunucuDurumu: null,
  });
  const [adres, setAdres] = useState(arafAdresiAl());
  const [anahtar, setAnahtar] = useState(arafAnahtariAl());

  // Sunucu sağlık kontrolü
  const yenidenKontrol = useCallback(async () => {
    const sonuc = await arafSaglikKontrol();
    setDurum((s) => ({ ...s, sunucuDurumu: sonuc }));
  }, []);

  // Bileşen monte olunca sunucu kontrolü yap
  useEffect(() => {
    void yenidenKontrol();
  }, [yenidenKontrol]);

  // ARAF'a sor
  const sor = useCallback(async (mesaj: string, baglam?: string) => {
    setDurum((s) => ({ ...s, yukleniyor: true, hata: null }));
    try {
      const cevap = await arafaSorApi(mesaj, baglam);
      setDurum((s) => ({ ...s, yukleniyor: false, cevap, hata: cevap ? null : 'Sunucu kapalı' }));
      return cevap;
    } catch (hata) {
      const msj = (hata as Error).message;
      setDurum((s) => ({ ...s, yukleniyor: false, hata: msj }));
      return null;
    }
  }, []);

  // Ayarları kaydet
  const ayarKaydet = useCallback((yeniAdres: string, yeniAnahtar: string) => {
    if (yeniAdres) {
      arafAdresiKaydet(yeniAdres);
      setAdres(yeniAdres);
    }
    arafAnahtariKaydet(yeniAnahtar);
    setAnahtar(yeniAnahtar);
    // Sunucuyu yeniden kontrol et
    void yenidenKontrol();
  }, [yenidenKontrol]);

  return {
    durum,
    sor,
    yenidenKontrol,
    adres,
    anahtar,
    ayarKaydet,
  };
}

// --- Dışa aktarım ---
export { VARSAYILAN_ARAF_ADRESI };