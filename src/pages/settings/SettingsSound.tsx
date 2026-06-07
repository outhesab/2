import { useState } from 'react';
import type { SoundSettings, SoundTheme, SoundType } from '@/hooks/useSoundFeedback';
import { Card } from '@/pages/SettingsCard';
import { Button } from '@/components/ui/button';
import { useDB } from '@/hooks/db/core';

export function SoundSettingsPanel({ playSound }: { playSound: (type: SoundType) => void }) {
  const { db, save } = useDB();
  const [settings, setSettings] = useState<SoundSettings>(() => {
    return db.soundSettings || { enabled: true, volume: 0.5, theme: 'standart' };
  });
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(() => {
    return db.soundSettings?.speechEnabled !== false;
  });

  const updateSettings = (patch: Partial<SoundSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    save((prev) => ({ ...prev, soundSettings: next }));
  };

  const toggleSpeech = () => {
    const next = !speechEnabled;
    setSpeechEnabled(next);
    save((prev) => ({
      ...prev,
      soundSettings: {
        ...(prev.soundSettings || { enabled: true, volume: 0.5, theme: 'standart' }),
        speechEnabled: next,
      },
    }));
    if (next && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Sesli bildirim aktif edildi');
      u.lang = 'tr-TR';
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    }
  };

  const themes: { id: SoundTheme; label: string; desc: string }[] = [
    { id: 'standart', label: '🎵 Standart', desc: 'Dengeli ve sade sesler' },
    { id: 'minimal', label: '🔇 Minimal', desc: 'Kısa ve hafif sesler' },
    { id: 'yogun', label: '🔊 Yoğun', desc: 'Belirgin ve güçlü sesler' },
  ];

  const soundTypes: { type: SoundType; label: string }[] = [
    { type: 'success', label: '✅ Başarı' },
    { type: 'error', label: '❌ Hata' },
    { type: 'warning', label: '⚠️ Uyarı' },
    { type: 'sale', label: '🛒 Satış' },
    { type: 'notification', label: '🔔 Bildirim' },
  ];

  return (
    <div className="grid gap-4">
      <Card title="🔊 Ses Ayarları">
        <div className="grid gap-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-foreground text-sm">Sesli Geri Bildirim</div>
              <div className="text-muted-foreground text-xs">İşlem seslerini açın veya kapatın</div>
            </div>
            <Button
              onClick={() => updateSettings({ enabled: !settings.enabled })}
              className="w-[52px] h-[28px] rounded-[14px] border-none cursor-pointer relative transition-all"
              style={{ background: settings.enabled ? 'var(--color-success)' : 'var(--text-dim)' }}
            >
              <div
                className="w-5 h-5 rounded-full bg-[var(--bg-elevated)] absolute top-1 transition-all shadow-md"
                style={{ left: settings.enabled ? 28 : 4 }}
              />
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Ses Seviyesi</label>
              <span className="text-foreground text-sm">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--border)] accent-[var(--color-primary)]"
              disabled={!settings.enabled}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Ses Teması</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id })}
                  disabled={!settings.enabled}
                  className={`p-3 rounded-[10px] cursor-pointer text-center transition-all border-2 ${
                    settings.theme === t.id
                      ? 'border-[#ff5722] bg-[rgba(255,87,34,0.1)] text-[var(--color-danger)]'
                      : 'border-white/8 bg-[var(--bg-card)] text-[var(--text-muted)]'
                  } ${settings.enabled ? 'opacity-100' : 'opacity-50'}`}
                >
                  <div className="text-foreground text-sm font-semibold">{t.label}</div>
                  <div className="text-[0.72rem] mt-1 text-[var(--text-dim)]">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="🗣️ Sesli Konuşma (TTS)">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-foreground text-sm">Sesli Bildirim</div>
              <div className="text-muted-foreground text-xs">Hata ve uyarılarda sesli konuşma</div>
            </div>
            <button
              onClick={toggleSpeech}
              className="w-[52px] h-[28px] rounded-[14px] border-none cursor-pointer relative transition-all"
              style={{ background: speechEnabled ? 'var(--color-success)' : 'var(--text-dim)' }}
            >
              <div
                className="w-5 h-5 rounded-full bg-[var(--bg-elevated)] absolute top-1 transition-all shadow-md"
                style={{ left: speechEnabled ? 28 : 4 }}
              />
            </button>
          </div>
          <Button
            onClick={() => {
              if ('speechSynthesis' in window) {
                const u = new SpeechSynthesisUtterance(
                  'Merhaba! Bu bir test konuşmasıdır. Önemli bildirimlerde sesli uyarı alacaksınız.',
                );
                u.lang = 'tr-TR';
                u.rate = 1.05;
                window.speechSynthesis.speak(u);
              }
            }}
            className="px-3 py-2 rounded-xl font-bold text-sm border border-[var(--button-outline)]"
          >
            🗣️ Test Konuşma
          </Button>
        </div>
      </Card>

      <Card title="🎶 Sesleri Dinle">
        <p className="text-muted-foreground text-sm">Her ses tipini aşağıdan test edebilirsiniz.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {soundTypes.map((s) => (
            <Button
              key={s.type}
              onClick={() => playSound(s.type)}
              disabled={!settings.enabled}
              className={`p-3.5 rounded-[10px] cursor-pointer font-semibold text-[0.85rem] transition-all bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] ${
                settings.enabled ? 'opacity-100 hover:bg-[rgba(255,87,34,0.1)]' : 'opacity-50'
              }`}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
