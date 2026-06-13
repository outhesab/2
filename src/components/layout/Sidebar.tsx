import { type LucideIcon } from "lucide-react";
import { BRAND_NAME, BRAND_SUBTITLE, getBrandVersion } from "@/config/brand";
import { TABS, type TabGroup, type TabId } from "@/config/tabs";
import { formatMoney } from "@/lib/utils-tr";
import { ParspelLogo } from '@/components/logo/ParspelLogo';

interface SidebarProps {
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  activeTab: TabId;
  navigate: (tab: TabId) => void;
  priorityTabs: Array<{ id: TabId; label: string; icon: LucideIcon; group: TabGroup }>;
  toggleGroup: (group: TabGroup) => void;
  expandedGroups: Record<TabGroup, boolean>;
  toggleFavoriteTab: (tabId: TabId) => void;
  favoriteTabs: TabId[];
  badges: Record<string, number>;
  totalKasa: number;
  nakit: number;
  isOnline: boolean;
  syncStatus: string;
  lastSyncTime: string;
}

const GROUPS: TabGroup[] = ['Ana', 'Tedarik', 'Finans', 'Analiz', 'Sistem'];

const GROUP_CLASS_MAP: Record<TabGroup, string> = {
  Ana: 'ana',
  Tedarik: 'tedarik',
  Finans: 'finans',
  Analiz: 'analiz',
  Sistem: 'sistem',
};

function groupClass(group: TabGroup): string {
  return GROUP_CLASS_MAP[group] || 'sistem';
}

export default function Sidebar({
  isMobile,
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  navigate,
  priorityTabs,
  toggleGroup,
  expandedGroups,
  toggleFavoriteTab,
  favoriteTabs,
  badges,
  totalKasa,
  nakit,
  isOnline,
  syncStatus,
  lastSyncTime,
}: SidebarProps) {
  return (
    <aside className={`app-sidebar ${isMobile && !sidebarOpen ? 'mobile-closed' : 'mobile-open'}`}>
      <div className="app-sidebar-logo-wrap">
        <div className="app-sidebar-logo-row">
          <ParspelLogo className="size-9" />
          <div className="leading-tight">
            <p className="font-heading text-sm font-bold text-sidebar-foreground">{BRAND_NAME}</p>
            <p className="text-[11px] text-muted-foreground">Yönetim Paneli</p>
          </div>
          {isMobile && <button onClick={() => setSidebarOpen(false)} className="app-sidebar-close-btn">✕</button>}
        </div>
      </div>

      <nav className="app-sidebar-nav">
        <div role="region" aria-label="Hızlı erişim" className="app-quick-region">
          <div className="app-quick-region-head">
            <div className="app-quick-region-title">Hızlı Erişim</div>
            <div className="app-quick-region-subtitle">Favori modüller</div>
          </div>
          <div className="app-quick-grid">
            {priorityTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const gClass = groupClass(tab.group);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.id)}
                  aria-label={`${tab.label} hızlı erişim`}
                  className={`app-priority-tab ${gClass} ${isActive ? 'active' : 'inactive'}`}
                >
                  <span className={`app-priority-tab-icon ${isActive ? 'active' : 'inactive'}`}><Icon className="size-4" /></span>
                  <span className="app-priority-tab-label">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {GROUPS.map((group) => {
          const gClass = groupClass(group);
          const groupTabs = TABS.filter((t) => t.group === group);
          const isExpanded = expandedGroups[group] ?? false;
          return (
            <div key={group} className="app-nav-group">
              <button
                onClick={() => toggleGroup(group)}
                className={`app-nav-group-toggle ${gClass}`}
                aria-expanded={isExpanded}
                aria-label={`${group} grubunu ${isExpanded ? 'daralt' : 'genislet'}`}
              >
                <span className={`app-nav-group-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
                <span className="app-nav-group-name">{group}</span>
                <div className={`app-nav-group-line ${gClass}`} />
                <span className="app-nav-group-count">{groupTabs.length}</span>
              </button>
              {isExpanded && groupTabs.map((tab) => {
                const badge = badges[tab.id];
                const isActive = activeTab === tab.id;
                const isFavorite = favoriteTabs.includes(tab.id);
                const tClass = groupClass(tab.group);
                const Icon = tab.icon;
                return (
                  <div key={tab.id} className="app-nav-tab-row">
                    <button
                      onClick={() => navigate(tab.id)}
                      className={`app-nav-tab-btn ${tClass} ${isActive ? 'active' : 'inactive'}`}
                    >
                      <span className={`app-nav-tab-icon ${isActive ? 'active' : 'inactive'}`}><Icon className="size-4" /></span>
                      <span className="app-nav-tab-label">{tab.label}</span>
                      {badge ? <span className={`app-nav-badge ${tab.id === 'products' || tab.id === 'monitor' ? 'danger' : 'warn'}`}>{badge > 99 ? '99+' : badge}</span> : null}
                      {isActive && <span className={`app-nav-tab-active-line ${tClass}`} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavoriteTab(tab.id)}
                      aria-label={`${tab.label} favorilere ${isFavorite ? 'ekli, kaldır' : 'ekle'}`}
                      title={isFavorite ? 'Favorilerden kaldır' : 'Favorilere ekle'}
                      className={`app-favorite-btn ${isFavorite ? 'active' : 'inactive'}`}
                    >
                      {isFavorite ? '★' : '☆'}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div onClick={() => navigate('kasa')} className="app-kasa-widget">
        <div className="app-kasa-widget-head">
          <span aria-hidden="true">₺</span>
          <span>Toplam Kasa</span>
          <span className="app-kasa-widget-dot" />
        </div>
        <div className={`app-kasa-widget-total ${totalKasa >= 0 ? 'positive' : 'negative'}`}>
          {formatMoney(totalKasa)}
        </div>
        <div className="app-kasa-widget-split">
          <div className="app-kasa-widget-col">
            <div className="app-kasa-widget-col-label">Nakit</div>
            <div className="app-kasa-widget-col-value">{formatMoney(nakit)}</div>
          </div>
          <div className="app-kasa-widget-divider" />
          <div className="app-kasa-widget-col">
            <div className="app-kasa-widget-col-label">Banka</div>
            <div className="app-kasa-widget-col-value">{formatMoney(totalKasa - nakit)}</div>
          </div>
        </div>
      </div>

      <div className="app-user-section">
        <div className="app-user-avatar">
          <span>PP</span>
          <span className={`app-user-status ${isOnline ? 'online' : 'offline'}`} />
        </div>
        <div className="app-user-info">
          <div className="app-user-name">Pars Pel</div>
          <div className="app-user-role">Yönetici</div>
        </div>
        <span className="app-user-chevron">›</span>
      </div>

      <div className="app-status-wrap">
        <div className="app-status-row">
          <span className={`app-status-dot ${isOnline ? 'online' : 'offline'}`} />
          <span className={`app-status-text ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
          </span>
          <span className={`app-sync-mini ${syncStatus}`} title={lastSyncTime}>
            {syncStatus === 'saving' ? '⟳ Senkronize…' : syncStatus === 'saved' ? `✓ ${lastSyncTime}` : syncStatus === 'error' ? '✗ Hata' : syncStatus === 'loading' ? '↓ Yüklüyor' : ''}
          </span>
        </div>
        <div className="app-status-foot">PARSPEL · Firebase & localStorage · Güvenli</div>
      </div>
    </aside>
  );
}
