import { Landmark } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { TableWrapper } from '@/pages/pageHelpers';
import { formatDate, formatMoney } from '@/lib/utils-tr';
import { STATUS_LABEL } from './types';
import type { BankTransaction, DB } from '@/types';

interface BankTableProps {
  sorted: BankTransaction[];
  db: DB;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
  onMatch: (transId: string, cariId: string) => void;
  onClearFilters: () => void;
}

export function BankTable({ sorted, db, onConfirm, onDelete, onMatch, onClearFilters }: BankTableProps) {
  return (
    <TableWrapper
      columns={['Tarih', 'Açıklama', 'Tutar', 'Cari Eşleşme', 'Durum', '']}
      noData={
        sorted.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="İşlem bulunamadı"
            description="Seçili filtrelerle eşleşen banka işlemi bulunamadı."
            actionLabel="Filtreleri temizle"
            onAction={onClearFilters}
          />
        ) : undefined
      }
      colSpan={6}
    >
      {sorted.map((t) => {
        const isGelir = t.type === 'income' || t.type === 'credit';
        const st = STATUS_LABEL[t.status || 'unmatched'];
        const matchedCari = t.matchedCariId ? db.cari.find((c) => c.id === t.matchedCariId) : null;
        return (
          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <td
              data-label="Tarih"
              style={{
                padding: '11px 14px',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
              }}
            >
              {formatDate(t.date)}
            </td>
            <td
              data-label="Açıklama"
              style={{
                padding: '11px 14px',
                color: 'var(--text-primary)',
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: isGelir ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {isGelir ? '📥' : '📤'}
                </span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.description}
                </span>
              </div>
            </td>
            <td
              data-label="Tutar"
              style={{
                padding: '11px 14px',
                fontWeight: 800,
                color: isGelir ? '#10b981' : '#ef4444',
                fontSize: '0.95rem',
              }}
            >
              {isGelir ? '+' : '-'}
              {formatMoney(t.amount)}
            </td>
            <td data-label="Cari Eşleşme" style={{ padding: '11px 14px' }}>
              {t.status === 'confirmed' ? (
                <span
                  style={{
                    color: '#10b981',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {matchedCari?.name || '—'}
                </span>
              ) : (
                <select
                  value={t.matchedCariId || ''}
                  onChange={(e) => {
                    if (e.target.value) onMatch(t.id, e.target.value);
                  }}
                  style={{
                    background: '#273548',
                    border: '1px solid #334155',
                    borderRadius: 7,
                    color: t.matchedCariId ? '#f1f5f9' : '#64748b',
                    padding: '5px 9px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">— Cari Seç —</option>
                  {db.cari
                    .filter((c) => !c.deleted)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              )}
            </td>
            <td data-label="Durum" style={{ padding: '11px 14px' }}>
              <span
                style={{
                  background: st.bg,
                  color: st.color,
                  borderRadius: 7,
                  padding: '3px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {st.label}
              </span>
            </td>
            <td style={{ padding: '11px 14px' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {t.status !== 'confirmed' && (
                  <button
                    onClick={() => onConfirm(t.id)}
                    title="Onayla ve kasaya aktar"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: 7,
                      color: '#10b981',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => onDelete(t.id)}
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: 'none',
                    borderRadius: 7,
                    color: '#ef4444',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </TableWrapper>
  );
}
