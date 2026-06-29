import { Modal } from '@/components/Modal';
import type { BankFormState } from './types';

interface BankFormProps {
  open: boolean;
  onClose: () => void;
  form: BankFormState;
  onFormChange: (f: BankFormState) => void;
  onSave: () => void;
  cariList: { id: string; name: string }[];
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid #334155',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

const lbl: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: 'var(--text-dim)',
  fontSize: '0.82rem',
  fontWeight: 600,
};

export function BankForm({ open, onClose, form, onFormChange, onSave, cariList }: BankFormProps) {
  return (
    <Modal open={open} onClose={onClose} title="+ Banka İşlemi Ekle" maxWidth={480}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Tarih</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => onFormChange({ ...form, date: e.target.value })}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Tür</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['income', 'expense'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onFormChange({ ...form, type: t })}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    border: 'none',
                    borderRadius: 9,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background:
                      form.type === t
                        ? t === 'income'
                          ? 'rgba(16,185,129,0.2)'
                          : 'rgba(239,68,68,0.2)'
                        : 'rgba(255,255,255,0.05)',
                    color: form.type === t ? (t === 'income' ? '#10b981' : '#ef4444') : '#64748b',
                  }}
                >
                  {t === 'income' ? '📥 Gelen' : '📤 Giden'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label style={lbl}>Açıklama *</label>
          <input
            value={form.description}
            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
            style={inp}
            placeholder="Ödeme açıklaması..."
            autoFocus
          />
        </div>
        <div>
          <label style={lbl}>Tutar (₺) *</label>
          <input
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => onFormChange({ ...form, amount: e.target.value })}
            style={inp}
            placeholder="0,00"
            min={0}
            step={0.01}
          />
        </div>
        <div>
          <label style={lbl}>Cari Eşleştir (opsiyonel)</label>
          <select value={form.cariId} onChange={(e) => onFormChange({ ...form, cariId: e.target.value })} style={inp}>
            <option value="">— Seçin —</option>
            {cariList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onSave}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg,#ff5722,#ff7043)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              padding: '12px 0',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            💾 Kaydet
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#273548',
              border: '1px solid #334155',
              borderRadius: 10,
              color: 'var(--text-dim)',
              padding: '12px 18px',
              cursor: 'pointer',
            }}
          >
            İptal
          </button>
        </div>
      </div>
    </Modal>
  );
}
