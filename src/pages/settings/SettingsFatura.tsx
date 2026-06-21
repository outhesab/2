import { useState } from 'react';
import { Card } from '@/pages/SettingsCard';

interface FaturaAyarlari {
  seriOnEki: string;
  baslangicNo: number;
  eFatura: boolean;
  otomatikNo: boolean;
  kdvDahil: boolean;
  varsayilanNot: string;
}

const STORAGE_KEY = 'soba_fatura_ayarlari';

function load(): FaturaAyarlari {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { seriOnEki: 'A', baslangicNo: 1, eFatura: false, otomatikNo: true, kdvDahil: true, varsayilanNot: '' };
}

function save(v: FaturaAyarlari) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* */ }
}

export function SettingsFatura({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [cfg, setCfg] = useState<FaturaAyarlari>(load);

  const update = (patch: Partial<FaturaAyarlari>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    save(next);
    showToast('Fatura ayarları kaydedildi', 'success');
  };

  return (
    <div className="space-y-4">
      <Card title="🧾 Fatura Ayarları">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Seri Ön Eki</label>
              <input value={cfg.seriOnEki} onChange={(e) => update({ seriOnEki: e.target.value.slice(0, 3).toUpperCase() })}
                className="w-full mt-1 px-3 py-2 bg-card border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <p className="text-xs text-muted-foreground mt-1">Örn: A, B, FATURA</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Başlangıç Numarası</label>
              <input type="number" min={1} value={cfg.baslangicNo} onChange={(e) => update({ baslangicNo: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full mt-1 px-3 py-2 bg-card border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
            <div>
              <div className="text-sm font-medium text-foreground">Otomatik Numara</div>
              <div className="text-xs text-muted-foreground">Fatura numarasını otomatik ata</div>
            </div>
            <button onClick={() => update({ otomatikNo: !cfg.otomatikNo })}
              className={`relative w-12 h-6 rounded-full transition-colors ${cfg.otomatikNo ? 'bg-indigo-600' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.otomatikNo ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
            <div>
              <div className="text-sm font-medium text-foreground">KDV Dahil Gösterim</div>
              <div className="text-xs text-muted-foreground">Fiyatları KDV dahil göster</div>
            </div>
            <button onClick={() => update({ kdvDahil: !cfg.kdvDahil })}
              className={`relative w-12 h-6 rounded-full transition-colors ${cfg.kdvDahil ? 'bg-indigo-600' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.kdvDahil ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
            <div>
              <div className="text-sm font-medium text-foreground">e-Fatura</div>
              <div className="text-xs text-muted-foreground">e-Fatura entegrasyonu (hazırlık aşamasında)</div>
            </div>
            <button onClick={() => update({ eFatura: !cfg.eFatura })}
              className={`relative w-12 h-6 rounded-full transition-colors ${cfg.eFatura ? 'bg-indigo-600' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.eFatura ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Varsayılan Fatura Notu</label>
            <textarea value={cfg.varsayilanNot} onChange={(e) => update({ varsayilanNot: e.target.value })}
              rows={2} maxLength={500}
              className="w-full mt-1 px-3 py-2 bg-card border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
          </div>
        </div>
      </Card>

      <Card title="📄 Fatura Önizleme">
        <div className="p-4 rounded-lg bg-card border border-white/5 font-mono text-xs text-muted-foreground">
          <div className="text-foreground font-semibold text-sm mb-2">FATURA</div>
          <div>Seri: {cfg.seriOnEki || 'A'}-{String(cfg.baslangicNo).padStart(6, '0')}</div>
          <div>Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
          <div className="mt-2">---</div>
          <div>Mal/Hizmet Bedeli : 1.000,00 ₺</div>
          <div>KDV (%20)        :   200,00 ₺</div>
          <div className="border-t border-white/10 mt-1 pt-1 font-bold text-foreground">Toplam           : 1.200,00 ₺</div>
          {cfg.varsayilanNot && <div className="mt-2 text-amber-400">Not: {cfg.varsayilanNot}</div>}
        </div>
      </Card>
    </div>
  );
}
