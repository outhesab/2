import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '@/lib/logger';
import type { SpecRule, SpecCheckResult } from './types';

const ROOT = process.cwd();

export const performanceBudgetRules: SpecRule[] = [
  {
    id: 'INDEX_HTML_HAS_SPINNER',
    spec: 'PERFORMANS_BUTCESI',
    title: "index.html'de JS yüklenirken gösterilecek loading spinner olmalı",
    severity: 'info',
    check: (): SpecCheckResult => {
      try {
        const html = readFileSync(join(ROOT, 'index.html'), 'utf-8');
        const passed = html.includes('loading-spinner') || (html.includes('spinner') && html.includes('loading'));
        return { passed, violations: passed ? [] : [{ file: 'index.html', message: 'Loading spinner bulunamadı' }] };
      } catch {
        return { passed: false, violations: [{ file: 'index.html', message: 'Okunamadı' }] };
      }
    },
  },
  {
    id: 'COMPONENT_COUNT_CHECK',
    spec: 'PERFORMANS_BUTCESI',
    title: 'React.lazy() tüm sayfalarda kullanılmalı',
    severity: 'error',
    check: (): SpecCheckResult => {
      try {
        const app = readFileSync(join(ROOT, 'src/App.tsx'), 'utf-8');
        const lazyCount = (app.match(/lazy\(/g) || []).length;
        const passed = lazyCount >= 10;
        return {
          passed,
          violations: passed
            ? []
            : [{ file: 'src/App.tsx', message: `Sadece ${lazyCount} lazy() kullanımı — en az 10 olmalı` }],
        };
      } catch {
        return { passed: false, violations: [{ file: 'src/App.tsx', message: 'Okunamadı' }] };
      }
    },
  },
  {
    id: 'NO_CONSOLE_LOG_LEFTOVER',
    spec: 'PERFORMANS_BUTCESI',
    title: 'console.log bırakılmamalı (logger.ts kullanılmalı)',
    severity: 'info',
    check: (): SpecCheckResult => {
      const files: string[] = [];
      function walk(dir: string) {
        try {
          const entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
          for (const entry of entries) {
            const full = join(dir, entry.name);
            if (
              entry.isDirectory() &&
              !entry.name.startsWith('.') &&
              entry.name !== 'node_modules' &&
              entry.name !== 'dist'
            )
              walk(full);
            else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) files.push(full);
          }
        } catch {
          /* skip */
        }
      }
      walk('src');
      const violations: SpecCheckResult['violations'] = [];
      const skipFiles = ['main.tsx', 'logger.ts', 'vite-env.d.ts', 'consoleRecorder.ts'];
      for (const file of files) {
        if (skipFiles.some((s) => file.endsWith(s))) continue;
        try {
          const content = readFileSync(join(ROOT, file), 'utf-8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed.startsWith('console.log') || trimmed.startsWith('console.error(')) {
              violations.push({ file, line: i + 1, message: `console.log/error bırakılmış` });
            }
          }
        } catch {
          logger.warn('perf', 'Dosya okunamadı');
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
];
