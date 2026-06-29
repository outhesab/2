import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '@/lib/logger';
import type { SpecRule, SpecCheckResult } from './types';

const ROOT = process.cwd();

function listPages(dir: string, results: string[] = []): string[] {
  try {
    const entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') listPages(full, results);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        results.push(full);
      }
    }
  } catch {
    /* skip */
  }
  return results;
}

export const componentCoverageRules: SpecRule[] = [
  {
    id: 'PAGE_COMPONENT_SIZE_LIMIT',
    spec: 'BILESEN_KAPSAM',
    title: 'Sayfa bileşenleri 800 satırı geçmemeli',
    severity: 'info',
    check: (): SpecCheckResult => {
      const files = listPages('src/pages');
      const violations: SpecCheckResult['violations'] = [];
      for (const file of files) {
        try {
          const content = readFileSync(join(ROOT, file), 'utf-8');
          const lines = content.split('\n').length;
          if (lines > 800) {
            violations.push({ file, message: `${lines} satır — 800 sınırı aşıldı` });
          }
        } catch {
          logger.warn('coverage', 'Dosya okunamadı');
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: 'CUSTOM_COMPONENT_SIZE_LIMIT',
    spec: 'BILESEN_KAPSAM',
    title: 'Özel bileşenler 150 satırı geçmemeli',
    severity: 'info',
    check: (): SpecCheckResult => {
      const files = listPages('src/components').filter((f) => !f.includes('ui/'));
      const violations: SpecCheckResult['violations'] = [];
      for (const file of files) {
        try {
          const content = readFileSync(join(ROOT, file), 'utf-8');
          const lines = content.split('\n').length;
          if (lines > 150) {
            violations.push({ file, message: `${lines} satır — 150 sınırı aşıldı` });
          }
        } catch {
          logger.warn('coverage', 'Dosya okunamadı');
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: 'LOADING_STATE_REQUIRED',
    spec: 'BILESEN_KAPSAM',
    title: 'Sayfalarda loading state kontrolü var',
    severity: 'info',
    check: (): SpecCheckResult => {
      const files = listPages('src/pages');
      const violations: SpecCheckResult['violations'] = [];
      for (const file of files) {
        try {
          const content = readFileSync(join(ROOT, file), 'utf-8');
          const name = file.split(/[/\\]/).pop() || '';
          if (name.startsWith('Settings')) continue;
          if (!content.includes('loading') && !content.includes('Skeleton')) {
            violations.push({ file, message: 'Loading state kontrolü bulunamadı' });
          }
        } catch {
          logger.warn('coverage', 'Dosya okunamadı');
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
];
