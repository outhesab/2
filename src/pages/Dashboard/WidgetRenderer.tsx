import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatMoney, formatDate } from '@/lib/utils-tr';
import { Empty, EmptyHeader, EmptyTitle, EmptyMedia } from '@/components/ui/empty';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getCategorySales } from '@/lib/dbUtils';
import type { DB } from '@/types';
import type { WidgetId } from '@/config/widgets';
import { WidgetCard } from './WidgetCard';
import { LegendDot, QuickStat } from './DashboardCommon';
import { Oneriler } from './Oneriler';
import { KasaSayimWidget } from './KasaSayimWidget';
import { YedekHatirlatmaWidget } from './YedekHatirlatmaWidget';
import { chartStyle, chartAxisStyle } from './DashboardUtils';
import type { DashboardStats } from './useStatCards';

interface WidgetRendererProps {
  id: WidgetId;
  stats: DashboardStats;
  db: DB;
  onTabChange: (tab: string) => void;
}

export function WidgetRenderer({ id, stats, db, onTabChange }: WidgetRendererProps) {
  const chartData = useMemo(() => {
    const days: Record<string, { revenue: number; profit: number; count: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
      days[key] = { revenue: 0, profit: 0, count: 0 };
    }
    db.sales
      .filter((s) => !s.deleted && s.status === 'tamamlandi')
      .forEach((s) => {
        const diff = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 86400000);
        if (diff <= 6) {
          const key = new Date(s.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
          if (days[key]) {
            days[key].revenue += s.total;
            days[key].profit += s.profit;
            days[key].count++;
          }
        }
      });
    return Object.entries(days).map(([date, v]) => ({ date, ...v }));
  }, [db.sales]);

  const categoryRevenue = useMemo(() => {
    const catSales = getCategorySales(db);
    const cats = db.productCategories || [];
    return Object.entries(catSales).map(([id, v]) => ({
      name: cats.find((c) => c.id === id)?.name || id,
      value: v.ciro,
    }));
  }, [db]);

  const recentSales = useMemo(
    () =>
      [...db.sales]
        .filter((s) => !s.deleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8),
    [db.sales],
  );

  const recentActivity = useMemo(
    () =>
      [...db._activityLog]
        .sort(
          (a, b) => new Date(b.time || b.createdAt || '').getTime() - new Date(a.time || a.createdAt || '').getTime(),
        )
        .slice(0, 6),
    [db._activityLog],
  );

  switch (id) {
    case 'chart':
      return (
        <WidgetCard
          title="Son 7 Günlük Performans"
          subtitle="Ciro ve kâr trendi"
          extra={
            <div className="dash-chart-extra">
              <LegendDot color="var(--color-danger)" label="Ciro" />
              <LegendDot color="var(--color-success)" label="Kâr" />
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
              <defs>
                <linearGradient id="ciroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5722" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff5722" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="karGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={chartAxisStyle}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Gün',
                  position: 'insideBottomRight',
                  offset: -4,
                  style: { fill: 'var(--text-dim)', fontSize: 10 },
                }}
              />
              <YAxis
                tick={chartAxisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                label={{
                  value: '₺',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 8,
                  style: { fill: 'var(--text-dim)', fontSize: 10 },
                }}
              />
              <Tooltip
                formatter={(v: number, n: string) => [formatMoney(v), n === 'revenue' ? 'Ciro' : 'Kâr']}
                labelFormatter={(label) => `📅 ${label}`}
                contentStyle={chartStyle.contentStyle}
                labelStyle={chartStyle.labelStyle}
                itemStyle={chartStyle.itemStyle}
                cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#ff5722"
                strokeWidth={2.5}
                fill="url(#ciroGrad)"
                dot={{ r: 3, fill: '#ff5722', stroke: 'var(--bg-base)', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#ff5722', stroke: 'var(--text-primary)', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#karGrad)"
                dot={{ r: 3, fill: '#10b981', stroke: 'var(--bg-base)', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#10b981', stroke: 'var(--text-primary)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </WidgetCard>
      );
    case 'quickStats':
      return (
        <WidgetCard title="📊 Hızlı Özet" subtitle="Genel durum">
          <div className="dash-tips-list">
            <QuickStat
              label="Toplam Ürün"
              value={String(db.products.filter((p) => !p.deleted).length)}
              color="#3b82f6"
              icon="📦"
            />
            <QuickStat
              label="Toplam Satış"
              value={String(db.sales.filter((s) => !s.deleted && s.status === 'tamamlandi').length)}
              color="#10b981"
              icon="🛒"
            />
            <QuickStat label="Tedarikçi" value={String(db.suppliers.length)} color="#f59e0b" icon="🏭" />
            <QuickStat
              label="Cari Müşteri"
              value={String(db.cari.filter((c) => !c.deleted && c.type === 'musteri').length)}
              color="#8b5cf6"
              icon="👤"
            />
            <QuickStat label="Bek. Sipariş" value={String(stats.pendingOrders)} color="#ef4444" icon="📋" />
          </div>
        </WidgetCard>
      );
    case 'recentSales':
      return (
        <WidgetCard
          title="🛒 Son Satışlar"
          subtitle={`${db.sales.length} toplam kayıt`}
          extra={
            <motion.button
              onClick={() => onTabChange('sales')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="dash-son-satislar-btn"
            >
              Tümü →
            </motion.button>
          }
        >
          {recentSales.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia>🛒</EmptyMedia>
                <EmptyTitle>Henüz satış yok</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            recentSales.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
                whileHover={{ x: 4, background: 'var(--bg-card)' }}
                className={`dash-sale-row${i > 0 ? ' bordered' : ''}`}
              >
                <div className={`dash-sale-icon ${s.status === 'tamamlandi' ? 'completed' : 'returned'}`}>
                  {s.status === 'tamamlandi' ? '✓' : '↩'}
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                      {s.productName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="dash-sale-name font-medium">{s.productName}</div>
                    <div className="dash-sale-date text-xs text-muted-foreground">{formatDate(s.createdAt)}</div>
                  </div>
                </div>
                <div className="dash-sale-amount">
                  <div className={`dash-sale-total ${s.status === 'tamamlandi' ? 'completed' : ''}`}>
                    {formatMoney(s.total)}
                  </div>
                  <div className="dash-sale-payment">{s.payment}</div>
                </div>
              </motion.div>
            ))
          )}
        </WidgetCard>
      );
    case 'tips':
      return <Oneriler db={db} onTabChange={onTabChange} />;
    case 'stockAlerts':
      if (stats.outOfStock === 0 && stats.lowStock === 0) return null;
      return (
        <WidgetCard
          title="⚠️ Stok Uyarıları"
          subtitle=""
          extra={
            <motion.button
              onClick={() => onTabChange('products')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="dash-stok-uyari-btn"
            >
              Görüntüle →
            </motion.button>
          }
        >
          {stats.outOfStock > 0 && (
            <motion.div
              key="out-of-stock"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="dash-stock-alert-row"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="dash-stock-alert-dot"
                style={{ background: 'var(--color-danger)' }}
              />
              <span className="dash-stock-alert-text">
                <strong className="dash-stock-alert-strong danger">{stats.outOfStock} ürün</strong> stok bitti
              </span>
            </motion.div>
          )}
          {stats.lowStock > 0 && (
            <motion.div
              key="low-stock"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="dash-stock-alert-row"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
                className="dash-stock-alert-dot"
                style={{ background: '#f59e0b' }}
              />
              <span className="dash-stock-alert-text">
                <strong className="dash-stock-alert-strong warning">{stats.lowStock} üründe</strong> az stok uyarısı
              </span>
            </motion.div>
          )}
        </WidgetCard>
      );
    case 'activity':
      return (
        <WidgetCard title="📋 Son Aktiviteler" subtitle="">
          {recentActivity.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia>📋</EmptyMedia>
                <EmptyTitle>Aktivite bulunamadı</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            recentActivity.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                whileHover={{ x: 3 }}
                className="dash-activity-row"
              >
                <motion.div
                  className="dash-activity-dot"
                  whileHover={{ scale: 2, background: 'var(--color-danger)' }}
                />
                <div className="dash-activity-content">
                  <div className="dash-activity-action">{a.action}</div>
                  {a.detail && <div className="dash-activity-detail">{a.detail}</div>}
                </div>
                <div className="dash-activity-time">{formatDate(a.time || a.createdAt || '')}</div>
              </motion.div>
            ))
          )}
        </WidgetCard>
      );
    case 'excelBar':
      return (
        <div className="dash-excel-bar">
          <span className="dash-excel-label">📊 Excel İndir:</span>
          {[
            {
              label: 'Tüm Rapor',
              sheets: ['stok', 'satislar', 'cari', 'kasa'] as ('stok' | 'satislar' | 'cari' | 'kasa')[],
              color: '#ff5722',
            },
            {
              label: 'Satışlar',
              sheets: ['satislar'] as ('stok' | 'satislar' | 'cari' | 'kasa')[],
              color: '#10b981',
            },
            { label: 'Stok', sheets: ['stok'] as ('stok' | 'satislar' | 'cari' | 'kasa')[], color: '#3b82f6' },
            { label: 'Kasa', sheets: ['kasa'] as ('stok' | 'satislar' | 'cari' | 'kasa')[], color: '#f59e0b' },
          ].map((btn) => (
            <motion.button
              key={btn.label}
              onClick={async () => {
                const { exportToExcel } = await import('@/lib/excelExport');
                exportToExcel(db, { sheets: btn.sheets });
              }}
              whileHover={{ scale: 1.04, background: `${btn.color}25` }}
              whileTap={{ scale: 0.96 }}
              className="dash-excel-btn"
              style={{ background: `${btn.color}15`, border: `1px solid ${btn.color}30`, color: btn.color }}
            >
              {btn.label}
            </motion.button>
          ))}
        </div>
      );
    case 'categoryChart':
      if (categoryRevenue.length === 0) return null;
      return (
        <WidgetCard title="🍩 Kategori Dağılımı" subtitle="Satış kategorileri">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={categoryRevenue.slice(0, 6)} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
              <XAxis dataKey="name" tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <YAxis
                tick={chartAxisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <Tooltip
                formatter={(v: number) => [formatMoney(v), 'Ciro']}
                labelFormatter={(label) => `🏷️ ${label}`}
                contentStyle={chartStyle.contentStyle}
                labelStyle={chartStyle.labelStyle}
                itemStyle={chartStyle.itemStyle}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" fill="#ff5722" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </WidgetCard>
      );
    case 'kasaSayim':
      return <KasaSayimWidget db={db} />;
    case 'yedekHatirlatma':
      return <YedekHatirlatmaWidget />;
    default:
      return null;
  }
}
