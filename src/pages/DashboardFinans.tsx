import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { formatMoney, formatDate } from "@/lib/utils-tr";
import type { DB } from "@/types";
import { Empty, EmptyHeader, EmptyTitle, EmptyMedia } from "@/components/ui/empty";

interface Props { db: DB; onTabChange: (tab: string) => void; save: (updater: (prev: DB) => DB) => void; }

const CARD_BG = "#0f1e35";
const GOLD = "#d4a04a";
const CHART_AXIS = { fontSize: 11, fill: "#64748b", fontFamily: "'Plus Jakarta Sans',sans-serif" };
const CHART_TOOLTIP = {
  contentStyle: { background: "#0f1e35", border: `1px solid ${GOLD}30`, borderRadius: 10, fontSize: "0.82rem" },
  labelStyle: { color: "#94a3b8" }, itemStyle: { color: "#f1f5f9" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
};

function GoldCard({ title, subtitle, children, accent = GOLD, extra }: {
  title: string; subtitle?: string; children: React.ReactNode; accent?: string; extra?: React.ReactNode;
}) {
  return (
    <motion.div variants={cardVariants} whileHover={{ borderColor: `${accent}40`, boxShadow: `0 8px 32px ${accent}08` }}
      className="df-card" style={{
        background: CARD_BG, border: `1px solid ${accent}18`, borderRadius: 14, padding: "20px 22px",
        borderTop: `3px solid ${accent}`, position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${accent}04, transparent 60%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", border: `1px solid ${accent}10`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: subtitle ? 4 : 14 }}>
        <h3 style={{ color: "#f1f5f9", fontSize: "1rem", fontWeight: 600, letterSpacing: "0.02em" }}>{title}</h3>
        {extra}
      </div>
      {subtitle && <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: 14 }}>{subtitle}</p>}
      {children}
    </motion.div>
  );
}

function StatNumber({ label, value, color = GOLD, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 6px" }}>
      <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: "1.3rem", fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{value}</div>
      {sub && <div style={{ color: "#475569", fontSize: "0.72rem", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardFinans({ db, onTabChange }: Props) {
  const [filter] = useState<"14d" | "30d">("14d");
  const days = filter === "14d" ? 14 : 30;

  const finansData = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;

    // Nakit akışı günlük
    const daily: Record<string, { gelir: number; gider: number; nakit: number; kart: number; havale: number; cariPay: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      const key = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
      daily[key] = { gelir: 0, gider: 0, nakit: 0, kart: 0, havale: 0, cariPay: 0 };
    }
    const cutoff = new Date(now - days * dayMs).toISOString();
    db.kasa.forEach((k) => {
      if (k.deleted || k.createdAt < cutoff) return;
      const key = new Date(k.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
      if (!daily[key]) return;
      if (k.type === "gelir") daily[key].gelir += k.amount;
      else daily[key].gider += k.amount;
    });
    db.sales.forEach((s) => {
      if (s.deleted || s.status !== "tamamlandi" || s.createdAt < cutoff) return;
      const key = new Date(s.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
      if (!daily[key]) return;
      if (s.payment === "nakit") daily[key].nakit += s.total;
      else if (s.payment === "kart") daily[key].kart += s.total;
      else if (s.payment === "havale") daily[key].havale += s.total;
      else daily[key].cariPay += s.total;
    });
    const chartData = Object.entries(daily).map(([date, v]) => ({ date, ...v }));

    // Kasa bakiyeleri
    const activeKasa = db.kasa.filter((k) => !k.deleted);
    const nakit = activeKasa.filter((k) => k.kasa === "nakit").reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0);
    const banka = activeKasa.filter((k) => k.kasa === "banka").reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0);
    const posZiraat = activeKasa.filter((k) => k.kasa === "pos_ziraat").reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0);
    const posIs = activeKasa.filter((k) => k.kasa === "pos_is").reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0);
    const posYk = activeKasa.filter((k) => k.kasa === "pos_yk").reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0);
    const posToplam = posZiraat + posIs + posYk;
    const musteriAlacak = db.cari.filter((c) => !c.deleted && c.type === "musteri" && c.balance > 0).reduce((s, c) => s + c.balance, 0);
    const tedarikciBorç = db.cari.filter((c) => !c.deleted && c.type === "tedarikci" && c.balance > 0).reduce((s, c) => s + c.balance, 0);
    const netSermaye = nakit + banka + posToplam + musteriAlacak - tedarikciBorç;
    const stokDeger = db.products.filter((p) => !p.deleted).reduce((s, p) => s + p.cost * p.stock, 0);

    // Ay bazlı karşılaştırma
    const nowD = new Date();
    const ayBası = new Date(nowD.getFullYear(), nowD.getMonth(), 1);
    const oncekiAyBası = new Date(nowD.getFullYear(), nowD.getMonth() - 1, 1);
    const buAyCiro = db.sales.filter((s) => !s.deleted && s.status === "tamamlandi" && new Date(s.createdAt) >= ayBası).reduce((s, x) => s + x.total, 0);
    const gecenAyCiro = db.sales.filter((s) => !s.deleted && s.status === "tamamlandi" && new Date(s.createdAt) >= oncekiAyBası && new Date(s.createdAt) < ayBası).reduce((s, x) => s + x.total, 0);
    const ciroFarkPct = gecenAyCiro > 0 ? ((buAyCiro - gecenAyCiro) / gecenAyCiro) * 100 : 0;

    return { chartData, nakit, banka, posZiraat, posIs, posYk, posToplam, musteriAlacak, tedarikciBorç, netSermaye, stokDeger, buAyCiro, gecenAyCiro, ciroFarkPct };
  }, [db, days]);

  const healthScore = useMemo(() => {
    const { netSermaye, stokDeger } = finansData;
    if (netSermaye <= 0) return { score: 0, label: "Kritik", color: "#ef4444" };
    const ratio = netSermaye / Math.max(stokDeger, 1);
    if (ratio > 1.5) return { score: 90, label: "Mükemmel", color: "#10b981" };
    if (ratio > 0.8) return { score: 65, label: "İyi", color: "#f59e0b" };
    return { score: 35, label: "Dikkat", color: "#ef4444" };
  }, [finansData]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible"
      style={{ padding: "16px 20px", maxWidth: 1400, margin: "0 auto" }}
    >
      {/* Üst Başlık */}
      <motion.div variants={cardVariants} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "0.02em" }}>
            <span style={{ color: GOLD }}>✦</span> Finans Komuta Merkezi
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.82rem" }}>v{db._version || 0} · {formatDate(new Date().toISOString())}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["14d", "30d"].map((f) => (
            <motion.button key={f} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: "6px 16px", borderRadius: 8, border: `1px solid ${filter === f ? GOLD : `${GOLD}30`}`,
                background: filter === f ? `${GOLD}20` : "transparent", color: filter === f ? GOLD : "#94a3b8",
                cursor: "pointer", fontSize: "0.8rem", fontWeight: 500,
              }}
              onClick={() => {}}
            >
              {f === "14d" ? "14 Gün" : "30 Gün"}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Finansal Sağlık Skoru */}
      <motion.div variants={cardVariants} style={{
        background: `linear-gradient(135deg, ${CARD_BG}, #0d1528)`, borderRadius: 14, border: `1px solid ${GOLD}18`,
        borderTop: `3px solid ${healthScore.color}`, padding: "20px 22px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
      }}>
        <div style={{ position: "relative", width: 80, height: 80 }}>
          <svg viewBox="0 0 36 36" style={{ width: 80, height: 80 }}>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={healthScore.color} strokeWidth="3"
              strokeDasharray={`${healthScore.score}, 100`} strokeLinecap="round"
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, color: healthScore.color }}>
            {healthScore.score}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#f1f5f9", fontSize: "0.95rem", fontWeight: 600 }}>Finansal Sağlık: {healthScore.label}</div>
          <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 2 }}>
            Net Sermaye / Stok Değeri oranı · {formatMoney(finansData.netSermaye)} / {formatMoney(finansData.stokDeger)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <StatNumber label="Bu Ay Ciro" value={formatMoney(finansData.buAyCiro)} color={finansData.ciroFarkPct >= 0 ? "#10b981" : "#ef4444"} sub={`%${finansData.ciroFarkPct.toFixed(1)} geçen aya göre`} />
          <StatNumber label="Net Sermaye" value={formatMoney(finansData.netSermaye)} color={finansData.netSermaye >= 0 ? GOLD : "#ef4444"} />
          <StatNumber label="Stok Değeri" value={formatMoney(finansData.stokDeger)} color="#3b82f6" />
        </div>
      </motion.div>

      {/* Nakit Akışı Grafiği */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <GoldCard title="Nakit Akışı" subtitle="Günlük gelir/gider (son 14 gün)">
          {finansData.chartData.length === 0 ? (
            <Empty><EmptyHeader><EmptyMedia>💰</EmptyMedia><EmptyTitle>Veri yok</EmptyTitle></EmptyHeader></Empty>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={finansData.chartData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                <defs>
                  <linearGradient id="gelirGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="giderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <Tooltip formatter={(v: number, n: string) => [formatMoney(v), n === "gelir" ? "Gelir" : "Gider"]} contentStyle={CHART_TOOLTIP.contentStyle} labelStyle={CHART_TOOLTIP.labelStyle} itemStyle={CHART_TOOLTIP.itemStyle} />
                <Area type="monotone" dataKey="gelir" stroke="#10b981" strokeWidth={2} fill="url(#gelirGrad)" dot={{ r: 2, fill: "#10b981" }} />
                <Area type="monotone" dataKey="gider" stroke="#ef4444" strokeWidth={2} fill="url(#giderGrad)" dot={{ r: 2, fill: "#ef4444" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </GoldCard>

        <GoldCard title="Ödeme Yöntem Dağılımı" subtitle="Son 14 gün">
          {finansData.chartData.length === 0 ? (
            <Empty><EmptyHeader><EmptyMedia>💳</EmptyMedia><EmptyTitle>Veri yok</EmptyTitle></EmptyHeader></Empty>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={finansData.chartData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                <XAxis dataKey="date" tick={CHART_AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <Tooltip formatter={(v: number) => [formatMoney(v), ""]} contentStyle={CHART_TOOLTIP.contentStyle} labelStyle={CHART_TOOLTIP.labelStyle} itemStyle={CHART_TOOLTIP.itemStyle} />
                <Bar dataKey="nakit" stackId="pay" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="kart" stackId="pay" fill="#3b82f6" />
                <Bar dataKey="havale" stackId="pay" fill="#f59e0b" />
                <Bar dataKey="cariPay" stackId="pay" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GoldCard>
      </div>

      {/* Alacak Yaşlandırma */}
      {(() => {
        const now = Date.now();
        const dayMs = 86400000;
        const musteri = db.cari.filter(c => !c.deleted && c.type === 'musteri' && c.balance > 0);
        const aging = { '0-30': [] as typeof musteri, '31-60': [] as typeof musteri, '61-90': [] as typeof musteri, '90+': [] as typeof musteri };
        musteri.forEach(c => {
          if (!c.lastTransaction) { aging['90+'].push(c); return; }
          const days = Math.floor((now - new Date(c.lastTransaction).getTime()) / dayMs);
          if (days <= 30) aging['0-30'].push(c);
          else if (days <= 60) aging['31-60'].push(c);
          else if (days <= 90) aging['61-90'].push(c);
          else aging['90+'].push(c);
        });
        const agingColors: Record<string, string> = { '0-30': '#10b981', '31-60': '#f59e0b', '61-90': '#fb923c', '90+': '#ef4444' };
        return (
          <div style={{ marginBottom: 14 }}><GoldCard title="Alacak Yaşlandırma" subtitle="Son işlem tarihine göre müşteri alacakları" accent="#f59e0b">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {Object.entries(aging).map(([range, customers]) => {
                const total = customers.reduce((s, c) => s + c.balance, 0);
                const color = agingColors[range];
                return (
                  <div key={range} style={{ background: `${color}10`, borderRadius: 10, padding: '12px 14px', border: `1px solid ${color}25` }}>
                    <div style={{ color, fontSize: '1.2rem', fontWeight: 800 }}>{formatMoney(total)}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{range} gün ({customers.length} müşteri)</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, height: 4 }}>
                      {['0-30', '31-60', '61-90', '90+'].map(r => {
                        const pct = musteri.length > 0 ? (aging[r].length / musteri.length) * 100 : 0;
                        return <div key={r} style={{ flex: pct, height: 4, borderRadius: 2, background: agingColors[r], opacity: r === range ? 1 : 0.3 }} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {musteri.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div className="responsive-table-wrap" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Müşteri', 'Bakiye', 'Son İşlem', 'Grup'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {musteri.sort((a, b) => {
                        const aDays = a.lastTransaction ? Math.floor((now - new Date(a.lastTransaction).getTime()) / dayMs) : 999;
                        const bDays = b.lastTransaction ? Math.floor((now - new Date(b.lastTransaction).getTime()) / dayMs) : 999;
                        return bDays - aDays;
                      }).slice(0, 10).map(c => {
                        const days = c.lastTransaction ? Math.floor((now - new Date(c.lastTransaction).getTime()) / dayMs) : 999;
                        const range = days <= 30 ? '0-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+';
                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '6px 8px', color: '#f1f5f9', fontWeight: 500 }}>{c.name}</td>
                            <td style={{ padding: '6px 8px', color: '#10b981', fontWeight: 700 }}>{formatMoney(c.balance)}</td>
                            <td style={{ padding: '6px 8px', color: '#64748b' }}>{c.lastTransaction ? formatDate(c.lastTransaction) : '-'}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <span style={{ background: `${agingColors[range]}20`, color: agingColors[range], borderRadius: 4, padding: '2px 6px', fontSize: '0.68rem', fontWeight: 600 }}>{days}d</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </GoldCard></div>
        );
      })()}

      {/* Alt Kartlar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
        <GoldCard title="Nakit" accent="#06b6d4"><StatNumber label="Bakiye" value={formatMoney(finansData.nakit)} color="#06b6d4" /></GoldCard>
        <GoldCard title="Banka" accent="#6366f1"><StatNumber label="Bakiye" value={formatMoney(finansData.banka)} color="#6366f1" /></GoldCard>
        <GoldCard title="POS Ziraat" accent="#f59e0b"><StatNumber label="Bakiye" value={formatMoney(finansData.posZiraat)} color="#f59e0b" /></GoldCard>
        <GoldCard title="POS İş Bankası" accent="#3b82f6"><StatNumber label="Bakiye" value={formatMoney(finansData.posIs)} color="#3b82f6" /></GoldCard>
        <GoldCard title="POS YK" accent="#8b5cf6"><StatNumber label="Bakiye" value={formatMoney(finansData.posYk)} color="#8b5cf6" /></GoldCard>
        <GoldCard title="Müşteri Alacak" accent="#10b981"><StatNumber label="Toplam" value={formatMoney(finansData.musteriAlacak)} color="#10b981" /></GoldCard>
        <GoldCard title="Tedarikçi Borç" accent="#ef4444"><StatNumber label="Toplam" value={formatMoney(finansData.tedarikciBorç)} color="#ef4444" /></GoldCard>
      </div>

      {/* Hızlı İşlemler */}
      <GoldCard title="Hızlı İşlemler" subtitle="">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Kasa İşlemi", icon: "💰", tab: "kasa", color: "#f59e0b" },
            { label: "Banka", icon: "🏦", tab: "bank", color: "#6366f1" },
            { label: "Bütçe", icon: "📊", tab: "butce", color: "#10b981" },
            { label: "Cari Hesaplar", icon: "👤", tab: "cari", color: "#3b82f6" },
          ].map((b) => (
            <motion.button key={b.tab} onClick={() => onTabChange(b.tab)}
              whileHover={{ scale: 1.04, background: `${b.color}20` }} whileTap={{ scale: 0.96 }}
              style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${b.color}30`, background: `${b.color}10`, color: b.color, cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}
            >
              <span>{b.icon}</span> {b.label} <span style={{ opacity: 0.5 }}>→</span>
            </motion.button>
          ))}
        </div>
      </GoldCard>
    </motion.div>
  );
}
