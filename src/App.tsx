import { logger } from '@/lib/logger';
import { BRAND_NAME } from '@/config/brand';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoginScreen, { useAuth } from '@/components/LoginScreen';
import { getAllAgents } from '@/agents';
import { useBeforeUnloadGuard, useStorageSync, useSyncStatusListener, useKeyboardShortcuts } from '@/hooks/app/shellLifecycle';
import type { AgentContext } from '@/agents/types';
import { useToast } from '@/components/Toast';
import { useDB, type SyncStatus } from '@/hooks/useDB';
import { setupDomainListeners } from '@/domain';
import { applyUIPrefs, loadUIPrefs, loadUIPrefsFromFirebase, saveUIPrefs } from '@/hooks/useUIPrefs';
import { loadConnConfigFromFirebase, saveConnConfig } from '@/lib/connConfig';
import { getAppVersion, getVersionTitle } from '@/lib/version';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Router, Switch, Route, useLocation } from 'wouter';
import {
  TABS,
  type TabId,
  type TabGroup,
  TAB_PATHS,
  getActiveTabFromLocation,
  loadFavoriteTabs,
  saveFavoriteTabs,
} from '@/config/tabs';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ReportButton from '@/components/layout/ReportButton';
import { SobaNexus } from '@/components/nexus/SobaNexus';
import PageFallback from '@/components/layout/PageFallback';

const AIEylemLog = lazy(() => import('@/pages/AIEylemLog'));
const AnomaliOneri = lazy(() => import('@/pages/AnomaliOneri'));
const Bank = lazy(() => import('@/pages/Bank'));
const BoruTed = lazy(() => import('@/pages/BoruTed'));
const BugHunter = lazy(() => import('@/pages/BugHunter'));
const Butce = lazy(() => import('@/pages/Butce'));
const Cari = lazy(() => import('@/pages/Cari'));

const Cizelge = lazy(() => import('@/pages/Cizelge'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const DashboardFinans = lazy(() => import('@/pages/DashboardFinans'));
const DashboardTicaret = lazy(() => import('@/pages/DashboardTicaret'));
const DashboardOperasyon = lazy(() => import('@/pages/DashboardOperasyon'));
const DashboardStrateji = lazy(() => import('@/pages/DashboardStrateji'));
const Entegrasyonlar = lazy(() => import('@/pages/Entegrasyonlar'));
const ExcelImport = lazy(() => import('@/pages/ExcelImport'));
const ExcelMerge = lazy(() => import('@/pages/ExcelMerge'));
const Fatura = lazy(() => import('@/pages/Fatura'));
const Kasa = lazy(() => import('@/pages/Kasa'));
const KontrolHalkasi = lazy(() => import('@/pages/KontrolHalkasi'));
const Monitor = lazy(() => import('@/pages/Monitor'));
const NotFound = lazy(() => import('@/pages/not-found'));
const Notlar = lazy(() => import('@/pages/Notlar'));
const OrtakEmanet = lazy(() => import('@/pages/OrtakEmanet'));
const Partners = lazy(() => import('@/pages/Partners'));
const Pelet = lazy(() => import('@/pages/Pelet'));
const Receivables = lazy(() => import('@/pages/Receivables'));
const Products = lazy(() => import('@/pages/Products'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Reports = lazy(() => import('@/pages/Reports'));
const Sales = lazy(() => import('@/pages/Sales'));
const SaleDetail = lazy(() => import('@/pages/SaleDetail'));
const Settings = lazy(() => import('@/pages/Settings'));
const NexusSalesAdmin = lazy(() => import('@/pages/NexusSalesAdmin'));
const Perf = lazy(() => import('@/pages/Perf'));
const SpecDashboard = lazy(() => import('@/pages/SpecDashboard'));
const Stock = lazy(() => import('@/pages/Stock'));
const Suppliers = lazy(() => import('@/pages/Suppliers'));
import { Toaster } from 'sonner';

// UI tercihlerini uygulama başlangıcında localStorage'dan hızlıca yükle
applyUIPrefs(loadUIPrefs());

// Arka planda Firebase'den güncel prefs'leri çek ve uygula
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
  .catch(() => logger.error('sync', 'Firebase config/UI prefs yüklenemedi'));

function AppContent({
  onLogout,
  username,
  guestTimeLeft,
}: {
  onLogout: () => void;
  username?: string;
  guestTimeLeft: number;
}) {
  const { db, save, exportJSON, importJSON, undo, isDBReady, dbError, clearError } = useDB();
  const { showToast } = useToast();

  const [location, setLocation] = useLocation();
  const activeTab = getActiveTabFromLocation(location);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favoriteTabs, setFavoriteTabs] = useState<TabId[]>(loadFavoriteTabs);
  const [expandedGroups, setExpandedGroups] = useState<Record<TabGroup, boolean>>({
    Ana: true,
    Tedarik: false,
    Finans: true,
    Analiz: false,
    Sistem: false,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [uiPrefs, setUiPrefs] = useState(loadUIPrefs);
  const isOnline = useOnlineStatus();
  const prevOnline = useRef(isOnline);

  // Global DB hata izleme
  useEffect(() => {
    if (!isDBReady) return;
    if (dbError) {
      showToast(dbError.message, 'error');
      clearError();
    }
  }, [isDBReady, dbError, showToast, clearError]);

  // Logger üzerinden kritik hataları Toast'a yönlendir
  useEffect(() => {
    if (!isDBReady) return;
    return logger.subscribe((entry) => {
      if (entry.level === 'critical' || (entry.level === 'error' && entry.cat === 'db')) {
        showToast(`Sistem Hatası [${entry.cat}]: ${entry.msg}`, 'error');
      }
    });
  }, [isDBReady, showToast]);

  useEffect(() => {
    if (!isDBReady) return;
    const ctx: AgentContext = { getDB: () => db, save };
    getAllAgents().forEach((agent) => agent.bagla(ctx));
  }, [isDBReady, db, save]);

  // Domain Event Bus listener'larını kur
  useEffect(() => {
    if (!isDBReady) return;
    const cleanup = setupDomainListeners({
      save,
      showToast: (msg, type) => showToast(msg, type),
    });
    return cleanup;
  }, [isDBReady, save, showToast]);

  // Tarayıcı sekmesinin yanlışlıkla kapatılmasını önle (Veri kaybını ve takibi korumak için)
  useBeforeUnloadGuard();

  // UIPrefs değişikliklerini dinle (Settings'ten güncelleme gelince yansısın)
  useStorageSync(setUiPrefs);

  // Sync durum izleme
  useSyncStatusListener(setSyncStatus, setLastSyncTime);

  // Son güncelleme toast'u — her versiyon için bir kez göster
  useEffect(() => {
    const appVersion = getAppVersion();
    const seenVersion = localStorage.getItem('lastSeenVersion');
    try {
      if (seenVersion !== appVersion) {
        setTimeout(() => {
          showToast(`${BRAND_NAME} v${appVersion} — ${getVersionTitle()}`, 'info', {
            duration: 7000,
          });
          localStorage.setItem('lastSeenVersion', appVersion);
        }, 1500);
      }
    } catch {
      logger.warn('app', 'localStorage okuma/yazma hatası');
    }
  }, [showToast]);

  useEffect(() => {
    if (prevOnline.current !== isOnline) {
      if (isOnline) {
        showToast('İnternet bağlantısı yeniden kuruldu', 'success');
      } else {
        showToast('Çevrimdışı çalışıyorsunuz — veriler korunuyor', 'info');
      }
      prevOnline.current = isOnline;
    }
  }, [isOnline, showToast]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navigate = useCallback(
    (tab: TabId) => {
      setLocation(TAB_PATHS[tab]);
      setSidebarOpen(false);
    },
    [setLocation],
  );

  const toggleGroup = useCallback((group: TabGroup) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);

  const toggleFavoriteTab = useCallback((tabId: TabId) => {
    setFavoriteTabs((prev) => {
      const next = prev.includes(tabId)
        ? prev.filter((currentTabId) => currentTabId !== tabId)
        : [tabId, ...prev.filter((currentTabId) => currentTabId !== tabId)].slice(0, 6);
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
    setExpandedGroups((prev) => (prev[activeGroup] ? prev : { ...prev, [activeGroup]: true }));
  }, [activeTab]);

  // Yedek event listener (Dashboard widget'ından tetiklenir)
  useEffect(() => {
    const handler = () => {
      exportJSON();
      localStorage.setItem('sobaYonetim_lastBackup', new Date().toISOString());
    };
    window.addEventListener('soba:exportJSON', handler);
    return () => window.removeEventListener('soba:exportJSON', handler);
  }, [exportJSON]);

  const badges = useMemo(
    () => ({
      products:
        db.products.filter((p) => !p.deleted && p.stock === 0).length +
        db.products.filter((p) => !p.deleted && p.stock > 0 && p.stock <= p.minStock).length,
      sales: db.sales.filter(
        (s) => s.status === 'tamamlandi' && new Date(s.createdAt).toDateString() === new Date().toDateString(),
      ).length,
      suppliers: db.orders.filter((o) => o.status === 'bekliyor').length,
      bank: db.bankTransactions.filter((t) => t.status === 'unmatched').length,
      monitor: db.monitorRules
        .filter((r) => r.active)
        .reduce((c, r) => {
          if (r.type === 'stok_sifir' && db.products.some((p) => !p.deleted && p.stock === 0)) return c + 1;
          if (r.type === 'stok_min' && db.products.some((p) => !p.deleted && p.stock > 0 && p.stock <= p.minStock))
            return c + 1;
          return c;
        }, 0),
    }),
    [db.products, db.orders, db.sales, db.bankTransactions, db.monitorRules],
  );

  const totalKasa = useMemo(
    () => db.kasa.filter((k) => !k.deleted).reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0),
    [db.kasa],
  );
  const nakit = useMemo(
    () =>
      db.kasa
        .filter((k) => !k.deleted && k.kasa === 'nakit')
        .reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0),
    [db.kasa],
  );

  const activeGroup = TABS.find((t) => t.id === activeTab)?.group || 'Sistem';
  const activeGroupClass =
    activeGroup === 'Ana'
      ? 'ana'
      : activeGroup === 'Tedarik'
        ? 'tedarik'
        : activeGroup === 'Finans'
          ? 'finans'
          : activeGroup === 'Analiz'
            ? 'analiz'
            : 'sistem'; // FIXED: Aktif grup rengi className ile yonetilir

  // Keyboard shortcuts
  useKeyboardShortcuts(navigate);

  if (!isDBReady) {
    return <PageFallback />;
  }

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="app-mobile-overlay" />}
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
      <div className={`app-main-shell ${isMobile ? 'mobile' : 'desktop'}`}>
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
        <main className={`app-main-content ${isMobile ? 'mobile' : 'desktop'}`}>
          <Suspense fallback={<PageFallback />}>
            <Switch>
              <Route path="/dashboard">
                <Dashboard db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
              </Route>
              <Route path="/dashboard-finans">
                <DashboardFinans db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
              </Route>
              <Route path="/dashboard-ticaret">
                <DashboardTicaret db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
              </Route>
              <Route path="/dashboard-operasyon">
                <DashboardOperasyon db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
              </Route>
              <Route path="/dashboard-strateji">
                <DashboardStrateji db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
              </Route>
              <Route path="/urunler/:id">
                <ProductDetail db={db} save={save} />
              </Route>
              <Route path="/satis/:id">
                <SaleDetail db={db} />
              </Route>
              <Route path="/cari/:id">
                <Cari db={db} save={save} />
              </Route>
              <Route path="/products">
                <Products db={db} save={save} />
              </Route>
              <Route path="/sales">
                <Sales db={db} save={save} />
              </Route>
              <Route path="/fatura">
                <Fatura db={db} save={save} />
              </Route>
              <Route path="/suppliers">
                <Suppliers db={db} save={save} />
              </Route>
              <Route path="/pelet">
                <Pelet db={db} save={save} />
              </Route>
              <Route path="/boruTed">
                <BoruTed db={db} save={save} />
              </Route>
              <Route path="/ortak-emanet">
                <OrtakEmanet db={db} save={save} />
              </Route>
              <Route path="/receivables">
                <Receivables />
              </Route>
              <Route path="/cari">
                <Cari db={db} save={save} />
              </Route>
              <Route path="/kasa">
                <Kasa db={db} save={save} />
              </Route>
              <Route path="/butce">
                <Butce db={db} save={save} />
              </Route>
              <Route path="/bank">
                <Bank db={db} save={save} />
              </Route>
              <Route path="/reports">
                <Reports db={db} />
              </Route>
              <Route path="/stock">
                <Stock db={db} save={save} />
              </Route>
              <Route path="/monitor">
                <Monitor db={db} save={save} />
              </Route>
              <Route path="/kontrol">
                <KontrolHalkasi db={db} />
              </Route>
              <Route path="/entegrasyon">
                <Entegrasyonlar db={db} />
              </Route>
              <Route path="/excelmerge">
                <ExcelMerge />
              </Route>
              <Route path="/notlar">
                <Notlar db={db} save={save} />
              </Route>
              <Route path="/cizelge">
                <Cizelge db={db} />
              </Route>
              <Route path="/partners">
                <Partners db={db} save={save} />
              </Route>
              <Route path="/settings">
                <Settings db={db} save={save} exportJSON={exportJSON} importJSON={importJSON} />
              </Route>
              <Route path="/nexus-admin">
                <NexusSalesAdmin db={db} save={save} />
              </Route>
              <Route path="/bughunter">
                <BugHunter />
              </Route>
              <Route path="/anomali">
                <AnomaliOneri db={db} save={save} />
              </Route>
              <Route path="/excelimport">
                <ExcelImport db={db} save={save} />
              </Route>
              <Route path="/ai/eylem-log">
                <AIEylemLog db={db} undo={undo} />
              </Route>
              <Route path="/not-found">
                <NotFound />
              </Route>
              <Route path="/perf">
                <Perf />
              </Route>
              <Route path="/spec">
                <SpecDashboard />
              </Route>
              <Route>
                <Dashboard db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
              </Route>
            </Switch>
          </Suspense>
        </main>
      </div>

      {/* Hata Bildirme Butonu */}
      <ReportButton visible={uiPrefs.showReportButton} />

      {/* QuantumLink */}
      <SobaNexus />
    </div>
  );
}

export default function App() {
  const { authed, login, logout, currentUser, guestTimeLeft } = useAuth();

  if (!authed) {
    return (
      <LoginScreen
        onLogin={(user, remember) => {
          login(user, remember);
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
            className: 'soba-toast',
            classNames: {
              toast:
                'soba-toast group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
              title: 'soba-toast-title',
              description: 'soba-toast-desc group-[.toast]:text-muted-foreground',
              actionButton:
                'soba-toast-action group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:px-3 group [.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-semibold',
              cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
              icon: 'soba-toast-icon',
            },
          }}
        />
      </ConfirmProvider>
    </ErrorBoundary>
  );
}
