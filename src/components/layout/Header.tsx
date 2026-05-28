import { type Dispatch, type SetStateAction } from 'react';
import { TABS, type TabId } from '@/config/tabs';
import type { DB } from '@/types';
import GlobalSearch from './GlobalSearch';
import UserMenu from './UserMenu';
import NotificationCenter from '@/components/NotificationCenter';

interface HeaderProps {
  isMobile: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  activeTab: TabId;
  activeGroupClass: string;
  navigate: (tab: TabId) => void;
  db: DB;
  favoriteTabs: readonly TabId[];
  badges: Record<string, number>;
  syncStatus: string;
  lastSyncTime: string;
  exportJSON: () => void;
  username?: string;
  onLogout: () => void;
  guestTimeLeft: number;
}

export default function Header({
  isMobile,
  setSidebarOpen,
  activeTab,
  activeGroupClass,
  navigate,
  db,
  favoriteTabs,
  badges,
  syncStatus,
  lastSyncTime,
  exportJSON,
  username,
  onLogout,
  guestTimeLeft,
}: HeaderProps) {
  return (
    <header className={`app-header ${isMobile ? 'mobile' : 'desktop'}`}>
      {isMobile && <button onClick={() => setSidebarOpen((o) => !o)} className="app-header-menu-btn">☰</button>}
      <div className={`app-header-title-wrap ${isMobile ? 'mobile' : 'desktop'}`}>
        <h1 className={`app-header-title ${isMobile ? 'mobile' : 'desktop'}`}>
          <span className={`app-header-title-icon ${activeGroupClass}`}>
            {TABS.find((t) => t.id === activeTab)?.icon}
          </span>
          {TABS.find((t) => t.id === activeTab)?.label}
        </h1>
      </div>
      {!isMobile && <GlobalSearch onNavigate={navigate} db={db} favoriteTabs={favoriteTabs} />}
      <div className={`app-header-actions ${isMobile ? 'mobile' : 'desktop'}`}>
        {!isMobile && (
          <div className="app-shortcuts-row">
            {[
              { k: '⌘1', t: 'dashboard' as TabId, label: 'Özet' },
              { k: '⌘2', t: 'products' as TabId, label: 'Ürün' },
              { k: '⌘3', t: 'sales' as TabId, label: 'Satış' },
              { k: '⌘4', t: 'kasa' as TabId, label: 'Kasa' },
            ].map((s) => (
              <button
                key={s.k}
                onClick={() => navigate(s.t)}
                title={`${s.label} (Ctrl+${s.k.replace('⌘', '')})`}
                className={`app-shortcut-btn ${activeTab === s.t ? 'active' : 'inactive'}`}
              >
                {s.k}
              </button>
            ))}
          </div>
        )}
        <NotificationCenter db={db} onNavigate={(tab) => navigate(tab as Parameters<typeof navigate>[0])} />
        {badges.monitor > 0 && (
          <button onClick={() => navigate('monitor')} className="app-alert-btn">🔔 {badges.monitor}</button>
        )}
        {!isMobile && badges.products > 0 && (
          <button onClick={() => navigate('products')} className="app-products-alert-btn">📦 {badges.products}</button>
        )}
        {!isMobile && (
          <div className={`app-sync-badge ${syncStatus}`}>
            <span className={`app-sync-dot ${syncStatus}`} />
            <span className={`app-sync-text ${syncStatus}`}>
              {syncStatus === 'saving' ? 'Kaydediliyor' : syncStatus === 'saved' ? `Senkron ${lastSyncTime}` : syncStatus === 'error' ? 'Sync Hatası' : syncStatus === 'loading' ? 'Yükleniyor' : 'Firebase'}
            </span>
          </div>
        )}
        <button onClick={exportJSON} title="Hızlı Yedek Al" className="app-backup-btn">
          {isMobile ? '💾' : '💾 Yedek'}
        </button>
        {!isMobile && (
          <div className="app-header-date">
            {new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        )}
        <UserMenu username={username} onLogout={onLogout} isMobile={isMobile} guestTimeLeft={guestTimeLeft} />
      </div>
    </header>
  );
}
