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
import { AboutPanel } from './settings/SettingsAboutPanel';
import { AgentSettingsPanel } from './settings/SettingsAgentPanel';
import { ArayuzAyarlari } from './SettingsArayuz';
import { BaglantiAyarlari } from './SettingsBaglanti';
import { Card } from './SettingsCard';
import { Button } from '@/components/ui/button';
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

  const lsKB = Math.round(new Blob([localStorage.getItem('sobaYonetim') || '']).size / 1024);

  return (
    <div className="p-4 max-w-4xl mx-auto overflow-hidden">
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
          <SettingsPeletPanel
            pellet={pellet}
            onChange={(key, value) => setPellet((p) => ({ ...p, [key]: value }))}
            onSave={savePellet}
          />
        )}

        {tab === 'sound' && <SoundSettingsPanel playSound={playSound} />}

        {tab === 'agent' && <AgentSettingsPanel db={db} save={save} />}

        {tab === 'backup' && (
          <div className="grid gap-4">
            <Card title="📤 Yedek Al">
              <p className="text-muted-foreground text-sm">
                Tüm verilerinizi <strong className="text-orange-400 font-semibold">JSON formatında</strong> dışa
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

        {tab === 'shortcuts' && <ShortcutsPanel />}

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
          <DataPanel
            db={db}
            save={save}
            showToast={showToast}
            showConfirm={showConfirm as (t: string, m: string, ok: () => void, d?: boolean) => void}
          />
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

        {tab === 'about' && <AboutPanel db={db} lsKB={lsKB} />}
      </Tabs>
    </div>
  );
}
// Extracted sub-components:
// ActivityPanel → settings/SettingsActivity.tsx
// FullRestorePanel, SelectiveRestore, SmartImportManager → settings/SettingsBackup.tsx
// VeriOnarim → settings/SettingsRepair.tsx
// DangerAction, DataPanel → settings/SettingsData.tsx
// SettingsPeletPanel → settings/SettingsPelet.tsx
// ShortcutsPanel → settings/SettingsShortcuts.tsx
// KategoriYonetim → settings/SettingsKategoriYonetim.tsx
// AboutPanel → settings/SettingsAboutPanel.tsx
// AgentSettingsPanel → settings/SettingsAgentPanel.tsx

// (these functions are now imported from settings/ folder)
