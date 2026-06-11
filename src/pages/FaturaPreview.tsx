import { Modal } from '@/components/Modal';
import { formatDate, formatMoney, genId } from '@/lib/utils-tr';
import type { DB, Invoice } from '@/types';
import { TotalRow } from './FaturaHelpers';
import { createInstallmentPlan, statusColors, statusLabels, lbl, inp } from './FaturaHelpers.utils';
import DOMPurify from 'dompurify';
import { useState } from 'react';

interface FaturaPreviewProps {
  db: DB;
  previewInv: Invoice;
  onClose: () => void;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function FaturaPreview({ db, previewInv, onClose, save, showToast }: FaturaPreviewProps) {
  const [instForm, setInstForm] = useState({
    count: 3,
    firstDueDate: new Date().toISOString().slice(0, 10),
  });
  const [showInstForm, setShowInstForm] = useState(false);

  const payInstallment = (installmentId: string) => {
    const nowIso = new Date().toISOString();
    save((prev) => {
      const inst = (prev.installments || []).find((i) => i.id === installmentId);
      if (!inst) return prev;
      const inv = (prev.invoices || []).find((i) => i.id === inst.invoiceId);

      const kasaEntry = {
        id: genId(),
        type: 'gelir' as const,
        category: 'taksit',
        amount: inst.amount,
        kasa: 'nakit' as const,
        description: `Taksit ödemesi — ${inv?.invoiceNo || inst.invoiceId}`,
        relatedId: inst.invoiceId,
        cariId: inv?.cariId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const installments = (prev.installments || []).map((i) =>
        i.id === installmentId ? { ...i, paid: true, paidAt: nowIso, updatedAt: nowIso } : i,
      );

      const kasa = [...prev.kasa, kasaEntry];

      let cari = prev.cari;
      if (inv?.cariId) {
        cari = prev.cari.map((c) =>
          c.id === inv.cariId
            ? {
                ...c,
                balance: (c.balance || 0) - inst.amount,
                lastTransaction: nowIso,
                updatedAt: nowIso,
              }
            : c,
        );
      }

      return { ...prev, installments, kasa, cari };
    });
    showToast('✅ Taksit ödendi!');
  };

  const createInstallments = (invoiceId: string, total: number) => {
    const count = instForm.count;
    const firstDueDate = new Date(instForm.firstDueDate);
    const plan = createInstallmentPlan(invoiceId, total, count, firstDueDate);
    save((prev) => ({
      ...prev,
      installments: [...(prev.installments || []), ...plan],
    }));
    setShowInstForm(false);
    showToast(`📅 ${count} taksitli plan oluşturuldu!`);
  };

  return (
    <Modal open={true} onClose={onClose} title={`📄 Fatura: ${previewInv.invoiceNo}`} maxWidth={640}>
      <div
        style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 18,
            paddingBottom: 14,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <h3
              style={{
                color: 'var(--text-primary)',
                fontWeight: 800,
                fontSize: '1rem',
                marginBottom: 4,
              }}
            >
              {db.company.name || 'Şirketiniz'}
            </h3>
            {db.company.taxNo && <p style={{ color: '#475569', fontSize: '0.82rem' }}>VKN: {db.company.taxNo}</p>}
            {db.company.phone && <p style={{ color: '#475569', fontSize: '0.82rem' }}>📞 {db.company.phone}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontFamily: 'monospace',
                color: '#ff7043',
                fontWeight: 800,
                fontSize: '1rem',
              }}
            >
              {previewInv.invoiceNo}
            </p>
            <p style={{ color: '#475569', fontSize: '0.82rem' }}>{formatDate(previewInv.createdAt)}</p>
            <span
              style={{
                background: `${statusColors[previewInv.status]}18`,
                color: statusColors[previewInv.status],
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              {statusLabels[previewInv.status]}
            </span>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              color: '#334155',
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 4,
            }}
          >
            {previewInv.type === 'satis' ? 'MÜŞTERİ' : 'TEDARİKÇİ'}
          </p>
          <p style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{previewInv.cariName}</p>
          {previewInv.cariTaxNo && <p style={{ color: '#475569', fontSize: '0.82rem' }}>VKN: {previewInv.cariTaxNo}</p>}
          {previewInv.cariAddress && <p style={{ color: '#475569', fontSize: '0.82rem' }}>{previewInv.cariAddress}</p>}
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: 14,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Açıklama', 'Adet', 'Birim', 'KDV', 'Toplam'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    color: '#334155',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewInv.items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td
                  style={{
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                >
                  {it.description}
                </td>
                <td
                  style={{
                    padding: '8px 10px',
                    color: 'var(--text-dim)',
                    fontSize: '0.85rem',
                  }}
                >
                  {it.quantity}
                </td>
                <td
                  style={{
                    padding: '8px 10px',
                    color: 'var(--text-dim)',
                    fontSize: '0.85rem',
                  }}
                >
                  {formatMoney(it.unitPrice)}
                </td>
                <td
                  style={{
                    padding: '8px 10px',
                    color: 'var(--text-dim)',
                    fontSize: '0.85rem',
                  }}
                >
                  %{it.vatRate}
                </td>
                <td
                  style={{
                    padding: '8px 10px',
                    color: '#10b981',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                  }}
                >
                  {formatMoney(it.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 12,
          }}
        >
          <TotalRow label="Ara Toplam" value={formatMoney(previewInv.subtotal)} />
          <TotalRow label="KDV" value={formatMoney(previewInv.vatTotal)} color="#3b82f6" />
          {previewInv.discount > 0 && (
            <TotalRow label="İskonto" value={`-${formatMoney(previewInv.discount)}`} color="#ef4444" />
          )}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 8,
              marginTop: 6,
            }}
          >
            <TotalRow label="GENEL TOPLAM" value={formatMoney(previewInv.total)} color="#10b981" big />
          </div>
        </div>
        {previewInv.note && (
          <p
            style={{
              color: '#475569',
              fontSize: '0.82rem',
              marginTop: 12,
              fontStyle: 'italic',
            }}
          >
            Not: {previewInv.note}
          </p>
        )}
      </div>

      {/* Taksit Planı Bölümü */}
      {(() => {
        const installments = (db.installments || []).filter((i) => i.invoiceId === previewInv.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return (
          <div
            style={{
              marginTop: 16,
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}
              >
                📅 Taksit Planı
              </span>
              {installments.length === 0 && (
                <button
                  onClick={() => setShowInstForm((v) => !v)}
                  style={{
                    background: 'rgba(139,92,246,0.15)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: 8,
                    color: '#a78bfa',
                    padding: '5px 12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  📅 Taksit Planı Oluştur
                </button>
              )}
            </div>

            {showInstForm && installments.length === 0 && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 12,
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  <div>
                    <label style={lbl}>Taksit Sayısı (2-24)</label>
                    <input
                      type="number"
                      min={2}
                      max={24}
                      value={instForm.count}
                      onChange={(e) =>
                        setInstForm((f) => ({
                          ...f,
                          count: Math.min(24, Math.max(2, parseInt(e.target.value) || 2)),
                        }))
                      }
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>İlk Vade Tarihi</label>
                    <input
                      type="date"
                      value={instForm.firstDueDate}
                      onChange={(e) =>
                        setInstForm((f) => ({
                          ...f,
                          firstDueDate: e.target.value,
                        }))
                      }
                      style={inp}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => createInstallments(previewInv.id, previewInv.total)}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      padding: '9px 0',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    ✅ Oluştur
                  </button>
                  <button
                    onClick={() => setShowInstForm(false)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      color: 'var(--text-muted)',
                      padding: '9px 14px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}

            {installments.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                    {['#', 'Vade', 'Tutar', 'Durum', ''].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '7px 10px',
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
                  {installments.map((inst, idx) => {
                    const due = new Date(inst.dueDate);
                    due.setHours(0, 0, 0, 0);
                    const isOverdue = !inst.paid && due < today;
                    const isToday = !inst.paid && due.getTime() === today.getTime();
                    const rowBg = inst.paid
                      ? 'rgba(16,185,129,0.08)'
                      : isOverdue
                        ? 'rgba(239,68,68,0.1)'
                        : isToday
                          ? 'rgba(245,158,11,0.1)'
                          : 'rgba(255,255,255,0.02)';
                    const statusColor = inst.paid ? '#10b981' : isOverdue ? '#ef4444' : isToday ? '#f59e0b' : '#64748b';
                    const statusLabel = inst.paid
                      ? '✅ Ödendi'
                      : isOverdue
                        ? '⚠️ Gecikmiş'
                        : isToday
                          ? '🔴 Bugün'
                          : '⏳ Bekliyor';
                    return (
                      <tr
                        key={inst.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: rowBg,
                        }}
                      >
                        <td
                          style={{
                            padding: '8px 10px',
                            color: 'var(--text-muted)',
                            fontSize: '0.82rem',
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            color: 'var(--text-primary)',
                            fontSize: '0.82rem',
                          }}
                        >
                          {formatDate(inst.dueDate)}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            color: '#10b981',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {formatMoney(inst.amount)}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            style={{
                              color: statusColor,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {!inst.paid && (
                            <button
                              onClick={() => payInstallment(inst.id)}
                              style={{
                                background: 'rgba(16,185,129,0.15)',
                                border: '1px solid rgba(16,185,129,0.3)',
                                borderRadius: 6,
                                color: '#10b981',
                                padding: '3px 10px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                              }}
                            >
                              ✅ Ödendi
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              !showInstForm && (
                <p
                  style={{
                    color: '#334155',
                    fontSize: '0.82rem',
                    textAlign: 'center',
                    padding: '10px 0',
                  }}
                >
                  Henüz taksit planı yok
                </p>
              )
            )}
          </div>
        );
      })()}

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button
          onClick={() => {
            window.print();
          }}
          style={{
            flex: 1,
            padding: '11px 0',
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 10,
            color: '#60a5fa',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          🖨️ Yazdır
        </button>
        <button
          onClick={() => {
            const w = window.open('', '_blank');
            if (!w) return;
            const esc = (s: string) =>
              s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fatura ${esc(previewInv.invoiceNo)}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#333}h1{color:#ff5722;border-bottom:2px solid #ff5722;padding-bottom:10px}.header{display:flex;justify-content:space-between;margin:20px 0}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#1e293b;color:#fff;padding:10px;text-align:left;font-size:0.85rem}td{padding:10px;border-bottom:1px solid #ddd;font-size:0.85rem}.total{text-align:right;font-size:1.1rem;font-weight:700;margin-top:20px}.footer{margin-top:40px;color:#666;font-size:0.8rem;border-top:1px solid #ddd;padding-top:10px}</style></head><body>
                <h1>${previewInv.type === 'satis' ? 'SATIŞ FATURASI' : 'ALIŞ FATURASI'}</h1>
                <div class="header"><div><strong>${esc(db.company.name || 'Şirketiniz')}</strong><br>VKN: ${esc(db.company.taxNo || '-')}<br>${esc(db.company.address || '')}</div><div style="text-align:right"><strong>${esc(previewInv.invoiceNo)}</strong><br>${esc(formatDate(previewInv.createdAt))}<br>Durum: ${esc(statusLabels[previewInv.status])}</div></div>
                <p><strong>${previewInv.type === 'satis' ? 'Müşteri' : 'Tedarikçi'}:</strong> ${esc(previewInv.cariName)}${previewInv.cariTaxNo ? ` (VKN: ${esc(previewInv.cariTaxNo)})` : ''}</p>
                <table><thead><tr><th>Açıklama</th><th>Miktar</th><th>Birim Fiyat</th><th>KDV %</th><th>Tutar</th></tr></thead><tbody>
                ${previewInv.items.map((it) => `<tr><td>${esc(it.description)}</td><td>${it.quantity}</td><td>₺${it.unitPrice.toFixed(2)}</td><td>%${it.vatRate}</td><td>₺${it.total.toFixed(2)}</td></tr>`).join('')}
                </tbody></table>
                <div class="total">Ara Toplam: ₺${previewInv.subtotal.toFixed(2)}<br>KDV: ₺${previewInv.vatTotal.toFixed(2)}<br>${previewInv.discount > 0 ? `İskonto: -₺${previewInv.discount.toFixed(2)}<br>` : ''}<strong>GENEL TOPLAM: ₺${previewInv.total.toFixed(2)}</strong></div>
                <div class="footer">${new Date().toLocaleString('tr-TR')} · PARSPEL Fatura</div></body></html>`;
            w.document.write(DOMPurify.sanitize(html));
            w.document.close();
            w.print();
          }}
          style={{
            flex: 1,
            padding: '11px 0',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 10,
            color: '#10b981',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          📄 PDF İndir
        </button>
      </div>
    </Modal>
  );
}
