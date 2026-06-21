import { THEMES, DEFAULT_PREFS, type UIPrefs } from '@/hooks/useUIPrefs';
import { PREMIUM_THEMES } from '@/theme/themes';
import { WIDGET_OPTIONS, type WidgetId } from '@/config/widgets';
import { Card } from './SettingsCard';
import { ThemeButton } from '@/components/ThemeButton';

export function ArayuzAyarlari({
  prefs,
  onChange,
  showToast,
  dashboardPrefs,
  saveDashboardPrefs,
}: {
  prefs: UIPrefs;
  onChange: (p: UIPrefs) => void;
  showToast: (m: string, t?: string) => void;
  dashboardPrefs: { leftWidgets: WidgetId[]; brightness: number };
  saveDashboardPrefs: (patch: Partial<{ leftWidgets: WidgetId[]; brightness: number }>) => void;
}) {
  const set = (patch: Partial<UIPrefs>) => onChange({ ...prefs, ...patch });

  const fontLabels: Record<number, string> = {
    0.85: 'Küçük',
    1: 'Normal',
    1.1: 'Büyük',
    1.2: 'Çok Büyük',
  };
  const animLabels: Record<string, string> = {
    hizli: '⚡ Hızlı',
    normal: '✨ Normal',
    yavas: '🐢 Yavaş',
    yok: '🚫 Yok',
  };
  const radiusLabels: Record<number, string> = {
    6: 'Keskin',
    10: 'Az',
    14: 'Normal',
    20: 'Yuvarlak',
  };

  return (
    <div className="grid gap-4">
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

      {/* Yazı & Boyut */}
      <Card title="🔤 Yazı & Boyut">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Yazı Boyutu</label>
            <div className="flex items-center gap-1.5">
              {([0.85, 1, 1.1, 1.2] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => set({ fontScale: s })}
                  className={`flex-1 py-2.5 px-1 border-none rounded-lg cursor-pointer font-semibold text-[0.8rem] transition-all ${
                    prefs.fontScale === s ? 'bg-[var(--color-primary)] text-white' : 'bg-white/5 text-muted-foreground'
                  }`}
                  style={prefs.fontScale === s ? { backgroundColor: prefs.accent } : {}}
                >
                  {fontLabels[s]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Köşe Yuvarlama</label>
            <div className="flex items-center gap-1.5">
              {([6, 10, 14, 20] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => set({ cardRadius: r })}
                  className={`flex-1 py-2.5 px-1 border-none cursor-pointer font-semibold text-[0.75rem] transition-all ${
                    prefs.cardRadius === r ? 'bg-[var(--color-primary)] text-white' : 'bg-white/5 text-muted-foreground'
                  }`}
                  style={{
                    borderRadius: `${r}px`,
                    ...(prefs.cardRadius === r ? { backgroundColor: prefs.accent } : {}),
                  }}
                >
                  {radiusLabels[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Animasyon & Mod */}
      <Card title="⚡ Animasyon & Görünüm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Animasyon Hızı</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['hizli', 'normal', 'yavas', 'yok'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => set({ animSpeed: s })}
                  className={`flex-1 py-2.5 px-1.5 border-none rounded-lg cursor-pointer font-semibold text-[0.78rem] transition-all whitespace-nowrap ${
                    prefs.animSpeed === s ? 'bg-[var(--color-primary)] text-white' : 'bg-white/5 text-muted-foreground'
                  }`}
                  style={prefs.animSpeed === s ? { backgroundColor: prefs.accent } : {}}
                >
                  {animLabels[s]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Kompakt Mod</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-foreground text-sm font-semibold">Sıkışık Görünüm</div>
                <div className="text-[var(--text-dim)] text-xs mt-0.5">Tablo ve padding'leri küçültür</div>
              </div>
              <button
                onClick={() => set({ compactMode: !prefs.compactMode })}
                className={`w-12 h-6.5 rounded-full border-none cursor-pointer relative transition-all ${
                  prefs.compactMode ? 'bg-[var(--color-success)]' : 'bg-muted-foreground/30'
                }`}
                style={prefs.compactMode ? { backgroundColor: prefs.accent } : {}}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white absolute top-1 transition-all shadow-sm ${
                    prefs.compactMode ? 'left-6.5' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card title="🧩 Dashboard Düzenleme">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Parlaklık</label>
            <div className="flex items-center gap-2.5">
              <input
                type="range"
                min="50"
                max="150"
                value={dashboardPrefs.brightness}
                onChange={(e) => saveDashboardPrefs({ brightness: Number(e.target.value) })}
                className="flex-1 accent-[var(--color-primary)]"
                style={{ accentColor: prefs.accent }}
              />
              <span className="text-[0.82rem] font-bold text-[var(--text-secondary)] min-w-[36px] text-right">
                %{dashboardPrefs.brightness}
              </span>
            </div>
          </div>
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
                  className={`flex items-center gap-2 p-1.5 rounded-lg border border-border transition-all ${
                    enabled ? 'bg-card' : 'opacity-50'
                  }`}
                >
                  <span className="text-base w-5.5 text-center">{w.icon}</span>
                  <span className="flex-1 text-[0.82rem] font-semibold text-[var(--text-primary)]">{w.label}</span>
                  {enabled && (
                    <div className="flex gap-1">
                      <button
                        onClick={moveUp}
                        disabled={idx === 0}
                        className="bg-none border-none cursor-pointer text-muted-foreground hover:text-foreground text-[0.85rem] p-1 disabled:opacity-20"
                        title="Yukarı taşı"
                      >
                        ↑
                      </button>
                      <button
                        onClick={moveDown}
                        disabled={idx === dashboardPrefs.leftWidgets.length - 1}
                        className="bg-none border-none cursor-pointer text-muted-foreground hover:text-foreground text-[0.85rem] p-1 disabled:opacity-20"
                        title="Aşağı taşı"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                  <button
                    onClick={toggle}
                    className={`bg-none border-none cursor-pointer text-base p-1 ${
                      enabled ? 'text-red-500' : 'text-green-500'
                    }`}
                    title={enabled ? 'Gizle' : 'Göster'}
                  >
                    {enabled ? '✖' : '+'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Sıfırla */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => {
            onChange(DEFAULT_PREFS);
            showToast('Varsayılan tema geri yüklendi!', 'success');
          }}
          className="flex-1 py-3 px-0 rounded-lg font-bold text-sm border border-strong bg-transparent cursor-pointer whitespace-nowrap"
        >
          ↺ Varsayılana Sıfırla
        </button>
        <button
          onClick={() => showToast('Tema kaydedildi!', 'success')}
          className="flex-[2] py-3 rounded-lg text-white font-extrabold cursor-pointer text-[0.88rem] border-none"
          style={{
            background: `linear-gradient(135deg, ${prefs.accent}, ${prefs.accent}cc)`,
          }}
        >
          💾 Temayı Kaydet
        </button>
      </div>

      {/* Floating Buton Ayarları */}
      <Card title="💠 Kayan Buton Ayarları">
        <p className="text-muted-foreground text-sm mb-4">
          Ekrandaki kayan butonları göster/gizle. Butonları istediğiniz yere sürükleyebilirsiniz.
        </p>
        <div className="grid gap-2.5">
          {[
            {
              key: 'showAIButton' as const,
              icon: '🤖',
              label: 'AI Asistan Butonu',
              desc: 'Sol alttaki yapay zeka butonu',
            },
            {
              key: 'showReportButton' as const,
              icon: '📝',
              label: 'Hata Bildirme Butonu',
              desc: 'Hata bildirme, not alma ve takip butonu',
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <div className="text-foreground text-sm font-semibold">{item.label}</div>
                <div className="text-[var(--text-dim)] text-xs mt-0.5">{item.desc}</div>
              </div>
              <div
                onClick={() => onChange({ ...prefs, [item.key]: !prefs[item.key] })}
                className={`w-12 h-6.5 rounded-full relative cursor-pointer transition-all ${
                  prefs[item.key] ? 'bg-[var(--color-primary)]' : 'bg-muted-foreground/30'
                }`}
                style={prefs[item.key] ? { backgroundColor: prefs.accent } : {}}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.75 transition-all shadow-sm ${
                    prefs[item.key] ? 'left-6' : 'left-0.75'
                  }`}
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              localStorage.removeItem('aiBtnPos');
              localStorage.removeItem('fabBtnPos');
              localStorage.removeItem('reportBtnPos');
              showToast('Buton konumları sıfırlandı!', 'success');
            }}
            className="py-2 px-4 rounded-lg font-semibold text-xs border border-strong bg-transparent cursor-pointer whitespace-nowrap"
          >
            📍 Buton Konumlarını Sıfırla
          </button>
        </div>
      </Card>
    </div>
  );
}
