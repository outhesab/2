/**
 * GitHub Workflow Cleanup — Bugfix Tests
 *
 * Property 1 (Preservation): quality-gate.yml'de dev push trigger'ı
 *   korunmalı ve main push trigger'ı bulunmamalı.
 *
 * Property 2 (Pipeline): CI pipeline adımları (lint, typecheck, test, build)
 *   eksiksiz olmalı.
 *
 * NOT: block-new-branch.yml workflow'u kaldırıldı (10.06.2026).
 * NOT: deploy.yml kaldırıldı — ilgili testler çıkarıldı.
 *
 * @vitest-environment node
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const WORKFLOWS_DIR = path.resolve(__dirname, '../../.github/workflows');

function readWorkflow(name: string): string {
  return fs.readFileSync(path.join(WORKFLOWS_DIR, name), 'utf-8').replace(/\r\n/g, '\n');
}

// ─── Yardımcı parse fonksiyonları ────────────────────────────────────────────

/**
 * YAML içindeki `on.push.branches` listesini döner.
 * Hem liste (`- dev`) hem inline (`[dev]`) formatını destekler.
 */
function extractPushBranches(yaml: string): string[] {
  const lines = yaml.split('\n');
  let inPush = false;
  let inBranches = false;
  const result: string[] = [];

  for (const line of lines) {
    // push: satırı
    if (/^\s+push:\s*$/.test(line)) {
      inPush = true;
      inBranches = false;
      continue;
    }
    // branches: [dev] veya branches: [dev, main] inline format
    if (inPush && /^\s+branches:\s*\[(.+)\]/.test(line)) {
      const match = line.match(/^\s+branches:\s*\[(.+)\]/);
      if (match) {
        result.push(...match[1].split(',').map((s) => s.trim().replace(/["']/g, '')));
      }
      inPush = false;
      continue;
    }
    // branches: (çok satırlı liste başlangıcı)
    if (inPush && /^\s+branches:\s*$/.test(line)) {
      inBranches = true;
      continue;
    }
    //   - dev (liste elemanı)
    if (inBranches && /^\s+-\s+/.test(line)) {
      result.push(
        line
          .replace(/^\s+-\s+/, '')
          .replace(/["']/g, '')
          .trim(),
      );
      continue;
    }
    // branches bloğu bitti
    if (inBranches && /^\s+\w/.test(line) && !/^\s+-/.test(line)) break;
  }

  return result;
}

function hasPullRequestTrigger(yaml: string): boolean {
  return /^\s*pull_request:/m.test(yaml);
}

function containsText(yaml: string, text: string): boolean {
  return yaml.includes(text);
}

// ─── Property 1: Push Trigger ────────────────────────────────────────────────

describe('quality-gate.yml push trigger', () => {
  it("push.branches listesinde 'main' OLMAMALI", () => {
    const yaml = readWorkflow('quality-gate.yml');
    const branches = extractPushBranches(yaml);
    expect(branches).not.toContain('main');
  });

  it("push.branches listesinde 'dev' bulunmalı", () => {
    const yaml = readWorkflow('quality-gate.yml');
    const branches = extractPushBranches(yaml);
    expect(branches).toContain('dev');
  });

  it("push.branches yalnızca ['dev'] olmalı", () => {
    const yaml = readWorkflow('quality-gate.yml');
    const branches = extractPushBranches(yaml);
    expect(branches).toEqual(['dev']);
  });
});

// ─── Property 2: PR Trigger (pull_request korunuyor — PR kalite kontrolü) ────

describe('quality-gate.yml pull_request trigger', () => {
  it('pull_request trigger mevcut olmalı (PR kalite kontrolü için gerekli)', () => {
    const yaml = readWorkflow('quality-gate.yml');
    expect(hasPullRequestTrigger(yaml)).toBe(true);
  });
});

// ─── Property 3: CI Pipeline Adımları ────────────────────────────────────────

describe('quality-gate.yml CI pipeline adımları eksiksiz olmalı', () => {
  it('lint adımını içermeli', () => {
    const yaml = readWorkflow('quality-gate.yml');
    expect(containsText(yaml, 'pnpm run lint')).toBe(true);
  });

  it('typecheck adımını içermeli', () => {
    const yaml = readWorkflow('quality-gate.yml');
    expect(containsText(yaml, 'typecheck')).toBe(true);
  });

  it('test:run adımını içermeli', () => {
    const yaml = readWorkflow('quality-gate.yml');
    expect(containsText(yaml, 'test:run')).toBe(true);
  });

  it('build adımını içermeli', () => {
    const yaml = readWorkflow('quality-gate.yml');
    expect(containsText(yaml, 'pnpm run build')).toBe(true);
  });

  it('frozen-lockfile ile install yapılmalı', () => {
    const yaml = readWorkflow('quality-gate.yml');
    expect(containsText(yaml, '--frozen-lockfile')).toBe(true);
  });
});
