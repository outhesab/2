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
    logger.warn('component', 'Klasör taranırken hata oluştu');
    /* skip */
  }
  return results;
}

export const componentRules: SpecRule[] = [
  {
    id: "NO_RELATIVE_IMPORT",
    spec: "BILESEN_MIMARISI",
    title: "Hiçbir dosyada relative import (../) kullanılmamalı",
    severity: "error",
    check: (): SpecCheckResult => {
      const files = listFiles("src", ".tsx").concat(listFiles("src", ".ts"));
      const violations: SpecCheckResult["violations"] = [];
      for (const file of files) {
        if (file.includes("__tests__") || file.includes("node_modules") || file.includes("voice-sales") || file.endsWith(".test.ts")) continue;
        try {
          const content = readFileSync(join(ROOT, file), "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/(?:^import|require|import\s*\()\s*.*['"]\.\.\//)) {
              violations.push({ file, line: i + 1, message: `Relative import: ${lines[i].trim()}` });
            }
          }
        } catch {
          logger.warn('component', 'Relative import kontrolü sırasında dosya okunamadı');
          /* skip */
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: "NO_STATIC_INLINE_STYLE",
    spec: "BILESEN_MIMARISI",
    title: "Statik stiller inline style ile değil className ile yazılmalı",
    severity: "info",
    check: (): SpecCheckResult => {
      const files = listFiles("src/pages", ".tsx");
      const violations: SpecCheckResult["violations"] = [];
      for (const file of files) {
        try {
          const content = readFileSync(join(ROOT, file), "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(/style=\{\{[^}]{10,}\}\}/);
            if (m && !lines[i].includes("--") && !lines[i].includes("width") && !lines[i].includes("pct") && !lines[i].includes("percent") && !lines[i].includes("background") && !lines[i].includes("transform") && !lines[i].includes("animation") && !lines[i].includes("opacity")) {
              violations.push({ file, line: i + 1, message: `Statik inline style: ${m[0].slice(0, 60)}` });
            }
          }
        } catch {
          logger.warn('component', 'Inline style kontrolü sırasında dosya okunamadı');
          /* skip */
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: "EMPTY_COMPONENT_IMPORTED",
    spec: "BILESEN_MIMARISI",
    title: "Pages altında Empty component import edilmiş olmalı",
    severity: "info",
    check: (): SpecCheckResult => {
      const files = listFiles("src/pages", ".tsx");
      const skip = ["Settings.tsx", "Dashboard.tsx", "DashboardFinans.tsx", "Perf.tsx", "not-found.tsx"];
      const violations: SpecCheckResult["violations"] = [];
      for (const file of files) {
        const name = file.split(/[/\\]/).pop() || "";
        if (skip.includes(name)) continue;
        try {
          const content = readFileSync(join(ROOT, file), "utf-8");
          if (!content.includes("from '@/components/ui/empty'") && !content.includes("<Empty")) {
            violations.push({ file, message: "Empty component import edilmemiş — boş liste durumu yönetilmiyor olabilir" });
          }
        } catch {
          logger.warn('component', 'Empty import kontrolü sırasında dosya okunamadı');
          /* skip */
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: "SHADCN_UNTOUCHED",
    spec: "BILESEN_MIMARISI",
    title: "shadcn/ui dosyaları değiştirilmemiş olmalı",
    severity: "error",
    check: (): SpecCheckResult => {
      const files = listFiles("src/components/ui", ".tsx");
      const violations: SpecCheckResult["violations"] = [];
      const knownLarge = ["sidebar.tsx", "chart.tsx", "carousel.tsx", "calendar.tsx", "dropdown-menu.tsx", "menubar.tsx", "field.tsx", "alert-dialog.tsx", "breadcrumb.tsx", "command.tsx", "select.tsx", "sheet.tsx", "table.tsx", "context-menu.tsx", "dialog.tsx", "drawer.tsx", "empty.tsx", "form.tsx", "input-group.tsx", "item.tsx", "navigation-menu.tsx", "pagination.tsx"];
      for (const file of files) {
        try {
          const content = readFileSync(join(ROOT, file), "utf-8");
          const lines = content.split("\n").length;
          const size = Buffer.byteLength(content, "utf-8");
          const name = file.split(/[/\\]/).pop() || "";
          if (name.endsWith("index.tsx") || knownLarge.includes(name)) continue;
          if (lines > 100 || size > 4000) {
            violations.push({ file, message: `${lines} satır / ${size} bytes — değiştirilmiş olabilir` });
          }
        } catch {
          logger.warn('component', 'shadcn dosya kontrolü sırasında hata oluştu');
          /* skip */
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
];
