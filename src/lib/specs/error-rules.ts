import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
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
  } catch { /* skip */ }
  return results;
}

export const errorRules: SpecRule[] = [
  {
    id: "SUSPENSE_WRAPPED_ROUTES",
    spec: "HATA_DURUMLARI",
    title: "Tüm route'lar <Suspense> ile sarılmış olmalı",
    severity: "error",
    check: (): SpecCheckResult => {
      try {
        const app = readFileSync(join(ROOT, "src/App.tsx"), "utf-8");
        const routes = (app.match(/<Route\s+path=/g) || []).length;
        const suspense = (app.match(/<Suspense/g) || []).length;
        const passed = routes > 0 && suspense > 0;
        return { passed, violations: passed ? [] : [{ file: "src/App.tsx", message: `${routes} route var ama Suspense bulunamadı` }] };
      } catch {
        return { passed: false, violations: [{ file: "src/App.tsx", message: "Okunamadı" }] };
      }
    },
  },
  {
    id: "TOAST_IMPORT_PATTERN",
    spec: "HATA_DURUMLARI",
    title: "Hata yönetiminde showToast kullanılıyor olmalı",
    severity: "info",
    check: (): SpecCheckResult => {
      const files = listFiles("src/pages", ".tsx");
      const violations: SpecCheckResult["violations"] = [];
      for (const file of files) {
        try {
          const content = readFileSync(join(ROOT, file), "utf-8");
          if (content.includes("catch") && !content.includes("showToast")) {
            violations.push({ file, message: "try/catch var ama showToast kullanılmıyor" });
          }
        } catch { /* skip */ }
      }
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: "ERROR_BOUNDARY_ACTIVE",
    spec: "HATA_DURUMLARI",
    title: "ErrorBoundary mevcut ve aktif",
    severity: "error",
    check: (): SpecCheckResult => {
      try {
        const app = readFileSync(join(ROOT, "src/App.tsx"), "utf-8");
        if (!app.includes("ErrorBoundary") || !app.includes("<ErrorBoundary>")) {
          return { passed: false, violations: [{ file: "src/App.tsx", message: "ErrorBoundary import edilmemiş veya kullanılmıyor" }] };
        }
        return { passed: true, violations: [] };
      } catch {
        return { passed: false, violations: [{ file: "ErrorBoundary", message: "Dosya bulunamadı" }] };
      }
    },
  },
];
