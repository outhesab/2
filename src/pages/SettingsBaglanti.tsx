import React, { useState } from "react";
import { DEFAULT_CONN, saveConnConfig, testFirebase, testSupabase, type ConnConfig } from "@/lib/connConfig";
import { Card } from "./SettingsCard";

export function BaglantiAyarlari({
  cfg,
  onChange,
  showToast,
}: {
  cfg: ConnConfig;
  onChange: (c: ConnConfig) => void;
  showToast: (m: string, t?: string) => void;
}) {
  const [fbTest, setFbTest] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );
  const [fbTesting, setFbTesting] = useState(false);
  const [sbTest, setSbTest] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );
  const [sbTesting, setSbTesting] = useState(false);

  const setFb = (patch: Partial<typeof cfg.firebase>) =>
    onChange({ ...cfg, firebase: { ...cfg.firebase, ...patch } });
  const setSb = (patch: Partial<typeof cfg.supabase>) =>
    onChange({ ...cfg, supabase: { ...cfg.supabase, ...patch } });

  const handleFbTest = async () => {
    setFbTesting(true);
    setFbTest(null);
    const r = await testFirebase(cfg.firebase);
    setFbTest(r);
    setFbTesting(false);
    showToast(
      r.ok ? "Firebase baÄŸlantÄ±sÄ± baÅŸarÄ±lÄ±!" : "Firebase baÄŸlantÄ±sÄ± baÅŸarÄ±sÄ±z!",
      r.ok ? "success" : "error",
    );
  };

  const handleSbTest = async () => {
    setSbTesting(true);
    setSbTest(null);
    const r = await testSupabase(cfg.supabase);
    setSbTest(r);
    setSbTesting(false);
    showToast(
      r.ok ? "Supabase baÄŸlantÄ±sÄ± baÅŸarÄ±lÄ±!" : "Supabase baÄŸlantÄ±sÄ± baÅŸarÄ±sÄ±z!",
      r.ok ? "success" : "error",
    );
  };

  const handleSave = () => {
    saveConnConfig(cfg);
    showToast(
      "BaÄŸlantÄ± ayarlarÄ± kaydedildi! Sayfa yenilendiÄŸinde aktif olur.",
      "success",
    );
  };

  const handleReset = () => {
    onChange(DEFAULT_CONN);
    saveConnConfig(DEFAULT_CONN);
    showToast("VarsayÄ±lan baÄŸlantÄ± ayarlarÄ± geri yÃ¼klendi!", "success");
  };

  return (
    <div className={"settings-grid-16"}>
      {/* Aktif SaÄŸlayÄ±cÄ± */}
      <Card title="ğŸ”Œ Aktif Senkronizasyon SaÄŸlayÄ±cÄ±sÄ±">
        <p className={"settings-text-muted"}>
          Verileriniz hangi bulut servisiyle senkronize edilsin? Sadece bir
          saÄŸlayÄ±cÄ± aktif olabilir.
        </p>
        <div className={"settings-flex-row-10"}>
          {(
            [
              {
                id: "firebase",
                label: "ğŸ”¥ Firebase",
                desc: "Google Firestore",
              },
              {
                id: "supabase",
                label: "âš¡ Supabase",
                desc: "PostgreSQL tabanlÄ±",
              },
              { id: "none", label: "ğŸš« Yok", desc: "Sadece yerel" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ ...cfg, activeProvider: p.id })}
              style={{
                flex: 1,
                padding: "14px 10px",
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "center",
                background:
                  cfg.activeProvider === p.id
                    ? "rgba(255,87,34,0.12)"
                    : "rgba(0,0,0,0.25)",
                border: `2px solid ${cfg.activeProvider === p.id ? "rgba(255,87,34,0.5)" : "rgba(255,255,255,0.07)"}`,
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: cfg.activeProvider === p.id ? "var(--color-danger)" : "var(--text-primary)",
                  fontSize: "0.9rem",
                }}
              >
                {p.label}
              </div>
              <div className={"settings-text-dim-sm"}>{p.desc}</div>
              {cfg.activeProvider === p.id && (
                <div className={"settings-text-success-sm"}>âœ“ Aktif</div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Firebase */}
      <Card title="ğŸ”¥ Firebase Firestore">
        <div className={"settings-flex-row-10"}>
          <div className={"settings-text-muted"}>
            Firebase Firestore REST API ile senkronizasyon
          </div>
          <button
            onClick={() => setFb({ enabled: !cfg.firebase.enabled })}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              border: "none",
              cursor: "pointer",
              position: "relative",
              background: cfg.firebase.enabled ? "var(--color-success)" : "var(--text-dim)",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "var(--bg-elevated)",
                position: "absolute",
                top: 4,
                left: cfg.firebase.enabled ? 26 : 4,
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            />
          </button>
        </div>

        {/* JSON DosyasÄ± YÃ¼kleme */}
        <div className={"settings-warning-dashed"}>
          <div className={"settings-text-primary-mid"}>
            ğŸ“ Firebase Config DosyasÄ± YÃ¼kle
          </div>
          <div className={"settings-text-dim-sm"}>
            Firebase Console'dan indirilen{" "}
            <code className={"settings-text-orange"}>google-services.json</code>{" "}
            veya web config JSON dosyasÄ±nÄ± yÃ¼kleyin â€” alanlar otomatik dolar.
          </div>
          <label className={"settings-block"}>
            <div className={"settings-btn-orange"}>ğŸ“‚ JSON DosyasÄ± SeÃ§</div>
            <input
              type="file"
              accept=".json"
              className={"settings-hidden"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const json = JSON.parse(ev.target?.result as string);
                    // google-services.json formatÄ±
                    if (json.project_info && json.client) {
                      const projectId = json.project_info.project_id;
                      const apiKey =
                        json.client?.[0]?.api_key?.[0]?.current_key || "";
                      if (projectId) {
                        setFb({ projectId, apiKey });
                        showToast("âœ… google-services.json okundu!", "success");
                        return;
                      }
                    }
                    // Firebase web config formatÄ±: { apiKey, projectId, ... }
                    if (json.apiKey && json.projectId) {
                      setFb({ projectId: json.projectId, apiKey: json.apiKey });
                      showToast("âœ… Firebase config okundu!", "success");
                      return;
                    }
                    // firebaseConfig objesi iÃ§inde
                    if (json.firebaseConfig) {
                      setFb({
                        projectId: json.firebaseConfig.projectId || "",
                        apiKey: json.firebaseConfig.apiKey || "",
                      });
                      showToast("âœ… Firebase config okundu!", "success");
                      return;
                    }
                    showToast(
                      "âš ï¸ TanÄ±nan bir Firebase JSON formatÄ± deÄŸil. Manuel girin.",
                      "warning",
                    );
                  } catch {
                    showToast("âŒ JSON dosyasÄ± okunamadÄ±!", "error");
                  }
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            opacity: cfg.firebase.enabled ? 1 : 0.5,
            pointerEvents: cfg.firebase.enabled ? "auto" : "none",
          }}
        >
          <div>
            <label className={"settings-lbl"}>Project ID</label>
            <input
              value={cfg.firebase.projectId}
              onChange={(e) => setFb({ projectId: e.target.value })}
              className={"settings-inp"}
              placeholder="Ã¶rn: my-project-12345"
            />
          </div>
          <div>
            <label className={"settings-lbl"}>API Key</label>
            <input
              type="password"
              value={cfg.firebase.apiKey}
              onChange={(e) => setFb({ apiKey: e.target.value })}
              className={"settings-inp"}
              placeholder="AIza..."
            />
          </div>
          <div className={"settings-grid-full"}>
            <label className={"settings-lbl"}>DokÃ¼man Yolu</label>
            <input
              value={cfg.firebase.docPath}
              onChange={(e) => setFb({ docPath: e.target.value })}
              className={"settings-inp"}
              placeholder="sync/main"
            />
            <div className={"settings-text-dim-13"}>
              Firestore'daki koleksiyon/dokÃ¼man yolu. Ã–rn:{" "}
              <code className={"settings-text-orange"}>sync/main</code>
            </div>
          </div>
        </div>

        {/* OluÅŸturulan URL Ã¶nizleme */}
        {cfg.firebase.projectId && cfg.firebase.apiKey && (
          <div className={"settings-mono-box"}>
            {`Firebase: ${cfg.firebase.projectId}/${cfg.firebase.docPath} (SDK ile baÄŸlÄ±)`}
          </div>
        )}

        <div className={"settings-flex-row-10"}>
          <button
            onClick={handleFbTest}
            disabled={
              fbTesting || !cfg.firebase.projectId || !cfg.firebase.apiKey
            }
            style={{
              padding: "9px 18px",
              background: "rgba(255,87,34,0.12)",
              border: "1px solid rgba(255,87,34,0.25)",
              borderRadius: 9,
              color: "var(--color-danger)",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.85rem",
              opacity:
                !cfg.firebase.projectId || !cfg.firebase.apiKey ? 0.4 : 1,
            }}
          >
            {fbTesting ? "âŸ³ Test ediliyor..." : "ğŸ” BaÄŸlantÄ±yÄ± Test Et"}
          </button>
          {fbTest && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.82rem",
                color: fbTest.ok ? "var(--color-success)" : "var(--color-danger)",
                fontWeight: 600,
              }}
            >
              {fbTest.ok ? "âœ…" : "âŒ"} {fbTest.msg}
            </div>
          )}
        </div>

        {/* NasÄ±l alÄ±nÄ±r? */}
        <details className={"settings-mt-14"}>
          <summary className={"settings-text-dim-8"}>
            ğŸ“– Firebase bilgilerini nereden alÄ±rÄ±m?
          </summary>
          <div className={"settings-help-box"}>
            <div>
              1.{" "}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className={"settings-text-orange"}
              >
                console.firebase.google.com
              </a>{" "}
              â†’ Projenizi seÃ§in
            </div>
            <div>
              2. Proje AyarlarÄ± (âš™ï¸) â†’ Genel â†’ Proje kimliÄŸi ={" "}
              <strong className={"settings-text-white"}>Project ID</strong>
            </div>
            <div>
              3. Proje AyarlarÄ± â†’ Web API anahtarÄ± ={" "}
              <strong className={"settings-text-white"}>API Key</strong>
            </div>
            <div>
              4. Firestore Database â†’ Koleksiyon ve dokÃ¼man adÄ± ={" "}
              <strong className={"settings-text-white"}>DokÃ¼man Yolu</strong>
            </div>
            <div className={"settings-text-orange"}>
              âš ï¸ Firestore gÃ¼venlik kurallarÄ±nÄ± ayarlamayÄ± unutmayÄ±n!
            </div>
          </div>
        </details>
      </Card>

      {/* Supabase */}
      <Card title="âš¡ Supabase">
        <div className={"settings-flex-row-10"}>
          <div className={"settings-text-muted"}>
            Supabase PostgreSQL ile senkronizasyon (REST API)
          </div>
          <button
            onClick={() => setSb({ enabled: !cfg.supabase.enabled })}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              border: "none",
              cursor: "pointer",
              position: "relative",
              background: cfg.supabase.enabled ? "var(--color-success)" : "var(--text-dim)",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "var(--bg-elevated)",
                position: "absolute",
                top: 4,
                left: cfg.supabase.enabled ? 26 : 4,
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            opacity: cfg.supabase.enabled ? 1 : 0.5,
            pointerEvents: cfg.supabase.enabled ? "auto" : "none",
          }}
        >
          <div className={"settings-grid-full"}>
            <label className={"settings-lbl"}>Supabase URL</label>
            <input
              value={cfg.supabase.url}
              onChange={(e) => setSb({ url: e.target.value })}
              className={"settings-inp"}
              placeholder="https://xxxxxxxxxxxx.supabase.co"
            />
          </div>
          <div className={"settings-grid-full"}>
            <label className={"settings-lbl"}>Anon Key (public)</label>
            <input
              type="password"
              value={cfg.supabase.anonKey}
              onChange={(e) => setSb({ anonKey: e.target.value })}
              className={"settings-inp"}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
          <div>
            <label className={"settings-lbl"}>Tablo AdÄ±</label>
            <input
              value={cfg.supabase.tableName}
              onChange={(e) => setSb({ tableName: e.target.value })}
              className={"settings-inp"}
              placeholder="soba_sync"
            />
          </div>
        </div>

        {/* SQL ÅŸemasÄ± */}
        <details className={"settings-mt-12"}>
          <summary className={"settings-text-dim-8"}>
            ğŸ“‹ Gerekli SQL ÅŸemasÄ±
          </summary>
          <pre className={"settings-code-block"}>{`CREATE TABLE soba_sync (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  version INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS politikasÄ± (opsiyonel)
ALTER TABLE soba_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON soba_sync FOR ALL USING (true);`}</pre>
        </details>

        <div className={"settings-flex-row-10"}>
          <button
            onClick={handleSbTest}
            disabled={sbTesting || !cfg.supabase.url || !cfg.supabase.anonKey}
            style={{
              padding: "9px 18px",
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 9,
              color: "var(--color-success)",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.85rem",
              opacity: !cfg.supabase.url || !cfg.supabase.anonKey ? 0.4 : 1,
            }}
          >
            {sbTesting ? "âŸ³ Test ediliyor..." : "ğŸ” BaÄŸlantÄ±yÄ± Test Et"}
          </button>
          {sbTest && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.82rem",
                color: sbTest.ok ? "var(--color-success)" : "var(--color-danger)",
                fontWeight: 600,
              }}
            >
              {sbTest.ok ? "âœ…" : "âŒ"} {sbTest.msg}
            </div>
          )}
        </div>

        <details className={"settings-mt-14"}>
          <summary className={"settings-text-dim-8"}>
            ğŸ“– Supabase bilgilerini nereden alÄ±rÄ±m?
          </summary>
          <div className={"settings-help-box"}>
            <div>
              1.{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className={"settings-text-success"}
              >
                supabase.com/dashboard
              </a>{" "}
              â†’ Projenizi seÃ§in
            </div>
            <div>
              2. Settings â†’ API â†’ Project URL ={" "}
              <strong className={"settings-text-white"}>Supabase URL</strong>
            </div>
            <div>
              3. Settings â†’ API â†’ anon public ={" "}
              <strong className={"settings-text-white"}>Anon Key</strong>
            </div>
            <div>4. SQL Editor'da yukarÄ±daki ÅŸemayÄ± Ã§alÄ±ÅŸtÄ±rÄ±n</div>
          </div>
        </details>
      </Card>

      {/* Kaydet / SÄ±fÄ±rla */}
      <div className={"settings-flex-row-10"}>
        <button onClick={handleReset} className={"settings-btn-outline-md"}>
          â†º VarsayÄ±lana SÄ±fÄ±rla
        </button>
        <button onClick={handleSave} className={"settings-btn-primary-md"}>
          ğŸ’¾ BaÄŸlantÄ± AyarlarÄ±nÄ± Kaydet
        </button>
      </div>

      <div className={"settings-warning-box"}>
        âš ï¸ BaÄŸlantÄ± ayarlarÄ± deÄŸiÅŸtirildikten sonra{" "}
        <strong className={"settings-text-white"}>sayfayÄ± yenileyin</strong> â€”
        yeni ayarlar aktif olur.
        <br />
        ğŸ”’ BaÄŸlantÄ± ayarlarÄ± Firebase'e kaydedilir â€” tÃ¼m cihazlarda geÃ§erlidir.
      </div>
    </div>
  );
}

// ArayuzAyarlari moved to ./SettingsArayuz


