#!/usr/bin/env node
/**
 * Pre-commit Drift Check Wrapper
 *
 * Pre-commit hook tarafından çağrılır.
 * AGENTS.md ile CLAUDE.md/.cursor/rules/rules.mdc arasındaki drift'i kontrol eder.
 * Drift varsa commit'i engeller.
 */

import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const result = spawnSync('node', ['scripts/sync-agent-files.mjs', '--check'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: false,
});

if (result.status !== 0) {
  console.error('');
  console.error('╔════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ AGENT DOSYALARI DRIFT — COMMIT ENGELLENDİ              ║');
  console.error('╚════════════════════════════════════════════════════════════╝');
  console.error('');
  console.error('AGENTS.md değiştirilmiş ama CLAUDE.md / .cursor/rules/rules.mdc');
  console.error('güncellenmemiş. Senkron için şunu çalıştır:');
  console.error('');
  console.error('  pnpm run sync:agents');
  console.error('');
  console.error('Sonra tekrar: git commit');
  process.exit(1);
}

process.exit(0);
