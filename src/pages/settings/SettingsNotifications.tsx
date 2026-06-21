import { useState } from 'react';
import { Card } from '@/pages/SettingsCard';

interface BildirimAyarlari {
  bildirimSesi: boolean;
  masaustuBildirim: boolean;
  satisBildirim: boolean;
  stokUyari: boolean;
  alacakUyari: boolean;
  gunlukOzet: boolean;
  sesliUyari: boolean;
}

const STORAGE_KEY = 'soba_bildirim_ayarlari';

function load(): BildirimAyarlari {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { bildirimSesi: true, masaustuBildirim: true, satisBildirim: true, stokUyari: true, alacakUyari: true, gunlukOzet: false, sesliUyari: false };
}

function save(v: BildirimAyarlari) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* */ }
}

export function SettingsNotifications({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [cfg, setCfg] = useState<BildirimAyarlari>(load);

  const update = (patch: Partial<BildirimAyarlari>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    save(next);
    showToast('Bildirim ayarları kaydedildi', 'success');
  };

  const toggle = (key: keyof BildirimAyarlari) => update({ [key]: !cfg[key] });

  const items: { key: keyof BildirimAyarlari; label: string; desc: string }[] = [
    { key: 'bildirimSesi', label: 'Bildirim Sesi', desc: 'İşlemlerde sesli geri bildirim' },
    { key: 'masaustuBildirim', label: 'Masaüstü Bildirim', desc: 'Tarayıcı bildirimleri göster' },
    { key: 'satisBildirim', label: 'Satış Bildirimi', desc: 'Her satışta bildirim göster' },
    { key: 'stokUyari', label: 'Stok Uyarısı', desc: 'Stok kritik seviyede uyar' },
    { key: 'alacakUyari', label: 'Alacak Uyarısı', desc: 'Gecikmiş alacakları hatırlat' },
    { key: 'gunlukOzet', label: 'Günlük Özet', desc: 'Gün sonu özet bildirimi' },
    { key: 'sesliUyari', label: 'Sesli Uyarı', desc: 'Kritik durumlarda sesli ikaz' },
  ];

  return (
    <Card title="🔔 Bildirim Ayarları">
      <div className="space-y-1">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div>
              <div className="text-sm font-medium text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <button onClick={() => toggle(key)}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${cfg[key] ? 'bg-indigo-600' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg[key] ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
        ⚠️ Masaüstü bildirimler için tarayıcı izni gereklidir.
      </div>
    </Card>
  );
}
