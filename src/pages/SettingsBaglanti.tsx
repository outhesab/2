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
    showToast(
      r.ok ? 'Firebase baÄŸlantÄ±sÄ± baÅŸarÄ±lÄ±!' : 'Firebase baÄŸlantÄ±sÄ± baÅŸarÄ±sÄ±z!',
      r.ok ? 'success' : 'error',
    );
  };

  const handleSbTest = async () => {
    setSbTesting(true);
    setSbTest(null);
    const r = await testSupabase(cfg.supabase);
    setSbTest(r);
    setSbTesting(false);
    showToast(
      r.ok ? 'Supabase baÄŸlantÄ±sÄ± baÅŸarÄ±lÄ±!' : 'Supabase baÄŸlantÄ±sÄ± baÅŸarÄ±sÄ±z!',
      r.ok ? 'success' : 'error',
    );
  };

  const handleSave = () => {
    saveConnConfig(cfg);
    showToast('BaÄŸlantÄ± ayarlarÄ± kaydedildi! Sayfa yenilendiÄŸinde aktif olur.', 'success');
  };

  const handleReset = () => {
    onChange(DEFAULT_CONN);
    saveConnConfig(DEFAULT_CONN);
    showToast('VarsayÄ±lan baÄŸlantÄ± ayarlarÄ± geri yÃ¼klendi!', 'success');
  };

  return (
    <div className="grid gap-4">
      {/* Aktif SaÄŸlayÄ±cÄ± */}
      <Card title="ğŸ”Œ Aktif Senkronizasyon SaÄŸlayÄ±cÄ±sÄ±">
        <p className="text-muted-foreground text-sm mb-3.5 leading-relaxed">
          Verileriniz hangi bulut servisiyle senkronize edilsin? Sadece bir saÄŸlayÄ±cÄ± aktif olabilir.
        </p>
        <div className="flex items-center gap-2.5">
          {(
            [
              {
                id: 'firebase',
                label: 'ğŸ”¥ Firebase',
                desc: 'Google Firestore',
              },
              {
                id: 'supabase',
                label: 'âš¡ Supabase',
                desc: 'PostgreSQL tabanlÄ±',
              },
              { id: 'none', label: 'ğŸš« Yok', desc: 'Sadece yerel' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ ...cfg, activeProvider: p.id })}
              style={{
                flex: 1,
                padding: '14px 10px',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'center',
                background: cfg.activeProvider === p.id ? 'rgba(255,87,34,0.12)' : 'rgba(0,0,0,0.25)',
                border: `2px solid ${cfg.activeProvider === p.id ? 'rgba(255,87,34,0.5)' : 'rgba(255,255,255,0.07)'}`,
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: cfg.activeProvider === p.id ? 'var(--color-danger)' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              >
                {p.label}
              </div>
              <div className="text-[var(--text-dim)] text-xs">{p.desc}</div>
              {cfg.activeProvider === p.id && <div className="text-[var(--color-success)] text-sm mb-1">âœ“ Aktif</div>}
            </button>
          ))}
        </div>
      </Card>

      {/* Firebase */}
      <Card title="ğŸ”¥ Firebase Firestore">
        <div className="flex items-center gap-2.5">
          <div className="text-muted-foreground text-sm mb-3.5 leading-relaxed">
            Firebase Firestore REST API ile senkronizasyon
          </div>
          <button
            onClick={() => setFb({ enabled: !cfg.firebase.enabled })}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              background: cfg.firebase.enabled ? 'var(--color-success)' : 'var(--text-dim)',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'var(--bg-elevated)',
                position: 'absolute',
                top: 4,
                left: cfg.firebase.enabled ? 26 : 4,
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          </button>
        </div>

        {/* JSON DosyasÄ± YÃ¼kleme */}
        <div className="bg-amber-500/[0.08] border border-dashed border-amber-500/30 rounded-[10px] p-4">
          <div className="text-foreground font-bold">ğŸ“ Firebase Config DosyasÄ± YÃ¼kle</div>
          <div className="text-[var(--text-dim)] text-xs">
            Firebase Console'dan indirilen <code className="text-[var(--color-warning)]">google-services.json</code>{' '}
            veya web config JSON dosyasÄ±nÄ± yÃ¼kleyin â€” alanlar otomatik dolar.
          </div>
          <label className="block">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-[var(--color-warning)]/20 text-[var(--color-warning)] cursor-pointer">
              ğŸ“‚ JSON DosyasÄ± SeÃ§
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
                    // google-services.json formatÄ±
                    if (json.project_info && json.client) {
                      const projectId = json.project_info.project_id;
                      const apiKey = json.client?.[0]?.api_key?.[0]?.current_key || '';
                      if (projectId) {
                        setFb({ projectId, apiKey });
                        showToast('âœ… google-services.json okundu!', 'success');
                        return;
                      }
                    }
                    // Firebase web config formatÄ±: { apiKey, projectId, ... }
                    if (json.apiKey && json.projectId) {
                      setFb({ projectId: json.projectId, apiKey: json.apiKey });
                      showToast('âœ… Firebase config okundu!', 'success');
                      return;
                    }
                    // firebaseConfig objesi iÃ§inde
                    if (json.firebaseConfig) {
                      setFb({
                        projectId: json.firebaseConfig.projectId || '',
                        apiKey: json.firebaseConfig.apiKey || '',
                      });
                      showToast('âœ… Firebase config okundu!', 'success');
                      return;
                    }
                    showToast('âš ï¸ TanÄ±nan bir Firebase JSON formatÄ± deÄŸil. Manuel girin.', 'warning');
                  } catch {
                    logger.warn('settings', 'Baglanti - JSON dosyası okunamadı');
                    showToast('âŒ JSON dosyasÄ± okunamadÄ±!', 'error');
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            opacity: cfg.firebase.enabled ? 1 : 0.5,
            pointerEvents: cfg.firebase.enabled ? 'auto' : 'none',
          }}
        >
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Project ID</label>
            <input
              value={cfg.firebase.projectId}
              onChange={(e) => setFb({ projectId: e.target.value })}
              className="w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] box-border"
              placeholder="Ã¶rn: my-project-12345"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">API Key</label>
            <input
              type="password"
              value={cfg.firebase.apiKey}
              onChange={(e) => setFb({ apiKey: e.target.value })}
              className="w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] box-border"
              placeholder="AIza..."
            />
          </div>
          <div className="w-full">
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">DokÃ¼man Yolu</label>
            <input
              value={cfg.firebase.docPath}
              onChange={(e) => setFb({ docPath: e.target.value })}
              className="w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] box-border"
              placeholder="sync/main"
            />
            <div className="text-[var(--text-dim)] text-xs mt-1">
              Firestore'daki koleksiyon/dokÃ¼man yolu. Ã–rn:{' '}
              <code className="text-[var(--color-warning)]">sync/main</code>
            </div>
          </div>
        </div>

        {/* OluÅŸturulan URL Ã¶nizleme */}
        {cfg.firebase.projectId && cfg.firebase.apiKey && (
          <div className="bg-[rgba(0,0,0,0.3)] rounded-[10px] p-3 font-mono text-xs">
            {`Firebase: ${cfg.firebase.projectId}/${cfg.firebase.docPath} (SDK ile baÄŸlÄ±)`}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleFbTest}
            disabled={fbTesting || !cfg.firebase.projectId || !cfg.firebase.apiKey}
            style={{
              padding: '9px 18px',
              background: 'rgba(255,87,34,0.12)',
              border: '1px solid rgba(255,87,34,0.25)',
              borderRadius: 9,
              color: 'var(--color-danger)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem',
              opacity: !cfg.firebase.projectId || !cfg.firebase.apiKey ? 0.4 : 1,
            }}
          >
            {fbTesting ? 'âŸ³ Test ediliyor...' : 'ğŸ” BaÄŸlantÄ±yÄ± Test Et'}
          </button>
          {fbTest && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.82rem',
                color: fbTest.ok ? 'var(--color-success)' : 'var(--color-danger)',
                fontWeight: 600,
              }}
            >
              {fbTest.ok ? 'âœ…' : 'âŒ'} {fbTest.msg}
            </div>
          )}
        </div>

        {/* NasÄ±l alÄ±nÄ±r? */}
        <details className="mt-3.5">
          <summary className="text-[var(--text-dim)] text-sm cursor-pointer font-semibold">
            ğŸ“– Firebase bilgilerini nereden alÄ±rÄ±m?
          </summary>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[10px] p-4 text-sm leading-relaxed">
            <div>
              1.{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-warning)]"
              >
                console.firebase.google.com
              </a>{' '}
              â†’ Projenizi seÃ§in
            </div>
            <div>
              2. Proje AyarlarÄ± (âš™ï¸) â†’ Genel â†’ Proje kimliÄŸi ={' '}
              <strong className="text-foreground">Project ID</strong>
            </div>
            <div>
              3. Proje AyarlarÄ± â†’ Web API anahtarÄ± = <strong className="text-foreground">API Key</strong>
            </div>
            <div>
              4. Firestore Database â†’ Koleksiyon ve dokÃ¼man adÄ± ={' '}
              <strong className="text-foreground">DokÃ¼man Yolu</strong>
            </div>
            <div className="text-[var(--color-warning)]">
              âš ï¸ Firestore gÃ¼venlik kurallarÄ±nÄ± ayarlamayÄ± unutmayÄ±n!
            </div>
          </div>
        </details>
      </Card>

      {/* Supabase */}
      <Card title="âš¡ Supabase">
        <div className="flex items-center gap-2.5">
          <div className="text-muted-foreground text-sm mb-3.5 leading-relaxed">
            Supabase PostgreSQL ile senkronizasyon (REST API)
          </div>
          <button
            onClick={() => setSb({ enabled: !cfg.supabase.enabled })}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              background: cfg.supabase.enabled ? 'var(--color-success)' : 'var(--text-dim)',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'var(--bg-elevated)',
                position: 'absolute',
                top: 4,
                left: cfg.supabase.enabled ? 26 : 4,
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            opacity: cfg.supabase.enabled ? 1 : 0.5,
            pointerEvents: cfg.supabase.enabled ? 'auto' : 'none',
          }}
        >
          <div className="w-full">
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Supabase URL</label>
            <input
              value={cfg.supabase.url}
              onChange={(e) => setSb({ url: e.target.value })}
              className="w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] box-border"
              placeholder="https://xxxxxxxxxxxx.supabase.co"
            />
          </div>
          <div className="w-full">
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Anon Key (public)</label>
            <input
              type="password"
              value={cfg.supabase.anonKey}
              onChange={(e) => setSb({ anonKey: e.target.value })}
              className="w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] box-border"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Tablo AdÄ±</label>
            <input
              value={cfg.supabase.tableName}
              onChange={(e) => setSb({ tableName: e.target.value })}
              className="w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] box-border"
              placeholder="soba_sync"
            />
          </div>
        </div>

        {/* SQL ÅŸemasÄ± */}
        <details className="mt-3">
          <summary className="text-[var(--text-dim)] text-sm cursor-pointer font-semibold">
            ğŸ“‹ Gerekli SQL ÅŸemasÄ±
          </summary>
          <pre className="bg-[rgba(0,0,0,0.4)] rounded-lg p-4 overflow-x-auto text-xs font-mono leading-relaxed">{`CREATE TABLE soba_sync (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  version INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS politikasÄ± (opsiyonel)
ALTER TABLE soba_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON soba_sync FOR ALL USING (true);`}</pre>
        </details>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSbTest}
            disabled={sbTesting || !cfg.supabase.url || !cfg.supabase.anonKey}
            style={{
              padding: '9px 18px',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 9,
              color: 'var(--color-success)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem',
              opacity: !cfg.supabase.url || !cfg.supabase.anonKey ? 0.4 : 1,
            }}
          >
            {sbTesting ? 'âŸ³ Test ediliyor...' : 'ğŸ” BaÄŸlantÄ±yÄ± Test Et'}
          </button>
          {sbTest && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.82rem',
                color: sbTest.ok ? 'var(--color-success)' : 'var(--color-danger)',
                fontWeight: 600,
              }}
            >
              {sbTest.ok ? 'âœ…' : 'âŒ'} {sbTest.msg}
            </div>
          )}
        </div>

        <details className="mt-3.5">
          <summary className="text-[var(--text-dim)] text-sm cursor-pointer font-semibold">
            ğŸ“– Supabase bilgilerini nereden alÄ±rÄ±m?
          </summary>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[10px] p-4 text-sm leading-relaxed">
            <div>
              1.{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-success)]"
              >
                supabase.com/dashboard
              </a>{' '}
              â†’ Projenizi seÃ§in
            </div>
            <div>
              2. Settings â†’ API â†’ Project URL = <strong className="text-foreground">Supabase URL</strong>
            </div>
            <div>
              3. Settings â†’ API â†’ anon public = <strong className="text-foreground">Anon Key</strong>
            </div>
            <div>4. SQL Editor'da yukarÄ±daki ÅŸemayÄ± Ã§alÄ±ÅŸtÄ±rÄ±n</div>
          </div>
        </details>
      </Card>

      {/* Kaydet / SÄ±fÄ±rla */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleReset}
          className="flex-1 py-[11px] px-0 rounded-[10px] font-bold text-sm border border-[var(--border-strong)] bg-transparent cursor-pointer whitespace-nowrap"
        >
          â†º VarsayÄ±lana SÄ±fÄ±rla
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-[11px] px-0 rounded-[10px] font-extrabold text-sm bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white cursor-pointer"
        >
          ğŸ’¾ BaÄŸlantÄ± AyarlarÄ±nÄ± Kaydet
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
        âš ï¸ BaÄŸlantÄ± ayarlarÄ± deÄŸiÅŸtirildikten sonra{' '}
        <strong className="text-foreground">sayfayÄ± yenileyin</strong> â€” yeni ayarlar aktif olur.
        <br />
        ğŸ”’ BaÄŸlantÄ± ayarlarÄ± Firebase'e kaydedilir â€” tÃ¼m cihazlarda geÃ§erlidir.
      </div>
    </div>
  );
}

// ArayuzAyarlari moved to ./SettingsArayuz
