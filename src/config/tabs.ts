import {
  Archive,
  Banknote,
  BarChart3,
  Bell,
  Bot,
  Boxes,
  Brain,
  Bug,
  Cable,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Handshake,
  LayoutDashboard,
  NotebookPen,
  PackageSearch,
  Receipt,
  ScanSearch,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { logger } from '@/lib/logger';

export const TABS = [
  { id: "dashboard", label: "Özet", icon: LayoutDashboard, group: "Ana" },
  { id: "products", label: "Ürünler", icon: Boxes, group: "Ana" },
  { id: "sales", label: "Satış", icon: ShoppingCart, group: "Ana" },
  { id: "fatura", label: "Fatura", icon: Receipt, group: "Ana" },
  { id: "suppliers", label: "Tedarikçi", icon: Truck, group: "Tedarik" },
  { id: "pelet", label: "Pelet", icon: Archive, group: "Tedarik" },
  { id: "boruTed", label: "Boru Tedarik", icon: Wrench, group: "Tedarik" },
  { id: "ortakEmanet", label: "Ortak Emanet", icon: Handshake, group: "Tedarik" },
  { id: "cari", label: "Cari", icon: Users, group: "Finans" },
  { id: "kasa", label: "Kasa", icon: Wallet, group: "Finans" },
  { id: "butce", label: "Bütçe", icon: BarChart3, group: "Finans" },
  { id: "bank", label: "Banka", icon: CreditCard, group: "Finans" },
  { id: "reports", label: "Raporlar", icon: FileText, group: "Analiz" },
  { id: "cizelge", label: "Çizelge", icon: ClipboardList, group: "Analiz" },
  { id: "stock", label: "Stok", icon: PackageSearch, group: "Analiz" },
  { id: "monitor", label: "İzleme", icon: Bell, group: "Analiz" },
  { id: "kontrol", label: "Kontrol", icon: ScanSearch, group: "Analiz" },
  { id: "anomali", label: "Anomali", icon: Banknote, group: "Analiz" },
  { id: "entegrasyon", label: "Entegrasyon", icon: Cable, group: "Sistem" },
  { id: "excelmerge", label: "Veri Birleştir", icon: FileSpreadsheet, group: "Sistem" },
  { id: "notlar", label: "Not Defteri", icon: NotebookPen, group: "Sistem" },
  { id: "partners", label: "Ortaklar", icon: Handshake, group: "Sistem" },
  { id: "settings", label: "Ayarlar", icon: Wrench, group: "Sistem" },
  { id: "bughunter", label: "Bug Hunter", icon: Bug, group: "Sistem" },
  { id: "excelimport", label: "Excel İçe Aktar", icon: FileSpreadsheet, group: "Sistem" },
  { id: "aiEylemLog", label: "AI Eylem Log", icon: Brain, group: "Sistem" },
  { id: "specdashboard", label: "Spec", icon: Bot, group: "Sistem" },
] as const;

export type TabId = (typeof TABS)[number]["id"];
export type TabGroup = (typeof TABS)[number]["group"];

export const TAB_PATHS: Record<TabId, string> = {
  dashboard: "/dashboard",
  products: "/products",
  sales: "/sales",
  fatura: "/fatura",
  suppliers: "/suppliers",
  pelet: "/pelet",
  boruTed: "/boruTed",
  ortakEmanet: "/ortak-emanet",
  cari: "/cari",
  kasa: "/kasa",
  butce: "/butce",
  bank: "/bank",
  reports: "/reports",
  cizelge: "/cizelge",
  stock: "/stock",
  monitor: "/monitor",
  kontrol: "/kontrol",
  entegrasyon: "/entegrasyon",
  excelmerge: "/excelmerge",
  notlar: "/notlar",
  partners: "/partners",
  settings: "/settings",
  bughunter: "/bughunter",
  anomali: "/anomali",
  excelimport: "/excelimport",
  aiEylemLog: "/ai/eylem-log",
  specdashboard: "/spec",
};

export function getActiveTabFromLocation(location: string): TabId {
  const path = location.split("?")[0].replace(/\/$/, "") || "/";
  if (path.startsWith("/urunler/")) return "products";
  if (path.startsWith("/satis/")) return "sales";
  if (path.startsWith("/cari/")) return "cari";

  const match = (Object.entries(TAB_PATHS) as [TabId, string][]).find(
    ([, routePath]) => routePath === path,
  );
  if (match) return match[0];

  const legacyTabId = path.replace("/", "");
  return TABS.some((tab) => tab.id === legacyTabId)
    ? (legacyTabId as TabId)
    : "dashboard";
}

export const PRIORITY_TABS: readonly TabId[] = [
  "dashboard",
  "sales",
  "products",
  "kasa",
  "cari",
];
export const DEFAULT_EXPANDED_GROUPS: readonly TabGroup[] = ["Ana", "Finans"];
export const FAVORITE_TABS_KEY = "sobaYonetim_favoriteTabs";

export function loadFavoriteTabs(): TabId[] {
  try {
    const raw = localStorage.getItem(FAVORITE_TABS_KEY);
    if (!raw) return [...PRIORITY_TABS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...PRIORITY_TABS];
    const validTabIds = new Set<TabId>(TABS.map((tab) => tab.id));
    const favorites = parsed.filter(
      (tabId): tabId is TabId =>
        typeof tabId === "string" && validTabIds.has(tabId as TabId),
    );
    return favorites.length > 0 ? favorites.slice(0, 6) : [...PRIORITY_TABS];
  } catch {
    logger.warn('storage', 'Favori sekmeler yüklenirken hata oluştu');
    return [...PRIORITY_TABS];
  }
}

export function saveFavoriteTabs(tabIds: readonly TabId[]) {
  try {
    localStorage.setItem(FAVORITE_TABS_KEY, JSON.stringify(tabIds.slice(0, 6)));
  } catch {
    logger.warn('storage', 'Favori sekmeler kaydedilirken hata oluştu');
    void 0;
  }
}
