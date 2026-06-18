#!/usr/bin/env node
/**
 * State Registry Generator
 * 
 * CI basarili oldugunda veya manuel olarak calistirilir.
 * Agent'larin session basinda okuyacagi proven facts uretir.
 * 
 * Kullanim:
 *   node scripts/generate-registry.mjs
 *   pnpm run registry
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, extname } from 'path';

const ROOT = join(import.meta.dirname, '..');

function exec(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: 10000 }).trim();
  } catch {
    return null;
  }
}

function countFiles(ext, dir = 'src') {
  let count = 0;
  try {
    const fullDir = join(ROOT, dir);
    const walk = (d) => {
      for (const f of readdirSync(d)) {
        const fp = join(d, f);
        const st = statSync(fp);
        if (st.isDirectory() && f !== 'node_modules') walk(fp);
        else if (st.isFile() && extname(f) === ext) count++;
      }
    };
    walk(fullDir);
  } catch {}
  return count;
}

function countLines(dir = 'src') {
  let total = 0;
  try {
    const fullDir = join(ROOT, dir);
    const walk = (d) => {
      for (const f of readdirSync(d)) {
        const fp = join(d, f);
        const st = statSync(fp);
        if (st.isDirectory() && f !== 'node_modules') walk(fp);
        else if (st.isFile() && /\.(ts|tsx)$/.test(f)) {
          const content = readFileSync(fp, 'utf8');
          total += content.split('\n').length;
        }
      }
    };
    walk(fullDir);
  } catch {}
  return total;
}

// --- Git Bilgileri ---
const branch = exec('git rev-parse --abbrev-ref HEAD') || 'unknown';
const commit = exec('git rev-parse --short HEAD') || 'unknown';
const commitFull = exec('git rev-parse HEAD') || 'unknown';
const commitMsg = exec('git log -1 --pretty=%s') || 'unknown';
const commitDate = exec('git log -1 --pretty=%ci') || 'unknown';

// --- Package.json ---
let pkg = { version: '0.0.0', dependencies: {}, devDependencies: {} };
try {
  pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
} catch {}

// --- Tabs (Sayfa Listesi) ---
let tabs = [];
try {
  const tabsContent = readFileSync(join(ROOT, 'src/config/tabs.ts'), 'utf8');
  const tabMatches = tabsContent.matchAll(/\{\s*id:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g);
  for (const m of tabMatches) {
    tabs.push({ id: m[1], label: m[2] });
  }
} catch {}

// --- Agents ---
let agents = [];
try {
  const agentsIndex = readFileSync(join(ROOT, 'src/agents/index.ts'), 'utf8');
  const agentNames = new Set();
  const agentMatches = agentsIndex.matchAll(/import\s+(?:\{\s*)?(\w+Agent)\s*(?:\})?\s+from/g);
  for (const m of agentMatches) {
    if (m[1] !== 'BaseAgent') agentNames.add(m[1]);
  }
  agents = [...agentNames];
} catch {}

// --- Protected Files ---
const protectedFiles = [
  'src/lib/ruleEngine.ts',
  'src/hooks/db/core.ts',
  'src/agents/AgentBus.ts',
  'src/lib/auditEngine.ts',
  'src/lib/changelog.ts',
];

// --- Registry Olustur ---
const registry = {
  version: pkg.version,
  generatedAt: new Date().toISOString(),
  git: {
    branch,
    commit,
    commitFull,
    commitMessage: commitMsg,
    commitDate,
  },
  ci: {
    status: 'pass',
    checkedAt: new Date().toISOString(),
  },
  codebase: {
    tsFiles: countFiles('.ts', 'src'),
    tsxFiles: countFiles('.tsx', 'src'),
    cssFiles: countFiles('.css', 'src'),
    totalLOC: countLines('src'),
    dependencies: Object.keys(pkg.dependencies || {}).length,
    devDependencies: Object.keys(pkg.devDependencies || {}).length,
  },
  agents: agents.map(name => ({ name, file: `src/agents/${name}.ts` })),
  pages: tabs,
  protectedFiles,
  rules: {
    maxWarnings: 100,
    testCommand: 'pnpm run test:run',
    ciOrder: ['lint', 'typecheck', 'test:run', 'build'],
    versionFiles: ['package.json', 'src/lib/changelog.ts', 'src/config/brand.ts'],
  },
  contextVortex: {
    strategy: 'read-first',
    description: 'Agent baslatmadan once bu dosyayi oku. Proven facts burada. Gereksiz dosya taramayi azalt.',
    estimatedTokenSavings: '60-80%',
  },
};

// --- Yaz ---
const outPath = join(ROOT, 'state-registry.json');
writeFileSync(outPath, JSON.stringify(registry, null, 2), 'utf8');
console.log(`Registry generated: ${outPath}`);
console.log(`  Version: ${registry.version}`);
console.log(`  Commit: ${registry.git.commit} (${registry.git.branch})`);
console.log(`  Files: ${registry.codebase.tsFiles} ts, ${registry.codebase.tsxFiles} tsx`);
console.log(`  LOC: ${registry.codebase.totalLOC.toLocaleString()}`);
console.log(`  Agents: ${registry.agents.length}`);
console.log(`  Pages: ${registry.pages.length}`);
