import { Modal } from '@/components/Modal';
import { ModalActions, FormField, FormTextArea } from '@/pages/pageHelpers';
import { lbl, inp } from '@/lib/formStyles';
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Ad *</label>
          <input
            value={form.name || ''}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={(e) => onNameBlur(e.target.value)}
            style={inp}
          />
          {dupWarning.length > 0 && (
            <div
              style={{
                marginTop: 8,
                background: forceSave ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${forceSave ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}`,
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <p
                style={{
                  color: forceSave ? '#f59e0b' : '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  marginBottom: 4,
                }}
              >
                {forceSave
                  ? '⚠ Yine de kaydetmek için tekrar "Kaydet" e tıklayın'
                  : '\uD83D\uDD34 Benzer tedarikçiler bulundu:'}
              </p>
              {dupWarning.map((d, i) => (
                <p
                  key={i}
                  style={{
                    color: 'var(--text-dim)',
                    fontSize: '0.8rem',
                    margin: '2px 0',
                  }}
                >
                  • {d.name}{' '}
                  <span
                    style={{
                      color: d.score >= 90 ? '#ef4444' : '#f59e0b',
                      fontWeight: 700,
                    }}
                  >
                    (%{d.score} benzerlik)
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
        <FormField
          label="Kategori"
          value={form.category || ''}
          onChange={(v) => onFieldChange('category', v)}
        />
        <FormField
          label="Telefon"
          value={form.phone || ''}
          onChange={(v) => onFieldChange('phone', v)}
        />
        <FormField
          label="E-posta"
          value={form.email || ''}
          onChange={(v) => onFieldChange('email', v)}
          type="email"
        />
        <div>
          <label style={lbl}>Yetkili</label>
          <input
            value={form.contact || ''}
            onChange={(e) => onFieldChange('contact', e.target.value)}
            style={inp}
          />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Adres</label>
          <textarea
            value={form.address || ''}
            onChange={(e) => onFieldChange('address', e.target.value)}
            style={{ ...inp, minHeight: 60 }}
          />
        </div>
        <FormTextArea
          label="Not"
          value={form.note || ''}
          onChange={(v) => onFieldChange('note', v)}
          minHeight={60}
          gridColumn="1/-1"
        />
      </div>
      <ModalActions
        onSave={onSave}
        onCancel={onClose}
        saveColor={forceSave ? '#f59e0b' : '#10b981'}
        saveLabel={forceSave ? '⚠ Yine de Kaydet' : '\uD83D\uDCBE Kaydet'}
      />
    </Modal>
  );
}
