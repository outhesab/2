import type { UIPrefs } from '@/hooks/useUIPrefs';
import { Card } from '@/pages/SettingsCard';

interface Props {
  prefs: UIPrefs;
  onChange: (p: UIPrefs) => void;
}

export function TypographySection({ prefs, onChange }: Props) {
  const set = (patch: Partial<UIPrefs>) => onChange({ ...prefs, ...patch });

  const fontLabels: Record<number, string> = {
    0.85: 'Küçük',
    1: 'Normal',
    1.1: 'Büyük',
    1.2: 'Çok Büyük',
  };

  const radiusLabels: Record<number, string> = {
    6: 'Keskin',
    10: 'Az',
    14: 'Normal',
    20: 'Yuvarlak',
  };

  return (
    <Card title="🔧 Yazı & Boyut">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Yazı Boyutu</label>
          <div className="flex items-center gap-1.5">
            {([0.85, 1, 1.1, 1.2] as const).map((s) => {
              const isActive = prefs.fontScale === s;
              return (
                <button
                  key={s}
                  onClick={() => set({ fontScale: s })}
                  className="flex-1 py-[9px] px-1 border-none cursor-pointer font-semibold text-[0.8rem] transition-all duration-150 rounded-lg"
                  style={{
                    background: isActive ? prefs.accent : 'rgba(255,255,255,0.05)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {fontLabels[s]}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Köşe Yuvarlama</label>
          <div className="flex items-center gap-1.5">
            {([6, 10, 14, 20] as const).map((r) => {
              const isActive = prefs.cardRadius === r;
              return (
                <button
                  key={r}
                  onClick={() => set({ cardRadius: r })}
                  className="flex-1 py-[9px] px-1 border-none cursor-pointer font-semibold text-[0.75rem] transition-all duration-150"
                  style={{
                    borderRadius: r,
                    background: isActive ? prefs.accent : 'rgba(255,255,255,0.05)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {radiusLabels[r]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
