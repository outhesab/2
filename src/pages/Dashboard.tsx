import { useMemo, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatMoney, formatDate } from '@/lib/utils-tr';
import type { DB } from '@/types';
import { saveBackupToFirebase, listBackupsFromFirebase, restoreBackupFromFirebase } from '@/hooks/useDB';
import { loadConnConfig } from '@/lib/connConfig';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { logger } from '@/lib/logger';
import { getAppVersion } from '@/lib/version';
import { BRAND_NAME } from '@/config/brand';
import type { WidgetId } from '@/config/widgets';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Package,
  Wallet,
  Landmark,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import {
  getMonthSales,
  computeKasaToplam,
  computeKasaByType,
  computeAlacak,
  computeBorc,
  computeStokDeger,
  getCategorySales,
  getOutOfStockProducts,
  getLowStockProducts,
  getOverdueMusteri,
} from '@/lib/dbUtils';

interface Props {
  db: DB;
  onTabChange: (tab: string) => void;
  save: (updater: (prev: DB) => DB) => void;
}

interface StatCardData {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
  gradient: string;
  sub?: string;
  tab?: string;
  trend?: number;
}

function StatCard({
  icon,
  label,
  value,
  color,
  gradient,
  sub,
  onClick,
  trend,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
  gradient: string;
  sub?: string;
  onClick?: () => void;
  trend?: number;
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02, borderColor: `${color}44` }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`dash-statcard${onClick ? ' clickable' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${gradient})`,
        border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
        boxShadow: `0 2px 8px ${color}10, var(--shadow-lg, 0 8px 40px rgba(0,0,0,0.1))`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="dash-statcard-bg-icon">{icon}</div>
      <div
        className="dash-statcard-accent-line"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      />
      <div className="dash-statcard-icon">{icon}</div>
      <div className="dash-statcard-value" style={{ color }}>
        {value}
      </div>
      {trend !== undefined && (
        <div className={`dash-statcard-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% dün
        </div>
      )}
      <div className="dash-statcard-label">{label}</div>
      {sub && <div className="dash-statcard-sub">{sub}</div>}
      {onClick && (
        <motion.div
          className="dash-statcard-arrow"
          style={{ color: `${color}50` }}
          whileHover={{ x: 3, color }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          →
        </motion.div>
      )}
    </motion.div>
  );
}

function ScrollableCards({ cards, onTabChange }: { cards: StatCardData[]; onTabChange: (tab: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, scroll: 0 });

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      ro.disconnect();
    };
  }, [updateArrows]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, scroll: scrollRef.current?.scrollLeft || 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    scrollRef.current.scrollLeft = dragStart.current.scroll - dx;
  };
  const onPointerUp = () => setIsDragging(false);

  return (
    <div className="dash-scroll-wrap">
      <button className={`dash-nav-btn dash-nav-btn-left ${canLeft ? 'visible' : 'hidden'}`} onClick={() => scroll(-1)}>
        ‹
      </button>
      <button
        className={`dash-nav-btn dash-nav-btn-right ${canRight ? 'visible' : 'hidden'}`}
        onClick={() => scroll(1)}
      >
        ›
      </button>
      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className={`dash-scroll-inner${isDragging ? ' dragging' : ''}`}
        style={{
          maskImage: `linear-gradient(to right, ${canLeft ? 'transparent 0%, black 5%' : 'black 0%'}, ${canRight ? 'black 95%, transparent 100%' : 'black 100%'})`,
        }}
      >
        {cards.map((card, i) => (
          <div key={i} className="dash-scroll-item">
            <StatCard {...card} onClick={card.tab ? () => onTabChange(card.tab!) : undefined} />
          </div>
        ))}
      </div>
    </div>
  );
}

function loadDashboardPrefs(): { leftWidgets: WidgetId[]; brightness: number } {
  try {
    const raw = localStorage.getItem('dashboardPrefs');
    if (raw) return JSON.parse(raw);
  } catch {
    logger.warn('dashboard', "Dashboard tercihleri localStorage'dan okunamadı"); /* localStorage okuma hatası */
  }
  return { leftWidgets: ['chart', 'recentSales', 'tips', 'excelBar'], brightness: 100 };
}

function getDashboardPrefsUrl(): string | null {
  const cfg = loadConnConfig();
  if (!cfg.firebase.enabled || !cfg.firebase.projectId || !cfg.firebase.apiKey) return null;
  return `https://firestore.googleapis.com/v1/projects/${cfg.firebase.projectId}/databases/(default)/documents/config/dashboardPrefs?key=${cfg.firebase.apiKey}`;
}

/* saveDashboardPrefs kaldırıldı — kullanılmıyor */

async function loadDashboardPrefsFromFirebase(): Promise<{ leftWidgets: WidgetId[]; brightness: number } | null> {
  try {
    const url = getDashboardPrefsUrl();
    if (!url) return null;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json?.fields?.data?.stringValue;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    logger.warn('dashboard', "Firebase'den dashboard tercihleri alınamadı");
    return null;
  }
}

const chartStyle = {
  contentStyle: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontSize: '0.82rem',
    boxShadow: '0 8px 24px var(--shadow-lg)',
  },
  labelStyle: { color: 'var(--text-muted)' },
  itemStyle: { color: 'var(--text-primary)' },
};

const chartAxisStyle = { fontSize: 11, fill: 'var(--text-dim)', fontFamily: "'Plus Jakarta Sans', sans-serif" };
export default function Dashboard({ db, onTabChange, save }: Props) {
  const [prefs, setPrefs] = useState(loadDashboardPrefs);

  // Açılışta Firebase'den en güncel prefs'i çek
  useEffect(() => {
    loadDashboardPrefsFromFirebase().then((fbPrefs) => {
      if (fbPrefs) {
        setPrefs(fbPrefs);
        localStorage.setItem('dashboardPrefs', JSON.stringify(fbPrefs));
      }
    });
  }, []);
  const [backupPanel, setBackupPanel] = useState(false);
  const [backups, setBackups] = useState<{ id: string; version: number; label: string; createdAt: string }[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [manualLabel, setManualLabel] = useState('');

  const openBackupPanel = async () => {
    setBackupPanel(true);
    setBackupLoading(true);
    const list = await listBackupsFromFirebase();
    setBackups(list);
    setBackupLoading(false);
  };

  const doManualBackup = async () => {
    setBackupLoading(true);
    const label =
      manualLabel.trim() || `manuel_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`;
    const ok = await saveBackupToFirebase(db, label);
    setBackupMsg(ok ? '✅ Yedek alındı!' : '❌ Yedek alınamadı');
    setManualLabel('');
    const list = await listBackupsFromFirebase();
    setBackups(list);
    setBackupLoading(false);
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const doRestore = async (backupId: string) => {
    if (!confirm(`"${backupId}" yedeğini geri yüklemek istediğinizden emin misiniz? Mevcut veriler değişecek.`)) return;
    setBackupLoading(true);

    // Geri yükleme öncesi mevcut veriyi otomatik yedekle
    const preRestoreLabel = `onceki_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`;
    await saveBackupToFirebase(db, preRestoreLabel).catch(() =>
      logger.error('db', 'Geri yükleme öncesi yedek alınamadı'),
    );

    const restored = await restoreBackupFromFirebase(backupId);
    if (restored) {
      // makeDefaultDB ile merge ederek eksik alanları tamamla
      save((prev) => {
        const merged = { ...prev, ...restored };
        // Zorunlu array alanları boşsa koru
        const arrayKeys = [
          'products',
          'sales',
          'suppliers',
          'orders',
          'cari',
          'kasa',
          'bankTransactions',
          'matchRules',
          'monitorRules',
          'monitorLog',
          'stockMovements',
          'peletSuppliers',
          'peletOrders',
          'boruSuppliers',
          'boruOrders',
          'invoices',
          'budgets',
          'returns',
          '_activityLog',
          'ortakEmanetler',
          'installments',
          'partners',
          'notes',
        ] as const;
        for (const key of arrayKeys) {
          if (!Array.isArray(merged[key])) (merged as Record<string, unknown>)[key] = prev[key] ?? [];
        }
        return merged;
      });
      // Firebase'e de yaz (save() debounce'u beklemeden hemen)
      setTimeout(
        () =>
          saveBackupToFirebase(restored, `restore_sonrasi_${backupId.slice(0, 20)}`).catch(() =>
            logger.error('db', 'Geri yükleme sonrası yedek alınamadı'),
          ),
        1500,
      );
      setBackupMsg('✅ Geri yükleme başarılı! Önceki veri otomatik yedeklendi.');
    } else {
      setBackupMsg('❌ Geri yükleme başarısız');
    }
    setBackupLoading(false);
    setTimeout(() => setBackupMsg(''), 5000);
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const todaySales = db.sales.filter(
      (s) => !s.deleted && s.status === 'tamamlandi' && s.createdAt.slice(0, 10) === todayStr,
    );
    const todayRevenue = todaySales.reduce((s, sale) => s + sale.total, 0);
    const todayProfit = todaySales.reduce((s, sale) => s + sale.profit, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toLocaleDateString('sv-SE');
    const yestSales = db.sales.filter(
      (s) => !s.deleted && s.status === 'tamamlandi' && s.createdAt.slice(0, 10) === yestStr,
    );
    const yestRevenue = yestSales.reduce((s, sale) => s + sale.total, 0);
    const revTrend = yestRevenue > 0 ? ((todayRevenue - yestRevenue) / yestRevenue) * 100 : 0;

    const { ciro: monthRevenue, kar: monthProfit } = getMonthSales(db);

    const outOfStock = getOutOfStockProducts(db).length;
    const lowStock = getLowStockProducts(db).length;

    const totalKasa = computeKasaToplam(db);
    const nakit = computeKasaByType(db, 'nakit');
    const banka = computeKasaByType(db, 'banka');

    const pendingOrders = db.orders.filter((o) => o.status === 'bekliyor').length;
    const totalReceivable = computeAlacak(db);
    const totalPayable = computeBorc(db);
    const posToplamı = db.kasa
      .filter((k) => !k.deleted && ['pos_ziraat', 'pos_is', 'pos_yk'].includes(k.kasa))
      .reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    const netSermaye = nakit + banka + posToplamı + totalReceivable - totalPayable;
    const stokDeger = computeStokDeger(db);

    return {
      todayRevenue,
      todayProfit,
      todaySalesCount: todaySales.length,
      monthRevenue,
      monthProfit,
      outOfStock,
      lowStock,
      totalKasa,
      nakit,
      banka,
      pendingOrders,
      totalReceivable,
      totalPayable,
      netSermaye,
      stokDeger,
      revTrend,
    };
  }, [db]);

  const statCards: StatCardData[] = useMemo(
    () => [
      {
        icon: <DollarSign className="size-5" />,
        label: 'Bugün Ciro',
        value: formatMoney(stats.todayRevenue),
        color: '#10b981',
        gradient: 'rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%',
        sub: `${stats.todaySalesCount} satış`,
        tab: 'sales',
        trend: stats.revTrend,
      },
      {
        icon: <TrendingUp className="size-5" />,
        label: 'Bugün Kâr',
        value: formatMoney(stats.todayProfit),
        color: '#3b82f6',
        gradient: 'rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%',
        sub: `${stats.todayRevenue > 0 ? ((stats.todayProfit / stats.todayRevenue) * 100).toFixed(1) : 0}% marj`,
      },
      {
        icon: <Calendar className="size-5" />,
        label: 'Bu Ay Ciro',
        value: formatMoney(stats.monthRevenue),
        color: '#8b5cf6',
        gradient: 'rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%',
        sub: `Kâr: ${formatMoney(stats.monthProfit)}`,
      },
      {
        icon: <Package className="size-5" />,
        label: 'Stok Değeri',
        value: formatMoney(stats.stokDeger),
        color: '#f59e0b',
        gradient: 'rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%',
        tab: 'stock',
        sub: `${db.products.filter((p) => !p.deleted).length} ürün`,
      },
      {
        icon: <Wallet className="size-5" />,
        label: 'Nakit Kasa',
        value: formatMoney(stats.nakit),
        color: '#06b6d4',
        gradient: 'rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.04) 100%',
        tab: 'kasa',
      },
      {
        icon: <Landmark className="size-5" />,
        label: 'Banka',
        value: formatMoney(stats.banka),
        color: '#6366f1',
        gradient: 'rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%',
        tab: 'kasa',
      },
      {
        icon: <ClipboardList className="size-5" />,
        label: 'Alacak',
        value: formatMoney(stats.totalReceivable),
        color: '#ff5722',
        gradient: 'rgba(255,87,34,0.12) 0%, rgba(255,87,34,0.04) 100%',
        tab: 'cari',
      },
      {
        icon: <AlertTriangle className="size-5" />,
        label: 'Stok Uyarısı',
        value: `${stats.outOfStock + stats.lowStock}`,
        color: '#ef4444',
        gradient: 'rgba(239,68,68,0.12) 0%, rgba(245,158,11,0.06) 100%',
        tab: 'products',
        sub: `${stats.outOfStock} bitti · ${stats.lowStock} az`,
      },
    ],
    [stats, db.products],
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.sales, db.productCategories]);

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

  const renderWidget = (id: WidgetId) => {
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
                  <div className="dash-sale-info">
                    <div className="dash-sale-name">{s.productName}</div>
                    <div className="dash-sale-date">{formatDate(s.createdAt)}</div>
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
                <XAxis dataKey="name" tick={{ ...chartAxisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
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
  };

  const [contentWidth, setContentWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);
  useEffect(() => {
    const onResize = () => setContentWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const showSidePanel = contentWidth >= 1100;

  return (
    <div className="dash-container">
      <ScrollableCards cards={statCards} onTabChange={onTabChange} />

      <div className="dash-header-row">
        <div className="dash-badge-box">
          <span className="dash-badge-label">VERSİYON</span>
          <span className="dash-badge-value">
            {BRAND_NAME} v{getAppVersion()}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 6 }}>
            (DB: {db._version || 0})
          </span>
        </div>
        {(() => {
          try {
            const raw = localStorage.getItem('sobaYonetim') || '';
            const sizeMB = raw.length / (1024 * 1024);
            const maxMB = 10;
            const pct = Math.min(100, (sizeMB / maxMB) * 100);
            const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#10b981';
            return (
              <div className="dash-storage-box" style={{ border: `1px solid ${color}30` }}>
                <span className="dash-storage-label">DEPOLAMA</span>
                <span className="dash-storage-value" style={{ color }}>
                  {sizeMB.toFixed(2)} MB
                </span>
                <div className="dash-storage-bar">
                  <div className="dash-storage-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="dash-storage-pct">%{pct.toFixed(0)}</span>
              </div>
            );
          } catch {
            logger.warn('dashboard', 'Depolama yüzdesi hesaplanamadı');
            return null;
          }
        })()}
        <motion.button
          onClick={openBackupPanel}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="dash-backup-btn"
        >
          💾 Yedek Yönetimi
        </motion.button>
      </div>

      {backupPanel && (
        <div className="dash-backup-panel">
          <div className="dash-backup-header">
            <span className="dash-backup-title">💾 Yedek Yönetimi</span>
            <button onClick={() => setBackupPanel(false)} className="dash-backup-close">
              ✕
            </button>
          </div>
          <div className="dash-backup-input-row">
            <input
              value={manualLabel}
              onChange={(e) => setManualLabel(e.target.value)}
              placeholder="Yedek adı (opsiyonel)"
              className="dash-backup-input"
            />
            <motion.button
              onClick={doManualBackup}
              disabled={backupLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="dash-backup-save-btn"
            >
              {backupLoading ? '...' : '+ Yedek Al'}
            </motion.button>
          </div>
          {backupMsg && (
            <div className={`dash-backup-msg ${backupMsg.startsWith('✅') ? 'success' : 'error'}`}>{backupMsg}</div>
          )}
          <div className="dash-backup-list">
            {backupLoading && backups.length === 0 && <div className="dash-backup-loading">Yükleniyor...</div>}
            {!backupLoading && backups.length === 0 && <div className="dash-backup-empty">Henüz yedek yok</div>}
            {backups.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
                whileHover={{ x: 2, background: 'var(--bg-elevated)' }}
                className="dash-backup-item"
              >
                <div>
                  <div className="dash-backup-item-name">{b.label || b.id}</div>
                  <div className="dash-backup-item-meta">
                    v{b.version} · {b.createdAt ? new Date(b.createdAt).toLocaleString('tr-TR') : ''}
                  </div>
                </div>
                <motion.button
                  onClick={() => doRestore(b.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="dash-backup-restore-btn"
                >
                  🔄 Tam Geri Yükle
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-gunsonu-box">
        <div className="dash-gunsonu-header">
          <span className="dash-gunsonu-icon">⚖️</span>
          <span className="dash-gunsonu-title">Gün Sonu Dengesi</span>
          <span className="dash-gunsonu-hint">Kasa + Banka + Alacak − Borç = Net Sermaye</span>
        </div>
        <div className="dash-gunsonu-row">
          <FormulaItem label="Nakit Kasa" value={stats.nakit} color="#06b6d4" />
          <span className="dash-gunsonu-op">+</span>
          <FormulaItem label="Banka" value={stats.banka} color="#6366f1" />
          <span className="dash-gunsonu-op">+</span>
          <FormulaItem label="Müşteri Alacağı" value={stats.totalReceivable} color="#10b981" />
          <span className="dash-gunsonu-op" style={{ color: 'var(--color-danger)' }}>
            −
          </span>
          <FormulaItem label="Tedarikçi Borcu" value={stats.totalPayable} color="#ef4444" />
          <span className="dash-gunsonu-op">=</span>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="dash-gunsonu-result"
            style={{
              background: stats.netSermaye >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${stats.netSermaye >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            }}
          >
            <div className="dash-gunsonu-result-label">Net Sermaye</div>
            <div
              className="dash-gunsonu-result-value"
              style={{ color: stats.netSermaye >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
            >
              {formatMoney(stats.netSermaye)}
            </div>
          </motion.div>
        </div>
      </div>

      <div className={`dash-grid ${showSidePanel ? 'side-panel' : 'no-side'}`}>
        <div className="dash-left-col">
          <AnimatePresence mode="popLayout">
            {prefs.leftWidgets.map((id, idx) => {
              const widget = renderWidget(id);
              if (!widget) return null;
              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, delay: idx * 0.05 }}
                >
                  {widget}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {prefs.leftWidgets.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia>🧩</EmptyMedia>
                <EmptyTitle>Widget alanı boş</EmptyTitle>
                <EmptyDescription>Ayarlar &gt; Düzenleme Modu üzerinden widget ekleyin</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>

        <motion.div
          className="dash-side-col"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.div
            variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
            className="dash-side-card"
          >
            <div className="dash-side-card-header">
              <span className="dash-side-card-icon">🧩</span>
              <span className="dash-side-card-title">Özet düzeni</span>
            </div>
            <div className="dash-widget-item inactive">
              <span className="dash-widget-item-icon">⚙️</span>
              <span className="dash-widget-item-label inactive">
                Widget yönetimi ve parlaklık kontrolleri Ayarlar &gt; Düzenleme Modu alanına taşındı.
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
            className="dash-side-card"
          >
            <div className="dash-side-card-header">
              <span className="dash-side-card-icon">⚡</span>
              <span className="dash-side-card-title">Hızlı İşlemler</span>
            </div>
            <div className="dash-quick-grid">
              {[
                { label: 'Yeni Satış', icon: '🛒', tab: 'sales', color: '#10b981' },
                { label: 'Ürün Ekle', icon: '📦', tab: 'products', color: '#3b82f6' },
                { label: 'Fatura Oluştur', icon: '🧾', tab: 'fatura', color: '#8b5cf6' },
                { label: 'Kasa İşlemi', icon: '💰', tab: 'kasa', color: '#f59e0b' },
                { label: 'Raporlar', icon: '📈', tab: 'reports', color: '#06b6d4' },
              ].map((q) => (
                <motion.button
                  key={q.tab}
                  onClick={() => onTabChange(q.tab)}
                  whileHover={{ scale: 1.02, background: `${q.color}18` }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="dash-quick-btn"
                  style={{ background: `${q.color}08`, border: `1px solid ${q.color}18`, color: q.color }}
                >
                  <span className="dash-quick-btn-icon">{q.icon}</span>
                  {q.label}
                  <motion.span className="dash-quick-btn-arrow" whileHover={{ x: 3, opacity: 1 }}>
                    →
                  </motion.span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Gün Sonu Kasa Sayımı Widget ──────────────────────────────────────────────
function KasaSayimWidget({ db }: { db: DB }) {
  const [sayimlar, setSayimlar] = useState<Record<string, string>>({});
  const [kaydedildi, setKaydedildi] = useState(false);

  const kasalar = db.kasalar || [
    { id: 'nakit', name: 'Nakit', icon: '💵' },
    { id: 'banka', name: 'Banka', icon: '🏦' },
  ];

  const sistemBakiyeleri = kasalar.reduce(
    (acc, k) => {
      acc[k.id] = db.kasa
        .filter((e) => !e.deleted && e.kasa === k.id)
        .reduce((s, e) => s + (e.type === 'gelir' ? e.amount : -e.amount), 0);
      return acc;
    },
    {} as Record<string, number>,
  );

  const handleKaydet = () => {
    const farklar = kasalar.map((k) => {
      const sayilan = parseFloat(sayimlar[k.id] || '0') || 0;
      const sistem = sistemBakiyeleri[k.id] || 0;
      return { kasa: k.name, sayilan, sistem, fark: sayilan - sistem };
    });
    const log =
      `Gün Sonu Sayım — ${new Date().toLocaleString('tr-TR')}\n` +
      farklar
        .map(
          (f) =>
            `${f.kasa}: Sayılan ${formatMoney(f.sayilan)} | Sistem ${formatMoney(f.sistem)} | Fark ${f.fark >= 0 ? '+' : ''}${formatMoney(f.fark)}`,
        )
        .join('\n');
    logger.info('dashboard', 'Kasa Sayım', { log });
    setKaydedildi(true);
    setTimeout(() => setKaydedildi(false), 3000);
  };

  return (
    <WidgetCard title="🏦 Gün Sonu Kasa Sayımı" subtitle="Fiziksel sayım vs sistem">
      <div className="dash-tips-list">
        {kasalar.map((k, i) => {
          const sistem = sistemBakiyeleri[k.id] || 0;
          const sayilan = parseFloat(sayimlar[k.id] || '') || 0;
          const fark = sayimlar[k.id] !== undefined ? sayilan - sistem : null;
          return (
            <motion.div
              key={k.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 24 }}
              whileHover={{ x: 2, background: 'var(--bg-elevated)' }}
              className="dash-kasa-row"
            >
              <div>
                <div className="dash-kasa-info-label">
                  {k.icon} {k.name}
                </div>
                <div className="dash-kasa-info-sistem">Sistem: {formatMoney(sistem)}</div>
              </div>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Sayılan tutar"
                value={sayimlar[k.id] || ''}
                onChange={(e) => setSayimlar((prev) => ({ ...prev, [k.id]: e.target.value }))}
                className="dash-kasa-input"
              />
              {fark !== null && (
                <div className="dash-kasa-fark">
                  <div
                    className="dash-kasa-fark-value"
                    style={{
                      color:
                        Math.abs(fark) < 1
                          ? 'var(--color-success)'
                          : fark > 0
                            ? 'var(--color-info)'
                            : 'var(--color-danger)',
                    }}
                  >
                    {fark >= 0 ? '+' : ''}
                    {formatMoney(fark)}
                  </div>
                  <div className="dash-kasa-fark-label">
                    {Math.abs(fark) < 1 ? '✓ Eşit' : fark > 0 ? 'Fazla' : 'Eksik'}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        <motion.button
          onClick={handleKaydet}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`dash-kasa-kaydet-btn ${kaydedildi ? 'saved' : 'unsaved'}`}
        >
          {kaydedildi ? '✓ Sayım Kaydedildi' : '💾 Sayımı Kaydet'}
        </motion.button>
      </div>
    </WidgetCard>
  );
}

// ── Yedek Hatırlatma Widget ───────────────────────────────────────────────────
function YedekHatirlatmaWidget() {
  const lastBackup = localStorage.getItem('sobaYonetim_lastBackup');
  const daysSince = lastBackup ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000) : null;

  const handleBackup = () => {
    // exportJSON'u tetiklemek için custom event
    window.dispatchEvent(new CustomEvent('soba:exportJSON'));
    localStorage.setItem('sobaYonetim_lastBackup', new Date().toISOString());
  };

  const isUrgent = daysSince === null || daysSince >= 7;
  const isWarn = daysSince !== null && daysSince >= 3 && daysSince < 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={`dash-yedek-card ${isUrgent ? 'urgent' : isWarn ? 'warn' : 'ok'}`}
    >
      <motion.div
        animate={isUrgent ? { scale: [1, 1.15, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className="dash-yedek-icon"
      >
        {isUrgent ? '⚠️' : isWarn ? '💾' : '✅'}
      </motion.div>
      <div className="dash-yedek-info">
        <div className="dash-yedek-title">
          {daysSince === null
            ? 'Hiç yedek alınmadı!'
            : daysSince === 0
              ? 'Bugün yedek alındı'
              : `Son yedek: ${daysSince} gün önce`}
        </div>
        <div className="dash-yedek-desc">
          {isUrgent
            ? 'Veri kaybı riskini önlemek için yedek alın'
            : isWarn
              ? 'Yakında yedek almanız önerilir'
              : 'Yedek durumu iyi'}
        </div>
      </div>
      <motion.button
        onClick={handleBackup}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`dash-yedek-btn ${isUrgent ? 'urgent' : 'ok'}`}
      >
        💾 Yedek Al
      </motion.button>
    </motion.div>
  );
}

function WidgetCard({
  title,
  subtitle,
  children,
  extra,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{
        scale: 1.01,
        borderColor: 'var(--border-strong)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="dash-widget-card"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'var(--glass-bg, rgba(255,255,255,0.9))',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
        boxShadow: 'var(--shadow-lg, 0 8px 40px rgba(0,0,0,0.1))',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className={`dash-widget-card-header${subtitle ? '' : ' no-sub'}`}>
        <div>
          <h3 className="dash-widget-card-title">{title}</h3>
          {subtitle && <p className="dash-widget-card-subtitle">{subtitle}</p>}
        </div>
        {extra}
      </div>
      {children}
    </motion.div>
  );
}

function Oneriler({ db, onTabChange }: { db: DB; onTabChange: (tab: string) => void }) {
  const tips = useMemo(() => {
    const list: { icon: string; text: string; action: string; tab: string; level: 'warn' | 'info' | 'ok' }[] = [];
    const outStock = getOutOfStockProducts(db);
    const lowStock = getLowStockProducts(db);
    if (outStock.length > 0)
      list.push({
        icon: '⚠️',
        text: `${outStock.length} ürün stok bitti: ${outStock
          .slice(0, 2)
          .map((p) => p.name)
          .join(', ')}${outStock.length > 2 ? '...' : ''}`,
        action: 'Ürünlere Git',
        tab: 'products',
        level: 'warn',
      });
    if (lowStock.length > 0)
      list.push({
        icon: '📦',
        text: `${lowStock.length} üründe az stok uyarısı var`,
        action: 'Stoka Git',
        tab: 'stock',
        level: 'warn',
      });

    const overdueMusteri = getOverdueMusteri(db);

    if (overdueMusteri.length > 0) {
      const toplam = overdueMusteri.reduce((s, c) => s + c.balance, 0);
      const enEski = overdueMusteri.sort((a, b) => (b.days ?? 0) - (a.days ?? 0))[0];
      list.unshift({
        icon: '🔴',
        text: `${overdueMusteri.length} müşteride ${toplam.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} gecikmiş alacak — en eskisi ${enEski.name} (${enEski.days}g)`,
        action: 'Cari Hesaplar',
        tab: 'cari',
        level: 'warn',
      });
    } else {
      const toplar = db.cari.filter((c) => !c.deleted && c.type === 'musteri' && c.balance > 0);
      if (toplar.length > 0)
        list.push({
          icon: '💳',
          text: `${toplar.length} müşteride toplam ${toplar.reduce((s, c) => s + c.balance, 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} alacak var`,
          action: 'Cari Hesaplar',
          tab: 'cari',
          level: 'info',
        });
    }

    const pendingOrders = db.orders.filter((o) => o.status === 'bekliyor');
    if (pendingOrders.length > 0)
      list.push({
        icon: '🚚',
        text: `${pendingOrders.length} bekleyen sipariş var`,
        action: 'Tedarikçilere Git',
        tab: 'suppliers',
        level: 'info',
      });
    const unmatched = db.bankTransactions.filter((t) => t.status === 'unmatched');
    if (unmatched.length > 0)
      list.push({
        icon: '🏦',
        text: `${unmatched.length} banka işlemi eşleştirilmemiş`,
        action: 'Bankaya Git',
        tab: 'bank',
        level: 'info',
      });
    const todaySales = db.sales.filter(
      (s) =>
        !s.deleted && new Date(s.createdAt).toDateString() === new Date().toDateString() && s.status === 'tamamlandi',
    );
    if (todaySales.length === 0 && db.products.length > 0)
      list.push({
        icon: '💡',
        text: 'Bugün henüz satış yapılmadı. Hızlı satış için + butonunu kullanın.',
        action: 'Satışlara Git',
        tab: 'sales',
        level: 'ok',
      });
    if (db.products.length === 0)
      list.push({
        icon: '🏁',
        text: 'Başlamak için önce ürün ekleyin.',
        action: 'Ürün Ekle',
        tab: 'products',
        level: 'ok',
      });
    return list.slice(0, 5);
  }, [db]);

  if (tips.length === 0) return null;

  const levelColor: Record<string, string> = { warn: '#f59e0b', info: '#3b82f6', ok: '#10b981' };
  const levelBg: Record<string, string> = {
    warn: 'rgba(245,158,11,0.08)',
    info: 'rgba(59,130,246,0.08)',
    ok: 'rgba(16,185,129,0.08)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="dash-tips-card"
    >
      <div className="dash-tips-header">
        <span className="dash-tips-icon">💡</span>
        <h3 className="dash-tips-title">Akıllı Öneriler</h3>
        <div className="dash-tips-divider" />
      </div>
      <div className="dash-tips-list">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 24 }}
            whileHover={{ x: 4, borderColor: `${levelColor[tip.level]}40` }}
            className="dash-tip-item"
            style={{
              background: levelBg[tip.level],
              border: `1px solid ${levelColor[tip.level]}18`,
              borderLeft: `3px solid ${levelColor[tip.level]}`,
            }}
          >
            <span className="dash-tip-icon">{tip.icon}</span>
            <span className="dash-tip-text">{tip.text}</span>
            <motion.button
              onClick={() => onTabChange(tip.tab)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="dash-tip-action"
              style={{
                background: `${levelColor[tip.level]}18`,
                border: `1px solid ${levelColor[tip.level]}30`,
                color: levelColor[tip.level],
              }}
            >
              {tip.action} →
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="dash-legend-row">
      <div className="dash-legend-dot" style={{ background: color }} />
      <span className="dash-legend-label">{label}</span>
    </div>
  );
}

function QuickStat({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <motion.div
      whileHover={{ x: 4, background: `${color}08` }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="dash-quickstat-row"
    >
      <motion.div
        whileHover={{ scale: 1.15, rotate: 5 }}
        className="dash-quickstat-icon"
        style={{ background: `${color}15` }}
      >
        {icon}
      </motion.div>
      <span className="dash-quickstat-label">{label}</span>
      <span className="dash-quickstat-value" style={{ color }}>
        {value}
      </span>
    </motion.div>
  );
}

function FormulaItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="dash-formula-item"
      style={{ background: `${color}10`, border: `1px solid ${color}25` }}
    >
      <div className="dash-formula-label">{label}</div>
      <div className="dash-formula-value" style={{ color }}>
        {formatMoney(value)}
      </div>
    </motion.div>
  );
}
