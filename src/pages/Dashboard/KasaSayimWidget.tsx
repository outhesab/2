import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatMoney } from '@/lib/utils-tr';
import { logger } from '@/lib/logger';
import type { DB } from '@/types';
import { WidgetCard } from './WidgetCard';

export function KasaSayimWidget({ db }: { db: DB }) {
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
