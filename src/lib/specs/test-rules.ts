import { existsSync } from 'node:fs';
import type { SpecRule, SpecCheckResult } from './types';

export const testRules: SpecRule[] = [
  {
    id: 'VERSION_CONSISTENCY_TEST_EXISTS',
    spec: 'TEST_STRATEJISI',
    title: 'Cross-file consistency testi mevcut olmalı',
    severity: 'error',
    check: (): SpecCheckResult => {
      const path = 'src/__tests__/version-consistency.test.ts';
      const exists = existsSync(path);
      return {
        passed: exists,
        violations: exists ? [] : [{ file: path, message: 'Cross-file consistency testi bulunamadı' }],
      };
    },
  },
];
