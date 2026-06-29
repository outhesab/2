import { useState } from 'react';
import { Card } from '@/pages/SettingsCard';
import { logger } from '@/lib/logger';

interface VergiAyarlari {
  kdvOrani: number;
  paraBirimi: 'TRY' | 'USD' | 'EUR';
  varsayilanOdeme: 'nakit' | 'kart' | 'havale';
  yuvarlama: boolean;
}

const STORAGE_KEY = 'soba_vergi_ayarlari';

function loadVergi(): VergiAyarlari {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    logger.warn('settings', 'Vergi ayarlari yuklenemedi');
  }
  return { kdvOrani: 20, paraBirimi: 'TRY', varsayilanOdeme: 'nakit', yuvarlama: true };
}

function saveVergi(v: VergiAyarlari) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* */
  }
}

export function SettingsVergi({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [cfg, setCfg] = useState<VergiAyarlari>(loadVergi);

  const update = (patch: Partial<VergiAyarlari>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    saveVergi(next);
    showToast('Vergi ayarları kaydedildi', 'success');
  };

  return (
    <div className="space-y-4">
      <Card title="💰 KDV & Vergi Ayarları">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Varsayılan KDV Oranı (%)</label>
            <div className="flex gap-2 mt-1">
              {[0, 1, 8, 10, 18, 20].map((o) => (
                <button
                  key={o}
                  onClick={() => update({ kdvOrani: o })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    cfg.kdvOrani === o
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-card border border-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {o}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Para Birimi</label>
            <div className="flex gap-2 mt-1">
              {(
                [
                  ['TRY', '₺'],
                  ['USD', '$'],
                  ['EUR', '€'],
                ] as const
              ).map(([k, s]) => (
                <button
                  key={k}
                  onClick={() => update({ paraBirimi: k as 'TRY' | 'USD' | 'EUR' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    cfg.paraBirimi === k
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-card border border-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s} {k}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Varsayılan Ödeme Türü</label>
            <div className="flex gap-2 mt-1">
              {(
                [
                  ['nakit', '💵 Nakit'],
                  ['kart', '💳 Kart'],
                  ['havale', '🏦 Havale/EFT'],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => update({ varsayilanOdeme: k as 'nakit' | 'kart' | 'havale' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    cfg.varsayilanOdeme === k
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-card border border-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
            <div>
              <div className="text-sm font-medium text-foreground">Tutar Yuvarlama</div>
              <div className="text-xs text-muted-foreground">KDV hesaplamalarında yuvarlama yap</div>
            </div>
            <button
              onClick={() => update({ yuvarlama: !cfg.yuvarlama })}
              className={`relative w-12 h-6 rounded-full transition-colors ${cfg.yuvarlama ? 'bg-indigo-600' : 'bg-gray-600'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.yuvarlama ? 'left-6' : 'left-0.5'}`}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card title="📊 KDV Raporu">
        <p className="text-muted-foreground text-sm mb-3">Mevcut KDV oranlarına göre satış/alış raporu</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[0, 1, 8, 18].map((o) => (
            <div key={o} className="bg-card rounded-xl p-3 text-center border border-white/5">
              <div className="text-lg font-bold text-foreground">%{o}</div>
              <div className="text-xs text-muted-foreground">KDV Oranı</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
