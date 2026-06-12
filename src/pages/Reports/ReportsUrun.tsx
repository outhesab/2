import { useState, useMemo } from 'react';
import { exportArrayToExcel as exportToExcel } from '@/lib/excelExport';
import { formatMoney } from '@/lib/utils-tr';
import { KpiCard, SectionBox, EmptyChart } from './ReportsCommon';
import { ReportProps } from './types';
import styles from '@/styles/common.module.css';

export function ReportsUrun({ db, start, end }: ReportProps) {
  const [sortBy, setSortBy] = useState<'ciro' | 'kar' | 'adet' | 'marj'>('ciro');

  const productStats = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        category: string;
        ciro: number;
        kar: number;
        adet: number;
        cost: number;
        price: number;
        stock: number;
      }
    > = {};
    db.sales
      .filter(
        (s) =>
          s.status === 'tamamlandi' && !s.deleted && new Date(s.createdAt) >= start && new Date(s.createdAt) <= end,
      )
      .forEach((s) => {
        const id = s.productId || s.productName;
        const p = db.products.find((x) => x.id === s.productId);
        if (!map[id])
          map[id] = {
            name: s.productName,
            category: s.productCategory || '',
            ciro: 0,
            kar: 0,
            adet: 0,
            cost: p?.cost || 0,
            price: p?.price || 0,
            stock: p?.stock || 0,
          };
        map[id].ciro += s.total;
        map[id].kar += s.profit;
        map[id].adet += s.quantity;
      });
    return Object.values(map).sort((a, b) => {
      if (sortBy === 'ciro') return b.ciro - a.ciro;
      if (sortBy === 'kar') return b.kar - a.kar;
      if (sortBy === 'adet') return b.adet - a.adet;
      return (b.ciro ? b.kar / b.ciro : 0) - (a.ciro ? a.kar / a.ciro : 0);
    });
  }, [db.sales, db.products, start, end, sortBy]);

  const stokDurum = useMemo(() => {
    const products = db.products.filter((p) => !p.deleted);
    return {
      toplam: products.length,
      biten: products.filter((p) => p.stock === 0).length,
      az: products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
      normal: products.filter((p) => p.stock > p.minStock).length,
      deger: products.reduce((s, p) => s + p.cost * p.stock, 0),
    };
  }, [db.products]);

  const handleExport = () => {
    exportToExcel(
      productStats.map((p) => ({
        Ürün: p.name,
        Kategori: p.category,
        Ciro: p.ciro,
        Kâr: p.kar,
        'Marj %': p.ciro ? +((p.kar / p.ciro) * 100).toFixed(1) : 0,
        'Satış Adedi': p.adet,
        'Mevcut Stok': p.stock,
      })),
      'urun-raporu',
    );
  };

  return (
    <div className={styles.flexCol20}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
          gap: 12,
        }}
      >
        <KpiCard icon="📦" label="Toplam Ürün" value={String(stokDurum.toplam)} color="#06b6d4" />
        <KpiCard icon="✅" label="Normal Stok" value={String(stokDurum.normal)} color="#10b981" />
        <KpiCard icon="⚠️" label="Az Stok" value={String(stokDurum.az)} color="#f59e0b" />
        <KpiCard icon="❌" label="Biten" value={String(stokDurum.biten)} color="#ef4444" />
        <KpiCard icon="💎" label="Stok Değeri" value={formatMoney(stokDurum.deger)} color="#8b5cf6" />
      </div>

      <SectionBox
        title="🏆 Ürün Performansı"
        action={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['ciro', 'kar', 'adet', 'marj'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  background: sortBy === s ? 'rgba(255,87,34,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${sortBy === s ? 'rgba(255,87,34,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 6,
                  color: sortBy === s ? '#ff7043' : '#64748b',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {s === 'ciro' ? 'Ciro' : s === 'kar' ? 'Kâr' : s === 'adet' ? 'Adet' : 'Marj'}
              </button>
            ))}
            <button
              onClick={handleExport}
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 6,
                color: '#10b981',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              📥
            </button>
          </div>
        }
      >
        <div
          style={{
            marginBottom: 10,
            padding: '7px 10px',
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8,
            fontSize: '0.75rem',
            color: '#f59e0b',
          }}
        >
          ℹ️ Kâr ve marj değerleri satış anındaki maliyete göre hesaplanır. Ürün maliyeti sonradan değiştirilirse geçmiş
          satışlar etkilenmez.
        </div>
        {productStats.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className={styles.overflowAuto}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.83rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #1e3a5f' }}>
                  {['#', 'Ürün', 'Ciro', 'Kâr', 'Marj', 'Adet', 'Stok'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '7px 10px',
                        color: '#475569',
                        fontWeight: 600,
                        textAlign: h === 'Ürün' || h === '#' ? 'left' : 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productStats.slice(0, 30).map((p, i) => {
                  const marj = p.ciro ? (p.kar / p.ciro) * 100 : 0;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                      }}
                    >
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{i + 1}</td>
                      <td
                        style={{
                          padding: '8px 10px',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          color: '#10b981',
                          fontWeight: 700,
                          textAlign: 'right',
                        }}
                      >
                        {formatMoney(p.ciro)}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          color: '#3b82f6',
                          textAlign: 'right',
                        }}
                      >
                        {formatMoney(p.kar)}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          color: marj >= 20 ? '#10b981' : marj >= 10 ? '#f59e0b' : '#ef4444',
                          textAlign: 'right',
                          fontWeight: 600,
                        }}
                      >
                        %{marj.toFixed(1)}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          color: 'var(--text-dim)',
                          textAlign: 'right',
                        }}
                      >
                        {p.adet}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <span
                          style={{
                            color: p.stock === 0 ? '#ef4444' : p.stock <= 5 ? '#f59e0b' : '#10b981',
                            fontWeight: 600,
                          }}
                        >
                          {p.stock}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionBox>
    </div>
  );
}
