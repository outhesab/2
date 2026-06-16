import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '@/lib/logger';
import type { SpecRule, SpecCheckResult } from './types';

const ROOT = process.cwd();

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export const navigationRules: SpecRule[] = [
  {
    id: 'ALL_ROUTES_LAZY',
    spec: 'NAVIGASYON',
    title: "Tüm page import'ları React.lazy() ile sarılmış olmalı",
    severity: 'error',
    check: (): SpecCheckResult => {
      try {
        const app = readFileSync(join(ROOT, 'src/App.tsx'), 'utf-8');
        const lines = app.split('\n');
        const violations: SpecCheckResult['violations'] = [];
        for (let i = 0; i < lines.length; i++) {
          const m = lines[i].match(/import\s+\{?\s*(\w+)\s*\}?\s+from\s+['"]@\/pages\/(\w+)/);
          if (m && !app.includes(`const ${m[1]} = lazy`)) {
            violations.push({ file: 'src/App.tsx', line: i + 1, message: `"${m[1]}" lazy() ile sarılmamış` });
          }
        }
        return { passed: violations.length === 0, violations };
      } catch {
        logger.warn('navigation', 'App.tsx okunurken hata oluştu');
        return { passed: false, violations: [{ file: 'src/App.tsx', message: 'Okunamadı' }] };
      }
    },
  },
  {
    id: 'TAB_ROUTE_MATCH',
    spec: 'NAVIGASYON',
    title: "Her tab için App.tsx'de eşleşen Route path'i olmalı",
    severity: 'error',
    check: (): SpecCheckResult => {
      try {
        const tabs = readFileSync(join(ROOT, 'src/config/tabs.ts'), 'utf-8');
        const app = readFileSync(join(ROOT, 'src/App.tsx'), 'utf-8');
        const tabIds: string[] = [];
        const tabMatches = tabs.matchAll(/id:\s*["'](\w+-?\w+)["']/g);
        for (const m of tabMatches) tabIds.push(m[1]);

        const routePaths = new Set<string>();
        const routeMatches = app.matchAll(/Route\s+path=["']\/([\w-]+)["']/g);
        for (const m of routeMatches) routePaths.add(m[1]);

        const lazyImports = new Set<string>();
        const importMatches = app.matchAll(/import\(['"]@\/pages\/(\w+)['"]\)/g);
        for (const m of importMatches) lazyImports.add(m[1].toLowerCase());

        const violations: SpecCheckResult['violations'] = [];
        for (const id of tabIds) {
          const kebabId = camelToKebab(id);
          const idLower = id.toLowerCase();
          if (!routePaths.has(id) && !routePaths.has(kebabId) && !routePaths.has(id.replace(/-/g, '')) && !lazyImports.has(idLower)) {
            violations.push({ file: 'src/App.tsx', message: `"${id}" tab'i için eşleşen Route path'i bulunamadı` });
          }
        }
        return { passed: violations.length === 0, violations };
      } catch {
        logger.warn('navigation', 'tabs.ts veya App.tsx okunurken hata oluştu');
        return { passed: false, violations: [{ file: 'src/App.tsx', message: 'Okunamadı' }] };
      }
    },
  },
];
