import { useConfirm } from '@/components/ConfirmDialog';
import { SystemMap } from '@/components/SystemMap';
import { useToast } from '@/components/Toast';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { applyUIPrefs, loadUIPrefs, saveUIPrefs, type UIPrefs } from '@/hooks/useUIPrefs';
import { loadConnConfig, saveConnConfig, type ConnConfig } from '@/lib/connConfig';
import ExcelImport from '@/pages/ExcelImport';
import type { DB } from '@/types';
import { logger } from '@/lib/logger';
import { WIDGET_OPTIONS, type WidgetId } from '@/config/widgets';

import { useState } from 'react';
import { SettingsCompany } from './settings/SettingsCompany';
import { SoundSettingsPanel } from './settings/SettingsSound';
import { SecurityPanel } from './settings/SettingsSecurity';
import { ExcelExportPanel } from './settings/SettingsExcel';
import { ActivityPanel } from './settings/SettingsActivity';
import { FullRestorePanel, SelectiveRestore, SmartImportManager } from './settings/SettingsBackup';
import { DataPanel } from './settings/SettingsData';
import { SettingsPeletPanel } from './settings/SettingsPelet';
import { VeriOnarim } from './settings/SettingsRepair';
import { ShortcutsPanel } from './settings/SettingsShortcuts';
import { KategoriYonetim } from './settings/SettingsKategoriYonetim';
import { AgentSettingsPanel } from './settings/SettingsAgentPanel';
import { SettingsVergi } from './settings/SettingsVergi';
import { SettingsNotifications } from './settings/SettingsNotifications';
import { SettingsFatura } from './settings/SettingsFatura';
import { SettingsBakim } from './settings/SettingsBakim';
import { ArayuzAyarlari } from './SettingsArayuz';
import { BaglantiAyarlari } from './SettingsBaglanti';
import { Card } from './SettingsCard';
import { Button } from '@/components/ui/button';
import Roadmap from './settings/content/Roadmap';
import About from './settings/content/About';
import Changelog from './settings/content/Changelog';
import Support from './settings/content/Support';

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
  | 'vergi'
  | 'bildirim'
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
  | 'fatura'
  | 'bakim'
  | 'security'
  | 'sysmap'
  | 'about'
  | 'roadmap'
  | 'changelog'
  | 'support';

interface SettingsCategory {
  id: string;
  label: string;
  icon: string;
  tabs: { id: Tab; label: string; icon: string }[];
}

const CATEGORIES: SettingsCategory[] = [
  {
    id: 'genel',
    label: 'Genel',
    icon: '🏠',
    tabs: [
      { id: 'arayuz', label: 'Arayüz', icon: '🎨' },
      { id: 'baglantilar', label: 'Bağlantılar', icon: '🔌' },
      { id: 'company', label: 'Şirket', icon: '🏢' },
      { id: 'vergi', label: 'Vergi', icon: '💰' },
    ],
  },
  {
    id: 'veri',
    label: 'Veri & İçe Aktarma',
    icon: '📂',
    tabs: [
      { id: 'categories', label: 'Kategoriler', icon: '🏷️' },
      { id: 'excel', label: 'İçe Aktar', icon: '📥' },
      { id: 'excel_export', label: 'Excel Dışa Aktar', icon: '📊' },
      { id: 'data', label: 'Veri Yönetimi', icon: '📂' },
    ],
  },
  {
    id: 'yedek',
    label: 'Yedek & Onarım',
    icon: '💾',
    tabs: [
      { id: 'backup', label: 'Yedek Al', icon: '💾' },
      { id: 'repair', label: 'Onarım', icon: '🔧' },
    ],
  },
  {
    id: 'ai',
    label: 'AI & Otomasyon',
    icon: '🤖',
    tabs: [
      { id: 'agent', label: 'Agentlar', icon: '🤖' },
      { id: 'pellet', label: 'Pelet', icon: '🪵' },
      { id: 'sound', label: 'Ses', icon: '🔊' },
      { id: 'bildirim', label: 'Bildirimler', icon: '🔔' },
    ],
  },
  {
    id: 'guvenlik',
    label: 'Güvenlik & Kısayollar',
    icon: '🔒',
    tabs: [
      { id: 'security', label: 'Güvenlik', icon: '🔒' },
      { id: 'shortcuts', label: 'Kısayollar', icon: '⌨' },
      { id: 'activity', label: 'Aktivite', icon: '📋' },
    ],
  },
  {
    id: 'hakkinda',
    label: 'Sistem & Bilgi',
    icon: 'ℹ️',
    tabs: [
      { id: 'fatura', label: 'Fatura', icon: '🧾' },
      { id: 'bakim', label: 'Bakım', icon: '⚡' },
      { id: 'sysmap', label: 'Harita', icon: '🗺️' },
      { id: 'about', label: 'Hakkında', icon: 'ℹ️' },
      { id: 'roadmap', label: 'Yol Haritası', icon: '🚀' },
      { id: 'changelog', label: 'Güncellemeler', icon: '📜' },
      { id: 'support', label: 'Destek', icon: '🆘' },
    ],
  },
];

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
      logger.warn('settings', "Dashboard tercihleri localStorage'dan okunamadı");
    }
    return { leftWidgets: ['chart', 'recentSales', 'tips', 'excelBar'], brightness: 100 };
  });

  const saveDashboardPrefs = (patch: Partial<{ leftWidgets: WidgetId[]; brightness: number }>) => {
    const next = { ...dashboardPrefs, ...patch };
    setDashboardPrefs(next);
    try {
      localStorage.setItem('dashboardPrefs', JSON.stringify(next));
    } catch {
      logger.warn('settings', "Dashboard tercihleri localStorage'a yazılamadı");
    }
  };

  const savePellet = () => {
    save((prev) => ({ ...prev, pelletSettings: { ...pellet } }));
    showToast('Pelet ayarları kaydedildi!', 'success');
  };

  const dataStats = [
    { label: 'Ürünler', count: db.products.length, icon: '📦' },
    { label: 'Satışlar', count: db.sales.length, icon: '🛒' },
    { label: 'Tedarikçiler', count: db.suppliers.length, icon: '🏭' },
    { label: 'Cari Hesaplar', count: db.cari.length, icon: '👤' },
    { label: 'Kasa İşlemleri', count: db.kasa.length, icon: '💰' },
    { label: 'Banka İşlemleri', count: db.bankTransactions.length, icon: '🏦' },
    { label: 'Pelet Tedarikçi', count: db.peletSuppliers.length, icon: '🪵' },
    { label: 'Boru Tedarikçi', count: db.boruSuppliers.length, icon: '🔩' },
  ];

  const totalRecords = dataStats.reduce((s, d) => s + d.count, 0);

  const activeCategory = CATEGORIES.find((cat) => cat.tabs.some((t) => t.id === tab))?.id || 'genel';

  const renderContent = () => {
    switch (tab) {
      case 'arayuz':
        return (
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
        );
      case 'baglantilar':
        return (
          <BaglantiAyarlari
            cfg={connCfg}
            onChange={(c) => {
              setConnCfg(c);
              saveConnConfig(c);
            }}
            showToast={showToast}
          />
        );
      case 'company':
        return <SettingsCompany db={db} save={save} showToast={showToast} />;
      case 'vergi':
        return <SettingsVergi showToast={showToast} />;
      case 'bildirim':
        return <SettingsNotifications showToast={showToast} />;
      case 'pellet':
        return (
          <SettingsPeletPanel
            pellet={pellet}
            onChange={(key, value) => setPellet((p) => ({ ...p, [key]: value }))}
            onSave={savePellet}
          />
        );
      case 'sound':
        return <SoundSettingsPanel playSound={playSound} />;
      case 'agent':
        return <AgentSettingsPanel db={db} save={save} />;
      case 'backup':
        return (
          <div className="grid gap-4">
            <Card title="📤 Yedek Al">
              <p className="text-muted-foreground text-sm">
                Tüm verilerinizi <strong className="text-orange-400 font-semibold">JSON formatında</strong> dışa
                aktarın.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dataStats.slice(0, 4).map((d) => (
                  <div key={d.label} className="bg-card rounded-xl p-3 text-center border border-white/5">
                    <div className="text-lg mb-1">{d.icon}</div>
                    <div className="text-lg font-bold text-foreground">{d.count}</div>
                    <div className="text-muted-foreground text-xs">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-muted-foreground mt-3">
                Toplam {totalRecords} kayıt yedeklenecek
              </div>
              <Button
                onClick={exportJSON}
                className="btn-primary btn-green w-full py-3 rounded-xl font-bold text-sm mt-3"
              >
                Yedeği İndir (.json)
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
        );
      case 'excel_export':
        return <ExcelExportPanel db={db} />;
      case 'activity':
        return (
          <ActivityPanel
            db={db}
            save={save}
            showToast={showToast}
            showConfirm={showConfirm as (t: string, m: string, ok: () => void, d?: boolean) => void}
          />
        );
      case 'shortcuts':
        return <ShortcutsPanel />;
      case 'repair':
        return (
          <VeriOnarim
            db={db}
            save={save}
            showToast={showToast}
            showConfirm={showConfirm as (title: string, msg: string, onOk: () => void, danger?: boolean) => void}
          />
        );
      case 'excel':
        return <ExcelImport db={db} save={save} />;
      case 'categories':
        return <KategoriYonetim db={db} save={save} />;
      case 'data':
        return (
          <DataPanel
            db={db}
            save={save}
            showToast={showToast}
            showConfirm={showConfirm as (t: string, m: string, ok: () => void, d?: boolean) => void}
          />
        );
      case 'security':
        return <SecurityPanel showToast={showToast} />;
      case 'fatura':
        return <SettingsFatura showToast={showToast} />;
      case 'bakim':
        return (
          <SettingsBakim
            showToast={showToast}
            showConfirm={showConfirm as (t: string, m: string, ok: () => void, d?: boolean) => void}
          />
        );
      case 'sysmap':
        return (
          <div className="grid gap-4">
            <Card title="🗺️ Sistem Haritası — Modüller Arası İlişkiler">
              <p className="text-muted-foreground text-sm">
                Her modülün diğer modülleri nasıl etkilediğini gösteren akış diyagramı.
              </p>
              <SystemMap />
            </Card>
          </div>
        );
      case 'about':
        return <About />;
      case 'roadmap':
        return <Roadmap />;
      case 'changelog':
        return <Changelog />;
      case 'support':
        return <Support />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⚙️</span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Ayarlar</h1>
          <p className="text-xs text-muted-foreground">Tüm uygulama ayarlarını buradan yönetin</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sol Sidebar - Kategoriler */}
        <div className="md:w-64 shrink-0 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-white/5 overflow-hidden bg-card">
                <div
                  className={`px-3 py-2.5 text-sm font-semibold text-foreground flex items-center gap-2 ${activeCategory === cat.id ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <div className="px-2 pb-2 space-y-0.5">
                  {cat.tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                        tab === t.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }`}
                    >
                      <span className="text-xs">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ İçerik */}
        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>
    </div>
  );
}
