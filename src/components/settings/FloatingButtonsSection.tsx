import { DEFAULT_PREFS, loadUIPrefs, saveUIPrefs } from '@/hooks/useUIPrefs';
import type { UIPrefs } from '@/hooks/useUIPrefs';
import { Card } from '@/pages/SettingsCard';

interface Props {
  prefs: UIPrefs;
  onChange: (p: UIPrefs) => void;
  showToast: (m: string, t?: string) => void;
}

/** Custom toggle switch component */
function Toggle({ isOn, onClick }: { isOn: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative cursor-pointer border-none flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200"
      style={{ background: isOn ? 'var(--accent)' : 'var(--text-dim)' }}
      aria-label="Toggle"
    >
      <span
        className="absolute top-[3px] w-5 h-5 rounded-full bg-[var(--bg-elevated)] shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-left duration-200"
        style={{ left: isOn ? 25 : 3 }}
      />
    </button>
  );
}

export function FloatingButtonsSection({ prefs, onChange, showToast }: Props) {
  const set = (patch: Partial<UIPrefs>) => onChange({ ...prefs, ...patch });

  const buttons = [
    { key: 'showAIButton' as const, icon: '🤖', label: 'AI Asistan Butonu', desc: 'Sol alttaki yapay zeka butonu' },
    {
      key: 'showFABButton' as const,
      icon: '➕',
      label: 'Hızlı İşlem Butonu',
      desc: 'Sağ alttaki hızlı satış/gelir/gider butonu',
    },
    {
      key: 'showReportButton' as const,
      icon: '🐛',
      label: 'Hata Bildirme Butonu',
      desc: 'Hata bildirme, not alma ve takip butonu',
    },
  ];

  return (
    <Card title="🔘 Kayan Buton Ayarları">
      <p className="text-muted-foreground text-sm mb-4">
        Ekrandaki kayan butonları göster/gizle. Butonları istediğiniz yere sürükleyebilirsiniz.
      </p>
      <div className="grid gap-2.5">
        {buttons.map((item) => (
          <div key={item.key} className="flex items-center gap-3">
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1">
              <div className="text-foreground text-sm font-semibold">{item.label}</div>
              <div className="text-[var(--text-dim)] text-xs mt-0.5">{item.desc}</div>
            </div>
            <Toggle isOn={prefs[item.key]} onClick={() => set({ [item.key]: !prefs[item.key] })} />
          </div>
        ))}
        <button
          onClick={() => {
            const current = loadUIPrefs();
            saveUIPrefs({
              ...current,
              aiBtnPos: DEFAULT_PREFS.aiBtnPos,
              fabBtnPos: DEFAULT_PREFS.fabBtnPos,
              reportBtnPos: DEFAULT_PREFS.reportBtnPos,
            });
            showToast('Buton konumları sıfırlandı!', 'success');
          }}
          className="py-2 px-4 rounded-lg font-semibold text-xs border border-[var(--border-strong)] bg-transparent cursor-pointer whitespace-nowrap"
        >
          📍 Buton Konumlarını Sıfırla
        </button>
      </div>
    </Card>
  );
}
