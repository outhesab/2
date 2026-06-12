import { useState, useMemo } from 'react';
import { exportArrayToExcel as exportToExcel } from '@/lib/excelExport';
import { formatMoney } from '@/lib/utils-tr';
import { KpiCard, SectionBox, EmptyChart, TT_STYLE } from './ReportsCommon';
import { ReportProps } from './types';
import styles from '@/styles/common.module.css';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

export function ReportsCari({ db }: ReportProps) {
  const [filter, setFilter] = useState<'all' | 'musteri' | 'tedarikci'>('musteri');
  const [search, setSearch] = useState('');

  const now = new Date();
  const cariList = useMemo(() => {
    let list = db.cari.filter((c) => !c.deleted && (filter === 'all' ? true : c.type === filter));
    if (search) list = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [db.cari, filter, search]);

  const agingData = useMemo(() => {
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    db.cari
      .filter((c) => !c.deleted && c.type === 'musteri' && c.balance > 0)
      .forEach((c) => {
        const lastSale = db.sales
          .filter((s) => s.cariId === c.id && s.status === 'tamamlandi')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const days = lastSale ? Math.floor((now.getTime() - new Date(lastSale.createdAt).getTime()) / 86400000) : 999;
        if (days <= 30) buckets['0-30'] += c.balance;
        else if (days <= 60) buckets['31-60'] += c.balance;
        else if (days <= 90) buckets['61-90'] += c.balance;
        else buckets['90+'] += c.balance;
      });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [db.cari, db.sales]);

  const totals = useMemo(
    () => ({
      musteri: db.cari
        .filter((c) => !c.deleted && c.type === 'musteri' && c.balance > 0)
        .reduce((s, c) => s + c.balance, 0),
      tedarikci: db.cari
        .filter((c) => !c.deleted && c.type === 'tedarikci' && c.balance > 0)
        .reduce((s, c) => s + c.balance, 0),
      musteri_sayisi: db.cari.filter((c) => !c.deleted && c.type === 'musteri' && c.balance > 0).length,
      tedarikci_sayisi: db.cari.filter((c) => !c.deleted && c.type === 'tedarikci' && c.balance > 0).length,
    }),
    [db.cari],
  );

  const handleExport = () => {
    exportToExcel(
      cariList.map((c) => ({
        Ad: c.name,
        Tip: c.type === 'musteri' ? 'Müşteri' : 'Tedarikçi',
        Bakiye: c.balance,
        Telefon: c.phone || '',
        'Vergi No': c.taxNo || '',
      })),
      'cari-raporu',
    );
  };

  return (
    <div className={styles.flexCol20}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
          gap: 12,
        }}
      >
        <KpiCard
          icon="📥"
          label="Toplam Alacak"
          value={formatMoney(totals.musteri)}
          sub={`${totals.musteri_sayisi} müşteri`}
          color="#ef4444"
        />
        <KpiCard
          icon="📤"
          label="Toplam Borç"
          value={formatMoney(totals.tedarikci)}
          sub={`${totals.tedarikci_sayisi} tedarikçi`}
          color="#f59e0b"
        />
        <KpiCard
          icon="⚖️"
          label="Net Pozisyon"
          value={formatMoney(totals.musteri - totals.tedarikci)}
          color={totals.musteri >= totals.tedarikci ? '#10b981' : '#ef4444'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionBox title="📊 Alacak Yaşlandırma (Müşteri)">
          {agingData.every((d) => d.value === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agingData} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={55} />
                <Tooltip formatter={(v: number) => [formatMoney(v), 'Tutar']} contentStyle={TT_STYLE} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {agingData.map((_, i) => (
                    <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444', '#7f1d1d'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionBox>

        <SectionBox title="🥧 Cari Dağılım">
          {(() => {
            const data = [
              { name: 'Alacak', value: totals.musteri },
              { name: 'Borç', value: totals.tedarikci },
            ].filter((d) => d.value > 0);
            if (!data.length) return <EmptyChart />;
            return (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatMoney(v), '']} contentStyle={TT_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </SectionBox>
      </div>

      <SectionBox
        title="👥 Cari Listesi"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara..."
              style={{
                padding: '5px 10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 7,
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                width: 120,
              }}
            />
            {(['all', 'musteri', 'tedarikci'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'rgba(255,87,34,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${filter === f ? 'rgba(255,87,34,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 7,
                  color: filter === f ? '#ff7043' : '#64748b',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                {f === 'all' ? 'Tümü' : f === 'musteri' ? 'Müşteri' : 'Tedarikçi'}
              </button>
            ))}
            <button
              onClick={handleExport}
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 7,
                color: '#10b981',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              📥
            </button>
          </div>
        }
      >
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
                {['Ad', 'Tip', 'Bakiye', 'Telefon'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '7px 10px',
                      color: '#475569',
                      fontWeight: 600,
                      textAlign: h === 'Bakiye' ? 'right' : 'left',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cariList.slice(0, 50).map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td
                    style={{
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {c.name}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span
                      style={{
                        background: c.type === 'musteri' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)',
                        color: c.type === 'musteri' ? '#60a5fa' : '#fbbf24',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {c.type === 'musteri' ? 'Müşteri' : 'Tedarikçi'}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: c.balance > 0 ? '#ef4444' : c.balance < 0 ? '#10b981' : '#64748b',
                    }}
                  >
                    {formatMoney(Math.abs(c.balance))} {c.balance > 0 ? '▲' : c.balance < 0 ? '▼' : ''}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBox>
    </div>
  );
}
