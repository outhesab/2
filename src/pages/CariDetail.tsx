import { formatDate, formatMoney } from '@/lib/utils-tr';
import { exportArrayToExcel } from '@/lib/excelExport';
import EmptyState from '@/components/EmptyState';
import { FileSpreadsheet, HandCoins, Users } from 'lucide-react';
import type { Cari as CariType, Sale, KasaEntry, Invoice } from '@/types';

interface Props {
  detail: CariType;
  detailKasa: KasaEntry[];
  detailSales: Sale[];
  detailInvoices: Invoice[];
  totalPaid: number;
  totalPurchased: number;
  histTab: 'kasa' | 'satis' | 'fatura';
  setHistTab: (t: 'kasa' | 'satis' | 'fatura') => void;
  onQuickAction: (cariId: string, cariName: string, type: 'musteri' | 'tedarikci', balance: number) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function CariDetail({
  detail,
  detailKasa,
  detailSales,
  detailInvoices,
  totalPaid,
  totalPurchased,
  histTab,
  setHistTab,
  onQuickAction,
  showToast,
}: Props) {
  return (
    <>
      {detail.balance > 0 && (
        <button
          onClick={() => onQuickAction(detail.id, detail.name, detail.type, detail.balance)}
          style={{
            width: '100%',
            marginBottom: 14,
            padding: '10px 0',
            background: detail.type === 'musteri' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
            border: `1px solid ${detail.type === 'musteri' ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
            borderRadius: 10,
            color: detail.type === 'musteri' ? '#10b981' : '#f59e0b',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.88rem',
          }}
        >
          {detail.type === 'musteri'
            ? `💰 Tahsilat Al — Bakiye: ${formatMoney(detail.balance)}`
            : `💸 Ödeme Yap — Borç: ${formatMoney(detail.balance)}`}
        </button>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: 'Bakiye',
            value: formatMoney(Math.abs(detail.balance)),
            color: detail.balance > 0 ? '#10b981' : detail.balance < 0 ? '#ef4444' : '#64748b',
            icon: detail.balance > 0 ? '↑' : '↓',
          },
          {
            label: 'Toplam Alışveriş',
            value: formatMoney(totalPurchased),
            color: '#3b82f6',
            icon: '🛒',
          },
          {
            label: 'Tahsil Edilen',
            value: formatMoney(totalPaid),
            color: '#10b981',
            icon: '💰',
          },
          {
            label: 'Fatura Sayısı',
            value: String(detailInvoices.length),
            color: '#8b5cf6',
            icon: '📄',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 10,
              padding: '10px 12px',
              textAlign: 'center',
              border: `1px solid ${s.color}15`,
            }}
          >
            <div style={{ fontSize: '0.85rem', marginBottom: 3 }}>{s.icon}</div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: s.color,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                color: '#475569',
                fontSize: '0.68rem',
                marginTop: 2,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          ['Tür', detail.type === 'musteri' ? '👥 Müşteri' : '🏭 Tedarikçi'],
          ['Telefon', detail.phone || '-'],
          ['E-posta', detail.email || '-'],
          ['Vergi No', detail.taxNo || '-'],
        ].map(([l, v]) => (
          <div
            key={l}
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: '0.82rem',
            }}
          >
            <span style={{ color: '#475569' }}>{l}: </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
          </div>
        ))}
        <button
          onClick={() => {
            const rows = [
              ...detailSales.map((s) => ({
                Tarih: formatDate(s.createdAt),
                İşlem: 'Satış',
                Tutar: s.total,
                Açıklama: s.productName,
                Ödeme: s.payment,
              })),
              ...detailKasa.map((k) => ({
                Tarih: formatDate(k.createdAt),
                İşlem: k.type === 'gelir' ? 'Tahsilat' : 'Ödeme',
                Tutar: k.type === 'gelir' ? k.amount : -k.amount,
                Açıklama: k.description || '',
                Ödeme: k.kasa,
              })),
            ].sort((a, b) => a.Tarih.localeCompare(b.Tarih));
            exportArrayToExcel(rows, `ekstre-${detail.name}`);
            showToast('Ekstre indirildi!', 'success');
          }}
          style={{
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 8,
            color: '#10b981',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginLeft: 'auto',
          }}
        >
          📥 Ekstre İndir
        </button>
      </div>
      {(detail as unknown as { note?: string }).note && (
        <div
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 9,
            padding: '9px 13px',
            marginBottom: 14,
            fontSize: '0.83rem',
            color: '#fcd34d',
          }}
        >
          💡 {(detail as unknown as { note?: string }).note}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 12,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 10,
          padding: 4,
        }}
      >
        {[
          { id: 'kasa' as const, label: `💰 Ödemeler (${detailKasa.length})` },
          { id: 'satis' as const, label: `🛒 Satışlar (${detailSales.length})` },
          { id: 'fatura' as const, label: `📄 Faturalar (${detailInvoices.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setHistTab(t.id)}
            style={{
              flex: 1,
              padding: '7px 4px',
              border: 'none',
              borderRadius: 7,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.78rem',
              background: histTab === t.id ? 'linear-gradient(135deg,#ff5722,#ff7043)' : 'transparent',
              color: histTab === t.id ? '#fff' : '#64748b',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {histTab === 'kasa' &&
        (detailKasa.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="Kasa hareketi yok"
            description="Bu cariye bağlı kasa hareketi henüz oluşmadı."
          />
        ) : (
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.83rem',
              }}
            >
              <thead>
                <tr>
                  {['Tarih', 'Açıklama', 'Tutar', 'Hesap'].map((h) => (
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
                {detailKasa.map((k) => (
                  <tr
                    key={k.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{formatDate(k.createdAt)}</td>
                    <td
                      style={{
                        padding: '8px 10px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {k.description || '-'}
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        color: k.type === 'gelir' ? '#10b981' : '#ef4444',
                        fontWeight: 700,
                      }}
                    >
                      {k.type === 'gelir' ? '+' : '-'}
                      {formatMoney(k.amount)}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{k.kasa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      {histTab === 'satis' &&
        (detailSales.length === 0 ? (
          <EmptyState icon={Users} title="Satış kaydı yok" description="Bu cariye ait tamamlanmış satış bulunamadı." />
        ) : (
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.83rem',
              }}
            >
              <thead>
                <tr>
                  {['Tarih', 'Ürün', 'Adet', 'Toplam', 'Ödeme'].map((h) => (
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
                {detailSales.map((s) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{formatDate(s.createdAt)}</td>
                    <td
                      style={{
                        padding: '8px 10px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {s.productName || s.items?.[0]?.productName || '-'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#94a3b8' }}>
                      {s.quantity || s.items?.reduce((a: number, i: { quantity: number }) => a + i.quantity, 0) || '-'}
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        color: '#10b981',
                        fontWeight: 700,
                      }}
                    >
                      {formatMoney(s.total)}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{s.payment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      {histTab === 'fatura' &&
        (detailInvoices.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Fatura kaydı yok"
            description="Bu cariye bağlı fatura hareketi bulunamadı."
          />
        ) : (
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.83rem',
              }}
            >
              <thead>
                <tr>
                  {['No', 'Tür', 'Tarih', 'Tutar', 'Durum'].map((h) => (
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
                {detailInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td
                      style={{
                        padding: '8px 10px',
                        color: '#ff7043',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                      }}
                    >
                      {inv.invoiceNo}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#94a3b8' }}>
                      {inv.type === 'satis' ? '📤 Satış' : '📥 Alış'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{formatDate(inv.createdAt)}</td>
                    <td
                      style={{
                        padding: '8px 10px',
                        color: '#10b981',
                        fontWeight: 700,
                      }}
                    >
                      {formatMoney(inv.total)}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          background:
                            inv.status === 'odendi'
                              ? 'rgba(16,185,129,0.12)'
                              : inv.status === 'onaylandi'
                                ? 'rgba(59,130,246,0.12)'
                                : 'rgba(245,158,11,0.12)',
                          color:
                            inv.status === 'odendi' ? '#10b981' : inv.status === 'onaylandi' ? '#60a5fa' : '#f59e0b',
                          borderRadius: 5,
                          padding: '2px 7px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </>
  );
}
