import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoney } from "@/lib/utils-tr";
import type { DB } from "@/types";
import { Empty, EmptyHeader, EmptyTitle, EmptyMedia } from "@/components/ui/empty";

interface Props { db: DB; onTabChange: (tab: string) => void; save: (updater: (prev: DB) => DB) => void; }

const MONO = "'Courier New', monospace";
const CARD_BG = "#1a1a22";
const BORDER = "#2a2a32";
const TEXT = "#e2e8f0";
const MUTED = "#787890";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } } as const;
const cardVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } } };

function StatusPill({ status }: { status: string }) {
  const col = status === "tamamlandi" || status === "ok" ? "#22c55e"
    : status === "yolda" || status === "warn" ? "#ff6b35"
    : status === "bekliyor" || status === "critical" ? "#ef4444"
    : "#787890";
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 600,
      background: `${col}18`, color: col, border: `1px solid ${col}30`,
    }}>
      {status}
    </span>
  );
}

function OpCard({ title, subtitle, children, extra, style }: {
  title: string; subtitle?: string; children: React.ReactNode; extra?: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <motion.div variants={cardVariants}
      style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 16px", ...style }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: subtitle ? 4 : 12 }}>
        <h3 style={{ color: TEXT, fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.02em" }}>{title}</h3>
        {extra}
      </div>
      {subtitle && <p style={{ color: MUTED, fontSize: "0.72rem", marginBottom: 10 }}>{subtitle}</p>}
      {children}
    </motion.div>
  );
}

export default function DashboardOperasyon({ db, onTabChange: _onTabChange }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const filters = ["all", "stok", "sipariş", "aktivite", "sistem"];

  const stockAlerts = useMemo(() => {
    return db.products.filter((p) => !p.deleted && p.stock <= p.minStock)
      .sort((a, b) => a.stock / Math.max(a.minStock, 1) - b.stock / Math.max(b.minStock, 1));
  }, [db.products]);

  const avgDailySales = useMemo(() => {
    const map: Record<string, number> = {};
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
    db.sales.filter((s) => !s.deleted && s.status === "tamamlandi" && s.createdAt >= cutoff && s.productName).forEach((s) => {
      map[s.productName] = (map[s.productName] || 0) + s.quantity;
    });
    Object.keys(map).forEach((k) => { map[k] /= 30; });
    return map;
  }, [db.sales]);

  const orderPipeline = useMemo(() => {
    const groups: Record<string, { count: number; total: number }> = { bekliyor: { count: 0, total: 0 }, yolda: { count: 0, total: 0 }, tamamlandi: { count: 0, total: 0 }, iptal: { count: 0, total: 0 } };
    db.orders.filter((o) => !o.deleted).forEach((o) => {
      if (groups[o.status]) { groups[o.status].count++; groups[o.status].total += o.amount; }
    });
    return Object.entries(groups).map(([status, v]) => ({ status, ...v }));
  }, [db.orders]);

  const activityLog = useMemo(() => {
    return [...db._activityLog].sort((a, b) => {
      const ta = a.time || a.createdAt || "";
      const tb = b.time || b.createdAt || "";
      return tb.localeCompare(ta);
    }).slice(0, 12);
  }, [db._activityLog]);

  const systemHealth = useMemo(() => {
    let storagePct = 0;
    try {
      const raw = localStorage.getItem("sobaYonetim") || "";
      const maxBytes = 10 * 1024 * 1024;
      storagePct = Math.min(100, (raw.length / maxBytes) * 100);
    } catch { storagePct = 0; }
    const lastBackup = localStorage.getItem("sobaYonetim_lastBackup");
    const daysSinceBackup = lastBackup ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000) : null;
    const totalRecords = db.products.length + db.sales.length + db.cari.length + db.kasa.length + db.orders.length + db.suppliers.length;
    return { storagePct, daysSinceBackup, totalRecords };
  }, [db]);

  const pendingActions = useMemo(() => {
    const items: { icon: string; text: string; count: number; amount: number; severity: "critical" | "warn" | "info" }[] = [];
    const bekleyenOrders = db.orders.filter((o) => o.status === "bekliyor");
    if (bekleyenOrders.length > 0) items.push({ icon: "📋", text: "Bekleyen sipariş", count: bekleyenOrders.length, amount: bekleyenOrders.reduce((s, o) => s + o.amount, 0), severity: "warn" });
    const outStock = db.products.filter((p) => !p.deleted && p.stock === 0);
    if (outStock.length > 0) items.push({ icon: "⚠️", text: "Stoğu biten ürün", count: outStock.length, amount: 0, severity: "critical" });
    const eskiAlacak = db.cari.filter((c) => {
      if (c.deleted || c.type !== "musteri" || c.balance <= 0) return false;
      if (!c.lastTransaction) return false;
      return (Date.now() - new Date(c.lastTransaction).getTime()) > 30 * 86400000;
    });
    if (eskiAlacak.length > 0) items.push({ icon: "🔴", text: "30+ gün gecikmiş alacak", count: eskiAlacak.length, amount: eskiAlacak.reduce((s, c) => s + c.balance, 0), severity: "critical" });
    return items;
  }, [db]);

  const stockChart = useMemo(() => {
    const map: Record<string, { stock: number; min: number }> = {};
    stockAlerts.slice(0, 10).forEach((p) => { map[p.name] = { stock: p.stock, min: p.minStock }; });
    return Object.entries(map).map(([name, v]) => ({ name, stock: v.stock, min: v.min }));
  }, [stockAlerts]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible"
      style={{ padding: "12px 16px", maxWidth: 1400, margin: "0 auto" }}
    >
      {/* Header */}
      <motion.div variants={cardVariants} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ color: TEXT, fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
              <span style={{ color: "#ff6b35" }}>◉</span> Operasyonel Radar
            </h1>
            <p style={{ color: MUTED, fontSize: "0.72rem", fontFamily: MONO }}>{new Date().toLocaleString("tr-TR")} · {systemHealth.totalRecords} kayıt</p>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {filters.map((f) => (
              <motion.button key={f} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                style={{
                  padding: "3px 10px", borderRadius: 4, border: `1px solid ${filter === f ? "#ff6b35" : BORDER}`,
                  background: filter === f ? "#ff6b3518" : "transparent", color: filter === f ? "#ff6b35" : MUTED,
                  cursor: "pointer", fontSize: "0.7rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.04em",
                }}
              >
                {f}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {(filter === "all" || filter === "stok") && (
        <OpCard title={`STOK KONTROL ODASI (${stockAlerts.length})`} subtitle="Stok seviyesi minStok altında olan ürünler" extra={<StatusPill status={stockAlerts.length > 0 ? "critical" : "ok"} />}>
          {stockAlerts.length === 0 ? (
            <Empty><EmptyHeader><EmptyMedia>📦</EmptyMedia><EmptyTitle>Tüm stoklar yeterli</EmptyTitle></EmptyHeader></Empty>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                  <thead>
                    <tr style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 500 }}>Ürün</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 500, fontFamily: MONO }}>Stok</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 500, fontFamily: MONO }}>Min</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 500, fontFamily: MONO }}>Tah. Gün</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 500, fontFamily: MONO }}>Maliyet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockAlerts.map((p, i) => {
                      const daily = avgDailySales[p.name] || 0;
                      const depletionDays = daily > 0 ? Math.floor(p.stock / daily) : 999;
                      const critical = p.stock === 0;
                      return (
                        <motion.tr key={p.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                          whileHover={{ background: `${BORDER}40` }}
                          style={{ borderBottom: `1px solid ${BORDER}`, background: critical ? "#ef444408" : "transparent" }}
                        >
                          <td style={{ padding: "7px 8px", color: critical ? "#ef4444" : TEXT, fontWeight: 500 }}>{p.name}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: MONO, color: critical ? "#ef4444" : p.stock <= p.minStock / 2 ? "#ff6b35" : TEXT }}>{p.stock}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: MONO, color: MUTED }}>{p.minStock}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: MONO, color: depletionDays < 7 ? "#ef4444" : depletionDays < 30 ? "#ff6b35" : MUTED }}>
                            {critical ? "BİTTİ" : `${depletionDays}g`}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: MONO, color: MUTED }}>{formatMoney(p.cost * p.stock)}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {stockChart.length > 1 && (
                <div style={{ marginTop: 10 }}>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={stockChart} margin={{ top: 4, right: 4, bottom: 4, left: -8 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: MUTED, fontFamily: MONO }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: MUTED, fontFamily: MONO }} axisLine={false} tickLine={false} />
                      <Bar dataKey="stock" fill="#ff6b35" radius={[2, 2, 0, 0]} maxBarSize={16} />
                      <Tooltip contentStyle={{ background: CARD_BG, border: `1px solid ${BORDER}`, fontSize: "0.72rem" }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </OpCard>
      )}

      {(filter === "all" || filter === "stok") && (() => {
        // Bugün sipariş verilmesi gereken ürünler
        const reorderUrgency = db.products.filter(p => !p.deleted && p.stock > 0)
          .map(p => {
            const daily = avgDailySales[p.name] || 0;
            const daysLeft = daily > 0 ? p.stock / daily : 999;
            const minDays = p.minStock / Math.max(daily, 0.01);
            const urgencyScore = Math.max(0, Math.min(100, (1 - daysLeft / Math.max(minDays, 1)) * 100));
            return { ...p, dailySales: daily, daysLeft, urgencyScore };
          })
          .filter(p => p.urgencyScore > 50 || p.stock <= p.minStock)
          .sort((a, b) => b.urgencyScore - a.urgencyScore)
          .slice(0, 8);
        if (reorderUrgency.length === 0) return null;
        return (
          <OpCard title="BUGÜN SİPARİŞ VER" subtitle="Acil yeniden sipariş listesi" extra={<span style={{ color: '#ff6b35', fontFamily: MONO, fontWeight: 700 }}>{reorderUrgency.length}</span>} style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reorderUrgency.map((p, i) => {
                const urgencyColor = p.urgencyScore > 80 ? '#ef4444' : p.urgencyScore > 60 ? '#ff6b35' : '#f59e0b';
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    whileHover={{ background: `${BORDER}40` }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, border: `1px solid ${BORDER}`, background: `${urgencyColor}06`, cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ color: TEXT, fontSize: '0.78rem', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: MUTED, fontSize: '0.68rem', fontFamily: MONO }}>
                        Stok: {p.stock} · Günlük: {p.dailySales.toFixed(1)} · {p.daysLeft < 30 ? `${Math.floor(p.daysLeft)} gün kaldı` : 'Yeterli'}
                      </div>
                    </div>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: BORDER, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, p.urgencyScore)}%`, height: 4, borderRadius: 2, background: urgencyColor }} />
                    </div>
                    <span style={{ color: urgencyColor, fontFamily: MONO, fontSize: '0.72rem', fontWeight: 700 }}>{Math.round(p.urgencyScore)}%</span>
                  </motion.div>
                );
              })}
            </div>
          </OpCard>
        );
      })()}

      {(filter === "all" || filter === "sipariş") && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 12 }}>
          {orderPipeline.map((o) => {
            const col = o.status === "tamamlandi" ? "#22c55e" : o.status === "yolda" ? "#ff6b35" : o.status === "bekliyor" ? "#ef4444" : MUTED;
            return (
              <OpCard key={o.status} title={o.status.toUpperCase()} extra={<span style={{ fontFamily: MONO, color: col, fontSize: "1.2rem", fontWeight: 700 }}>{o.count}</span>}>
                <div style={{ color: MUTED, fontSize: "0.8rem", fontFamily: MONO }}>{formatMoney(o.total)}</div>
              </OpCard>
            );
          })}
        </div>
      )}

      {(filter === "all" || filter === "aktivite") && (
        <OpCard title="AKTİVİTE AKIŞI" subtitle="Son 12 aktivite" extra={activityLog.length > 0 ? <StatusPill status={`${activityLog.length}`} /> : undefined} style={{ marginTop: 12 }}>
          {activityLog.length === 0 ? (
            <Empty><EmptyHeader><EmptyMedia>📋</EmptyMedia><EmptyTitle>Aktivite yok</EmptyTitle></EmptyHeader></Empty>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {activityLog.map((a, i) => {
                const ts = a.time || a.createdAt || "";
                const rel = ts ? Math.floor((Date.now() - new Date(ts).getTime()) / 60000) : 0;
                const relStr = rel < 1 ? "şimdi" : rel < 60 ? `${rel}d` : rel < 1440 ? `${Math.floor(rel / 60)}s` : `${Math.floor(rel / 1440)}g`;
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    whileHover={{ background: `${BORDER}30` }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", borderBottom: i < activityLog.length - 1 ? `1px solid ${BORDER}` : "none", fontSize: "0.75rem" }}
                  >
                    <span style={{ fontSize: "0.9rem" }}>{a.action?.includes("satış") || a.action?.includes("satis") ? "🛒" : a.action?.includes("üret") || a.action?.includes("urun") ? "📦" : a.action?.includes("sil") ? "🗑️" : a.action?.includes("düz") || a.action?.includes("günc") ? "✏️" : "📝"}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: TEXT }}>{a.action}</span>
                      {a.detail && <span style={{ color: MUTED, marginLeft: 6 }}>{a.detail.slice(0, 60)}</span>}
                    </div>
                    <span style={{ color: MUTED, fontFamily: MONO, fontSize: "0.65rem", whiteSpace: "nowrap" }}>{relStr}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </OpCard>
      )}

      {(filter === "all" || filter === "sistem") && (
        <OpCard title="SİSTEM SAĞLIĞI" subtitle=""
          extra={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <StatusPill status={systemHealth.daysSinceBackup === null || systemHealth.daysSinceBackup >= 7 ? "critical" : systemHealth.daysSinceBackup >= 3 ? "warn" : "ok"} />
            </div>
          } style={{ marginTop: 12 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ color: MUTED, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Depolama</div>
              <div style={{ background: BORDER, borderRadius: 4, height: 8, overflow: "hidden" }}>
                <div style={{ width: `${systemHealth.storagePct}%`, height: 8, borderRadius: 4, background: systemHealth.storagePct > 70 ? "#ef4444" : systemHealth.storagePct > 40 ? "#ff6b35" : "#22c55e", transition: "width 0.5s" }} />
              </div>
              <div style={{ color: TEXT, fontSize: "0.8rem", fontFamily: MONO, marginTop: 2 }}>%{systemHealth.storagePct.toFixed(1)}</div>
            </div>
            <div>
              <div style={{ color: MUTED, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Son Yedek</div>
              <div style={{ color: TEXT, fontSize: "0.8rem", fontFamily: MONO }}>
                {systemHealth.daysSinceBackup === null ? "Hiç" : `${systemHealth.daysSinceBackup}g önce`}
              </div>
            </div>
            <div>
              <div style={{ color: MUTED, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Toplam Kayıt</div>
              <div style={{ color: TEXT, fontSize: "0.8rem", fontFamily: MONO }}>{systemHealth.totalRecords.toLocaleString("tr-TR")}</div>
            </div>
          </div>
        </OpCard>
      )}

      {(filter === "all") && pendingActions.length > 0 && (
        <OpCard title="BEKLEYEN İŞLEMLER" subtitle="" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {pendingActions.map((a, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 6,
                  border: `1px solid ${a.severity === "critical" ? "#ef444430" : a.severity === "warn" ? "#ff6b3530" : "#22c55e30"}`,
                  background: a.severity === "critical" ? "#ef444408" : a.severity === "warn" ? "#ff6b3508" : "#22c55e08",
                  fontSize: "0.78rem",
                }}
              >
                <span>{a.icon}</span>
                <span style={{ color: TEXT }}>{a.text}: <strong style={{ fontFamily: MONO }}>{a.count}</strong></span>
                {a.amount > 0 && <span style={{ color: MUTED, fontFamily: MONO }}>{formatMoney(a.amount)}</span>}
              </motion.div>
            ))}
          </div>
        </OpCard>
      )}
    </motion.div>
  );
}
