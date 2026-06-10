import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { logger } from '@/lib/logger';
import type { SpecRule, SpecCheckResult } from './types';

const ROOT = process.cwd();

// Tam dosya adı eşleşmesi için Set — false positive'i önler
const SYSTEM_FILENAMES = new Set([
  'useDB.ts',
  'useUIPrefs.ts',
  'appConfig.ts',
  'connConfig.ts',
  'logger.ts',
  'consoleRecorder.ts',
  'firebase.ts',
  'tabs.ts',
  'version.ts',
  'ErrorBoundary.tsx',
  'SetupWizard.tsx',
  'QuantumLink.tsx',
  'ReportButton.tsx',
  'useDraggableButton.ts',
  'agentConfig.ts',
  'healthCheck.ts',
  'userManager.ts',
  'Settings.tsx',
  'SettingsKategoriYonetim.tsx',
  'SettingsAboutPanel.tsx',
  'SettingsAgentPanel.tsx',
  'SettingsBackup.tsx',
  'SettingsRepair.tsx',
]);

// Dizin bazlı hariç tutmalar (yol sonu eşleşmesi)
const SYSTEM_DIRS = ['specs', 'db/core.ts'];

function isSystemFile(filePath: string): boolean {
  const name = basename(filePath);
  if (SYSTEM_FILENAMES.has(name)) return true;
  return SYSTEM_DIRS.some((dir) => filePath.includes(dir));
}

function walkFiles(dir: string, exts: string[], results: string[] = []): string[] {
  try {
    const entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') walkFiles(full, exts, results);
      } else if (exts.some((ext) => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  } catch (e) {
    logger.warn('data', 'Klasör taranırken hata oluştu', { dir, error: String(e) });
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
      const files = walkFiles('src', ['.tsx', '.ts']);
      const violations: SpecCheckResult['violations'] = [];
      for (const file of files) {
        if (isSystemFile(file)) continue;
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
        } catch (e) {
          logger.warn('data', 'DB yazma kontrolü sırasında dosya okunamadı', { file, error: String(e) });
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
      const files = walkFiles('src/pages', ['.tsx']);
      const allowed = [
        'Settings.tsx',
        'Dashboard.tsx',
        'DashboardOperasyon.tsx',
        'SettingsKategoriYonetim.tsx',
        'SettingsAboutPanel.tsx',
        'SettingsAgentPanel.tsx',
        'SettingsBackup.tsx',
        'SettingsRepair.tsx',
      ];
      const violations: SpecCheckResult['violations'] = [];
      for (const file of files) {
        const name = file.split(/[/\\]/).pop() || '';
        if (allowed.includes(name)) continue;
        try {
          const content = readFileSync(join(ROOT, file), 'utf-8');
          if (content.includes('getItem("sobaYonetim"') || content.includes("getItem('sobaYonetim'")) {
            violations.push({ file, message: 'Sayfada doğrudan DB localStorage erişimi — useDB() kullanılmalı' });
          }
        } catch (e) {
          logger.warn('data', 'DB parse kontrolü sırasında dosya okunamadı', { file, error: String(e) });
          /* skip */
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
];
