import { Button } from '@/components/ui/button';
import { Card } from '@/pages/SettingsCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  pellet: { gramaj: number; kgFiyat: number; cuvalKg: number; critDays: number };
  onChange: (key: string, value: number) => void;
  onSave: () => void;
}

function FV({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[var(--text-muted)]">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function SettingsPeletPanel({ pellet, onChange, onSave }: Props) {
  return (
    <Card title="🪵 Pelet Ayarları">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FV
          label="Gramaj (gr/torba)"
          type="number"
          value={String(pellet.gramaj)}
          onChange={(v) => onChange('gramaj', parseFloat(v) || 0)}
        />
        <FV
          label="Kg Fiyatı (₺)"
          type="number"
          value={String(pellet.kgFiyat)}
          onChange={(v) => onChange('kgFiyat', parseFloat(v) || 0)}
        />
        <FV
          label="Çuval Kg"
          type="number"
          value={String(pellet.cuvalKg)}
          onChange={(v) => onChange('cuvalKg', parseFloat(v) || 0)}
        />
        <FV
          label="Kritik Gün Sayısı"
          type="number"
          value={String(pellet.critDays)}
          onChange={(v) => onChange('critDays', parseInt(v) || 0)}
        />
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
        💡 Mevcut değerler: {pellet.cuvalKg}kg çuval · ₺{pellet.kgFiyat}/kg · {pellet.gramaj}gr/torba
      </div>
      <Button onClick={onSave} className="btn-primary w-full py-3 rounded-xl font-bold text-sm mt-4">
        💾 Pelet Ayarlarını Kaydet
      </Button>
    </Card>
  );
}
