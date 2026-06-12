import { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { formatMoney } from '@/lib/utils-tr';
import { 
  computeAlacak, 
  computeKasaToplam, 
  computeStokDeger, 
  getLowStockProducts, 
  getOutOfStockProducts 
} from '@/lib/dbUtils';
import { KpiCard, SectionBox, EmptyChart, TT_STYLE } from './ReportsCommon';
import { ReportProps } from './types';
import styles from '@/styles/common.module.css';
import { COLORS } from './ReportsCommon';

export function ReportsOzet({ db, start, end }: ReportProps) {
  const sales = useMemo(
    () =>
      db.sales.filter(
        (s) =>
          s.status === 'tamamlandi' && !s.deleted && new Date(s.createdAt) >= start && new Date(s.createdAt) <= end,
      ),
    [db.sales, start, end],
  );
  
  const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
  const prevSales = useMemo(
    () =>
      db.sales.filter(
        (s) =>
          s.status === 'tamamlandi' &&
          !s.deleted &&
          new Date(s.createdAt) >= prevStart &&
          new Date(s.createdAt) < start,
      ),
    [db.sales, prevStart, start],
  );

  const ciro = sales.reduce((s, x) => s + x.total, 0);
  const kar = sales.reduce((s, x) => s + x.profit, 0);
  const prevCiro = prevSales.reduce((s, x) => s + x.total, 0);
  const delta = (curr: number, prev: number) =>
    prev === 0 ? null : `${curr >= prev ? '▲' : '▼'} %${Math.abs(((curr - prev) / prev) * 100).toFixed(1)}`;

  const alacak = computeAlacak(db);
  const kasaToplam = computeKasaToplam(db);
  const stokDeger = computeStokDeger(db);

  const dailyData = useMemo(() => {
    const map: Record<string, { ciro: number; kar: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
      });
      map[key] = { ciro: 0, kar: 0 };
    }
    db.sales
      .filter((s) => s.status === 'tamamlandi' && !s.deleted)
      .forEach((s) => {
        const d = new Date(s.createdAt);
        const key = d.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'short',
        });
        if (map[key]) {
          map[key].ciro += s.total;
          map[key].kar += s.profit;
        }
      });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [db.sales]);

  return (
    <div className={styles.flexCol20}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
          gap: 12,
        }}
      >
        <KpiCard
          icon="💰"
          label="Ciro"
          value={formatMoney(ciro)}
          sub={delta(ciro, prevCiro) || undefined}
          color="#10b981"
        />
        <KpiCard
          icon="📈"
          label="Kâr"
          value={formatMoney(kar)}
          sub={`Oran: %${ciro ? ((kar / ciro) * 100).toFixed(1) : 0}`}
          color="#3b82f6"
        />
        <KpiCard
          icon="🛒"
          label="Satış"
          value={String(sales.length)}
          sub={delta(sales.length, prevSales.length) || undefined}
          color="#f59e0b"
        />
        <KpiCard icon="👤" label="Alacak" value={formatMoney(alacak)} color="#ef4444" />
        <KpiCard icon="🏦" label="Kasa" value={formatMoney(kasaToplam)} color="#8b5cf6" />
        <KpiCard icon="📦" label="Stok Değeri" value={formatMoney(stokDeger)} color="#06b6d4" />
      </div>

      <SectionBox title="📅 Son 14 Gün — Günlük Ciro & Kâr">
        {dailyData.every((d) => d.ciro === 0) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="gCiro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5722" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff5722" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gKar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <Tooltip formatter={(v: number) => [formatMoney(v), '']} contentStyle={TT_STYLE} />
              <Legend />
              <Area
                type="monotone"
                dataKey="ciro"
                stroke="#ff5722"
                fill="url(#gCiro)"
                name="Ciro"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="kar"
                stroke="#10b981"
                fill="url(#gKar)"
                name="Kâr"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </SectionBox>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionBox title="⚠️ Stok Uyarıları">
          {(() => {
            const out = getOutOfStockProducts(db);
            const low = getLowStockProducts(db);
            if (!out.length && !low.length)
              return (
                <div
                  style={{
                    color: '#10b981',
                    fontSize: '0.85rem',
                    padding: '12px 0',
                  }}
                >
                  ✅ Tüm stoklar yeterli
                </div>
              );
            return (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {out.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'rgba(239,68,68,0.08)',
                      borderRadius: 8,
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}
                  >
                    <span style={{ color: '#fca5a5', fontSize: '0.83rem' }}>{p.name}</span>
                    <span
                      style={{
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                      }}
                    >
                      BĐTĐ
                    </span>
                  </div>
                ))}
                {low.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'rgba(245,158,11,0.08)',
                      borderRadius: 8,
                      border: '1px solid rgba(245,158,11,0.2)',
                    }}
                  >
                    <span style={{ color: '#fcd34d', fontSize: '0.83rem' }}>{p.name}</span>
                    <span
                      style={{
                        color: '#f59e0b',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                      }}
                    >
                      {p.stock} adet
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </SectionBox>

        <SectionBox title="🏆 Top 5 Müşteri (Alacak)">
          {(() => {
            const top = [...db.cari]
              .filter((c) => c.type === 'musteri' && c.balance > 0)
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 5);
            if (!top.length) return <EmptyChart />;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {top.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: COLORS[i],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        color: '#cbd5e1',
                        fontSize: '0.83rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: '0.83rem',
                      }}
                    >
                      {formatMoney(c.balance)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </SectionBox>
      </div>
    </div>
  );
}
