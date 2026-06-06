import { useConfirm } from "@/components/ConfirmDialog";
import { SystemMap } from "@/components/SystemMap";
import { useToast } from "@/components/Toast";
import {
    mergeRestoreDB,
    saveBackupToFirebase,
    type RestoreReport,
} from "@/hooks/useDB";
import type {
    SoundSettings,
    SoundTheme,
    SoundType,
} from "@/hooks/useSoundFeedback";
import { useSoundFeedback } from "@/hooks/useSoundFeedback";
import {
    applyUIPrefs,
    loadUIPrefs,
    saveUIPrefs,
    type UIPrefs,
} from "@/hooks/useUIPrefs";
import { isPremiumTheme as _isPremiumTheme } from "@/theme/themes";
import {
    APP_SUBTITLE,
    loadAppConfig,
    saveAppConfig,
    validateVersion,
} from "@/lib/appConfig";
import { CHANGE_TYPE_CONFIG, CHANGELOG } from "@/lib/changelog";
import {
    loadConnConfig,
    saveConnConfig,
    type ConnConfig,
} from "@/lib/connConfig";
import { exportToExcel } from "@/lib/excelExport";
import { runHealthCheck, type HealthReport } from "@/lib/healthCheck";
import { logger } from "@/lib/logger";
import {
    createUser,
    deleteUser,
    getUserSession,
    hashPassword as hashPass,
    loadUsers,
    toggleUserActive,
    updateUserPassword,
    updateUserRole,
    type AppUser,
    type UserRole,
} from "@/lib/userManager";

import { formatDate } from "@/lib/utils-tr";
import ExcelImport from "@/pages/ExcelImport";
import type { DB } from "@/types";
import { WIDGET_OPTIONS, type WidgetId } from "@/config/widgets";

import { useEffect, useRef, useState } from "react";
import { ArayuzAyarlari } from "./SettingsArayuz";
import { BaglantiAyarlari } from "./SettingsBaglanti";
import { Card } from "./SettingsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  exportJSON: () => void;
  importJSON: (f: File) => Promise<boolean>;
}

type Tab = "arayuz" | "baglantilar" | "company" | "categories" | "pellet" | "sound" | "agent" | "backup" | "excel_export" | "activity" | "shortcuts" | "repair" | "excel" | "data" | "security" | "sysmap" | "about";

const inpBase = "w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] box-border";

function loadSoundSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem("sobaYonetim");
    if (!raw) return { enabled: true, volume: 0.5, theme: "standart" };
    const parsed = JSON.parse(raw);
    return {
      enabled: true,
      volume: 0.5,
      theme: "standart",
      ...(parsed.soundSettings || {}),
    };
  } catch {
    logger.warn('settings', 'Ses ayarları localStorage\'dan okunamadı, varsayılan kullanıldı');
    return { enabled: true, volume: 0.5, theme: "standart" };
  }
}

function saveSoundSettingsToStorage(settings: SoundSettings) {
  try {
    const raw = localStorage.getItem("sobaYonetim");
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.soundSettings = settings;
    localStorage.setItem("sobaYonetim", JSON.stringify(parsed));
  } catch {
    logger.warn('settings', 'Ses ayarları localStorage\'a yazılamadı');
    /* localStorage yazma hatasÄ± â€” sessizce geÃ§ */
  }
}

export default function Settings({
  db,
  save,
  exportJSON,
  importJSON: _importJSON,
}: Props) {
  const { showToast: _showToast } = useToast();
  const showToast = _showToast as (m: string, t?: string) => void;
  const { showConfirm } = useConfirm();
  const { playSound } = useSoundFeedback();
  const [company, setCompany] = useState(() => {
    // db.company boÅŸsa db.settings'den doldur (setup wizard buraya yazar)
    const s = (db.settings || {}) as Record<string, string>;
    return {
      ...db.company,
      name: db.company.name || s.companyName || "",
      city: (db.company as { city?: string }).city || s.city || "",
    };
  });
  const [pellet, setPellet] = useState({ ...db.pelletSettings });
  const [tab, setTab] = useState<Tab>("arayuz");
  const [uiPrefs, setUiPrefs] = useState<UIPrefs>(loadUIPrefs);
  const [connCfg, setConnCfg] = useState<ConnConfig>(loadConnConfig);



  const [dashboardPrefs, setDashboardPrefs] = useState<{ leftWidgets: WidgetId[]; brightness: number }>(() => {
    try {
      const raw = localStorage.getItem('dashboardPrefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          leftWidgets: Array.isArray(parsed.leftWidgets) ? parsed.leftWidgets.filter((id: string) => WIDGET_OPTIONS.some(w => w.id === id)) : ['chart', 'recentSales', 'tips', 'excelBar'],
          brightness: typeof parsed.brightness === 'number' ? parsed.brightness : 100,
        };
      }
    } catch { logger.warn('settings', 'Dashboard tercihleri localStorage\'dan okunamadı'); /* ignore */ }
    return { leftWidgets: ['chart', 'recentSales', 'tips', 'excelBar'], brightness: 100 };
  });

  const saveDashboardPrefs = (patch: Partial<{ leftWidgets: WidgetId[]; brightness: number }>) => {
    const next = { ...dashboardPrefs, ...patch };
    setDashboardPrefs(next);
    try { localStorage.setItem('dashboardPrefs', JSON.stringify(next)); } catch { logger.warn('settings', 'Dashboard tercihleri localStorage\'a yazılamadı'); /* ignore */ }
  };

  const saveCompany = () => {
    save((prev) => ({
      ...prev,
      company: {
        ...company,
        id: prev.company.id,
        createdAt: prev.company.createdAt,
      },
      settings: {
        ...prev.settings,
        companyName: company.name,
        city: (company as { city?: string }).city || "",
      },
    }));
    showToast("Åirket bilgileri kaydedildi!", "success");
  };

  const savePellet = () => {
    save((prev) => ({ ...prev, pelletSettings: { ...pellet } }));
    showToast("Pelet ayarlarÄ± kaydedildi!", "success");
  };

  const clearData = () => {
    showConfirm(
      "TÃ¼m Verileri Sil",
      "TÃœM verileriniz kalÄ±cÄ± olarak silinecek! Bu iÅŸlem geri alÄ±namaz. Emin misiniz?",
      () => {
        localStorage.removeItem("sobaYonetim");
        window.location.reload();
      },
      true,
    );
  };

  const dataStats = [
    { label: "ÃœrÃ¼nler", count: db.products.length, icon: "ğŸ“¦" },
    { label: "SatÄ±ÅŸlar", count: db.sales.length, icon: "ğŸ›’" },
    { label: "TedarikÃ§iler", count: db.suppliers.length, icon: "ğŸ­" },
    { label: "Cari Hesaplar", count: db.cari.length, icon: "ğŸ‘¤" },
    { label: "Kasa Ä°ÅŸlemleri", count: db.kasa.length, icon: "ğŸ’°" },
    { label: "Banka Ä°ÅŸlemleri", count: db.bankTransactions.length, icon: "ğŸ¦" },
    { label: "Pelet TedarikÃ§i", count: db.peletSuppliers.length, icon: "ğŸªµ" },
    { label: "Boru TedarikÃ§i", count: db.boruSuppliers.length, icon: "ğŸ”©" },
  ];

  const totalRecords = dataStats.reduce((s, d) => s + d.count, 0);

  const shortcuts = [
    { key: "Ctrl + 1", desc: "Ã–zet (Dashboard)" },
    { key: "Ctrl + 2", desc: "ÃœrÃ¼nler" },
    { key: "Ctrl + 3", desc: "SatÄ±ÅŸ" },
    { key: "Ctrl + 4", desc: "Kasa" },
    { key: "Ctrl + 5", desc: "Raporlar" },
    { key: "+ Butonu", desc: "HÄ±zlÄ± Eylem MenÃ¼sÃ¼ (saÄŸ alt)" },
    { key: "Ctrl + Z", desc: "Geri Al (tarayÄ±cÄ± dÃ¼zeyi)" },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
          <TabsTrigger value="arayuz">ğŸŽ¨ ArayÃ¼z</TabsTrigger>
          <TabsTrigger value="baglantilar">ğŸ”Œ BaÄŸlantÄ±lar</TabsTrigger>
          <TabsTrigger value="company">ğŸ¢ Åirket</TabsTrigger>
          <TabsTrigger value="categories">ğŸ·ï¸ Kategoriler</TabsTrigger>
          <TabsTrigger value="pellet">ğŸªµ Pelet</TabsTrigger>
          <TabsTrigger value="sound">ğŸ”Š Ses</TabsTrigger>
          <TabsTrigger value="agent">ğŸ¤– Agentlar</TabsTrigger>
          <TabsTrigger value="backup">ğŸ’¾ Yedek</TabsTrigger>
          <TabsTrigger value="excel_export">ğŸ“Š Excel</TabsTrigger>
          <TabsTrigger value="activity">ğŸ“‹ Aktivite</TabsTrigger>
          <TabsTrigger value="shortcuts">âŒ¨ KÄ±sayollar</TabsTrigger>
          <TabsTrigger value="repair">ğŸ”§ OnarÄ±m</TabsTrigger>
          <TabsTrigger value="excel">ğŸ“¥ Ä°Ã§e Aktar</TabsTrigger>
          <TabsTrigger value="data">ğŸ—„ Veri</TabsTrigger>
          <TabsTrigger value="security">ğŸ” GÃ¼venlik</TabsTrigger>
          <TabsTrigger value="sysmap">ğŸ—º Harita</TabsTrigger>
          <TabsTrigger value="about">â„¹ HakkÄ±nda</TabsTrigger>
        </TabsList>

      {tab === "arayuz" && (
        <ArayuzAyarlari
          prefs={uiPrefs}
          onChange={(p) => {
            setUiPrefs(p);
            saveUIPrefs(p);
            applyUIPrefs(p);
          }}
          showToast={showToast}
          dashboardPrefs={dashboardPrefs}
          saveDashboardPrefs={saveDashboardPrefs}
        />
      )}

      {tab === "baglantilar" && (
        <BaglantiAyarlari
          cfg={connCfg}
          onChange={(c) => {
            setConnCfg(c);
            saveConnConfig(c);
          }}
          showToast={showToast}
        />
      )}

      {tab === "company" && (
        <Card title="ğŸ¢ Åirket Bilgileri">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FV
                label="Åirket AdÄ±"
                value={company.name || ""}
                onChange={(v) => setCompany((c) => ({ ...c, name: v }))}
              />
              <FV
                label="Åehir"
                value={(company as { city?: string }).city || ""}
                onChange={(v) => setCompany((c) => ({ ...c, city: v }))}
              />
              <FV
                label="Vergi No"
                value={company.taxNo || ""}
                onChange={(v) => setCompany((c) => ({ ...c, taxNo: v }))}
              />
              <FV
                label="Telefon"
                value={company.phone || ""}
                onChange={(v) => setCompany((c) => ({ ...c, phone: v }))}
              />
              <FV
                label="E-posta"
                type="email"
                value={company.email || ""}
                onChange={(v) => setCompany((c) => ({ ...c, email: v }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Adres</label>
              <textarea
                value={company.address || ""}
                onChange={(e) =>
                  setCompany((c) => ({ ...c, address: e.target.value }))
                }
                className={`${inpBase} min-h-[70px]`}
              />
            </div>
<Button onClick={saveCompany} className="w-full mt-4">
              ğŸ’¾ ÅŸirket Bilgilerini Kaydet
            </Button>
          </div>
        </Card>
      )}

      {tab === "pellet" && (
        <Card title="ğŸªµ Pelet AyarlarÄ±">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FV
              label="Gramaj (gr/torba)"
              type="number"
              inputMode="decimal"
              value={String(pellet.gramaj)}
              onChange={(v) =>
                setPellet((p) => ({ ...p, gramaj: parseFloat(v) || 0 }))
              }
            />
            <FV
              label="Kg FiyatÄ± (â‚º)"
              type="number"
              inputMode="decimal"
              value={String(pellet.kgFiyat)}
              onChange={(v) =>
                setPellet((p) => ({ ...p, kgFiyat: parseFloat(v) || 0 }))
              }
            />
            <FV
              label="Çuval Kg"
              type="number"
              inputMode="decimal"
              value={String(pellet.cuvalKg)}
              onChange={(v) =>
                setPellet((p) => ({ ...p, cuvalKg: parseFloat(v) || 0 }))
              }
            />
            <FV
              label="Kritik GÃ¼n SayÄ±sÄ±"
              type="number"
              inputMode="decimal"
              value={String(pellet.critDays)}
              onChange={(v) =>
                setPellet((p) => ({ ...p, critDays: parseInt(v) || 0 }))
              }
            />
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            ğŸ’¡ Mevcut deÄŸerler: {pellet.cuvalKg}kg Ã§uval Â· â‚º{pellet.kgFiyat}/kg
            Â· {pellet.gramaj}gr/torba
          </div>
          <Button
            onClick={savePellet}
            className="btn-primary w-full py-3 rounded-xl font-bold text-sm mt-4"
          >
            ğŸ’¾ Pelet AyarlarÄ±nÄ± Kaydet
          </Button>
        </Card>
      )}

      {tab === "sound" && <SoundSettingsPanel playSound={playSound} />}

      {tab === "agent" && <AgentSettingsPanel db={db} save={save} />}

      {tab === "backup" && (
        <div className="grid gap-4">
          <Card title="ğŸ“¤ Yedek Al">
            <p className="text-muted-foreground text-sm">
              TÃ¼m verilerinizi{" "}
              <strong className="text-orange-400 font-semibold">
                JSON formatÄ±nda
              </strong>{" "}
              dÄ±ÅŸa aktarÄ±n.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dataStats.slice(0, 4).map((d) => (
                <div key={d.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
                  <div className="text-lg mb-1">{d.icon}</div>
                  <div className="text-lg font-bold text-foreground">{d.count}</div>
                  <div className="text-[var(--text-dim)] text-sm">{d.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              Toplam {totalRecords} kayÄ±t yedeklenecek
            </div>
            <Button
              onClick={exportJSON}
              className="btn-primary btn-green w-full py-3 rounded-xl font-bold text-sm"
            >
              YedeÄŸi Ä°ndir (.json)
            </Button>
          </Card>

          <FullRestorePanel
            showToast={showToast}
            showConfirm={
              showConfirm as (
                t: string,
                m: string,
                ok: () => void,
                d?: boolean,
              ) => void
            }
            save={save}
            db={db}
          />

          <SelectiveRestore
            showToast={showToast}
            showConfirm={
              showConfirm as (
                t: string,
                m: string,
                ok: () => void,
                d?: boolean,
              ) => void
            }
            save={save}
            db={db}
          />

          <SmartImportManager
            db={db}
            save={save}
            showToast={showToast}
            showConfirm={
              showConfirm as (
                t: string,
                m: string,
                ok: () => void,
                d?: boolean,
              ) => void
            }
          />
        </div>
      )}

      {tab === "excel_export" && <ExcelExportPanel db={db} />}

      {tab === "activity" && (
        <ActivityPanel
          db={db}
          save={save}
          showToast={showToast}
          showConfirm={
            showConfirm as (
              t: string,
              m: string,
              ok: () => void,
              d?: boolean,
            ) => void
          }
        />
      )}

      {tab === "shortcuts" && (
        <Card title="âŒ¨ï¸ Klavye KÄ±sayollarÄ±">
          <p className="text-muted-foreground text-sm">
            UygulamayÄ± daha hÄ±zlÄ± kullanmak iÃ§in aÅŸaÄŸÄ±daki kÄ±sayollarÄ±
            kullanabilirsiniz.
          </p>
          <div className="grid gap-2">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <kbd className="inline-flex items-center rounded-md border border-[var(--border-strong)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--color-warning)] shadow-[0_2px_0_rgba(0,0,0,0.4)]">{s.key}</kbd>
                <span className="text-muted-foreground text-sm">{s.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "repair" && (
        <VeriOnarim
          db={db}
          save={save}
          showToast={showToast}
          showConfirm={
            showConfirm as (
              title: string,
              msg: string,
              onOk: () => void,
              danger?: boolean,
            ) => void
          }
        />
      )}

      {tab === "excel" && <ExcelImport db={db} save={save} />}

      {tab === "categories" && <KategoriYonetim db={db} save={save} />}

      {tab === "data" && (
        <div className="grid gap-4">
          <Card title="ğŸ—„ï¸ Veri Ä°statistikleri">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dataStats.map((d) => (
                <div key={d.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
                  <div className="text-xl mb-1">{d.icon}</div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 900,
                      color: d.count > 0 ? "var(--text-primary)" : "var(--text-dim)"
                    }}
                  >
                    {d.count}
                  </div>
                  <div className="text-[var(--text-dim)] text-xs">{d.label}</div>
                </div>
              ))}
            </div>
            <div className="text-center">
              Toplam{" "}
              <strong className="text-white">{totalRecords}</strong>{" "}
              kayÄ±t Â· localStorage'da saklanÄ±yor
            </div>
          </Card>

          <Card title="ğŸ—‘ï¸ Tehlikeli Alan">
            <p className="text-muted-foreground text-sm">
              AÅŸaÄŸÄ±daki iÅŸlemler{" "}
              <strong className="text-red-400 font-semibold">geri alÄ±namaz</strong>.
              Ã–nce yedek almanÄ±zÄ± ÅŸiddetle tavsiye ederiz.
            </p>
            <div className="grid gap-2.5">
              <DangerAction
                label="SatÄ±ÅŸ GeÃ§miÅŸini Temizle"
                desc={`${db.sales.length} satÄ±ÅŸ kaydÄ± silinecek`}
                onConfirm={() => {
                  save((prev) => ({ ...prev, sales: [] }));
                  showToast("SatÄ±ÅŸ geÃ§miÅŸi temizlendi!");
                }}
              />
              <DangerAction
                label="Kasa Ä°ÅŸlemlerini Temizle"
                desc={`${db.kasa.length} kasa kaydÄ± silinecek`}
                onConfirm={() => {
                  save((prev) => ({ ...prev, kasa: [] }));
                  showToast("Kasa temizlendi!");
                }}
              />
              <DangerAction
                label="Aktivite GÃ¼nlÃ¼ÄŸÃ¼nÃ¼ Temizle"
                desc={`${db._activityLog.length} kayÄ±t silinecek`}
                onConfirm={() => {
                  save((prev) => ({ ...prev, _activityLog: [] }));
                  showToast("Aktivite gÃ¼nlÃ¼ÄŸÃ¼ temizlendi!");
                }}
              />
              <Button onClick={clearData} className="btn-danger w-full py-3 rounded-xl font-bold text-sm">
                â˜ ï¸ TÃœM VERÄ°LERÄ° SÄ°L ve SÄ±fÄ±rla
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "security" && <SecurityPanel showToast={showToast} />}

      {tab === "sysmap" && (
        <div className="grid gap-4">
          <Card title="ğŸ—ºï¸ Sistem HaritasÄ± â€” ModÃ¼ller ArasÄ± Ä°liÅŸkiler">
            <p className="text-muted-foreground text-sm">
              Her modÃ¼lÃ¼n diÄŸer modÃ¼lleri nasÄ±l etkilediÄŸini gÃ¶steren akÄ±ÅŸ
              diyagramÄ±. DÃ¼z Ã§izgi = doÄŸrudan veri etkisi, kesik Ã§izgi = veri
              saÄŸlar.
            </p>
            <SystemMap />
          </Card>
        </div>
      )}

      {tab === "about" && <AboutPanel db={db} />}
      </Tabs>
    </div>
  );
}

function SecurityPanel({
  showToast,
}: {
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const session = getUserSession();

  const handleChange = async () => {
    if (!oldPass) {
      showToast("Mevcut parolayÄ± girin!", "error");
      return;
    }
    if (newPass.length < 4) {
      showToast("Yeni parola en az 4 karakter olmalÄ±!", "error");
      return;
    }
    if (newPass !== newPass2) {
      showToast("Yeni parolalar eÅŸleÅŸmiyor!", "error");
      return;
    }
    if (!session) {
      showToast("Oturum bulunamadÄ±!", "error");
      return;
    }
    setLoading(true);
    const users = await loadUsers();
    const me = users.find((u) => u.id === session.userId);
    if (!me) {
      showToast("KullanÄ±cÄ± bulunamadÄ±!", "error");
      setLoading(false);
      return;
    }
    const oldHash = await hashPass(oldPass);
    if (oldHash !== me.passwordHash) {
      showToast("Mevcut parola yanlÄ±ÅŸ!", "error");
      setOldPass("");
      setLoading(false);
      return;
    }
    const ok = await updateUserPassword(session.userId, newPass);
    if (ok) {
      setOldPass("");
      setNewPass("");
      setNewPass2("");
      showToast("Parola baÅŸarÄ±yla gÃ¼ncellendi!", "success");
    } else {
      showToast("Firebase kayÄ±t hatasÄ±!", "error");
    }
    setLoading(false);
  };

  return (
    <div className="grid gap-4">
      <Card title="ğŸ” Åifremi DeÄŸiÅŸtir">
        <div className="grid gap-3">
          {session && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              ğŸ‘¤ GiriÅŸ yapan: <strong>{session.username}</strong> (
              {session.role === "admin" ? "YÃ¶netici" : "KullanÄ±cÄ±"})
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Mevcut Parola</label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="Mevcut parolanÄ±z"
                className={inpBase} style={{ paddingRight: 44 }}
              />
              <Button
                onClick={() => setShowOld((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-lg"
              >
                {showOld ? "ğŸ™ˆ" : "ğŸ‘ï¸"}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Yeni Parola</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="En az 4 karakter"
                className={inpBase} style={{ paddingRight: 44 }}
              />
              <Button
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-lg"
              >
                {showNew ? "ğŸ™ˆ" : "ğŸ‘ï¸"}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Yeni Parola (Tekrar)</label>
            <input
              type={showNew ? "text" : "password"}
              value={newPass2}
              onChange={(e) => setNewPass2(e.target.value)}
              placeholder="Yeni parolayÄ± tekrar girin"
              className={inpBase}
              onKeyDown={(e) => e.key === "Enter" && handleChange()}
            />
          </div>
          <Button
            onClick={handleChange}
            disabled={loading}
            className="btn-primary w-full py-3 rounded-xl font-bold text-sm"
          >
            {loading ? "â³ DeÄŸiÅŸtiriliyor..." : "ğŸ” ParolayÄ± DeÄŸiÅŸtir"}
          </Button>
        </div>
      </Card>

      {/* YÃ¶netici Paneli â€” sadece admin gÃ¶rÃ¼r */}
      {session?.role === "admin" && <AdminPanel showToast={showToast} />}
    </div>
  );
}

// â”€â”€ YÃ¶netici Paneli â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminPanel({
  showToast,
}: {
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [resetPassId, setResetPassId] = useState<string | null>(null);
  const [resetPassVal, setResetPassVal] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setUsers(await loadUsers());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    if (!newUsername.trim()) {
      showToast("KullanÄ±cÄ± adÄ± gerekli!", "error");
      return;
    }
    if (newPass.length < 4) {
      showToast("Åifre en az 4 karakter!", "error");
      return;
    }
    setSaving(true);
    const result = await createUser(newUsername.trim(), newPass, newRole);
    if (result.ok) {
      showToast(`âœ… ${newUsername} oluÅŸturuldu`, "success");
      setNewUsername("");
      setNewPass("");
      await refresh();
    } else {
      showToast(result.msg, "error");
    }
    setSaving(false);
  };

  const handleToggle = async (
    userId: string,
    username: string,
    active: boolean,
  ) => {
    await toggleUserActive(userId);
    showToast(
      `${username} ${active ? "devre dÄ±ÅŸÄ± bÄ±rakÄ±ldÄ±" : "aktif edildi"}`,
      "info",
    );
    await refresh();
  };

  const handleDelete = async (userId: string, username: string) => {
    if (
      !confirm(
        `"${username}" kullanÄ±cÄ±sÄ±nÄ± silmek istediÄŸinizden emin misiniz?`,
      )
    )
      return;
    await deleteUser(userId);
    showToast(`${username} silindi`, "info");
    await refresh();
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    await updateUserRole(userId, role);
    showToast("Rol gÃ¼ncellendi", "success");
    await refresh();
  };

  const handleResetPass = async (userId: string) => {
    if (resetPassVal.length < 4) {
      showToast("Åifre en az 4 karakter!", "error");
      return;
    }
    await updateUserPassword(userId, resetPassVal);
    showToast("Åifre sÄ±fÄ±rlandÄ±", "success");
    setResetPassId(null);
    setResetPassVal("");
    await refresh();
  };

  const roleColors: Record<UserRole, string> = {
    admin: "#f59e0b",
    user: "#60a5fa",
  };

  return (
    <Card title="ğŸ‘¥ KullanÄ±cÄ± YÃ¶netimi">
      {/* Yeni kullanÄ±cÄ± ekle */}
      <div className="bg-[var(--bg-card)] rounded-xl p-4 mb-4">
        <div className="text-sm font-semibold text-foreground mb-3">â• Yeni KullanÄ±cÄ± Ekle</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">KullanÄ±cÄ± AdÄ± *</label>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="kullanici_adi"
              className={inpBase}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Åifre *</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Min. 4 karakter"
              className={inpBase}
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Rol</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className={inpBase}
            >
              <option value="user">ğŸ‘¤ KullanÄ±cÄ±</option>
              <option value="admin">â­ YÃ¶netici</option>
            </select>
          </div>
          <Button
            onClick={handleCreate}
            disabled={saving}
            className="btn-primary flex-1 py-3 rounded-xl font-bold text-sm"
          >
            {saving ? "..." : "â• Ekle"}
          </Button>
        </div>
      </div>

      {/* KullanÄ±cÄ± listesi */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">YÃ¼kleniyor...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">KullanÄ±cÄ± bulunamadÄ±</div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                background: "var(--bg-card)",
                borderRadius: 12,
                padding: "12px 14px",
                border: `1px solid ${u.active ? "rgba(255,255,255,0.06)" : "rgba(239,68,68,0.15)"}`,
                opacity: u.active ? 1 : 0.6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: resetPassId === u.id ? 10 : 0,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `${roleColors[u.role]}20`,
                    border: `2px solid ${roleColors[u.role]}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  {u.role === "admin" ? "â­" : "ğŸ‘¤"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground text-sm font-semibold">{u.username}</div>
                  <div className="text-[var(--text-dim)] text-xs">
                    {u.lastLogin
                      ? `Son giriÅŸ: ${new Date(u.lastLogin).toLocaleString("tr-TR")}`
                      : "HiÃ§ giriÅŸ yapÄ±lmadÄ±"}
                  </div>
                </div>
                {/* Rol seÃ§ici */}
                <select
                  value={u.role}
                  onChange={(e) =>
                    handleRoleChange(u.id, e.target.value as UserRole)
                  }
                  style={{
                    padding: "4px 8px",
                    background: `${roleColors[u.role]}15`,
                    border: `1px solid ${roleColors[u.role]}30`,
                    borderRadius: 7,
                    color: roleColors[u.role],
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <option value="user">KullanÄ±cÄ±</option>
                  <option value="admin">YÃ¶netici</option>
                </select>
                {/* Åifre sÄ±fÄ±rla */}
                <Button
                  onClick={() => {
                    setResetPassId(resetPassId === u.id ? null : u.id);
                    setResetPassVal("");
                  }}
                  title="Åifre SÄ±fÄ±rla"
                  className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                >
                  ğŸ”‘
                </Button>
                {/* Aktif/Pasif */}
                <Button
                  onClick={() => handleToggle(u.id, u.username, u.active)}
                  title={u.active ? "Devre DÄ±ÅŸÄ± BÄ±rak" : "Aktif Et"}
                  style={{
                    padding: "5px 9px",
                    background: u.active
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(239,68,68,0.1)",
                    border: `1px solid ${u.active ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    borderRadius: 8,
                    color: u.active ? "var(--color-success)" : "var(--color-danger)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  {u.active ? "âœ“" : "âœ•"}
                </Button>
                {/* Sil */}
                <Button
                  onClick={() => handleDelete(u.id, u.username)}
                  title="KullanÄ±cÄ±yÄ± Sil"
                  className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs"
                >
                  ğŸ—‘ï¸
                </Button>
              </div>
              {/* Åifre sÄ±fÄ±rlama alanÄ± */}
              {resetPassId === u.id && (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={resetPassVal}
                    onChange={(e) => setResetPassVal(e.target.value)}
                    placeholder="Yeni ÅŸifre (min 4 karakter)"
                    className={`${inpBase} flex-1`}
                    autoFocus
                  />
                  <Button
                    onClick={() => handleResetPass(u.id)}
                    className="px-3 py-2 rounded-lg font-bold text-sm bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                  >
                    Kaydet
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SoundSettingsPanel({
  playSound,
}: {
  playSound: (type: SoundType) => void;
}) {
  const [settings, setSettings] = useState<SoundSettings>(loadSoundSettings);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(() => {
    try {
      const d = JSON.parse(localStorage.getItem("sobaYonetim") || "{}");
      return d.soundSettings?.speechEnabled !== false;
    } catch {
      logger.warn('settings', 'Ses ayarları okunamadı, varsayılan true');
      return true;
    }
  });

  const updateSettings = (patch: Partial<SoundSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSoundSettingsToStorage(next);
  };

  const toggleSpeech = () => {
    const next = !speechEnabled;
    setSpeechEnabled(next);
    const key = "sobaYonetim";
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : {};
    data.soundSettings = { ...(data.soundSettings || {}), speechEnabled: next };
    localStorage.setItem(key, JSON.stringify(data));
    if (next && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance("Sesli bildirim aktif edildi");
      u.lang = "tr-TR";
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    }
  };

  const themes: { id: SoundTheme; label: string; desc: string }[] = [
    { id: "standart", label: "ğŸµ Standart", desc: "Dengeli ve sade sesler" },
    { id: "minimal", label: "ğŸ”‡ Minimal", desc: "KÄ±sa ve hafif sesler" },
    { id: "yogun", label: "ğŸ”Š YoÄŸun", desc: "Belirgin ve gÃ¼Ã§lÃ¼ sesler" },
  ];

  const soundTypes: { type: SoundType; label: string }[] = [
    { type: "success", label: "âœ… BaÅŸarÄ±" },
    { type: "error", label: "âŒ Hata" },
    { type: "warning", label: "âš ï¸ UyarÄ±" },
    { type: "sale", label: "ğŸ›’ SatÄ±ÅŸ" },
    { type: "notification", label: "ğŸ”” Bildirim" },
  ];

  return (
    <div className="grid gap-4">
      <Card title="ğŸ”Š Ses AyarlarÄ±">
        <div className="grid gap-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-foreground text-sm">Sesli Geri Bildirim</div>
              <div className="text-muted-foreground text-xs">
                Ä°ÅŸlem seslerini aÃ§Ä±n veya kapatÄ±n
              </div>
            </div>
            <Button
              onClick={() => updateSettings({ enabled: !settings.enabled })}
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                position: "relative",
                background: settings.enabled ? "var(--color-success)" : "var(--text-dim)",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--bg-elevated)",
                  position: "absolute",
                  top: 4,
                  left: settings.enabled ? 28 : 4,
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              />
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Ses Seviyesi</label>
              <span className="text-foreground text-sm">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) =>
                updateSettings({ volume: parseFloat(e.target.value) })
              }
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--border)] accent-[var(--color-primary)]"
              disabled={!settings.enabled}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Ses TemasÄ±</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {themes.map((t) => (
                <Button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id })}
                  disabled={!settings.enabled}
                  style={{
                    padding: "12px 10px",
                    border: `2px solid ${settings.theme === t.id ? "#ff5722" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    background:
                      settings.theme === t.id
                        ? "rgba(255,87,34,0.1)"
                        :                 "var(--bg-card)",
                    color: settings.theme === t.id ? "var(--color-danger)" : "var(--text-muted)",
                    textAlign: "center",
                    transition: "all 0.15s",
                    opacity: settings.enabled ? 1 : 0.5,
                  }}
                >
                  <div className="text-foreground text-sm font-semibold">{t.label}</div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      marginTop: 4,
                      color: settings.theme === t.id ? "var(--color-danger)" : "var(--text-dim)",
                    }}
                  >
                    {t.desc}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="ğŸ—£ï¸ Sesli KonuÅŸma (TTS)">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-foreground text-sm">Sesli Bildirim</div>
              <div className="text-muted-foreground text-xs">
                Hata ve uyarÄ±larda sesli konuÅŸma
              </div>
            </div>
            <Button
              onClick={toggleSpeech}
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                position: "relative",
                background: speechEnabled ? "var(--color-success)" : "var(--text-dim)",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--bg-elevated)",
                  position: "absolute",
                  top: 4,
                  left: speechEnabled ? 28 : 4,
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              />
            </Button>
          </div>
          <Button
            onClick={() => {
              if ("speechSynthesis" in window) {
                const u = new SpeechSynthesisUtterance(
                  "Merhaba! Bu bir test konuÅŸmasÄ±dÄ±r. Ã–nemli bildirimlerde sesli uyarÄ± alacaksÄ±nÄ±z.",
                );
                u.lang = "tr-TR";
                u.rate = 1.05;
                window.speechSynthesis.speak(u);
              }
            }}
            className="px-3 py-2 rounded-xl font-bold text-sm border border-[var(--button-outline)]"
          >
            ğŸ—£ï¸ Test KonuÅŸma
          </Button>
        </div>
      </Card>

      <Card title="ğŸ§ Sesleri Dinle">
        <p className="text-muted-foreground text-sm">
          Her ses tipini aÅŸaÄŸÄ±dan test edebilirsiniz.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {soundTypes.map((s) => (
            <Button
              key={s.type}
              onClick={() => playSound(s.type)}
              disabled={!settings.enabled}
              style={{
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: 10,
                cursor: "pointer",
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.85rem",
                transition: "all 0.15s",
                opacity: settings.enabled ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (settings.enabled)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,87,34,0.1)";
              }}
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(0,0,0,0.3)")
              }
            >
              {s.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// AgentSettingsPanel â€” ÅŸu an kullanÄ±lmÄ±yor, gerektiÄŸinde eklenebilir

function ExcelExportPanel({ db }: { db: DB }) {
  const { showToast } = useToast();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sheets, setSheets] = useState({
    stok: true,
    satislar: true,
    cari: true,
    kasa: true,
  });

  type SheetKey = keyof typeof sheets;

  const toggleSheet = (key: SheetKey) =>
    setSheets((s) => ({ ...s, [key]: !s[key] }));

  const handleExport = () => {
    const selectedSheets = (Object.keys(sheets) as SheetKey[]).filter(
      (k) => sheets[k],
    ) as ("stok" | "satislar" | "cari" | "kasa")[];
    if (selectedSheets.length === 0) {
      showToast("En az bir sekme seÃ§in!", "warning");
      return;
    }
    try {
      exportToExcel(db, {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sheets: selectedSheets,
      });
      showToast(
        `Excel dosyasÄ± oluÅŸturuldu! (${selectedSheets.length} sekme)`,
        "success",
      );
    } catch {
      logger.warn('settings', 'Excel oluşturulamadı');
      showToast("Excel oluÅŸturulamadÄ±!", "error");
    }
  };

  const sheetDefs: {
    key: SheetKey;
    label: string;
    icon: string;
    count: number;
  }[] = [
    {
      key: "stok",
      label: "Stok / ÃœrÃ¼nler",
      icon: "ğŸ“¦",
      count: db.products.length,
    },
    { key: "satislar", label: "SatÄ±ÅŸlar", icon: "ğŸ›’", count: db.sales.length },
    { key: "cari", label: "Cari Hesaplar", icon: "ğŸ‘¤", count: db.cari.length },
    { key: "kasa", label: "Kasa Ä°ÅŸlemleri", icon: "ğŸ’°", count: db.kasa.length },
  ];

  return (
    <div className="grid gap-4">
      <Card title="ğŸ“Š Excel DÄ±ÅŸa Aktarma">
        <p className="text-muted-foreground text-sm">
          SeÃ§tiÄŸiniz veri gruplarÄ±nÄ± TÃ¼rkÃ§e baÅŸlÄ±klÄ±, tarih ve para birimi
          formatlarÄ±yla{" "}
          <strong className="text-green-400 font-semibold">.xlsx</strong> dosyasÄ±na
          aktarÄ±n.
        </p>

        <div className="mb-4">
          <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">
            Tarih AralÄ±ÄŸÄ± (SatÄ±ÅŸ ve Kasa iÃ§in)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label style={{ ...lbl, fontSize: "0.78rem" }}>BaÅŸlangÄ±Ã§</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inpBase}
              />
            </div>
            <div>
              <label style={{ ...lbl, fontSize: "0.78rem" }}>BitiÅŸ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inpBase}
              />
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Dahil Edilecek Sayfalar</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sheetDefs.map((s) => (
              <div
                key={s.key}
                onClick={() => toggleSheet(s.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: sheets[s.key]
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(0,0,0,0.2)",
                  border: `2px solid ${sheets[s.key] ? "#10b981" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span className="text-lg">{s.icon}</span>
                <div className="flex-1">
                  <div
                    style={{
                      fontWeight: 600,
                      color: sheets[s.key] ? "var(--text-primary)" : "var(--text-muted)",
                      fontSize: "0.88rem",
                    }}
                  >
                    {s.label}
                  </div>
                  <div className="text-[var(--text-dim)] text-xs">{s.count} kayÄ±t</div>
                </div>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: sheets[s.key]
                      ? "var(--color-success)"
                      : "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-primary)",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  {sheets[s.key] ? "âœ“" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleExport}
          className="btn-primary btn-green w-full py-3 rounded-xl font-bold text-sm"
        >
          ğŸ“Š Excel DosyasÄ±nÄ± Ä°ndir (.xlsx)
        </Button>
      </Card>
    </div>
  );
}

function ActivityPanel({
  db,
  save,
  showToast,
  showConfirm,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
}) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const activityLog = [...(db._activityLog || [])].sort(
    (a, b) =>
      new Date(b.time || b.createdAt || "").getTime() -
      new Date(a.time || a.createdAt || "").getTime(),
  );

  const actionTypes = Array.from(
    new Set(
      activityLog.map((a) => {
        const parts = a.action.split(":");
        return parts[0].trim();
      }),
    ),
  ).slice(0, 15);

  let filtered = activityLog;
  if (typeFilter !== "all")
    filtered = filtered.filter((a) => a.action.startsWith(typeFilter));
  if (dateFilter)
    filtered = filtered.filter((a) => (a.time || "").startsWith(dateFilter));

  const getIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes("satÄ±ÅŸ") || a.includes("satis")) return "ğŸ›’";
    if (a.includes("Ã¼rÃ¼n") || a.includes("urun") || a.includes("stok"))
      return "ğŸ“¦";
    if (a.includes("kasa") || a.includes("gelir") || a.includes("gider"))
      return "ğŸ’°";
    if (a.includes("cari") || a.includes("mÃ¼ÅŸteri")) return "ğŸ‘¤";
    if (a.includes("fatura")) return "ğŸ§¾";
    if (a.includes("sipariÅŸ")) return "ğŸ“‹";
    if (a.includes("sil") || a.includes("iptal")) return "ğŸ—‘ï¸";
    return "ğŸ“";
  };

  const clearLog = () => {
    showConfirm(
      "Aktivite GÃ¼nlÃ¼ÄŸÃ¼nÃ¼ Temizle",
      `${db._activityLog.length} kayÄ±t silinecek. Devam edilsin mi?`,
      () => {
        save((prev) => ({ ...prev, _activityLog: [] }));
        showToast("Aktivite gÃ¼nlÃ¼ÄŸÃ¼ temizlendi!");
      },
      true,
    );
  };

  return (
    <Card title="ğŸ“‹ Aktivite GÃ¼nlÃ¼ÄŸÃ¼">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={inpBase} style={{ width: 160 }}
          placeholder="Tarih filtrele"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`${inpBase} flex-1`}
        >
          <option value="all">TÃ¼m Ä°ÅŸlemler</option>
          {actionTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {dateFilter && (
          <Button
            onClick={() => setDateFilter("")}
            className="px-3 py-2 rounded-lg font-medium text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          >
            âœ• Tarih
          </Button>
        )}
        <Button onClick={clearLog} className="btn-danger-outline px-3 py-2 rounded-lg font-bold text-xs border border-red-500/30">
          ğŸ—‘ï¸ Temizle
        </Button>
      </div>

      <div className="text-[var(--text-dim)] text-xs">
        {filtered.length} kayÄ±t (toplam {activityLog.length})
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <div className="text-3xl mb-2">ğŸ“‹</div>
            <p>Aktivite bulunamadÄ±</p>
          </div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="flex items-start gap-2">
              <div className="text-lg w-8 h-8 flex items-center justify-center">
                {getIcon(a.action)}
              </div>
              <div className="flex-1">
                <div className="text-foreground text-xs">{a.action}</div>
                {a.detail && (
                  <div className="text-muted-foreground text-xs">{a.detail}</div>
                )}
              </div>
              <div className="text-[var(--text-dim)] text-xs">
                {formatDate(a.time || a.createdAt || "")}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

const RESTORE_SECTIONS = [
  { key: "products", label: "ÃœrÃ¼nler", icon: "ğŸ“¦" },
  { key: "sales", label: "SatÄ±ÅŸlar", icon: "ğŸ›’" },
  { key: "suppliers", label: "TedarikÃ§iler", icon: "ğŸ­" },
  { key: "cari", label: "Cari Hesaplar", icon: "ğŸ‘¤" },
  { key: "kasa", label: "Kasa Ä°ÅŸlemleri", icon: "ğŸ’°" },
  { key: "bankTransactions", label: "Banka Ä°ÅŸlemleri", icon: "ğŸ¦" },
  { key: "invoices", label: "Faturalar", icon: "ğŸ§¾" },
  { key: "orders", label: "SipariÅŸler", icon: "ğŸ“‹" },
  { key: "stockMovements", label: "Stok Hareketleri", icon: "ğŸ“Š" },
  { key: "peletSuppliers", label: "Pelet TedarikÃ§i", icon: "ğŸªµ" },
  { key: "peletOrders", label: "Pelet SipariÅŸ", icon: "ğŸªµ" },
  { key: "boruSuppliers", label: "Boru TedarikÃ§i", icon: "ğŸ”©" },
  { key: "boruOrders", label: "Boru SipariÅŸ", icon: "ğŸ”©" },
  { key: "budgets", label: "BÃ¼tÃ§e", icon: "ğŸ“Š" },
  { key: "returns", label: "Ä°adeler", icon: "â†©ï¸" },
  { key: "company", label: "Åirket Bilgileri", icon: "ğŸ¢", isObject: true },
  {
    key: "pelletSettings",
    label: "Pelet AyarlarÄ±",
    icon: "âš™ï¸",
    isObject: true,
  },
] as const;

// â”€â”€ Tam Geri YÃ¼kleme Paneli â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FullRestorePanel({
  showToast,
  showConfirm,
  save,
  db,
}: {
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
  save: (fn: (prev: DB) => DB) => void;
  db: DB;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastReport, setLastReport] = useState<RestoreReport | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";

    showConfirm(
      "âš ï¸ Tam Geri YÃ¼kleme",
      `"${file.name}" dosyasÄ±ndaki veriler yÃ¼kleniyor. Mevcut tÃ¼m veriler bu yedekle deÄŸiÅŸtirilecek. Ã–nceki veri otomatik yedeklenir. Devam edilsin mi?`,
      () => {
        // Ã–nce mevcut veriyi yedekle
        saveBackupToFirebase(
          db,
          `onceki_${new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-")}`,
        ).catch(() =>
          logger.error("db", "Tam geri yÃ¼kleme Ã¶ncesi yedek alÄ±namadÄ±"),
        );

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const raw = JSON.parse(ev.target?.result as string) as DB;
            // fullRestoreDB'yi doÄŸrudan import etmek yerine save iÃ§inde Ã§aÄŸÄ±rÄ±yoruz
            save((prev) => {
              // makeDefaultDB'ye eriÅŸim yok burada â€” prev'i default olarak kullan
              const def = { ...prev };
              // Temel yapÄ±yÄ± koru, yedekteki veriyi Ã¼zerine yaz
              const merged: DB = { ...def, ...raw };
              // Zorunlu array alanlarÄ±
              const arrayKeys = [
                "products",
                "sales",
                "suppliers",
                "orders",
                "cari",
                "kasa",
                "bankTransactions",
                "matchRules",
                "monitorRules",
                "monitorLog",
                "stockMovements",
                "peletSuppliers",
                "peletOrders",
                "boruSuppliers",
                "boruOrders",
                "invoices",
                "budgets",
                "returns",
                "_activityLog",
                "ortakEmanetler",
                "installments",
                "partners",
                "notes",
              ] as const;
              for (const key of arrayKeys) {
                if (!Array.isArray(merged[key]))
                  (merged as unknown as Record<string, unknown>)[key] = [];
              }
              if (!merged.kasalar || merged.kasalar.length === 0)
                merged.kasalar = def.kasalar;
              if (!merged.company || typeof merged.company !== "object")
                merged.company = def.company;
              if (!merged.pelletSettings)
                merged.pelletSettings = def.pelletSettings;
              if (
                !Array.isArray(merged.productCategories) ||
                merged.productCategories.length === 0
              )
                merged.productCategories = def.productCategories;
              return merged;
            });

            const report: RestoreReport = {
              added: 0,
              skippedDuplicate: 0,
              skippedInvalidName: 0,
              skippedMissingField: 0,
              warnings: [],
            };
            // Ad kalite kontrolÃ¼ raporu
            (raw.cari || []).forEach((c: { name?: unknown }) => {
              if (
                typeof c.name !== "string" ||
                c.name.trim().length < 2 ||
                /^\d+$/.test(c.name.trim())
              ) {
                report.skippedInvalidName++;
                report.warnings.push(
                  `Cari gizlendi: "${c.name}" â€” geÃ§ersiz ad`,
                );
              }
            });
            (raw.products || []).forEach((p: { name?: unknown }) => {
              if (
                typeof p.name !== "string" ||
                p.name.trim().length < 2 ||
                /^\d+$/.test(p.name.trim())
              ) {
                report.skippedInvalidName++;
                report.warnings.push(
                  `ÃœrÃ¼n gizlendi: "${p.name}" â€” geÃ§ersiz ad`,
                );
              }
            });
            setLastReport(report);

            const msg =
              report.skippedInvalidName > 0
                ? `âœ… Geri yÃ¼kleme tamamlandÄ±. ${report.skippedInvalidName} geÃ§ersiz kayÄ±t gizlendi.`
                : "âœ… Tam geri yÃ¼kleme baÅŸarÄ±lÄ±! Ã–nceki veri yedeklendi.";
            showToast(msg, "success");
            setTimeout(() => window.location.reload(), 1800);
          } catch {
            logger.warn('settings', 'Yedek dosyası okunamadı veya geçersiz format');
            showToast("Dosya okunamadÄ± veya geÃ§ersiz format!", "error");
          }
        };
        reader.readAsText(file);
      },
      true,
    );
  };

  return (
    <Card title="ğŸ”„ Tam Geri YÃ¼kleme">
      <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
        <strong>Dikkat:</strong> Mevcut tÃ¼m veriler yedekteki verilerle
        deÄŸiÅŸtirilir. Ä°ÅŸlem Ã¶ncesi otomatik yedek alÄ±nÄ±r. Yedekten gelen
        geÃ§ersiz adlÄ± kayÄ±tlar (boÅŸ, tek haneli, sadece sayÄ±) gizlenir.
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleFile}
        className="hidden"
      />
      <Button
        onClick={() => fileRef.current?.click()}
        className="btn-danger-dashed w-full py-3 rounded-xl font-bold text-sm border-2 border-dashed border-red-500/30 bg-red-500/10"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(239,68,68,0.15)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(239,68,68,0.08)";
        }}
      >
        ğŸ“‚ JSON Yedek DosyasÄ± SeÃ§ â€” Tam Geri YÃ¼kle
      </Button>

      {lastReport && lastReport.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
          <div className="text-amber-400 font-bold text-sm">
            âš ï¸ Gizlenen KayÄ±tlar
          </div>
          {lastReport.warnings.map((w, i) => (
            <div key={i} className="text-muted-foreground text-sm">
              â€¢ {w}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SelectiveRestore({
  showToast,
  showConfirm,
  save,
  db,
}: {
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
  save: (fn: (prev: DB) => DB) => void;
  db: DB;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [fileName, setFileName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [available, setAvailable] = useState<
    {
      key: string;
      label: string;
      icon: string;
      count: number;
      isObject?: boolean;
    }[]
  >([]);
  const [lastReport, setLastReport] = useState<RestoreReport | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== "object" || Array.isArray(data)) {
          showToast("GeÃ§ersiz JSON formatÄ±!", "error");
          return;
        }
        setFileData(data);
        const avail: typeof available = [];
        RESTORE_SECTIONS.forEach((s) => {
          const val = data[s.key];
          if (s.key === "company" || s.key === "pelletSettings") {
            if (val && typeof val === "object" && !Array.isArray(val)) {
              avail.push({
                key: s.key,
                label: s.label,
                icon: s.icon,
                count: 1,
                isObject: true,
              });
            }
          } else if (Array.isArray(val) && val.length > 0) {
            avail.push({
              key: s.key,
              label: s.label,
              icon: s.icon,
              count: val.length,
            });
          }
        });
        setAvailable(avail);
        setSelected(new Set(avail.map((a) => a.key)));
      } catch {
        logger.warn('settings', 'JSON ayrıştırılamadı');
        showToast("JSON ayrÄ±ÅŸtÄ±rÄ±lamadÄ±!", "error");
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const toggleSection = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(available.map((a) => a.key)));
  const selectNone = () => setSelected(new Set());

  const doRestore = () => {
    if (!fileData || selected.size === 0) return;
    const selCount = available
      .filter((a) => selected.has(a.key))
      .reduce((s, a) => s + a.count, 0);
    showConfirm(
      "SeÃ§imli Geri YÃ¼kleme",
      `${selected.size} bÃ¶lÃ¼m (${selCount} kayÄ±t) iÅŸlenecek. Mevcut ID'ler korunur, geÃ§ersiz adlar atlanÄ±r. Devam edilsin mi?`,
      () => {
        try {
          // Geri yÃ¼kleme Ã¶ncesi mevcut veriyi otomatik yedekle
          const preLabel = `onceki_${new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-")}`;
          saveBackupToFirebase(db, preLabel).catch(() =>
            logger.error("db", "SeÃ§imli geri yÃ¼kleme Ã¶ncesi yedek alÄ±namadÄ±"),
          );

          // AkÄ±llÄ± birleÅŸtirme â€” ID kontrolÃ¼ + ad kalite kontrolÃ¼
          const { db: mergedDb, report } = mergeRestoreDB(
            db,
            fileData as Partial<DB>,
            selected,
          );
          setLastReport(report);

          save(() => mergedDb);

          const msg = [
            `âœ… ${report.added} kayÄ±t eklendi.`,
            report.skippedDuplicate > 0
              ? `${report.skippedDuplicate} tekrar (ID Ã§akÄ±ÅŸmasÄ±) atlandÄ±.`
              : "",
            report.skippedInvalidName > 0
              ? `${report.skippedInvalidName} geÃ§ersiz adlÄ± kayÄ±t atlandÄ±.`
              : "",
            report.skippedMissingField > 0
              ? `${report.skippedMissingField} eksik alanlÄ± kayÄ±t atlandÄ±.`
              : "",
          ]
            .filter(Boolean)
            .join(" ");

          showToast(
            msg,
            report.skippedInvalidName > 0 || report.skippedMissingField > 0
              ? "info"
              : "success",
          );
          setTimeout(() => window.location.reload(), 2000);
        } catch {
          logger.warn('settings', 'Geri yükleme sırasında hata oluştu');
          showToast("Geri yÃ¼kleme sÄ±rasÄ±nda hata oluÅŸtu!", "error");
        }
      },
      true,
    );
  };

  const reset = () => {
    setFileData(null);
    setFileName("");
    setSelected(new Set());
    setAvailable([]);
    setLastReport(null);
  };

  return (
    <Card title="ğŸ“‚ SeÃ§imli Geri YÃ¼kleme">
      <p className="text-muted-foreground text-sm">
        Yedek dosyanÄ±zdan{" "}
        <strong className="text-orange-400 font-semibold">
          istediÄŸiniz bÃ¶lÃ¼mleri seÃ§erek
        </strong>{" "}
        geri yÃ¼kleyin. TÃ¼m veriyi deÄŸiÅŸtirmek zorunda deÄŸilsiniz.
      </p>

      {!fileData ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-3 rounded-xl font-bold text-sm border-2 border-dashed border-blue-500/30 bg-blue-500/10 w-full"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(59,130,246,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(59,130,246,0.08)";
            }}
          >
            JSON Yedek DosyasÄ± SeÃ§
          </Button>
        </>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-[10px] p-3">
            <span className="text-green-400 text-lg">ğŸ“„</span>
            <span className="text-green-400 font-bold">{fileName}</span>
            <span className="text-muted-foreground text-xs">
              {available.length} bÃ¶lÃ¼m bulundu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-semibold">
              Geri YÃ¼klenecek BÃ¶lÃ¼mler:
            </span>
            <Button onClick={selectAll} className="px-3 py-1.5 rounded-lg font-bold text-xs">
              TÃ¼mÃ¼nÃ¼ SeÃ§
            </Button>
            <Button onClick={selectNone} className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs">
              HiÃ§birini SeÃ§me
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {available.map((section) => {
              const isSelected = selected.has(section.key);
              return (
                <div
                  key={section.key}
                  onClick={() => toggleSection(section.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: isSelected
                      ? "rgba(59,130,246,0.08)"
                      : "rgba(0,0,0,0.2)",
                    border: `1px solid ${isSelected ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.04)"}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isSelected
                        ? "var(--color-info)"
                        : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isSelected ? "#3b82f6" : "rgba(255,255,255,0.12)"}`,
                      color: "var(--text-primary)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected ? "âœ“" : ""}
                  </div>
                  <span className="text-base">{section.icon}</span>
                  <div className="flex-1">
                    <div
                      style={{
                        color: isSelected ? "var(--text-primary)" : "var(--text-muted)",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                      }}
                    >
                      {section.label}
                    </div>
                    <div className="text-[var(--text-dim)] text-sm">
                      {section.isObject ? "Ayarlar" : `${section.count} kayÄ±t`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected.size > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              Mevcut ID'ler korunur. GeÃ§ersiz adlar (boÅŸ, tek haneli, sadece
              sayÄ±) ve zorunlu alanÄ± eksik kayÄ±tlar atlanÄ±r.
            </div>
          )}

          {lastReport && lastReport.warnings.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-red-400 font-bold text-sm">
                âš ï¸ Atlanan KayÄ±tlar (
                {lastReport.skippedDuplicate +
                  lastReport.skippedInvalidName +
                  lastReport.skippedMissingField}
                )
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {lastReport.skippedDuplicate > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-blue-500/20 text-blue-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    ğŸ” {lastReport.skippedDuplicate} tekrar ID
                  </span>
                )}
                {lastReport.skippedInvalidName > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-red-500/20 text-red-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    âœ— {lastReport.skippedInvalidName} geÃ§ersiz ad
                  </span>
                )}
                {lastReport.skippedMissingField > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    âš  {lastReport.skippedMissingField} eksik alan
                  </span>
                )}
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {lastReport.warnings.map((w, i) => (
                  <div key={i} className="text-muted-foreground text-sm">
                    â€¢ {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {selected.size > 0 && (
              <Button onClick={doRestore} className="px-3 py-2.5 rounded-xl font-bold text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex-1">
                {selected.size} BÃ¶lÃ¼mÃ¼ Geri YÃ¼kle
              </Button>
            )}
            <Button onClick={reset} className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30">
              SÄ±fÄ±rla
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

const KNOWN_ARRAYS: Record<string, string> = {
  products: "ÃœrÃ¼nler",
  sales: "SatÄ±ÅŸlar",
  suppliers: "TedarikÃ§iler",
  cari: "Cari MÃ¼ÅŸteriler",
  kasa: "Kasa Hareketleri",
  bankTransactions: "Banka Ä°ÅŸlemleri",
  orders: "SipariÅŸler",
  invoices: "Faturalar",
  stockMovements: "Stok Hareketleri",
  peletSuppliers: "Pelet TedarikÃ§i",
  peletOrders: "Pelet SipariÅŸ",
  boruSuppliers: "Boru TedarikÃ§i",
  boruOrders: "Boru SipariÅŸ",
  budgets: "BÃ¼tÃ§e",
  returns: "Ä°adeler",
  ortakEmanetler: "Ortak Emanet",
  installments: "Taksitler",
};

const LEGACY_FIELD_MAP: Record<string, string> = {
  urunler: "products",
  satislar: "sales",
  tedarikci: "suppliers",
  musteriler: "cari",
  kasaHareketleri: "kasa",
  bankHareketleri: "bankTransactions",
  siparisler: "orders",
  faturalar: "invoices",
  stokHareketleri: "stockMovements",
  stoklar: "products",
  musteri: "cari",
  tedarikcilar: "suppliers",
  kasaIslemleri: "kasa",
};

type ConflictResolution = "overwrite" | "skip" | "merge";

interface ConflictInfo {
  entity: string;
  label: string;
  byId: number;
  byName: number;
  total: number;
}

const CSV_COLUMN_MAP: Record<string, { target: string; field: string }> = {
  müşteri: { target: "cari", field: "name" },
  musteri: { target: "cari", field: "name" },
  "mÃ¼ÅŸteri adÄ±": { target: "cari", field: "name" },
  ad: { target: "cari", field: "name" },
  isim: { target: "cari", field: "name" },
  "ad soyad": { target: "cari", field: "name" },
  telefon: { target: "cari", field: "phone" },
  tel: { target: "cari", field: "phone" },
  adres: { target: "cari", field: "address" },
  bakiye: { target: "cari", field: "balance" },
  borç: { target: "cari", field: "balance" },
  borc: { target: "cari", field: "balance" },
  tarih: { target: "_date", field: "createdAt" },
  date: { target: "_date", field: "createdAt" },
  tutar: { target: "_amount", field: "amount" },
  toplam: { target: "_amount", field: "total" },
  fiyat: { target: "_amount", field: "price" },
  ürün: { target: "products", field: "name" },
  urun: { target: "products", field: "name" },
  "ürün adı": { target: "products", field: "name" },
  stok: { target: "products", field: "stock" },
  maliyet: { target: "products", field: "cost" },
  "satış fiyatı": { target: "products", field: "price" },
  kategori: { target: "_category", field: "category" },
  açıklama: { target: "_desc", field: "description" },
  aciklama: { target: "_desc", field: "description" },
  not: { target: "_desc", field: "note" },
  "e-posta": { target: "cari", field: "email" },
  email: { target: "cari", field: "email" },
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split(/[,;\t]/)
    .map((h) => h.trim().replace(/^["']|["']$/g, ""));
  return lines
    .slice(1)
    .map((line) => {
      const values = line
        .split(/[,;\t]/)
        .map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || "";
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v !== ""));
}

interface CsvColumnMapping {
  csvColumn: string;
  targetEntity: string;
  targetField: string;
  autoDetected: boolean;
}

function detectCsvColumns(headers: string[]): CsvColumnMapping[] {
  return headers.map((h) => {
    const lower = h.toLowerCase().trim();
    const match = CSV_COLUMN_MAP[lower];
    if (match) {
      return {
        csvColumn: h,
        targetEntity: match.target,
        targetField: match.field,
        autoDetected: true,
      };
    }
    for (const [key, val] of Object.entries(CSV_COLUMN_MAP)) {
      if (lower.includes(key)) {
        return {
          csvColumn: h,
          targetEntity: val.target,
          targetField: val.field,
          autoDetected: true,
        };
      }
    }
    return {
      csvColumn: h,
      targetEntity: "",
      targetField: "",
      autoDetected: false,
    };
  });
}

function SmartImportManager({
  db,
  save: _save,
  showToast,
  showConfirm,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<
    "idle" | "mapping" | "csvMapping" | "preview" | "done"
  >("idle");
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);
  const [mapped, setMapped] = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [resolutions, setResolutions] = useState<
    Record<string, ConflictResolution>
  >({});
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    {},
  );
  const [unknownFields, setUnknownFields] = useState<string[]>([]);
  const [legacyMapped, setLegacyMapped] = useState<Record<string, string>>({});
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvMappings, setCsvMappings] = useState<CsvColumnMapping[]>([]);
  const [csvTarget, setCsvTarget] = useState<string>("cari");

  const detectFieldMappings = (data: Record<string, unknown>) => {
    const unknown: string[] = [];
    const autoMapped: Record<string, string> = {};
    const knownAll = new Set([
      ...Object.keys(KNOWN_ARRAYS),
      "_version",
      "company",
      "settings",
      "pelletSettings",
      "kasalar",
      "matchRules",
      "monitorRules",
      "monitorLog",
      "_activityLog",
      "soundSettings",
    ]);

    Object.keys(data).forEach((key) => {
      if (!knownAll.has(key)) {
        if (LEGACY_FIELD_MAP[key]) {
          autoMapped[key] = LEGACY_FIELD_MAP[key];
        } else {
          unknown.push(key);
        }
      }
    });
    return { unknown, autoMapped };
  };

  const applyMappings = (
    data: Record<string, unknown>,
    mappings: Record<string, string>,
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = { ...data };
    Object.entries(mappings).forEach(([src, dst]) => {
      if (dst && dst !== "" && result[src] !== undefined) {
        if (!result[dst] || !Array.isArray(result[dst])) {
          result[dst] = result[src];
        } else if (Array.isArray(result[dst]) && Array.isArray(result[src])) {
          result[dst] = [
            ...(result[dst] as unknown[]),
            ...(result[src] as unknown[]),
          ];
        }
        delete result[src];
      }
    });
    return result;
  };

  const detectConflicts = (data: Record<string, unknown>): ConflictInfo[] => {
    const checks: Array<{
      entity: string;
      label: string;
      dbItems: { id?: string; name?: string; code?: string }[];
      importKey: string;
    }> = [
      {
        entity: "products",
        label: "ÃœrÃ¼n",
        dbItems: db.products,
        importKey: "products",
      },
      {
        entity: "sales",
        label: "SatÄ±ÅŸ",
        dbItems: db.sales,
        importKey: "sales",
      },
      {
        entity: "cari",
        label: "Cari MÃ¼ÅŸteri",
        dbItems: db.cari,
        importKey: "cari",
      },
      {
        entity: "suppliers",
        label: "TedarikÃ§i",
        dbItems: db.suppliers || [],
        importKey: "suppliers",
      },
    ];

    return checks
      .map(({ entity, label, dbItems, importKey }) => {
        const incoming =
          (data[importKey] as {
            id?: string;
            name?: string;
            code?: string;
          }[]) || [];
        const existingIds = new Set(dbItems.map((d) => d.id).filter(Boolean));
        const existingNames = new Set(
          dbItems
            .map((d) => (d.name || "").toLowerCase().trim())
            .filter(Boolean),
        );
        const byId = incoming.filter(
          (item) => item.id && existingIds.has(item.id),
        ).length;
        const byName = incoming.filter(
          (item) =>
            !item.id &&
            item.name &&
            existingNames.has(item.name.toLowerCase().trim()),
        ).length;
        return { entity, label, byId, byName, total: byId + byName };
      })
      .filter((c) => c.total > 0);
  };

  const analyzeData = (data: Record<string, unknown>) => {
    const errs: string[] = [];
    const warns: string[] = [];
    const st: Record<string, number> = {};

    Object.entries(KNOWN_ARRAYS).forEach(([key]) => {
      const val = data[key];
      if (Array.isArray(val)) {
        if (val.length > 0) st[key] = val.length;
        if (val.length === 0) warns.push(`"${KNOWN_ARRAYS[key]}" alanÄ± boÅŸ`);
      } else if (val !== undefined) {
        errs.push(`"${key}" alanÄ± geÃ§ersiz format â€” dizi bekleniyor`);
      }
    });

    if (!data.company || typeof data.company !== "object")
      warns.push("Åirket bilgisi bulunamadÄ± â€” varsayÄ±lan oluÅŸturulacak");
    if (!data.pelletSettings)
      warns.push("Pelet ayarlarÄ± bulunamadÄ± â€” varsayÄ±lan kullanÄ±lacak");
    if (!data._version)
      warns.push(
        "Versiyon bilgisi yok â€” eski format olabilir, lÃ¼tfen kontrol edin",
      );
    else if ((data._version as number) < 1)
      warns.push(
        `Eski versiyon (${data._version}) â€” bazÄ± alanlar eksik olabilir`,
      );

    return { errs, warns, st };
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;

      if (ext === "csv" || ext === "tsv" || ext === "txt") {
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setErrors(["CSV dosyasÄ± boÅŸ veya geÃ§ersiz format"]);
          setStage("preview");
          return;
        }
        setCsvRows(rows);
        const headers = Object.keys(rows[0]);
        const mappings = detectCsvColumns(headers);
        setCsvMappings(mappings);
        const hasCariCols = mappings.some((m) => m.targetEntity === "cari");
        const hasProductCols = mappings.some(
          (m) => m.targetEntity === "products",
        );
        setCsvTarget(
          hasCariCols ? "cari" : hasProductCols ? "products" : "cari",
        );
        setStage("csvMapping");
        return;
      }

      try {
        const data = JSON.parse(text);
        if (typeof data !== "object" || Array.isArray(data)) {
          setErrors(["GeÃ§ersiz JSON formatÄ± â€” nesne bekleniyor"]);
          setStage("preview");
          setRawData(null);
          return;
        }
        setRawData(data);
        const { unknown, autoMapped } = detectFieldMappings(data);
        setLegacyMapped(autoMapped);
        setUnknownFields(unknown);
        const initMappings: Record<string, string> = {};
        unknown.forEach((f) => {
          initMappings[f] = "";
        });
        setFieldMappings(initMappings);

        if (unknown.length > 0 || Object.keys(autoMapped).length > 0) {
          setStage("mapping");
        } else {
          proceedToPreview(data, {});
        }
      } catch {
        logger.warn('settings', 'Dosya ayrıştırılamadı — JSON veya CSV formatı hatalı');
        setErrors([
          "Dosya ayrÄ±ÅŸtÄ±rÄ±lamadÄ± â€” JSON veya CSV formatÄ±nÄ± kontrol edin",
        ]);
        setStage("preview");
        setRawData(null);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyCsvImport = () => {
    if (csvRows.length === 0) return;
    const items: Record<string, unknown>[] = csvRows.map((row) => {
      const item: Record<string, unknown> = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      csvMappings.forEach((m) => {
        if (!m.targetField || m.targetField === "") return;
        const val = row[m.csvColumn];
        if (!val) return;
        const numFields = [
          "balance",
          "amount",
          "total",
          "price",
          "stock",
          "cost",
          "quantity",
        ];
        if (numFields.includes(m.targetField)) {
          item[m.targetField] =
            parseFloat(val.replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
        } else if (m.targetField === "createdAt") {
          try {
            item.createdAt = new Date(val).toISOString();
          } catch {
            logger.warn('settings', 'createdAt tarihi ayrıştırılamadı, varsayılan korundu');
            /* keep default */
          }
        } else {
          item[m.targetField] = val;
        }
      });
      if (csvTarget === "cari") {
        if (!item.type) item.type = "musteri";
        if (!item.balance) item.balance = 0;
        if (!item.totalPurchases) item.totalPurchases = 0;
      }
      if (csvTarget === "products") {
        if (!item.stock) item.stock = 0;
        if (!item.cost) item.cost = 0;
        if (!item.price) item.price = 0;
        if (!item.minStock) item.minStock = 5;
        if (!item.category) item.category = "";
      }
      if (csvTarget === "kasa") {
        if (!item.type) item.type = "gider";
        if (!item.kasa) item.kasa = "nakit";
        if (!item.amount) item.amount = 0;
        if (!item.description)
          item.description = (item.name as string) || "CSV Ä°Ã§e Aktarma";
        if (!item.category) item.category = "diger";
      }
      return item;
    });

    const data: Record<string, unknown> = {};
    data[csvTarget] = items;
    setRawData(data);
    proceedToPreview(data, {});
  };

  const proceedToPreview = (
    data: Record<string, unknown>,
    userMappings: Record<string, string>,
  ) => {
    const allMappings = { ...legacyMapped, ...userMappings };
    const resolved = applyMappings(data, allMappings);
    const { errs, warns, st } = analyzeData(resolved);
    const detectedConflicts = detectConflicts(resolved);
    const initRes: Record<string, ConflictResolution> = {};
    detectedConflicts.forEach((c) => {
      initRes[c.entity] = "overwrite";
    });
    setMapped(resolved);
    setErrors(errs);
    setWarnings(warns);
    setStats(st);
    setConflicts(detectedConflicts);
    setResolutions(initRes);
    setStage("preview");
  };

  const doImport = () => {
    if (!mapped) return;
    showConfirm(
      "Veri AktarÄ±mÄ±nÄ± Onayla",
      "SeÃ§ilen Ã§akÄ±ÅŸma Ã§Ã¶zÃ¼mleri uygulanacak ve veriler iÃ§e aktarÄ±lacak. Mevcut veriler etkilenebilir. OnaylÄ±yor musunuz?",
      () => {
        try {
          const raw = localStorage.getItem("sobaYonetim");
          const current = raw ? JSON.parse(raw) : {};
          const def = {
            _version: 1,
            products: [],
            sales: [],
            suppliers: [],
            orders: [],
            cari: [],
            kasa: [],
            kasalar: [
              { id: "nakit", name: "Nakit", icon: "ğŸ’µ" },
              { id: "banka", name: "Banka", icon: "ğŸ¦" },
            ],
            bankTransactions: [],
            matchRules: [],
            monitorRules: [],
            monitorLog: [],
            stockMovements: [],
            peletSuppliers: [],
            peletOrders: [],
            boruSuppliers: [],
            boruOrders: [],
            invoices: [],
            budgets: [],
            returns: [],
            _activityLog: [],
            company: current.company || {},
            settings: {},
            pelletSettings: {
              gramaj: 14,
              kgFiyat: 6.5,
              cuvalKg: 15,
              critDays: 3,
            },
            ortakEmanetler: [],
            installments: [],
          };
          const finalData: Record<string, unknown> = { ...def, ...mapped };

          const conflictEntities = [
            "products",
            "cari",
            "suppliers",
            "sales",
          ] as const;
          conflictEntities.forEach((entity) => {
            const resolution = resolutions[entity] || "overwrite";
            const incoming =
              (mapped[entity] as { id?: string; name?: string }[]) || [];
            const existing =
              (current[entity] as { id?: string; name?: string }[]) || [];

            if (resolution === "skip") {
              const existingIds = new Set(
                existing.map((x: { id?: string }) => x.id).filter(Boolean),
              );
              const existingNames = new Set(
                existing
                  .map((x: { name?: string }) => (x.name || "").toLowerCase())
                  .filter(Boolean),
              );
              finalData[entity] = [
                ...existing,
                ...incoming.filter((item) => {
                  const hasConflict =
                    !existingIds.has(item.id) &&
                    !existingNames.has((item.name || "").toLowerCase());
                  return item.name && hasConflict;
                }),
              ];
            } else if (resolution === "merge") {
              const existingMap = new Map(
                existing.map((x: { id?: string }) => [x.id, x]),
              );
              incoming.forEach((item) => {
                if (item.id && existingMap.has(item.id)) {
                  existingMap.set(item.id, {
                    ...existingMap.get(item.id)!,
                    ...item,
                  });
                } else {
                  existingMap.set(item.id || Math.random().toString(), item);
                }
              });
              finalData[entity] = Array.from(existingMap.values());
            }
          });

          if (
            !finalData.kasalar ||
            (finalData.kasalar as unknown[]).length === 0
          )
            finalData.kasalar = def.kasalar;
          if (!finalData.pelletSettings)
            finalData.pelletSettings = def.pelletSettings;
          if (!finalData.company || typeof finalData.company !== "object")
            finalData.company = def.company;

          localStorage.setItem("sobaYonetim", JSON.stringify(finalData));
          setStage("done");
          showToast(
            "Veriler baÅŸarÄ±yla aktarÄ±ldÄ±! Sayfa yenilenecek...",
            "success",
          );
          setTimeout(() => window.location.reload(), 1200);
        } catch {
          logger.warn('settings', 'İçe aktarma sırasında hata oluştu');
          showToast("Ä°Ã§e aktarma sÄ±rasÄ±nda hata oluÅŸtu!", "error");
        }
      },
      true,
    );
  };

  const reset = () => {
    setStage("idle");
    setRawData(null);
    setMapped(null);
    setErrors([]);
    setWarnings([]);
    setStats({});
    setConflicts([]);
    setResolutions({});
    setFieldMappings({});
    setUnknownFields([]);
    setLegacyMapped({});
    setCsvRows([]);
    setCsvMappings([]);
    setCsvTarget("cari");
  };

  const btnStyle = (active: boolean, color: string) => ({
    padding: "6px 14px",
    border: `1px solid ${active ? color : "var(--text-dim)"}`,
    borderRadius: 8,
    background: active ? `${color}20` : "transparent",
    color: active ? color : "var(--text-muted)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.8rem",
  });

  return (
    <Card title="ğŸ§  AkÄ±llÄ± Veri Ä°Ã§e Aktarma">
      <p className="text-muted-foreground text-sm">
        JSON, CSV veya TXT dosyanÄ±zÄ± analiz eder; kolonlarÄ± otomatik eÅŸler
        (mÃ¼ÅŸteri, tarih, tutar vb.), manuel dÃ¼zeltme imkanÄ± sunar ve Ã§akÄ±ÅŸmalarÄ±
        Ã§Ã¶zerek gÃ¼venli aktarÄ±m yapar.
      </p>

      {stage === "idle" && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv,.tsv,.txt"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-3 rounded-xl font-bold text-sm border-2 border-dashed border-purple-500/30 bg-purple-500/10 w-full"
          >
            Dosya SeÃ§ & AkÄ±llÄ± Analiz BaÅŸlat
          </Button>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {["JSON", "CSV", "TSV", "TXT"].map((f) => (
              <span key={f} className="inline-flex items-center rounded-md border border-transparent bg-purple-500/20 text-purple-400 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                .{f.toLowerCase()}
              </span>
            ))}
          </div>
        </>
      )}

      {stage === "csvMapping" && csvRows.length > 0 && (
        <div className="grid gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-green-400 font-bold">
              {csvRows.length} satÄ±r okundu
            </div>
            <div className="text-muted-foreground text-xs">
              Kolon eÅŸleÅŸmelerini kontrol edin ve gerekirse dÃ¼zeltin
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-foreground text-sm font-semibold">
                Hedef Veri TÃ¼rÃ¼:
              </span>
              {[
                { id: "cari", label: "Cari MÃ¼ÅŸteri", icon: "ğŸ‘¤" },
                { id: "products", label: "ÃœrÃ¼n", icon: "ğŸ“¦" },
                { id: "kasa", label: "Kasa", icon: "ğŸ’°" },
              ].map((t) => (
                <Button
                  key={t.id}
                  onClick={() => setCsvTarget(t.id)}
                  style={{
                    padding: "6px 14px",
                    border: `1px solid ${csvTarget === t.id ? "#ff5722" : "#334155"}`,
                    borderRadius: 8,
                    background:
                      csvTarget === t.id
                        ? "rgba(255,87,34,0.15)"
                        : "transparent",
                    color: csvTarget === t.id ? "var(--color-danger)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                  }}
                >
                  {t.icon} {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="text-foreground text-sm font-semibold">Kolon EÅŸleÅŸmeleri</div>
          {csvMappings.map((m, i) => (
            <div key={m.csvColumn} className="flex items-center gap-2.5">
              <div
                style={{
                  minWidth: 140,
                  padding: "6px 10px",
                  background: "var(--bg-elevated)",
                  borderRadius: 6,
                  color: m.autoDetected ? "var(--color-success)" : "var(--color-warning)",
                  fontFamily: "monospace",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                }}
              >
                {m.csvColumn}
                {m.autoDetected && (
                  <span className="text-green-400 text-xs">otomatik</span>
                )}
              </div>
              <span className="text-[var(--text-dim)] text-sm">â†’</span>
              <select
                value={m.targetField}
                onChange={(e) => {
                  const next = [...csvMappings];
                  next[i] = {
                    ...next[i],
                    targetField: e.target.value,
                    autoDetected: false,
                  };
                  setCsvMappings(next);
                }}
                className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-mono"
              >
                <option value="">â€” Yoksay â€”</option>
                <option value="name">Ad / Ä°sim</option>
                <option value="phone">Telefon</option>
                <option value="email">E-posta</option>
                <option value="address">Adres</option>
                <option value="balance">Bakiye / BorÃ§</option>
                <option value="amount">Tutar</option>
                <option value="total">Toplam</option>
                <option value="price">Fiyat</option>
                <option value="cost">Maliyet</option>
                <option value="stock">Stok</option>
                <option value="category">Kategori</option>
                <option value="description">AÃ§Ä±klama</option>
                <option value="note">Not</option>
                <option value="createdAt">Tarih</option>
              </select>
            </div>
          ))}

          {csvRows.length > 0 && (
            <div className="bg-[rgba(0,0,0,0.3)] rounded-[10px] p-3 overflow-x-auto">
              <div className="text-muted-foreground text-xs">
                Ã–nizleme (ilk 3 satÄ±r):
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {Object.keys(csvRows[0]).map((h) => (
                      <th key={h} className="text-left p-1.5 font-semibold text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 3).map((row, ri) => (
                    <tr key={ri}>
                      {Object.values(row).map((v, ci) => (
                        <td key={ci} className="p-1.5 text-foreground">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <Button onClick={applyCsvImport} className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
              Devam â†’ Ã–nizleme & Ã‡akÄ±ÅŸma Ã‡Ã¶zÃ¼mÃ¼
            </Button>
            <Button onClick={reset} className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30">
              SÄ±fÄ±rla
            </Button>
          </div>
        </div>
      )}

      {stage === "mapping" && rawData && (
        <div className="grid gap-4">
          <div className="text-foreground text-sm">
            ğŸ—ºï¸ Alan EÅŸleme (Field Mapping)
          </div>
          {Object.keys(legacyMapped).length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-green-400 font-bold">
                âœ… Otomatik AlgÄ±lanan Eski Alanlar
              </div>
              {Object.entries(legacyMapped).map(([src, dst]) => (
                <div key={src} className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-[rgba(0,0,0,0.3)] px-2 py-0.5 rounded text-[var(--color-warning)]">{src}</span>
                  <span className="text-[var(--text-dim)] text-sm">â†’</span>
                  <span className="font-mono text-xs bg-[rgba(0,0,0,0.3)] px-2 py-0.5 rounded text-[var(--color-success)]">{dst}</span>
                  <span className="text-[var(--text-dim)] text-xs">
                    ({KNOWN_ARRAYS[dst] || dst})
                  </span>
                </div>
              ))}
            </div>
          )}
          {unknownFields.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-amber-400 font-bold text-sm">
                âš ï¸ TanÄ±nmayan Alanlar â€” EÅŸleme SeÃ§in
              </div>
              {unknownFields.map((field) => (
                <div key={field} className="flex items-center gap-2.5">
                  <span className="font-mono text-xs bg-[rgba(0,0,0,0.3)] px-2.5 py-1 rounded text-[var(--color-warning)] text-center min-w-[120px]">{field}</span>
                  <span className="text-[var(--text-dim)] text-sm">â†’</span>
                  <select
                    value={fieldMappings[field] || ""}
                    onChange={(e) =>
                      setFieldMappings((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-mono"
                  >
                    <option value="">â€” Yoksay (aktarma)</option>
                    {Object.entries(KNOWN_ARRAYS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label} ({k})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => proceedToPreview(rawData, fieldMappings)}
              className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
            >
              Devam â†’ Ã–nizleme & Ã‡akÄ±ÅŸma Ã‡Ã¶zÃ¼mÃ¼
            </Button>
            <Button onClick={reset} className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30">
              SÄ±fÄ±rla
            </Button>
          </div>
        </div>
      )}

      {stage === "preview" && (
        <div className="grid gap-3">
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-red-400 font-bold text-sm">âŒ Hatalar</div>
              {errors.map((e, i) => (
                <div key={i} className="text-red-400 text-xs">
                  â€¢ {e}
                </div>
              ))}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-amber-400 font-bold text-sm">âš ï¸ UyarÄ±lar</div>
              {warnings.map((w, i) => (
                <div key={i} className="text-amber-400 text-xs">
                  â€¢ {w}
                </div>
              ))}
            </div>
          )}
          {Object.keys(stats).length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-blue-400 font-bold text-sm">
                ğŸ“Š Ä°Ã§e AktarÄ±lacak KayÄ±tlar
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(stats).map(([k, v]) => (
                  <div key={k} className="bg-[var(--bg-card)] rounded-lg p-2 text-center">
                    <div className="text-foreground text-sm font-semibold">{v}</div>
                    <div className="text-[var(--text-dim)] text-sm">
                      {KNOWN_ARRAYS[k] || k}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {conflicts.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-red-400 font-bold text-sm">
                âš¡ Ã‡akÄ±ÅŸma Ã‡Ã¶zÃ¼mÃ¼
              </div>
              {conflicts.map((c) => (
                <div key={c.entity} className="border-b border-[var(--border)] pb-3 mb-3">
                  <div className="text-red-400 text-xs">
                    <strong>{c.label}</strong>:{" "}
                    {c.byId > 0 && `${c.byId} aynÄ± ID`}
                    {c.byId > 0 && c.byName > 0 && ", "}
                    {c.byName > 0 && `${c.byName} aynÄ± isim`} Ã§akÄ±ÅŸmasÄ±
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        setResolutions((r) => ({
                          ...r,
                          [c.entity]: "overwrite",
                        }))
                      }
                      style={btnStyle(
                        resolutions[c.entity] === "overwrite",
                        "#ef4444",
                      )}
                    >
                      ğŸ”„ Ãœzerine Yaz
                    </Button>
                    <Button
                      onClick={() =>
                        setResolutions((r) => ({ ...r, [c.entity]: "skip" }))
                      }
                      style={btnStyle(
                        resolutions[c.entity] === "skip",
                        "#f59e0b",
                      )}
                    >
                      â­ï¸ Ã‡akÄ±ÅŸanlarÄ± Atla
                    </Button>
                    <Button
                      onClick={() =>
                        setResolutions((r) => ({ ...r, [c.entity]: "merge" }))
                      }
                      style={btnStyle(
                        resolutions[c.entity] === "merge",
                        "#10b981",
                      )}
                    >
                      ğŸ”€ BirleÅŸtir
                    </Button>
                  </div>
                  <div className="text-[var(--text-dim)] text-xs">
                    {resolutions[c.entity] === "overwrite" &&
                      "Mevcut kayÄ±tlar yeni verilerle tamamen deÄŸiÅŸtirilir."}
                    {resolutions[c.entity] === "skip" &&
                      "Ã‡akÄ±ÅŸan kayÄ±tlar atlanÄ±r; mevcut veriler korunur, yeni olanlar eklenir."}
                    {resolutions[c.entity] === "merge" &&
                      "Mevcut kayÄ±tlar yeni alanlarla gÃ¼ncellenir; hiÃ§ kayÄ±p olmaz."}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2.5">
            {mapped && errors.length === 0 && (
              <Button onClick={doImport} className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                âœ… AktarÄ±mÄ± Onayla & BaÅŸlat
              </Button>
            )}
            <Button onClick={reset} className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30">
              SÄ±fÄ±rla
            </Button>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <div className="text-4xl mb-3">âœ…</div>
          <div className="text-green-400 font-bold">
            Veriler baÅŸarÄ±yla aktarÄ±ldÄ±!
          </div>
          <div className="text-muted-foreground text-xs">Sayfa yenileniyor...</div>
        </div>
      )}
    </Card>
  );
}

function VeriOnarim({
  db,
  save,
  showToast,
  showConfirm,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (
    title: string,
    msg: string,
    onOk: () => void,
    danger?: boolean,
  ) => void;
}) {
  const [results, setResults] = useState<string[]>([]);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const handleDetailedHealthCheck = async () => {
    setCheckingHealth(true);
    const report = await runHealthCheck(
      db as unknown as Record<string, unknown>,
    );
    setHealthReport(report);
    setCheckingHealth(false);
  };

  const diagnose = () => {
    const issues: string[] = [];
    const saleIds = db.sales.map((s) => s.id);
    const dupSales = saleIds.length - new Set(saleIds).size;
    if (dupSales > 0) issues.push(`âš ï¸ ${dupSales} tekrarlanan satÄ±ÅŸ kaydÄ±`);
    const negStock = db.products.filter((p) => p.stock < 0).length;
    if (negStock > 0) issues.push(`âš ï¸ ${negStock} Ã¼rÃ¼nÃ¼n stok deÄŸeri negatif`);
    const cariIds = new Set(db.cari.map((c) => c.id));
    const orphanKasa = db.kasa.filter(
      (k) => k.cariId && !cariIds.has(k.cariId),
    ).length;
    if (orphanKasa > 0)
      issues.push(`âš ï¸ ${orphanKasa} kasa kaydÄ± silinmiÅŸ cariye baÄŸlÄ±`);
    const soldProductIds = new Set(
      db.sales
        .flatMap(
          (s) =>
            s.items?.map((i: { productId: string }) => i.productId) || [
              s.productId,
            ],
        )
        .filter(Boolean),
    );
    const stocklessProducts = db.products.filter(
      (p) => soldProductIds.has(p.id) && p.stock === 0,
    ).length;
    if (stocklessProducts > 0)
      issues.push(`â„¹ï¸ ${stocklessProducts} Ã¼rÃ¼n satÄ±ldÄ± ama stok sÄ±fÄ±r`);
    if (!db.company.name) issues.push("â„¹ï¸ Åirket adÄ± girilmemiÅŸ");
    const lsSize = new Blob([localStorage.getItem("sobaYonetim") || ""]).size;
    const lsKB = Math.round(lsSize / 1024);
    issues.push(`ğŸ“Š localStorage boyutu: ${lsKB} KB (limit ~5MB)`);
    const orphanInvoices = (db.invoices || []).filter(
      (inv) => inv.cariId && !cariIds.has(inv.cariId),
    ).length;
    if (orphanInvoices > 0)
      issues.push(`âš ï¸ ${orphanInvoices} fatura silinmiÅŸ cariye baÄŸlÄ±`);
    setResults(
      issues.length === 0
        ? ["âœ… Veri tutarlÄ±lÄ±k kontrolÃ¼ tamam. Sorun bulunamadÄ±!"]
        : issues,
    );
  };

  const fixNegativeStock = () => {
    showConfirm(
      "Stok DÃ¼zelt",
      "Negatif stoklar sÄ±fÄ±ra Ã§ekilecek. Devam edilsin mi?",
      () => {
        save((prev) => ({
          ...prev,
          products: prev.products.map((p) =>
            p.stock < 0 ? { ...p, stock: 0 } : p,
          ),
        }));
        showToast("Negatif stoklar dÃ¼zeltildi!");
        diagnose();
      },
    );
  };

  const fixOrphanKasa = () => {
    showConfirm(
      "Orphan Temizle",
      "SilinmiÅŸ cariye ait kasa kayÄ±tlarÄ±ndaki cari baÄŸlantÄ±sÄ± kaldÄ±rÄ±lacak. Devam?",
      () => {
        const cariIds = new Set(db.cari.map((c) => c.id));
        save((prev) => ({
          ...prev,
          kasa: prev.kasa.map((k) =>
            k.cariId && !cariIds.has(k.cariId)
              ? { ...k, cariId: undefined }
              : k,
          ),
        }));
        showToast("Orphan kasa kayÄ±tlarÄ± dÃ¼zeltildi!");
        diagnose();
      },
    );
  };

  const recalcCariBalance = () => {
    showConfirm(
      "Bakiye Yeniden Hesapla",
      "TÃ¼m cari bakiyeleri kasa iÅŸlemlerine gÃ¶re sÄ±fÄ±rdan hesaplanacak. Mevcut bakiyeler SIFIRLANACAK!",
      () => {
        save((prev) => {
          const cari = prev.cari.map((c) => {
            const kasaEntries = prev.kasa.filter((k) => k.cariId === c.id);
            const newBalance = kasaEntries.reduce(
              (s, k) => s + (k.type === "gelir" ? k.amount : -k.amount),
              0,
            );
            return { ...c, balance: newBalance };
          });
          return { ...prev, cari };
        });
        showToast("Cari bakiyeler yeniden hesaplandÄ±!");
        diagnose();
      },
      true,
    );
  };

  const removeDupSales = () => {
    showConfirm(
      "TekrarlarÄ± Temizle",
      "AynÄ± ID'li tekrarlanan satÄ±ÅŸ kayÄ±tlarÄ± silinecek. Devam edilsin mi?",
      () => {
        save((prev) => {
          const seen = new Set<string>();
          return {
            ...prev,
            sales: prev.sales.filter((s) => {
              if (seen.has(s.id)) return false;
              seen.add(s.id);
              return true;
            }),
          };
        });
        showToast("Tekrarlanan satÄ±ÅŸlar temizlendi!");
        diagnose();
      },
    );
  };

  const mergeduplicateCari = () => {
    const nameCounts: Record<string, string[]> = {};
    db.cari.forEach((c) => {
      const n = c.name.trim().toLowerCase();
      if (!nameCounts[n]) nameCounts[n] = [];
      nameCounts[n].push(c.id);
    });
    const dups = Object.entries(nameCounts).filter(([, ids]) => ids.length > 1);
    if (dups.length === 0) {
      showToast("Tekrarlanan cari bulunamadÄ±!");
      return;
    }
    showConfirm(
      "Cari BirleÅŸtir",
      `${dups.length} isimde tekrar var. Ä°lk kayÄ±t korunacak. Devam?`,
      () => {
        save((prev) => {
          const toRemove = new Set<string>();
          dups.forEach(([, ids]) =>
            ids.slice(1).forEach((id) => toRemove.add(id)),
          );
          return {
            ...prev,
            cari: prev.cari.filter((c) => !toRemove.has(c.id)),
          };
        });
        showToast(`${dups.length} grup birleÅŸtirildi!`);
        diagnose();
      },
      true,
    );
  };

  return (
    <div className="grid gap-4">
      <Card title="ğŸ”§ Veri TutarlÄ±lÄ±k KontrolÃ¼">
        <p className="text-muted-foreground text-sm">
          VeritabanÄ±nÄ±zÄ± analiz ederek tutarsÄ±z, eksik veya hatalÄ± kayÄ±tlarÄ±
          tespit edin.
        </p>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={diagnose}
            className="px-3 py-2.5 rounded-xl font-bold text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex-1"
            style={{ flex: 1 }}
          >
            ğŸ” HÄ±zlÄ± Analiz
          </Button>
          <Button
            onClick={handleDetailedHealthCheck}
            disabled={checkingHealth}
            className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
            style={{ flex: 1 }}
          >
            {checkingHealth
              ? "âŒ› Analiz Ediliyor..."
              : "ğŸ›¡ï¸ Tam Sistem TaramasÄ±"}
          </Button>
        </div>

        {healthReport && (
          <div className="mt-4 grid gap-2">
            <div
              style={{
                padding: "12px",
                borderRadius: 12,
                background:
                  healthReport.overall === "healthy"
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(239,68,68,0.1)",
                border: `1px solid ${healthReport.overall === "healthy" ? "#10b981" : "#ef4444"}40`,
                textAlign: "center",
              }}
            >
              <div
                className="text-foreground font-extrabold text-lg"
                style={{
                  color:
                    healthReport.overall === "healthy" ? "var(--color-success)" : "var(--color-danger)",
                }}
              >
                {healthReport.overall === "healthy"
                  ? "âœ… Sistem SaÄŸlÄ±klÄ±"
                  : "âš ï¸ Sistemde Sorunlar Var"}
                ({healthReport.score}/100)
              </div>
            </div>

            {healthReport.metrics.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-2.5 border-b border-[var(--border)]"
              >
                <div className="flex-1">
                  <div className="text-foreground font-bold text-sm">{m.name}</div>
                  <div className="text-[var(--text-dim)] text-xs">{m.detail}</div>
                </div>
                <div
                  className={m.status === "healthy" ? "inline-flex items-center rounded-md border border-transparent bg-green-500/20 text-green-400 px-2.5 py-0.5 text-xs font-semibold" : m.status === "degraded" ? "inline-flex items-center rounded-md border border-transparent bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs font-semibold" : "inline-flex items-center rounded-md border border-transparent bg-red-500/20 text-red-400 px-2.5 py-0.5 text-xs font-semibold"}
                >
                  {m.value}
                  {m.unit || ""}
                </div>
              </div>
            ))}

            {healthReport.recommendations.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm">
                <div className="text-blue-400 font-bold text-sm">ğŸ’¡ Ã–neriler:</div>
                {healthReport.recommendations.map((rec, i) => (
                  <div key={i} className="text-muted-foreground text-xs">
                    â€¢ {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="grid gap-1.5">
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 14px",
                  background: r.startsWith("âœ…")
                    ? "rgba(16,185,129,0.08)"
                    : r.startsWith("ğŸ“Š")
                      ? "rgba(59,130,246,0.08)"
                      : "rgba(245,158,11,0.08)",
                  border: `1px solid ${r.startsWith("âœ…") ? "rgba(16,185,129,0.2)" : r.startsWith("ğŸ“Š") ? "rgba(59,130,246,0.2)" : "rgba(245,158,11,0.2)"}`,
                  borderRadius: 9,
                  color: "#e2e8f0",
                  fontSize: "0.85rem",
                }}
              >
                {r}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="ğŸ› ï¸ OnarÄ±m AraÃ§larÄ±">
        <div className="grid gap-2.5">
          {[
            {
              label: "ğŸ“¦ Negatif StoklarÄ± SÄ±fÄ±rla",
              desc: "Stok deÄŸeri 0'Ä±n altÄ±na dÃ¼ÅŸmÃ¼ÅŸ Ã¼rÃ¼nleri sÄ±fÄ±ra Ã§eker",
              action: fixNegativeStock,
              color: "#f59e0b",
            },
            {
              label: "ğŸ”— Orphan Kasa BaÄŸlantÄ±larÄ±nÄ± Temizle",
              desc: "SilinmiÅŸ cariye baÄŸlÄ± kasa kayÄ±tlarÄ±ndaki baÄŸlantÄ±yÄ± kaldÄ±rÄ±r",
              action: fixOrphanKasa,
              color: "#3b82f6",
            },
            {
              label: "âš–ï¸ Cari Bakiyeleri Yeniden Hesapla",
              desc: "TÃ¼m bakiyeleri kasa iÅŸlemlerine gÃ¶re baÅŸtan hesaplar",
              action: recalcCariBalance,
              color: "#8b5cf6",
            },
            {
              label: "ğŸ—‘ï¸ Tekrarlayan SatÄ±ÅŸ KayÄ±tlarÄ±nÄ± Temizle",
              desc: "AynÄ± ID ile Ã§ift kaydedilmiÅŸ satÄ±ÅŸlarÄ± siler",
              action: removeDupSales,
              color: "#10b981",
            },
            {
              label: "ğŸ¤ AynÄ± Ä°simli Cari HesaplarÄ± BirleÅŸtir",
              desc: "AynÄ± isimde birden fazla cari varsa tek kayÄ±t bÄ±rakÄ±r",
              action: mergeduplicateCari,
              color: "#ef4444",
            },
          ].map((t) => (
            <div
              key={t.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "var(--bg-card)",
                borderRadius: 10,
                border: `1px solid ${t.color}15`,
              }}
            >
              <div className="flex-1">
                <div className="text-foreground text-sm font-semibold">{t.label}</div>
                <div className="text-[var(--text-dim)] text-xs">{t.desc}</div>
              </div>
              <Button
                onClick={t.action}
                style={{
                  background: `${t.color}15`,
                  border: `1px solid ${t.color}30`,
                  borderRadius: 8,
                  color: t.color,
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                }}
              >
                Uygula
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="ğŸ“‹ Sistem Bilgileri">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[
            {
              label: "Toplam KayÄ±t",
              value: `${[db.products, db.sales, db.cari, db.kasa, db.invoices || [], db.budgets || []].reduce((s, a) => s + a.length, 0)} kayÄ±t`,
            },
            {
              label: "localStorage Boyutu",
              value: `${Math.round(new Blob([localStorage.getItem("sobaYonetim") || ""]).size / 1024)} KB`,
            },
            { label: "Uygulama Versiyonu", value: `v${db._version || 1}` },
            {
              label: "Son Veri GÃ¼ncellemesi",
              value:
                db.kasa.length > 0
                  ? new Date(
                      Math.max(
                        ...db.kasa.map((k) =>
                          new Date(k.updatedAt || k.createdAt).getTime(),
                        ),
                      ),
                    ).toLocaleDateString("tr-TR")
                  : "-",
            },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
              <div className="text-[var(--text-dim)] text-xs">{s.label}</div>
              <div className="text-foreground text-sm font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DangerAction({
  label,
  desc,
  onConfirm,
}: {
  label: string;
  desc: string;
  onConfirm: () => void;
}) {
  const { showConfirm } = useConfirm();
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="text-foreground text-xs">{label}</div>
        <div className="text-[var(--text-dim)] text-xs">{desc}</div>
      </div>
      <Button
        onClick={() =>
          showConfirm(
            label,
            `${desc}. Bu iÅŸlem geri alÄ±namaz!`,
            onConfirm,
            true,
          )
        }
        className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs"
      >
        Temizle
      </Button>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "var(--text-muted)",
  fontSize: "0.82rem",
  fontWeight: 600,
};
const _btnPrimaryStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 0",
  background: "linear-gradient(135deg, #ff5722, #ff7043)",
  border: "none",
  borderRadius: 12,
  color: "var(--text-primary)",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "0.95rem",
};

// BaglantiAyarlari moved to ./SettingsBaglanti

// ArayuzAyarlari moved to ./SettingsArayuz

function FV({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[var(--text-muted)]">{label}</Label>
      <Input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// â”€â”€ Kategori YÃ¶netim Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KategoriYonetim({
  db,
  save,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const cats = db.productCategories || [];
  const [yeniAd, setYeniAd] = useState("");
  const [yeniIcon, setYeniIcon] = useState("ğŸ“¦");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", icon: "" });

  const addKat = () => {
    const ad = yeniAd.trim();
    if (!ad) {
      showToast("Kategori adÄ± gerekli!", "error");
      return;
    }
    const id = ad
      .toLowerCase()
      .replace(/ÄŸ/g, "g")
      .replace(/Ã¼/g, "u")
      .replace(/ÅŸ/g, "s")
      .replace(/Ä±/g, "i")
      .replace(/Ã¶/g, "o")
      .replace(/Ã§/g, "c")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_");
    if (cats.find((c) => c.id === id)) {
      showToast("Bu ID zaten var!", "error");
      return;
    }
    const nowIso = new Date().toISOString();
    save((prev) => ({
      ...prev,
      productCategories: [
        ...(prev.productCategories || []),
        { id, name: ad, icon: yeniIcon, createdAt: nowIso },
      ],
    }));
    setYeniAd("");
    setYeniIcon("ğŸ“¦");
    showToast("Kategori eklendi!", "success");
  };

  const saveEdit = (id: string) => {
    if (!editForm.name.trim()) {
      showToast("Ad gerekli!", "error");
      return;
    }
    save((prev) => ({
      ...prev,
      productCategories: (prev.productCategories || []).map((c) =>
        c.id === id
          ? { ...c, name: editForm.name.trim(), icon: editForm.icon || c.icon }
          : c,
      ),
    }));
    setEditId(null);
    showToast("GÃ¼ncellendi!", "success");
  };

  const deleteKat = (id: string) => {
    const used = db.products.filter(
      (p) => !p.deleted && p.category === id,
    ).length;
    if (used > 0) {
      showToast(
        `${used} Ã¼rÃ¼n bu kategoriyi kullanÄ±yor, silemezsiniz!`,
        "error",
      );
      return;
    }
    showConfirm("Kategori Sil", "Bu kategoriyi silmek istiyor musunuz?", () => {
      save((prev) => ({
        ...prev,
        productCategories: (prev.productCategories || []).filter(
          (c) => c.id !== id,
        ),
      }));
      showToast("Kategori silindi!", "success");
    });
  };

  return (
    <Card title="ğŸ·ï¸ ÃœrÃ¼n Kategorileri">
      <div className="flex flex-col gap-3">
        {cats.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">HenÃ¼z kategori yok</div>
        )}
        {cats.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            {editId === c.id ? (
              <>
                <input
                  value={editForm.icon}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, icon: e.target.value }))
                  }
                  className={`${inpBase} w-[48px] text-center text-lg`} style={{ padding: "6px" }}
                  maxLength={2}
                />
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={`${inpBase} flex-1 p-[7px_10px]`}
                  autoFocus
                />
                <Button
                  onClick={() => saveEdit(c.id)}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs bg-green-500/20 text-green-500 hover:bg-green-500/30"
                >
                  âœ“
                </Button>
                <Button
                  onClick={() => setEditId(null)}
                  className="px-2.5 py-1.5 rounded-lg font-medium text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                >
                  âœ•
                </Button>
              </>
            ) : (
              <>
                <span className="text-lg">{c.icon}</span>
                <span className="text-foreground font-semibold">{c.name}</span>
                <span className="text-[var(--text-dim)] text-xs font-mono">{c.id}</span>
                <span className="text-[var(--text-dim)] text-xs">
                  {
                    db.products.filter((p) => !p.deleted && p.category === c.id)
                      .length
                  }{" "}
                  Ã¼rÃ¼n
                </span>
                <Button
                  onClick={() => {
                    setEditId(c.id);
                    setEditForm({ name: c.name, icon: c.icon });
                  }}
                  className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                >
                  âœï¸
                </Button>
                <Button
                  onClick={() => deleteKat(c.id)}
                  className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs"
                >
                  ğŸ—‘ï¸
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={yeniIcon}
          onChange={(e) => setYeniIcon(e.target.value)}
          className={`${inpBase} w-[52px] text-center text-xl`}
          placeholder="ğŸ“¦"
          maxLength={2}
        />
        <input
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addKat()}
          className={`${inpBase} flex-1`}
          placeholder="Yeni kategori adÄ±..."
        />
        <Button onClick={addKat} className="btn-primary px-4 py-2 rounded-xl font-bold text-sm">
          + Ekle
        </Button>
      </div>
      <p className="text-[var(--text-dim)] text-xs mt-2">
        ÃœrÃ¼nleri kullanan kategoriler silinemez.
      </p>
    </Card>
  );
}

// â”€â”€ HakkÄ±nda Paneli â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AboutPanel({ db }: { db: DB }) {
  const totalRecords = [
    db.products,
    db.sales,
    db.cari,
    db.kasa,
    db.invoices || [],
    db.orders,
    db.suppliers,
  ].reduce((s, a) => s + a.length, 0);
  const lsKB = Math.round(
    new Blob([localStorage.getItem("sobaYonetim") || ""]).size / 1024,
  );

  const [appCfg, setAppCfg] = useState(loadAppConfig);
  const [editVersion, setEditVersion] = useState(false);
  const [versionInput, setVersionInput] = useState(appCfg.version);
  const [versionErr, setVersionErr] = useState("");
  const [expandedVersion, setExpandedVersion] = useState<string | null>(
    CHANGELOG[0]?.version || null,
  );

  const saveVersion = () => {
    if (!validateVersion(versionInput)) {
      setVersionErr("Format: 2.1.0 veya 2.1.0-beta");
      return;
    }
    const next = { ...appCfg, version: versionInput.trim() };
    setAppCfg(next);
    saveAppConfig(next);
    setEditVersion(false);
    setVersionErr("");
  };

  const techStack = [
    { name: "React 19", color: "#61dafb" },
    { name: "TypeScript 6", color: "#3178c6" },
    { name: "Vite 7", color: "#646cff" },
    { name: "Tailwind CSS v4", color: "#38bdf8" },
    { name: "Firebase Firestore", color: "#ffa000" },
    { name: "Capacitor 8", color: "#119eff" },
    { name: "Recharts", color: "#8884d8" },
    { name: "Radix UI", color: "#7c3aed" },
  ];

  return (
    <div className="grid gap-4">
      {/* Logo & BaÅŸlÄ±k */}
      <div className="text-center py-6">
        <div className="text-4xl mb-2">{appCfg.appIcon}</div>
        <h2 className="text-foreground text-lg font-bold">{appCfg.appName}</h2>
        <p className="text-foreground text-sm">{APP_SUBTITLE}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Versiyon â€” tÄ±klanabilir */}
          {editVersion ? (
            <div className="flex items-center gap-1.5">
              <input
                value={versionInput}
                onChange={(e) => {
                  setVersionInput(e.target.value);
                  setVersionErr("");
                }}
                style={{
                  padding: "4px 10px",
                  background: "var(--bg-surface)",
                  border: `1px solid ${versionErr ? "#ef4444" : "#334155"}`,
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  width: 120,
                }}
                placeholder="2.1.0-beta"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveVersion();
                  if (e.key === "Escape") {
                    setEditVersion(false);
                    setVersionErr("");
                  }
                }}
                autoFocus
              />
              <Button
                onClick={saveVersion}
                className="px-3 py-1.5 rounded-lg font-bold text-xs"
              >
                âœ“
              </Button>
              <Button
                onClick={() => {
                  setEditVersion(false);
                  setVersionErr("");
                }}
                className="px-2.5 py-1.5 rounded-lg font-medium text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
              >
                âœ•
              </Button>
              {versionErr && (
                <span className="text-red-400 text-xs">{versionErr}</span>
              )}
            </div>
          ) : (
            <Button
              onClick={() => {
                setEditVersion(true);
                setVersionInput(appCfg.version);
              }}
              title="Versiyonu dÃ¼zenle"
              className="inline-flex items-center rounded-md border border-transparent bg-primary/20 text-primary px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
            >
              v{appCfg.version} âœï¸
            </Button>
          )}
          <span className="inline-flex items-center rounded-md border border-[var(--border)] px-2.5 py-0.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">DB v{db._version || 1}</span>
          <span className="inline-flex items-center rounded-md border border-transparent bg-green-500/20 text-green-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
            {totalRecords} kayÄ±t Â· {lsKB} KB
          </span>
        </div>
      </div>

      {/* Teknoloji Stack */}
      <Card title="âš™ï¸ Teknoloji">
        <div className="flex flex-wrap gap-2">
          {techStack.map((t) => (
            <span
              key={t.name}
              style={{
                background: `${t.color}15`,
                border: `1px solid ${t.color}30`,
                borderRadius: 8,
                padding: "5px 12px",
                color: t.color,
                fontSize: "0.82rem",
                fontWeight: 700,
              }}
            >
              {t.name}
            </span>
          ))}
        </div>
      </Card>

      {/* VeritabanÄ± Ã–zeti */}
      <Card title="ğŸ—„ï¸ VeritabanÄ± Ã–zeti">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              icon: "ğŸ“¦",
              label: "ÃœrÃ¼nler",
              count: db.products.filter((p) => !p.deleted).length,
            },
            {
              icon: "ğŸ›’",
              label: "SatÄ±ÅŸlar",
              count: db.sales.filter((s) => !s.deleted).length,
            },
            {
              icon: "ğŸ‘¤",
              label: "Cari",
              count: db.cari.filter((c) => !c.deleted).length,
            },
            {
              icon: "ğŸ’°",
              label: "Kasa KayÄ±tlarÄ±",
              count: db.kasa.filter((k) => !k.deleted).length,
            },
            {
              icon: "ğŸ§¾",
              label: "Faturalar",
              count: (db.invoices || []).filter((i) => !i.deleted).length,
            },
            { icon: "ğŸ­", label: "TedarikÃ§iler", count: db.suppliers.length },
            { icon: "ğŸ“‹", label: "SipariÅŸler", count: db.orders.length },
            {
              icon: "ğŸ“ˆ",
              label: "Stok Hareketleri",
              count: db.stockMovements.length,
            },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--bg-card)] rounded-[10px] p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-foreground text-sm font-bold">{s.count}</div>
              <div className="text-[var(--text-dim)] text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* SÃ¼rÃ¼m KitapÃ§Ä±ÄŸÄ± â€” Changelog */}
      <Card title="ğŸ“– SÃ¼rÃ¼m GeÃ§miÅŸi">
        <div className="grid gap-2">
          {CHANGELOG.map((entry) => {
            const isExpanded = expandedVersion === entry.version;
            const isLatest = entry.version === CHANGELOG[0]?.version;
            return (
              <div
                key={entry.version}
                style={{
                  background: isExpanded
                    ? "rgba(255,87,34,0.05)"
                    : "rgba(0,0,0,0.2)",
                  borderRadius: 12,
                  border: `1px solid ${isExpanded ? "rgba(255,87,34,0.2)" : "rgba(255,255,255,0.05)"}`,
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                {/* BaÅŸlÄ±k satÄ±rÄ± */}
                <Button
                  onClick={() =>
                    setExpandedVersion(isExpanded ? null : entry.version)
                  }
                  className="w-full flex items-center gap-3 p-3 bg-transparent border-none cursor-pointer text-left"
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      color: isLatest ? "var(--color-danger)" : "var(--text-secondary)",
                      fontSize: "0.88rem",
                      minWidth: 60,
                    }}
                  >
                    v{entry.version}
                  </span>
                  {isLatest && (
                    <span className="inline-flex items-center rounded-md border border-transparent bg-primary/20 text-primary px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">SON</span>
                  )}
                  <div className="flex-1">
                    <div className="text-foreground text-sm font-semibold">
                      {entry.title}
                    </div>
                    <div className="text-[var(--text-dim)] text-xs">{entry.date}</div>
                  </div>
                  <span
                    style={{
                      color: "var(--text-dim)",
                      fontSize: "0.85rem",
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "none",
                    }}
                  >
                    â–¼
                  </span>
                </Button>

                {/* Detay */}
                {isExpanded && (
                  <div className="p-3 pt-0 space-y-2">
                    <p className="text-muted-foreground text-xs">{entry.summary}</p>
                    <div className="grid gap-2">
                      {entry.changes.map((change, i) => {
                        const cfg = CHANGE_TYPE_CONFIG[change.type];
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                borderRadius: 5,
                                padding: "1px 7px",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                marginTop: 1,
                              }}
                            >
                              {cfg.label}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {change.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Lisans */}
      <Card title="ğŸ“„ Lisans & GeliÅŸtirici">
        <div className="grid gap-2.5">
          {[
            { label: "Uygulama", value: `${appCfg.appName} â€” ${APP_SUBTITLE}` },
            { label: "GeliÅŸtirici", value: "Pars Pelet" },
            { label: "Lisans", value: "Ã–zel KullanÄ±m â€” TÃ¼m haklarÄ± saklÄ±dÄ±r" },
            { label: "Platform", value: "Web (PWA) + Android (Capacitor)" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-[var(--text-dim)] text-xs">{row.label}</span>
              <span className="text-foreground text-xs">{row.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


// â”€â”€ Agent Settings Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AgentSettingsPanel({
  db: _db,
  save: _save,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [agentSettings, setAgentSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("sobaYonetim");
      if (!raw) return getDefaultAgentSettings();
      const parsed = JSON.parse(raw);
      return parsed.agentSettings || getDefaultAgentSettings();
    } catch {
      logger.warn('settings', 'Ajan ayarları localStorage\'dan okunamadı, varsayılan kullanıldı');
      return getDefaultAgentSettings();
    }
  });

  const agents = [
    {
      id: "stok",
      name: "Stok AjanÄ±",
      icon: "ğŸ“¦",
      desc: "ÃœrÃ¼n stok yÃ¶netimi ve uyarÄ±larÄ±",
      permissions: ["stok.read", "stok.write"],
    },
    {
      id: "kasa",
      name: "Kasa AjanÄ±",
      icon: "ğŸ’°",
      desc: "Kasa iÅŸlemleri ve nakit yÃ¶netimi",
      permissions: ["kasa.read", "kasa.write"],
    },
    {
      id: "cari",
      name: "Cari AjanÄ±",
      icon: "ğŸ‘¤",
      desc: "MÃ¼ÅŸteri ve tedarikÃ§i yÃ¶netimi",
      permissions: ["cari.read", "cari.write"],
    },
    {
      id: "satis",
      name: "SatÄ±ÅŸ AjanÄ±",
      icon: "ğŸ›’",
      desc: "SatÄ±ÅŸ iÅŸlemleri ve raporlama",
      permissions: ["satis.read", "satis.write"],
    },
    {
      id: "fatura",
      name: "Fatura AjanÄ±",
      icon: "ğŸ§¾",
      desc: "Fatura oluÅŸturma ve yÃ¶netimi",
      permissions: ["fatura.read", "fatura.write"],
    },
    {
      id: "rapor",
      name: "Rapor AjanÄ±",
      icon: "ğŸ“Š",
      desc: "Raporlar ve analitik",
      permissions: ["rapor.read"],
    },
    {
      id: "deep_seek",
      name: "DeepSeek AjanÄ±",
      icon: "ğŸ¤–",
      desc: "Yapay zeka destekli analiz ve Ã¶neriler",
      permissions: ["deep_seek.read", "deep_seek.write"],
    },
  ];

  const saveAgentSettings = () => {
    try {
      const raw = localStorage.getItem("sobaYonetim");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.agentSettings = agentSettings;
      localStorage.setItem("sobaYonetim", JSON.stringify(parsed));
      showToast("Ajan ayarlarÄ± kaydedildi!", "success");
    } catch {
      logger.warn('settings', 'Ajan ayarları kaydedilemedi');
      showToast("Ayarlar kaydedilemedi!", "error");
    }
  };

  const toggleAgent = (agentId: string) => {
    setAgentSettings((prev: Record<string, unknown>) => ({
      ...prev,
      [agentId]: {
        ...(prev[agentId] as Record<string, unknown>),
        enabled: !(
          (prev[agentId] as Record<string, unknown>)?.enabled as boolean
        ),
      },
    }));
  };

  const togglePermission = (agentId: string, permission: string) => {
    setAgentSettings((prev: Record<string, unknown>) => {
      const agent = prev[agentId] as Record<string, unknown>;
      const perms = (agent?.permissions as string[]) || [];
      const updated = perms.includes(permission)
        ? perms.filter((p) => p !== permission)
        : [...perms, permission];
      return {
        ...prev,
        [agentId]: { ...agent, permissions: updated },
      };
    });
  };

  const resetToDefaults = () => {
    showConfirm(
      "VarsayÄ±lan Ayarlara DÃ¶n",
      "TÃ¼m ajan ayarlarÄ± varsayÄ±lan deÄŸerlere sÄ±fÄ±rlanacak. Emin misiniz?",
      () => {
        setAgentSettings(getDefaultAgentSettings());
        showToast("VarsayÄ±lan ayarlara dÃ¶ndÃ¼!", "success");
      },
    );
  };

  return (
    <div className="grid gap-4">
      <Card title="ğŸ¤– Ajan YÃ¶netimi">
        <p className="text-muted-foreground text-sm">
          Sistemdeki ajanlarÄ± etkinleÅŸtirin/devre dÄ±ÅŸÄ± bÄ±rakÄ±n ve izinlerini
          yÃ¶netin.
        </p>

        <div className="grid gap-2">
          {agents.map((agent) => {
            const settings = (agentSettings[agent.id] as Record<
              string,
              unknown
            >) || {
              enabled: true,
              permissions: agent.permissions,
            };
            const enabled = settings.enabled as boolean;
            const perms = (settings.permissions as string[]) || [];

            return (
              <div
                key={agent.id}
                style={{
                  background: enabled
                    ? "rgba(255,87,34,0.05)"
                    : "rgba(0,0,0,0.3)",
                  borderRadius: 12,
                  border: `1px solid ${enabled ? "rgba(255,87,34,0.2)" : "rgba(255,255,255,0.05)"}`,
                  padding: "16px",
                  opacity: enabled ? 1 : 0.6,
                }}
              >
                {/* BaÅŸlÄ±k */}
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "1.4rem" }}>{agent.icon}</span>
                  <div className="flex-1">
                    <div className="text-foreground text-sm font-semibold">
                      {agent.name}
                    </div>
                    <div className="text-[var(--text-dim)] text-xs">{agent.desc}</div>
                  </div>
                  <Button
                    onClick={() => toggleAgent(agent.id)}
                    style={{
                      padding: "6px 12px",
                      background: enabled
                        ? "rgba(16,185,129,0.2)"
                        : "rgba(239,68,68,0.1)",
                      border: `1px solid ${enabled ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)"}`,
                      borderRadius: 8,
                      color: enabled ? "var(--color-success)" : "var(--color-danger)",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                    }}
                  >
                    {enabled ? "âœ“ Aktif" : "âœ• Pasif"}
                  </Button>
                </div>

                {/* Ä°zinler */}
                {enabled && (
                  <div className="grid gap-2">
                    <div className="text-[var(--text-dim)] text-xs">Ä°zinler:</div>
                    {agent.permissions.map((perm) => (
                      <label
                        key={perm}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          padding: "6px 0",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={perms.includes(perm)}
                          onChange={() => togglePermission(agent.id, perm)}
                          style={{
                            cursor: "pointer",
                            accentColor: "var(--color-danger)",
                          }}
                        />
                        <span className="text-muted-foreground text-xs">{perm}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={saveAgentSettings}
            className="btn-primary w-full py-3 rounded-xl font-bold text-sm"
          >
            ğŸ’¾ Ajan AyarlarÄ±nÄ± Kaydet
          </Button>
          <Button
            onClick={resetToDefaults}
            className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          >
            â†º VarsayÄ±lana DÃ¶n
          </Button>
        </div>
      </Card>

      {/* Ajan Ä°statistikleri */}
      <Card title="ğŸ“Š Ajan Ä°statistikleri">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Aktif Ajanlar",
              count: agents.filter(
                (a) =>
                  (agentSettings[a.id] as Record<string, unknown>)?.enabled !==
                  false,
              ).length,
              icon: "âœ“",
              color: "#10b981",
            },
            {
              label: "Toplam Ä°zin",
              count: Object.values(agentSettings).reduce(
                (sum: number, agent) =>
                  sum +
                  ((agent as Record<string, unknown>)?.permissions as string[])
                    ?.length || 0,
                0,
              ),
              icon: "ğŸ”",
              color: "#f59e0b",
            },
            {
              label: "YapÄ±landÄ±rÄ±lan",
              count: Object.keys(agentSettings).length,
              icon: "âš™ï¸",
              color: "#3b82f6",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--bg-card)",
                borderRadius: 10,
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 900,
                  color: stat.color,
                  marginBottom: "4px",
                }}
              >
                {stat.count}
              </div>
              <div className="text-[var(--text-dim)] text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Ajan AÃ§Ä±klamasÄ± */}
      <Card title="â„¹ï¸ Ajan AÃ§Ä±klamasÄ±">
        <div className="grid gap-2">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-foreground text-sm font-semibold">
              ğŸ¤– Ajanlar Nedir?
            </div>
            <p className="text-muted-foreground text-xs">
              Ajanlar, uygulamanÄ±n belirli gÃ¶revleri otomatik olarak yerine
              getirmesine yardÄ±mcÄ± olan yapay zeka bileÅŸenleridir. Her ajan
              belirli bir alan (stok, kasa, satÄ±ÅŸ vb.) Ã¼zerinde Ã§alÄ±ÅŸÄ±r.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-foreground text-sm font-semibold">
              ğŸ” Ä°zinler Nedir?
            </div>
            <p className="text-muted-foreground text-xs">
              Ä°zinler, her ajanÄ±n hangi iÅŸlemleri yapabileceÄŸini kontrol eder.
              "read" = okuma, "write" = yazma/deÄŸiÅŸtirme. GÃ¼venlik iÃ§in sadece
              gerekli izinleri verin.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-foreground text-sm font-semibold">
              âš¡ EtkinleÅŸtirme/Devre DÄ±ÅŸÄ± BÄ±rakma
            </div>
            <p className="text-muted-foreground text-xs">
              AjanlarÄ± geÃ§ici olarak devre dÄ±ÅŸÄ± bÄ±rakabilirsiniz. Devre dÄ±ÅŸÄ±
              bÄ±rakÄ±lan ajanlar hiÃ§bir iÅŸlem yapmaz ve sistem performansÄ±nÄ±
              etkilemez.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function getDefaultAgentSettings(): Record<string, unknown> {
  return {
    stok: {
      enabled: true,
      permissions: ["stok.read", "stok.write"],
    },
    kasa: {
      enabled: true,
      permissions: ["kasa.read", "kasa.write"],
    },
    cari: {
      enabled: true,
      permissions: ["cari.read", "cari.write"],
    },
    satis: {
      enabled: true,
      permissions: ["satis.read", "satis.write"],
    },
    fatura: {
      enabled: true,
      permissions: ["fatura.read", "fatura.write"],
    },
    rapor: {
      enabled: true,
      permissions: ["rapor.read"],
    },
    deep_seek: {
      enabled: false,
      permissions: ["deep_seek.read"],
    },
  };
}



