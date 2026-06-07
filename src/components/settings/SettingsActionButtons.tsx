import { DEFAULT_PREFS } from '@/hooks/useUIPrefs';
import type { UIPrefs } from '@/hooks/useUIPrefs';

interface Props {
  prefs: UIPrefs;
  onChange: (p: UIPrefs) => void;
  showToast: (m: string, t?: string) => void;
}

export function SettingsActionButtons({ prefs, onChange, showToast }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={() => {
          onChange(DEFAULT_PREFS);
          showToast('Varsayılan tema geri yüklendi!', 'success');
        }}
        className="flex-1 py-[11px] px-0 rounded-[10px] font-bold text-sm border border-[var(--border-strong)] bg-transparent cursor-pointer whitespace-nowrap"
      >
        ↺ Varsayılana Sıfırla
      </button>
      <button
        onClick={() => showToast('Tema kaydedildi!', 'success')}
        style={{
          flex: 2,
          padding: '11px 0',
          background: `linear-gradient(135deg, ${prefs.accent}, ${prefs.accent}cc)`,
          border: 'none',
          borderRadius: 10,
          color: 'var(--text-primary)',
          fontWeight: 800,
          cursor: 'pointer',
          fontSize: '0.88rem',
        }}
      >
        💾 Temayı Kaydet
      </button>
    </div>
  );
}
