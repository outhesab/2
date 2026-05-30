export type ConsoleLevel = "log" | "warn" | "error" | "info" | "debug";

export interface ConsoleRecord {
  id: string;
  ts: string;
  level: ConsoleLevel;
  args: string;
  stack?: string;
  source?: string;
  sessionId: string;
}

const STORAGE_KEY = "sobaConsoleRecords_v1";
const MAX_RECORDS = 2000;
const SESSION_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

let records: ConsoleRecord[] = [];
let listeners: Array<(entry: ConsoleRecord) => void> = [];
let originalMethods: Partial<Record<ConsoleLevel, (...args: unknown[]) => void>> = {};

function loadRecords(): ConsoleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch {
    try {
      const trimmed = records.slice(0, Math.floor(MAX_RECORDS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      records = trimmed;
    } catch {
      // silently fail
    }
  }
}

function stringifyArgs(args: unknown[]): string {
  return args
    .map((a) => {
      try {
        if (typeof a === "string") return a;
        if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack?.slice(0, 200) || ""}`;
        return JSON.stringify(a, null, 1);
      } catch {
        return String(a);
      }
    })
    .join(" ");
}

function capture(level: ConsoleLevel, args: unknown[]) {
  const text = stringifyArgs(args);
  const record: ConsoleRecord = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    ts: new Date().toISOString(),
    level,
    args: text.slice(0, 2000),
    sessionId: SESSION_ID,
  };

  if (level === "error" || level === "warn") {
    const stack = new Error().stack;
    record.stack = stack?.split("\n").slice(2, 6).join("\n").slice(0, 500);
  }

  records.unshift(record);
  if (records.length > MAX_RECORDS + 500) {
    records = records.slice(0, MAX_RECORDS);
  }
  saveRecords();

  listeners.forEach((fn) => {
    try {
      fn(record);
    } catch {
      // ignore
    }
  });
}

export function createRecorder() {
  const levels: ConsoleLevel[] = ["log", "warn", "error", "info", "debug"];

  levels.forEach((level) => {
    originalMethods[level] = console[level].bind(console);

    console[level] = (...args: unknown[]) => {
      capture(level, args);
      originalMethods[level]?.(...args);
    };
  });

  window.addEventListener("unhandledrejection", (e) => {
    capture("error", [
      e.reason instanceof Error
        ? `Unhandled Rejection: ${e.reason.message}`
        : `Unhandled Rejection: ${String(e.reason)}`,
    ]);
  });
}

export function destroyRecorder() {
  (Object.keys(originalMethods) as ConsoleLevel[]).forEach((level) => {
    if (originalMethods[level]) {
      console[level] = originalMethods[level]!;
    }
  });
  originalMethods = {};
}

export const consoleRecorder = {
  getRecords(filter?: {
    level?: ConsoleLevel | ConsoleLevel[];
    search?: string;
    since?: string;
    limit?: number;
    offset?: number;
  }): ConsoleRecord[] {
    let result = [...records];

    if (filter?.level) {
      const levels = Array.isArray(filter.level) ? filter.level : [filter.level];
      result = result.filter((r) => levels.includes(r.level));
    }

    if (filter?.since) {
      result = result.filter((r) => r.ts >= filter.since!);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.args.toLowerCase().includes(q) ||
          (r.stack && r.stack.toLowerCase().includes(q)),
      );
    }

    if (filter?.offset) {
      result = result.slice(filter.offset);
    }

    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  },

  countByLevel(): Record<ConsoleLevel, number> {
    const counts: Record<ConsoleLevel, number> = {
      log: 0,
      warn: 0,
      error: 0,
      info: 0,
      debug: 0,
    };
    records.forEach((r) => {
      counts[r.level] = (counts[r.level] || 0) + 1;
    });
    return counts;
  },

  getErrorFrequency(minutes: number = 5): number {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return records.filter(
      (r) => r.level === "error" && new Date(r.ts).getTime() > cutoff,
    ).length;
  },

  clear() {
    records = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  exportJSON() {
    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `console-kayitlari-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  subscribe(fn: (entry: ConsoleRecord) => void): () => void {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },

  getSessionId: () => SESSION_ID,

  get total() {
    return records.length;
  },
};

records = loadRecords();
