import { motion } from 'framer-motion';

export function YedekHatirlatmaWidget() {
  const lastBackup = localStorage.getItem('sobaYonetim_lastBackup');
  const daysSince = lastBackup ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000) : null;

  const handleBackup = () => {
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
