import { useState } from 'react';
import { DEFAULT_CONN, saveConnConfig, testFirebase, testSupabase, type ConnConfig } from '@/lib/connConfig';
import { logger } from '@/lib/logger';
import { Card } from './SettingsCard';

export function BaglantiAyarlari({
  cfg,
  onChange,
  showToast,
}: {
  cfg: ConnConfig;
  onChange: (c: ConnConfig) => void;
  showToast: (m: string, t?: string) => void;
}) {
  const [fbTest, setFbTest] = useState<{ ok: boolean; msg: string } | null>(null);
  const [fbTesting, setFbTesting] = useState(false);
  const [sbTest, setSbTest] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sbTesting, setSbTesting] = useState(false);

  const setFb = (patch: Partial<typeof cfg.firebase>) => onChange({ ...cfg, firebase: { ...cfg.firebase, ...patch } });
  const setSb = (patch: Partial<typeof cfg.supabase>) => onChange({ ...cfg, supabase: { ...cfg.supabase, ...patch } });

  const handleFbTest = async () => {
    setFbTesting(true);
    setFbTest(null);
    const r = await testFirebase(cfg.firebase);
    setFbTest(r);
    setFbTesting(false);
    showToast(r.ok ? 'Firebase bağlantısı başarılı!' : 'Firebase bağlantısı başarısız!', r.ok ? 'success' : 'error');
  };

  const handleSbTest = async () => {
    setSbTesting(true);
    setSbTest(null);
    const r = await testSupabase(cfg.supabase);
    setSbTest(r);
    setSbTesting(false);
    showToast(r.ok ? 'Supabase bağlantısı başarılı!' : 'Supabase bağlantısı başarısız!', r.ok ? 'success' : 'error');
  };

  const handleSave = () => {
    saveConnConfig(cfg);
    showToast('Bağlantı ayarları kaydedildi! Sayfa yenilendiğinde aktif olur.', 'success');
  };

  const handleReset = () => {
    onChange(DEFAULT_CONN);
    saveConnConfig(DEFAULT_CONN);
    showToast('Varsayılan bağlantı ayarları geri yüklendi!', 'success');
  };

  return (
    <div className="grid gap-4">
      {/* Aktif Sağlayıcı */}
      <Card title="🔌 Aktif Senkronizasyon Sağlayıcısı">
        <p className="text-muted-foreground text-sm mb-3.5 leading-relaxed">
          Verileriniz hangi bulut servisiyle senkronize edilsin? Sadece bir sağlayıcı aktif olabilir.
        </p>
        <div className="flex items-center gap-2.5">
          {(
            [
              {
                id: 'firebase',
                label: '🔥 Firebase',
                desc: 'Google Firestore',
              },
              {
                id: 'supabase',
                label: '⚡ Supabase',
                desc: 'PostgreSQL tabanlı',
              },
              { id: 'none', label: '🚫 Yok', desc: 'Sadece yerel' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ ...cfg, activeProvider: p.id })}
              className={`flex-1 py-3.5 px-2.5 rounded-xl cursor-pointer text-center transition-all border-2 ${
                cfg.activeProvider === p.id ? 'bg-orange-500/10 border-orange-500/50' : 'bg-black/25 border-white/5'
              }`}
            >
              <div
                className={`font-bold text-[0.9rem] ${
                  cfg.activeProvider === p.id ? 'text-orange-500' : 'text-primary'
                }`}
              >
                {p.label}
              </div>
              <div className="text-muted-foreground text-xs">{p.desc}</div>
              {cfg.activeProvider === p.id && <div className="text-green-500 text-sm mt-1">✅ Aktif</div>}
            </button>
          ))}
        </div>
      </Card>

      {/* Firebase */}
      <Card title="🔥 Firebase Firestore">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="flex-1 text-muted-foreground text-sm leading-relaxed">
            Firebase Firestore REST API ile senkronizasyon
          </div>
          <button
            onClick={() => setFb({ enabled: !cfg.firebase.enabled })}
            className={`w-12 h-6.5 rounded-full relative transition-all cursor-pointer border-none ${
              cfg.firebase.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white absolute top-1 transition-all shadow-sm ${
                cfg.firebase.enabled ? 'left-6.5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* JSON Dosyası Yükleme */}
        <div className="bg-amber-500/5 border border-dashed border-amber-500/30 rounded-xl p-4 mb-4">
          <div className="text-foreground font-bold">📂 Firebase Config Dosyası Yükle</div>
          <div className="text-muted-foreground text-xs mb-3">
            Firebase Console'dan indirilen <code className="text-orange-400">google-services.json</code> veya web config
            JSON dosyasını yükleyin — alanlar otomatik dolar.
          </div>
          <label className="block">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-orange-500/20 text-orange-500 cursor-pointer">
              📁 JSON Dosyası Seç
            </div>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const json = JSON.parse(ev.target?.result as string);
                    if (json.project_info && json.client) {
                      const projectId = json.project_info.project_id;
                      const apiKey = json.client?.[0]?.api_key?.[0]?.current_key || '';
                      if (projectId) {
                        setFb({ projectId, apiKey });
                        showToast('✅ google-services.json okundu!', 'success');
                        return;
                      }
                    }
                    if (json.apiKey && json.projectId) {
                      setFb({ projectId: json.projectId, apiKey: json.apiKey });
                      showToast('✅ Firebase config okundu!', 'success');
                      return;
                    }
                    if (json.firebaseConfig) {
                      setFb({
                        projectId: json.firebaseConfig.projectId || '',
                        apiKey: json.firebaseConfig.apiKey || '',
                      });
                      showToast('✅ Firebase config okundu!', 'success');
                      return;
                    }
                    showToast('⚠️ Tanınan bir Firebase JSON formatı değil. Manuel girin.', 'warning');
                  } catch {
                    logger.warn('settings', 'Baglanti - JSON dosyası okunamadı');
                    showToast('❌ JSON dosyası okunamadı!', 'error');
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-3 transition-all ${
            cfg.firebase.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
          }`}
        >
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-muted-foreground">Project ID</label>
            <input
              value={cfg.firebase.projectId}
              onChange={(e) => setFb({ projectId: e.target.value })}
              className="w-full rounded-xl border border-strong px-4 py-2.5 text-sm bg-surface text-primary"
              placeholder="örn: my-project-12345"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-muted-foreground">API Key</label>
            <input
              type="password"
              value={cfg.firebase.apiKey}
              onChange={(e) => setFb({ apiKey: e.target.value })}
              className="w-full rounded-xl border border-strong px-4 py-2.5 text-sm bg-surface text-primary"
              placeholder="AIza..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-4">
          <button
            onClick={handleFbTest}
            disabled={fbTesting || !cfg.firebase.projectId || !cfg.firebase.apiKey}
            className={`px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-500 font-bold text-[0.85rem] cursor-pointer disabled:opacity-40`}
          >
            {fbTesting ? '⏳ Test ediliyor...' : '🔎 Bağlantıyı Test Et'}
          </button>
          {fbTest && (
            <div
              className={`flex items-center gap-1.5 text-[0.82rem] font-bold ${
                fbTest.ok ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {fbTest.ok ? '✅' : '❌'} {fbTest.msg}
            </div>
          )}
        </div>
      </Card>

      {/* Supabase */}
      <Card title="⚡ Supabase">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="flex-1 text-muted-foreground text-sm leading-relaxed">
            Supabase PostgreSQL ile senkronizasyon (REST API)
          </div>
          <button
            onClick={() => setSb({ enabled: !cfg.supabase.enabled })}
            className={`w-12 h-6.5 rounded-full relative transition-all cursor-pointer border-none ${
              cfg.supabase.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white absolute top-1 transition-all shadow-sm ${
                cfg.supabase.enabled ? 'left-6.5' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-3 transition-all ${
            cfg.supabase.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
          }`}
        >
          <div className="md:col-span-2">
            <label className="block mb-1.5 text-sm font-semibold text-muted-foreground">Supabase URL</label>
            <input
              value={cfg.supabase.url}
              onChange={(e) => setSb({ url: e.target.value })}
              className="w-full rounded-xl border border-strong px-4 py-2.5 text-sm bg-surface text-primary"
              placeholder="https://xxxxxxxxxxxx.supabase.co"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-muted-foreground">Anon Key (public)</label>
            <input
              type="password"
              value={cfg.supabase.anonKey}
              onChange={(e) => setSb({ anonKey: e.target.value })}
              className="w-full rounded-xl border border-strong px-4 py-2.5 text-sm bg-surface text-primary"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-muted-foreground">Tablo Adı</label>
            <input
              value={cfg.supabase.tableName}
              onChange={(e) => setSb({ tableName: e.target.value })}
              className="w-full rounded-xl border border-strong px-4 py-2.5 text-sm bg-surface text-primary"
              placeholder="soba_sync"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-4">
          <button
            onClick={handleSbTest}
            disabled={sbTesting || !cfg.supabase.url || !cfg.supabase.anonKey}
            className={`px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 font-bold text-[0.85rem] cursor-pointer disabled:opacity-40`}
          >
            {sbTesting ? '⏳ Test ediliyor...' : '🔎 Bağlantıyı Test Et'}
          </button>
          {sbTest && (
            <div
              className={`flex items-center gap-1.5 text-[0.82rem] font-bold ${
                sbTest.ok ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {sbTest.ok ? '✅' : '❌'} {sbTest.msg}
            </div>
          )}
        </div>
      </Card>

      {/* Kaydet / Sıfırla */}
      <div className="flex items-center gap-2.5 mt-2">
        <button
          onClick={handleReset}
          className="flex-1 py-3 px-0 rounded-xl font-bold text-sm border border-strong bg-transparent cursor-pointer whitespace-nowrap text-muted-foreground hover:text-primary transition-all"
        >
          ↺ Varsayılana Sıfırla
        </button>
        <button
          onClick={handleSave}
          className="flex-[2] py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-orange-500 to-orange-400 text-white cursor-pointer border-none shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
        >
          💾 Bağlantı Ayarlarını Kaydet
        </button>
      </div>

      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
        ⚠️ Bağlantı ayarları değiştirildikten sonra <strong className="text-foreground">sayfayı yenileyin</strong> —
        yeni ayarlar aktif olur.
        <br />
        <span className="inline-block mt-1">
          🔐 Bağlantı ayarları Firebase'e kaydedilir — tüm cihazlarda geçerlidir.
        </span>
      </div>
    </div>
  );
}
