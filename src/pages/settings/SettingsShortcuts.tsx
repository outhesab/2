import { Card } from '@/pages/SettingsCard';

const shortcuts = [
  { key: 'Ctrl + 1', desc: 'Özet (Dashboard)' },
  { key: 'Ctrl + 2', desc: 'Ürünler' },
  { key: 'Ctrl + 3', desc: 'Satış' },
  { key: 'Ctrl + 4', desc: 'Kasa' },
  { key: 'Ctrl + 5', desc: 'Raporlar' },
  { key: '+ Butonu', desc: 'Hızlı Eylem Menüsü (sağ alt)' },
  { key: 'Ctrl + Z', desc: 'Geri Al (tarayıcı düzeyi)' },
];

export function ShortcutsPanel() {
  return (
    <Card title="⌨️ Klavye Kısayolları">
      <p className="text-muted-foreground text-sm">
        Uygulamayı daha hızlı kullanmak için aşağıdaki kısayolları kullanabilirsiniz.
      </p>
      <div className="grid gap-2">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <kbd className="inline-flex items-center rounded-md border border-[var(--border-strong)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--color-warning)] shadow-[0_2px_0_rgba(0,0,0,0.4)]">
              {s.key}
            </kbd>
            <span className="text-muted-foreground text-sm">{s.desc}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
