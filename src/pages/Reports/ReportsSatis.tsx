import { useMemo } from 'react';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { exportArrayToExcel as exportToExcel } from '@/lib/excelExport';
import { formatMoney } from '@/lib/utils-tr';
import { KpiCard, SectionBox, EmptyChart, TT_STYLE } from './ReportsCommon';
import { ReportProps } from './types';
import styles from '@/styles/common.module.css';
import rStyles from './Reports.module.css';
import sStyles from './ReportsSatis.module.css';
import { COLORS } from './ReportsCommon';

export function ReportsSatis({ db, start, end }: ReportProps) {
  const sales = useMemo(
    () =>
      db.sales.filter(
        (s) =>
          s.status === 'tamamlandi' && !s.deleted && new Date(s.createdAt) >= start && new Date(s.createdAt) <= end,
      ),
    [db.sales, start, end],
  );

  const monthlyData = useMemo(() => {
    const map: Record<string, { ciro: number; kar: number; adet: number }> = {};
    sales.forEach((s) => {
      const key = new Date(s.createdAt).toLocaleDateString('tr-TR', {
        month: 'short',
        year: '2-digit',
      });
      if (!map[key]) map[key] = { ciro: 0, kar: 0, adet: 0 };
      map[key].ciro += s.total;
      map[key].kar += s.profit;
      map[key].adet++;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [sales]);

  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      map[s.payment] = (map[s.payment] || 0) + s.total;
    });
    const labels: Record<string, string> = {
      nakit: '💵 Nakit',
      kart: '💳 Kart',
      havale: '🏦 Havale',
      cari: '👤 Cari',
    };
    return Object.entries(map).map(([k, v]) => ({
      name: labels[k] || k,
      value: v,
    }));
  }, [sales]);

  const categoryData = useMemo(() => {
    const map: Record<string, { ciro: number; kar: number; adet: number }> = {};
    sales.forEach((s) => {
      const cat = s.productCategory || 'Diğer';
      if (!map[cat]) map[cat] = { ciro: 0, kar: 0, adet: 0 };
      map[cat].ciro += s.total;
      map[cat].kar += s.profit;
      map[cat].adet += s.quantity;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].ciro - a[1].ciro)
      .map(([name, v]) => ({ name, ...v }));
  }, [sales]);

  const iadeler = db.sales.filter(
    (s) => s.status === 'iade' && !s.deleted && new Date(s.createdAt) >= start && new Date(s.createdAt) <= end,
  );
  const ciro = sales.reduce((s, x) => s + x.total, 0);
  const kar = sales.reduce((s, x) => s + x.profit, 0);

  const handleExport = () => {
    exportToExcel(
      sales.map((s) => ({
        Tarih: s.createdAt,
        Ürün: s.productName,
        Kategori: s.productCategory || '',
        Adet: s.quantity,
        'Birim Fiyat': s.unitPrice,
        Toplam: s.total,
        Kâr: s.profit,
        Ödeme: s.payment,
        Müşteri: s.cariName || '',
      })),
      'satis-raporu',
    );
  };

  return (
    <div className={styles.flexCol20}>
      <div className={styles.gridAuto}>
        <KpiCard icon="💰" label="Dönem Ciro" value={formatMoney(ciro)} color="#10b981" />
        <KpiCard
          icon="📈"
          label="Dönem Kâr"
          value={formatMoney(kar)}
          sub={`Marj: %${ciro ? ((kar / ciro) * 100).toFixed(1) : 0}`}
          color="#3b82f6"
        />
        <KpiCard icon="🛒" label="Satış Adedi" value={String(sales.length)} color="#f59e0b" />
        <KpiCard icon="🔄" label="İade" value={String(iadeler.length)} color="#ef4444" />
        <KpiCard
          icon="🎯"
          label="Ort. Sepet"
          value={formatMoney(sales.length ? ciro / sales.length : 0)}
          color="#8b5cf6"
        />
        <KpiCard
          icon="📦"
          label="Satılan Ürün"
          value={String(sales.reduce((s, x) => s + x.quantity, 0))}
          color="#06b6d4"
        />
      </div>

      <div className={rStyles.twoColGrid}>
        <SectionBox
          title="📅 Aylık Ciro & Kâr"
          action={<button onClick={handleExport} className={sStyles.btnExport}>📥 Excel</button>}
        >
          {monthlyData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                />
                <Tooltip formatter={(v: number) => [formatMoney(v), '']} contentStyle={TT_STYLE} />
                <Legend />
                <Bar dataKey="ciro" fill="#ff5722" name="Ciro" radius={[3, 3, 0, 0]} />
                <Bar dataKey="kar" fill="#10b981" name="Kâr" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionBox>

        <SectionBox title="💳 Ödeme Dağılımı">
          {paymentData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={paymentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [formatMoney(v), '']} contentStyle={TT_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionBox>
      </div>

      <SectionBox title="🏷️ Kategori Bazlı Performans">
        {categoryData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className={styles.overflowAuto}>
            <table className={styles.tableBase}>
              <thead>
                <tr className={styles.trBold}>
                  {['Kategori', 'Ciro', 'Kâr', 'Marj %', 'Adet'].map((h) => (
                    <th
                      key={h}
                      className={sStyles.catTh}
                      style={{ textAlign: h === 'Kategori' ? 'left' : 'right' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryData.map((c, i) => (
                  <tr key={i}>
                    <td className={sStyles.catTdName}>
                      <span
                        className={sStyles.catDot}
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {c.name}
                    </td>
                    <td className={sStyles.catTdCiro}>{formatMoney(c.ciro)}</td>
                    <td className={sStyles.catTdKar}>{formatMoney(c.kar)}</td>
                    <td
                      style={{
                        padding: '9px 12px',
                        color: c.ciro ? (c.kar / c.ciro > 0.2 ? '#10b981' : '#f59e0b') : '#64748b',
                        textAlign: 'right',
                      }}
                    >
                      %{c.ciro ? ((c.kar / c.ciro) * 100).toFixed(1) : 0}
                    </td>
                    <td className={sStyles.catTdAdet}>{c.adet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionBox>
    </div>
  );
}
