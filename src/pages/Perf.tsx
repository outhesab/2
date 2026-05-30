import { logger, type LogEntry } from "@/lib/logger";
import { useEffect, useState } from "react";

interface PerfRow {
  label: string;
  ms: number;
  ts: string;
}

export default function Perf() {
  const [perfLogs, setPerfLogs] = useState<PerfRow[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const logs = logger.getLogs({ cat: "perf", limit: 200 }).concat(
      logger.getLogs({ cat: "db", limit: 200 }),
      logger.getLogs({ cat: "firebase", limit: 100 }),
    );
    const rows = parsePerfEntries(logs);
    setPerfLogs(rows);

    const unsub = logger.subscribe((entry) => {
      if (entry.ms !== undefined && (entry.cat === "perf" || entry.cat === "db" || entry.cat === "firebase")) {
        setPerfLogs((prev) => [
          { label: entry.msg, ms: entry.ms!, ts: entry.ts },
          ...prev,
        ].slice(0, 500));
      }
    });
    return unsub;
  }, []);

  const filtered = filter
    ? perfLogs.filter((r) => r.label.toLowerCase().includes(filter.toLowerCase()))
    : perfLogs;

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return (
    <div style={{ padding: 24, fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", background: "#0f172a", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>⏱ Performans Monitoru</h1>
      <p style={{ color: "#94a3b8", marginBottom: 16 }}>
        Canli performans loglarini gosterir. Sayfada islem yap, sureleri burada gor.
      </p>

      <input
        placeholder="Filtrele..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          width: "100%", maxWidth: 400, padding: "6px 12px", marginBottom: 16,
          background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "var(--text-primary)",
        }}
      />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #334155", textAlign: "left" }}>
            <th style={{ padding: "6px 12px" }}>Islem</th>
            <th style={{ padding: "6px 12px", width: 80 }}>Sure (ms)</th>
            <th style={{ padding: "6px 12px", width: 180 }}>Zaman</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
              <td style={{ padding: "4px 12px", color: row.ms > 100 ? "#f87171" : row.ms > 30 ? "#fbbf24" : "#94a3b8" }}>
                {row.label.replace(/[⏱]/g, "").trim()}
              </td>
              <td style={{ padding: "4px 12px", fontWeight: "bold", color: row.ms > 100 ? "#f87171" : "#e2e8f0" }}>
                {row.ms}
              </td>
              <td style={{ padding: "4px 12px", color: "#64748b", fontSize: 12 }}>
                {row.ts.slice(11, 23)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {perfLogs.length > 0 && (
        <div style={{ marginTop: 24, padding: 16, background: "#1e293b", borderRadius: 8 }}>
          <h2 style={{ fontSize: 14, marginBottom: 8, color: "#94a3b8" }}>Ozet Istatistikler</h2>
          {["save()", "saveGuarded()", "undo()", "localStorage yaz", "IndexedSnapshot yaz", "IndexedSnapshot oku", "Firebase kayit", "Firebase yukle"].map((label) => {
            const vals = perfLogs.filter((r) => r.label.includes(label)).map((r) => r.ms);
            if (vals.length === 0) return null;
            return (
              <div key={label} style={{ marginBottom: 4 }}>
                <span style={{ color: "#64748b", width: 200, display: "inline-block" }}>{label}</span>
                <span style={{ color: "var(--text-primary)" }}>ort: {avg(vals)}ms</span>
                <span style={{ color: "#94a3b8", marginLeft: 12 }}>min: {Math.min(...vals)}ms</span>
                <span style={{ color: "#94a3b8", marginLeft: 12 }}>max: {Math.max(...vals)}ms</span>
                <span style={{ color: "#64748b", marginLeft: 12 }}>({vals.length} kayit)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function parsePerfEntries(logs: LogEntry[]): PerfRow[] {
  const rows: PerfRow[] = [];
  for (const entry of logs) {
    if (entry.ms) {
      rows.push({
        label: entry.msg,
        ms: entry.ms,
        ts: entry.ts,
      });
    }
  }
  return rows.sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 300);
}