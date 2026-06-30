import { logger } from '@/lib/logger';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoginScreen, { useAuth } from '@/components/LoginScreen';
import { useBeforeUnloadGuard, useStorageSync, useSyncStatusListener, useKeyboardShortcuts } from '@/hooks/app/shellLifecycle';
import { useAppBootstrap } from '@/hooks/app/useAppBootstrap';
import { useDB, type SyncStatus } from '@/hooks/useDB';
import { applyUIPrefs, loadUIPrefs, loadUIPrefsFromFirebase, saveUIPrefs } from '@/hooks/useUIPrefs';
import { loadConnConfigFromFirebase, saveConnConfig } from '@/lib/connConfig';
import { useCallback, useMemo, useState } from 'react';
import { Router, useLocation } from 'wouter';
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
import { AppRoutes } from '@/components/AppRoutes';
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

  // PR-D1: 9 useEffect bloğu tek useAppBootstrap hook'unda toplandı
  const { isOnline } = useAppBootstrap({
    db,
    save,
    isDBReady,
    dbError,
    clearError,
    setIsMobile,
    exportJSON,
    activeTab,
    setExpandedGroups,
  });

  // Shell lifecycle hook'ları (D1a + D1b)
  useBeforeUnloadGuard();
  useStorageSync(setUiPrefs);
  useSyncStatusListener(setSyncStatus, setLastSyncTime);

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
          <AppRoutes db={db} save={save} navigate={navigate} exportJSON={exportJSON} importJSON={importJSON} undo={undo} />
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
