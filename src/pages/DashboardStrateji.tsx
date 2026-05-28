import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { formatMoney, formatDate } from "@/lib/utils-tr";
import type { DB } from "@/types";
import { Empty, EmptyHeader, EmptyTitle, EmptyMedia } from "@/components/ui/empty";

interface Props { db: DB; onTabChange: (tab: string) => void; save: (updater: (prev: DB) => DB) => void; }

const IRIDESCENT = "linear-gradient(135deg, #7c3aed, var(--color-info), #ec4899)";
const CHART_TOOLTIP = {
  contentStyle: { background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, backdropFilter: "blur(12px)" as const, fontSize: "0.8rem" },
  labelStyle: { color: "var(--text-secondary)" }, itemStyle: { color: "var(--text-primary)" },
};
const CHART_AXIS = { fontSize: 10, fill: "var(--text-dim)", fontFamily: "'Plus Jakarta Sans',sans-serif" };

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } } as const;
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } } };

function GlassCard({ title, subtitle, children, accent, extra, shimmer }: {
  title: string; subtitle?: string; children: React.ReactNode; accent?: string; extra?: React.ReactNode; shimmer?: boolean;
}) {
  return (
    <motion.div variants={cardVariants} layout
      whileHover={{ boxShadow: `0 8px 40px ${accent || "#7c3aed"}15`, borderColor: `${accent || "#7c3aed"}20` }}
      style={{
        background: "var(--border)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden",
      }}
    >
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />}
      <div style={{ position: "absolute", top: -40, right: -40, width: 100, height: 100, borderRadius: "50%", background: `${accent || "#7c3aed"}06`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: subtitle ? 4 : 12 }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.01em" }}>{title}</h3>
        {extra}
      </div>
      {subtitle && <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: 12 }}>{subtitle}</p>}
      {shimmer ? (
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🔮</span> Hesaplanıyor...
          </motion.div>
        </div>
      ) : children}
    </motion.div>
  );
}

export default function DashboardStrateji({ db, onTabChange }: Props) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const insights = useMemo(() => {
    const now = new Date();
    const ayBası = new Date(now.getFullYear(), now.getMonth(), 1);
    const oncekiAyBası = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const oncekiAySonu = new Date(now.getFullYear(), now.getMonth(), 0);

    const buAy = db.sales.filter((s) => !s.deleted && s.status === "tamamlandi" && new Date(s.createdAt) >= ayBası);
    const gecenAy = db.sales.filter((s) => !s.deleted && s.status === "tamamlandi" && new Date(s.createdAt) >= oncekiAyBası && new Date(s.createdAt) <= oncekiAySonu);
    const buAyCiro = buAy.reduce((s, x) => s + x.total, 0);
    const gecenAyCiro = gecenAy.reduce((s, x) => s + x.total, 0);
    const changePct = gecenAyCiro > 0 ? ((buAyCiro - gecenAyCiro) / gecenAyCiro) * 100 : 0;

    // En iyi kategori
    const catRev: Record<string, number> = {};
    db.sales.filter((s) => !s.deleted && s.status === "tamamlandi").forEach((s) => {
      const c = s.productCategory || "Diğer";
      catRev[c] = (catRev[c] || 0) + s.total;
    });
    const topCat = Object.entries(catRev).sort((a, b) => b[1] - a[1])[0];

    // Nakit akışı tahmini
    const son30Gun = new Date(Date.now() - 30 * 86400000).toISOString();
    const gunlukGider = db.kasa.filter((k) => !k.deleted && k.type === "gider" && k.createdAt >= son30Gun).reduce((s, k) => s + k.amount, 0) / 30;
    const nakit = db.kasa.filter((k) => !k.deleted && k.kasa === "nakit").reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0);
    const cashRunway = gunlukGider > 0 ? Math.floor(nakit / gunlukGider) : 0;

    const stockAlert = db.products.filter((p) => !p.deleted && p.stock <= p.minStock).length;

    return { buAyCiro, gecenAyCiro, changePct, topCat: topCat ? { name: topCat[0], value: topCat[1] } : null, cashRunway, stockAlert, gunlukGider };
  }, [db]);

  const forecastData = useMemo(() => {
    const days: { date: string; actual: number; forecast: number | null; upper: number | null; lower: number | null }[] = [];
    const now = Date.now();
    const dayMs = 86400000;
    let sum = 0; let count = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      const key = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
      const total = db.sales.filter((s) => {
        if (s.deleted || s.status !== "tamamlandi") return false;
        const sd = new Date(s.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
        return sd === key;
      }).reduce((s, x) => s + x.total, 0);
      days.push({ date: key, actual: total, forecast: null, upper: null, lower: null });
      if (i < 7) { sum += total; count++; }
    }
    const avg7 = count > 0 ? sum / count : 0;
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now + i * dayMs);
      const key = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
      const noise = avg7 * (0.85 + Math.random() * 0.3);
      days.push({ date: key, actual: 0, forecast: noise, upper: noise * 1.15, lower: noise * 0.85 });
    }
    return days;
  }, [db.sales]);

  const anomalies = useMemo(() => {
    const completed = db.sales.filter((s) => !s.deleted && s.status === "tamamlandi");
    if (completed.length < 5) return [];
    const values = completed.map((s) => s.total);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    return completed.filter((s) => Math.abs(s.total - mean) > 2.5 * std)
      .sort((a, b) => Math.abs(b.total - mean) - Math.abs(a.total - mean)).slice(0, 5)
      .map((s) => ({
        ...s,
        severity: Math.abs(s.total - mean) > 3.5 * std ? "HIGH" as const : Math.abs(s.total - mean) > 3 * std ? "MEDIUM" as const : "LOW" as const,
      }));
  }, [db.sales]);

  // Sezonsallık analizi
  const seasonalityData = useMemo(() => {
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const monthlyTotals: Record<string, { total: number; count: number }> = {};
    db.sales.filter(s => !s.deleted && s.status === 'tamamlandi').forEach(s => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyTotals[key]) monthlyTotals[key] = { total: 0, count: 0 };
      monthlyTotals[key].total += s.total;
      monthlyTotals[key].count++;
    });
    // Ay bazında ortalama (yıllar arası)
    const monthAvgs = Array.from({ length: 12 }, (_, m) => {
      const vals = Object.entries(monthlyTotals)
        .filter(([k]) => parseInt(k.split('-')[1]) === m + 1)
        .map(([, v]) => v.total);
      const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      return { month: monthNames[m], monthIndex: m, avg };
    });
    const overallAvg = monthAvgs.reduce((s, m) => s + m.avg, 0) / 12 || 1;
    const withCoeff = monthAvgs.map(m => ({
      ...m,
      coefficient: m.avg / overallAvg,
      forecast: m.avg,
    }));
    // 3 aylık nakit akışı tahmini
    const now = new Date();
    const cashFlowForecast = Array.from({ length: 3 }, (_, i) => {
      const m = (now.getMonth() + i) % 12;
      const monthData = withCoeff[m];
      const gider = insights.gunlukGider * 30;
      const net = (monthData?.avg || 0) - gider;
      return { month: monthNames[m], gelir: monthData?.avg || 0, gider, net };
    });
    return { monthlyData: withCoeff, cashFlowForecast };
  }, [db.sales, insights.gunlukGider]);

  const whatIf = useMemo(() => {
    const totalCariBalance = db.cari.filter((c) => !c.deleted && c.type === "musteri").reduce((s, c) => s + c.balance, 0);
    const earlyPaymentBenefit = totalCariBalance * 0.05;
    const lastMonthRevenue = db.sales.filter((s) => {
      const d = new Date(); d.setMonth(d.getMonth() - 1);
      return !s.deleted && s.status === "tamamlandi" && new Date(s.createdAt) >= d;
    }).reduce((s, x) => s + x.total, 0);
    const priceBoost = lastMonthRevenue * 0.10;
    const totalStockCost = db.products.filter((p) => !p.deleted).reduce((s, p) => s + p.cost * p.stock, 0);
    const turnoverSaving = totalStockCost * 0.20;
    return { earlyPaymentBenefit, priceBoost, turnoverSaving, lastMonthRevenue };
  }, [db]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible"
      style={{ padding: "16px 20px", maxWidth: 1400, margin: "0 auto" }}
    >
      <motion.div variants={cardVariants} style={{ marginBottom: 16, textAlign: "center" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 300, letterSpacing: "0.04em", background: IRIDESCENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Strateji Paneli
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 300 }}>AI Destekli İçgörüler ve Tahminler</p>
      </motion.div>

      {/* AI Insight Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
        <GlassCard title="Aylık Ciro Trendi" accent="#7c3aed" shimmer={loading}>
          {!loading && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 300, color: "var(--text-primary)" }}>{formatMoney(insights.buAyCiro)}</div>
              <div style={{ fontSize: "0.82rem", color: insights.changePct >= 0 ? "var(--color-success)" : "var(--color-danger)", marginTop: 4 }}>
                {insights.changePct >= 0 ? "▲" : "▼"} %{Math.abs(insights.changePct).toFixed(1)} geçen aya göre
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>Geçen ay: {formatMoney(insights.gecenAyCiro)}</div>
            </div>
          )}
        </GlassCard>

        <GlassCard title="En İyi Kategori" accent="var(--color-info)" shimmer={loading}>
          {!loading && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 400, color: "var(--text-primary)", marginBottom: 4 }}>{insights.topCat?.name || "-"}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 300, color: "var(--color-info)" }}>{insights.topCat ? formatMoney(insights.topCat.value) : "Veri yok"}</div>
            </div>
          )}
        </GlassCard>

        <GlassCard title="Nakit Akış Tahmini" accent="#ec4899" shimmer={loading}>
          {!loading && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 300, color: "var(--text-primary)" }}>{insights.cashRunway} gün</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>
                Günlük gider: {formatMoney(insights.gunlukGider)}
              </div>
              <div style={{ color: insights.cashRunway < 30 ? "var(--color-danger)" : insights.cashRunway < 60 ? "var(--color-warning)" : "var(--color-success)", fontSize: "0.72rem" }}>
                {insights.cashRunway < 30 ? "⚠️ Kritik seviye" : insights.cashRunway < 60 ? "📊 Orta seviye" : "✅ Yeterli"}
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard title="Stok Uyarısı" accent="var(--color-warning)" shimmer={loading}>
          {!loading && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 300, color: insights.stockAlert > 0 ? "var(--color-danger)" : "var(--color-success)" }}>{insights.stockAlert}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>üründe stok uyarısı</div>
              {insights.stockAlert > 0 && (
                <motion.button onClick={() => onTabChange("products")} whileHover={{ scale: 1.05 }}
                  style={{ marginTop: 8, padding: "4px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "var(--color-warning)", cursor: "pointer", fontSize: "0.72rem" }}
                >
                  Görüntüle →
                </motion.button>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Forecast Chart */}
      <GlassCard title="Ciro Tahmini" subtitle="Son 30 gün gerçek + 7 gün tahmin (basit projeksiyon)" accent="linear-gradient(90deg, #7c3aed, var(--color-info))">
        {loading ? (
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ color: "var(--text-muted)" }}>🔮 Tahmin hesaplanıyor...</motion.div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={forecastData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={CHART_AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
              <Tooltip formatter={(v: number, n: string) => [formatMoney(v), n === "actual" ? "Gerçek" : n === "forecast" ? "Tahmin" : n]} contentStyle={CHART_TOOLTIP.contentStyle} labelStyle={CHART_TOOLTIP.labelStyle} itemStyle={CHART_TOOLTIP.itemStyle} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="var(--color-info)" fillOpacity={0.08} />
              <Area type="monotone" dataKey="lower" stroke="none" fill="var(--color-info)" fillOpacity={0.08} />
              <Area type="monotone" dataKey="actual" stroke="#7c3aed" strokeWidth={2} fill="url(#actualGrad)" dot={{ r: 2, fill: "#7c3aed" }} />
              <Area type="monotone" dataKey="forecast" stroke="var(--color-info)" strokeWidth={2} strokeDasharray="6 4" fill="url(#forecastGrad)" dot={{ r: 3, fill: "var(--color-info)" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>
          <span><span style={{ color: "#7c3aed" }}>━</span> Gerçek</span>
          <span><span style={{ color: "var(--color-info)", borderBottom: "2px dashed var(--color-info)" }}>━</span> Tahmin</span>
        </div>
      </GlassCard>

      {/* Sezonsallık Grafiği */}
      <GlassCard title="Sezonsallık Analizi" subtitle="Aylık ortalama ciro dağılımı ve 3 aylık nakit akışı tahmini" accent="var(--color-accent)" shimmer={loading}>
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={seasonalityData.monthlyData} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                  <Tooltip formatter={(v: number, n: string) => [formatMoney(v), n === 'avg' ? 'Ortalama' : n]} contentStyle={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: '0.72rem' }} />
                  <Bar dataKey="avg" radius={[3, 3, 0, 0]} maxBarSize={20}>
                    {seasonalityData.monthlyData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.coefficient > 1.2 ? 'var(--color-success)' : entry.coefficient > 0.8 ? '#8b5cf6' : 'var(--text-muted)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4, fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                <span><span style={{ color: 'var(--color-success)' }}>●</span> Yüksek</span>
                <span><span style={{ color: '#8b5cf6' }}>●</span> Normal</span>
                <span><span style={{ color: 'var(--text-muted)' }}>●</span> Düşük</span>
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nakit Akışı Tahmini (3 Ay)</div>
              {seasonalityData.cashFlowForecast.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{c.month}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 600 }}>₺{(c.gelir / 1000).toFixed(0)}K</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', margin: '0 4px' }}>/</span>
                    <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 600 }}>₺{(c.gider / 1000).toFixed(0)}K</span>
                    <div style={{ color: c.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '0.82rem', fontWeight: 700 }}>
                      {c.net >= 0 ? '+' : ''}₺{(c.net / 1000).toFixed(0)}K
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Anomaly Detector + What-If */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <GlassCard title="Anomali Dedektörü" subtitle={`${anomalies.length} anomali tespit edildi`} accent="var(--color-danger)" shimmer={loading}>
          {!loading && (
            anomalies.length === 0 ? (
              <Empty><EmptyHeader><EmptyMedia>✅</EmptyMedia><EmptyTitle>Anomali bulunamadı</EmptyTitle></EmptyHeader></Empty>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {anomalies.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    whileHover={{ x: 2 }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 6px", borderBottom: i < anomalies.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", fontSize: "0.78rem" }}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "var(--text-primary)" }}>{a.productName}</span>
                      <span style={{ color: "var(--text-muted)", marginLeft: 6, fontSize: "0.7rem" }}>{formatDate(a.createdAt)}</span>
                    </div>
                    <span style={{ color: "var(--text-primary)", fontFamily: "'Courier New',monospace", marginRight: 10 }}>{formatMoney(a.total)}</span>
                    <span style={{
                      padding: "2px 8px", borderRadius: 8, fontSize: "0.65rem", fontWeight: 600,
                      background: a.severity === "HIGH" ? "#ef444420" : a.severity === "MEDIUM" ? "#f59e0b20" : "#3b82f620",
                      color: a.severity === "HIGH" ? "var(--color-danger)" : a.severity === "MEDIUM" ? "var(--color-warning)" : "var(--color-info)",
                    }}>
                      {a.severity}
                    </span>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </GlassCard>

        <GlassCard title="What-IF Senaryoları" subtitle="Veriye dayalı simülasyonlar" accent="var(--color-success)" shimmer={loading}>
          {!loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "💳", label: "Müşteriler %5 erken ödeme yapsa", value: formatMoney(whatIf.earlyPaymentBenefit), detail: `${db.cari.filter(c => !c.deleted && c.type === 'musteri').length} müşteri baz alındı`, color: "var(--color-success)" },
                { icon: "📈", label: "Ortalama fiyat %10 artsa", value: `+${formatMoney(whatIf.priceBoost)}/ay`, detail: `Geçen ay ciro: ${formatMoney(whatIf.lastMonthRevenue)}`, color: "var(--color-info)" },
                { icon: "🔄", label: "Stok devir hızı %20 artarsa", value: `-${formatMoney(whatIf.turnoverSaving)}`, detail: "Maliyet avantajı", color: "var(--color-accent)" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  whileHover={{ x: 3, background: "rgba(255,255,255,0.03)" }}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{item.label}</div>
                    <div style={{ color: item.color, fontSize: "0.95rem", fontWeight: 600 }}>{item.value}</div>
                  </div>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.65rem", textAlign: "right", maxWidth: 120 }}>{item.detail}</div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </motion.div>
  );
}
