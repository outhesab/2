/**
 * UI Tercihleri Hook
 * Tema rengi, arka plan, font boyutu, animasyon hızı, kompakt mod
 * CSS değişkenleri üzerinden çalışır — tüm uygulama anında güncellenir
 */

import { logger } from "@/lib/logger";

export interface UIPrefs {
  themeId: string;
  accent: string;
  bgBase: string;
  fontScale: number;
  animSpeed: "hizli" | "normal" | "yavas" | "yok";
  compactMode: boolean;
  sidebarStyle: "default" | "minimal" | "colored";
  cardRadius: number;
  lightMode: boolean;
  showAIButton: boolean;
  showFABButton: boolean;
  showReportButton: boolean;
  aiBtnPos: { x: number; y: number };
  fabBtnPos: { x: number; y: number };
  reportBtnPos: { x: number; y: number };
}

export const DEFAULT_PREFS: UIPrefs = {
  themeId: "corporate",
  accent: "#2563eb",
  bgBase: "#f8fafc",
  fontScale: 1,
  animSpeed: "normal",
  compactMode: false,
  sidebarStyle: "default",
  cardRadius: 12,
  lightMode: true,
  showAIButton: true,
  showFABButton: true,
  showReportButton: true,
  aiBtnPos: { x: 28, y: 28 },
  fabBtnPos: { x: 28, y: 28 },
  reportBtnPos: { x: 90, y: 28 },
};

const STORAGE_KEY = "sobaUI";

// ── Firebase sync ──────────────────────────────────────────────────────────
function getUiPrefsUrl(): string {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
  if (!projectId || !apiKey) return '';
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/uiPrefs?key=${apiKey}`;
}

export async function loadUIPrefsFromFirebase(): Promise<UIPrefs | null> {
  try {
    const res = await fetch(getUiPrefsUrl(), {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json?.fields?.data?.stringValue;
    if (!raw) return null;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    logger.warn('ui', 'Firebase\'den UI tercihleri yüklenemedi');
    return null;
  }
}

async function saveUIPrefsToFirebase(prefs: UIPrefs): Promise<void> {
  try {
    await fetch(getUiPrefsUrl(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          data: { stringValue: JSON.stringify(prefs) },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    logger.warn('ui', 'UI tercihleri Firebase\'e kaydedilemedi');
    /* sessizce geç */
  }
}

export function loadUIPrefs(): UIPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    logger.warn('ui', 'LocalStorage\'dan UI tercihleri okunamadı');
    /* localStorage okuma hatası */
  }
  return { ...DEFAULT_PREFS };
}

export function saveUIPrefs(prefs: UIPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Aynı sekmedeki dinleyicileri tetikle
  window.dispatchEvent(new CustomEvent("sobaUI:updated"));
  // Arka planda Firebase'e de yaz
  saveUIPrefsToFirebase(prefs).catch(() => logger.error('sync', 'UI prefs Firebase\'e yazılamadı'));
}

/** CSS değişkenlerini DOM'a uygula */
export function applyUIPrefs(prefs: UIPrefs): void {
  const root = document.documentElement;
  const isLight = prefs.lightMode;

  if (isLight) {
    document.body.classList.remove("dark-mode");
  } else {
    document.body.classList.add("dark-mode");
  }

  // Accent rengi ve türevleri
  root.style.setProperty("--accent", prefs.accent);
  root.style.setProperty("--accent-light", lighten(prefs.accent, 20));
  root.style.setProperty("--accent-glow", hexToRgba(prefs.accent, 0.35));
  root.style.setProperty("--accent-soft", hexToRgba(prefs.accent, 0.12));

  if (isLight) {
    const bg = prefs.bgBase;
    const isDarkAccent = isColorDark(prefs.accent);

    root.style.setProperty("--bg-base", bg);
    root.style.setProperty("--bg-card", "rgba(255,255,255,0.92)");
    root.style.setProperty("--bg-card-hover", "rgba(255,255,255,0.96)");
    root.style.setProperty("--bg-surface", adjustBrightness(bg, -8));
    root.style.setProperty("--bg-sidebar", adjustBrightness(bg, -12));
    root.style.setProperty("--bg-elevated", "#ffffff");
    root.style.setProperty("--border", "rgba(0,0,0,0.12)");
    root.style.setProperty("--border-strong", "rgba(0,0,0,0.22)");
    root.style.setProperty("--text-primary", "#0a0a0a");
    root.style.setProperty("--text-secondary", "#1e293b");
    root.style.setProperty("--text-muted", "#475569");
    root.style.setProperty("--text-dim", "#64748b");
    root.style.setProperty("--color-primary", prefs.accent);
    root.style.setProperty("--color-primary-light", lighten(prefs.accent, 20));
    root.style.setProperty("--color-primary-soft", hexToRgba(prefs.accent, 0.12));
    root.style.setProperty("--color-primary-ultra", hexToRgba(prefs.accent, 0.05));
    root.style.setProperty("--color-success", "#10b981");
    root.style.setProperty("--color-success-soft", "rgba(16,185,129,0.12)");
    root.style.setProperty("--color-danger", "#ef4444");
    root.style.setProperty("--color-danger-soft", "rgba(239,68,68,0.12)");
    root.style.setProperty("--color-warning", "#f59e0b");
    root.style.setProperty("--color-warning-soft", "rgba(245,158,11,0.12)");
    root.style.setProperty("--color-info", "#3b82f6");
    root.style.setProperty("--color-info-soft", "rgba(59,130,246,0.12)");
    root.style.setProperty("--color-accent", prefs.accent);
    root.style.setProperty("--color-accent-soft", hexToRgba(prefs.accent, 0.12));
    root.style.setProperty("--color-secondary", "#64748b");
    root.style.setProperty(
      "--accent-text",
      isDarkAccent ? "#ffffff" : "#0a0a0a",
    );
    root.style.setProperty("--sidebar-text", "#0f172a");
  } else {
    root.style.setProperty("--bg-base", prefs.bgBase);
    root.style.setProperty("--bg-card", adjustBrightness(prefs.bgBase, 20));
    root.style.setProperty("--bg-card-hover", adjustBrightness(prefs.bgBase, 28));
    root.style.setProperty("--bg-surface", adjustBrightness(prefs.bgBase, 35));
    root.style.setProperty("--bg-sidebar", adjustBrightness(prefs.bgBase, -5));
    root.style.setProperty("--bg-elevated", adjustBrightness(prefs.bgBase, 30));
    root.style.setProperty("--border", "rgba(255,255,255,0.07)");
    root.style.setProperty("--border-strong", "rgba(255,255,255,0.12)");
    root.style.setProperty("--text-primary", "#f0f6ff");
    root.style.setProperty("--text-secondary", "#94a3b8");
    root.style.setProperty("--text-muted", "#475569");
    root.style.setProperty("--text-dim", "#334155");
    root.style.setProperty("--color-primary", prefs.accent);
    root.style.setProperty("--color-primary-light", lighten(prefs.accent, 20));
    root.style.setProperty("--color-primary-soft", hexToRgba(prefs.accent, 0.12));
    root.style.setProperty("--color-primary-ultra", hexToRgba(prefs.accent, 0.05));
    root.style.setProperty("--color-success", "#10b981");
    root.style.setProperty("--color-success-soft", "rgba(16,185,129,0.12)");
    root.style.setProperty("--color-danger", "#ef4444");
    root.style.setProperty("--color-danger-soft", "rgba(239,68,68,0.12)");
    root.style.setProperty("--color-warning", "#f59e0b");
    root.style.setProperty("--color-warning-soft", "rgba(245,158,11,0.12)");
    root.style.setProperty("--color-info", "#3b82f6");
    root.style.setProperty("--color-info-soft", "rgba(59,130,246,0.12)");
    root.style.setProperty("--color-accent", prefs.accent);
    root.style.setProperty("--color-accent-soft", hexToRgba(prefs.accent, 0.12));
    root.style.setProperty("--color-secondary", "#64748b");
    root.style.setProperty("--accent-text", "#ffffff");
    root.style.setProperty("--sidebar-text", "#f0f6ff");
  }

  root.style.setProperty("--font-size-base", `${prefs.fontScale * 16}px`);
  document.documentElement.style.fontSize = `${prefs.fontScale * 16}px`;

  const speedMap = { hizli: "0.1s", normal: "0.2s", yavas: "0.4s", yok: "0s" };
  root.style.setProperty("--transition-speed", speedMap[prefs.animSpeed]);
  root.style.setProperty("--radius", `${prefs.cardRadius}px`);

  if (prefs.compactMode) {
    document.body.classList.add("compact-mode");
  } else {
    document.body.classList.remove("compact-mode");
  }
}

/** Renk koyu mu? (buton metin rengi için) */
function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r)) return true;
  // Luminance hesabı
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}

// ── Renk yardımcıları ──────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255,87,34,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function adjustBrightness(hex: string, amount: number): string {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Hazır tema paketleri
export const THEMES = [
  // Modern koyu temalar (oncelik sirasi)
  {
    id: "graphite",
    label: "Kurumsal Gece",
    accent: "#9ca3af",
    bg: "#0b1017",
    desc: "Nötr ve profesyonel görünüm",
    light: false,
  },
  {
    id: "carbon",
    label: "Karbon",
    accent: "#22c55e",
    bg: "#041512",
    desc: "Canlı yeşil ve yüksek kontrast",
    light: false,
  },
  {
    id: "midnight",
    label: "Gece Mavisi",
    accent: "#38bdf8",
    bg: "#030d1a",
    desc: "Temiz mavi tonlu koyu tema",
    light: false,
  },
  {
    id: "ember",
    label: "Kor Turuncu",
    accent: "#f97316",
    bg: "#140a04",
    desc: "Sıcak vurgu renkli modern tema",
    light: false,
  },
  {
    id: "signal-red",
    label: "Alarm Kırmızı",
    accent: "#ef4444",
    bg: "#150607",
    desc: "Kritik ekranlar için güçlü vurgu",
    light: false,
  },

  // Modern acik temalar
  {
    id: "paper",
    label: "Beyaz Kağıt",
    accent: "#0ea5e9",
    bg: "#f7fafc",
    desc: "Aydınlık, sade ve net arayüz",
    light: true,
  },
  {
    id: "mint",
    label: "Nane",
    accent: "#10b981",
    bg: "#f2fbf7",
    desc: "Ferah açık yeşil ton",
    light: true,
  },
  {
    id: "sand",
    label: "Kum",
    accent: "#d97706",
    bg: "#fffbf2",
    desc: "Sıcak ve yumuşak açık görünüm",
    light: true,
  },
] as const;
