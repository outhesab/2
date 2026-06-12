import { useMemo } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { exportArrayToExcel as exportToExcel } from '@/lib/excelExport';
import { formatMoney } from '@/lib/utils-tr';
import { KpiCard, SectionBox, EmptyChart, TT_STYLE } from './ReportsCommon';
import { ReportProps } from './types';
import styles from '@/styles/common.module.css';
import { COLORS } from './ReportsCommon';

export function ReportsKasa({ db, start, end }: ReportProps) {
  const entries = useMemo(
    () => db.kasa.filter((e) => !e.deleted && new Date(e.createdAt) >= start && new Date(e.createdAt) <= end),
    [db.kasa, start, end],
  );
  
  const kasalar = db.kasalar || [
    { id: 'nakit', name: 'Nakit', icon: '💵' },
    { id: 'banka', name: 'Banka', icon: '🏦' },
  ];

  const gelir = entries.filter((e) => e.type === 'gelir').reduce((s, e) => s + e.amount, 0);
  const gider = entries.filter((e) => e.type === 'gider').reduce((s, e) => s + e.amount, 0);
  const net = gelir - gider;

  const kasaBakiye = useMemo(() => {
    const map: Record<string, number> = {};
    kasalar.forEach((k) => (map[k.id] = 0));
    db.kasa
      .filter((e) => !e.deleted)
      .forEach((e) => {
        map[e.kasa] = (map[e.kasa] || 0) + (e.type === 'gelir' ? e.amount : -e.amount);
      });
    return map;
  }, [db.kasa, kasalar]);

  const monthlyKasa = useMemo(() => {
    const map: Record<string, { gelir: number; gider: number }> = {};
    entries.forEach((e) => {
      const key = new Date(e.createdAt).toLocaleDateString('tr-TR', {
        month: 'short',
        year: '2-digit',
      });
      if (!map[key]) map[key] = { gelir: 0, gider: 0 };
      if (e.type === 'gelir') map[key].gelir += e.amount;
      else map[key].gider += e.amount;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [entries]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    entries
      .filter((e) => e.type === 'gider')
      .forEach((e) => {
        const cat = e.category || 'Diğer';
        map[cat] = (map[cat] || 0) + e.amount;
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [entries]);

  const handleExport = () => {
    exportToExcel(
      entries.map((e) => ({
        Tarih: e.createdAt,
        Tip: e.type === 'gelir' ? 'Gelir' : 'Gider',
        Tutar: e.amount,
        Kasa: e.kasa,
        Kategori: e.category || '',
        Açıklama: e.description || '',
      })),
      'kasa-raporu',
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
        <KpiCard icon="📥" label="Dönem Gelir" value={formatMoney(gelir)} color="#10b981" />
        <KpiCard icon="📤" label="Dönem Gider" value={formatMoney(gider)} color="#ef4444" />
        <KpiCard icon="⚖️" label="Net Akış" value={formatMoney(net)} color={net >= 0 ? '#10b981' : '#ef4444'} />
        {kasalar.map((k) => (
          <KpiCard
            key={k.id}
            icon={k.icon}
            label={k.name}
            value={formatMoney(kasaBakiye[k.id] || 0)}
            color={kasaBakiye[k.id] >= 0 ? '#8b5cf6' : '#ef4444'}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionBox
          title="📅 Aylık Nakit Akışı"
          action={
            <button
              onClick={handleExport}
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 8,
                color: '#10b981',
                padding: '5px 12px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              📥 Excel
            </button>
          }
        >
          {monthlyKasa.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyKasa}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                />
                <Tooltip formatter={(v: number) => [formatMoney(v), '']} contentStyle={TT_STYLE} />
                <Legend />
                <Bar dataKey="gelir" fill="#10b981" name="Gelir" radius={[3, 3, 0, 0]} />
                <Bar dataKey="gider" fill="#ef4444" name="Gider" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionBox>

        <SectionBox title="🔴 Gider Kategorileri">
          {categoryData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={2}
                  label={({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '')}
                  labelLine={false}
                >
                  {categoryData.map((_, i) => (
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
    </div>
  );
}
