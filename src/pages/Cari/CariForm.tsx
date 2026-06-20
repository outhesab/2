/**
 * Cari ekleme / duzenleme form modalı.
 */

import { Modal } from '@/components/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormTextArea, ModalActions } from '@/pages/pageHelpers';
import type { Cari as CariType } from '@/types';
import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (form: Partial<CariType>) => void;
  initial?: Partial<CariType>;
  editId: string | null;
}

const empty: Partial<CariType> = {
  name: '',
  type: 'musteri',
  taxNo: '',
  phone: '',
  email: '',
  address: '',
  balance: 0,
  note: '',
};

export default function CariForm({ open, onClose, onSave, initial, editId }: Props) {
  const [form, setForm] = useState<Partial<CariType>>(empty);

  useEffect(() => {
    if (initial) setForm({ ...initial });
    else setForm({ ...empty });
  }, [initial, open]);

  return (
    <Modal open={open} onClose={onClose} title={editId ? '✏️ Cari Düzenle' : '🆕 Yeni Cari'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <Label>Ad *</Label>
          <Input
            value={form.name || ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Cari adi"
          />
        </div>
        <div>
          <Label>Tur</Label>
          <select
            value={form.type || 'musteri'}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as 'musteri' | 'tedarikci' }))
            }
            className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none"
          >
            <option value="musteri">👥 Musteri</option>
            <option value="tedarikci">🏭 Tedarikci</option>
          </select>
        </div>
        <FormField
          label="Telefon"
          value={form.phone || ''}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        />
        <FormField
          label="Vergi No"
          value={form.taxNo || ''}
          onChange={(v) => setForm((f) => ({ ...f, taxNo: v }))}
        />
        <FormField
          label="E-posta"
          value={form.email || ''}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          type="email"
        />
        <div className="col-span-1 md:col-span-2">
          <Label>Adres</Label>
          <textarea
            value={form.address || ''}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none min-h-[60px]"
          />
        </div>
        <FormTextArea
          label="Not / Aciklama"
          value={form.note || ''}
          onChange={(v) => setForm((f) => ({ ...f, note: v }))}
          placeholder="Musteri hakkinda notlar..."
          minHeight={50}
          gridColumn="1/-1"
        />
      </div>
      <ModalActions onSave={() => onSave(form)} onCancel={onClose} />
    </Modal>
  );
}
