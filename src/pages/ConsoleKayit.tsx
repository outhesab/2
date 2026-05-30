import { consoleRecorder, type ConsoleLevel, type ConsoleRecord } from "@/lib/consoleRecorder";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

const LEVEL_CONFIG: Record<ConsoleLevel, { label: string; color: string; bg: string; icon: string }> = {
  log: { label: "Log", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: "📄" },
  info: { label: "Info", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: "ℹ️" },
  warn: { label: "Warn", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "⚠️" },
  error: { label: "Error", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "❌" },
  debug: { label: "Debug", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", icon: "🔍" },
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Bugün";
  if (d.toDateString() === yesterday.toDateString()) return "Dün";
  return d.toLocaleDateString("tr-TR");
}

export default function ConsoleKayit() {
  const [records, setRecords] = useState<ConsoleRecord[]>([]);
  const [filterLevel, setFilterLevel] = useState<ConsoleLevel | "all">("all");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ConsoleRecord | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    setRecords(consoleRecorder.getRecords({ limit: 500 }));

    const unsub = consoleRecorder.subscribe((entry) => {
      setRecords((prev) => {
        const next = [entry, ...prev];
        return next.slice(0, 1000);
      });
    });

    const interval = setInterval(() => {
      if (!isLive) return;
      setRecords(consoleRecorder.getRecords({ limit: 500 }));
    }, 2000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [isLive]);

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [records, autoScroll]);

  const filtered = useMemo(() => {
    let result = records;
    if (filterLevel !== "all") {
      result = result.filter((r) => r.level === filterLevel);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.args.toLowerCase().includes(q) ||
          (r.stack && r.stack.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [records, filterLevel, search]);

  const counts = useMemo(() => consoleRecorder.countByLevel(), []);

  const errorRate = useMemo(() => {
    const total = records.length;
    if (total === 0) return 0;
    return Math.round((counts.error / total) * 100);
  }, [records, counts]);

  const handleExport = useCallback(() => {
    consoleRecorder.exportJSON();
  }, []);

  const handleClear = useCallback(() => {
    consoleRecorder.clear();
    setRecords([]);
    setSelectedRecord(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setRecords(consoleRecorder.getRecords({ limit: 500 }));
  }, []);

  const dateGroups = useMemo(() => {
    const groups: Record<string, ConsoleRecord[]> = {};
    filtered.forEach((r) => {
      const key = formatDate(r.ts);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [filtered]);

  return (
    <div style={{ padding: "16px", maxWidth: 1400, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.5rem" }}>🖥️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#f1f5f9" }}>
              Konsol Kayıtları
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
              {records.length} kayıt &middot; Oturum: {consoleRecorder.getSessionId()}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={handleRefresh} style={btnStyle}>
            🔄 Yenile
          </button>
          <button onClick={handleExport} style={btnStyle}>
            📥 Dışa Aktar
          </button>
          <button
            onClick={() => setIsLive((p) => !p)}
            style={{
              ...btnStyle,
              background: isLive ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.2)",
              border: isLive ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(100,116,139,0.3)",
              color: isLive ? "#10b981" : "#94a3b8",
            }}
          >
            {isLive ? "🔴 Canlı" : "⏸ Durdur"}
          </button>
          <button onClick={handleClear} style={{ ...btnStyle, color: "#ef4444" }}>
            🗑 Temizle
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          { label: "Toplam", value: records.length, color: "#64748b" },
          { label: "Hata", value: counts.error, color: "#ef4444" },
          { label: "Uyarı", value: counts.warn, color: "#f59e0b" },
          { label: "Bilgi", value: counts.info, color: "#3b82f6" },
          { label: "Debug", value: counts.debug, color: "#8b5cf6" },
          { label: "Log", value: counts.log, color: "#94a3b8" },
          { label: "Hata Oranı", value: `${errorRate}%`, color: errorRate > 10 ? "#ef4444" : "#10b981" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: 10,
              padding: "10px 14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Konsol çıktısında ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#f1f5f9",
            fontSize: "0.85rem",
          }}
        />
        {(["all", "error", "warn", "info", "log", "debug"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterLevel(f)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background:
                filterLevel === f
                  ? f === "all"
                    ? "rgba(255,255,255,0.15)"
                    : LEVEL_CONFIG[f].bg
                  : "rgba(255,255,255,0.05)",
              color:
                filterLevel === f
                  ? f === "all"
                    ? "#f1f5f9"
                    : LEVEL_CONFIG[f].color
                  : "#64748b",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
          >
            {f === "all"
              ? "Tümü"
              : LEVEL_CONFIG[f].icon + " " + LEVEL_CONFIG[f].label}
          </button>
        ))}
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", color: "#64748b", fontSize: "0.8rem", cursor: "pointer" }}>
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
          Otomatik Kaydır
        </label>
      </div>

      <div style={{ display: "flex", gap: 16, height: "calc(100vh - 340px)", minHeight: 400 }}>
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            background: "rgba(0,0,0,0.15)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.05)",
            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
            fontSize: "0.78rem",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8, opacity: 0.4 }}>🖥️</div>
              <p>Konsol kaydı bulunamadı</p>
              <p style={{ fontSize: "0.75rem", marginTop: 4 }}>
                Sayfada console.log/warn/error çağrıları yapıldıkça kayıtlar burada görünecek
              </p>
            </div>
          ) : (
            Object.entries(dateGroups).map(([date, items]) => (
              <div key={date}>
                <div
                  style={{
                    padding: "6px 12px",
                    background: "rgba(255,255,255,0.03)",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    fontSize: "0.7rem",
                    color: "#475569",
                    fontWeight: 600,
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {date}
                </div>
                {items.map((r) => {
                  const cfg = LEVEL_CONFIG[r.level];
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRecord(selectedRecord?.id === r.id ? null : r)}
                      style={{
                        padding: "6px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        background: selectedRecord?.id === r.id ? "rgba(255,255,255,0.06)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedRecord?.id !== r.id) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedRecord?.id !== r.id) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: 52,
                          fontSize: "0.65rem",
                          color: "#475569",
                          paddingTop: 1,
                        }}
                      >
                        {formatTime(r.ts)}
                      </span>
                      <span
                        style={{
                          flexShrink: 0,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: cfg.color,
                          marginTop: 4,
                        }}
                      />
                      <span style={{ flexShrink: 0, color: cfg.color, fontWeight: 600, width: 40, fontSize: "0.7rem" }}>
                        {cfg.label.toUpperCase()}
                      </span>
                      <span
                        style={{
                          color: "#e2e8f0",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                        }}
                      >
                        {r.args.slice(0, 500)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {selectedRecord && (
          <div
            style={{
              width: 380,
              flexShrink: 0,
              background: "rgba(0,0,0,0.2)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 16,
              overflowY: "auto",
              fontSize: "0.82rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#f1f5f9" }}>Kayıt Detayı</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <DetailRow label="ID" value={selectedRecord.id} />
              <DetailRow label="Zaman" value={new Date(selectedRecord.ts).toLocaleString("tr-TR")} />
              <DetailRow
                label="Seviye"
                value={
                  <span style={{ color: LEVEL_CONFIG[selectedRecord.level].color, fontWeight: 600 }}>
                    {LEVEL_CONFIG[selectedRecord.level].icon} {LEVEL_CONFIG[selectedRecord.level].label}
                  </span>
                }
              />
              <DetailRow label="Oturum" value={selectedRecord.sessionId} />
              <div>
                <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 4, fontWeight: 600 }}>
                  İÇERİK
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: 6,
                    padding: "8px 10px",
                    color: "#e2e8f0",
                    fontSize: "0.8rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 200,
                    overflowY: "auto",
                    fontFamily: "'Cascadia Code', 'Fira Code', monospace",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedRecord.args}
                </div>
              </div>
              {selectedRecord.stack && (
                <div>
                  <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 4, fontWeight: 600 }}>
                    STACK TRACE
                  </div>
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 6,
                      padding: "8px 10px",
                      color: "#f59e0b",
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily: "'Cascadia Code', 'Fira Code', monospace",
                      lineHeight: 1.4,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {selectedRecord.stack}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedRecord.args).catch(() => {});
                }}
                style={smallBtnStyle}
              >
                📋 Kopyala
              </button>
              {selectedRecord.stack && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedRecord.stack || "").catch(() => {});
                  }}
                  style={smallBtnStyle}
                >
                  📋 Stack Kopyala
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600, minWidth: 60, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ color: "#cbd5e1", fontSize: "0.8rem", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#cbd5e1",
  cursor: "pointer",
  fontSize: "0.78rem",
  fontWeight: 600,
};

const smallBtnStyle: React.CSSProperties = {
  ...btnStyle,
  padding: "6px 10px",
  fontSize: "0.75rem",
};
