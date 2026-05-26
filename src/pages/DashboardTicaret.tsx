import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { formatMoney, formatDate } from "@/lib/utils-tr";
import type { DB } from "@/types";
import { Empty, EmptyHeader, EmptyTitle, EmptyMedia } from "@/components/ui/empty";

interface Props { db: DB; onTabChange: (tab: string) => void; save: (updater: (prev: DB) => DB) => void; }

const TEAL = "#0d7377";
const WHITE = "#ffffff";
const TEXT = "#1e293b";
const MUTED = "#64748b";
const BORDER = "#e0ddd5";
const CAT_COLORS = ["#0d7377", "#b45309", "#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#06b6d4", "#ec4899", "#6366f1"];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } } as const;
const cardVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } } };

function MagazineCard({ title, subtitle, children, extra }: {
  title: string; subtitle?: string; children: React.ReactNode; extra?: React.ReactNode;
}) {
  return (
    <motion.div variants={cardVariants} whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
      style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "20px 24px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: subtitle ? 6 : 16 }}>
        <h3 style={{ color: TEXT, fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</h3>
        {extra}
      </div>
      {subtitle && <p style={{ color: MUTED, fontSize: "0.82rem", marginBottom: 16, marginTop: -4 }}>{subtitle}</p>}
      {children}
    </motion.div>
  );
}

function KpiBadge({ label, value, color = TEAL, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ minWidth: 120, padding: "10px 14px", borderRight: `1px solid ${BORDER}` }}>
      <div style={{ color: MUTED, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
      <div style={{ color, fontSize: "1.2rem", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
      {sub && <div style={{ color: MUTED, fontSize: "0.7rem" }}>{sub}</div>}
    </div>
  );
}

const chartTooltip = {
  contentStyle: { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: "0.8rem", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
  labelStyle: { color: TEXT }, itemStyle: { color: TEXT },
};
const chartAxis = { fontSize: 11, fill: MUTED, fontFamily: "'Plus Jakarta Sans', sans-serif" };

export default function DashboardTicaret({ db, onTabChange: _onTabChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const kpi = useMemo(() => {
    const completed = db.sales.filter((s) => !s.deleted && s.status === "tamamlandi");
    const totalSales = completed.length;
    const avgOrder = totalSales > 0 ? completed.reduce((s, x) => s + x.total, 0) / totalSales : 0;
    const catRev: Record<string, number> = {};
    completed.forEach((s) => {
      const c = s.productCategory || "Diğer";
      catRev[c] = (catRev[c] || 0) + s.total;
    });
    const topCat = Object.entries(catRev).sort((a, b) => b[1] - a[1])[0];
    const prodRev: Record<string, number> = {};
    completed.forEach((s) => { prodRev[s.productName] = (prodRev[s.productName] || 0) + s.total; });
    const topProd = Object.entries(prodRev).sort((a, b) => b[1] - a[1])[0];
    const returns = db.sales.filter((s) => s.status === "iade" || s.status === "iptal").length;
    const returnRate = totalSales > 0 ? (returns / totalSales) * 100 : 0;
    return { totalSales, avgOrder, topCat: topCat ? topCat[0] : "-", topProd: topProd ? topProd[0] : "-", returnRate };
  }, [db]);

  const topProducts = useMemo(() => {
    const map: Record<string, { revenue: number; qty: number; profit: number }> = {};
    db.sales.filter((s) => !s.deleted && s.status === "tamamlandi").forEach((s) => {
      if (!map[s.productName]) map[s.productName] = { revenue: 0, qty: 0, profit: 0 };
      map[s.productName].revenue += s.total;
      map[s.productName].qty += s.quantity;
      map[s.productName].profit += s.profit;
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8).map(([name, v], i) => ({ name, ...v, color: CAT_COLORS[i % CAT_COLORS.length] }));
  }, [db.sales]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    db.sales.filter((s) => !s.deleted && s.status === "tamamlandi").forEach((s) => {
      const c = s.productCategory || "Diğer";
      map[c] = (map[c] || 0) + s.total;
    });
    const cats = db.productCategories || [];
    return Object.entries(map).map(([id, value], i) => ({
      name: cats.find((c) => c.id === id)?.name || id, value, color: CAT_COLORS[i % CAT_COLORS.length],
    }));
  }, [db.sales, db.productCategories]);

  const paymentData = useMemo(() => {
    const days: Record<string, { nakit: number; kart: number; havale: number; cariP: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
      days[key] = { nakit: 0, kart: 0, havale: 0, cariP: 0 };
    }
    const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
    db.sales.filter((s) => !s.deleted && s.status === "tamamlandi" && s.createdAt >= cutoff).forEach((s) => {
      const key = new Date(s.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
      if (!days[key]) return;
      if (s.payment === "nakit") days[key].nakit += s.total;
      else if (s.payment === "kart") days[key].kart += s.total;
      else if (s.payment === "havale") days[key].havale += s.total;
      else days[key].cariP += s.total;
    });
    return Object.entries(days).map(([date, v]) => ({ date, ...v }));
  }, [db.sales]);

  const topCustomers = useMemo(() => {
    return db.cari.filter((c) => !c.deleted && c.type === "musteri" && c.balance > 0)
      .sort((a, b) => b.balance - a.balance).slice(0, 5);
  }, [db.cari]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible"
      style={{ padding: "16px 20px", maxWidth: 1400, margin: "0 auto" }}
    >
      <motion.div variants={cardVariants} style={{ marginBottom: 16 }}>
        <div style={{ color: TEXT, fontSize: "1.3rem", fontWeight: 700, letterSpacing: "0.01em", marginBottom: 2 }}>Ticaret Zirvesi</div>
        <div style={{ color: MUTED, fontSize: "0.8rem" }}>Satış ve müşteri analitiği · {formatDate(new Date().toISOString())}</div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div variants={cardVariants} ref={scrollRef}
        style={{ display: "flex", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, marginBottom: 16, overflow: "auto" }}
      >
        <KpiBadge label="Toplam Satış" value={String(kpi.totalSales)} color={TEAL} />
        <KpiBadge label="Ort. Sipariş" value={formatMoney(kpi.avgOrder)} color="#3b82f6" />
        <KpiBadge label="En İyi Kategori" value={kpi.topCat.slice(0, 12)} color="#b45309" sub={kpi.topCat} />
        <KpiBadge label="En Çok Satan" value={kpi.topProd.slice(0, 12)} color="#f59e0b" sub={kpi.topProd} />
        <KpiBadge label="İade Oranı" value={`%${kpi.returnRate.toFixed(1)}`} color={kpi.returnRate > 10 ? "#ef4444" : TEAL} />
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Bar Chart - Top Products */}
        <MagazineCard title="En Çok Satan Ürünler" subtitle="İlk 8 ürün cirosu">
          {topProducts.length === 0 ? (
            <Empty><EmptyHeader><EmptyMedia>📦</EmptyMedia><EmptyTitle>Satış verisi yok</EmptyTitle></EmptyHeader></Empty>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 80 }}>
                <XAxis type="number" tick={chartAxis} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <YAxis type="category" dataKey="name" tick={{ ...chartAxis, fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(v: number, n: string) => [formatMoney(v), n === "revenue" ? "Ciro" : n]} contentStyle={chartTooltip.contentStyle} labelStyle={chartTooltip.labelStyle} itemStyle={chartTooltip.itemStyle} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {topProducts.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </MagazineCard>

        {/* Donut - Categories */}
        <MagazineCard title="Kategori Dağılımı" subtitle="Ciro bazında">
          {categoryData.length === 0 ? (
            <Empty><EmptyHeader><EmptyMedia>🍩</EmptyMedia><EmptyTitle>Kategori verisi yok</EmptyTitle></EmptyHeader></Empty>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16, height: 260 }}>
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={2} dataKey="value">
                    {categoryData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatMoney(v), "Ciro"]} contentStyle={chartTooltip.contentStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.78rem" }}>
                {categoryData.slice(0, 6).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
                    <span style={{ color: MUTED }}>{c.name}</span>
                    <span style={{ color: TEXT, fontWeight: 600, marginLeft: "auto" }}>{formatMoney(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </MagazineCard>
      </div>

      {/* Isı Haritası — Saat × Gün */}
      {(() => {
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        const hours = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`);
        const heat: Record<string, Record<string, number>> = {};
        days.forEach(d => { heat[d] = {}; hours.forEach(h => { heat[d][h] = 0; }); });
        db.sales.filter(s => !s.deleted && s.status === 'tamamlandi').forEach(s => {
          const d = new Date(s.createdAt);
          const day = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
          const hour = `${d.getHours()}:00`;
          if (heat[day] && heat[day][hour] !== undefined) heat[day][hour] += s.total;
        });
        const allVals = Object.values(heat).flatMap(d => Object.values(d));
        const maxVal = Math.max(...allVals, 1);
        return (
          <div style={{ marginBottom: 14 }}>
            <MagazineCard title="Satış Isı Haritası" subtitle="Saat × Gün (ciro bazında)">
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 20, minWidth: 32 }}>
                  {hours.map(h => <div key={h} style={{ height: 24, fontSize: '0.6rem', color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>{h}</div>)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {days.map(d => <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: MUTED, fontWeight: 600 }}>{d}</div>)}
                  </div>
                  {hours.map(h => (
                    <div key={h} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {days.map(day => {
                        const val = heat[day][h] || 0;
                        const pct = val / maxVal;
                        const intensity = Math.max(0.05, pct);
                        return (
                          <div key={`${day}-${h}`} title={`${day} ${h}: ${formatMoney(val)}`}
                            style={{ flex: 1, height: 24, borderRadius: 3, background: `rgba(13,115,119,${intensity})`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <span style={{ fontSize: '0.55rem', color: pct > 0.5 ? '#fff' : MUTED, fontWeight: 600 }}>
                              {val > 0 ? `₺${(val / 1000).toFixed(0)}` : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </MagazineCard>
          </div>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <MagazineCard title="Ödeme Yöntem Trendi" subtitle="Son 14 gün">
          {paymentData.length === 0 ? (
            <Empty><EmptyHeader><EmptyMedia>💳</EmptyMedia><EmptyTitle>Veri yok</EmptyTitle></EmptyHeader></Empty>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                <XAxis dataKey="date" tick={chartAxis} axisLine={false} tickLine={false} />
                <YAxis tick={chartAxis} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <Tooltip formatter={(v: number) => [formatMoney(v), ""]} contentStyle={chartTooltip.contentStyle} />
                <Bar dataKey="nakit" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="kart" stackId="a" fill="#3b82f6" />
                <Bar dataKey="havale" stackId="a" fill="#f59e0b" />
                <Bar dataKey="cariP" stackId="a" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8, fontSize: "0.72rem", color: MUTED }}>
            <span><span style={{ color: "#10b981" }}>●</span> Nakit</span>
            <span><span style={{ color: "#3b82f6" }}>●</span> Kart</span>
            <span><span style={{ color: "#f59e0b" }}>●</span> Havale</span>
            <span><span style={{ color: "#8b5cf6" }}>●</span> Cari</span>
          </div>
        </MagazineCard>

        <MagazineCard title="Toplam Müşteriler" subtitle="En yüksek bakiyeli 5 müşteri">
          {topCustomers.length === 0 ? (
            <Empty><EmptyHeader><EmptyMedia>👤</EmptyMedia><EmptyTitle>Müşteri verisi yok</EmptyTitle></EmptyHeader></Empty>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {topCustomers.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 3 }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < topCustomers.length - 1 ? `1px solid ${BORDER}` : "none" }}
                >
                  <div>
                    <div style={{ color: TEXT, fontWeight: 600, fontSize: "0.85rem" }}>{c.name}</div>
                    <div style={{ color: MUTED, fontSize: "0.72rem" }}>{c.lastTransaction ? formatDate(c.lastTransaction) : "İşlem yok"}</div>
                  </div>
                  <div style={{ color: TEAL, fontWeight: 700, fontSize: "0.95rem" }}>{formatMoney(c.balance)}</div>
                </motion.div>
              ))}
            </div>
          )}
        </MagazineCard>
      </div>
    </motion.div>
  );
}
