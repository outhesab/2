import { Modal } from '@/components/Modal';
import { formatDate, formatMoney } from '@/lib/utils-tr';
import type { DB, InvoiceItem } from '@/types';
import { TotalRow, type FormState } from './FaturaHelpers';
import { lbl, inp, paymentLabels } from './FaturaHelpers.utils';

interface FaturaFormProps {
  db: DB;
  modal: boolean;
  onClose: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  updateItem: (idx: number, field: keyof InvoiceItem, value: string | number) => void;
  addItem: () => void;
  removeItem: (idx: number) => void;
  formTotals: { subtotal: number; vatTotal: number; total: number };
  editId: string | null;
  handleSave: () => void;
  selectCari: (cariId: string) => void;
}

export default function FaturaForm({
  db,
  modal,
  onClose,
  form,
  setForm,
  updateItem,
  addItem,
  removeItem,
  formTotals,
  editId,
  handleSave,
  selectCari,
}: FaturaFormProps) {
  return (
    <Modal
      open={modal}
      onClose={onClose}
      title={editId ? '✏️ Fatura Düzenle' : `📄 Yeni ${form.type === 'satis' ? 'Satış' : 'Alış'} Faturası`}
      maxWidth={720}
    >
      <div style={{ display: 'grid', gap: 14 }}>
        {/* Cari seçimi */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>{form.type === 'satis' ? 'Müşteri' : 'Tedarikçi'} *</label>
            <select value={form.cariId} onChange={(e) => selectCari(e.target.value)} style={inp}>
              <option value="">-- Cari Seç veya elle yazın --</option>
              {db.cari
                .filter((c) => (form.type === 'satis' ? c.type === 'musteri' : c.type === 'tedarikci'))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Ad/Ünvan *</label>
            <input
              value={form.cariName}
              onChange={(e) => setForm((f) => ({ ...f, cariName: e.target.value }))}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Vergi No</label>
            <input
              value={form.cariTaxNo}
              onChange={(e) => setForm((f) => ({ ...f, cariTaxNo: e.target.value }))}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Adres</label>
            <input
              value={form.cariAddress}
              onChange={(e) => setForm((f) => ({ ...f, cariAddress: e.target.value }))}
              style={inp}
            />
          </div>
        </div>

        {/* Kalemler */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <label style={{ ...lbl, marginBottom: 0 }}>Fatura Kalemleri</label>
            <button
              onClick={addItem}
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: 'none',
                borderRadius: 6,
                color: '#60a5fa',
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              + Kalem
            </button>
          </div>
          <div
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                  {['Açıklama', 'Adet', 'Birim ₺', 'KDV %', 'Toplam', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        color: '#334155',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.items.map((it, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        value={it.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        style={{
                          ...inp,
                          padding: '7px 10px',
                          fontSize: '0.85rem',
                        }}
                        placeholder="Ürün/Hizmet"
                      />
                    </td>
                    <td style={{ padding: '6px 8px', width: 70 }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={it.quantity}
                        min={1}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        style={{
                          ...inp,
                          padding: '7px 8px',
                          fontSize: '0.85rem',
                          width: 60,
                        }}
                      />
                    </td>
                    <td style={{ padding: '6px 8px', width: 100 }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={it.unitPrice}
                        min={0}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        style={{
                          ...inp,
                          padding: '7px 8px',
                          fontSize: '0.85rem',
                          width: 90,
                        }}
                      />
                    </td>
                    <td style={{ padding: '6px 8px', width: 70 }}>
                      <select
                        value={it.vatRate}
                        onChange={(e) => updateItem(idx, 'vatRate', parseInt(e.target.value))}
                        style={{
                          ...inp,
                          padding: '7px 6px',
                          fontSize: '0.85rem',
                          width: 60,
                        }}
                      >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </td>
                    <td
                      style={{
                        padding: '6px 8px',
                        color: '#10b981',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatMoney(it.quantity * it.unitPrice * (1 + it.vatRate / 100))}
                    </td>
                    <td style={{ padding: '6px 8px', width: 30 }}>
                      {form.items.length > 1 && (
                        <button
                          onClick={() => removeItem(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals + Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <div>
                  <label style={lbl}>Ödeme</label>
                  <select
                    value={form.payment}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        payment: e.target.value as 'nakit' | 'kart' | 'cari' | 'havale',
                      }))
                    }
                    style={inp}
                  >
                    {Object.entries(paymentLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Vade Tarihi</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    style={inp}
                  />
                </div>
              </div>
              <div>
                <label style={lbl}>Durum</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as 'taslak' | 'onaylandi' | 'odendi' | 'iptal' }))
                  }
                  style={inp}
                >
                  <option value="taslak">📝 Taslak</option>
                  <option value="onaylandi">✅ Onaylandı</option>
                  <option value="odendi">💰 Ödendi</option>
                  <option value="iptal">❌ İptal</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Not</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  style={{ ...inp, minHeight: 50 }}
                />
              </div>
              <div>
                <label style={lbl}>İlgili Satış (opsiyonel)</label>
                <select
                  value={form.saleId}
                  onChange={(e) => setForm((f) => ({ ...f, saleId: e.target.value }))}
                  style={inp}
                >
                  <option value="">-- Satış Seç --</option>
                  {(db.sales || [])
                    .filter((s) => !s.deleted)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {formatDate(s.createdAt)} — {s.productName} ({formatMoney(s.total)})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <TotalRow label="Ara Toplam" value={formatMoney(formTotals.subtotal)} />
            <TotalRow label="KDV Toplam" value={formatMoney(formTotals.vatTotal)} color="#3b82f6" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', flex: 1 }}>İskonto</span>
              <input
                type="number"
                inputMode="decimal"
                value={form.discount}
                min={0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discount: parseFloat(e.target.value) || 0,
                  }))
                }
                style={{
                  ...inp,
                  width: 100,
                  padding: '5px 8px',
                  fontSize: '0.85rem',
                  textAlign: 'right',
                }}
              />
            </div>
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: 10,
                marginTop: 4,
              }}
            >
              <TotalRow label="GENEL TOPLAM" value={formatMoney(formTotals.total)} color="#10b981" big />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            background: 'linear-gradient(135deg, #ff5722, #ff7043)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            padding: '13px 0',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          💾 {editId ? 'Güncelle' : 'Fatura Oluştur'}
        </button>
      </div>
    </Modal>
  );
}
