/**
 * Anomali & Öneri Ekranı
 * Canlı DB verisi üzerinde anomali tespiti, AI analizi ve hızlı düzeltme.
 */
import {
  runAnomalyDetectionAsync,
  type AnomalyCategory,
  type AnomalyProgress,
  type AnomalyReport,
  type AnomalyResult,
  type AnomalySeverity,
} from '@/lib/anomalyEngine';
import type { DB } from '@/types';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  db: DB;
  save?: (updater: (prev: DB) => DB) => void;
}

// ── Renk & stil sabitleri ────────────────────────────────────────────────────

const SEV_STYLE: Record<AnomalySeverity, { bg: string; border: string; text: string; badge: string; icon: string }> = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-500',
    badge: 'bg-red-500/20',
    icon: '🔴',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    badge: 'bg-amber-500/20',
    icon: '🟡',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-500',
    badge: 'bg-blue-500/20',
    icon: '🔵',
  },
};

const CAT_LABEL: Record<AnomalyCategory, string> = {
  fiyat: '💰 Fiyat',
  tutar: '📊 Tutar',
  stok: '📦 Stok',
  kasa: '🏦 Kasa',
  cari: '👤 Cari',
  siparis: '📋 Sipariş',
  veri: '🗄️ Veri',
  supheli: '🔍 Şüpheli',
};

// ── AnomalyCard ──────────────────────────────────────────────────────────────

function AnomalyCard({
  anomaly,
  onFix,
  onAskAI,
  isFixing,
  isResolved,
}: {
  anomaly: AnomalyResult;
  onFix: (fix: AnomalyResult['quickFixes'][0]) => void;
  onAskAI: (a: AnomalyResult) => void;
  isFixing: boolean;
  isResolved: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const s = isResolved
    ? {
        bg: 'bg-emerald-500/[0.06]',
        border: 'border-emerald-500/20',
        text: 'text-emerald-500',
        badge: 'bg-emerald-500/[0.12]',
        icon: '✅',
      }
    : SEV_STYLE[anomaly.severity];

  return (
    <div
      className={`${s.bg} border ${s.border} overflow-hidden rounded-[14px] transition-all hover:scale-[1.01] hover:shadow-lg ${isResolved ? 'opacity-60' : 'opacity-100'}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2.5 px-[18px] py-[14px] bg-transparent border-none cursor-pointer text-left"
      >
        <span className="text-base shrink-0">{s.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-100 text-sm mb-0.5">
            {anomaly.title}
            {isResolved && <span className="ml-2 text-[0.72rem] text-emerald-500">✓ Çözüldü</span>}
          </div>
          <div className="text-slate-400 text-xs overflow-hidden text-ellipsis whitespace-nowrap">{anomaly.detail}</div>
        </div>
        <div className="flex gap-1.5 shrink-0 items-center">
          <span className={`text-[0.7rem] ${s.badge} ${s.text} px-2 py-0.5 rounded-md font-bold`}>
            {CAT_LABEL[anomaly.category]}
          </span>
          <span className="text-slate-600 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className={`px-[18px] pb-4 border-t ${s.border}`}>
          <div className="pt-3 flex flex-col gap-2.5">
            {/* Öneri */}
            <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg px-3 py-2.5 text-[0.82rem] text-emerald-300">
              <strong>💡 Öneri:</strong> {anomaly.suggestion}
            </div>

            {/* Hızlı düzeltmeler */}
            {anomaly.quickFixes.length > 0 && !isResolved && (
              <div className="flex gap-2 flex-wrap">
                {anomaly.quickFixes
                  .filter((f) => f.canAutoFix)
                  .map((fix, i) => (
                    <button
                      key={i}
                      onClick={() => onFix(fix)}
                      disabled={isFixing}
                      className={`${isFixing ? 'bg-white/5 cursor-not-allowed opacity-50' : 'bg-[linear-gradient(135deg,#ff5722,#ff7043)] cursor-pointer opacity-100'} border-none rounded-lg text-white px-3.5 py-2 font-bold text-xs`}
                    >
                      {isFixing ? '⏳ Uygulanıyor...' : fix.label}
                    </button>
                  ))}
                {anomaly.quickFixes
                  .filter((f) => !f.canAutoFix)
                  .map((fix, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2 text-[0.78rem] text-slate-500"
                    >
                      ⚠️ {fix.label} — Manuel müdahale gerekli
                    </div>
                  ))}
              </div>
            )}

            {/* AI'ya sor */}
            <button
              onClick={() => onAskAI(anomaly)}
              className="bg-indigo-500/10 border border-indigo-500/25 rounded-lg text-indigo-400 px-3.5 py-2 font-semibold cursor-pointer text-xs self-start"
            >
              🤖 AI'ya Sor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ana sayfa ────────────────────────────────────────────────────────────────

export default function AnomaliOneri({ db, save }: Props) {
  const [filterSev, setFilterSev] = useState<AnomalySeverity | 'all'>('all');
  const [filterCat, setFilterCat] = useState<AnomalyCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [aiMessage, setAiMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<AnomalyProgress | null>(null);
  const [report, setReport] = useState<AnomalyReport>(() => ({
    anomalies: [],
    healthScore: 100,
    summary: { total: 0, critical: 0, warning: 0, info: 0, byCategory: {} as Record<AnomalyCategory, number> },
    generatedAt: new Date().toISOString(),
  }));

  // Async anomali taraması — UI bloklamaz, progress gösterir
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProgress(null);

    runAnomalyDetectionAsync(db, (p) => {
      if (!cancelled) setProgress({ ...p });
    })
      .then((result) => {
        if (!cancelled) {
          setReport(result);
          setLoading(false);
          setProgress(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error('anomali', 'Async tarama hatası', err);
          setLoading(false);
          setProgress(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [db, refreshKey]);

  const filtered = useMemo(() => {
    return report.anomalies.filter((a) => {
      if (filterSev !== 'all' && a.severity !== filterSev) return false;
      if (filterCat !== 'all' && a.category !== filterCat) return false;
      if (
        search &&
        !a.title.toLowerCase().includes(search.toLowerCase()) &&
        !a.detail.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [report.anomalies, filterSev, filterCat, search]);

  const handleFix = useCallback(
    (anomaly: AnomalyResult, fix: AnomalyResult['quickFixes'][0]) => {
      if (!save || !fix.canAutoFix) return;
      setFixingId(anomaly.id);
      try {
        save(fix.apply);
        setResolvedIds((prev) => new Set([...prev, anomaly.id]));
      } catch {
        logger.warn('anomali', 'Anomali düzeltme hatası');
        /* hata toast'u üst bileşen yönetir */
      } finally {
        setFixingId(null);
      }
    },
    [save],
  );

  const handleAskAI = useCallback((anomaly: AnomalyResult) => {
    setAiMessage(
      `Bu anomaliyi analiz et ve çözüm öner:\n\n${anomaly.title}\n${anomaly.detail}\n\nÖneri: ${anomaly.suggestion}`,
    );
  }, []);

  const scoreColor =
    report.healthScore >= 80
      ? 'var(--color-success, #00af67)'
      : report.healthScore >= 60
        ? 'var(--color-warning, #d19200)'
        : 'var(--color-danger, #e62e1e)';

  // Trend verisi (localStorage)
  const trendData = useMemo(() => {
    const logs: { date: string; count: number }[] = [];
    try {
      const raw = localStorage.getItem('anomalyTrend');
      if (raw) logs.push(...JSON.parse(raw));
    } catch {
      logger.warn('anomali', "Anomali trend verisi localStorage'dan okunamadı"); /* ignore */
    }
    // Bugünkü sayıyı ekle
    const todayKey = new Date().toISOString().slice(0, 10);
    const existingIdx = logs.findIndex((l) => l.date === todayKey);
    if (existingIdx >= 0) logs[existingIdx] = { date: todayKey, count: report.anomalies.length };
    else logs.push({ date: todayKey, count: report.anomalies.length });
    // Son 30 günü tut
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const filtered = logs.filter((l) => l.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
    try {
      localStorage.setItem('anomalyTrend', JSON.stringify(filtered));
    } catch {
      logger.warn('anomali', "Anomali trend verisi localStorage'a yazılamadı"); /* ignore */
    }
    return filtered;
  }, [report.anomalies.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-[linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.06))] border border-indigo-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] rounded-xl flex items-center justify-center text-2xl shrink-0">
            🔍
          </div>
          <div className="flex-1">
            <h2 className="font-black text-slate-100 text-lg m-0">Anomali & Öneri</h2>
            <p className="text-slate-600 text-xs m-0 mt-0.5">
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-1">⟳</span>
                  Anomali taraması yapılıyor
                  {progress && (
                    <span className="text-indigo-400 ml-1">
                      ({progress.current}/{progress.total} — {progress.label})
                    </span>
                  )}
                </>
              ) : (
                <>
                  Canlı veri analizi — {report.anomalies.length} anomali tespit edildi
                  {report.partial && <span className="text-amber-500 ml-2">⚠️ Kısmi sonuç (timeout)</span>}
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-indigo-400 px-4 py-2 font-bold cursor-pointer text-xs hover:bg-indigo-500/20 transition-all active:scale-95"
          >
            🔄 Yenile
          </button>
        </div>

        {/* Özet kartlar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Sağlık Skoru Göstergesi (Gauge) */}
          <div className="relative bg-white/[0.03] rounded-xl p-2.5 text-center overflow-hidden">
            {/* Glow efekti */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] size-20 rounded-full opacity-[0.12] blur-[20px] pointer-events-none"
              style={{
                background:
                  report.healthScore >= 80
                    ? 'var(--color-success, #00af67)'
                    : report.healthScore >= 60
                      ? 'var(--color-warning, #d19200)'
                      : 'var(--color-danger, #e62e1e)',
              }}
            />
            <svg viewBox="0 0 140 80" className="w-full h-[70px] block">
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-danger, #e62e1e)" />
                  <stop offset="50%" stopColor="var(--color-warning, #d19200)" />
                  <stop offset="100%" stopColor="var(--color-success, #00af67)" />
                </linearGradient>
              </defs>
              {/* Arkaplan arc */}
              <path
                d="M 20 70 A 50 50 0 0 1 120 70"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Dolu arc */}
              <path
                d="M 20 70 A 50 50 0 0 1 120 70"
                fill="none"
                stroke={scoreColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(report.healthScore / 100) * 157} 157`}
              />
              {/* Gradient dış halka */}
              <path
                d="M 12 70 A 58 58 0 0 1 128 70"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity={0.35}
              />
            </svg>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
              <div
                className="text-2xl font-black leading-none"
                style={{ color: scoreColor, textShadow: `0 0 16px ${scoreColor}40` }}
              >
                {report.healthScore}
              </div>
              <div className="text-[0.6rem] text-slate-500 uppercase tracking-widest font-semibold mt-1">
                Sağlık Skoru
              </div>
            </div>
          </div>
          {[
            { label: 'Kritik', value: report.summary.critical, color: 'text-red-500' },
            { label: 'Uyarı', value: report.summary.warning, color: 'text-amber-500' },
            { label: 'Bilgi', value: report.summary.info, color: 'text-blue-500' },
            { label: 'Toplam', value: report.summary.total, color: 'text-slate-400' },
          ].map((s, i) => (
            <div key={i} className="bg-black/25 rounded-xl p-2.5 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[0.65rem] text-slate-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trend Grafiği */}
        {trendData.length > 1 && (
          <div className="mt-3">
            <div className="text-slate-600 text-[0.6rem] mb-1 uppercase tracking-wider">Anomali Trendi (30 gün)</div>
            <ResponsiveContainer width="100%" height={64}>
              <AreaChart data={trendData} margin={{ top: 2, right: 4, bottom: 2, left: -20 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={scoreColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={scoreColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
                <YAxis tick={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0f1e35',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: '0.72rem',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={scoreColor}
                  strokeWidth={2}
                  fill="url(#trendGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* AI mesajı */}
      {aiMessage && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-[18px] py-[14px] flex gap-3 items-start">
          <span className="text-xl shrink-0">🤖</span>
          <div className="flex-1">
            <div className="text-indigo-400 font-bold text-xs mb-1.5">AI Asistan'a Gönderilecek Mesaj</div>
            <pre className="text-slate-400 text-xs whitespace-pre-wrap m-0 font-inherit">{aiMessage}</pre>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiMessage).catch(() => logger.warn('anomali', 'Panoya yazılamadı'));
                }}
                className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400 px-3 py-1.5 font-semibold cursor-pointer text-xs hover:bg-indigo-500/30 transition-all"
              >
                📋 Kopyala
              </button>
              <button
                onClick={() => setAiMessage('')}
                className="bg-transparent border border-white/10 rounded-lg text-slate-600 px-3 py-1.5 font-semibold cursor-pointer text-xs hover:bg-white/5 transition-all"
              >
                ✕ Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="text"
          placeholder="Anomali ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-100 text-sm outline-none focus:ring-2 ring-indigo-500/20 transition-all"
        />
        {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSev(sev)}
            className={`px-3.5 py-2 rounded-lg border-none font-semibold cursor-pointer text-xs transition-all ${
              filterSev === sev
                ? 'bg-indigo-500/20 text-indigo-400 shadow-sm'
                : 'bg-white/[0.04] text-slate-500 hover:bg-white/10'
            }`}
          >
            {sev === 'all' ? 'Tümü' : sev === 'critical' ? '🔴 Kritik' : sev === 'warning' ? '🟡 Uyarı' : '🔵 Bilgi'}
          </button>
        ))}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as AnomalyCategory | 'all')}
          className="p-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-400 text-xs cursor-pointer outline-none focus:ring-2 ring-indigo-500/20 transition-all"
        >
          <option value="all">Tüm Kategoriler</option>
          {Object.entries(CAT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Anomali listesi */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-800">
          <div className="text-5xl mb-3 opacity-30">{report.anomalies.length === 0 ? '✅' : '🔍'}</div>
          <p className="font-semibold text-base m-0">
            {report.anomalies.length === 0
              ? 'Anomali tespit edilmedi — veriler temiz görünüyor!'
              : 'Seçili filtrelere uyan anomali yok.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((anomaly) => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              onFix={(fix) => handleFix(anomaly, fix)}
              onAskAI={handleAskAI}
              isFixing={fixingId === anomaly.id}
              isResolved={resolvedIds.has(anomaly.id)}
            />
          ))}
        </div>
      )}

      {/* Kategori özeti */}
      {report.summary.total > 0 && (
        <div className="bg-black/20 border border-white/5 rounded-xl p-3.5">
          <div className="font-bold text-slate-400 text-xs mb-2 uppercase tracking-wider">Kategori Dağılımı</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(report.summary.byCategory).map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat as AnomalyCategory)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  filterCat === cat
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                    : 'bg-white/[0.04] border-white/[0.07] text-slate-500 hover:bg-white/10'
                }`}
              >
                {CAT_LABEL[cat as AnomalyCategory]} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Oluşturulma zamanı */}
      <div className="text-right text-slate-800 text-[0.65rem]">
        Son analiz: {new Date(report.generatedAt).toLocaleTimeString('tr-TR')}
      </div>
    </div>
  );
}
