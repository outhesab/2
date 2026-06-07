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
    0.85: 'KÃ¼Ã§Ã¼k',
    1: 'Normal',
    1.1: 'BÃ¼yÃ¼k',
    1.2: 'Ã‡ok BÃ¼yÃ¼k',
  };
  const animLabels: Record<string, string> = {
    hizli: 'âš¡ HÄ±zlÄ±',
    normal: 'âœ¨ Normal',
    yavas: 'ğŸ¢ YavaÅŸ',
    yok: 'ğŸš« Yok',
  };
  const radiusLabels: Record<number, string> = {
    6: 'Keskin',
    10: 'Az',
    14: 'Normal',
    20: 'Yuvarlak',
  };

  return (
    <div className="grid gap-4">
      {/* HazÄ±r Temalar */}
      <Card title="ğŸŽ¨ Temalar">
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
                  showToast(`${t.label} temasÄ± uygulandÄ±!`, 'success');
                }}
              />
            );
          })}
        </div>
      </Card>

      {/* Premium Temalar */}
      <Card title="ğŸ’Ž Premium Temalar">
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
                  showToast(`âœ¨ ${t.label} temasÄ± uygulandÄ±!`, 'success');
                }}
              />
            );
          })}
        </div>
      </Card>

      {/* Premium Temalar */}
      <Card title="ğŸ’ Premium Temalar">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 auto-rows-min">
          {PREMIUM_THEMES.map((t) => {
            const isActive = prefs.themeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  set({ themeId: t.id, accent: t.accent, bgBase: t.bg, lightMode: t.type === 'light' });
                  showToast(`âœ¨ ${t.label} temasÄ± uygulandÄ±!`, 'success');
                }}
                style={{
                  padding: '12px 10px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isActive ? `${t.accent}18` : 'rgba(0,0,0,0.3)',
                  border: `2px solid ${isActive ? t.accent : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: 42,
                    marginBottom: 8,
                    borderRadius: 10,
                    border: `1px solid ${t.type === 'light' ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)'}`,
                    background: `linear-gradient(135deg, ${t.bg} 0%, ${t.accent} 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div className={'settings-theme-blob-1'} />
                  <div className={'settings-theme-blob-2'} />
                  <div className={'settings-theme-overlay'}>
                    <span className={'settings-theme-dot'} />
                    <span className={'settings-theme-bar'} />
                    <span className={'settings-theme-bar-sm'} />
                  </div>
                </div>
                <div
                  style={{ fontWeight: 700, color: isActive ? t.accent : 'var(--text-primary)', fontSize: '0.82rem' }}
                >
                  {t.label}
                </div>
                <div className="text-[var(--text-dim)] text-[0.7rem] mt-0.5">{t.desc}</div>
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 7,
                      right: 7,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: t.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      color: 'var(--text-primary)',
                      fontWeight: 900,
                    }}
                  >
                    âœ“
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* YazÄ± & Boyut */}
      <Card title="ğŸ”¤ YazÄ± & Boyut">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">YazÄ± Boyutu</label>
            <div className="flex items-center gap-1.5">
              {([0.85, 1, 1.1, 1.2] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => set({ fontScale: s })}
                  style={{
                    flex: 1,
                    padding: '9px 4px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    background: prefs.fontScale === s ? prefs.accent : 'rgba(255,255,255,0.05)',
                    color: prefs.fontScale === s ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {fontLabels[s]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">KÃ¶ÅŸe Yuvarlama</label>
            <div className="flex items-center gap-1.5">
              {([6, 10, 14, 20] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => set({ cardRadius: r })}
                  style={{
                    flex: 1,
                    padding: '9px 4px',
                    border: 'none',
                    borderRadius: r,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    background: prefs.cardRadius === r ? prefs.accent : 'rgba(255,255,255,0.05)',
                    color: prefs.cardRadius === r ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
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
      <Card title="âš¡ Animasyon & GÃ¶rÃ¼nÃ¼m">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Animasyon HÄ±zÄ±</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['hizli', 'normal', 'yavas', 'yok'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => set({ animSpeed: s })}
                  style={{
                    flex: 1,
                    padding: '9px 6px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    background: prefs.animSpeed === s ? prefs.accent : 'rgba(255,255,255,0.05)',
                    color: prefs.animSpeed === s ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
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
                <div className="text-foreground text-sm font-semibold">SÄ±kÄ±ÅŸÄ±k GÃ¶rÃ¼nÃ¼m</div>
                <div className="text-[var(--text-dim)] text-xs mt-0.5">Tablo ve padding'leri kÃ¼Ã§Ã¼ltÃ¼r</div>
              </div>
              <button
                onClick={() => set({ compactMode: !prefs.compactMode })}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  background: prefs.compactMode ? prefs.accent : 'var(--text-dim)',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--bg-elevated)',
                    position: 'absolute',
                    top: 4,
                    left: prefs.compactMode ? 26 : 4,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card title="ğŸ§© Dashboard DÃ¼zenleme">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">ParlaklÄ±k</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="range"
                min="50"
                max="150"
                value={dashboardPrefs.brightness}
                onChange={(e) => saveDashboardPrefs({ brightness: Number(e.target.value) })}
                style={{ flex: 1, accentColor: 'var(--color-primary)' }}
              />
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  minWidth: 36,
                  textAlign: 'right',
                }}
              >
                %{dashboardPrefs.brightness}
              </span>
            </div>
          </div>
          <div />
        </div>
        <div style={{ marginTop: 14 }}>
          <label className="block mb-1.5 text-sm font-semibold text-[var(--text-secondary)]">Widget'lar</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 8px',
                    borderRadius: 8,
                    background: enabled ? 'var(--bg-card)' : 'transparent',
                    border: '1px solid var(--border)',
                    opacity: enabled ? 1 : 0.5,
                  }}
                >
                  <span style={{ fontSize: '1rem', width: 22, textAlign: 'center' }}>{w.icon}</span>
                  <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {w.label}
                  </span>
                  {enabled && (
                    <>
                      <button
                        onClick={moveUp}
                        disabled={idx === 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: idx === 0 ? 'default' : 'pointer',
                          color: idx === 0 ? 'var(--text-dim)' : 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          padding: '2px 4px',
                        }}
                        title="YukarÄ± taÅŸÄ±"
                      >
                        â†‘
                      </button>
                      <button
                        onClick={moveDown}
                        disabled={idx === dashboardPrefs.leftWidgets.length - 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: idx === dashboardPrefs.leftWidgets.length - 1 ? 'default' : 'pointer',
                          color:
                            idx === dashboardPrefs.leftWidgets.length - 1 ? 'var(--text-dim)' : 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          padding: '2px 4px',
                        }}
                        title="AÅŸaÄŸÄ± taÅŸÄ±"
                      >
                        â†“
                      </button>
                    </>
                  )}
                  <button
                    onClick={toggle}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '2px 4px',
                      color: enabled ? '#ef4444' : 'var(--color-success)',
                    }}
                    title={enabled ? 'Gizle' : 'GÃ¶ster'}
                  >
                    {enabled ? 'âœ•' : '+'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* SÄ±fÄ±rla */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => {
            onChange(DEFAULT_PREFS);
            showToast('VarsayÄ±lan tema geri yÃ¼klendi!', 'success');
          }}
          className="flex-1 py-[11px] px-0 rounded-[10px] font-bold text-sm border border-[var(--border-strong)] bg-transparent cursor-pointer whitespace-nowrap"
        >
          â†º VarsayÄ±lana SÄ±fÄ±rla
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
          ğŸ’¾ TemayÄ± Kaydet
        </button>
      </div>

      {/* Floating Buton AyarlarÄ± */}
      <Card title="ğŸ”˜ Kayan Buton AyarlarÄ±">
        <p className="text-muted-foreground text-sm mb-4">
          Ekrandaki kayan butonlarÄ± gÃ¶ster/gizle. ButonlarÄ± istediÄŸiniz yere sÃ¼rÃ¼kleyebilirsiniz.
        </p>
        <div className="grid gap-2.5">
          {[
            {
              key: 'showAIButton' as const,
              icon: 'ğŸ¤–',
              label: 'AI Asistan Butonu',
              desc: 'Sol alttaki yapay zeka butonu',
            },
            {
              key: 'showFABButton' as const,
              icon: 'â•',
              label: 'HÄ±zlÄ± Ä°ÅŸlem Butonu',
              desc: 'SaÄŸ alttaki hÄ±zlÄ± satÄ±ÅŸ/gelir/gider butonu',
            },
            {
              key: 'showReportButton' as const,
              icon: 'ğŸ›',
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
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: prefs[item.key] ? prefs.accent : 'var(--text-dim)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: prefs[item.key] ? 25 : 3,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--bg-elevated)',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              localStorage.removeItem('aiBtnPos');
              localStorage.removeItem('fabBtnPos');
              localStorage.removeItem('reportBtnPos');
              showToast('Buton konumlarÄ± sÄ±fÄ±rlandÄ±!', 'success');
            }}
            className="py-2 px-4 rounded-lg font-semibold text-xs border border-[var(--border-strong)] bg-transparent cursor-pointer whitespace-nowrap"
          >
            ğŸ“ Buton KonumlarÄ±nÄ± SÄ±fÄ±rla
          </button>
        </div>
      </Card>
    </div>
  );
}
