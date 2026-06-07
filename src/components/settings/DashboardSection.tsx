import { WIDGET_OPTIONS } from '@/config/widgets';
import type { WidgetId } from '@/config/widgets';
import { Card } from '@/pages/SettingsCard';

interface DashboardPrefs {
  leftWidgets: WidgetId[];
  brightness: number;
}

interface Props {
  dashboardPrefs: DashboardPrefs;
  saveDashboardPrefs: (patch: Partial<DashboardPrefs>) => void;
}

export function DashboardSection({ dashboardPrefs, saveDashboardPrefs }: Props) {
  return (
    <Card title="🧭 Dashboard Düzenleme">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Parlaklık</label>
          <div className="flex items-center gap-[10px]">
            <input
              type="range"
              min="50"
              max="150"
              value={dashboardPrefs.brightness}
              onChange={(e) => saveDashboardPrefs({ brightness: Number(e.target.value) })}
              className="flex-1"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span className="text-[0.82rem] font-bold text-[var(--text-secondary)] min-w-[36px] text-right">
              %{dashboardPrefs.brightness}
            </span>
          </div>
        </div>
        <div />
      </div>
      <div className="mt-3.5">
        <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Widget'lar</label>
        <div className="flex flex-col gap-1.5">
          {WIDGET_OPTIONS.map((w) => {
            const idx = dashboardPrefs.leftWidgets.indexOf(w.id);
            const enabled = idx >= 0;
            const toggle = () => {
              if (enabled) {
                saveDashboardPrefs({ leftWidgets: dashboardPrefs.leftWidgets.filter((id) => id !== w.id) });
              } else {
                saveDashboardPrefs({ leftWidgets: [...dashboardPrefs.leftWidgets, w.id] });
              }
            };
            const moveUp = () => {
              if (idx <= 0) return;
              const arr = [...dashboardPrefs.leftWidgets];
              [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
              saveDashboardPrefs({ leftWidgets: arr });
            };
            const moveDown = () => {
              if (idx < 0 || idx >= dashboardPrefs.leftWidgets.length - 1) return;
              const arr = [...dashboardPrefs.leftWidgets];
              [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
              saveDashboardPrefs({ leftWidgets: arr });
            };
            return (
              <div
                key={w.id}
                className={`flex items-center gap-2 p-[5px_8px] rounded-lg border border-[var(--border)] transition-opacity ${
                  enabled ? 'bg-[var(--bg-card)]' : 'bg-transparent opacity-50'
                }`}
              >
                <span className="text-base w-[22px] text-center">{w.icon}</span>
                <span className="flex-1 text-[0.82rem] font-semibold text-[var(--text-primary)]">{w.label}</span>
                {enabled && (
                  <>
                    <button
                      onClick={moveUp}
                      disabled={idx === 0}
                      className="bg-transparent border-none p-[2px_4px] text-[0.85rem] hover:opacity-100"
                      style={{
                        cursor: idx === 0 ? 'default' : 'pointer',
                        color: idx === 0 ? 'var(--text-dim)' : 'var(--text-secondary)',
                      }}
                      title="Yukarı taşı"
                    >
                      ↑
                    </button>
                    <button
                      onClick={moveDown}
                      disabled={idx === dashboardPrefs.leftWidgets.length - 1}
                      className="bg-transparent border-none p-[2px_4px] text-[0.85rem] hover:opacity-100"
                      style={{
                        cursor: idx === dashboardPrefs.leftWidgets.length - 1 ? 'default' : 'pointer',
                        color:
                          idx === dashboardPrefs.leftWidgets.length - 1 ? 'var(--text-dim)' : 'var(--text-secondary)',
                      }}
                      title="Aşağı taşı"
                    >
                      ↓
                    </button>
                  </>
                )}
                <button
                  onClick={toggle}
                  className="bg-transparent border-none cursor-pointer text-base p-[2px_4px] transition-colors"
                  style={{ color: enabled ? '#ef4444' : 'var(--color-success)' }}
                  title={enabled ? 'Gizle' : 'Göster'}
                >
                  {enabled ? '✕' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
