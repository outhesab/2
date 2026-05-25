import { logger } from "@/lib/logger";
import { QuickSaleModal } from "@/components/QuickSaleModal";
import { QuickIncomeModal } from "@/components/QuickIncomeModal";
import { QuickProductModal } from "@/components/QuickProductModal";
import { InfoRow } from "@/components/InfoRow";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useDraggableButton } from "@/hooks/useDraggableButton";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoginScreen, { useAuth } from "@/components/LoginScreen";
import { Modal } from "@/components/Modal";
import NotificationCenter from "@/components/NotificationCenter";
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
import { formatMoney, genId } from "@/lib/utils-tr";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Router, Switch, Route, useLocation } from "wouter";

const AIAsistan = lazy(() => import("@/pages/AIAsistan"));
const AnomaliOneri = lazy(() => import("@/pages/AnomaliOneri"));
const Bank = lazy(() => import("@/pages/Bank"));
const BoruTed = lazy(() => import("@/pages/BoruTed"));
const BugHunter = lazy(() => import("@/pages/BugHunter"));
const Butce = lazy(() => import("@/pages/Butce"));
const Cari = lazy(() => import("@/pages/Cari"));
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
const Partners = lazy(() => import("@/pages/Partners"));
const Pelet = lazy(() => import("@/pages/Pelet"));
const Products = lazy(() => import("@/pages/Products"));
const Reports = lazy(() => import("@/pages/Reports"));
const Sales = lazy(() => import("@/pages/Sales"));
const Settings = lazy(() => import("@/pages/Settings"));
const Stock = lazy(() => import("@/pages/Stock"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
import { Toaster } from "sonner";

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

const TABS = [
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
] as const;

type TabId = (typeof TABS)[number]["id"];
type TabGroup = (typeof TABS)[number]["group"];

const PRIORITY_TABS: readonly TabId[] = [
  "dashboard",
  "sales",
  "products",
  "kasa",
  "cari",
];
const DEFAULT_EXPANDED_GROUPS: readonly TabGroup[] = ["Ana", "Finans"];
const FAVORITE_TABS_KEY = "sobaYonetim_favoriteTabs";

function loadFavoriteTabs(): TabId[] {
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

function saveFavoriteTabs(tabIds: readonly TabId[]) {
  try {
    localStorage.setItem(FAVORITE_TABS_KEY, JSON.stringify(tabIds.slice(0, 6)));
  } catch {
    // ignore localStorage failures
  }
}

function GlobalSearch({
  onNavigate,
  db,
  favoriteTabs,
}: {
  onNavigate: (tab: TabId) => void;
  db: ReturnType<typeof useDB>["db"];
  favoriteTabs: readonly TabId[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const res: { tab: TabId; label: string; icon: string; match: string }[] =
      [];
    const favoriteSet = new Set(favoriteTabs);
    TABS.forEach((t) => {
      if (t.label.toLowerCase().includes(q))
        res.push({
          tab: t.id,
          label: t.label,
          icon: t.icon,
          match: favoriteSet.has(t.id) ? "Favori modül" : "Modül",
        });
    });
    db.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q),
      )
      .slice(0, 3)
      .forEach((p) =>
        res.push({
          tab: "products",
          label: p.name,
          icon: "📦",
          match: `Stok: ${p.stock} · ₺${p.price}`,
        }),
      );
    db.cari
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((c) =>
        res.push({
          tab: "cari",
          label: c.name,
          icon: "👤",
          match: c.type === "musteri" ? "Müşteri" : "Tedarikçi",
        }),
      );
    db.suppliers
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((s) =>
        res.push({
          tab: "suppliers",
          label: s.name,
          icon: "🏭",
          match: "Tedarikçi",
        }),
      );
    return res
      .sort(
        (left, right) =>
          Number(favoriteSet.has(right.tab)) -
          Number(favoriteSet.has(left.tab)),
      )
      .slice(0, 8);
  }, [query, db, favoriteTabs]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="global-search-wrap">
      <div className="global-search-inner">
        <span className="global-search-icon">🔍</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ürün, müşteri, modül ara..."
          className="global-search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="global-search-clear"
          >
            ×
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="global-search-results">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                onNavigate(r.tab);
                setQuery("");
                setOpen(false);
              }}
              className="global-search-item"
            >
              <span className="global-search-item-icon">{r.icon}</span>
              <div className="global-search-item-main">
                <div className="global-search-item-label">{r.label}</div>
                <div className="global-search-item-match">{r.match}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({
  username,
  onLogout,
  isMobile,
  guestTimeLeft = 0,
}: {
  username?: string;
  onLogout: () => void;
  isMobile: boolean;
  guestTimeLeft?: number;
}) {
  const [open, setOpen] = useState(false);

  const formatGuestTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const exitApp = async () => {
    try {
      const { App: CapApp } = await import("@capacitor/app");
      await CapApp.exitApp();
    } catch {
      window.close();
    }
  };

  return (
    <div className="user-menu-root">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`user-menu-toggle ${isMobile ? "mobile" : ""}`}
      >
        {guestTimeLeft > 0 && <span className="guest-badge">M</span>}
        👤 {!isMobile && (username || "Kullanıcı")}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="user-menu-backdrop" />
          <div className="user-menu-panel">
            <div className="user-menu-head">
              <div className="user-menu-name">👤 {username || "Kullanıcı"}</div>
              {guestTimeLeft > 0 ? (
                <div className="user-menu-status guest">
                  ⏳ Misafir — {formatGuestTime(guestTimeLeft)}
                </div>
              ) : (
                <div className="user-menu-status">Oturum açık</div>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="user-menu-action logout"
            >
              🚪 Oturumu Kapat
            </button>
            <button
              onClick={() => {
                setOpen(false);
                exitApp();
              }}
              className="user-menu-action close"
            >
              ✕ Uygulamayı Kapat
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Hareketli Buton Hook'u ──────────────────────────────────────────────────
// ── Hata Bildirme Butonu ────────────────────────────────────────────────────
function ReportButton({ visible }: { visible: boolean }) {
  const { pos, onPointerDown, onPointerMove, onPointerUp, isDragging } =
    useDraggableButton("reportBtnPos", { x: 90, y: 28 });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "hata", note: "", contact: "" });
  const [sent, setSent] = useState(false);
  const [pulse, setPulse] = useState(0);
  const reportBtnRef = useRef<HTMLButtonElement>(null);
  const reportPanelRef = useRef<HTMLDivElement>(null);

  // Animasyonlu ikon
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => (p + 1) % 3), 1200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (reportBtnRef.current) {
      reportBtnRef.current.style.bottom = `${pos.y}px`;
      reportBtnRef.current.style.left = `${pos.x}px`;
    }
    if (reportPanelRef.current) {
      reportPanelRef.current.style.bottom = `${pos.y + 56}px`;
      reportPanelRef.current.style.left = `${Math.min(pos.x, window.innerWidth - 320)}px`;
    }
  }, [pos, open, visible]); // FIXED: Dinamik konum JSX style prop yerine ref ile uygulanir

  if (!visible) return null;

  const icons = ["🐛", "⚠️", "💡"];
  const icon = icons[pulse];

  const handleSend = () => {
    if (!form.note.trim()) return;
    // localStorage'a kaydet
    const reports = JSON.parse(localStorage.getItem("sobaReports") || "[]");
    reports.push({
      ...form,
      time: new Date().toISOString(),
      url: window.location.href,
    });
    localStorage.setItem("sobaReports", JSON.stringify(reports.slice(-50)));
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setOpen(false);
      setForm({ type: "hata", note: "", contact: "" });
    }, 2000);
  };

  return (
    <>
      <button
        ref={reportBtnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => {
          if (!isDragging.current) setOpen((o) => !o);
        }}
        title="Hata Bildir / Not Al"
        className="report-btn" // FIXED: Inline stil className'a tasindi
      >
        {icon}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="report-overlay" />
          <div ref={reportPanelRef} className="report-panel">
            <div className="report-title">📋 Bildir / Not Al</div>
            {sent ? (
              <div className="report-sent">✅ Kaydedildi!</div>
            ) : (
              <>
                <div className="report-type-row">
                  {[
                    { v: "hata", l: "🐛 Hata" },
                    { v: "oneri", l: "💡 Öneri" },
                    { v: "not", l: "📝 Not" },
                    { v: "takip", l: "👁️ Takip" },
                  ].map((t) => (
                    <button
                      key={t.v}
                      onClick={() => setForm((f) => ({ ...f, type: t.v }))}
                      className={`report-type-btn ${form.type === t.v ? "active" : ""}`}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="Açıklama, not veya hata detayı..."
                  className="report-textarea" // FIXED: Inline stil className'a tasindi
                />
                <input
                  value={form.contact}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact: e.target.value }))
                  }
                  placeholder="İletişim (opsiyonel)"
                  className="report-contact" // FIXED: Inline stil className'a tasindi
                />
                <button
                  onClick={handleSend}
                  disabled={!form.note.trim()}
                  className={`report-save-btn ${form.note.trim() ? "enabled" : "disabled"}`}
                >
                  💾 Kaydet
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

function FAB({
  db,
  save,
  onOpenAI,
  uiPrefs,
}: {
  db: ReturnType<typeof useDB>["db"];
  save: ReturnType<typeof useDB>["save"];
  onOpenAI: () => void;
  uiPrefs: ReturnType<typeof import("@/hooks/useUIPrefs").loadUIPrefs>;
}) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<
    "sale" | "gelir" | "gider" | "product" | null
  >(null);
  const aiBtnRef = useRef<HTMLButtonElement>(null);
  const fabWrapRef = useRef<HTMLDivElement>(null);

  // Hareketli FAB (sağ alt)
  const fab = useDraggableButton("fabBtnPos", { x: 28, y: 28 });
  // Hareketli AI butonu (sol alt)
  const ai = useDraggableButton("aiBtnPos", { x: 28, y: 28 });

  const actions = [
    { id: "sale" as const, label: "Hızlı Satış", icon: "🛒", color: "#ff5722" },
    {
      id: "product" as const,
      label: "Ürün Ekle",
      icon: "📦",
      color: "#3b82f6",
    },
    { id: "gelir" as const, label: "Gelir Ekle", icon: "💚", color: "#10b981" },
    { id: "gider" as const, label: "Gider Ekle", icon: "🔴", color: "#ef4444" },
  ];

  const titles: Record<string, string> = {
    sale: "🛒 Hızlı Satış",
    gelir: "💚 Hızlı Gelir",
    gider: "🔴 Hızlı Gider",
    product: "📦 Hızlı Ürün Ekle",
  };

  useEffect(() => {
    if (aiBtnRef.current) {
      aiBtnRef.current.style.bottom = `${ai.pos.y}px`;
      aiBtnRef.current.style.left = `${ai.pos.x}px`;
    }
    if (fabWrapRef.current) {
      fabWrapRef.current.style.bottom = `${fab.pos.y}px`;
      fabWrapRef.current.style.right = `${fab.pos.x}px`;
    }
  }, [ai.pos, fab.pos]); // FIXED: Dinamik konum JSX style prop yerine ref ile uygulanir

  return (
    <>
      {open && <div onClick={() => setOpen(false)} className="fab-overlay" />}

      {/* AI Floating Button — hareketli */}
      {uiPrefs.showAIButton && (
        <button
          ref={aiBtnRef}
          onPointerDown={ai.onPointerDown}
          onPointerMove={ai.onPointerMove}
          onPointerUp={ai.onPointerUp}
          onClick={() => {
            if (!ai.isDragging.current) onOpenAI();
          }}
          title="AI Asistan"
          className="fab-ai-btn" // FIXED: Inline stil className'a tasindi
        >
          🤖
        </button>
      )}

      {/* FAB — hareketli */}
      {uiPrefs.showFABButton && (
        <div ref={fabWrapRef} className="fab-wrap">
          {open &&
            actions.map((a) => (
              <div key={a.id} className="fab-action-row">
                <div className="fab-action-label">{a.label}</div>
                <button
                  onClick={() => {
                    setModal(a.id);
                    setOpen(false);
                  }}
                  className={`fab-action-btn fab-action-${a.id}`}
                >
                  {a.icon}
                </button>
              </div>
            ))}
          <button
            onPointerDown={fab.onPointerDown}
            onPointerMove={fab.onPointerMove}
            onPointerUp={fab.onPointerUp}
            onClick={() => {
              if (!fab.isDragging.current) setOpen((o) => !o);
            }}
            className={`fab-main-btn ${open ? "open" : ""}`}
          >
            +
          </button>
        </div>
      )}

      {modal && (
        <Modal
          open={true}
          onClose={() => setModal(null)}
          title={titles[modal] || ""}
          maxWidth={480}
        >
          {modal === "sale" && (
            <QuickSaleModal
              db={db}
              save={save}
              onClose={() => setModal(null)}
            />
          )}
          {modal === "gelir" && (
            <QuickIncomeModal
              db={db}
              save={save}
              onClose={() => setModal(null)}
              type="gelir"
            />
          )}
          {modal === "gider" && (
            <QuickIncomeModal
              db={db}
              save={save}
              onClose={() => setModal(null)}
              type="gider"
            />
          )}
          {modal === "product" && (
            <QuickProductModal
              db={db}
              save={save}
              onClose={() => setModal(null)}
            />
          )}
        </Modal>
      )}
    </>
  );
}

// ── AI Drawer ──
function AIDrawer({
  open,
  onClose,
  db,
  save,
}: {
  open: boolean;
  onClose: () => void;
  db: ReturnType<typeof useDB>["db"];
  save: ReturnType<typeof useDB>["save"];
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`ai-drawer-backdrop ${open ? "open" : ""}`}
      />
      {/* Drawer panel */}
      <div className={`ai-drawer-panel ${open ? "open" : ""}`}>
        {/* Drawer header */}
        <div className="ai-drawer-header">
          <div className="ai-drawer-badge">🤖</div>
          <div className="ai-drawer-head-main">
            <div className="ai-drawer-title">Soba AI Asistan</div>
            <div className="ai-drawer-subtitle">
              DeepSeek · Claude · Gemini · Çevrimdışı
            </div>
          </div>
          <button onClick={onClose} className="ai-drawer-close">
            ×
          </button>
        </div>
        {/* AIAsistan content — her zaman mount, sadece visibility değişir (konuşma korunur) */}
        <div className="ai-drawer-content">
          <AIAsistan db={db} save={save} embedded />
        </div>
      </div>
    </>
  );
}

function AppContent({
  onLogout,
  username,
  guestTimeLeft,
}: {
  onLogout: () => void;
  username?: string;
  guestTimeLeft: number;
}) {
  const { db, save, exportJSON, importJSON } = useDB();
  useEffect(() => {
    const ctx: AgentContext = { getDB: () => db, save };
    getAllAgents().forEach((agent) => agent.bagla(ctx));
  }, [db, save]);
  const [location, setLocation] = useLocation();
  const activeTab = (location && TABS.some((t) => t.id === location.replace("/", "")) ? location.replace("/", "") : "dashboard") as TabId;
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

  // UIPrefs değişikliklerini dinle (Settings'ten güncelleme gelince yansısın)
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

  // Son güncelleme toast'u — her versiyon için bir kez göster
  useEffect(() => {
    const LATEST_VERSION = '3.0.0';
    const seenKey = `parspel_update_seen_${LATEST_VERSION}`;
    try {
      if (!localStorage.getItem(seenKey)) {
        setTimeout(() => {
          showToast(`🚀 v${LATEST_VERSION} — Multi-agent orkestrasyonu, IndexedDB snapshot ve fallback aksiyon akisi eklendi`, 'info');
          try { localStorage.setItem(seenKey, '1'); } catch { /* localStorage yazma hatası */ }
        }, 1500);
      }
    } catch { /* localStorage okuma hatası */ }
  }, [showToast]);

  // İlk kurulum verisini DB'ye yaz (bir kez)
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
      // Ürünler
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
        showToast("İnternet bağlantısı yeniden kuruldu", "success");
      } else {
        showToast(
          "Çevrimdışı çalışıyorsunuz — veriler korunuyor",
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
    setLocation("/" + tab);
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

  // Yedek event listener (Dashboard widget'ından tetiklenir)
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
  const groups: TabGroup[] = ["Ana", "Tedarik", "Finans", "Analiz", "Sistem"];
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
      <aside
        className={`app-sidebar ${isMobile && !sidebarOpen ? "mobile-closed" : "mobile-open"}`}
      >
        {/* Logo */}
        <div className="app-sidebar-logo-wrap">
          <div className="app-sidebar-logo-row">
            <div className="app-sidebar-logo-icon">🔥</div>
            <div className="app-sidebar-logo-text-wrap">
              <div className="app-sidebar-logo-title">Soba Yönetim</div>
              <div className="app-sidebar-logo-subtitle">Sistemi · v3.0</div>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="app-sidebar-close-btn"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* NAV */}
        <nav className="app-sidebar-nav">
          <div
            role="region"
            aria-label="Hızlı erişim"
            className="app-quick-region"
          >
            <div className="app-quick-region-head">
              <div className="app-quick-region-title">Hızlı Erişim</div>
              <div className="app-quick-region-subtitle">Favori modüller</div>
            </div>
            <div className="app-quick-grid">
              {priorityTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const tabGroupClass =
                  tab.group === "Ana"
                    ? "ana"
                    : tab.group === "Tedarik"
                      ? "tedarik"
                      : tab.group === "Finans"
                        ? "finans"
                        : tab.group === "Analiz"
                          ? "analiz"
                          : "sistem"; // FIXED: Grup rengi className ile yonetilir
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.id)}
                    aria-label={`${tab.label} hızlı erişim`}
                    className={`app-priority-tab ${tabGroupClass} ${isActive ? "active" : "inactive"}`}
                  >
                    <span
                      className={`app-priority-tab-icon ${isActive ? "active" : "inactive"}`}
                    >
                      {tab.icon}
                    </span>
                    <span className="app-priority-tab-label">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {groups.map((group) => {
            const groupClass =
              group === "Ana"
                ? "ana"
                : group === "Tedarik"
                  ? "tedarik"
                  : group === "Finans"
                    ? "finans"
                    : group === "Analiz"
                      ? "analiz"
                      : "sistem"; // FIXED: Grup stili className ile yonetilir
            const groupTabs = TABS.filter((t) => t.group === group);
            const isExpanded =
              expandedGroups[group] ?? DEFAULT_EXPANDED_GROUPS.includes(group);
            return (
              <div key={group} className="app-nav-group">
                <button
                  onClick={() => toggleGroup(group)}
                  className={`app-nav-group-toggle ${groupClass}`}
                  aria-expanded={isExpanded}
                  aria-label={`${group} grubunu ${isExpanded ? "daralt" : "genislet"}`}
                >
                  <span
                    className={`app-nav-group-arrow ${isExpanded ? "expanded" : ""}`}
                  >
                    ▶
                  </span>
                  <span className="app-nav-group-name">{group}</span>
                  <div className={`app-nav-group-line ${groupClass}`} />
                  <span className="app-nav-group-count">
                    {groupTabs.length}
                  </span>
                </button>
                {isExpanded &&
                  groupTabs.map((tab) => {
                    const badge = badges[tab.id as keyof typeof badges];
                    const isActive = activeTab === tab.id;
                    const isFavorite = favoriteTabs.includes(tab.id);
                    const tabGroupClass =
                      tab.group === "Ana"
                        ? "ana"
                        : tab.group === "Tedarik"
                          ? "tedarik"
                          : tab.group === "Finans"
                            ? "finans"
                            : tab.group === "Analiz"
                              ? "analiz"
                              : "sistem";
                    return (
                      <div key={tab.id} className="app-nav-tab-row">
                        <button
                          onClick={() => navigate(tab.id)}
                          className={`app-nav-tab-btn ${tabGroupClass} ${isActive ? "active" : "inactive"}`}
                        >
                          <span
                            className={`app-nav-tab-icon ${isActive ? "active" : "inactive"}`}
                          >
                            {tab.icon}
                          </span>
                          <span className="app-nav-tab-label">{tab.label}</span>
                          {badge ? (
                            <span
                              className={`app-nav-badge ${tab.id === "products" || tab.id === "monitor" ? "danger" : "warn"}`}
                            >
                              {badge > 99 ? "99+" : badge}
                            </span>
                          ) : null}
                          {isActive && (
                            <span
                              className={`app-nav-tab-active-line ${tabGroupClass}`}
                            />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavoriteTab(tab.id)}
                          aria-label={`${tab.label} favorilere ${isFavorite ? "ekli, kaldır" : "ekle"}`}
                          title={
                            isFavorite
                              ? "Favorilerden kaldır"
                              : "Favorilere ekle"
                          }
                          className={`app-favorite-btn ${isFavorite ? "active" : "inactive"}`}
                        >
                          {isFavorite ? "★" : "☆"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        {/* Kasa Widget */}
        <div onClick={() => navigate("kasa")} className="app-kasa-widget">
          <div className="app-kasa-widget-head">
            <span>💰</span>
            <span>Toplam Kasa</span>
            <span className="app-kasa-widget-dot" />
          </div>
          <div
            className={`app-kasa-widget-total ${totalKasa >= 0 ? "positive" : "negative"}`}
          >
            {formatMoney(totalKasa)}
          </div>
          <div className="app-kasa-widget-split">
            <div className="app-kasa-widget-col">
              <div className="app-kasa-widget-col-label">Nakit</div>
              <div className="app-kasa-widget-col-value">
                {formatMoney(nakit)}
              </div>
            </div>
            <div className="app-kasa-widget-divider" />
            <div className="app-kasa-widget-col">
              <div className="app-kasa-widget-col-label">Banka</div>
              <div className="app-kasa-widget-col-value">
                {formatMoney(totalKasa - nakit)}
              </div>
            </div>
          </div>
        </div>

        {/* Kullanıcı avatarı */}
        <div className="app-user-section">
          <div className="app-user-avatar">
            <span>PP</span>
            <span className={`app-user-status ${isOnline ? "online" : "offline"}`} />
          </div>
          <div className="app-user-info">
            <div className="app-user-name">Pars Pel</div>
            <div className="app-user-role">Yönetici</div>
          </div>
          <span className="app-user-chevron">›</span>
        </div>

        {/* Alt durum çubuğu */}
        <div className="app-status-wrap">
          {/* Online/offline + sync durumu */}
          <div className="app-status-row">
            <span
              className={`app-status-dot ${isOnline ? "online" : "offline"}`}
            />
            <span
              className={`app-status-text ${isOnline ? "online" : "offline"}`}
            >
              {isOnline ? "Çevrimiçi" : "Çevrimdışı"}
            </span>
            {/* Sync durumu */}
            <span className={`app-sync-mini ${syncStatus}`}>
              {syncStatus === "saving"
                ? "⟳ Senkronize…"
                : syncStatus === "saved"
                  ? `✓ ${lastSyncTime}`
                  : syncStatus === "error"
                    ? "✗ Hata"
                    : syncStatus === "loading"
                      ? "↓ Yüklüyor"
                      : ""}
            </span>
          </div>
          <div className="app-status-foot">
            🔒 Firebase & localStorage · Güvenli
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className={`app-main-shell ${isMobile ? "mobile" : "desktop"}`}>
        <header className={`app-header ${isMobile ? "mobile" : "desktop"}`}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="app-header-menu-btn"
            >
              ☰
            </button>
          )}
          {/* Sayfa başlığı */}
          <div
            className={`app-header-title-wrap ${isMobile ? "mobile" : "desktop"}`}
          >
            <h1
              className={`app-header-title ${isMobile ? "mobile" : "desktop"}`}
            >
              <span className={`app-header-title-icon ${activeGroupClass}`}>
                {TABS.find((t) => t.id === activeTab)?.icon}
              </span>
              {TABS.find((t) => t.id === activeTab)?.label}
            </h1>
          </div>
          {!isMobile && (
            <GlobalSearch
              onNavigate={navigate}
              db={db}
              favoriteTabs={favoriteTabs}
            />
          )}
          <div
            className={`app-header-actions ${isMobile ? "mobile" : "desktop"}`}
          >
            {/* Kısayollar */}
            {!isMobile && (
              <div className="app-shortcuts-row">
                {[
                  { k: "⌘1", t: "dashboard", label: "Özet" },
                  { k: "⌘2", t: "products", label: "Ürün" },
                  { k: "⌘3", t: "sales", label: "Satış" },
                  { k: "⌘4", t: "kasa", label: "Kasa" },
                ].map((s) => (
                  <button
                    key={s.k}
                    onClick={() => navigate(s.t as TabId)}
                    title={`${s.label} (Ctrl+${s.k.replace("⌘", "")})`}
                    className={`app-shortcut-btn ${activeTab === s.t ? "active" : "inactive"}`}
                  >
                    {s.k}
                  </button>
                ))}
              </div>
            )}
            {/* Akıllı Bildirim Merkezi */}
            <NotificationCenter
              db={db}
              onNavigate={(tab) =>
                navigate(tab as Parameters<typeof navigate>[0])
              }
            />
            {/* Uyarı bildirimleri */}
            {badges.monitor > 0 && (
              <button
                onClick={() => navigate("monitor")}
                className="app-alert-btn"
              >
                🔔 {badges.monitor}
              </button>
            )}
            {!isMobile && badges.products > 0 && (
              <button
                onClick={() => navigate("products")}
                className="app-products-alert-btn"
              >
                📦 {badges.products}
              </button>
            )}
            {/* Sync göstergesi */}
            {!isMobile && (
              <div className={`app-sync-badge ${syncStatus}`}>
                <span className={`app-sync-dot ${syncStatus}`} />
                <span className={`app-sync-text ${syncStatus}`}>
                  {syncStatus === "saving"
                    ? "Kaydediliyor"
                    : syncStatus === "saved"
                      ? `Senkron ${lastSyncTime}`
                      : syncStatus === "error"
                        ? "Sync Hatası"
                        : syncStatus === "loading"
                          ? "Yükleniyor"
                          : "Firebase"}
                </span>
              </div>
            )}
            <button
              onClick={exportJSON}
              title="Hızlı Yedek Al"
              className="app-backup-btn"
            >
              {isMobile ? "💾" : "💾 Yedek"}
            </button>
            {!isMobile && (
              <div className="app-header-date">
                {new Date().toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            )}
            {/* Kullanıcı menüsü */}
            <UserMenu
              username={username}
              onLogout={onLogout}
              isMobile={isMobile}
              guestTimeLeft={guestTimeLeft}
            />
          </div>
        </header>

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
                  <Route path="/products"><Products db={db} save={save} /></Route>
                  <Route path="/sales"><Sales db={db} save={save} /></Route>
                  <Route path="/fatura"><Fatura db={db} save={save} /></Route>
                  <Route path="/suppliers"><Suppliers db={db} save={save} /></Route>
                  <Route path="/pelet"><Pelet db={db} save={save} /></Route>
                  <Route path="/boruTed"><BoruTed db={db} save={save} /></Route>
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
                  <Route path="/not-found"><NotFound /></Route>
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

function PageFallback() {
  return (
    <div className="app-page-fallback">
      <div style={{ width: "100%", maxWidth: 800, margin: "0 auto" }}>
        <div
          className="skeleton skeleton-heading"
          style={{ height: 28, width: "30%", marginBottom: 24 }}
        />
        <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton skeleton-stat"
              style={{ flex: 1, height: 100 }}
            />
          ))}
        </div>
        <div
          className="skeleton"
          style={{ width: "100%", height: 260, borderRadius: 16 }}
        />
      </div>
    </div>
  );
}


