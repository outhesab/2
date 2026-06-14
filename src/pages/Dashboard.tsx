import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMoney } from '@/lib/utils-tr';
import { saveBackupToFirebase, listBackupsFromFirebase, restoreBackupFromFirebase } from '@/hooks/useDB';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { logger } from '@/lib/logger';
import { getAppVersion } from '@/lib/version';
import { BRAND_NAME } from '@/config/brand';
import type { WidgetId } from '@/config/widgets';
import {
  getMonthSales,
  computeKasaToplam,
  computeKasaByType,
  computeAlacak,
  computeBorc,
  computeStokDeger,
  getOutOfStockProducts,
  getLowStockProducts,
} from '@/lib/dbUtils';

import { DashboardProps } from './Dashboard/types';
import { loadDashboardPrefs, loadDashboardPrefsFromFirebase } from './Dashboard/DashboardUtils';
import { ScrollableCards } from './Dashboard/ScrollableCards';
import { FormulaItem } from './Dashboard/DashboardCommon';
import styles from './Dashboard/Dashboard.module.css';
import { useStatCards } from './Dashboard/useStatCards';
import { WidgetRenderer } from './Dashboard/WidgetRenderer';

export default function Dashboard({ db, onTabChange, save }: DashboardProps) {
  const [prefs, setPrefs] = useState(loadDashboardPrefs);

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

    const preRestoreLabel = `onceki_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`;
    await saveBackupToFirebase(db, preRestoreLabel).catch(() =>
      logger.error('db', 'Geri yükleme öncesi yedek alınamadı'),
    );

    const restored = await restoreBackupFromFirebase(backupId);
    if (restored) {
      save((prev) => {
        const merged = { ...prev, ...restored };
        const arrayKeys = [
          'products', 'sales', 'suppliers', 'orders', 'cari', 'kasa',
          'bankTransactions', 'matchRules', 'monitorRules', 'monitorLog',
          'stockMovements', 'peletSuppliers', 'peletOrders', 'boruSuppliers',
          'boruOrders', 'invoices', 'budgets', 'returns', '_activityLog',
          'ortakEmanetler', 'installments', 'partners', 'notes',
        ] as const;
        for (const key of arrayKeys) {
          if (!Array.isArray(merged[key])) (merged as Record<string, unknown>)[key] = prev[key] ?? [];
        }
        return merged;
      });
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
      todayRevenue, todayProfit, todaySalesCount: todaySales.length,
      monthRevenue, monthProfit, outOfStock, lowStock,
      totalKasa, nakit, banka, pendingOrders, totalReceivable, totalPayable, netSermaye, stokDeger, revTrend,
    };
  }, [db]);

  const statCards = useStatCards(stats, db.products.filter((p) => !p.deleted).length);

  const renderWidget = (id: WidgetId) => (
    <WidgetRenderer id={id} stats={stats} db={db} onTabChange={onTabChange} />
  );

  const [contentWidth, setContentWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);
  useEffect(() => {
    const onResize = () => setContentWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const showSidePanel = contentWidth >= 1100;

  return (
    <div className={styles['dash-container']}>
      <ScrollableCards cards={statCards} onTabChange={onTabChange} />

      <div className={styles['dash-header-row']}>
        <div className={styles['dash-badge-box']}>
          <span className={styles['dash-badge-label']}>VERSİYON</span>
          <span className={styles['dash-badge-value']}>
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
              <div className={styles['dash-storage-box']} style={{ border: `1px solid ${color}30` }}>
                <span className={styles['dash-storage-label']}>DEPOLAMA</span>
                <span className={styles['dash-storage-value']} style={{ color }}>
                  {sizeMB.toFixed(2)} MB
                </span>
                <div className={styles['dash-storage-bar']}>
                  <div className={styles['dash-storage-fill']} style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className={styles['dash-storage-pct']}>%{pct.toFixed(0)}</span>
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
          className={styles['dash-backup-btn']}
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

      <div className={styles['dash-gunsonu-box']}>
        <div className={styles['dash-gunsonu-header']}>
          <span className={styles['dash-gunsonu-icon']}>⚖️</span>
          <span className={styles['dash-gunsonu-title']}>Gün Sonu Dengesi</span>
          <span className={styles['dash-gunsonu-hint']}>Kasa + Banka + Alacak − Borç = Net Sermaye</span>
        </div>
        <div className={styles['dash-gunsonu-row']}>
          <FormulaItem label="Nakit Kasa" value={stats.nakit} color="#06b6d4" />
          <span className={styles['dash-gunsonu-op']}>+</span>
          <FormulaItem label="Banka" value={stats.banka} color="#6366f1" />
          <span className={styles['dash-gunsonu-op']}>+</span>
          <FormulaItem label="Müşteri Alacağı" value={stats.totalReceivable} color="#10b981" />
          <span className={styles['dash-gunsonu-op']} style={{ color: 'var(--color-danger)' }}>
            −
          </span>
          <FormulaItem label="Tedarikçi Borcu" value={stats.totalPayable} color="#ef4444" />
          <span className={styles['dash-gunsonu-op']}>=</span>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={styles['dash-gunsonu-result']}
            style={{
              background: stats.netSermaye >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${stats.netSermaye >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            }}
          >
            <div className={styles['dash-gunsonu-result-label']}>Net Sermaye</div>
            <div
              className={styles['dash-gunsonu-result-value']}
              style={{ color: stats.netSermaye >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
            >
              {formatMoney(stats.netSermaye)}
            </div>
          </motion.div>
        </div>
      </div>

      <div className={`${styles['dash-grid']} ${showSidePanel ? styles['side-panel'] : styles['no-side']}`}>
        <div className={styles['dash-left-col']}>
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
          className={styles['dash-side-col']}
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.div
            variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
            className={styles['dash-side-card']}
          >
            <div className={styles['dash-side-card-header']}>
              <span className={styles['dash-side-card-icon']}>🧩</span>
              <span className={styles['dash-side-card-title']}>Özet düzeni</span>
            </div>
            <div className={`${styles['dash-widget-item']} ${styles['inactive']}`}>
              <span className={styles['dash-widget-item-icon']}>⚙️</span>
              <span className={`${styles['dash-widget-item-label']} ${styles['inactive']}`}>
                Widget yönetimi ve parlaklık kontrolleri Ayarlar &gt; Düzenleme Modu alanına taşındı.
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
            className={styles['dash-side-card']}
          >
            <div className={styles['dash-side-card-header']}>
              <span className={styles['dash-side-card-icon']}>⚡</span>
              <span className={styles['dash-side-card-title']}>Hızlı İşlemler</span>
            </div>
            <div className={styles['dash-quick-grid']}>
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
                  className={styles['dash-quick-btn']}
                  style={{ background: `${q.color}08`, border: `1px solid ${q.color}18`, color: q.color }}
                >
                  <span className={styles['dash-quick-btn-icon']}>{q.icon}</span>
                  {q.label}
                  <motion.span className={styles['dash-quick-btn-arrow']} whileHover={{ x: 3, opacity: 1 }}>
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
