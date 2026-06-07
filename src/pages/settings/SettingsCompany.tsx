import { Card } from '../SettingsCard';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { DB } from '@/types';

// Geçici bir Input bileşeni (Settings.tsx'teki inpBase ve FV benzeri)
const inpBase =
  'w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] box-border';

const FV = ({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div>
    <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inpBase} />
  </div>
);

export function SettingsCompany({
  db,
  save,
  showToast,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
}) {
  const [company, setCompany] = useState(() => {
    const s = (db.settings || {}) as Record<string, string>;
    return {
      ...db.company,
      name: db.company.name || s.companyName || '',
      city: (db.company as { city?: string }).city || s.city || '',
    };
  });

  const saveCompany = () => {
    save((prev) => ({
      ...prev,
      company: {
        ...company,
        id: prev.company.id,
        createdAt: prev.company.createdAt,
      },
      settings: {
        ...prev.settings,
        companyName: company.name,
        city: (company as { city?: string }).city || '',
      },
    }));
    showToast('Şirket bilgileri kaydedildi!', 'success');
  };

  return (
    <Card title="🏢 Şirket Bilgileri">
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FV label="Şirket Adı" value={company.name || ''} onChange={(v) => setCompany((c) => ({ ...c, name: v }))} />
          <FV
            label="Şehir"
            value={(company as { city?: string }).city || ''}
            onChange={(v) => setCompany((c) => ({ ...c, city: v }))}
          />
          <FV label="Vergi No" value={company.taxNo || ''} onChange={(v) => setCompany((c) => ({ ...c, taxNo: v }))} />
          <FV label="Telefon" value={company.phone || ''} onChange={(v) => setCompany((c) => ({ ...c, phone: v }))} />
          <FV
            label="E-posta"
            type="email"
            value={company.email || ''}
            onChange={(v) => setCompany((c) => ({ ...c, email: v }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Adres</label>
          <textarea
            value={company.address || ''}
            onChange={(e) => setCompany((c) => ({ ...c, address: e.target.value }))}
            className={`${inpBase} min-h-[70px]`}
          />
        </div>
        <Button onClick={saveCompany} className="w-full mt-4">
          💾 Şirket Bilgilerini Kaydet
        </Button>
      </div>
    </Card>
  );
}
