import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SpecRule, SpecCheckResult } from "./types";

const ROOT = process.cwd();

export const dataRules: SpecRule[] = [
  {
    id: "NO_DIRECT_LOCALSTORAGE_WRITE",
    spec: "VERI_KATMANI",
    title: "save() dışında localStorage.setItem kullanımı yasak",
    severity: "error",
    check: (): SpecCheckResult => {
      const allowed = ["useDB.ts", "useUIPrefs.ts", "appConfig.ts", "connConfig.ts", "logger.ts", "consoleRecorder.ts", "firebase.ts", "tabs.ts", "version.ts", "specs"];
      const violations: SpecCheckResult["violations"] = [];

      function walk(dir: string) {
        try {
          const entries = require("node:fs").readdirSync(join(ROOT, dir), { withFileTypes: true });
          for (const entry of entries) {
            const full = join(dir, entry.name);
            if (entry.isDirectory()) {
              if (!entry.name.startsWith(".") && entry.name !== "node_modules") walk(full);
            } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
              if (allowed.some((a) => full.includes(a))) continue;
              try {
                const content = require("node:fs").readFileSync(join(ROOT, full), "utf-8");
                const lines = content.split("\n");
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].includes("localStorage.setItem") && !lines[i].includes("sobaYonetim_favoriteTabs")) {
                    violations.push({ file: full, line: i + 1, message: "Doğrudan localStorage.setItem — save() kullanılmalı" });
                  }
                }
              } catch { /* skip */ }
            }
          }
        } catch { /* skip */ }
      }

      walk("src");
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: "NO_LOCALSTORAGE_IN_PAGES",
    spec: "VERI_KATMANI",
    title: "Sayfalarda doğrudan localStorage erişimi yasak",
    severity: "error",
    check: (): SpecCheckResult => {
      const violations: SpecCheckResult["violations"] = [];

      function walk(dir: string) {
        try {
          const entries = require("node:fs").readdirSync(join(ROOT, dir), { withFileTypes: true });
          for (const entry of entries) {
            const full = join(dir, entry.name);
            if (entry.isDirectory()) {
              if (!entry.name.startsWith(".")) walk(full);
            } else if (entry.name.endsWith(".tsx")) {
              try {
                const content = require("node:fs").readFileSync(join(ROOT, full), "utf-8");
                if (content.includes("localStorage.getItem") || content.includes("localStorage.setItem")) {
                  violations.push({ file: full, message: "Sayfada doğrudan localStorage erişimi — useDB() kullanılmalı" });
                }
              } catch { /* skip */ }
            }
          }
        } catch { /* skip */ }
      }

      walk("src/pages");
      return { passed: violations.length === 0, violations };
    },
  },
];
