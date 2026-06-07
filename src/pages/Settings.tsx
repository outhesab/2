import { useConfirm } from '@/components/ConfirmDialog';
import { SystemMap } from '@/components/SystemMap';
import { useToast } from '@/components/Toast';
import { mergeRestoreDB, saveBackupToFirebase, type RestoreReport } from '@/hooks/useDB';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { applyUIPrefs, loadUIPrefs, saveUIPrefs, type UIPrefs } from '@/hooks/useUIPrefs';
import { APP_SUBTITLE, loadAppConfig, saveAppConfig, validateVersion } from '@/lib/appConfig';
import { CHANGE_TYPE_CONFIG, CHANGELOG } from '@/lib/changelog';
import { loadConnConfig, saveConnConfig, type ConnConfig } from '@/lib/connConfig';
import { runHealthCheck, type HealthReport } from '@/lib/healthCheck';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils-tr';
import ExcelImport from '@/pages/ExcelImport';
import type { DB } from '@/types';
import { WIDGET_OPTIONS, type WidgetId } from '@/config/widgets';

import { useRef, useState } from 'react';
import { SettingsCompany } from './settings/SettingsCompany';
import { SoundSettingsPanel } from './settings/SettingsSound';
import { SecurityPanel } from './settings/SettingsSecurity';
import { ExcelExportPanel } from './settings/SettingsExcel';
import { ArayuzAyarlari } from './SettingsArayuz';
import { BaglantiAyarlari } from './SettingsBaglanti';
import { Card } from './SettingsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  exportJSON: () => void;
  importJSON: (f: File) => Promise<boolean>;
}

type Tab =
  | 'arayuz'
  | 'baglantilar'
  | 'company'
  | 'categories'
  | 'pellet'
  | 'sound'
  | 'agent'
  | 'backup'
  | 'excel_export'
  | 'activity'
  | 'shortcuts'
  | 'repair'
  | 'excel'
  | 'data'
  | 'security'
  | 'sysmap'
  | 'about';

const inpBase =
  'w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] box-border';

export default function Settings({ db, save, exportJSON, importJSON: _importJSON }: Props) {
  const { showToast: _showToast } = useToast();
  const showToast = _showToast as (m: string, t?: string) => void;
  const { showConfirm } = useConfirm();
  const { playSound } = useSoundFeedback();
  const [pellet, setPellet] = useState({ ...db.pelletSettings });
  const [tab, setTab] = useState<Tab>('arayuz');
  const [uiPrefs, setUiPrefs] = useState<UIPrefs>(loadUIPrefs);
  const [connCfg, setConnCfg] = useState<ConnConfig>(loadConnConfig);

  const [dashboardPrefs, setDashboardPrefs] = useState<{ leftWidgets: WidgetId[]; brightness: number }>(() => {
    try {
      const raw = localStorage.getItem('dashboardPrefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          leftWidgets: Array.isArray(parsed.leftWidgets)
            ? parsed.leftWidgets.filter((id: string) => WIDGET_OPTIONS.some((w) => w.id === id))
            : ['chart', 'recentSales', 'tips', 'excelBar'],
          brightness: typeof parsed.brightness === 'number' ? parsed.brightness : 100,
        };
      }
    } catch {
      logger.warn('settings', "Dashboard tercihleri localStorage'dan okunamadı"); /* ignore */
    }
    return { leftWidgets: ['chart', 'recentSales', 'tips', 'excelBar'], brightness: 100 };
  });

  const saveDashboardPrefs = (patch: Partial<{ leftWidgets: WidgetId[]; brightness: number }>) => {
    const next = { ...dashboardPrefs, ...patch };
    setDashboardPrefs(next);
    try {
      localStorage.setItem('dashboardPrefs', JSON.stringify(next));
    } catch {
      logger.warn('settings', "Dashboard tercihleri localStorage'a yazılamadı"); /* ignore */
    }
  };

  const savePellet = () => {
    save((prev) => ({ ...prev, pelletSettings: { ...pellet } }));
    showToast('Pelet ayarları kaydedildi!', 'success');
  };

  const clearData = () => {
    showConfirm(
      'Tüm Verileri Sil',
      'TÃœM verileriniz kalıcı olarak silinecek! Bu iÅŸlem geri alınamaz. Emin misiniz?',
      () => {
        localStorage.removeItem('sobaYonetim');
        window.location.reload();
      },
      true,
    );
  };

  const dataStats = [
    { label: 'Ãœrünler', count: db.products.length, icon: 'ğŸ“¦' },
    { label: 'SatıÅŸlar', count: db.sales.length, icon: 'ğŸ›’' },
    { label: 'Tedarikçiler', count: db.suppliers.length, icon: 'ğŸ­' },
    { label: 'Cari Hesaplar', count: db.cari.length, icon: 'ğŸ‘¤' },
    { label: 'Kasa İÅŸlemleri', count: db.kasa.length, icon: 'ğŸ’°' },
    { label: 'Banka İÅŸlemleri', count: db.bankTransactions.length, icon: 'ğŸ¦' },
    { label: 'Pelet Tedarikçi', count: db.peletSuppliers.length, icon: 'ğŸªµ' },
    { label: 'Boru Tedarikçi', count: db.boruSuppliers.length, icon: 'ğŸ”©' },
  ];

  const totalRecords = dataStats.reduce((s, d) => s + d.count, 0);

  const shortcuts = [
    { key: 'Ctrl + 1', desc: 'Ã–zet (Dashboard)' },
    { key: 'Ctrl + 2', desc: 'Ãœrünler' },
    { key: 'Ctrl + 3', desc: 'SatıÅŸ' },
    { key: 'Ctrl + 4', desc: 'Kasa' },
    { key: 'Ctrl + 5', desc: 'Raporlar' },
    { key: '+ Butonu', desc: 'Hızlı Eylem Menüsü (saÄŸ alt)' },
    { key: 'Ctrl + Z', desc: 'Geri Al (tarayıcı düzeyi)' },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
        <TabsList className="flex-nowrap overflow-x-auto justify-start h-auto gap-1 bg-transparent p-0 mb-4 no-scrollbar">
          <TabsTrigger value="arayuz" className="whitespace-nowrap">
            🎨 Arayüz
          </TabsTrigger>
          <TabsTrigger value="baglantilar" className="whitespace-nowrap">
            🔌 Bağlantılar
          </TabsTrigger>
          <TabsTrigger value="company" className="whitespace-nowrap">
            🏢 Şirket
          </TabsTrigger>
          <TabsTrigger value="categories" className="whitespace-nowrap">
            🏷️ Kategoriler
          </TabsTrigger>
          <TabsTrigger value="pellet" className="whitespace-nowrap">
            🪵 Pelet
          </TabsTrigger>
          <TabsTrigger value="sound" className="whitespace-nowrap">
            🔊 Ses
          </TabsTrigger>
          <TabsTrigger value="agent" className="whitespace-nowrap">
            🤖 Agentlar
          </TabsTrigger>
          <TabsTrigger value="backup" className="whitespace-nowrap">
            💾 Yedek
          </TabsTrigger>
          <TabsTrigger value="excel_export" className="whitespace-nowrap">
            📊 Excel
          </TabsTrigger>
          <TabsTrigger value="activity" className="whitespace-nowrap">
            📋 Aktivite
          </TabsTrigger>
          <TabsTrigger value="shortcuts" className="whitespace-nowrap">
            ⌨ Kısayollar
          </TabsTrigger>
          <TabsTrigger value="repair" className="whitespace-nowrap">
            🔧 Onarım
          </TabsTrigger>
          <TabsTrigger value="excel" className="whitespace-nowrap">
            📥 İçe Aktar
          </TabsTrigger>
          <TabsTrigger value="data" className="whitespace-nowrap">
            📂 Veri
          </TabsTrigger>
          <TabsTrigger value="security" className="whitespace-nowrap">
            🔒 Güvenlik
          </TabsTrigger>
          <TabsTrigger value="sysmap" className="whitespace-nowrap">
            🗺️ Harita
          </TabsTrigger>
          <TabsTrigger value="about" className="whitespace-nowrap">
            ℹ️ Hakkında
          </TabsTrigger>
        </TabsList>

        {tab === 'arayuz' && (
          <ArayuzAyarlari
            prefs={uiPrefs}
            onChange={(p) => {
              setUiPrefs(p);
              saveUIPrefs(p);
              applyUIPrefs(p);
            }}
            showToast={showToast}
            dashboardPrefs={dashboardPrefs}
            saveDashboardPrefs={saveDashboardPrefs}
          />
        )}

        {tab === 'baglantilar' && (
          <BaglantiAyarlari
            cfg={connCfg}
            onChange={(c) => {
              setConnCfg(c);
              saveConnConfig(c);
            }}
            showToast={showToast}
          />
        )}

        {tab === 'company' && <SettingsCompany db={db} save={save} showToast={showToast} />}

        {tab === 'pellet' && (
          <Card title="🪵 Pelet Ayarları">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FV
                label="Gramaj (gr/torba)"
                type="number"
                inputMode="decimal"
                value={String(pellet.gramaj)}
                onChange={(v) => setPellet((p) => ({ ...p, gramaj: parseFloat(v) || 0 }))}
              />
              <FV
                label="Kg Fiyatı (₺)"
                type="number"
                inputMode="decimal"
                value={String(pellet.kgFiyat)}
                onChange={(v) => setPellet((p) => ({ ...p, kgFiyat: parseFloat(v) || 0 }))}
              />
              <FV
                label="Çuval Kg"
                type="number"
                inputMode="decimal"
                value={String(pellet.cuvalKg)}
                onChange={(v) => setPellet((p) => ({ ...p, cuvalKg: parseFloat(v) || 0 }))}
              />
              <FV
                label="Kritik Gün Sayısı"
                type="number"
                inputMode="decimal"
                value={String(pellet.critDays)}
                onChange={(v) => setPellet((p) => ({ ...p, critDays: parseInt(v) || 0 }))}
              />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              💡 Mevcut değerler: {pellet.cuvalKg}kg çuval · ₺{pellet.kgFiyat}/kg · {pellet.gramaj}gr/torba
            </div>
            <Button onClick={savePellet} className="btn-primary w-full py-3 rounded-xl font-bold text-sm mt-4">
              💾 Pelet Ayarlarını Kaydet
            </Button>
          </Card>
        )}

        {tab === 'sound' && <SoundSettingsPanel playSound={playSound} />}

        {tab === 'agent' && <AgentSettingsPanel db={db} save={save} />}

        {tab === 'backup' && (
          <div className="grid gap-4">
            <Card title="ğŸ“¤ Yedek Al">
              <p className="text-muted-foreground text-sm">
                Tüm verilerinizi <strong className="text-orange-400 font-semibold">JSON formatında</strong> dıÅŸa
                aktarın.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dataStats.slice(0, 4).map((d) => (
                  <div key={d.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
                    <div className="text-lg mb-1">{d.icon}</div>
                    <div className="text-lg font-bold text-foreground">{d.count}</div>
                    <div className="text-[var(--text-dim)] text-sm">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
                Toplam {totalRecords} kayıt yedeklenecek
              </div>
              <Button onClick={exportJSON} className="btn-primary btn-green w-full py-3 rounded-xl font-bold text-sm">
                YedeÄŸi İndir (.json)
              </Button>
            </Card>

            <FullRestorePanel
              showToast={showToast}
              showConfirm={showConfirm as (t: string, m: string, ok: () => void, d?: boolean) => void}
              save={save}
              db={db}
            />

            <SelectiveRestore
              showToast={showToast}
              showConfirm={showConfirm as (t: string, m: string, ok: () => void, d?: boolean) => void}
              save={save}
              db={db}
            />

            <SmartImportManager
              db={db}
              save={save}
              showToast={showToast}
              showConfirm={showConfirm as (t: string, m: string, ok: () => void, d?: boolean) => void}
            />
          </div>
        )}

        {tab === 'excel_export' && <ExcelExportPanel db={db} />}

        {tab === 'activity' && (
          <ActivityPanel
            db={db}
            save={save}
            showToast={showToast}
            showConfirm={showConfirm as (t: string, m: string, ok: () => void, d?: boolean) => void}
          />
        )}

        {tab === 'shortcuts' && (
          <Card title="âŒ¨ï¸ Klavye Kısayolları">
            <p className="text-muted-foreground text-sm">
              Uygulamayı daha hızlı kullanmak için aÅŸaÄŸıdaki kısayolları kullanabilirsiniz.
            </p>
            <div className="grid gap-2">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <kbd className="inline-flex items-center rounded-md border border-[var(--border-strong)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--color-warning)] shadow-[0_2px_0_rgba(0,0,0,0.4)]">
                    {s.key}
                  </kbd>
                  <span className="text-muted-foreground text-sm">{s.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === 'repair' && (
          <VeriOnarim
            db={db}
            save={save}
            showToast={showToast}
            showConfirm={showConfirm as (title: string, msg: string, onOk: () => void, danger?: boolean) => void}
          />
        )}

        {tab === 'excel' && <ExcelImport db={db} save={save} />}

        {tab === 'categories' && <KategoriYonetim db={db} save={save} />}

        {tab === 'data' && (
          <div className="grid gap-4">
            <Card title="ğŸ—„ï¸ Veri İstatistikleri">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dataStats.map((d) => (
                  <div key={d.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
                    <div className="text-xl mb-1">{d.icon}</div>
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 900,
                        color: d.count > 0 ? 'var(--text-primary)' : 'var(--text-dim)',
                      }}
                    >
                      {d.count}
                    </div>
                    <div className="text-[var(--text-dim)] text-xs">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                Toplam <strong className="text-white">{totalRecords}</strong> kayıt Â· localStorage'da saklanıyor
              </div>
            </Card>

            <Card title="ğŸ—‘ï¸ Tehlikeli Alan">
              <p className="text-muted-foreground text-sm">
                AÅŸaÄŸıdaki iÅŸlemler <strong className="text-red-400 font-semibold">geri alınamaz</strong>. Ã–nce yedek
                almanızı ÅŸiddetle tavsiye ederiz.
              </p>
              <div className="grid gap-2.5">
                <DangerAction
                  label="SatıÅŸ GeçmiÅŸini Temizle"
                  desc={`${db.sales.length} satıÅŸ kaydı silinecek`}
                  onConfirm={() => {
                    save((prev) => ({ ...prev, sales: [] }));
                    showToast('SatıÅŸ geçmiÅŸi temizlendi!');
                  }}
                />
                <DangerAction
                  label="Kasa İÅŸlemlerini Temizle"
                  desc={`${db.kasa.length} kasa kaydı silinecek`}
                  onConfirm={() => {
                    save((prev) => ({ ...prev, kasa: [] }));
                    showToast('Kasa temizlendi!');
                  }}
                />
                <DangerAction
                  label="Aktivite GünlüÄŸünü Temizle"
                  desc={`${db._activityLog.length} kayıt silinecek`}
                  onConfirm={() => {
                    save((prev) => ({ ...prev, _activityLog: [] }));
                    showToast('Aktivite günlüÄŸü temizlendi!');
                  }}
                />
                <Button onClick={clearData} className="btn-danger w-full py-3 rounded-xl font-bold text-sm">
                  â˜ ï¸ TÃœM VERİLERİ SİL ve Sıfırla
                </Button>
              </div>
            </Card>
          </div>
        )}

        {tab === 'security' && <SecurityPanel showToast={showToast} />}

        {tab === 'sysmap' && (
          <div className="grid gap-4">
            <Card title="ğŸ—ºï¸ Sistem Haritası â€” Modüller Arası İliÅŸkiler">
              <p className="text-muted-foreground text-sm">
                Her modülün diÄŸer modülleri nasıl etkilediÄŸini gösteren akıÅŸ diyagramı. Düz çizgi = doÄŸrudan veri
                etkisi, kesik çizgi = veri saÄŸlar.
              </p>
              <SystemMap />
            </Card>
          </div>
        )}

        {tab === 'about' && <AboutPanel db={db} />}
      </Tabs>
    </div>
  );
}

// SecurityPanel moved to ./settings/SettingsSecurity
// SoundSettingsPanel moved to ./settings/SettingsSound
// AgentSettingsPanel â€” ÅŸu an kullanılmıyor, gerektiÄŸinde eklenebilir

// ExcelExportPanel moved to ./settings/SettingsExcel

function ActivityPanel({
  db,
  save,
  showToast,
  showConfirm,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
}) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const activityLog = [...(db._activityLog || [])].sort(
    (a, b) => new Date(b.time || b.createdAt || '').getTime() - new Date(a.time || a.createdAt || '').getTime(),
  );

  const actionTypes = Array.from(
    new Set(
      activityLog.map((a) => {
        const parts = a.action.split(':');
        return parts[0].trim();
      }),
    ),
  ).slice(0, 15);

  let filtered = activityLog;
  if (typeFilter !== 'all') filtered = filtered.filter((a) => a.action.startsWith(typeFilter));
  if (dateFilter) filtered = filtered.filter((a) => (a.time || '').startsWith(dateFilter));

  const getIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('satıÅŸ') || a.includes('satis')) return 'ğŸ›’';
    if (a.includes('ürün') || a.includes('urun') || a.includes('stok')) return 'ğŸ“¦';
    if (a.includes('kasa') || a.includes('gelir') || a.includes('gider')) return 'ğŸ’°';
    if (a.includes('cari') || a.includes('müÅŸteri')) return 'ğŸ‘¤';
    if (a.includes('fatura')) return 'ğŸ§¾';
    if (a.includes('sipariÅŸ')) return 'ğŸ“‹';
    if (a.includes('sil') || a.includes('iptal')) return 'ğŸ—‘ï¸';
    return 'ğŸ“';
  };

  const clearLog = () => {
    showConfirm(
      'Aktivite GünlüÄŸünü Temizle',
      `${db._activityLog.length} kayıt silinecek. Devam edilsin mi?`,
      () => {
        save((prev) => ({ ...prev, _activityLog: [] }));
        showToast('Aktivite günlüÄŸü temizlendi!');
      },
      true,
    );
  };

  return (
    <Card title="ğŸ“‹ Aktivite GünlüÄŸü">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={inpBase}
          style={{ width: 160 }}
          placeholder="Tarih filtrele"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inpBase} flex-1`}>
          <option value="all">Tüm İÅŸlemler</option>
          {actionTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {dateFilter && (
          <Button
            onClick={() => setDateFilter('')}
            className="px-3 py-2 rounded-lg font-medium text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          >
            âœ• Tarih
          </Button>
        )}
        <Button
          onClick={clearLog}
          className="btn-danger-outline px-3 py-2 rounded-lg font-bold text-xs border border-red-500/30"
        >
          ğŸ—‘ï¸ Temizle
        </Button>
      </div>

      <div className="text-[var(--text-dim)] text-xs">
        {filtered.length} kayıt (toplam {activityLog.length})
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <div className="text-3xl mb-2">ğŸ“‹</div>
            <p>Aktivite bulunamadı</p>
          </div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="flex items-start gap-2">
              <div className="text-lg w-8 h-8 flex items-center justify-center">{getIcon(a.action)}</div>
              <div className="flex-1">
                <div className="text-foreground text-xs">{a.action}</div>
                {a.detail && <div className="text-muted-foreground text-xs">{a.detail}</div>}
              </div>
              <div className="text-[var(--text-dim)] text-xs">{formatDate(a.time || a.createdAt || '')}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

const RESTORE_SECTIONS = [
  { key: 'products', label: 'Ãœrünler', icon: 'ğŸ“¦' },
  { key: 'sales', label: 'SatıÅŸlar', icon: 'ğŸ›’' },
  { key: 'suppliers', label: 'Tedarikçiler', icon: 'ğŸ­' },
  { key: 'cari', label: 'Cari Hesaplar', icon: 'ğŸ‘¤' },
  { key: 'kasa', label: 'Kasa İÅŸlemleri', icon: 'ğŸ’°' },
  { key: 'bankTransactions', label: 'Banka İÅŸlemleri', icon: 'ğŸ¦' },
  { key: 'invoices', label: 'Faturalar', icon: 'ğŸ§¾' },
  { key: 'orders', label: 'SipariÅŸler', icon: 'ğŸ“‹' },
  { key: 'stockMovements', label: 'Stok Hareketleri', icon: 'ğŸ“Š' },
  { key: 'peletSuppliers', label: 'Pelet Tedarikçi', icon: 'ğŸªµ' },
  { key: 'peletOrders', label: 'Pelet SipariÅŸ', icon: 'ğŸªµ' },
  { key: 'boruSuppliers', label: 'Boru Tedarikçi', icon: 'ğŸ”©' },
  { key: 'boruOrders', label: 'Boru SipariÅŸ', icon: 'ğŸ”©' },
  { key: 'budgets', label: 'Bütçe', icon: 'ğŸ“Š' },
  { key: 'returns', label: 'İadeler', icon: 'â†©ï¸' },
  { key: 'company', label: 'Şirket Bilgileri', icon: 'ğŸ¢', isObject: true },
  {
    key: 'pelletSettings',
    label: 'Pelet Ayarları',
    icon: 'âš™ï¸',
    isObject: true,
  },
] as const;

// â”€â”€ Tam Geri Yükleme Paneli â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FullRestorePanel({
  showToast,
  showConfirm,
  save,
  db,
}: {
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
  save: (fn: (prev: DB) => DB) => void;
  db: DB;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastReport, setLastReport] = useState<RestoreReport | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';

    showConfirm(
      'âš ï¸ Tam Geri Yükleme',
      `"${file.name}" dosyasındaki veriler yükleniyor. Mevcut tüm veriler bu yedekle deÄŸiÅŸtirilecek. Ã–nceki veri otomatik yedeklenir. Devam edilsin mi?`,
      () => {
        // Ã–nce mevcut veriyi yedekle
        saveBackupToFirebase(
          db,
          `onceki_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`,
        ).catch(() => logger.error('db', 'Tam geri yükleme öncesi yedek alınamadı'));

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const raw = JSON.parse(ev.target?.result as string) as DB;
            // fullRestoreDB'yi doÄŸrudan import etmek yerine save içinde çaÄŸırıyoruz
            save((prev) => {
              // makeDefaultDB'ye eriÅŸim yok burada â€” prev'i default olarak kullan
              const def = { ...prev };
              // Temel yapıyı koru, yedekteki veriyi üzerine yaz
              const merged: DB = { ...def, ...raw };
              // Zorunlu array alanları
              const arrayKeys = [
                'products',
                'sales',
                'suppliers',
                'orders',
                'cari',
                'kasa',
                'bankTransactions',
                'matchRules',
                'monitorRules',
                'monitorLog',
                'stockMovements',
                'peletSuppliers',
                'peletOrders',
                'boruSuppliers',
                'boruOrders',
                'invoices',
                'budgets',
                'returns',
                '_activityLog',
                'ortakEmanetler',
                'installments',
                'partners',
                'notes',
              ] as const;
              for (const key of arrayKeys) {
                if (!Array.isArray(merged[key])) (merged as unknown as Record<string, unknown>)[key] = [];
              }
              if (!merged.kasalar || merged.kasalar.length === 0) merged.kasalar = def.kasalar;
              if (!merged.company || typeof merged.company !== 'object') merged.company = def.company;
              if (!merged.pelletSettings) merged.pelletSettings = def.pelletSettings;
              if (!Array.isArray(merged.productCategories) || merged.productCategories.length === 0)
                merged.productCategories = def.productCategories;
              return merged;
            });

            const report: RestoreReport = {
              added: 0,
              skippedDuplicate: 0,
              skippedInvalidName: 0,
              skippedMissingField: 0,
              warnings: [],
            };
            // Ad kalite kontrolü raporu
            (raw.cari || []).forEach((c: { name?: unknown }) => {
              if (typeof c.name !== 'string' || c.name.trim().length < 2 || /^\d+$/.test(c.name.trim())) {
                report.skippedInvalidName++;
                report.warnings.push(`Cari gizlendi: "${c.name}" â€” geçersiz ad`);
              }
            });
            (raw.products || []).forEach((p: { name?: unknown }) => {
              if (typeof p.name !== 'string' || p.name.trim().length < 2 || /^\d+$/.test(p.name.trim())) {
                report.skippedInvalidName++;
                report.warnings.push(`Ãœrün gizlendi: "${p.name}" â€” geçersiz ad`);
              }
            });
            setLastReport(report);

            const msg =
              report.skippedInvalidName > 0
                ? `âœ… Geri yükleme tamamlandı. ${report.skippedInvalidName} geçersiz kayıt gizlendi.`
                : 'âœ… Tam geri yükleme baÅŸarılı! Ã–nceki veri yedeklendi.';
            showToast(msg, 'success');
            setTimeout(() => window.location.reload(), 1800);
          } catch {
            logger.warn('settings', 'Yedek dosyası okunamadı veya geçersiz format');
            showToast('Dosya okunamadı veya geçersiz format!', 'error');
          }
        };
        reader.readAsText(file);
      },
      true,
    );
  };

  return (
    <Card title="ğŸ”„ Tam Geri Yükleme">
      <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
        <strong>Dikkat:</strong> Mevcut tüm veriler yedekteki verilerle deÄŸiÅŸtirilir. İÅŸlem öncesi otomatik yedek
        alınır. Yedekten gelen geçersiz adlı kayıtlar (boÅŸ, tek haneli, sadece sayı) gizlenir.
      </div>
      <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
      <Button
        onClick={() => fileRef.current?.click()}
        className="btn-danger-dashed w-full py-3 rounded-xl font-bold text-sm border-2 border-dashed border-red-500/30 bg-red-500/10"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
        }}
      >
        ğŸ“‚ JSON Yedek Dosyası Seç â€” Tam Geri Yükle
      </Button>

      {lastReport && lastReport.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
          <div className="text-amber-400 font-bold text-sm">âš ï¸ Gizlenen Kayıtlar</div>
          {lastReport.warnings.map((w, i) => (
            <div key={i} className="text-muted-foreground text-sm">
              â€¢ {w}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SelectiveRestore({
  showToast,
  showConfirm,
  save,
  db,
}: {
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
  save: (fn: (prev: DB) => DB) => void;
  db: DB;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<Record<string, unknown> | null>(null);
  const [fileName, setFileName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [available, setAvailable] = useState<
    {
      key: string;
      label: string;
      icon: string;
      count: number;
      isObject?: boolean;
    }[]
  >([]);
  const [lastReport, setLastReport] = useState<RestoreReport | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== 'object' || Array.isArray(data)) {
          showToast('Geçersiz JSON formatı!', 'error');
          return;
        }
        setFileData(data);
        const avail: typeof available = [];
        RESTORE_SECTIONS.forEach((s) => {
          const val = data[s.key];
          if (s.key === 'company' || s.key === 'pelletSettings') {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              avail.push({
                key: s.key,
                label: s.label,
                icon: s.icon,
                count: 1,
                isObject: true,
              });
            }
          } else if (Array.isArray(val) && val.length > 0) {
            avail.push({
              key: s.key,
              label: s.label,
              icon: s.icon,
              count: val.length,
            });
          }
        });
        setAvailable(avail);
        setSelected(new Set(avail.map((a) => a.key)));
      } catch {
        logger.warn('settings', 'JSON ayrıştırılamadı');
        showToast('JSON ayrıÅŸtırılamadı!', 'error');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleSection = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(available.map((a) => a.key)));
  const selectNone = () => setSelected(new Set());

  const doRestore = () => {
    if (!fileData || selected.size === 0) return;
    const selCount = available.filter((a) => selected.has(a.key)).reduce((s, a) => s + a.count, 0);
    showConfirm(
      'Seçimli Geri Yükleme',
      `${selected.size} bölüm (${selCount} kayıt) iÅŸlenecek. Mevcut ID'ler korunur, geçersiz adlar atlanır. Devam edilsin mi?`,
      () => {
        try {
          // Geri yükleme öncesi mevcut veriyi otomatik yedekle
          const preLabel = `onceki_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`;
          saveBackupToFirebase(db, preLabel).catch(() =>
            logger.error('db', 'Seçimli geri yükleme öncesi yedek alınamadı'),
          );

          // Akıllı birleÅŸtirme â€” ID kontrolü + ad kalite kontrolü
          const { db: mergedDb, report } = mergeRestoreDB(db, fileData as Partial<DB>, selected);
          setLastReport(report);

          save(() => mergedDb);

          const msg = [
            `âœ… ${report.added} kayıt eklendi.`,
            report.skippedDuplicate > 0 ? `${report.skippedDuplicate} tekrar (ID çakıÅŸması) atlandı.` : '',
            report.skippedInvalidName > 0 ? `${report.skippedInvalidName} geçersiz adlı kayıt atlandı.` : '',
            report.skippedMissingField > 0 ? `${report.skippedMissingField} eksik alanlı kayıt atlandı.` : '',
          ]
            .filter(Boolean)
            .join(' ');

          showToast(msg, report.skippedInvalidName > 0 || report.skippedMissingField > 0 ? 'info' : 'success');
          setTimeout(() => window.location.reload(), 2000);
        } catch {
          logger.warn('settings', 'Geri yükleme sırasında hata oluştu');
          showToast('Geri yükleme sırasında hata oluÅŸtu!', 'error');
        }
      },
      true,
    );
  };

  const reset = () => {
    setFileData(null);
    setFileName('');
    setSelected(new Set());
    setAvailable([]);
    setLastReport(null);
  };

  return (
    <Card title="ğŸ“‚ Seçimli Geri Yükleme">
      <p className="text-muted-foreground text-sm">
        Yedek dosyanızdan <strong className="text-orange-400 font-semibold">istediÄŸiniz bölümleri seçerek</strong> geri
        yükleyin. Tüm veriyi deÄŸiÅŸtirmek zorunda deÄŸilsiniz.
      </p>

      {!fileData ? (
        <>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
          <Button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-3 rounded-xl font-bold text-sm border-2 border-dashed border-blue-500/30 bg-blue-500/10 w-full"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)';
            }}
          >
            JSON Yedek Dosyası Seç
          </Button>
        </>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-[10px] p-3">
            <span className="text-green-400 text-lg">ğŸ“„</span>
            <span className="text-green-400 font-bold">{fileName}</span>
            <span className="text-muted-foreground text-xs">{available.length} bölüm bulundu</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-semibold">Geri Yüklenecek Bölümler:</span>
            <Button onClick={selectAll} className="px-3 py-1.5 rounded-lg font-bold text-xs">
              Tümünü Seç
            </Button>
            <Button onClick={selectNone} className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs">
              Hiçbirini Seçme
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {available.map((section) => {
              const isSelected = selected.has(section.key);
              return (
                <div
                  key={section.key}
                  onClick={() => toggleSection(section.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: isSelected ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isSelected ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--color-info)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`,
                      color: 'var(--text-primary)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected ? 'âœ“' : ''}
                  </div>
                  <span className="text-base">{section.icon}</span>
                  <div className="flex-1">
                    <div
                      style={{
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                      }}
                    >
                      {section.label}
                    </div>
                    <div className="text-[var(--text-dim)] text-sm">
                      {section.isObject ? 'Ayarlar' : `${section.count} kayıt`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected.size > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              Mevcut ID'ler korunur. Geçersiz adlar (boÅŸ, tek haneli, sadece sayı) ve zorunlu alanı eksik kayıtlar
              atlanır.
            </div>
          )}

          {lastReport && lastReport.warnings.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-red-400 font-bold text-sm">
                âš ï¸ Atlanan Kayıtlar (
                {lastReport.skippedDuplicate + lastReport.skippedInvalidName + lastReport.skippedMissingField})
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {lastReport.skippedDuplicate > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-blue-500/20 text-blue-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    ğŸ” {lastReport.skippedDuplicate} tekrar ID
                  </span>
                )}
                {lastReport.skippedInvalidName > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-red-500/20 text-red-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    âœ— {lastReport.skippedInvalidName} geçersiz ad
                  </span>
                )}
                {lastReport.skippedMissingField > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    âš {lastReport.skippedMissingField} eksik alan
                  </span>
                )}
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {lastReport.warnings.map((w, i) => (
                  <div key={i} className="text-muted-foreground text-sm">
                    â€¢ {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {selected.size > 0 && (
              <Button
                onClick={doRestore}
                className="px-3 py-2.5 rounded-xl font-bold text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex-1"
              >
                {selected.size} Bölümü Geri Yükle
              </Button>
            )}
            <Button
              onClick={reset}
              className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            >
              Sıfırla
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

const KNOWN_ARRAYS: Record<string, string> = {
  products: 'Ãœrünler',
  sales: 'SatıÅŸlar',
  suppliers: 'Tedarikçiler',
  cari: 'Cari MüÅŸteriler',
  kasa: 'Kasa Hareketleri',
  bankTransactions: 'Banka İÅŸlemleri',
  orders: 'SipariÅŸler',
  invoices: 'Faturalar',
  stockMovements: 'Stok Hareketleri',
  peletSuppliers: 'Pelet Tedarikçi',
  peletOrders: 'Pelet SipariÅŸ',
  boruSuppliers: 'Boru Tedarikçi',
  boruOrders: 'Boru SipariÅŸ',
  budgets: 'Bütçe',
  returns: 'İadeler',
  ortakEmanetler: 'Ortak Emanet',
  installments: 'Taksitler',
};

const LEGACY_FIELD_MAP: Record<string, string> = {
  urunler: 'products',
  satislar: 'sales',
  tedarikci: 'suppliers',
  musteriler: 'cari',
  kasaHareketleri: 'kasa',
  bankHareketleri: 'bankTransactions',
  siparisler: 'orders',
  faturalar: 'invoices',
  stokHareketleri: 'stockMovements',
  stoklar: 'products',
  musteri: 'cari',
  tedarikcilar: 'suppliers',
  kasaIslemleri: 'kasa',
};

type ConflictResolution = 'overwrite' | 'skip' | 'merge';

interface ConflictInfo {
  entity: string;
  label: string;
  byId: number;
  byName: number;
  total: number;
}

const CSV_COLUMN_MAP: Record<string, { target: string; field: string }> = {
  müşteri: { target: 'cari', field: 'name' },
  musteri: { target: 'cari', field: 'name' },
  'müÅŸteri adı': { target: 'cari', field: 'name' },
  ad: { target: 'cari', field: 'name' },
  isim: { target: 'cari', field: 'name' },
  'ad soyad': { target: 'cari', field: 'name' },
  telefon: { target: 'cari', field: 'phone' },
  tel: { target: 'cari', field: 'phone' },
  adres: { target: 'cari', field: 'address' },
  bakiye: { target: 'cari', field: 'balance' },
  borç: { target: 'cari', field: 'balance' },
  borc: { target: 'cari', field: 'balance' },
  tarih: { target: '_date', field: 'createdAt' },
  date: { target: '_date', field: 'createdAt' },
  tutar: { target: '_amount', field: 'amount' },
  toplam: { target: '_amount', field: 'total' },
  fiyat: { target: '_amount', field: 'price' },
  ürün: { target: 'products', field: 'name' },
  urun: { target: 'products', field: 'name' },
  'ürün adı': { target: 'products', field: 'name' },
  stok: { target: 'products', field: 'stock' },
  maliyet: { target: 'products', field: 'cost' },
  'satış fiyatı': { target: 'products', field: 'price' },
  kategori: { target: '_category', field: 'category' },
  açıklama: { target: '_desc', field: 'description' },
  aciklama: { target: '_desc', field: 'description' },
  not: { target: '_desc', field: 'note' },
  'e-posta': { target: 'cari', field: 'email' },
  email: { target: 'cari', field: 'email' },
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(/[,;\t]/).map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v !== ''));
}

interface CsvColumnMapping {
  csvColumn: string;
  targetEntity: string;
  targetField: string;
  autoDetected: boolean;
}

function detectCsvColumns(headers: string[]): CsvColumnMapping[] {
  return headers.map((h) => {
    const lower = h.toLowerCase().trim();
    const match = CSV_COLUMN_MAP[lower];
    if (match) {
      return {
        csvColumn: h,
        targetEntity: match.target,
        targetField: match.field,
        autoDetected: true,
      };
    }
    for (const [key, val] of Object.entries(CSV_COLUMN_MAP)) {
      if (lower.includes(key)) {
        return {
          csvColumn: h,
          targetEntity: val.target,
          targetField: val.field,
          autoDetected: true,
        };
      }
    }
    return {
      csvColumn: h,
      targetEntity: '',
      targetField: '',
      autoDetected: false,
    };
  });
}

function SmartImportManager({
  db,
  save: _save,
  showToast,
  showConfirm,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<'idle' | 'mapping' | 'csvMapping' | 'preview' | 'done'>('idle');
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);
  const [mapped, setMapped] = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({});
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [unknownFields, setUnknownFields] = useState<string[]>([]);
  const [legacyMapped, setLegacyMapped] = useState<Record<string, string>>({});
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvMappings, setCsvMappings] = useState<CsvColumnMapping[]>([]);
  const [csvTarget, setCsvTarget] = useState<string>('cari');

  const detectFieldMappings = (data: Record<string, unknown>) => {
    const unknown: string[] = [];
    const autoMapped: Record<string, string> = {};
    const knownAll = new Set([
      ...Object.keys(KNOWN_ARRAYS),
      '_version',
      'company',
      'settings',
      'pelletSettings',
      'kasalar',
      'matchRules',
      'monitorRules',
      'monitorLog',
      '_activityLog',
      'soundSettings',
    ]);

    Object.keys(data).forEach((key) => {
      if (!knownAll.has(key)) {
        if (LEGACY_FIELD_MAP[key]) {
          autoMapped[key] = LEGACY_FIELD_MAP[key];
        } else {
          unknown.push(key);
        }
      }
    });
    return { unknown, autoMapped };
  };

  const applyMappings = (data: Record<string, unknown>, mappings: Record<string, string>): Record<string, unknown> => {
    const result: Record<string, unknown> = { ...data };
    Object.entries(mappings).forEach(([src, dst]) => {
      if (dst && dst !== '' && result[src] !== undefined) {
        if (!result[dst] || !Array.isArray(result[dst])) {
          result[dst] = result[src];
        } else if (Array.isArray(result[dst]) && Array.isArray(result[src])) {
          result[dst] = [...(result[dst] as unknown[]), ...(result[src] as unknown[])];
        }
        delete result[src];
      }
    });
    return result;
  };

  const detectConflicts = (data: Record<string, unknown>): ConflictInfo[] => {
    const checks: Array<{
      entity: string;
      label: string;
      dbItems: { id?: string; name?: string; code?: string }[];
      importKey: string;
    }> = [
      {
        entity: 'products',
        label: 'Ãœrün',
        dbItems: db.products,
        importKey: 'products',
      },
      {
        entity: 'sales',
        label: 'SatıÅŸ',
        dbItems: db.sales,
        importKey: 'sales',
      },
      {
        entity: 'cari',
        label: 'Cari MüÅŸteri',
        dbItems: db.cari,
        importKey: 'cari',
      },
      {
        entity: 'suppliers',
        label: 'Tedarikçi',
        dbItems: db.suppliers || [],
        importKey: 'suppliers',
      },
    ];

    return checks
      .map(({ entity, label, dbItems, importKey }) => {
        const incoming =
          (data[importKey] as {
            id?: string;
            name?: string;
            code?: string;
          }[]) || [];
        const existingIds = new Set(dbItems.map((d) => d.id).filter(Boolean));
        const existingNames = new Set(dbItems.map((d) => (d.name || '').toLowerCase().trim()).filter(Boolean));
        const byId = incoming.filter((item) => item.id && existingIds.has(item.id)).length;
        const byName = incoming.filter(
          (item) => !item.id && item.name && existingNames.has(item.name.toLowerCase().trim()),
        ).length;
        return { entity, label, byId, byName, total: byId + byName };
      })
      .filter((c) => c.total > 0);
  };

  const analyzeData = (data: Record<string, unknown>) => {
    const errs: string[] = [];
    const warns: string[] = [];
    const st: Record<string, number> = {};

    Object.entries(KNOWN_ARRAYS).forEach(([key]) => {
      const val = data[key];
      if (Array.isArray(val)) {
        if (val.length > 0) st[key] = val.length;
        if (val.length === 0) warns.push(`"${KNOWN_ARRAYS[key]}" alanı boÅŸ`);
      } else if (val !== undefined) {
        errs.push(`"${key}" alanı geçersiz format â€” dizi bekleniyor`);
      }
    });

    if (!data.company || typeof data.company !== 'object')
      warns.push('Şirket bilgisi bulunamadı â€” varsayılan oluÅŸturulacak');
    if (!data.pelletSettings) warns.push('Pelet ayarları bulunamadı â€” varsayılan kullanılacak');
    if (!data._version) warns.push('Versiyon bilgisi yok â€” eski format olabilir, lütfen kontrol edin');
    else if ((data._version as number) < 1)
      warns.push(`Eski versiyon (${data._version}) â€” bazı alanlar eksik olabilir`);

    return { errs, warns, st };
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;

      if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setErrors(['CSV dosyası boÅŸ veya geçersiz format']);
          setStage('preview');
          return;
        }
        setCsvRows(rows);
        const headers = Object.keys(rows[0]);
        const mappings = detectCsvColumns(headers);
        setCsvMappings(mappings);
        const hasCariCols = mappings.some((m) => m.targetEntity === 'cari');
        const hasProductCols = mappings.some((m) => m.targetEntity === 'products');
        setCsvTarget(hasCariCols ? 'cari' : hasProductCols ? 'products' : 'cari');
        setStage('csvMapping');
        return;
      }

      try {
        const data = JSON.parse(text);
        if (typeof data !== 'object' || Array.isArray(data)) {
          setErrors(['Geçersiz JSON formatı â€” nesne bekleniyor']);
          setStage('preview');
          setRawData(null);
          return;
        }
        setRawData(data);
        const { unknown, autoMapped } = detectFieldMappings(data);
        setLegacyMapped(autoMapped);
        setUnknownFields(unknown);
        const initMappings: Record<string, string> = {};
        unknown.forEach((f) => {
          initMappings[f] = '';
        });
        setFieldMappings(initMappings);

        if (unknown.length > 0 || Object.keys(autoMapped).length > 0) {
          setStage('mapping');
        } else {
          proceedToPreview(data, {});
        }
      } catch {
        logger.warn('settings', 'Dosya ayrıştırılamadı — JSON veya CSV formatı hatalı');
        setErrors(['Dosya ayrıÅŸtırılamadı â€” JSON veya CSV formatını kontrol edin']);
        setStage('preview');
        setRawData(null);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const applyCsvImport = () => {
    if (csvRows.length === 0) return;
    const items: Record<string, unknown>[] = csvRows.map((row) => {
      const item: Record<string, unknown> = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      csvMappings.forEach((m) => {
        if (!m.targetField || m.targetField === '') return;
        const val = row[m.csvColumn];
        if (!val) return;
        const numFields = ['balance', 'amount', 'total', 'price', 'stock', 'cost', 'quantity'];
        if (numFields.includes(m.targetField)) {
          item[m.targetField] = parseFloat(val.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
        } else if (m.targetField === 'createdAt') {
          try {
            item.createdAt = new Date(val).toISOString();
          } catch {
            logger.warn('settings', 'createdAt tarihi ayrıştırılamadı, varsayılan korundu');
            /* keep default */
          }
        } else {
          item[m.targetField] = val;
        }
      });
      if (csvTarget === 'cari') {
        if (!item.type) item.type = 'musteri';
        if (!item.balance) item.balance = 0;
        if (!item.totalPurchases) item.totalPurchases = 0;
      }
      if (csvTarget === 'products') {
        if (!item.stock) item.stock = 0;
        if (!item.cost) item.cost = 0;
        if (!item.price) item.price = 0;
        if (!item.minStock) item.minStock = 5;
        if (!item.category) item.category = '';
      }
      if (csvTarget === 'kasa') {
        if (!item.type) item.type = 'gider';
        if (!item.kasa) item.kasa = 'nakit';
        if (!item.amount) item.amount = 0;
        if (!item.description) item.description = (item.name as string) || 'CSV İçe Aktarma';
        if (!item.category) item.category = 'diger';
      }
      return item;
    });

    const data: Record<string, unknown> = {};
    data[csvTarget] = items;
    setRawData(data);
    proceedToPreview(data, {});
  };

  const proceedToPreview = (data: Record<string, unknown>, userMappings: Record<string, string>) => {
    const allMappings = { ...legacyMapped, ...userMappings };
    const resolved = applyMappings(data, allMappings);
    const { errs, warns, st } = analyzeData(resolved);
    const detectedConflicts = detectConflicts(resolved);
    const initRes: Record<string, ConflictResolution> = {};
    detectedConflicts.forEach((c) => {
      initRes[c.entity] = 'overwrite';
    });
    setMapped(resolved);
    setErrors(errs);
    setWarnings(warns);
    setStats(st);
    setConflicts(detectedConflicts);
    setResolutions(initRes);
    setStage('preview');
  };

  const doImport = () => {
    if (!mapped) return;
    showConfirm(
      'Veri Aktarımını Onayla',
      'Seçilen çakıÅŸma çözümleri uygulanacak ve veriler içe aktarılacak. Mevcut veriler etkilenebilir. Onaylıyor musunuz?',
      () => {
        try {
          const raw = localStorage.getItem('sobaYonetim');
          const current = raw ? JSON.parse(raw) : {};
          const def = {
            _version: 1,
            products: [],
            sales: [],
            suppliers: [],
            orders: [],
            cari: [],
            kasa: [],
            kasalar: [
              { id: 'nakit', name: 'Nakit', icon: 'ğŸ’µ' },
              { id: 'banka', name: 'Banka', icon: 'ğŸ¦' },
            ],
            bankTransactions: [],
            matchRules: [],
            monitorRules: [],
            monitorLog: [],
            stockMovements: [],
            peletSuppliers: [],
            peletOrders: [],
            boruSuppliers: [],
            boruOrders: [],
            invoices: [],
            budgets: [],
            returns: [],
            _activityLog: [],
            company: current.company || {},
            settings: {},
            pelletSettings: {
              gramaj: 14,
              kgFiyat: 6.5,
              cuvalKg: 15,
              critDays: 3,
            },
            ortakEmanetler: [],
            installments: [],
          };
          const finalData: Record<string, unknown> = { ...def, ...mapped };

          const conflictEntities = ['products', 'cari', 'suppliers', 'sales'] as const;
          conflictEntities.forEach((entity) => {
            const resolution = resolutions[entity] || 'overwrite';
            const incoming = (mapped[entity] as { id?: string; name?: string }[]) || [];
            const existing = (current[entity] as { id?: string; name?: string }[]) || [];

            if (resolution === 'skip') {
              const existingIds = new Set(existing.map((x: { id?: string }) => x.id).filter(Boolean));
              const existingNames = new Set(
                existing.map((x: { name?: string }) => (x.name || '').toLowerCase()).filter(Boolean),
              );
              finalData[entity] = [
                ...existing,
                ...incoming.filter((item) => {
                  const hasConflict = !existingIds.has(item.id) && !existingNames.has((item.name || '').toLowerCase());
                  return item.name && hasConflict;
                }),
              ];
            } else if (resolution === 'merge') {
              const existingMap = new Map(existing.map((x: { id?: string }) => [x.id, x]));
              incoming.forEach((item) => {
                if (item.id && existingMap.has(item.id)) {
                  existingMap.set(item.id, {
                    ...existingMap.get(item.id)!,
                    ...item,
                  });
                } else {
                  existingMap.set(item.id || Math.random().toString(), item);
                }
              });
              finalData[entity] = Array.from(existingMap.values());
            }
          });

          if (!finalData.kasalar || (finalData.kasalar as unknown[]).length === 0) finalData.kasalar = def.kasalar;
          if (!finalData.pelletSettings) finalData.pelletSettings = def.pelletSettings;
          if (!finalData.company || typeof finalData.company !== 'object') finalData.company = def.company;

          localStorage.setItem('sobaYonetim', JSON.stringify(finalData));
          setStage('done');
          showToast('Veriler baÅŸarıyla aktarıldı! Sayfa yenilenecek...', 'success');
          setTimeout(() => window.location.reload(), 1200);
        } catch {
          logger.warn('settings', 'İçe aktarma sırasında hata oluştu');
          showToast('İçe aktarma sırasında hata oluÅŸtu!', 'error');
        }
      },
      true,
    );
  };

  const reset = () => {
    setStage('idle');
    setRawData(null);
    setMapped(null);
    setErrors([]);
    setWarnings([]);
    setStats({});
    setConflicts([]);
    setResolutions({});
    setFieldMappings({});
    setUnknownFields([]);
    setLegacyMapped({});
    setCsvRows([]);
    setCsvMappings([]);
    setCsvTarget('cari');
  };

  const btnStyle = (active: boolean, color: string) => ({
    padding: '6px 14px',
    border: `1px solid ${active ? color : 'var(--text-dim)'}`,
    borderRadius: 8,
    background: active ? `${color}20` : 'transparent',
    color: active ? color : 'var(--text-muted)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
  });

  return (
    <Card title="ğŸ§  Akıllı Veri İçe Aktarma">
      <p className="text-muted-foreground text-sm">
        JSON, CSV veya TXT dosyanızı analiz eder; kolonları otomatik eÅŸler (müÅŸteri, tarih, tutar vb.), manuel
        düzeltme imkanı sunar ve çakıÅŸmaları çözerek güvenli aktarım yapar.
      </p>

      {stage === 'idle' && (
        <>
          <input ref={fileRef} type="file" accept=".json,.csv,.tsv,.txt" onChange={handleFile} className="hidden" />
          <Button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-3 rounded-xl font-bold text-sm border-2 border-dashed border-purple-500/30 bg-purple-500/10 w-full"
          >
            Dosya Seç & Akıllı Analiz BaÅŸlat
          </Button>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {['JSON', 'CSV', 'TSV', 'TXT'].map((f) => (
              <span
                key={f}
                className="inline-flex items-center rounded-md border border-transparent bg-purple-500/20 text-purple-400 px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
              >
                .{f.toLowerCase()}
              </span>
            ))}
          </div>
        </>
      )}

      {stage === 'csvMapping' && csvRows.length > 0 && (
        <div className="grid gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-green-400 font-bold">{csvRows.length} satır okundu</div>
            <div className="text-muted-foreground text-xs">
              Kolon eÅŸleÅŸmelerini kontrol edin ve gerekirse düzeltin
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-foreground text-sm font-semibold">Hedef Veri Türü:</span>
              {[
                { id: 'cari', label: 'Cari MüÅŸteri', icon: 'ğŸ‘¤' },
                { id: 'products', label: 'Ãœrün', icon: 'ğŸ“¦' },
                { id: 'kasa', label: 'Kasa', icon: 'ğŸ’°' },
              ].map((t) => (
                <Button
                  key={t.id}
                  onClick={() => setCsvTarget(t.id)}
                  style={{
                    padding: '6px 14px',
                    border: `1px solid ${csvTarget === t.id ? '#ff5722' : '#334155'}`,
                    borderRadius: 8,
                    background: csvTarget === t.id ? 'rgba(255,87,34,0.15)' : 'transparent',
                    color: csvTarget === t.id ? 'var(--color-danger)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
                  {t.icon} {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="text-foreground text-sm font-semibold">Kolon EÅŸleÅŸmeleri</div>
          {csvMappings.map((m, i) => (
            <div key={m.csvColumn} className="flex items-center gap-2.5">
              <div
                style={{
                  minWidth: 140,
                  padding: '6px 10px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 6,
                  color: m.autoDetected ? 'var(--color-success)' : 'var(--color-warning)',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {m.csvColumn}
                {m.autoDetected && <span className="text-green-400 text-xs">otomatik</span>}
              </div>
              <span className="text-[var(--text-dim)] text-sm">â†’</span>
              <select
                value={m.targetField}
                onChange={(e) => {
                  const next = [...csvMappings];
                  next[i] = {
                    ...next[i],
                    targetField: e.target.value,
                    autoDetected: false,
                  };
                  setCsvMappings(next);
                }}
                className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-mono"
              >
                <option value="">â€” Yoksay â€”</option>
                <option value="name">Ad / İsim</option>
                <option value="phone">Telefon</option>
                <option value="email">E-posta</option>
                <option value="address">Adres</option>
                <option value="balance">Bakiye / Borç</option>
                <option value="amount">Tutar</option>
                <option value="total">Toplam</option>
                <option value="price">Fiyat</option>
                <option value="cost">Maliyet</option>
                <option value="stock">Stok</option>
                <option value="category">Kategori</option>
                <option value="description">Açıklama</option>
                <option value="note">Not</option>
                <option value="createdAt">Tarih</option>
              </select>
            </div>
          ))}

          {csvRows.length > 0 && (
            <div className="bg-[rgba(0,0,0,0.3)] rounded-[10px] p-3 overflow-x-auto">
              <div className="text-muted-foreground text-xs">Ã–nizleme (ilk 3 satır):</div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {Object.keys(csvRows[0]).map((h) => (
                      <th key={h} className="text-left p-1.5 font-semibold text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 3).map((row, ri) => (
                    <tr key={ri}>
                      {Object.values(row).map((v, ci) => (
                        <td key={ci} className="p-1.5 text-foreground">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <Button
              onClick={applyCsvImport}
              className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
            >
              Devam â†’ Ã–nizleme & Ã‡akıÅŸma Ã‡özümü
            </Button>
            <Button
              onClick={reset}
              className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            >
              Sıfırla
            </Button>
          </div>
        </div>
      )}

      {stage === 'mapping' && rawData && (
        <div className="grid gap-4">
          <div className="text-foreground text-sm">ğŸ—ºï¸ Alan EÅŸleme (Field Mapping)</div>
          {Object.keys(legacyMapped).length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-green-400 font-bold">âœ… Otomatik Algılanan Eski Alanlar</div>
              {Object.entries(legacyMapped).map(([src, dst]) => (
                <div key={src} className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-[rgba(0,0,0,0.3)] px-2 py-0.5 rounded text-[var(--color-warning)]">
                    {src}
                  </span>
                  <span className="text-[var(--text-dim)] text-sm">â†’</span>
                  <span className="font-mono text-xs bg-[rgba(0,0,0,0.3)] px-2 py-0.5 rounded text-[var(--color-success)]">
                    {dst}
                  </span>
                  <span className="text-[var(--text-dim)] text-xs">({KNOWN_ARRAYS[dst] || dst})</span>
                </div>
              ))}
            </div>
          )}
          {unknownFields.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-amber-400 font-bold text-sm">âš ï¸ Tanınmayan Alanlar â€” EÅŸleme Seçin</div>
              {unknownFields.map((field) => (
                <div key={field} className="flex items-center gap-2.5">
                  <span className="font-mono text-xs bg-[rgba(0,0,0,0.3)] px-2.5 py-1 rounded text-[var(--color-warning)] text-center min-w-[120px]">
                    {field}
                  </span>
                  <span className="text-[var(--text-dim)] text-sm">â†’</span>
                  <select
                    value={fieldMappings[field] || ''}
                    onChange={(e) =>
                      setFieldMappings((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-mono"
                  >
                    <option value="">â€” Yoksay (aktarma)</option>
                    {Object.entries(KNOWN_ARRAYS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label} ({k})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => proceedToPreview(rawData, fieldMappings)}
              className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
            >
              Devam â†’ Ã–nizleme & Ã‡akıÅŸma Ã‡özümü
            </Button>
            <Button
              onClick={reset}
              className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            >
              Sıfırla
            </Button>
          </div>
        </div>
      )}

      {stage === 'preview' && (
        <div className="grid gap-3">
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-red-400 font-bold text-sm">âŒ Hatalar</div>
              {errors.map((e, i) => (
                <div key={i} className="text-red-400 text-xs">
                  â€¢ {e}
                </div>
              ))}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-amber-400 font-bold text-sm">âš ï¸ Uyarılar</div>
              {warnings.map((w, i) => (
                <div key={i} className="text-amber-400 text-xs">
                  â€¢ {w}
                </div>
              ))}
            </div>
          )}
          {Object.keys(stats).length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-blue-400 font-bold text-sm">ğŸ“Š İçe Aktarılacak Kayıtlar</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(stats).map(([k, v]) => (
                  <div key={k} className="bg-[var(--bg-card)] rounded-lg p-2 text-center">
                    <div className="text-foreground text-sm font-semibold">{v}</div>
                    <div className="text-[var(--text-dim)] text-sm">{KNOWN_ARRAYS[k] || k}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {conflicts.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-red-400 font-bold text-sm">âš¡ Ã‡akıÅŸma Ã‡özümü</div>
              {conflicts.map((c) => (
                <div key={c.entity} className="border-b border-[var(--border)] pb-3 mb-3">
                  <div className="text-red-400 text-xs">
                    <strong>{c.label}</strong>: {c.byId > 0 && `${c.byId} aynı ID`}
                    {c.byId > 0 && c.byName > 0 && ', '}
                    {c.byName > 0 && `${c.byName} aynı isim`} çakıÅŸması
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        setResolutions((r) => ({
                          ...r,
                          [c.entity]: 'overwrite',
                        }))
                      }
                      style={btnStyle(resolutions[c.entity] === 'overwrite', '#ef4444')}
                    >
                      ğŸ”„ Ãœzerine Yaz
                    </Button>
                    <Button
                      onClick={() => setResolutions((r) => ({ ...r, [c.entity]: 'skip' }))}
                      style={btnStyle(resolutions[c.entity] === 'skip', '#f59e0b')}
                    >
                      â­ï¸ Ã‡akıÅŸanları Atla
                    </Button>
                    <Button
                      onClick={() => setResolutions((r) => ({ ...r, [c.entity]: 'merge' }))}
                      style={btnStyle(resolutions[c.entity] === 'merge', '#10b981')}
                    >
                      ğŸ”€ BirleÅŸtir
                    </Button>
                  </div>
                  <div className="text-[var(--text-dim)] text-xs">
                    {resolutions[c.entity] === 'overwrite' && 'Mevcut kayıtlar yeni verilerle tamamen deÄŸiÅŸtirilir.'}
                    {resolutions[c.entity] === 'skip' &&
                      'Ã‡akıÅŸan kayıtlar atlanır; mevcut veriler korunur, yeni olanlar eklenir.'}
                    {resolutions[c.entity] === 'merge' &&
                      'Mevcut kayıtlar yeni alanlarla güncellenir; hiç kayıp olmaz.'}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2.5">
            {mapped && errors.length === 0 && (
              <Button
                onClick={doImport}
                className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
              >
                âœ… Aktarımı Onayla & BaÅŸlat
              </Button>
            )}
            <Button
              onClick={reset}
              className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            >
              Sıfırla
            </Button>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <div className="text-4xl mb-3">âœ…</div>
          <div className="text-green-400 font-bold">Veriler baÅŸarıyla aktarıldı!</div>
          <div className="text-muted-foreground text-xs">Sayfa yenileniyor...</div>
        </div>
      )}
    </Card>
  );
}

function VeriOnarim({
  db,
  save,
  showToast,
  showConfirm,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (title: string, msg: string, onOk: () => void, danger?: boolean) => void;
}) {
  const [results, setResults] = useState<string[]>([]);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const handleDetailedHealthCheck = async () => {
    setCheckingHealth(true);
    const report = await runHealthCheck(db as unknown as Record<string, unknown>);
    setHealthReport(report);
    setCheckingHealth(false);
  };

  const diagnose = () => {
    const issues: string[] = [];
    const saleIds = db.sales.map((s) => s.id);
    const dupSales = saleIds.length - new Set(saleIds).size;
    if (dupSales > 0) issues.push(`âš ï¸ ${dupSales} tekrarlanan satıÅŸ kaydı`);
    const negStock = db.products.filter((p) => p.stock < 0).length;
    if (negStock > 0) issues.push(`âš ï¸ ${negStock} ürünün stok deÄŸeri negatif`);
    const cariIds = new Set(db.cari.map((c) => c.id));
    const orphanKasa = db.kasa.filter((k) => k.cariId && !cariIds.has(k.cariId)).length;
    if (orphanKasa > 0) issues.push(`âš ï¸ ${orphanKasa} kasa kaydı silinmiÅŸ cariye baÄŸlı`);
    const soldProductIds = new Set(
      db.sales.flatMap((s) => s.items?.map((i: { productId: string }) => i.productId) || [s.productId]).filter(Boolean),
    );
    const stocklessProducts = db.products.filter((p) => soldProductIds.has(p.id) && p.stock === 0).length;
    if (stocklessProducts > 0) issues.push(`â„¹ï¸ ${stocklessProducts} ürün satıldı ama stok sıfır`);
    if (!db.company.name) issues.push('â„¹ï¸ Şirket adı girilmemiÅŸ');
    const lsSize = new Blob([localStorage.getItem('sobaYonetim') || '']).size;
    const lsKB = Math.round(lsSize / 1024);
    issues.push(`ğŸ“Š localStorage boyutu: ${lsKB} KB (limit ~5MB)`);
    const orphanInvoices = (db.invoices || []).filter((inv) => inv.cariId && !cariIds.has(inv.cariId)).length;
    if (orphanInvoices > 0) issues.push(`âš ï¸ ${orphanInvoices} fatura silinmiÅŸ cariye baÄŸlı`);
    setResults(issues.length === 0 ? ['âœ… Veri tutarlılık kontrolü tamam. Sorun bulunamadı!'] : issues);
  };

  const fixNegativeStock = () => {
    showConfirm('Stok Düzelt', 'Negatif stoklar sıfıra çekilecek. Devam edilsin mi?', () => {
      save((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.stock < 0 ? { ...p, stock: 0 } : p)),
      }));
      showToast('Negatif stoklar düzeltildi!');
      diagnose();
    });
  };

  const fixOrphanKasa = () => {
    showConfirm(
      'Orphan Temizle',
      'SilinmiÅŸ cariye ait kasa kayıtlarındaki cari baÄŸlantısı kaldırılacak. Devam?',
      () => {
        const cariIds = new Set(db.cari.map((c) => c.id));
        save((prev) => ({
          ...prev,
          kasa: prev.kasa.map((k) => (k.cariId && !cariIds.has(k.cariId) ? { ...k, cariId: undefined } : k)),
        }));
        showToast('Orphan kasa kayıtları düzeltildi!');
        diagnose();
      },
    );
  };

  const recalcCariBalance = () => {
    showConfirm(
      'Bakiye Yeniden Hesapla',
      'Tüm cari bakiyeleri kasa iÅŸlemlerine göre sıfırdan hesaplanacak. Mevcut bakiyeler SIFIRLANACAK!',
      () => {
        save((prev) => {
          const cari = prev.cari.map((c) => {
            const kasaEntries = prev.kasa.filter((k) => k.cariId === c.id);
            const newBalance = kasaEntries.reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
            return { ...c, balance: newBalance };
          });
          return { ...prev, cari };
        });
        showToast('Cari bakiyeler yeniden hesaplandı!');
        diagnose();
      },
      true,
    );
  };

  const removeDupSales = () => {
    showConfirm('Tekrarları Temizle', "Aynı ID'li tekrarlanan satıÅŸ kayıtları silinecek. Devam edilsin mi?", () => {
      save((prev) => {
        const seen = new Set<string>();
        return {
          ...prev,
          sales: prev.sales.filter((s) => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
          }),
        };
      });
      showToast('Tekrarlanan satıÅŸlar temizlendi!');
      diagnose();
    });
  };

  const mergeduplicateCari = () => {
    const nameCounts: Record<string, string[]> = {};
    db.cari.forEach((c) => {
      const n = c.name.trim().toLowerCase();
      if (!nameCounts[n]) nameCounts[n] = [];
      nameCounts[n].push(c.id);
    });
    const dups = Object.entries(nameCounts).filter(([, ids]) => ids.length > 1);
    if (dups.length === 0) {
      showToast('Tekrarlanan cari bulunamadı!');
      return;
    }
    showConfirm(
      'Cari BirleÅŸtir',
      `${dups.length} isimde tekrar var. İlk kayıt korunacak. Devam?`,
      () => {
        save((prev) => {
          const toRemove = new Set<string>();
          dups.forEach(([, ids]) => ids.slice(1).forEach((id) => toRemove.add(id)));
          return {
            ...prev,
            cari: prev.cari.filter((c) => !toRemove.has(c.id)),
          };
        });
        showToast(`${dups.length} grup birleÅŸtirildi!`);
        diagnose();
      },
      true,
    );
  };

  return (
    <div className="grid gap-4">
      <Card title="ğŸ”§ Veri Tutarlılık Kontrolü">
        <p className="text-muted-foreground text-sm">
          Veritabanınızı analiz ederek tutarsız, eksik veya hatalı kayıtları tespit edin.
        </p>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={diagnose}
            className="px-3 py-2.5 rounded-xl font-bold text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex-1"
            style={{ flex: 1 }}
          >
            ğŸ” Hızlı Analiz
          </Button>
          <Button
            onClick={handleDetailedHealthCheck}
            disabled={checkingHealth}
            className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
            style={{ flex: 1 }}
          >
            {checkingHealth ? 'âŒ› Analiz Ediliyor...' : 'ğŸ›¡ï¸ Tam Sistem Taraması'}
          </Button>
        </div>

        {healthReport && (
          <div className="mt-4 grid gap-2">
            <div
              style={{
                padding: '12px',
                borderRadius: 12,
                background: healthReport.overall === 'healthy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${healthReport.overall === 'healthy' ? '#10b981' : '#ef4444'}40`,
                textAlign: 'center',
              }}
            >
              <div
                className="text-foreground font-extrabold text-lg"
                style={{
                  color: healthReport.overall === 'healthy' ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {healthReport.overall === 'healthy' ? 'âœ… Sistem SaÄŸlıklı' : 'âš ï¸ Sistemde Sorunlar Var'}(
                {healthReport.score}/100)
              </div>
            </div>

            {healthReport.metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-2.5 border-b border-[var(--border)]">
                <div className="flex-1">
                  <div className="text-foreground font-bold text-sm">{m.name}</div>
                  <div className="text-[var(--text-dim)] text-xs">{m.detail}</div>
                </div>
                <div
                  className={
                    m.status === 'healthy'
                      ? 'inline-flex items-center rounded-md border border-transparent bg-green-500/20 text-green-400 px-2.5 py-0.5 text-xs font-semibold'
                      : m.status === 'degraded'
                        ? 'inline-flex items-center rounded-md border border-transparent bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs font-semibold'
                        : 'inline-flex items-center rounded-md border border-transparent bg-red-500/20 text-red-400 px-2.5 py-0.5 text-xs font-semibold'
                  }
                >
                  {m.value}
                  {m.unit || ''}
                </div>
              </div>
            ))}

            {healthReport.recommendations.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm">
                <div className="text-blue-400 font-bold text-sm">ğŸ’¡ Ã–neriler:</div>
                {healthReport.recommendations.map((rec, i) => (
                  <div key={i} className="text-muted-foreground text-xs">
                    â€¢ {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="grid gap-1.5">
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  background: r.startsWith('âœ…')
                    ? 'rgba(16,185,129,0.08)'
                    : r.startsWith('ğŸ“Š')
                      ? 'rgba(59,130,246,0.08)'
                      : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${r.startsWith('âœ…') ? 'rgba(16,185,129,0.2)' : r.startsWith('ğŸ“Š') ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  borderRadius: 9,
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                }}
              >
                {r}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="ğŸ› ï¸ Onarım Araçları">
        <div className="grid gap-2.5">
          {[
            {
              label: 'ğŸ“¦ Negatif Stokları Sıfırla',
              desc: "Stok deÄŸeri 0'ın altına düÅŸmüÅŸ ürünleri sıfıra çeker",
              action: fixNegativeStock,
              color: '#f59e0b',
            },
            {
              label: 'ğŸ”— Orphan Kasa BaÄŸlantılarını Temizle',
              desc: 'SilinmiÅŸ cariye baÄŸlı kasa kayıtlarındaki baÄŸlantıyı kaldırır',
              action: fixOrphanKasa,
              color: '#3b82f6',
            },
            {
              label: 'âš–ï¸ Cari Bakiyeleri Yeniden Hesapla',
              desc: 'Tüm bakiyeleri kasa iÅŸlemlerine göre baÅŸtan hesaplar',
              action: recalcCariBalance,
              color: '#8b5cf6',
            },
            {
              label: 'ğŸ—‘ï¸ Tekrarlayan SatıÅŸ Kayıtlarını Temizle',
              desc: 'Aynı ID ile çift kaydedilmiÅŸ satıÅŸları siler',
              action: removeDupSales,
              color: '#10b981',
            },
            {
              label: 'ğŸ¤ Aynı İsimli Cari Hesapları BirleÅŸtir',
              desc: 'Aynı isimde birden fazla cari varsa tek kayıt bırakır',
              action: mergeduplicateCari,
              color: '#ef4444',
            },
          ].map((t) => (
            <div
              key={t.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'var(--bg-card)',
                borderRadius: 10,
                border: `1px solid ${t.color}15`,
              }}
            >
              <div className="flex-1">
                <div className="text-foreground text-sm font-semibold">{t.label}</div>
                <div className="text-[var(--text-dim)] text-xs">{t.desc}</div>
              </div>
              <Button
                onClick={t.action}
                style={{
                  background: `${t.color}15`,
                  border: `1px solid ${t.color}30`,
                  borderRadius: 8,
                  color: t.color,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                }}
              >
                Uygula
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="ğŸ“‹ Sistem Bilgileri">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[
            {
              label: 'Toplam Kayıt',
              value: `${[db.products, db.sales, db.cari, db.kasa, db.invoices || [], db.budgets || []].reduce((s, a) => s + a.length, 0)} kayıt`,
            },
            {
              label: 'localStorage Boyutu',
              value: `${Math.round(new Blob([localStorage.getItem('sobaYonetim') || '']).size / 1024)} KB`,
            },
            { label: 'Uygulama Versiyonu', value: `v${db._version || 1}` },
            {
              label: 'Son Veri Güncellemesi',
              value:
                db.kasa.length > 0
                  ? new Date(
                      Math.max(...db.kasa.map((k) => new Date(k.updatedAt || k.createdAt).getTime())),
                    ).toLocaleDateString('tr-TR')
                  : '-',
            },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
              <div className="text-[var(--text-dim)] text-xs">{s.label}</div>
              <div className="text-foreground text-sm font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DangerAction({ label, desc, onConfirm }: { label: string; desc: string; onConfirm: () => void }) {
  const { showConfirm } = useConfirm();
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="text-foreground text-xs">{label}</div>
        <div className="text-[var(--text-dim)] text-xs">{desc}</div>
      </div>
      <Button
        onClick={() => showConfirm(label, `${desc}. Bu iÅŸlem geri alınamaz!`, onConfirm, true)}
        className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs"
      >
        Temizle
      </Button>
    </div>
  );
}

// BaglantiAyarlari moved to ./SettingsBaglanti

// ArayuzAyarlari moved to ./SettingsArayuz

function FV({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[var(--text-muted)]">{label}</Label>
      <Input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// â”€â”€ Kategori Yönetim Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KategoriYonetim({ db, save }: { db: DB; save: (fn: (prev: DB) => DB) => void }) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const cats = db.productCategories || [];
  const [yeniAd, setYeniAd] = useState('');
  const [yeniIcon, setYeniIcon] = useState('ğŸ“¦');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', icon: '' });

  const addKat = () => {
    const ad = yeniAd.trim();
    if (!ad) {
      showToast('Kategori adı gerekli!', 'error');
      return;
    }
    const id = ad
      .toLowerCase()
      .replace(/ÄŸ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ÅŸ/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    if (cats.find((c) => c.id === id)) {
      showToast('Bu ID zaten var!', 'error');
      return;
    }
    const nowIso = new Date().toISOString();
    save((prev) => ({
      ...prev,
      productCategories: [...(prev.productCategories || []), { id, name: ad, icon: yeniIcon, createdAt: nowIso }],
    }));
    setYeniAd('');
    setYeniIcon('ğŸ“¦');
    showToast('Kategori eklendi!', 'success');
  };

  const saveEdit = (id: string) => {
    if (!editForm.name.trim()) {
      showToast('Ad gerekli!', 'error');
      return;
    }
    save((prev) => ({
      ...prev,
      productCategories: (prev.productCategories || []).map((c) =>
        c.id === id ? { ...c, name: editForm.name.trim(), icon: editForm.icon || c.icon } : c,
      ),
    }));
    setEditId(null);
    showToast('Güncellendi!', 'success');
  };

  const deleteKat = (id: string) => {
    const used = db.products.filter((p) => !p.deleted && p.category === id).length;
    if (used > 0) {
      showToast(`${used} ürün bu kategoriyi kullanıyor, silemezsiniz!`, 'error');
      return;
    }
    showConfirm('Kategori Sil', 'Bu kategoriyi silmek istiyor musunuz?', () => {
      save((prev) => ({
        ...prev,
        productCategories: (prev.productCategories || []).filter((c) => c.id !== id),
      }));
      showToast('Kategori silindi!', 'success');
    });
  };

  return (
    <Card title="ğŸ·ï¸ Ãœrün Kategorileri">
      <div className="flex flex-col gap-3">
        {cats.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Henüz kategori yok</div>}
        {cats.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            {editId === c.id ? (
              <>
                <input
                  value={editForm.icon}
                  onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
                  className={`${inpBase} w-[48px] text-center text-lg`}
                  style={{ padding: '6px' }}
                  maxLength={2}
                />
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className={`${inpBase} flex-1 p-[7px_10px]`}
                  autoFocus
                />
                <Button
                  onClick={() => saveEdit(c.id)}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs bg-green-500/20 text-green-500 hover:bg-green-500/30"
                >
                  âœ“
                </Button>
                <Button
                  onClick={() => setEditId(null)}
                  className="px-2.5 py-1.5 rounded-lg font-medium text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                >
                  âœ•
                </Button>
              </>
            ) : (
              <>
                <span className="text-lg">{c.icon}</span>
                <span className="text-foreground font-semibold">{c.name}</span>
                <span className="text-[var(--text-dim)] text-xs font-mono">{c.id}</span>
                <span className="text-[var(--text-dim)] text-xs">
                  {db.products.filter((p) => !p.deleted && p.category === c.id).length} ürün
                </span>
                <Button
                  onClick={() => {
                    setEditId(c.id);
                    setEditForm({ name: c.name, icon: c.icon });
                  }}
                  className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                >
                  âœï¸
                </Button>
                <Button
                  onClick={() => deleteKat(c.id)}
                  className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs"
                >
                  ğŸ—‘ï¸
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={yeniIcon}
          onChange={(e) => setYeniIcon(e.target.value)}
          className={`${inpBase} w-[52px] text-center text-xl`}
          placeholder="ğŸ“¦"
          maxLength={2}
        />
        <input
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addKat()}
          className={`${inpBase} flex-1`}
          placeholder="Yeni kategori adı..."
        />
        <Button onClick={addKat} className="btn-primary px-4 py-2 rounded-xl font-bold text-sm">
          + Ekle
        </Button>
      </div>
      <p className="text-[var(--text-dim)] text-xs mt-2">Ãœrünleri kullanan kategoriler silinemez.</p>
    </Card>
  );
}

// â”€â”€ Hakkında Paneli â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AboutPanel({ db }: { db: DB }) {
  const totalRecords = [db.products, db.sales, db.cari, db.kasa, db.invoices || [], db.orders, db.suppliers].reduce(
    (s, a) => s + a.length,
    0,
  );
  const lsKB = Math.round(new Blob([localStorage.getItem('sobaYonetim') || '']).size / 1024);

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
      {/* Logo & BaÅŸlık */}
      <div className="text-center py-6">
        <div className="text-4xl mb-2">{appCfg.appIcon}</div>
        <h2 className="text-foreground text-lg font-bold">{appCfg.appName}</h2>
        <p className="text-foreground text-sm">{APP_SUBTITLE}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Versiyon â€” tıklanabilir */}
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
                âœ“
              </Button>
              <Button
                onClick={() => {
                  setEditVersion(false);
                  setVersionErr('');
                }}
                className="px-2.5 py-1.5 rounded-lg font-medium text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
              >
                âœ•
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
              v{appCfg.version} âœï¸
            </Button>
          )}
          <span className="inline-flex items-center rounded-md border border-[var(--border)] px-2.5 py-0.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
            DB v{db._version || 1}
          </span>
          <span className="inline-flex items-center rounded-md border border-transparent bg-green-500/20 text-green-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
            {totalRecords} kayıt Â· {lsKB} KB
          </span>
        </div>
      </div>

      {/* Teknoloji Stack */}
      <Card title="âš™ï¸ Teknoloji">
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

      {/* Veritabanı Ã–zeti */}
      <Card title="ğŸ—„ï¸ Veritabanı Ã–zeti">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              icon: 'ğŸ“¦',
              label: 'Ãœrünler',
              count: db.products.filter((p) => !p.deleted).length,
            },
            {
              icon: 'ğŸ›’',
              label: 'SatıÅŸlar',
              count: db.sales.filter((s) => !s.deleted).length,
            },
            {
              icon: 'ğŸ‘¤',
              label: 'Cari',
              count: db.cari.filter((c) => !c.deleted).length,
            },
            {
              icon: 'ğŸ’°',
              label: 'Kasa Kayıtları',
              count: db.kasa.filter((k) => !k.deleted).length,
            },
            {
              icon: 'ğŸ§¾',
              label: 'Faturalar',
              count: (db.invoices || []).filter((i) => !i.deleted).length,
            },
            { icon: 'ğŸ­', label: 'Tedarikçiler', count: db.suppliers.length },
            { icon: 'ğŸ“‹', label: 'SipariÅŸler', count: db.orders.length },
            {
              icon: 'ğŸ“ˆ',
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

      {/* Sürüm KitapçıÄŸı â€” Changelog */}
      <Card title="ğŸ“– Sürüm GeçmiÅŸi">
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
                {/* BaÅŸlık satırı */}
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
                    â–¼
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
      <Card title="ğŸ“„ Lisans & GeliÅŸtirici">
        <div className="grid gap-2.5">
          {[
            { label: 'Uygulama', value: `${appCfg.appName} â€” ${APP_SUBTITLE}` },
            { label: 'GeliÅŸtirici', value: 'Pars Pelet' },
            { label: 'Lisans', value: 'Ã–zel Kullanım â€” Tüm hakları saklıdır' },
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

// â”€â”€ Agent Settings Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AgentSettingsPanel({ db: _db, save: _save }: { db: DB; save: (fn: (prev: DB) => DB) => void }) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [agentSettings, setAgentSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('sobaYonetim');
      if (!raw) return getDefaultAgentSettings();
      const parsed = JSON.parse(raw);
      return parsed.agentSettings || getDefaultAgentSettings();
    } catch {
      logger.warn('settings', "Ajan ayarları localStorage'dan okunamadı, varsayılan kullanıldı");
      return getDefaultAgentSettings();
    }
  });

  const agents = [
    {
      id: 'stok',
      name: 'Stok Ajanı',
      icon: 'ğŸ“¦',
      desc: 'Ãœrün stok yönetimi ve uyarıları',
      permissions: ['stok.read', 'stok.write'],
    },
    {
      id: 'kasa',
      name: 'Kasa Ajanı',
      icon: 'ğŸ’°',
      desc: 'Kasa iÅŸlemleri ve nakit yönetimi',
      permissions: ['kasa.read', 'kasa.write'],
    },
    {
      id: 'cari',
      name: 'Cari Ajanı',
      icon: 'ğŸ‘¤',
      desc: 'MüÅŸteri ve tedarikçi yönetimi',
      permissions: ['cari.read', 'cari.write'],
    },
    {
      id: 'satis',
      name: 'SatıÅŸ Ajanı',
      icon: 'ğŸ›’',
      desc: 'SatıÅŸ iÅŸlemleri ve raporlama',
      permissions: ['satis.read', 'satis.write'],
    },
    {
      id: 'fatura',
      name: 'Fatura Ajanı',
      icon: 'ğŸ§¾',
      desc: 'Fatura oluÅŸturma ve yönetimi',
      permissions: ['fatura.read', 'fatura.write'],
    },
    {
      id: 'rapor',
      name: 'Rapor Ajanı',
      icon: 'ğŸ“Š',
      desc: 'Raporlar ve analitik',
      permissions: ['rapor.read'],
    },
    {
      id: 'deep_seek',
      name: 'DeepSeek Ajanı',
      icon: 'ğŸ¤–',
      desc: 'Yapay zeka destekli analiz ve öneriler',
      permissions: ['deep_seek.read', 'deep_seek.write'],
    },
  ];

  const saveAgentSettings = () => {
    try {
      const raw = localStorage.getItem('sobaYonetim');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.agentSettings = agentSettings;
      localStorage.setItem('sobaYonetim', JSON.stringify(parsed));
      showToast('Ajan ayarları kaydedildi!', 'success');
    } catch {
      logger.warn('settings', 'Ajan ayarları kaydedilemedi');
      showToast('Ayarlar kaydedilemedi!', 'error');
    }
  };

  const toggleAgent = (agentId: string) => {
    setAgentSettings((prev: Record<string, unknown>) => ({
      ...prev,
      [agentId]: {
        ...(prev[agentId] as Record<string, unknown>),
        enabled: !((prev[agentId] as Record<string, unknown>)?.enabled as boolean),
      },
    }));
  };

  const togglePermission = (agentId: string, permission: string) => {
    setAgentSettings((prev: Record<string, unknown>) => {
      const agent = prev[agentId] as Record<string, unknown>;
      const perms = (agent?.permissions as string[]) || [];
      const updated = perms.includes(permission) ? perms.filter((p) => p !== permission) : [...perms, permission];
      return {
        ...prev,
        [agentId]: { ...agent, permissions: updated },
      };
    });
  };

  const resetToDefaults = () => {
    showConfirm(
      'Varsayılan Ayarlara Dön',
      'Tüm ajan ayarları varsayılan deÄŸerlere sıfırlanacak. Emin misiniz?',
      () => {
        setAgentSettings(getDefaultAgentSettings());
        showToast('Varsayılan ayarlara döndü!', 'success');
      },
    );
  };

  return (
    <div className="grid gap-4">
      <Card title="ğŸ¤– Ajan Yönetimi">
        <p className="text-muted-foreground text-sm">
          Sistemdeki ajanları etkinleÅŸtirin/devre dıÅŸı bırakın ve izinlerini yönetin.
        </p>

        <div className="grid gap-2">
          {agents.map((agent) => {
            const settings = (agentSettings[agent.id] as Record<string, unknown>) || {
              enabled: true,
              permissions: agent.permissions,
            };
            const enabled = settings.enabled as boolean;
            const perms = (settings.permissions as string[]) || [];

            return (
              <div
                key={agent.id}
                style={{
                  background: enabled ? 'rgba(255,87,34,0.05)' : 'rgba(0,0,0,0.3)',
                  borderRadius: 12,
                  border: `1px solid ${enabled ? 'rgba(255,87,34,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  padding: '16px',
                  opacity: enabled ? 1 : 0.6,
                }}
              >
                {/* BaÅŸlık */}
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.4rem' }}>{agent.icon}</span>
                  <div className="flex-1">
                    <div className="text-foreground text-sm font-semibold">{agent.name}</div>
                    <div className="text-[var(--text-dim)] text-xs">{agent.desc}</div>
                  </div>
                  <Button
                    onClick={() => toggleAgent(agent.id)}
                    style={{
                      padding: '6px 12px',
                      background: enabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${enabled ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
                      borderRadius: 8,
                      color: enabled ? 'var(--color-success)' : 'var(--color-danger)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {enabled ? 'âœ“ Aktif' : 'âœ• Pasif'}
                  </Button>
                </div>

                {/* İzinler */}
                {enabled && (
                  <div className="grid gap-2">
                    <div className="text-[var(--text-dim)] text-xs">İzinler:</div>
                    {agent.permissions.map((perm) => (
                      <label
                        key={perm}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '6px 0',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={perms.includes(perm)}
                          onChange={() => togglePermission(agent.id, perm)}
                          style={{
                            cursor: 'pointer',
                            accentColor: 'var(--color-danger)',
                          }}
                        />
                        <span className="text-muted-foreground text-xs">{perm}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={saveAgentSettings} className="btn-primary w-full py-3 rounded-xl font-bold text-sm">
            ğŸ’¾ Ajan Ayarlarını Kaydet
          </Button>
          <Button
            onClick={resetToDefaults}
            className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          >
            â†º Varsayılana Dön
          </Button>
        </div>
      </Card>

      {/* Ajan İstatistikleri */}
      <Card title="ğŸ“Š Ajan İstatistikleri">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Aktif Ajanlar',
              count: agents.filter((a) => (agentSettings[a.id] as Record<string, unknown>)?.enabled !== false).length,
              icon: 'âœ“',
              color: '#10b981',
            },
            {
              label: 'Toplam İzin',
              count: Object.values(agentSettings).reduce(
                (sum: number, agent) =>
                  sum + ((agent as Record<string, unknown>)?.permissions as string[])?.length || 0,
                0,
              ),
              icon: 'ğŸ”',
              color: '#f59e0b',
            },
            {
              label: 'Yapılandırılan',
              count: Object.keys(agentSettings).length,
              icon: 'âš™ï¸',
              color: '#3b82f6',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 10,
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  color: stat.color,
                  marginBottom: '4px',
                }}
              >
                {stat.count}
              </div>
              <div className="text-[var(--text-dim)] text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Ajan Açıklaması */}
      <Card title="â„¹ï¸ Ajan Açıklaması">
        <div className="grid gap-2">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-foreground text-sm font-semibold">ğŸ¤– Ajanlar Nedir?</div>
            <p className="text-muted-foreground text-xs">
              Ajanlar, uygulamanın belirli görevleri otomatik olarak yerine getirmesine yardımcı olan yapay zeka
              bileÅŸenleridir. Her ajan belirli bir alan (stok, kasa, satıÅŸ vb.) üzerinde çalıÅŸır.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-foreground text-sm font-semibold">ğŸ” İzinler Nedir?</div>
            <p className="text-muted-foreground text-xs">
              İzinler, her ajanın hangi iÅŸlemleri yapabileceÄŸini kontrol eder. "read" = okuma, "write" =
              yazma/deÄŸiÅŸtirme. Güvenlik için sadece gerekli izinleri verin.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-foreground text-sm font-semibold">âš¡ EtkinleÅŸtirme/Devre DıÅŸı Bırakma</div>
            <p className="text-muted-foreground text-xs">
              Ajanları geçici olarak devre dıÅŸı bırakabilirsiniz. Devre dıÅŸı bırakılan ajanlar hiçbir iÅŸlem yapmaz ve
              sistem performansını etkilemez.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function getDefaultAgentSettings(): Record<string, unknown> {
  return {
    stok: {
      enabled: true,
      permissions: ['stok.read', 'stok.write'],
    },
    kasa: {
      enabled: true,
      permissions: ['kasa.read', 'kasa.write'],
    },
    cari: {
      enabled: true,
      permissions: ['cari.read', 'cari.write'],
    },
    satis: {
      enabled: true,
      permissions: ['satis.read', 'satis.write'],
    },
    fatura: {
      enabled: true,
      permissions: ['fatura.read', 'fatura.write'],
    },
    rapor: {
      enabled: true,
      permissions: ['rapor.read'],
    },
    deep_seek: {
      enabled: false,
      permissions: ['deep_seek.read'],
    },
  };
}
