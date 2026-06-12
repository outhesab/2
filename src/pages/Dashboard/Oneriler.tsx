import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getOutOfStockProducts, getLowStockProducts, getOverdueMusteri } from '@/lib/dbUtils';
import type { DB } from '@/types';
import styles from './Oneriler.module.css';

interface OnerilerProps {
  db: DB;
  onTabChange: (tab: string) => void;
}

export function Oneriler({ db, onTabChange }: OnerilerProps) {
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
            className={`dash-tip-item ${styles[`tip${tip.level.charAt(0).toUpperCase() + tip.level.slice(1)}`]}`}
          >
            <span className="dash-tip-icon">{tip.icon}</span>
            <span className="dash-tip-text">{tip.text}</span>
            <motion.button
              onClick={() => onTabChange(tip.tab)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`dash-tip-action ${styles[`btn${tip.level.charAt(0).toUpperCase() + tip.level.slice(1)}`]}`}
            >
              {tip.action} →
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
