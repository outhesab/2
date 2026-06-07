import { THEMES, PREMIUM_THEMES } from '@/hooks/useUIPrefs';
import type { UIPrefs } from '@/hooks/useUIPrefs';
import { Card } from '@/pages/SettingsCard';
import { ThemeButton } from '@/components/ThemeButton';

interface Props {
  prefs: UIPrefs;
  onChange: (p: UIPrefs) => void;
  showToast: (m: string, t?: string) => void;
}

export function ThemeSection({ prefs, onChange, showToast }: Props) {
  const set = (patch: Partial<UIPrefs>) => onChange({ ...prefs, ...patch });

  return (
    <>
      {/* Hazır Temalar */}
      <Card title="🎨 Temalar">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 auto-rows-min">
          {THEMES.map((t) => {
            const isActive = prefs.accent === t.accent && prefs.bgBase === t.bg && prefs.lightMode === t.light;
            return (
              <ThemeButton
                key={t.id}
                accent={t.accent}
                bg={t.bg}
                label={t.label}
                desc={t.desc}
                isLight={t.light}
                isActive={isActive}
                onSelect={() => {
                  set({ accent: t.accent, bgBase: t.bg, lightMode: t.light });
                  showToast(`${t.label} teması uygulandı!`, 'success');
                }}
              />
            );
          })}
        </div>
      </Card>

      {/* Premium Temalar */}
      <Card title="💎 Premium Temalar">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 auto-rows-min">
          {PREMIUM_THEMES.map((t) => {
            const isActive = prefs.themeId === t.id;
            return (
              <ThemeButton
                key={t.id}
                accent={t.accent}
                bg={t.bg}
                label={t.label}
                desc={t.desc}
                isLight={t.type === 'light'}
                isActive={isActive}
                onSelect={() => {
                  set({ themeId: t.id, accent: t.accent, bgBase: t.bg, lightMode: t.type === 'light' });
                  showToast(`✨ ${t.label} teması uygulandı!`, 'success');
                }}
              />
            );
          })}
        </div>
      </Card>
    </>
  );
}
