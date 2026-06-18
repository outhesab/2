#!/usr/bin/env node
/**
 * Pre-commit Drift Check Wrapper
 *
 * Pre-commit hook tarafından çağrılır.
 * 1. AGENTS.md ↔ CLAUDE.md/.cursor/rules/rules.mdc drift kontrolü
 * 2. state-registry.json ↔ package.json versiyon drift kontrolü
 * Drift varsa commit'i engeller.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
let hasError = false;

/* ── Check 1: Agent drift ────────────────────────────────────────── */

const agentResult = spawnSync('node', ['scripts/sync-agent-files.mjs', '--check'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: false,
});

if (agentResult.status !== 0) {
  hasError = true;
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
}

/* ── Check 2: Registry drift ─────────────────────────────────────── */

try {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const registry = JSON.parse(readFileSync(join(ROOT, 'state-registry.json'), 'utf8'));

  if (pkg.version !== registry.version) {
    hasError = true;
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ STATE REGISTRY DRIFT — COMMIT ENGELLENDİ               ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error(`  package.json:      ${pkg.version}`);
    console.error(`  state-registry.json: ${registry.version}`);
    console.error('');
    console.error('  Güncellemek için:');
    console.error('');
    console.error('    pnpm run registry');
    console.error('');
    console.error('  Sonra tekrar: git commit');
  }
} catch {
  // registry dosyası yok veya bozuk — uyar ama engelleme
  console.error('⚠️  state-registry.json okunamadı, atlanıyor.');
}

if (hasError) process.exit(1);

process.exit(0);
