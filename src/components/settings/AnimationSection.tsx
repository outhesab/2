import type { UIPrefs } from '@/hooks/useUIPrefs';
import { Card } from '@/pages/SettingsCard';

interface Props {
  prefs: UIPrefs;
  onChange: (p: UIPrefs) => void;
}

export function AnimationSection({ prefs, onChange }: Props) {
  const set = (patch: Partial<UIPrefs>) => onChange({ ...prefs, ...patch });

  const animLabels: Record<string, string> = {
    hizli: '⚡ Hızlı',
    normal: '✨ Normal',
    yavas: '🐢 Yavaş',
    yok: '🚫 Yok',
  };

  return (
    <Card title="⚡ Animasyon & Görünüm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Animasyon Hızı</label>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['hizli', 'normal', 'yavas', 'yok'] as const).map((s) => {
              const isActive = prefs.animSpeed === s;
              return (
                <button
                  key={s}
                  onClick={() => set({ animSpeed: s })}
                  className="flex-1 py-[9px] px-1.5 border-none cursor-pointer font-semibold text-[0.78rem] transition-all duration-150 rounded-lg whitespace-nowrap"
                  style={{
                    background: isActive ? prefs.accent : 'rgba(255,255,255,0.05)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {animLabels[s]}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Kompakt Mod</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-foreground text-sm font-semibold">Sıkışık Görünüm</div>
              <div className="text-[var(--text-dim)] text-xs mt-0.5">Tablo ve padding'leri küçültür</div>
            </div>
            {/* Custom Toggle Switch */}
            <button
              onClick={() => set({ compactMode: !prefs.compactMode })}
              className="relative cursor-pointer border-none flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200"
              style={{
                background: prefs.compactMode ? prefs.accent : 'var(--text-dim)',
              }}
              aria-label="Kompakt mod toggle"
            >
              <span
                className="absolute top-1 w-[18px] h-[18px] rounded-full bg-[var(--bg-elevated)] shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-left duration-200"
                style={{ left: prefs.compactMode ? 26 : 4 }}
              />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
