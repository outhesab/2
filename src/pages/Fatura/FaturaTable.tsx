import { Invoice } from '@/types';
import { formatDate, formatMoney } from '@/lib/utils-tr';
import { statusColors, statusLabels, paymentLabels, miniBtn } from '../FaturaHelpers.utils';

interface FaturaTableProps {
  invoices: Invoice[];
  onEdit: (inv: Invoice) => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Invoice['status']) => void;
}

export function FaturaTable({
  invoices,
  onEdit,
  onPreview,
  onDelete,
  onUpdateStatus,
}: FaturaTableProps) {
  return (
    <div
      className="responsive-table-wrap"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
            {['Fatura No', 'Tür', 'Müşteri/Tedarikçi', 'Tarih', 'Tutar', 'Durum', 'Ödeme', ''].map((h) => (
              <th
                key={h}
                style={{
                  padding: '12px 14px',
                  textAlign: 'left',
                  color: '#334155',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
                Henüz fatura yok
              </td>
            </tr>
          ) : (
            invoices.map((inv) => (
              <tr
                key={inv.id}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)')
                }
                onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
              >
                <td data-label="Fatura No" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '0.88rem',
                      }}
                    >
                      {inv.invoiceNo}
                    </span>
                    {inv.saleId && (
                      <span
                        style={{
                          background: 'rgba(139,92,246,0.15)',
                          color: '#a78bfa',
                          borderRadius: 5,
                          padding: '1px 6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        🔗 Satış
                      </span>
                    )}
                  </div>
                </td>
                <td data-label="Tür" style={{ padding: '12px 14px' }}>
                  <span
                    style={{
                      background: inv.type === 'satis' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                      color: inv.type === 'satis' ? '#10b981' : '#f59e0b',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {inv.type === 'satis' ? '📤 Satış' : '📥 Alış'}
                  </span>
                </td>
                <td
                  data-label="Müşteri"
                  style={{
                    padding: '12px 14px',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  {inv.cariName}
                </td>
                <td
                  data-label="Tarih"
                  style={{
                    padding: '12px 14px',
                    color: '#475569',
                    fontSize: '0.82rem',
                  }}
                >
                  {formatDate(inv.createdAt)}
                </td>
                <td
                  data-label="Tutar"
                  style={{
                    padding: '12px 14px',
                    color: '#10b981',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                  }}
                >
                  {formatMoney(inv.total)}
                </td>
                <td data-label="Durum" style={{ padding: '12px 14px' }}>
                  <span
                    style={{
                      background: `${statusColors[inv.status]}18`,
                      color: statusColors[inv.status],
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {statusLabels[inv.status]}
                  </span>
                </td>
                <td
                  data-label="Ödeme"
                  style={{
                    padding: '12px 14px',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                  }}
                >
                    {paymentLabels[inv.payment]}
                  </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => onPreview(inv.id)} title="Önizle" style={miniBtn}>
                      👁️
                    </button>
                    <button onClick={() => onEdit(inv)} title="Düzenle" style={miniBtn}>
                      ✏️
                    </button>
                    {inv.status === 'taslak' && (
                      <button
                        onClick={() => onUpdateStatus(inv.id, 'onaylandi')}
                        title="Onayla"
                        style={{ ...miniBtn, color: '#10b981' }}
                      >
                        ✅
                      </button>
                    )}
                    {inv.status === 'onaylandi' && (
                      <button
                        onClick={() => onUpdateStatus(inv.id, 'odendi')}
                        title="Ödendi"
                        style={{ ...miniBtn, color: '#3b82f6' }}
                      >
                        💰
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(inv.id)}
                      title="Sil"
                      style={{ ...miniBtn, color: '#ef4444' }}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
