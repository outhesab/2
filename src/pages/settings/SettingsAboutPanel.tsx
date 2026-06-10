import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/pages/SettingsCard';
import { APP_SUBTITLE, loadAppConfig, saveAppConfig, validateVersion } from '@/lib/appConfig';
import { CHANGELOG, CHANGE_TYPE_CONFIG } from '@/lib/changelog';
import type { DB } from '@/types';

interface Props {
  db: DB;
  lsKB: number;
}

export function AboutPanel({ db, lsKB }: Props) {
  const totalRecords = [db.products, db.sales, db.cari, db.kasa, db.invoices || [], db.orders, db.suppliers].reduce(
    (s, a) => s + a.length,
    0,
  );

  const [appCfg, setAppCfg] = useState(loadAppConfig);
  const [editVersion, setEditVersion] = useState(false);
  const [versionInput, setVersionInput] = useState(appCfg.version);
  const [versionErr, setVersionErr] = useState('');
  const [expandedVersion, setExpandedVersion] = useState<string | null>(CHANGELOG[0]?.version || null);

  const saveVersion = () => {
    if (!validateVersion(versionInput)) {
      setVersionErr('Format: 2.1.0 veya 2.1.0-beta');
      return;
    }
    const next = { ...appCfg, version: versionInput.trim() };
    setAppCfg(next);
    saveAppConfig(next);
    setEditVersion(false);
    setVersionErr('');
  };

  const techStack = [
    { name: 'React 19', color: '#61dafb' },
    { name: 'TypeScript 6', color: '#3178c6' },
    { name: 'Vite 7', color: '#646cff' },
    { name: 'Tailwind CSS v4', color: '#38bdf8' },
    { name: 'Firebase Firestore', color: '#ffa000' },
    { name: 'Capacitor 8', color: '#119eff' },
    { name: 'Recharts', color: '#8884d8' },
    { name: 'Radix UI', color: '#7c3aed' },
  ];

  return (
    <div className="grid gap-4">
      {/* Logo & Başlık */}
      <div className="text-center py-6">
        <div className="text-4xl mb-2">{appCfg.appIcon}</div>
        <h2 className="text-foreground text-lg font-bold">{appCfg.appName}</h2>
        <p className="text-foreground text-sm">{APP_SUBTITLE}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Versiyon — tıklanabilir */}
          {editVersion ? (
            <div className="flex items-center gap-1.5">
              <input
                value={versionInput}
                onChange={(e) => {
                  setVersionInput(e.target.value);
                  setVersionErr('');
                }}
                style={{
                  padding: '4px 10px',
                  background: 'var(--bg-surface)',
                  border: `1px solid ${versionErr ? '#ef4444' : '#334155'}`,
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  width: 120,
                }}
                placeholder="2.1.0-beta"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveVersion();
                  if (e.key === 'Escape') {
                    setEditVersion(false);
                    setVersionErr('');
                  }
                }}
                autoFocus
              />
              <Button onClick={saveVersion} className="px-3 py-1.5 rounded-lg font-bold text-xs">
                ✓
              </Button>
              <Button
                onClick={() => {
                  setEditVersion(false);
                  setVersionErr('');
                }}
                className="px-2.5 py-1.5 rounded-lg font-medium text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
              >
                ✕
              </Button>
              {versionErr && <span className="text-red-400 text-xs">{versionErr}</span>}
            </div>
          ) : (
            <Button
              onClick={() => {
                setEditVersion(true);
                setVersionInput(appCfg.version);
              }}
              title="Versiyonu düzenle"
              className="inline-flex items-center rounded-md border border-transparent bg-primary/20 text-primary px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
            >
              v{appCfg.version} ✏️
            </Button>
          )}
          <span className="inline-flex items-center rounded-md border border-[var(--border)] px-2.5 py-0.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
            DB v{db._version || 1}
          </span>
          <span className="inline-flex items-center rounded-md border border-transparent bg-green-500/20 text-green-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
            {totalRecords} kayıt · {lsKB} KB
          </span>
        </div>
      </div>

      {/* Teknoloji Stack */}
      <Card title="⚙️ Teknoloji">
        <div className="flex flex-wrap gap-2">
          {techStack.map((t) => (
            <span
              key={t.name}
              style={{
                background: `${t.color}15`,
                border: `1px solid ${t.color}30`,
                borderRadius: 8,
                padding: '5px 12px',
                color: t.color,
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              {t.name}
            </span>
          ))}
        </div>
      </Card>

      {/* Veritabanı Özeti */}
      <Card title="🗄️ Veritabanı Özeti">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              icon: '📦',
              label: 'Ürünler',
              count: db.products.filter((p) => !p.deleted).length,
            },
            {
              icon: '🛒',
              label: 'Satışlar',
              count: db.sales.filter((s) => !s.deleted).length,
            },
            {
              icon: '👤',
              label: 'Cari',
              count: db.cari.filter((c) => !c.deleted).length,
            },
            {
              icon: '💰',
              label: 'Kasa Kayıtları',
              count: db.kasa.filter((k) => !k.deleted).length,
            },
            {
              icon: '🧾',
              label: 'Faturalar',
              count: (db.invoices || []).filter((i) => !i.deleted).length,
            },
            { icon: '🏭', label: 'Tedarikçiler', count: db.suppliers.length },
            { icon: '📋', label: 'Siparişler', count: db.orders.length },
            {
              icon: '📈',
              label: 'Stok Hareketleri',
              count: db.stockMovements.length,
            },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-foreground text-sm font-bold">{s.count}</div>
              <div className="text-[var(--text-dim)] text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sürüm Kitapçığı — Changelog */}
      <Card title="📖 Sürüm Geçmişi">
        <div className="grid gap-2">
          {CHANGELOG.map((entry) => {
            const isExpanded = expandedVersion === entry.version;
            const isLatest = entry.version === CHANGELOG[0]?.version;
            return (
              <div
                key={entry.version}
                style={{
                  background: isExpanded ? 'rgba(255,87,34,0.05)' : 'rgba(0,0,0,0.2)',
                  borderRadius: 12,
                  border: `1px solid ${isExpanded ? 'rgba(255,87,34,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                }}
              >
                {/* Başlık satırı */}
                <Button
                  onClick={() => setExpandedVersion(isExpanded ? null : entry.version)}
                  className="w-full flex items-center gap-3 p-3 bg-transparent border-none cursor-pointer text-left"
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: isLatest ? 'var(--color-danger)' : 'var(--text-secondary)',
                      fontSize: '0.88rem',
                      minWidth: 60,
                    }}
                  >
                    v{entry.version}
                  </span>
                  {isLatest && (
                    <span className="inline-flex items-center rounded-md border border-transparent bg-primary/20 text-primary px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                      SON
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="text-foreground text-sm font-semibold">{entry.title}</div>
                    <div className="text-[var(--text-dim)] text-xs">{entry.date}</div>
                  </div>
                  <span
                    style={{
                      color: 'var(--text-dim)',
                      fontSize: '0.85rem',
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                    }}
                  >
                    ▼
                  </span>
                </Button>

                {/* Detay */}
                {isExpanded && (
                  <div className="p-3 pt-0 space-y-2">
                    <p className="text-muted-foreground text-xs">{entry.summary}</p>
                    <div className="grid gap-2">
                      {entry.changes.map((change, i) => {
                        const cfg = CHANGE_TYPE_CONFIG[change.type];
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                borderRadius: 5,
                                padding: '1px 7px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                marginTop: 1,
                              }}
                            >
                              {cfg.label}
                            </span>
                            <span className="text-muted-foreground text-sm">{change.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Lisans */}
      <Card title="📄 Lisans & Geliştirici">
        <div className="grid gap-2.5">
          {[
            { label: 'Uygulama', value: `${appCfg.appName} — ${APP_SUBTITLE}` },
            { label: 'Geliştirici', value: 'Pars Pelet' },
            { label: 'Lisans', value: 'Özel Kullanım — Tüm hakları saklıdır' },
            { label: 'Platform', value: 'Web (PWA) + Android (Capacitor)' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-[var(--text-dim)] text-xs">{row.label}</span>
              <span className="text-foreground text-xs">{row.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
