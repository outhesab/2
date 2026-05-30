import { logger } from "@/lib/logger";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoginScreen, { useAuth } from "@/components/LoginScreen";
import SetupWizard, {
  getSetupData,
  isSetupDone,
} from "@/components/SetupWizard";
import { getAllAgents } from "@/agents";
import type { AgentContext } from "@/agents/types";
import { useToast } from "@/components/Toast";
import { onSyncStatus, useDB, type SyncStatus } from "@/hooks/useDB";
import {
  applyUIPrefs,
  loadUIPrefs,
  loadUIPrefsFromFirebase,
  saveUIPrefs,
} from "@/hooks/useUIPrefs";
import { loadConnConfigFromFirebase, saveConnConfig } from "@/lib/connConfig";
import { getAppVersion, getVersionTitle } from "@/lib/version";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Router, Switch, Route, useLocation } from "wouter";
import { TABS, type TabId, type TabGroup, TAB_PATHS, getActiveTabFromLocation, loadFavoriteTabs, saveFavoriteTabs } from "@/config/tabs";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import FAB from "@/components/layout/FAB";
import ReportButton from "@/components/layout/ReportButton";
import AIDrawer from "@/components/layout/AIDrawer";
import PageFallback from "@/components/layout/PageFallback";

const AIEylemLog = lazy(() => import("@/pages/AIEylemLog"));
const AnomaliOneri = lazy(() => import("@/pages/AnomaliOneri"));
const Bank = lazy(() => import("@/pages/Bank"));
const BoruTed = lazy(() => import("@/pages/BoruTed"));
const BugHunter = lazy(() => import("@/pages/BugHunter"));
const Butce = lazy(() => import("@/pages/Butce"));
const Cari = lazy(() => import("@/pages/Cari"));
const CariDetail = lazy(() => import("@/pages/CariDetail"));
const Cizelge = lazy(() => import("@/pages/Cizelge"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DashboardFinans = lazy(() => import("@/pages/DashboardFinans"));
const DashboardTicaret = lazy(() => import("@/pages/DashboardTicaret"));
const DashboardOperasyon = lazy(() => import("@/pages/DashboardOperasyon"));
const DashboardStrateji = lazy(() => import("@/pages/DashboardStrateji"));
const Entegrasyonlar = lazy(() => import("@/pages/Entegrasyonlar"));
const ExcelImport = lazy(() => import("@/pages/ExcelImport"));
const ExcelMerge = lazy(() => import("@/pages/ExcelMerge"));
const Fatura = lazy(() => import("@/pages/Fatura"));
const Kasa = lazy(() => import("@/pages/Kasa"));
const KontrolHalkasi = lazy(() => import("@/pages/KontrolHalkasi"));
const Monitor = lazy(() => import("@/pages/Monitor"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Notlar = lazy(() => import("@/pages/Notlar"));
const OrtakEmanet = lazy(() => import("@/pages/OrtakEmanet"));
const Partners = lazy(() => import("@/pages/Partners"));
const Pelet = lazy(() => import("@/pages/Pelet"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Reports = lazy(() => import("@/pages/Reports"));
const Sales = lazy(() => import("@/pages/Sales"));
const SaleDetail = lazy(() => import("@/pages/SaleDetail"));
const Settings = lazy(() => import("@/pages/Settings"));
const Perf = lazy(() => import("@/pages/Perf"));
const SpecDashboard = lazy(() => import("@/pages/SpecDashboard"));
const Stock = lazy(() => import("@/pages/Stock"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
import { Toaster } from "sonner";

// UI tercihlerini uygulama baÃƒâ€¦Ã…Â¸langÃƒâ€Ã‚Â±cÃƒâ€Ã‚Â±nda localStorage'dan hÃƒâ€Ã‚Â±zlÃƒâ€Ã‚Â±ca yÃƒÆ’Ã‚Â¼kle
applyUIPrefs(loadUIPrefs());

// Arka planda Firebase'den gÃƒÆ’Ã‚Â¼ncel prefs'leri ÃƒÆ’Ã‚Â§ek ve uygula
Promise.all([loadUIPrefsFromFirebase(), loadConnConfigFromFirebase()])
  .then(([fbPrefs, fbConn]) => {
    if (fbPrefs) {
      saveUIPrefs(fbPrefs);
      applyUIPrefs(fbPrefs);
    }
    if (fbConn) {
      saveConnConfig(fbConn);
    }
  })
  .catch(() => logger.error('sync', 'Firebase config/UI prefs yÃƒÆ’Ã‚Â¼klenemedi'));

function AppContent({
  onLogout,
  username,
  guestTimeLeft,
}: {
  onLogout: () => void;
  username?: string;
  guestTimeLeft: number;
}) {
  const { db, save, exportJSON, importJSON, undo } = useDB();
  useEffect(() => {
    const ctx: AgentContext = { getDB: () => db, save };
    getAllAgents().forEach((agent) => agent.bagla(ctx));
  }, [db, save]);
  const [location, setLocation] = useLocation();
  const activeTab = getActiveTabFromLocation(location);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favoriteTabs, setFavoriteTabs] = useState<TabId[]>(loadFavoriteTabs);
  const [expandedGroups, setExpandedGroups] = useState<
    Record<TabGroup, boolean>
  >({
    Ana: true,
    Tedarik: false,
    Finans: true,
    Analiz: false,
    Sistem: false,
  });
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [uiPrefs, setUiPrefs] = useState(loadUIPrefs);
  const isOnline = useOnlineStatus();
  const prevOnline = useRef(isOnline);
  const { showToast } = useToast();

  // UIPrefs deÃƒâ€Ã…Â¸iÃƒâ€¦Ã…Â¸ikliklerini dinle (Settings'ten gÃƒÆ’Ã‚Â¼ncelleme gelince yansÃƒâ€Ã‚Â±sÃƒâ€Ã‚Â±n)
  useEffect(() => {
    const handler = () => setUiPrefs(loadUIPrefs());
    window.addEventListener("storage", handler);
    window.addEventListener("sobaUI:updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("sobaUI:updated", handler);
    };
  }, []);

  // Sync durum izleme
  useEffect(() => {
    const unsub = onSyncStatus((status, detail) => {
      setSyncStatus(status);
      if (status === "saved")
        setLastSyncTime(
          new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      if (status === "error" && detail) console.warn("[sync]", detail);
    });
    return unsub;
  }, []);

  // Son gÃƒÆ’Ã‚Â¼ncelleme toast'u ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â her versiyon iÃƒÆ’Ã‚Â§in bir kez gÃƒÆ’Ã‚Â¶ster
  useEffect(() => {
    const appVersion = getAppVersion();
    const seenKey = `parspel_update_seen_${appVersion}`;
    try {
      if (!localStorage.getItem(seenKey)) {
        setTimeout(() => {
          showToast(`PARSPEL v${appVersion} — ${getVersionTitle()}`, 'info');
          try { localStorage.setItem(seenKey, '1'); } catch { /* localStorage yazma hatasÃƒâ€Ã‚Â± */ }
        }, 1500);
      }
    } catch { /* localStorage okuma hatasÃƒâ€Ã‚Â± */ }
  }, [showToast]);

  // Ãƒâ€Ã‚Â°lk kurulum verisini DB'ye yaz (bir kez)
  useEffect(() => {
    const setup = getSetupData();
    if (!setup) return;
    const applied = localStorage.getItem("sobaYonetim_setupApplied");
    if (applied) return;
    save((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const now = new Date().toISOString();
      // Kasalar
      const kasalar = setup.kasalar.length > 0 ? setup.kasalar : prev.kasalar;
      // ÃƒÆ’Ã…â€œrÃƒÆ’Ã‚Â¼nler
      const mevcutIds = new Set(prev.products.map((p: { id: string }) => p.id));
      const yeniUrunler = (setup.urunler || []).filter(
        (u: { id: string }) => !mevcutIds.has(u.id),
      );
      const products = [...prev.products, ...yeniUrunler];
      // Ortaklar
      const mevcutOrtakIds = new Set(
        (prev.partners || []).map((p: { id: string }) => p.id),
      );
      const yeniOrtaklar = (setup.ortaklar || []).filter(
        (o: { id: string }) => !mevcutOrtakIds.has(o.id),
      );
      const partners = [...(prev.partners || []), ...yeniOrtaklar];
      // Ortak carileri
      const mevcutCariIds = new Set(prev.cari.map((c: { id: string }) => c.id));
      const yeniCariOrtaklar = (setup.cariOrtaklar || []).filter(
        (c: { id: string }) => !mevcutCariIds.has(c.id),
      );
      const cari = [...prev.cari, ...yeniCariOrtaklar];
      // Settings
      const settings = {
        ...prev.settings,
        companyName: setup.companyName,
        city: setup.city,
      };
      // Kategoriler
      const mevcutKatIds = new Set(
        (prev.productCategories || []).map((k: { id: string }) => k.id),
      );
      const yeniKategoriler = (setup.kategoriler || []).filter(
        (k: { id: string }) => !mevcutKatIds.has(k.id),
      );
      const productCategories = [
        ...(prev.productCategories || []),
        ...yeniKategoriler,
      ];
      return {
        ...prev,
        kasalar,
        products,
        partners,
        cari,
        settings,
        productCategories,
      };
    });
    localStorage.setItem("sobaYonetim_setupApplied", "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevOnline.current !== isOnline) {
      if (isOnline) {
        showToast("Ãƒâ€Ã‚Â°nternet baÃƒâ€Ã…Â¸lantÃƒâ€Ã‚Â±sÃƒâ€Ã‚Â± yeniden kuruldu", "success");
      } else {
        showToast(
          "ÃƒÆ’Ã¢â‚¬Â¡evrimdÃƒâ€Ã‚Â±Ãƒâ€¦Ã…Â¸Ãƒâ€Ã‚Â± ÃƒÆ’Ã‚Â§alÃƒâ€Ã‚Â±Ãƒâ€¦Ã…Â¸Ãƒâ€Ã‚Â±yorsunuz ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â veriler korunuyor",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "info" as any,
        );
      }
      prevOnline.current = isOnline;
    }
  }, [isOnline, showToast]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navigate = useCallback((tab: TabId) => {
    setLocation(TAB_PATHS[tab]);
    setSidebarOpen(false);
  }, [setLocation]);

  const toggleGroup = useCallback((group: TabGroup) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);

  const toggleFavoriteTab = useCallback((tabId: TabId) => {
    setFavoriteTabs((prev) => {
      const next = prev.includes(tabId)
        ? prev.filter((currentTabId) => currentTabId !== tabId)
        : [
            tabId,
            ...prev.filter((currentTabId) => currentTabId !== tabId),
          ].slice(0, 6);
      saveFavoriteTabs(next);
      return next;
    });
  }, []);

  const priorityTabs = useMemo(
    () =>
      favoriteTabs
        .map((id) => TABS.find((tab) => tab.id === id))
        .filter((tab): tab is (typeof TABS)[number] => Boolean(tab)),
    [favoriteTabs],
  );

  useEffect(() => {
    const activeGroup = TABS.find((tab) => tab.id === activeTab)?.group;
    if (!activeGroup) return;
    setExpandedGroups((prev) =>
      prev[activeGroup] ? prev : { ...prev, [activeGroup]: true },
    );
  }, [activeTab]);

  // Yedek event listener (Dashboard widget'Ãƒâ€Ã‚Â±ndan tetiklenir)
  useEffect(() => {
    const handler = () => {
      exportJSON();
      localStorage.setItem("sobaYonetim_lastBackup", new Date().toISOString());
    };
    window.addEventListener("soba:exportJSON", handler);
    return () => window.removeEventListener("soba:exportJSON", handler);
  }, [exportJSON]);

  const badges = useMemo(
    () => ({
      products:
        db.products.filter((p) => !p.deleted && p.stock === 0).length +
        db.products.filter(
          (p) => !p.deleted && p.stock > 0 && p.stock <= p.minStock,
        ).length,
      sales: db.sales.filter(
        (s) =>
          s.status === "tamamlandi" &&
          new Date(s.createdAt).toDateString() === new Date().toDateString(),
      ).length,
      suppliers: db.orders.filter((o) => o.status === "bekliyor").length,
      bank: db.bankTransactions.filter((t) => t.status === "unmatched").length,
      monitor: db.monitorRules
        .filter((r) => r.active)
        .reduce((c, r) => {
          if (
            r.type === "stok_sifir" &&
            db.products.some((p) => !p.deleted && p.stock === 0)
          )
            return c + 1;
          if (
            r.type === "stok_min" &&
            db.products.some(
              (p) => !p.deleted && p.stock > 0 && p.stock <= p.minStock,
            )
          )
            return c + 1;
          return c;
        }, 0),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.products, db.orders, db.invoices, db.sales],
  );

  const totalKasa = useMemo(
    () =>
      db.kasa
        .filter((k) => !k.deleted)
        .reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0),
    [db.kasa],
  );
  const nakit = useMemo(
    () =>
      db.kasa
        .filter((k) => !k.deleted && k.kasa === "nakit")
        .reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0),
    [db.kasa],
  );
  const activeGroup = TABS.find((t) => t.id === activeTab)?.group || "Sistem";
  const activeGroupClass =
    activeGroup === "Ana"
      ? "ana"
      : activeGroup === "Tedarik"
        ? "tedarik"
        : activeGroup === "Finans"
          ? "finans"
          : activeGroup === "Analiz"
            ? "analiz"
            : "sistem"; // FIXED: Aktif grup rengi className ile yonetilir

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const map: Record<string, TabId> = {
          "1": "dashboard",
          "2": "products",
          "3": "sales",
          "4": "kasa",
          "5": "reports",
        };
        if (map[e.key]) {
          e.preventDefault();
          navigate(map[e.key]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="app-mobile-overlay"
        />
      )}
      {/* SIDEBAR */}
      <Sidebar
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        navigate={navigate}
        priorityTabs={priorityTabs}
        toggleGroup={toggleGroup}
        expandedGroups={expandedGroups}
        toggleFavoriteTab={toggleFavoriteTab}
        favoriteTabs={favoriteTabs}
        badges={badges}
        totalKasa={totalKasa}
        nakit={nakit}
        isOnline={isOnline}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
      />

      {/* MAIN */}
      <div className={`app-main-shell ${isMobile ? "mobile" : "desktop"}`}>
        <Header
          isMobile={isMobile}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          activeGroupClass={activeGroupClass}
          navigate={navigate}
          db={db}
          favoriteTabs={favoriteTabs}
          badges={badges}
          syncStatus={syncStatus}
          lastSyncTime={lastSyncTime}
          exportJSON={exportJSON}
          username={username}
          onLogout={onLogout}
          guestTimeLeft={guestTimeLeft}
        />

        {/* CONTENT */}
        <main className={`app-main-content ${isMobile ? "mobile" : "desktop"}`}>
          <Suspense fallback={<PageFallback />}>
            <Switch>
                  <Route path="/dashboard">
                    <Dashboard
                      db={db}
                      save={save}
                      onTabChange={(tab) => navigate(tab as TabId)}
                    />
                  </Route>
                  <Route path="/dashboard-finans">
                    <DashboardFinans
                      db={db}
                      save={save}
                      onTabChange={(tab) => navigate(tab as TabId)}
                    />
                  </Route>
                  <Route path="/dashboard-ticaret">
                    <DashboardTicaret
                      db={db}
                      save={save}
                      onTabChange={(tab) => navigate(tab as TabId)}
                    />
                  </Route>
                  <Route path="/dashboard-operasyon">
                    <DashboardOperasyon
                      db={db}
                      save={save}
                      onTabChange={(tab) => navigate(tab as TabId)}
                    />
                  </Route>
                  <Route path="/dashboard-strateji">
                    <DashboardStrateji
                      db={db}
                      save={save}
                      onTabChange={(tab) => navigate(tab as TabId)}
                    />
                  </Route>
                  <Route path="/urunler/:id"><ProductDetail db={db} save={save} /></Route>
                  <Route path="/satis/:id"><SaleDetail db={db} /></Route>
                  <Route path="/cari/:id"><CariDetail db={db} /></Route>
                  <Route path="/products"><Products db={db} save={save} /></Route>
                  <Route path="/sales"><Sales db={db} save={save} /></Route>
                  <Route path="/fatura"><Fatura db={db} save={save} /></Route>
                  <Route path="/suppliers"><Suppliers db={db} save={save} /></Route>
                  <Route path="/pelet"><Pelet db={db} save={save} /></Route>
                  <Route path="/boruTed"><BoruTed db={db} save={save} /></Route>
                  <Route path="/ortak-emanet"><OrtakEmanet db={db} save={save} /></Route>
                  <Route path="/cari"><Cari db={db} save={save} /></Route>
                  <Route path="/kasa"><Kasa db={db} save={save} /></Route>
                  <Route path="/butce"><Butce db={db} save={save} /></Route>
                  <Route path="/bank"><Bank db={db} save={save} /></Route>
                  <Route path="/reports"><Reports db={db} /></Route>
                  <Route path="/stock"><Stock db={db} save={save} /></Route>
                  <Route path="/monitor"><Monitor db={db} save={save} /></Route>
                  <Route path="/kontrol"><KontrolHalkasi db={db} /></Route>
                  <Route path="/entegrasyon"><Entegrasyonlar db={db} /></Route>
                  <Route path="/excelmerge"><ExcelMerge /></Route>
                  <Route path="/notlar"><Notlar db={db} save={save} /></Route>
                  <Route path="/cizelge"><Cizelge db={db} /></Route>
                  <Route path="/partners"><Partners db={db} save={save} /></Route>
                  <Route path="/settings">
                    <Settings
                      db={db}
                      save={save}
                      exportJSON={exportJSON}
                      importJSON={importJSON}
                    />
                  </Route>
                  <Route path="/bughunter"><BugHunter /></Route>
                  <Route path="/anomali"><AnomaliOneri db={db} save={save} /></Route>
                  <Route path="/excelimport"><ExcelImport db={db} save={save} /></Route>
                  <Route path="/ai/eylem-log"><AIEylemLog db={db} undo={undo} /></Route>
                  <Route path="/not-found"><NotFound /></Route>
                  <Route path="/perf"><Perf /></Route>
                  <Route path="/spec"><SpecDashboard /></Route>
                  <Route>
                    <Dashboard
                      db={db}
                      save={save}
                      onTabChange={(tab) => navigate(tab as TabId)}
                    />
                  </Route>
                </Switch>
              </Suspense>
        </main>
      </div>

      {/* FAB */}
      <FAB
        db={db}
        save={save}
        onOpenAI={() => setAiDrawerOpen(true)}
        uiPrefs={uiPrefs}
      />

      {/* Hata Bildirme Butonu */}
      <ReportButton visible={uiPrefs.showReportButton} />

      {/* AI Drawer */}
      <AIDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        db={db}
        save={save}
      />


    </div>
  );
}

export default function App() {
  const { authed, login, logout, currentUser, guestTimeLeft } = useAuth();
  const [setupDone, setSetupDone] = useState(isSetupDone);

  if (!authed) {
    return (
      <LoginScreen
        onLogin={(user, remember) => {
          login(user, remember);
          if (!isSetupDone()) {
            localStorage.setItem("sobaYonetim_setupDone", "1");
            setSetupDone(true);
          }
        }}
      />
    );
  }

  if (!setupDone) {
    return (
      <SetupWizard
        onComplete={() => {
          setSetupDone(true);
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <ConfirmProvider>
        <Router>
          <AppContent onLogout={logout} username={currentUser?.username} guestTimeLeft={guestTimeLeft} />
        </Router>
        <Toaster
          richColors
          position="bottom-right"
          gap={10}
          visibleToasts={5}
          expand
          toastOptions={{
            duration: 4000,
            className: "soba-toast",
            classNames: {
              toast:
                "soba-toast group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
              title: "soba-toast-title",
              description: "soba-toast-desc group-[.toast]:text-muted-foreground",
              actionButton:
                "soba-toast-action group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-semibold",
              cancelButton:
                "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
              icon: "soba-toast-icon",
            },
          }}
        />
      </ConfirmProvider>
    </ErrorBoundary>
  );
}



