import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '@/lib/logger';
import type { SpecRule, SpecCheckResult } from './types';

const ROOT = process.cwd();

const SYSTEM_FILES = [
  'useDB.ts',
  'useUIPrefs.ts',
  'appConfig.ts',
  'connConfig.ts',
  'logger.ts',
  'consoleRecorder.ts',
  'firebase.ts',
  'tabs.ts',
  'version.ts',
  'specs',
  'ErrorBoundary.tsx',
  'SetupWizard.tsx',
  'QuantumLink.tsx',
  'ReportButton.tsx',
  'useDraggableButton.ts',
  'agentConfig.ts',
  'healthCheck.ts',
  'userManager.ts',
  'db/core.ts',
  'Settings.tsx',
];

function walkFiles(dir: string, ext: string, results: string[] = []): string[] {
  try {
    const entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') walkFiles(full, ext, results);
      } else if (entry.name.endsWith(ext)) {
        results.push(full);
      }
    }
  } catch {
    logger.warn('data', 'Klasör taranırken hata oluştu');
    /* skip */
  }
  return results;
}

export const dataRules: SpecRule[] = [
  {
    id: 'NO_DIRECT_DB_WRITE',
    spec: 'VERI_KATMANI',
    title: "doğrudan sobaYonetim DB key'ine yazmak yasak — save() kullanılmalı",
    severity: 'error',
    check: (): SpecCheckResult => {
      const files = walkFiles('src', '.tsx').concat(walkFiles('src', '.ts'));
      const violations: SpecCheckResult['violations'] = [];
      for (const file of files) {
        if (SYSTEM_FILES.some((a) => file.includes(a))) continue;
        try {
          const content = readFileSync(join(ROOT, file), 'utf-8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (
              lines[i].includes('localStorage.setItem("sobaYonetim"') ||
              lines[i].includes("localStorage.setItem('sobaYonetim'")
            ) {
              violations.push({ file, line: i + 1, message: 'save() kullanılmalı, doğrudan DB yazımı yasak' });
            }
          }
        } catch {
          logger.warn('data', 'DB yazma kontrolü sırasında dosya okunamadı');
          /* skip */
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: 'NO_DB_JSON_PARSE_IN_PAGES',
    spec: 'VERI_KATMANI',
    title: 'Sayfalarda doğrudan sobaYonetim JSON parse etmek yasak',
    severity: 'error',
    check: (): SpecCheckResult => {
      const files = walkFiles('src/pages', '.tsx');
      const allowed = ['Settings.tsx', 'Dashboard.tsx', 'DashboardOperasyon.tsx'];
      const violations: SpecCheckResult['violations'] = [];
      for (const file of files) {
        const name = file.split(/[/\\]/).pop() || '';
        if (allowed.includes(name)) continue;
        try {
          const content = readFileSync(join(ROOT, file), 'utf-8');
          if (content.includes('getItem("sobaYonetim"') || content.includes("getItem('sobaYonetim'")) {
            violations.push({ file, message: 'Sayfada doğrudan DB localStorage erişimi — useDB() kullanılmalı' });
          }
        } catch {
          logger.warn('data', 'DB parse kontrolü sırasında dosya okunamadı');
          /* skip */
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
];
