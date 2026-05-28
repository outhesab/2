export type PremiumThemeId = 'corporate' | 'modern-dark' | 'elegant-light';

export type ThemeCategory = 'premium' | 'builtin';

export interface PremiumCSSVars {
  '--shadow-glow'?: string;
  '--shadow-colored'?: string;
  '--shadow-neon'?: string;
  '--shadow-soft-white'?: string;
  '--glass-bg'?: string;
  '--glass-bg-light'?: string;
  '--glass-border'?: string;
  '--glass-blur'?: string;
  '--glass-blur-heavy'?: string;
  '--gradient-primary'?: string;
  '--gradient-card'?: string;
  '--gradient-glass'?: string;
  '--gradient-shine'?: string;
  '--ease-spring'?: string;
  '--ease-smooth'?: string;
  '--ease-snappy'?: string;
  '--duration-fast'?: string;
  '--duration-normal'?: string;
  '--duration-slow'?: string;
  '--surface-raised'?: string;
  '--surface-overlay'?: string;
  '--surface-sunken'?: string;
  '--color-primary-50'?: string;
  '--color-primary-100'?: string;
  '--color-primary-200'?: string;
  '--color-primary-300'?: string;
  '--color-primary-400'?: string;
  '--color-primary-500'?: string;
  '--color-primary-600'?: string;
  '--color-primary-700'?: string;
  '--color-primary-800'?: string;
  '--color-primary-900'?: string;
  '--shadow-sm'?: string;
  '--shadow'?: string;
  '--shadow-lg'?: string;
  '--shadow-xl'?: string;
  '--shadow-accent'?: string;
  '--radius'?: string;
  '--radius-sm'?: string;
  '--radius-lg'?: string;
  '--radius-xl'?: string;
  [key: `--${string}`]: string | undefined;
}

export interface PremiumThemeDefinition {
  id: PremiumThemeId;
  label: string;
  desc: string;
  category: 'premium';
  type: 'dark' | 'light';
  accent: string;
  bg: string;
  cssVars: PremiumCSSVars;
}

export type ThemeDefinition = PremiumThemeDefinition | {
  id: string;
  label: string;
  desc: string;
  category: 'builtin';
  type: 'dark' | 'light';
  accent: string;
  bg: string;
};
