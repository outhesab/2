import { Invoice } from '@/types';
import { formatDate, formatMoney } from '@/lib/utils-tr';
import { statusColors, statusLabels, paymentLabels, miniBtn } from '@/pages/FaturaHelpers.utils';
import styles from './FaturaTable.module.css';

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
    <div className={`responsive-table-wrap ${styles.tableContainer}`}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            {['Fatura No', 'Tür', 'Müşteri/Tedarikçi', 'Tarih', 'Tutar', 'Durum', 'Ödeme', ''].map((h) => (
              <th key={h} className={styles.headerCell}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={8} className={styles.emptyCell}>Henüz fatura yok</td>
            </tr>
          ) : (
            invoices.map((inv) => (
              <tr
                key={inv.id}
                className={styles.dataRow}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)')
                }
                onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
              >
                <td data-label="Fatura No" className={styles.cell}>
                  <div className={styles.invoiceNoWrap}>
                    <span className={styles.invoiceNo}>{inv.invoiceNo}</span>
                    {inv.saleId && (
                      <span className={styles.saleBadge}>🔗 Satış</span>
                    )}
                  </div>
                </td>
                <td data-label="Tür" className={styles.cell}>
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
                <td data-label="Müşteri" className={styles.customerCell}>{inv.cariName}</td>
                <td data-label="Tarih" className={styles.dateCell}>{formatDate(inv.createdAt)}</td>
                <td data-label="Tutar" className={styles.amountCell}>{formatMoney(inv.total)}</td>
                <td data-label="Durum" className={styles.cell}>
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
                <td data-label="Ödeme" className={styles.paymentCell}>{paymentLabels[inv.payment]}</td>
                <td className={styles.actionCell}>
                  <div className={styles.actionWrap}>
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
