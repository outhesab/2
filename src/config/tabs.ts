export const TABS = [
  { id: "dashboard", label: "Özet", icon: "📊", group: "Ana" },
  { id: "dashboard-finans", label: "Finans", icon: "🏦", group: "Ana" },
  { id: "dashboard-ticaret", label: "Ticaret", icon: "📈", group: "Ana" },
  { id: "dashboard-operasyon", label: "Operasyon", icon: "⚙️", group: "Ana" },
  { id: "dashboard-strateji", label: "Strateji", icon: "🔮", group: "Ana" },
  { id: "products", label: "Ürünler", icon: "📦", group: "Ana" },
  { id: "sales", label: "Satış", icon: "🛒", group: "Ana" },
  { id: "fatura", label: "Fatura", icon: "🧾", group: "Ana" },
  { id: "suppliers", label: "Tedarikçi", icon: "🏭", group: "Tedarik" },
  { id: "pelet", label: "Pelet", icon: "🪵", group: "Tedarik" },
  { id: "boruTed", label: "Boru Tedarik", icon: "🔩", group: "Tedarik" },
  { id: "ortakEmanet", label: "Ortak Emanet", icon: "🤝", group: "Tedarik" },
  { id: "cari", label: "Cari", icon: "👤", group: "Finans" },
  { id: "kasa", label: "Kasa", icon: "💰", group: "Finans" },
  { id: "butce", label: "Bütçe", icon: "📊", group: "Finans" },
  { id: "bank", label: "Banka", icon: "🏦", group: "Finans" },
  { id: "reports", label: "Raporlar", icon: "📈", group: "Analiz" },
  { id: "cizelge", label: "Çizelge", icon: "📅", group: "Analiz" },
  { id: "stock", label: "Stok", icon: "🔢", group: "Analiz" },
  { id: "monitor", label: "İzleme", icon: "🔔", group: "Analiz" },
  { id: "kontrol", label: "Kontrol", icon: "⚡", group: "Analiz" },
  { id: "entegrasyon", label: "Entegrasyon", icon: "🔗", group: "Sistem" },
  { id: "excelmerge", label: "Veri Birleştir", icon: "📊", group: "Sistem" },
  { id: "notlar", label: "Not Defteri", icon: "📝", group: "Sistem" },
  { id: "partners", label: "Ortaklar", icon: "🤝", group: "Sistem" },
  { id: "settings", label: "Ayarlar", icon: "⚙️", group: "Sistem" },
  { id: "bughunter", label: "Bug Hunter", icon: "🐛", group: "Sistem" },
  { id: "anomali", label: "Anomali", icon: "⚠️", group: "Analiz" },
  { id: "excelimport", label: "Excel İçe Aktar", icon: "📥", group: "Sistem" },
  { id: "aiEylemLog", label: "AI Eylem Log", icon: "🧠", group: "Sistem" },
  { id: "specdashboard", label: "Spec", icon: "📋", group: "Sistem" },
] as const;

export type TabId = (typeof TABS)[number]["id"];
export type TabGroup = (typeof TABS)[number]["group"];

export const TAB_PATHS: Record<TabId, string> = {
  dashboard: "/dashboard",
  "dashboard-finans": "/dashboard-finans",
  "dashboard-ticaret": "/dashboard-ticaret",
  "dashboard-operasyon": "/dashboard-operasyon",
  "dashboard-strateji": "/dashboard-strateji",
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
    return [...PRIORITY_TABS];
  }
}

export function saveFavoriteTabs(tabIds: readonly TabId[]) {
  try {
    localStorage.setItem(FAVORITE_TABS_KEY, JSON.stringify(tabIds.slice(0, 6)));
  } catch {
    void 0;
  }
}
