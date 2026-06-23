import { useState } from 'react';
import { Card } from '@/pages/SettingsCard';
import { Button } from '@/components/ui/button';

interface BakimAyarlari {
  otomatikYedek: boolean;
  yedekAraligi: number;
  logTutma: boolean;
  logSaklamaGun: number;
  performansModu: 'normal' | 'hizli' | 'ekonomik';
  onbellekTemizle: boolean;
}

const STORAGE_KEY = 'soba_bakim_ayarlari';

function load(): BakimAyarlari {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { otomatikYedek: false, yedekAraligi: 60, logTutma: true, logSaklamaGun: 30, performansModu: 'normal', onbellekTemizle: false };
}

function save(v: BakimAyarlari) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* */ }
}

export function SettingsBakim({ showToast, showConfirm }: {
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
}) {
  const [cfg, setCfg] = useState<BakimAyarlari>(load);
  const [cleanStatus, setCleanStatus] = useState<string | null>(null);

  const update = (patch: Partial<BakimAyarlari>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    save(next);
    showToast('Bakım ayarları kaydedildi', 'success');
  };

  const cleanCache = () => {
    showConfirm('Önbellek Temizle', 'Tüm localStorage önbellek ve geçici veriler silinecek. Devam et?', () => {
      try {
        const keys = Object.keys(localStorage).filter(k =>
          k.startsWith('soba_') || k.startsWith('nexus_') || k === 'sobaYonetim_favoriteTabs');
        keys.forEach(k => localStorage.removeItem(k));
        setCleanStatus(`✅ ${keys.length} önbellek temizlendi`);
        showToast(`${keys.length} önbellek temizlendi`, 'success');
      } catch {
        setCleanStatus('❌ Temizleme hatası');
        showToast('Önbellek temizlenemedi', 'error');
      }
    });
  };

  const cleanLogs = () => {
    showConfirm('Logları Temizle', 'Tüm uygulama logları silinecek. Devam et?', () => {
      try {
        localStorage.removeItem('soba_logs');
        setCleanStatus('✅ Loglar temizlendi');
        showToast('Loglar temizlendi', 'success');
      } catch { /* */ }
    });
  };

  const exportSettings = () => {
    const settings: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('soba_') || key.startsWith('nexus_'))) {
        try { settings[key] = JSON.parse(localStorage.getItem(key) || '""'); } catch { settings[key] = localStorage.getItem(key); }
      }
    }
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `parspel-ayarlar-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Ayarlar dışa aktarıldı', 'success');
  };

  return (
    <div className="space-y-4">
      <Card title="⚡ Performans Ayarları">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Performans Modu</label>
            <div className="flex gap-2 mt-1">
              {([['normal', '⚖️ Normal'], ['hizli', '🚀 Hızlı'], ['ekonomik', '🔋 Ekonomik']] as const).map(([k, l]) => (
                <button key={k} onClick={() => update({ performansModu: k })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    cfg.performansModu === k ? 'bg-indigo-600 text-white shadow-lg' : 'bg-card border border-white/10 text-muted-foreground hover:text-foreground'
                  }`}>{l}</button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cfg.performansModu === 'normal' ? 'Tüm özellikler aktif' :
               cfg.performansModu === 'hizli' ? 'Animasyonlar azaltılır, daha hızlı yükleme' :
               'Düşük güç modu, arka plan işlemleri kısıtlanır'}
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
            <div>
              <div className="text-sm font-medium text-foreground">Log Tutma</div>
              <div className="text-xs text-muted-foreground">İşlem geçmişini kaydet</div>
            </div>
            <button onClick={() => update({ logTutma: !cfg.logTutma })}
              className={`relative w-12 h-6 rounded-full transition-colors ${cfg.logTutma ? 'bg-indigo-600' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.logTutma ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {cfg.logTutma && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
              <div>
                <div className="text-sm font-medium text-foreground">Log Saklama Süresi</div>
                <div className="text-xs text-muted-foreground">Eski logları otomatik temizle</div>
              </div>
              <select value={cfg.logSaklamaGun} onChange={(e) => update({ logSaklamaGun: parseInt(e.target.value) })}
                className="px-3 py-1.5 bg-card border border-white/10 rounded-lg text-sm text-foreground focus:outline-none">
                <option value={7}>7 gün</option>
                <option value={14}>14 gün</option>
                <option value={30}>30 gün</option>
                <option value={60}>60 gün</option>
                <option value={90}>90 gün</option>
                <option value={365}>1 yıl</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
            <div>
              <div className="text-sm font-medium text-foreground">Otomatik Yedek</div>
              <div className="text-xs text-muted-foreground">Her satışta otomatik yedekle</div>
            </div>
            <button onClick={() => update({ otomatikYedek: !cfg.otomatikYedek })}
              className={`relative w-12 h-6 rounded-full transition-colors ${cfg.otomatikYedek ? 'bg-indigo-600' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.otomatikYedek ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </Card>

      <Card title="🧹 Bakım Araçları">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
            <div>
              <div className="text-sm font-medium text-foreground">Önbellek Temizle</div>
              <div className="text-xs text-muted-foreground">Geçici verileri ve önbelleği temizle</div>
            </div>
            <Button onClick={cleanCache} className="px-4 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg text-sm hover:bg-yellow-500/20">
              🧹 Temizle
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
            <div>
              <div className="text-sm font-medium text-foreground">Logları Temizle</div>
              <div className="text-xs text-muted-foreground">Tüm uygulama loglarını sil</div>
            </div>
            <Button onClick={cleanLogs} className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20">
              🗑️ Sil
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
            <div>
              <div className="text-sm font-medium text-foreground">Ayarları Dışa Aktar</div>
              <div className="text-xs text-muted-foreground">Tüm ayarları JSON olarak indir</div>
            </div>
            <Button onClick={exportSettings} className="px-4 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm hover:bg-green-500/20">
              📥 İndir
            </Button>
          </div>

          {cleanStatus && <div className="text-sm text-muted-foreground p-2 rounded-lg bg-white/5">{cleanStatus}</div>}
        </div>
      </Card>
    </div>
  );
}
