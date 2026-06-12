import { useState } from 'react';
import { exportArrayToExcel as exportToExcel } from '@/lib/excelExport';
import { formatDate } from '@/lib/utils-tr';
import { ReportProps } from './types';
import styles from '@/styles/common.module.css';

export function ReportsGenerator({ db, start, end }: ReportProps) {
  const [modules, setModules] = useState<Record<string, boolean>>({
    stok: true,
    cari: false,
    kasa: false,
    satis: false,
  });
  const [generated, setGenerated] = useState<{ label: string; data: Record<string, string | number>[] }[] | null>(null);

  const generate = () => {
    const result: { label: string; data: Record<string, string | number>[] }[] = [];
    if (modules.stok) {
      const products = db.products
        .filter((p) => !p.deleted)
        .map((p) => ({
          'Ürün Adı': p.name,
          Stok: p.stock,
          Maliyet: p.cost,
          'Birim Fiyat': p.price,
          KDV: p.vat || 0,
          'Kâr %': p.cost > 0 ? Math.round(((p.price - p.cost) / p.cost) * 100) : 0,
          Kategori: p.category || '-',
        }));
      result.push({ label: '📦 Stok Raporu', data: products });
    }
    if (modules.cari) {
      const cari = db.cari
        .filter((c) => !c.deleted)
        .map((c) => ({
          Ad: c.name,
          Tür: c.type === 'musteri' ? 'Müşteri' : 'Tedarikçi',
          Bakiye: c.balance,
          Telefon: c.phone || '-',
          'E-posta': c.email || '-',
        }));
      result.push({ label: '👤 Cari Raporu', data: cari });
    }
    if (modules.kasa) {
      const kasa = db.kasa
        .filter((k) => !k.deleted && k.createdAt >= start.toISOString() && k.createdAt <= end.toISOString())
        .map((k) => ({
          Tarih: formatDate(k.createdAt),
          Tür: k.type === 'gelir' ? 'Gelir' : 'Gider',
          Tutar: k.amount,
          Kasa: k.kasa,
          Kategori: k.category || '-',
          Açıklama: k.description || '-',
        }));
      result.push({ label: '💰 Kasa Raporu', data: kasa });
    }
    if (modules.satis) {
      const satis = db.sales
        .filter((s) => !s.deleted && s.createdAt >= start.toISOString() && s.createdAt <= end.toISOString())
        .map((s) => ({
          Tarih: formatDate(s.createdAt),
          'Fatura No': s.invoiceNo || '-',
          Ürün: s.productName,
          Adet: s.quantity,
          Toplam: s.total,
          'Kâr': s.profit,
          Ödeme: s.payment,
          Müşteri: s.cariName || '-',
        }));
      result.push({ label: '📈 Satış Raporu', data: satis });
    }
    setGenerated(result);
  };

  const downloadAll = () => {
    if (!generated) return;
    generated.forEach((rep) => {
      exportToExcel(rep.data, rep.label.toLowerCase().replace(' ', '_'));
    });
  };

  return (
    <div className={styles.flexCol20}>
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          padding: 20,
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 16 }}>
          Custom Report Generator
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {Object.entries(modules).map(([key, val]) => (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '6px 12px',
                background: val ? 'rgba(255,87,34,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${val ? 'rgba(255,87,34,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 8,
                fontSize: '0.82rem',
                color: val ? '#ff7043' : '#64748b',
              }}
            >
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => setModules({ ...modules, [key]: e.target.checked })}
                style={{ accentColor: '#ff5722' }}
              />
              {key === 'stok' ? 'Stok' : key === 'cari' ? 'Cari' : key === 'kasa' ? 'Kasa' : 'Satış'}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={generate}
            style={{
              background: '#ff5722',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Generate
          </button>
          <button
            onClick={downloadAll}
            disabled={!generated}
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 8,
              color: '#10b981',
              padding: '8px 20px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Download All
          </button>
        </div>
      </div>

      {generated && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {generated.map((rep, i) => (
            <div
              key={i}
              style={{
                background: '#111e33',
                borderRadius: 14,
                padding: 16,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rep.label}</span>
                <button
                  onClick={() => exportToExcel(rep.data, rep.label.toLowerCase().replace(' ', '_'))}
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: 6,
                    color: '#10b981',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  📥
                </button>
              </div>
              <div className={styles.overflowAuto}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e3a5f' }}>
                      {Object.keys(rep.data[0] || {}).map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '6px 10px',
                            color: '#475569',
                            fontWeight: 600,
                            textAlign: 'left',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rep.data.slice(0, 10).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} style={{ padding: '6px 10px', color: 'var(--text-dim)' }}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rep.data.length > 10 && (
                  <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.7rem', color: '#64748b' }}>
                    Showing first 10 rows. Export for full data.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
