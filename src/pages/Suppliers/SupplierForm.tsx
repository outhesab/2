/**
 * @file SupplierForm.tsx
 * @description Tedarikçi ekleme/düzenleme formu.
 */

import { Modal } from '@/components/Modal';
import { ModalActions } from '@/pages/pageHelpers';
import type { Supplier } from '@/types';

interface Props {
  open: boolean;
  editId: string | null;
  form: Partial<Supplier>;
  dupWarning: { name: string; score: number }[];
  forceSave: boolean;
  onNameChange: (val: string) => void;
  onNameBlur: (val: string) => void;
  onFieldChange: (field: string, val: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-[rgba(15,23,42,0.6)] border border-slate-700 rounded-xl text-[var(--text-primary)] text-sm box-border focus:outline-none focus:border-blue-500';
const labelClass = 'block mb-1.5 text-[var(--text-dim)] text-sm font-medium';

export default function SupplierForm({
  open,
  editId,
  form,
  dupWarning,
  forceSave,
  onNameChange,
  onNameBlur,
  onFieldChange,
  onSave,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editId ? '✏ Tedarikçi Düzenle' : '➕ Yeni Tedarikçi'}
    >
      <div className="grid grid-cols-2 gap-3.5">
        <div className="col-span-full">
          <label className={labelClass}>Ad *</label>
          <input
            value={form.name || ''}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={(e) => onNameBlur(e.target.value)}
            className={inputClass}
          />
          {dupWarning.length > 0 && (
            <div
              className={`mt-2 rounded-lg px-3 py-2.5 border ${
                forceSave
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-red-500/10 border-red-500/40'
              }`}
            >
              <p
                className={`text-xs font-bold mb-1 ${
                  forceSave ? 'text-amber-500' : 'text-red-500'
                }`}
              >
                {forceSave
                  ? '⚠ Yine de kaydetmek için tekrar "Kaydet" e tıklayın'
                  : '🔴 Benzer tedarikçiler bulundu:'}
              </p>
              {dupWarning.map((d, i) => (
                <p key={i} className="text-[var(--text-dim)] text-xs my-0.5">
                  • {d.name}{' '}
                  <span
                    className={`font-bold ${
                      d.score >= 90 ? 'text-red-500' : 'text-amber-500'
                    }`}
                  >
                    (%{d.score} benzerlik)
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>Kategori</label>
          <input
            value={form.category || ''}
            onChange={(e) => onFieldChange('category', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Telefon</label>
          <input
            value={form.phone || ''}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>E-posta</label>
          <input
            type="email"
            value={form.email || ''}
            onChange={(e) => onFieldChange('email', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Yetkili</label>
          <input
            value={form.contact || ''}
            onChange={(e) => onFieldChange('contact', e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="col-span-full">
          <label className={labelClass}>Adres</label>
          <textarea
            value={form.address || ''}
            onChange={(e) => onFieldChange('address', e.target.value)}
            className={`${inputClass} min-h-[60px]`}
          />
        </div>
        <div className="col-span-full">
          <label className={labelClass}>Not</label>
          <textarea
            value={form.note || ''}
            onChange={(e) => onFieldChange('note', e.target.value)}
            className={`${inputClass} min-h-[60px]`}
          />
        </div>
      </div>
      <ModalActions
        onSave={onSave}
        onCancel={onClose}
        saveColor={forceSave ? '#f59e0b' : '#10b981'}
        saveLabel={forceSave ? '⚠ Yine de Kaydet' : '💾 Kaydet'}
      />
    </Modal>
  );
}
