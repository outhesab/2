import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { loadUIPrefs, saveUIPrefs, applyUIPrefs, type UIPrefs } from '@/hooks/useUIPrefs';
import { getPremiumTheme, isPremiumTheme } from './themes';
import type { PremiumCSSVars } from './types';

export interface ThemeContextValue {
  currentThemeId: string;
  setThemeId: (id: string) => void;
  uiPrefs: UIPrefs;
  updateUIPrefs: (patch: Partial<UIPrefs>) => void;
  isPremium: boolean;
  premiumCSSVars: PremiumCSSVars | null;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [uiPrefs, setUIPrefs] = useState<UIPrefs>(() => loadUIPrefs());
  const isPremiumRef = useRef(false);

  const applyTheme = useCallback((prefs: UIPrefs) => {
    const root = document.documentElement;

    if (isPremiumTheme(prefs.themeId)) {
      const premium = getPremiumTheme(prefs.themeId);
      if (premium) {
        isPremiumRef.current = true;
        Object.entries(premium.cssVars).forEach(([key, value]) => {
          if (value !== undefined) {
            root.style.setProperty(key, value);
          }
        });
        applyUIPrefs({
          ...prefs,
          accent: premium.accent,
          bgBase: premium.bg,
          lightMode: premium.type === 'light',
        });
        return;
      }
    }

    isPremiumRef.current = false;
    applyUIPrefs(prefs);
  }, []);

  const updateUIPrefs = useCallback((patch: Partial<UIPrefs>) => {
    setUIPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveUIPrefs(next);
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  const setThemeId = useCallback((id: string) => {
    if (isPremiumTheme(id)) {
      const premium = getPremiumTheme(id);
      if (premium) {
        updateUIPrefs({
          themeId: id,
          accent: premium.accent,
          bgBase: premium.bg as `#${string}`,
          lightMode: premium.type === 'light',
        });
      }
      return;
    }

    const builtin = BUILTIN_THEME_MAP[id as keyof typeof BUILTIN_THEME_MAP];
    if (builtin) {
      updateUIPrefs({
        themeId: id,
        accent: builtin.accent,
        bgBase: builtin.bg,
        lightMode: builtin.light,
      });
      return;
    }

    updateUIPrefs({ themeId: id });
  }, [updateUIPrefs]);

  useEffect(() => {
    applyTheme(uiPrefs);
  }, [applyTheme, uiPrefs]);

  useEffect(() => {
    const handler = () => {
      const fresh = loadUIPrefs();
      setUIPrefs(fresh);
      applyTheme(fresh);
    };
    window.addEventListener('sobaUI:updated', handler);
    return () => window.removeEventListener('sobaUI:updated', handler);
  }, [applyTheme]);

  const isPremium = isPremiumRef.current;
  const premiumTheme = isPremium ? getPremiumTheme(uiPrefs.themeId) : null;

  const value = useMemo<ThemeContextValue>(() => ({
    currentThemeId: uiPrefs.themeId || 'carbon',
    setThemeId,
    uiPrefs,
    updateUIPrefs,
    isPremium,
    premiumCSSVars: premiumTheme?.cssVars ?? null,
  }), [uiPrefs, setThemeId, updateUIPrefs, isPremium, premiumTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

const BUILTIN_THEME_MAP = {
  graphite: { accent: '#9ca3af', bg: '#0b1017' as const, light: false },
  carbon: { accent: '#22c55e', bg: '#041512' as const, light: false },
  midnight: { accent: '#38bdf8', bg: '#030d1a' as const, light: false },
  ember: { accent: '#f97316', bg: '#140a04' as const, light: false },
  'signal-red': { accent: '#ef4444', bg: '#150607' as const, light: false },
  paper: { accent: '#0ea5e9', bg: '#f7fafc' as const, light: true },
  mint: { accent: '#10b981', bg: '#f2fbf7' as const, light: true },
  sand: { accent: '#d97706', bg: '#fffbf2' as const, light: true },
};
