import type { IssueSeverity } from "@/lib/dataIntegrityChecker";

export const ruleTypes = [
  "stok_min",
  "stok_sifir",
  "kasa_min",
  "alacak_vadeli",
  "borc_vadeli",
  "satis_hedef",
] as const;

export const ruleLabels: Record<string, string> = {
  stok_min: "📦 Düşük Stok",
  stok_sifir: "🔴 Biten Stok",
  kasa_min: "💰 Düşük Kasa",
  alacak_vadeli: "📥 Vadeli Alacak",
  borc_vadeli: "📤 Vadeli Borç",
  satis_hedef: "🎯 Satış Hedefi",
};

export const levelColors: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

export const severityLabels: Record<IssueSeverity, string> = {
  critical: "🔴 Kritik",
  warning: "🟡 Uyarı",
  info: "🔵 Bilgi",
};

export const categoryLabels: Record<string, string> = {
  stok: "📦 Stok",
  kasa: "💰 Kasa",
  cari: "👤 Cari",
  satis: "🛒 Satış",
  siparis: "📋 Sipariş",
  fatura: "🧾 Fatura",
  veri: "🗄️ Veri",
  referans: "🔗 Referans",
  anomali: "🔍 Anomali",
};

export function getActionIcon(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("satış") || a.includes("satis")) return "🛒";
  if (a.includes("ürün") || a.includes("urun") || a.includes("stok")) return "📦";
  if (a.includes("kasa") || a.includes("gelir") || a.includes("gider")) return "💰";
  if (a.includes("cari") || a.includes("müşteri")) return "👤";
  if (a.includes("fatura")) return "🧾";
  if (a.includes("sipariş")) return "📋";
  if (a.includes("sil") || a.includes("iptal")) return "🗑️";
  return "📝";
}
