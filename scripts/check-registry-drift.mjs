#!/usr/bin/env node
/**
 * Pre-commit Registry Drift Check
 *
 * state-registry.json ↔ package.json versiyon drift kontrolü.
 * Drift varsa commit'i engeller.
 *
 * NOT: Agent sync (CLAUDE.md / .cursor) kaldırıldı — ortam sadece OpenCode + CLI.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
let hasError = false;

/* ── Check: Registry drift ─────────────────────────────────────── */

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
    console.error(`  package.json:        ${pkg.version}`);
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
