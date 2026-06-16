import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { logger } from '@/lib/logger';
import type { SpecRule, SpecCheckResult } from "./types";

const ROOT = process.cwd();

function listFiles(dir: string, ext: string, results: string[] = []): string[] {
  try {
    const entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") listFiles(full, ext, results);
      } else if (entry.name.endsWith(ext)) {
        results.push(full);
      }
    }
  } catch {
    logger.warn('a11y', 'Klasör taranırken hata');
  }
  return results;
}

export const accessibilityRules: SpecRule[] = [
  {
    id: "STRICT_MODE_ACTIVE",
    spec: "ERISILEBILIRLIK",
    title: "React StrictMode aktif olmalı",
    severity: "error",
    check: (): SpecCheckResult => {
      try {
        const main = readFileSync(join(ROOT, "src/main.tsx"), "utf-8");
        const passed = main.includes("StrictMode");
        return { passed, violations: passed ? [] : [{ file: "src/main.tsx", message: "StrictMode bulunamadı" }] };
      } catch {
        return { passed: false, violations: [{ file: "src/main.tsx", message: "Okunamadı" }] };
      }
    },
  },
  {
    id: "ERROR_BOUNDARY_IN_MAIN",
    spec: "ERISILEBILIRLIK",
    title: "ErrorBoundary main.tsx'te aktif",
    severity: "error",
    check: (): SpecCheckResult => {
      try {
        const main = readFileSync(join(ROOT, "src/main.tsx"), "utf-8");
        const passed = main.includes("ErrorBoundary");
        return { passed, violations: passed ? [] : [{ file: "src/main.tsx", message: "ErrorBoundary bulunamadı" }] };
      } catch {
        return { passed: false, violations: [{ file: "src/main.tsx", message: "Okunamadı" }] };
      }
    },
  },
  {
    id: "ICON_BUTTON_ARIA_LABEL",
    spec: "ERISILEBILIRLIK",
    title: "Icon-only button'larda aria-label bulunmalı",
    severity: "info",
    check: (): SpecCheckResult => {
      const files = listFiles("src/pages", ".tsx").concat(listFiles("src/components", ".tsx"));
      const violations: SpecCheckResult["violations"] = [];
      for (const file of files) {
        if (file.includes("ui/")) continue;
        try {
          const content = readFileSync(join(ROOT, file), "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('size="icon"') && !lines[i].includes("aria-label")) {
              violations.push({ file, line: i + 1, message: `size="icon" butonunda aria-label eksik` });
            }
          }
        } catch {
          logger.warn('a11y', 'Dosya okunamadı');
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
];
